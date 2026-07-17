// render.js
import { getPage, recreatePage } from './browser.js';

export async function renderBrowser(skinBuffer, key, { retried = false } = {}) {
  const page = getPage();
  const skinBase64 = `data:image/png;base64,${skinBuffer.toString('base64')}`;

  try {
    await page.evaluate((b64) => { window.frameReady = false; });
    await page.evaluate(async (b64, key) => {
      await window.setSkin(b64, key);
      window.frameReady = true;
    }, skinBase64, key);
    await page.waitForFunction('window.frameReady === true', { timeout: 10000 });
    return await page.screenshot({ omitBackground: true });
  } catch (err) {
    const isDetached = err.message.includes('detached Frame')
      || err.message.includes('Target closed')
      || err.message.includes('Session closed');

    if (isDetached && !retried) {
      console.warn('[render] page detached, recreating and retrying once');
      await recreatePage();
      return renderBrowser(skinBuffer, { retried: true }); // retry exactly once
    }
    throw err; // not recoverable, or already retried — let it bubble to the route's catch
  }
}