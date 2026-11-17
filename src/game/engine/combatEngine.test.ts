import { describe, expect, it } from 'vitest'

import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { describeCardPlain } from '@/game/cardText'
import { HAND_DRAW_SIZE } from '@/game/constants'
import {
  beginEnemyTurn,
  drinkPotion,
  endPlayerTurn,
  finishEnemyTurn,
  incomingDamage,
  playCard,
  resolveEnemyAction,
  startCombat,
} from '@/game/engine/combatEngine'
import { instantiateDeck, shuffleDeck } from '@/game/engine/deckEngine'
import { calcDamage } from '@/game/engine/effectResolver'
import { emptyStatuses } from '@/game/statuses'
import type { CardInstance, GameState } from '@/game/types'

const many = (id: string, n: number) => Array.from({ length: n }, () => id)

/** Kartın ilk `kind` etkisinin miktarı — testler denge değerlerine bağlanmasın. */
function amountOf(defId: string, kind: 'block' | 'damage' | 'applyStatus'): number {
  const e = CARD_DEFINITIONS_MAP[defId]!.effects.find((x) => x.kind === kind)
  return e && 'amount' in e ? e.amount : 0
}

function battleWith(deck: string[], enemies: string[] = ['jaw_worm'], seed = 7): GameState {
  return startCombat({ seed, enemyDefIds: enemies, deckDefinitionIds: deck })
}

/** Eldeki ilk `defId` kartını oyna. */
function play(state: GameState, defId: string, target?: string) {
  const inst = state.hand.find((c) => c.defId === defId)
  if (!inst) throw new Error(`${defId} elde yok`)
  return playCard(state, inst.instanceId, target)
}

describe('deckEngine', () => {
  it('shuffle is deterministic for equal definition stacks', () => {
    const ids = (cs: CardInstance[]) => cs.map((c) => c.defId).join('|')
    const a = shuffleDeck(instantiateDeck(['strike', 'strike', 'defend', 'bash']), 123456).shuffled
    const b = shuffleDeck(instantiateDeck(['strike', 'strike', 'defend', 'bash']), 123456).shuffled
    expect(ids(a)).toBe(ids(b))
  })
})

describe('combatEngine — temel', () => {
  it('strike reduces enemy hp by its damage', () => {
    let s = battleWith(many('strike', 10))
    const before = s.enemies[0]!.hp
    s = play(s, 'strike')
    expect(s.enemies[0]!.hp).toBe(before - amountOf('strike', 'damage'))
    expect(s.stats.damageDealt).toBe(amountOf('strike', 'damage'))
  })

  it('cannot play a card without enough energy', () => {
    let s = battleWith(many('strike', 10))
    s = { ...s, player: { ...s.player, energy: 0 } }
    const after = play(s, 'strike')
    expect(after).toBe(s)
  })

  it('multi-hit damage applies strength per hit', () => {
    let s = battleWith(many('twin_strike', 10))
    s = { ...s, player: { ...s.player, statuses: { ...s.player.statuses, strength: 2 } } }
    const before = s.enemies[0]!.hp
    s = play(s, 'twin_strike')
    const dmg = CARD_DEFINITIONS_MAP.twin_strike!.effects[0]!
    expect(before - s.enemies[0]!.hp).toBe(((dmg as { amount: number }).amount + 2) * 2)
  })

  it('body slam deals damage equal to block', () => {
    let s = battleWith([...many('defend', 5), ...many('body_slam', 5)])
    s = play(s, 'defend')
    const hp = s.enemies[0]!.hp
    s = play(s, 'body_slam')
    expect(hp - s.enemies[0]!.hp).toBe(amountOf('defend', 'block'))
  })

  it('dexterity increases block from cards', () => {
    let s = battleWith(many('defend', 10))
    s = { ...s, player: { ...s.player, statuses: { ...s.player.statuses, dexterity: 2 } } }
    s = play(s, 'defend')
    expect(s.player.block).toBe(amountOf('defend', 'block') + 2)
  })

  it('catalyst doubles poison', () => {
    let s = battleWith([...many('envenom', 5), ...many('catalyst', 5)])
    s = play(s, 'envenom')
    s = play(s, 'catalyst')
    expect(s.enemies[0]!.statuses.poison).toBe(amountOf('envenom', 'applyStatus') * 2)
  })

  it('power cards leave combat after being played', () => {
    let s = battleWith(many('rage_burst', 10))
    s = play(s, 'rage_burst')
    expect(s.player.statuses.strength).toBe(2)
    expect(s.exhaustPile).toHaveLength(1)
    expect(s.discardPile).toHaveLength(0)
  })

  it('allEnemies damage hits every enemy', () => {
    let s = battleWith(many('thunderclap', 10), ['louse', 'louse'])
    const hps = s.enemies.map((e) => e.hp)
    s = play(s, 'thunderclap')
    s.enemies.forEach((e, i) => expect(e.hp).toBe(hps[i]! - amountOf('thunderclap', 'damage')))
    expect(s.enemies.every((e) => e.statuses.vulnerable === 1)).toBe(true)
  })

  it('single-target damage hits the chosen enemy', () => {
    let s = battleWith(many('strike', 10), ['louse', 'louse'])
    const [a, b] = s.enemies
    s = play(s, 'strike', b!.uid)
    expect(s.enemies.find((e) => e.uid === a!.uid)!.hp).toBe(a!.hp)
    expect(s.enemies.find((e) => e.uid === b!.uid)!.hp).toBe(b!.hp - amountOf('strike', 'damage'))
  })

  it('same enemy types get staggered intents', () => {
    const s = battleWith(many('strike', 10), ['louse', 'louse'])
    expect(s.enemies[0]!.intent).not.toEqual(s.enemies[1]!.intent)
  })
})

describe('combatEngine — tur akışı ve durumlar', () => {
  it('enemy intent advances after resolving turn', () => {
    const s = battleWith(many('strike', 10))
    expect(endPlayerTurn(s).enemyIntentIndex).toBe(s.enemyIntentIndex + 1)
  })

  it('stepwise turn equals one-shot turn', () => {
    const s = battleWith(many('strike', 10), ['louse', 'bat'])
    let step = beginEnemyTurn(s)
    for (const e of step.enemies) step = resolveEnemyAction(step, e.uid)
    step = finishEnemyTurn(step)
    const once = endPlayerTurn(s)
    expect(step.player.hp).toBe(once.player.hp)
    expect(step.enemies.map((e) => e.intent)).toEqual(once.enemies.map((e) => e.intent))
  })

  it('weak applied by an enemy lasts through the player turns it promises', () => {
    let s = battleWith(many('strike', 10), ['louse'])
    // Asalak: 0=saldırı, 1=zayıf(1)
    s = endPlayerTurn(s)
    expect(s.enemies[0]!.intent.kind).toBe('apply_player_weak')
    s = endPlayerTurn(s)
    expect(s.player.statuses.weak).toBe(1) // oyuncu turunda aktif
    s = endPlayerTurn(s)
    expect(s.player.statuses.weak).toBe(0)
  })

  it('vulnerable applied by the player persists into the next player turn', () => {
    let s = battleWith(many('bash', 10))
    s = play(s, 'bash') // 2 Savunmasız
    s = endPlayerTurn(s)
    expect(s.enemies[0]!.statuses.vulnerable).toBe(1)
  })

  it('poison killing the last enemy ends combat in victory', () => {
    let s = battleWith(many('defend', 5), ['louse'])
    s = { ...s, enemies: s.enemies.map((e) => ({ ...e, hp: 3, block: 10, statuses: { ...e.statuses, poison: 5 } })) }
    s = endPlayerTurn(s)
    expect(s.phase).toBe('victory')
    expect(s.enemies).toHaveLength(0)
  })

  it('enemies can poison the player; poison ticks at the start of the player turn', () => {
    let s = battleWith(many('defend', 10), ['spider'])
    s = endPlayerTurn(s) // örümcek: saldırı
    expect(s.enemies[0]!.intent.kind).toBe('apply_player_poison')
    s = endPlayerTurn(s) // zehir uygulanır, tur başında 1 tik
    const stacks = s.enemies[0]!.intent.kind ? s.player.statuses.poison : 0
    expect(stacks).toBeGreaterThan(0)
  })

  it('thorns damage attackers', () => {
    let s = battleWith(many('defend', 10), ['louse'])
    s = { ...s, player: { ...s.player, statuses: { ...s.player.statuses, thorns: 3 } } }
    const hp = s.enemies[0]!.hp
    s = endPlayerTurn(s) // asalak saldırır
    expect(s.enemies[0]!.hp).toBe(hp - 3)
  })

  it('metallicize grants block before enemies act', () => {
    let s = battleWith(many('strike', 10), ['louse'])
    const hit = s.enemies[0]!.intent.value ?? 0
    s = { ...s, player: { ...s.player, statuses: { ...s.player.statuses, metallicize: hit } } }
    const hp = s.player.hp
    s = endPlayerTurn(s) // asalak `hit` kadar vurur
    expect(s.player.hp).toBe(hp)
  })

  it('incoming damage preview accounts for vulnerable', () => {
    let s = battleWith(many('strike', 10), ['jaw_worm'])
    const raw = s.enemies[0]!.intent.value ?? 0
    expect(incomingDamage(s)).toBe(raw)
    s = { ...s, player: { ...s.player, statuses: { ...s.player.statuses, vulnerable: 1 } } }
    expect(incomingDamage(s)).toBe(Math.floor(raw * 1.5))
  })

  it('innate cards start in hand without exceeding the draw size', () => {
    for (const seed of [1, 2, 3, 99, 1234]) {
      const s = battleWith(['war_cry', 'war_cry', ...many('strike', 10)], ['jaw_worm'], seed)
      expect(s.hand).toHaveLength(HAND_DRAW_SIZE)
      expect(s.hand.filter((c) => c.defId === 'war_cry')).toHaveLength(2)
    }
  })

  it('bag_of_prep draws two extra cards', () => {
    const s = startCombat({ seed: 3, enemyDefIds: ['jaw_worm'], deckDefinitionIds: many('strike', 12), relicIds: ['bag_of_prep'] })
    expect(s.hand).toHaveLength(HAND_DRAW_SIZE + 2)
  })
})

describe('cardText', () => {
  it('generates descriptions from effects', () => {
    expect(describeCardPlain(CARD_DEFINITIONS_MAP.strike!)).toBe('8 hasar ver.')
    expect(describeCardPlain(CARD_DEFINITIONS_MAP['twin_strike+']!)).toBe('2 kez 7 hasar ver.')
    expect(describeCardPlain(CARD_DEFINITIONS_MAP.war_cry!)).toBe('1 kart çek. İçgüdü. Tüket.')
  })

  it('every upgraded card differs from its base', () => {
    for (const [id, def] of Object.entries(CARD_DEFINITIONS_MAP)) {
      if (!def.isUpgraded) continue
      const base = CARD_DEFINITIONS_MAP[id.slice(0, -1)]!
      const changed = base.cost !== def.cost || describeCardPlain(base) !== describeCardPlain(def)
      expect(changed, `${id} yükseltmesi hiçbir şey değiştirmiyor`).toBe(true)
    }
  })

  it('calcDamage applies strength, weak, vulnerable in order', () => {
    const atk = { ...emptyStatuses(), strength: 2, weak: 1 }
    const def = { ...emptyStatuses(), vulnerable: 1 }
    expect(calcDamage(10, atk, def)).toBe(Math.floor(Math.floor(12 * 0.75) * 1.5))
  })
})

describe('iksirler', () => {
  it('heal potion restores hp without exceeding max and is consumed', () => {
    let s = startCombat({ seed: 1, enemyDefIds: ['louse'], deckDefinitionIds: many('strike', 10), playerMaxHp: 50, playerCurrentHp: 40, potions: ['heal_potion', 'block_potion'] })
    s = drinkPotion(s, 0)
    expect(s.player.hp).toBe(50)
    expect(s.potions).toEqual(['block_potion'])
    expect(s.player.energy).toBe(3)
  })

  it('fire potion hits the chosen enemy', () => {
    let s = startCombat({ seed: 1, enemyDefIds: ['louse', 'louse'], deckDefinitionIds: many('strike', 10), potions: ['fire_potion'] })
    const b = s.enemies[1]!
    s = drinkPotion(s, 0, b.uid)
    expect(s.enemies.find((e) => e.uid === b.uid)?.hp ?? 0).toBeLessThan(b.hp)
    expect(s.enemies[0]!.hp).toBe(s.enemies[0]!.maxHp)
  })

  it('cannot drink during the enemy turn', () => {
    const s = startCombat({ seed: 1, enemyDefIds: ['louse'], deckDefinitionIds: many('strike', 10), potions: ['heal_potion'] })
    const enemyTurn = { ...s, phase: 'enemyTurn' as const }
    expect(drinkPotion(enemyTurn, 0)).toBe(enemyTurn)
  })
})
