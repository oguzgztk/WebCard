import { describe, expect, it } from 'vitest'

import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { ALL_CHARACTERS } from '@/data/characters'
import { ENEMY_DEFINITIONS_MAP } from '@/data/enemies'
import { ACT_COUNT, ACTS } from '@/data/encounters'
import { EVENT_MAP } from '@/data/events'
import { MAP_FLOORS } from '@/game/mapGen'
import { pickRelicReward, RELIC_MAP } from '@/game/relics'
import {
  applyRelicReward,
  applyRestHeal,
  applyRestUpgrade,
  applyRewardCard,
  availableNodeIds,
  buyShopCard,
  buyShopPotion,
  dailySeed,
  potionSlots,
  restHealAmount,
  startNextAct,
  eventOutcomeGoldCost,
  generateRun,
  getCardShopPrice,
  removeShopCard,
  resolveCombatVictory,
  resolveEventChoice,
  selectNode,
} from '@/game/runEngine'
import type { RunState } from '@/game/runTypes'

function runAtEvent(eventId: string, patch: Partial<RunState> = {}): RunState {
  const run = generateRun(42, 'demirci')
  return { ...run, phase: 'event', activeEventId: eventId, ...patch }
}

describe('veri bütünlüğü', () => {
  it('every referenced card, enemy and relic exists', () => {
    for (const c of ALL_CHARACTERS) {
      for (const id of [...c.starterDeckIds, ...c.cardPoolIds]) expect(CARD_DEFINITIONS_MAP[id], id).toBeDefined()
      expect(RELIC_MAP[c.starterRelicId]).toBeDefined()
      for (const id of c.cardPoolIds) expect(CARD_DEFINITIONS_MAP[id]!.rarity, id).not.toBe('starter')
    }
    for (const act of Object.values(ACTS)) {
      for (const tier of Object.values(act.encounters)) {
        for (const e of tier) for (const id of e.enemyDefIds) expect(ENEMY_DEFINITIONS_MAP[id], id).toBeDefined()
      }
    }
  })
})

describe('günün koşusu', () => {
  it('derives a stable seed from the date', () => {
    expect(dailySeed(new Date(2026, 10, 17))).toBe(20261117)
    const a = generateRun(dailySeed(new Date(2026, 0, 2)), 'demirci').nodes.map((n) => n.kind)
    const b = generateRun(dailySeed(new Date(2026, 0, 2)), 'demirci').nodes.map((n) => n.kind)
    expect(a).toEqual(b)
  })
})

describe('harita', () => {
  it('is deterministic for a seed', () => {
    const a = generateRun(1234, 'demirci').nodes.map((n) => `${n.floor}:${n.lane}:${n.kind}`)
    const b = generateRun(1234, 'demirci').nodes.map((n) => `${n.floor}:${n.lane}:${n.kind}`)
    expect(a).toEqual(b)
  })

  it('every node is reachable and leads to the boss', () => {
    for (const seed of [1, 7, 42, 999, 31337]) {
      const run = generateRun(seed, 'golge')
      const byId = new Map(run.nodes.map((n) => [n.id, n]))
      const boss = run.nodes.find((n) => n.kind === 'boss')!
      expect(boss.floor).toBe(MAP_FLOORS - 1)
      // Her düğümden boss'a yol var
      const reachesBoss = (id: string): boolean => id === boss.id || byId.get(id)!.next.some(reachesBoss)
      for (const n of run.nodes) expect(reachesBoss(n.id)).toBe(true)
      // Kat kuralları
      expect(run.nodes.filter((n) => n.floor === 0).every((n) => n.kind === 'combat')).toBe(true)
      expect(run.nodes.filter((n) => n.floor === MAP_FLOORS - 2).every((n) => n.kind === 'rest')).toBe(true)
      expect(run.nodes.filter((n) => n.floor === 6).every((n) => n.kind === 'treasure')).toBe(true)
    }
  })

  it('only connected nodes can be selected', () => {
    let run = generateRun(5, 'demirci')
    const first = availableNodeIds(run)
    expect(first.length).toBeGreaterThan(0)
    const notAvail = run.nodes.find((n) => n.floor === 2)!
    expect(selectNode(run, notAvail.id)).toBe(run)
    run = selectNode(run, first[0]!)
    expect(run.phase).toBe('combat')
  })
})

describe('ödüller', () => {
  it('combat victory offers 3 unique non-starter cards and gold', () => {
    let run = generateRun(9, 'demirci')
    run = selectNode(run, availableNodeIds(run)[0]!)
    const next = resolveCombatVictory(run, 50)
    expect(next.phase).toBe('reward')
    expect(new Set(next.pendingRewardCards).size).toBe(3)
    expect(next.pendingRewardCards.every((id) => CARD_DEFINITIONS_MAP[id]!.rarity !== 'starter')).toBe(true)
    expect(next.gold).toBeGreaterThan(run.gold)
    const after = applyRewardCard(next, next.pendingRewardCards[0]!)
    expect(after.deckDefIds).toHaveLength(run.deckDefIds.length + 1)
    expect(after.phase).toBe('map')
  })

  it('cannot take a card that was not offered', () => {
    let run = generateRun(9, 'demirci')
    run = resolveCombatVictory(selectNode(run, availableNodeIds(run)[0]!), 50)
    expect(applyRewardCard(run, 'earthquake+')).toBe(run)
  })

  it('strawberry raises max hp on pickup', () => {
    const run: RunState = { ...generateRun(1, 'demirci'), phase: 'relic_reward', pendingRelicReward: ['strawberry'] }
    const next = applyRelicReward(run, 'strawberry')
    expect(next.playerMaxHp).toBe(run.playerMaxHp + 7)
  })

  it('relic picking is deterministic, unique, and skips owned relics', () => {
    const a = pickRelicReward(12345, ['anchor'])
    expect(a.relics).toEqual(pickRelicReward(12345, ['anchor']).relics)
    expect(new Set(a.relics).size).toBe(a.relics.length)
    expect(a.relics).not.toContain('anchor')
  })
})

describe('olaylar', () => {
  it('applies every effect of a multi-effect choice', () => {
    const run = runAtEvent('ancient_shrine', { gold: 0, playerHp: 50 })
    const next = resolveEventChoice(run, EVENT_MAP.ancient_shrine!.choices[0]!.outcome)
    expect(next.playerHp).toBe(43)
    expect(next.gold).toBe(50)
    expect(next.phase).toBe('map')
  })

  it('refuses a gold-costing choice the player cannot afford', () => {
    const run = runAtEvent('old_soldier', { gold: 10 })
    const pay = EVENT_MAP.old_soldier!.choices[1]!.outcome
    expect(eventOutcomeGoldCost(pay)).toBe(25)
    expect(resolveEventChoice(run, pay)).toBe(run)
  })

  it('hermit removes basic cards first', () => {
    const run = runAtEvent('hermit')
    const next = resolveEventChoice(run, EVENT_MAP.hermit!.choices[0]!.outcome)
    expect(next.deckDefIds).toHaveLength(run.deckDefIds.length - 2)
    expect(next.deckDefIds).toContain('bash')
  })

  it('forge upgrades two cards', () => {
    const run = runAtEvent('forgotten_forge')
    const next = resolveEventChoice(run, EVENT_MAP.forgotten_forge!.choices[0]!.outcome)
    expect(next.deckDefIds.filter((id) => id.endsWith('+'))).toHaveLength(2)
  })
})

describe('mağaza ve mola', () => {
  function shopRun(gold = 500): RunState {
    const base = generateRun(77, 'demirci')
    const shop = { ...base, gold, phase: 'map' as const }
    // Mağaza düğümü bul ve doğrudan gir
    const node = shop.nodes.find((n) => n.kind === 'shop') ?? shop.nodes[0]!
    return selectNode({ ...shop, currentNodeId: null, nodes: shop.nodes.map((n) => (n.id === node.id ? { ...n, floor: 0, kind: 'shop' } : n)) }, node.id)
  }

  it('prices by rarity', () => {
    expect(getCardShopPrice('pommel_strike')).toBe(50)
    expect(getCardShopPrice('backflip')).toBe(80)
    expect(getCardShopPrice('carnage')).toBe(140)
    expect(getCardShopPrice('carnage+')).toBe(165)
  })

  it('buys a card and removes it from stock', () => {
    const run = shopRun()
    expect(run.phase).toBe('shop')
    const offer = run.shopCards[0]!
    const next = buyShopCard(run, offer.defId)
    expect(next.gold).toBe(run.gold - offer.price)
    expect(next.shopCards).toHaveLength(run.shopCards.length - 1)
  })

  it('card removal works once per visit and gets pricier', () => {
    const run = shopRun()
    const once = removeShopCard(run, 'strike')
    expect(once.deckDefIds).toHaveLength(run.deckDefIds.length - 1)
    expect(once.shopRemovalPrice).toBe(run.shopRemovalPrice + 25)
    expect(removeShopCard(once, 'strike')).toBe(once)
  })

  it('sells potions only while the bag has room', () => {
    const run = shopRun()
    expect(run.shopPotions.length).toBeGreaterThan(0)
    const offer = run.shopPotions[0]!
    const bought = buyShopPotion(run, offer.defId)
    expect(bought.potions).toContain(offer.defId)
    const full = { ...run, potions: ['heal_potion', 'heal_potion', 'heal_potion'] }
    expect(buyShopPotion(full, offer.defId)).toBe(full)
  })

  it('combat victory writes back remaining potions', () => {
    let r = generateRun(9, 'demirci')
    r = selectNode({ ...r, potions: ['heal_potion', 'fire_potion'] }, availableNodeIds(r)[0]!)
    const next = resolveCombatVictory(r, 50, undefined, ['fire_potion'])
    expect(next.potions[0]).toBe('fire_potion')
    expect(next.potions.length).toBeLessThanOrEqual(3)
  })

  it('rest upgrade replaces the card with its + version', () => {
    const run: RunState = { ...generateRun(3, 'demirci'), phase: 'rest' }
    const next = applyRestUpgrade(run, 'bash')
    expect(next.deckDefIds).toContain('bash+')
    expect(next.deckDefIds).not.toContain('bash')
  })
})

describe('perdeler ve yükseliş', () => {
  /** Koşuyu ilk perdenin bossuna ışınla. */
  function atBoss(run: RunState): RunState {
    const boss = run.nodes.find((n) => n.kind === 'boss')!
    return { ...run, phase: 'combat', currentNodeId: boss.id }
  }

  it('act 1 boss leads to boss relics and the act transition', () => {
    let run = atBoss(generateRun(11, 'demirci'))
    run = resolveCombatVictory(run, 20)
    expect(run.phase).toBe('reward')
    expect(run.pendingRelicReward.length).toBeGreaterThan(0)
    expect(run.pendingRelicReward.every((id) => RELIC_MAP[id]!.tier === 'boss')).toBe(true)
    run = applyRewardCard(run, null)
    run = applyRelicReward(run, run.pendingRelicReward[0]!)
    expect(run.phase).toBe('act_transition')
    const act2 = startNextAct(run)
    expect(act2.act).toBe(2)
    expect(act2.playerHp).toBe(act2.playerMaxHp)
    expect(act2.currentNodeId).toBeNull()
    expect(act2.nodes.find((n) => n.kind === 'boss')!.enemyDefIds).toEqual(['bone_dragon'])
  })

  it('final act boss ends the run in victory', () => {
    let run = atBoss({ ...generateRun(11, 'demirci'), act: ACT_COUNT })
    run = resolveCombatVictory(run, 20)
    expect(run.phase).toBe('run_victory')
  })

  it('ascension rules apply', () => {
    const a0 = generateRun(5, 'demirci', 0)
    const a10 = generateRun(5, 'demirci', 10)
    expect(a10.playerHp).toBeLessThan(a0.playerHp)
    expect(potionSlots(a10)).toBe(potionSlots(a0) - 1)
    expect(restHealAmount(a10)).toBeLessThan(restHealAmount(a0))
    const boss10 = a10.nodes.find((n) => n.kind === 'boss')!
    expect(boss10.enemyStrength).toBe(2)
    expect(boss10.enemyHpScale).toBeGreaterThan(a0.nodes.find((n) => n.kind === 'boss')!.enemyHpScale)
  })

  it('ectoplasm blocks gold; coffee blocks resting', () => {
    let run = generateRun(9, 'demirci')
    run = { ...run, relics: [...run.relics, 'ectoplasm'] }
    run = selectNode(run, availableNodeIds(run)[0]!)
    const after = resolveCombatVictory(run, 50)
    expect(after.gold).toBe(run.gold)
    const rest: RunState = { ...generateRun(3, 'demirci'), phase: 'rest', playerHp: 10, relics: ['coffee_dripper'] }
    expect(applyRestHeal(rest)).toBe(rest)
  })
})
