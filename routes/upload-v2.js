import multer from "multer"
import path from "path"
import fs from "fs/promises"
import sizeOf from "image-size"
import crypto, { verify } from "crypto"
import { updateSlimUsernameStatus } from "../src/skin-providers/is-slim.js"
import busboy from 'busboy'

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY

async function verifyTurnstileToken(token, remoteIp) {
  const formData = new URLSearchParams()
  formData.append("secret", TURNSTILE_SECRET_KEY)
  formData.append("response", token)
  if (remoteIp) formData.append("remoteip", remoteIp)

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    }
  )

  const outcome = await response.json()
  return outcome
}

export async function handleAvatarUpload(req, res) {
  const bb = busboy({
    headers: req.headers,
    limits: { fileSize: 64 * 1024, files: 1, fields: 6, fieldSize: 4096 },
  })

  let firstField = true
  let turnstileVerified = false
  let fileTooLarge = false
  let turnstileNotFirstField = false
  let notPNG = false

  let turnstileOutcomeError

  var fields = {}
  let fileBuffer

  bb.on('file', (name, stream, info) => {
    if (info.mimeType !== 'image/png') {
      stream.resume() // drain and discard
      notPNG = true
      return
    }
    const chunks = []

    stream.on('data', (chunk) => {
      if (chunks.length === 0) {
        // check magic bytes on first chunk
        const isPNG = chunk[0] === 0x89 &&
          chunk[1] === 0x50 &&
          chunk[2] === 0x4E &&
          chunk[3] === 0x47
        if (!isPNG) {
          notPNG = true
          stream.destroy()
          return
        }
      }
      chunks.push(chunk)
    })

    stream.on('limit', () => {
      fileTooLarge = true
      stream.resume()
      chunks.length = 0
    })

    stream.on('close', () => {
      if (fileTooLarge) return
      fileBuffer = Buffer.concat(chunks)
    })
  })

  bb.on('field', (name, val, info) => {
    console.log('field received:', name)
    if (firstField) {
      firstField = false
      if (name !== 'cf-turnstile-response') {
        turnstileNotFirstField = true
        return
      }
      req.unpipe(bb)
      req.pause()

      verifyTurnstileToken(val).then((outcome) => {
        console.log("now verifying with cloudflare...")
        if (!outcome.success) {
          turnstileOutcomeError = outcome["error-codes"]
          console.log(`failed! ${turnstileOutcomeError}`)
          return
        }
        console.log("success! now setting turnstileVerified flag and pipe")
        turnstileVerified = true
        req.resume()
        req.pipe(bb)
      })
    } else {
      fields[name] = val
    }
  })

  bb.on('close', () => {
    (async () => {
      try {
        // validate fields
        // check dimensions with sizeOf(fileBuffer)
        // save to disk with fs.writeFile
        if (turnstileNotFirstField) {
          res.status(403).json({
            error: "Captcha verification failed.",
            details: "Invalid response. 👀",
          })
          return
        }
        if (!turnstileVerified) {
          res.status(403).json({
            error: "Missing captcha token."
          })
          return
        }

        if (turnstileOutcomeError) {
          res.status(403).json({
            error: "Captcha verification failed.",
            details: turnstileOutcomeError,
          })
          return
        }

        if (fileTooLarge) {
          res.status(400).json({ error: "File too large!" })
          return
        }
        if (!fileBuffer) {
          res.status(400).json({ error: "No file uploaded. " })
          return
        }


        const { name, slim } = fields

        if (!name || typeof name !== "string") {
          res.status(400).json({ error: "Missing or invalid 'name' field." })
          return
        }


        if (name.length < 3 || name.length > 16) {
          res.status(400).json({
            error: `Name must be 3-16 characters (got ${name.length}).`,
          })
          return
        }

        if (!/^[a-zA-Z0-9_\- ]+$/.test(name)) {
          res.status(400).json({ error: "Name contains invalid characters." })
          return
        }

        const safeUsername = name.replace(/[^a-zA-Z0-9_\-]/g, "")
        const finalPath = path.join("uploads", `${safeUsername}.png`)


        const dimensions = sizeOf(fileBuffer)
        if (!(dimensions.width == 64 && dimensions.height == 64)) {
          res.status(400).json({
            error: `Dimension mismatch! Upload a 64x64 PNG file.`
          })
          return
        }
        await fs.writeFile(finalPath, fileBuffer)
        updateSlimUsernameStatus(safeUsername, slim == "on")
        res.status(200).json({
          message: "Skin uploaded successfully!",
          access_key: safeUsername,
        })
      } catch (err) {
        console.error(err.stack)
        res.status(500).json({ error: "Failed to process image." })
      }
    })()
  })
  req.pipe(bb)
}