import puppeteer from 'puppeteer'
import path from "path"
import { fileURLToPath } from "url"

let browser
let page

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SIZE_X = 315 * 2
const SIZE_Y = 512 * 2

async function launchAndOpenPage() {
  browser = await puppeteer.launch({
    executablePath: "/home/ubuntu/.cache/ms-playwright/chromium-1228/chrome-linux/chrome",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--use-angle=swiftshader",
      "--use-gl=angle",
      "--enable-unsafe-swiftshader",
      "--allow-file-access-from-files"
    ]
  })

  browser.on('disconnected', () => {
    console.error('[browser] disconnected')
  })

  page = await browser.newPage()
  await page.setViewport({ width: SIZE_X, height: SIZE_Y })

  page.on('console', msg => console.log('[browser]', msg.text()))
  page.on('pageerror', err => console.error('[pageerror]', err))
  page.on('error', err => console.error('[page crashed]', err))

  await page.goto(`file://${path.resolve(__dirname, '../renderer-assets/skin-renderer.html')}`)
  await page.waitForFunction('window.rendererReady === true')

  console.log('[browser] renderer ready:', await page.title(), await page.url())
}

export async function initRenderer() {
  await launchAndOpenPage()
}

export async function recreatePage() {
  console.warn('[browser] recreating page/browser after failure')
  try {
    if (browser) await browser.close()
  } catch (e) {
    console.warn('[browser] error closing old browser:', e.message)
  }
  await launchAndOpenPage()
}

export function getPage() {
  if (!page) throw new Error('Renderer not initialized — call initRenderer() first')
  return page
}

export async function closeBrowser() {
  if (browser) {
    try {
      await browser.close()
    } catch (e) {
      console.warn('[browser] error during close:', e.message)
    }
  }
}