/**
 * Uçtan uca koşu testi — geliştirme sunucusunda iki perdelik bir koşuyu arayüz üzerinden oynar.
 * Akışı doğrular (denge değil): oyuncu canı test için sabit tutulur, uzun savaşlar dev düğmesiyle kısaltılır.
 * Kullanım: node scripts/fullrun.mjs [url] [çıktı] [karakter]
 */
import { mkdir } from 'node:fs/promises'

import { chromium } from 'playwright-core'

const url = process.argv[2] ?? 'http://localhost:5173/'
const out = process.argv[3] ?? 'playtest-shots/fullrun'
const character = process.argv[4] ?? 'Demirci'
await mkdir(out, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))

await page.goto(url)
await page.evaluate(() => {
  localStorage.clear()
  localStorage.setItem('webcard_help_seen', 'true')
  localStorage.setItem('webcard_settings_v1', JSON.stringify({ sound: false, music: false, volume: 0, haptics: false, fastMode: true }))
})
await page.reload()
await page.getByText('Koşu Başlat').click()
await page.getByText(character, { exact: true }).click()
await page.waitForTimeout(500)

const phase = () => page.evaluate(() => window.__RUN_STORE__.getState().run?.phase ?? 'none')
const runInfo = () => page.evaluate(() => {
  const r = window.__RUN_STORE__.getState().run
  return r ? { act: r.act, floor: r.stats.floorsCleared, hp: r.playerHp, deck: r.deckDefIds.length, relics: r.relics.length, gold: r.gold } : null
})
const shot = (name) => page.screenshot({ path: `${out}/${name}.png` })
const seen = new Set()
const log = []

for (let step = 0; step < 600; step++) {
  const p = await phase()
  if (p === 'run_victory' || p === 'run_defeat' || p === 'none') break
  const info = await runInfo()
  const key = `${p}-${info.act}`
  if (!seen.has(key)) {
    seen.add(key)
    await page.waitForTimeout(400)
    await shot(key)
  }
  switch (p) {
    case 'map': {
      await page.locator('g[tabindex="0"]').first().click({ force: true })
      await page.waitForTimeout(500)
      break
    }
    case 'combat': {
      for (let turn = 0; turn < 14; turn++) {
        // Test için canı koru (akış testi)
        await page.evaluate(() => {
          const g = window.__GAME_STORE__.getState()
          g.game.player.hp = g.game.player.maxHp
        })
        for (let i = 0; i < 6; i++) {
          await page.keyboard.press('1')
          await page.waitForTimeout(90)
          await page.keyboard.press('1')
          await page.waitForTimeout(90)
        }
        const g = await page.evaluate(() => window.__GAME_STORE__.getState().game.phase)
        if (g !== 'playerTurn') break
        await page.keyboard.press('e')
        await page.waitForTimeout(1400)
      }
      if ((await page.evaluate(() => window.__GAME_STORE__.getState().game.phase)) !== 'victory') {
        await page.getByTitle('DEV: Düşmanları öldür').click()
      }
      await page.waitForTimeout(900)
      await page.getByText(/Ödülleri Topla|Koşu Sonu/).click()
      await page.waitForTimeout(500)
      log.push(`savaş bitti → ${JSON.stringify(await runInfo())}`)
      break
    }
    case 'reward':
      await page.locator('article[role="button"]').first().click()
      await page.waitForTimeout(400)
      break
    case 'treasure':
      await page.getByLabel('Sandığı aç').click()
      await page.waitForTimeout(600)
    // fallthrough
    case 'relic_reward':
      await page.locator('main button, div button').filter({ hasText: /Yaygın|Nadir|Efsanevi|Boss/ }).first().click()
      await page.waitForTimeout(500)
      break
    case 'rest':
      await page.getByText('Hiçbir şey yapmadan devam et').click()
      await page.waitForTimeout(400)
      break
    case 'shop':
      await page.getByText('Yola Devam →').click()
      await page.waitForTimeout(400)
      break
    case 'event':
      await page.locator('button.group.w-full:not([disabled])').first().click()
      await page.waitForTimeout(400)
      await page.getByText('Devam et →').click()
      await page.waitForTimeout(400)
      break
    case 'act_transition':
      await page.waitForTimeout(2000)
      await page.getByText('Derinlere İn →').click()
      await page.waitForTimeout(600)
      break
  }
}

await page.waitForTimeout(800)
await shot('end')
console.log(log.join('\n'))
console.log('Son faz:', await phase(), JSON.stringify(await runInfo()))
console.log(errors.length ? errors.join('\n') : 'Hata yok')
await browser.close()
