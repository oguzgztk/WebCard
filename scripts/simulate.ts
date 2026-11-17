/**
 * Denge simülasyonu — sezgisel bir bot binlerce koşu oynar; kazanma oranı, ulaşılan kat
 * ve karşılaşma başına kayıp canı raporlar. İnsan oyuncu botta daha iyidir; bot ≈ "ortalama acemi".
 *
 * Kullanım: npx vite-node scripts/simulate.ts [koşuSayısı] [demirci|golge]
 */

import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { drinkPotion, endPlayerTurn, incomingDamage, playCard, startCombat } from '@/game/engine/combatEngine'
import { calcDamage } from '@/game/engine/effectResolver'
import {
  applyRelicReward,
  applyRestHeal,
  applyRestUpgrade,
  applyRewardCard,
  availableNodeIds,
  buyShopCard,
  buyShopPotion,
  buyShopRelic,
  currentNode,
  generateRun,
  leaveShop,
  removeShopCard,
  resolveCombatDefeat,
  resolveCombatVictory,
  resolveEventChoice,
  selectNode,
} from '@/game/runEngine'
import { EVENT_MAP } from '@/data/events'
import type { Difficulty, RunState } from '@/game/runTypes'
import type { CardDefinition, GameState } from '@/game/types'
import { isUpgradeable } from '@/data/cards'

const RUNS = Number(process.argv[2] ?? 300)
/** İsteğe bağlı karakter filtresi (karşılaşma tablosu tek karakter için). */
const ONLY = process.argv[3]

// ── Savaş botu ───────────────────────────────────────────────────────────────

function scoreCard(g: GameState, def: CardDefinition): number {
  const unblocked = Math.max(0, incomingDamage(g) - g.player.block)
  const target = [...g.enemies].filter((e) => e.hp > 0).sort((a, b) => a.hp - b.hp)[0]
  let score = 0
  for (const e of def.effects) {
    switch (e.kind) {
      case 'damage': {
        const hits = e.hits ?? 1
        const targets = e.target === 'allEnemies' ? g.enemies.filter((x) => x.hp > 0) : target ? [target] : []
        for (const t of targets) {
          const dmg = calcDamage(e.amount, g.player.statuses, t.statuses) * hits
          score += Math.min(dmg, t.hp + t.block) + (dmg >= t.hp + t.block ? 8 : 0)
        }
        break
      }
      case 'damageFromBlock':
        score += target ? Math.min(g.player.block, target.hp) : 0
        break
      case 'block':
        score += Math.min(e.amount + g.player.statuses.dexterity, unblocked) * 1.3 + 0.5
        break
      case 'draw':
        score += 3 * e.amount
        break
      case 'gainEnergy':
        score += 5 * e.amount
        break
      case 'applyStatus':
        if (e.target === 'self') score += (g.playerTurnCount < 3 ? 9 : 4) * e.amount
        else if (e.status === 'poison') score += e.amount * 1.8 * (e.target === 'allEnemies' ? g.enemies.length : 1)
        else score += 3 * e.amount
        break
      case 'multiplyStatus':
        score += (target?.statuses.poison ?? 0) * (e.factor - 1) * 1.5
        break
    }
  }
  return score / Math.max(0.6, def.cost)
}

function botCombat(run: RunState, seed: number) {
  const node = currentNode(run)!
  let g = startCombat({
    seed,
    enemyDefIds: node.enemyDefIds,
    enemyHpScale: node.enemyHpScale,
    enemyStrength: node.enemyStrength,
    deckDefinitionIds: run.deckDefIds,
    playerCurrentHp: run.playerHp,
    playerMaxHp: run.playerMaxHp,
    relicIds: run.relics,
    potions: run.potions,
  })
  const bigFight = node.kind !== 'combat'
  for (let turn = 0; turn < 60 && g.phase === 'playerTurn'; turn++) {
    // İksirler: zor savaşta ilk tur, ya da can %35'in altına inince
    if ((bigFight && turn === 0) || g.player.hp < g.player.maxHp * 0.35) {
      while (g.potions.length && g.phase === 'playerTurn') {
        const target = [...g.enemies].filter((e) => e.hp > 0).sort((a, b) => a.hp - b.hp)[0]
        g = drinkPotion(g, 0, target?.uid)
      }
    }
    for (let safety = 0; safety < 20 && g.phase === 'playerTurn'; safety++) {
      const playable = g.hand
        .map((c) => ({ c, def: CARD_DEFINITIONS_MAP[c.defId]! }))
        .filter(({ def }) => def.cost <= g.player.energy)
        .map((x) => ({ ...x, s: scoreCard(g, x.def) }))
        .sort((a, b) => b.s - a.s)
      const best = playable[0]
      if (!best || best.s <= 0.4) break
      const target = [...g.enemies].filter((e) => e.hp > 0).sort((a, b) => a.hp - b.hp)[0]
      g = playCard(g, best.c.instanceId, target?.uid, CARD_DEFINITIONS_MAP, run.relics)
    }
    if (g.phase !== 'playerTurn') break
    g = endPlayerTurn(g, run.relics)
  }
  return g
}

// ── Koşu botu ────────────────────────────────────────────────────────────────

type EncStat = { n: number; hpLost: number; deaths: number }
const encounters = new Map<string, EncStat>()

function simulateRun(seed: number, character: string, difficulty: Difficulty) {
  let run = generateRun(seed, character, difficulty)
  let rng = seed
  const rand = () => ((rng = (rng * 16807) % 2147483647) / 2147483647)

  for (let step = 0; step < 200; step++) {
    if (run.phase === 'run_victory' || run.phase === 'run_defeat') break
    switch (run.phase) {
      case 'map': {
        const opts = availableNodeIds(run).map((id) => run.nodes.find((n) => n.id === id)!)
        const hpRatio = run.playerHp / run.playerMaxHp
        const pref = (k: string) =>
          k === 'rest' ? (hpRatio < 0.5 ? 5 : 1) : k === 'elite' ? (hpRatio > 0.7 ? 3 : 0) : k === 'shop' ? (run.gold > 120 ? 3 : 1) : 2
        opts.sort((a, b) => pref(b.kind) - pref(a.kind) + (rand() - 0.5))
        run = selectNode(run, opts[0]!.id)
        break
      }
      case 'combat': {
        const node = currentNode(run)!
        const before = run.playerHp
        const g = botCombat(run, node.seed)
        const key = `${node.kind}:${node.enemyDefIds.join('+')}`
        const st = encounters.get(key) ?? { n: 0, hpLost: 0, deaths: 0 }
        st.n++
        st.hpLost += before - Math.max(0, g.player.hp)
        if (g.phase !== 'victory') st.deaths++
        encounters.set(key, st)
        run = g.phase === 'victory' ? resolveCombatVictory(run, g.player.hp, g.stats, g.potions) : resolveCombatDefeat(run, g.stats)
        break
      }
      case 'reward': {
        const cards = run.pendingRewardCards
        const pick = run.deckDefIds.length < 24 ? cards[Math.floor(rand() * cards.length)] : null
        run = applyRewardCard(run, pick ?? null)
        break
      }
      case 'relic_reward':
      case 'treasure':
        run = applyRelicReward(run, run.pendingRelicReward[0] ?? null)
        break
      case 'rest': {
        const up = run.deckDefIds.find((id) => {
          const d = CARD_DEFINITIONS_MAP[id]
          return d && isUpgradeable(d) && d.rarity !== 'starter'
        }) ?? run.deckDefIds.find((id) => CARD_DEFINITIONS_MAP[id] && isUpgradeable(CARD_DEFINITIONS_MAP[id]!))
        run = run.playerHp / run.playerMaxHp < 0.6 || !up ? applyRestHeal(run) : applyRestUpgrade(run, up)
        break
      }
      case 'shop': {
        const basic = run.deckDefIds.find((id) => ['strike', 'defend', 'dagger', 'deflect'].includes(id))
        if (basic) run = removeShopCard(run, basic)
        run = buyShopRelic(run)
        for (const o of [...run.shopPotions]) run = buyShopPotion(run, o.defId)
        for (const o of [...run.shopCards]) run = buyShopCard(run, o.defId)
        run = leaveShop(run)
        break
      }
      case 'event': {
        const ev = EVENT_MAP[run.activeEventId ?? '']!
        const choices = ev.choices.filter((c) => resolveEventChoice(run, c.outcome) !== run)
        const hpRatio = run.playerHp / run.playerMaxHp
        const safe = choices.filter((c) => hpRatio > 0.5 || !c.outcome.effects.some((e) => e.kind === 'loseHp'))
        const pool = safe.length ? safe : choices
        run = resolveEventChoice(run, pool[Math.floor(rand() * pool.length)]!.outcome)
        break
      }
    }
  }
  return run
}

// ── Rapor ────────────────────────────────────────────────────────────────────

for (const difficulty of ['normal', 'hard'] as const) {
  for (const character of ['demirci', 'golge'].filter((c) => !ONLY || c === ONLY)) {
    let wins = 0
    let floors = 0
    let bossFights = 0
    const deathFloors: number[] = []
    for (let i = 0; i < RUNS; i++) {
      const run = simulateRun(1000 + i * 7919, character, difficulty)
      if (run.phase === 'run_victory') wins++
      else deathFloors.push(run.stats.floorsCleared)
      floors += run.stats.floorsCleared
      if (run.stats.floorsCleared >= 12) bossFights++
    }
    const pct = (x: number) => `${((x / RUNS) * 100).toFixed(0)}%`
    console.log(
      `${difficulty.padEnd(6)} ${character.padEnd(8)} kazanma ${pct(wins).padStart(4)}  ort. kat ${(floors / RUNS).toFixed(1)}  boss'a ulaşma ${pct(bossFights)}`,
    )
  }
}

console.log('\nKarşılaşma (tüm koşular)        adet   ort. kayıp can   ölüm%')
for (const [key, st] of [...encounters].sort((a, b) => b[1].hpLost / b[1].n - a[1].hpLost / a[1].n)) {
  console.log(
    `${key.padEnd(32)} ${String(st.n).padStart(5)}   ${(st.hpLost / st.n).toFixed(1).padStart(8)}       ${((st.deaths / st.n) * 100).toFixed(0).padStart(3)}%`,
  )
}
