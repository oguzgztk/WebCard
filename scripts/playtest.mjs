/**
 * Görsel oyun testi — sistem Chrome'u ile oyunu açar, bir koşu boyunca tıklar ve ekran görüntüsü alır.
 * Kullanım: node scripts/playtest.mjs [url] [çıktıKlasörü] [genişlik] [yükseklik]
 */
import { mkdir } from 'node:fs/promises'

import { chromium } from 'playwright-core'

const url = process.argv[2] ?? 'http://localhost:5173/'
const out = process.argv[3] ?? 'playtest-shots'
const width = Number(process.argv[4] ?? 1280)
const height = Number(process.argv[5] ?? 800)
await mkdir(out, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width, height } })
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))

let n = 0
const shot = async (name) => {
  await page.waitForTimeout(450)
  await page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${name}.png` })
}

await page.goto(url)
await page.evaluate(() => localStorage.clear())
await page.reload()
await shot('lobby')

await page.getByText('Koşu Başlat').click()
await shot('character')
await page.getByText('Demirci', { exact: true }).click()
await page.waitForTimeout(600)
await shot('map')

// Haritada ilk seçilebilir düğüme tıkla
await page.locator('g[tabindex="0"]').first().click({ force: true })
await page.waitForTimeout(900)
await shot('combat')

// Birkaç kart oyna, sonra turu bitir
for (let turn = 0; turn < 8; turn++) {
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('1')
    await page.waitForTimeout(250)
    // hedef modundaysa ilk düşmanı seç
    await page.keyboard.press('1')
    await page.waitForTimeout(150)
  }
  if (turn === 0) await shot('combat-after-plays')
  const over = await page.getByText(/Ödülleri Topla|Koşu Sonu/).count()
  if (over) break
  await page.keyboard.press('e')
  await page.waitForTimeout(turn === 0 ? 700 : 2200)
  if (turn === 0) await shot('enemy-turn')
}
await shot('combat-end')
const reward = page.getByText('Ödülleri Topla →')
if (await reward.count()) {
  await reward.click()
  await shot('reward')
  await page.locator('article[role="button"]').first().click()
  await shot('map-after')
}

console.log(errors.length ? errors.join('\n') : 'Hata yok')
await browser.close()
