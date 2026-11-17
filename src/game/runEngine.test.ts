import { describe, expect, it } from 'vitest'

import { EVENT_MAP } from '@/data/events'
import { pickRelicReward } from '@/game/relics'
import {
  enterCombatNode,
  eventOutcomeGoldCost,
  generateRun,
  getCardShopPrice,
  resolveEventChoice,
} from '@/game/runEngine'
import type { RunState } from '@/game/runTypes'

function runAtEvent(eventId: string, patch: Partial<RunState> = {}): RunState {
  const run = generateRun(42, 'demirci')
  const idx = run.nodes.findIndex((n) => n.kind === 'event')
  return { ...run, phase: 'event', currentNodeIndex: idx, activeEventId: eventId, ...patch }
}

describe('runEngine — events', () => {
  it('applies every effect of a multi-effect choice', () => {
    const run = runAtEvent('ancient_shrine', { gold: 0, playerHp: 50 })
    const offerBlood = EVENT_MAP.ancient_shrine!.choices[0]!.outcome
    const next = resolveEventChoice(run, offerBlood)
    expect(next.playerHp).toBe(43)
    expect(next.gold).toBe(50)
    expect(next.phase).toBe('map')
  })

  it('grants the promised card', () => {
    const run = runAtEvent('old_soldier')
    const train = EVENT_MAP.old_soldier!.choices[0]!.outcome
    const next = resolveEventChoice(run, train)
    expect(next.deckDefIds).toContain('war_cry')
  })

  it('refuses a gold-costing choice the player cannot afford', () => {
    const run = runAtEvent('old_soldier', { gold: 10, playerHp: 40 })
    const payGold = EVENT_MAP.old_soldier!.choices[1]!.outcome
    expect(eventOutcomeGoldCost(payGold)).toBe(25)
    expect(resolveEventChoice(run, payGold)).toBe(run)
  })
})

describe('runEngine — map flow', () => {
  it('combat node enters combat phase only when selected from map', () => {
    const run = generateRun(7, 'demirci')
    expect(run.nodes[0]!.kind).toBe('combat')
    expect(run.phase).toBe('map')
    expect(enterCombatNode(run).phase).toBe('combat')
    expect(enterCombatNode({ ...run, phase: 'reward' }).phase).toBe('reward')
  })
})

describe('runEngine — shop prices', () => {
  it('prices by rarity and adds the upgrade bonus only to upgraded cards', () => {
    expect(getCardShopPrice('strike')).toBe(75)
    expect(getCardShopPrice('strike+')).toBe(95)
    expect(getCardShopPrice('carnage')).toBe(150)
    expect(getCardShopPrice('carnage+')).toBe(170)
    expect(getCardShopPrice('assassinate')).toBe(150)
    expect(getCardShopPrice('smoke_bomb')).toBe(100)
  })
})

describe('relics — reward picking', () => {
  it('is deterministic, unique, and skips owned relics', () => {
    const a = pickRelicReward(12345, ['anchor'])
    const b = pickRelicReward(12345, ['anchor'])
    expect(a.relics).toEqual(b.relics)
    expect(new Set(a.relics).size).toBe(a.relics.length)
    expect(a.relics).not.toContain('anchor')
    expect(a.relics).toHaveLength(3)
  })
})
