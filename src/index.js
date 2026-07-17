import express from 'express'

import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import { getRenderCache, getTextureCache, refreshCache, setRenderCache, setTextureCache, getSteveCache, setSteveCache } from './cache.js'
import { initRenderer } from './browser.js'
import { renderBrowser } from './render.js'
import { enqueue } from './queue.js'
import { handleAvatarUpload, processAvatar } from "../routes/upload.js"
import { closeBrowser } from './browser.js';
import { javaSkinFetchHandler } from './skin-providers/java.js'
import { bedrockSkinFetchHandler } from './skin-providers/bedrock.js'
import { uploadSkinFetchHandler } from './skin-providers/upload.js'

const app = express()
app.use(express.json({ limit: '5mb' }))


app.get('/render', async (req, res) => {

  const { username, refresh } = req.query

  try {

    if (refresh == 'true') {
      await refreshCache(username)
    }

    var cachedRender = await getRenderCache(username)
    if (cachedRender) {
      return res.set({'Content-Type': 'image/png',
                      'X-Cache': 'HIT', 
                      'Cache-Control': 'public, max-age=3600'}).send(cachedRender)
    }

    var skinBuffer = await getTextureCache(username);
    var is_steve = await getSteveCache(username);
    console.log("Request made by", username)
    if (!skinBuffer) {
      if (username.startsWith(".")) ({ skin: skinBuffer, is_steve } = await bedrockSkinFetchHandler(username));
      else if (username.startsWith("+")) skinBuffer = await uploadSkinFetchHandler(username);
      else skinBuffer = await javaSkinFetchHandler(username);

      await setTextureCache(username, skinBuffer)
    }
    
    var freshRender = await enqueue(() => renderBrowser(skinBuffer))
    await setRenderCache(username, freshRender)
    return res.set({'Content-Type': 'image/png',
                'X-Cache': 'MISS', 
                'Cache-Control': 'public, max-age=3600'}).send(freshRender)
  } catch (err) {
    res.status(500).json({ error: err.stack })
  }
})


app.listen(10001, async () => {
  await initRenderer()
  console.log('Skin renderer ready on :10001')
})

app.post("/upload/:username", handleAvatarUpload, processAvatar);
app.use(express.static('public'));

async function shutdown(signal) {
  console.log(`[index] received ${signal}, shutting down...`);
  await closeBrowser();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

