/**
 * Ekran galerisi — geliştirme sunucusunda her koşu ekranına doğrudan atlayıp görüntü alır.
 * Kullanım: node scripts/screens.mjs [url] [çıktı] [genişlik] [yükseklik]
 */
import { mkdir } from 'node:fs/promises'

import { chromium } from 'playwright-core'

const url = process.argv[2] ?? 'http://localhost:5173/'
const out = process.argv[3] ?? 'playtest-shots/screens'
const width = Number(process.argv[4] ?? 1280)
const height = Number(process.argv[5] ?? 800)
await mkdir(out, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width, height } })
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))

await page.goto(url)
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('webcard_help_seen', 'true') })
await page.reload()
await page.getByText('Koşu Başlat').click()
await page.getByText('Gölge', { exact: true }).click()
await page.waitForTimeout(500)

/** Koşu durumunu yamala ve ekran görüntüsü al. */
async function at(name, patch, after) {
  await page.evaluate((p) => {
    const s = window.__RUN_STORE__
    const run = s.getState().run
    const relics = [...new Set([...run.relics, 'anchor', 'vajra', 'lantern'])]
    s.setState({ run: { ...run, potions: ['heal_potion', 'fire_potion'], ...p, gold: 300, relics } })
  }, patch)
  await page.waitForTimeout(700)
  if (after) await after()
  await page.screenshot({ path: `${out}/${name}.png` })
}

await at('shop', {}, async () => {
  await page.evaluate(() => {
    const s = window.__RUN_STORE__
    const run = s.getState().run
    const shop = run.nodes.find((n) => n.floor === 0)
    s.setState({ run: { ...run, nodes: run.nodes.map((n) => (n.id === shop.id ? { ...n, kind: 'shop' } : n)) } })
    s.getState().selectNode(shop.id)
  })
  await page.waitForTimeout(700)
})
await at('rest', { phase: 'rest', playerHp: 30 })
await at('rest-upgrade', { phase: 'rest' }, async () => {
  await page.getByText('Dövüş').click()
  await page.waitForTimeout(400)
  await page.locator('article[role="button"]').first().click()
  await page.waitForTimeout(500)
})
await at('event', { phase: 'event', activeEventId: 'hermit' })
await at('treasure-closed', { phase: 'treasure', pendingRelicReward: ['shuriken'], pendingRewardGold: 33 })
await at('treasure-open', { phase: 'treasure', pendingRelicReward: ['shuriken'], pendingRewardGold: 33 }, async () => {
  await page.getByLabel('Sandığı aç').click()
  await page.waitForTimeout(700)
})
await at('relic-reward', { phase: 'relic_reward', pendingRelicReward: ['orichalcum', 'bronze_scales', 'meat_on_the_bone'] })
await at('reward', { phase: 'reward', pendingRewardCards: ['catalyst', 'footwork', 'noxious_fumes'], pendingRewardGold: 18 })
await at('deck', { phase: 'map' }, async () => {
  await page.getByTitle('Desteyi gör').click()
  await page.waitForTimeout(500)
})
await page.keyboard.press('Escape')
await at('settings', { phase: 'map' }, async () => {
  await page.getByLabel('Ayarlar').first().click()
  await page.waitForTimeout(500)
})
await page.keyboard.press('Escape')
await at('combat-potions', { phase: 'map', currentNodeId: null }, async () => {
  await page.evaluate(() => {
    const s = window.__RUN_STORE__
    const run = s.getState().run
    s.getState().selectNode(run.nodes.find((n) => n.floor === 0 && n.kind === 'combat').id)
  })
  await page.waitForTimeout(1200)
})
await at('victory', { phase: 'run_victory', stats: { floorsCleared: 13, enemiesKilled: 21, elitesKilled: 2, damageDealt: 1234, damageTaken: 310, cardsPlayed: 260, goldEarned: 420 } })

console.log(errors.length ? errors.join('\n') : 'Hata yok')
await browser.close()
