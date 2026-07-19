import dotenv from 'dotenv/config'
import express from 'express'

import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import { getRenderCache, getTextureCache, refreshCache, setRenderCache, setTextureCache, getSlimCache, setSlimCache, getHeadCache, setHeadCache } from './cache.js'
import { initRenderer } from './browser.js'
import { renderBrowser } from './render.js'
import { enqueue } from './queue.js'
import { handleAvatarUpload, uploadGlobalLimiter, uploadPerIpLimiter } from "../routes/upload-v2.js"
import { closeBrowser } from './browser.js'
import { javaSkinFetchHandler } from './skin-providers/java.js'
import { bedrockSkinFetchHandler } from './skin-providers/bedrock.js'
import { uploadSkinFetchHandler } from './skin-providers/upload.js'
import { cropHead } from './head.js'

import sizeOf from 'image-size'
import { slowDown } from 'express-slow-down'
import rateLimit from 'express-rate-limit'

const app = express()
app.use(express.json({ limit: '5mb' }))

const renderSlowDown = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 20,
  delayMs: (hits) => Math.min((hits - 20) * 100, 2000)
})

const renderRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, slow down!' }
})

const headSlowDown = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 40,
  delayMs: (hits) => Math.min((hits - 40) * 100, 2000)
})

const headRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests, slow down!' }
})

app.get('/head', headSlowDown, headRateLimit, async (req, res) => {

  const { username, refresh } = req.query

  try {

    if (refresh == 'true') {
      await refreshCache(username)
    }

    var cachedHead = await getHeadCache(username)
    if (cachedHead) {
      return res.set({
        'Content-Type': 'image/png',
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=3600'
      }).send(cachedHead)
    }

    var skinBuffer = await getTextureCache(username)
    var is_slim = await getSlimCache(username)

    console.log("Head request made by", username)
    if (!skinBuffer) {
      if (username.startsWith(".")) ({ skin: skinBuffer, is_slim } = await bedrockSkinFetchHandler(username))
      else if (username.startsWith("+")) ({ skin: skinBuffer, is_slim } = await uploadSkinFetchHandler(username))
      else ({ skin: skinBuffer, is_slim } = await javaSkinFetchHandler(username))

      await setTextureCache(username, skinBuffer)

    }

    var freshHead = await enqueue(() => cropHead(skinBuffer))
    await setHeadCache(username, freshHead)
    return res.set({
      'Content-Type': 'image/png',
      'X-Cache': 'MISS',
      'Cache-Control': 'public, max-age=3600'
    }).send(freshHead)
  } catch (err) {
    res.status(500).json({ error: err.stack })
  }
})

app.get('/render', renderSlowDown, renderRateLimit, async (req, res) => {

  const { username, refresh } = req.query

  try {

    if (refresh == 'true') {
      await refreshCache(username)
    }

    var cachedRender = await getRenderCache(username)
    if (cachedRender) {
      return res.set({
        'Content-Type': 'image/png',
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=3600'
      }).send(cachedRender)
    }

    var skinBuffer = await getTextureCache(username)
    var is_slim = await getSlimCache(username)
    console.log("Request made by", username)
    if (!skinBuffer) {
      if (username.startsWith(".")) ({ skin: skinBuffer, is_slim } = await bedrockSkinFetchHandler(username))
      else if (username.startsWith("+")) ({ skin: skinBuffer, is_slim } = await uploadSkinFetchHandler(username))
      else ({ skin: skinBuffer, is_slim } = await javaSkinFetchHandler(username))

      await setTextureCache(username, skinBuffer)

    }

    var key = sizeOf(skinBuffer).height == 32 ? "legacy" : is_slim ? "slim" : "std"

    var freshRender = await enqueue(() => renderBrowser(skinBuffer, key))
    await setRenderCache(username, freshRender)
    return res.set({
      'Content-Type': 'image/png',
      'X-Cache': 'MISS',
      'Cache-Control': 'public, max-age=3600'
    }).send(freshRender)
  } catch (err) {
    res.status(500).json({ error: err.stack })
  }
})


app.listen(10001, async () => {
  await initRenderer()
  console.log('Skin renderer ready on :10001')
})

app.post('/upload', uploadPerIpLimiter, uploadGlobalLimiter, handleAvatarUpload)

const staticLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 60,
  message: { error: 'Too many requests.' }
})


app.use(staticLimiter, express.static('public'))
app.set('trust proxy', 1)

app.get("/upload", staticLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"))
})

async function shutdown(signal) {
  console.log(`[index] received ${signal}, shutting down...`)
  await closeBrowser()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

