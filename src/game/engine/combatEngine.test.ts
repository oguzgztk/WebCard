import { describe, expect, it } from 'vitest'

import { HAND_DRAW_SIZE } from '@/game/constants'
import { endPlayerTurn, playCard, startCombat } from '@/game/engine/combatEngine'
import { instantiateDeck, shuffleDeck } from '@/game/engine/deckEngine'
import type { CardInstance } from '@/game/types'

describe('deckEngine', () => {
  it('shuffle is deterministic for equal definition stacks', () => {
    const a = instantiateDeck(['strike', 'strike', 'defend'])
    const b = instantiateDeck(['strike', 'strike', 'defend'])

    const orderA = defIds(shuffleDeck(a, 123456).shuffled).join('|')
    const orderB = defIds(shuffleDeck(b, 123456).shuffled).join('|')

    expect(orderA).toBe(orderB)
  })
})

describe('combatEngine', () => {
  const strikeSpamDeck = (): ReadonlyArray<string> =>
    Array.from({ length: 16 }, (): string => 'strike')

  it('strike reduces hp', () => {
    let battle = startCombat({
      enemyDefId: 'jaw_worm',
      seed: 7,
      deckDefinitionIds: strikeSpamDeck(),
    })

    const payload = battle.hand.find((card) => card.defId === 'strike')
    expect(payload).toBeTruthy()

    const before = battle.enemies[0]?.hp ?? 0
    battle = playCard(battle, payload!.instanceId)
    const after = battle.enemies[0]?.hp ?? before

    expect(after).toBeLessThan(before)
  })

  it('cannot play strike with zero energy', () => {
    let battle = startCombat({
      enemyDefId: 'jaw_worm',
      deckDefinitionIds: strikeSpamDeck(),
      seed: 202,
    })

    const payload = battle.hand.find((card) => card.defId === 'strike')
    expect(payload).toBeTruthy()

    battle = {
      ...battle,
      player: {
        ...battle.player,
        energy: 0,
      },
    }

    const beforeIds = snapshotHandIds(battle)
    battle = playCard(battle, payload!.instanceId)
    const afterIds = snapshotHandIds(battle)

    expect(afterIds).toEqual(beforeIds)
    expect(battle.player.energy).toBe(0)
  })

  it('enemy intent advances after resolving turn', () => {
    let battle = startCombat({ enemyDefId: 'jaw_worm', seed: 11 })

    const startIndex = battle.enemyIntentIndex
    battle = endPlayerTurn(battle)
    expect(battle.enemyIntentIndex).toBe(startIndex + 1)
  })
})

describe('combatEngine — durumlar ve keyword', () => {
  it('poison killing the last enemy ends combat in victory', () => {
    let battle = startCombat({ enemyDefId: 'louse', seed: 5, deckDefinitionIds: ['defend', 'defend', 'defend', 'defend', 'defend'] })
    battle = {
      ...battle,
      enemies: battle.enemies.map((e) => ({ ...e, hp: 3, block: 0, statuses: { ...e.statuses, poison: 5 } })),
    }
    battle = endPlayerTurn(battle)
    expect(battle.phase).toBe('victory')
    expect(battle.enemies).toHaveLength(0)
  })

  it('innate cards start in hand without exceeding the draw size', () => {
    const deck = ['war_cry', 'war_cry', ...Array.from({ length: 10 }, () => 'strike')]
    for (const seed of [1, 2, 3, 99, 1234]) {
      const battle = startCombat({ enemyDefId: 'jaw_worm', seed, deckDefinitionIds: deck })
      expect(battle.hand).toHaveLength(HAND_DRAW_SIZE)
      expect(battle.hand.filter((c) => c.defId === 'war_cry')).toHaveLength(2)
    }
  })

  it('bag_of_prep draws two extra cards from the draw pile', () => {
    const battle = startCombat({
      enemyDefId: 'jaw_worm',
      seed: 3,
      deckDefinitionIds: Array.from({ length: 12 }, () => 'strike'),
      relicIds: ['bag_of_prep'],
    })
    expect(battle.hand).toHaveLength(HAND_DRAW_SIZE + 2)
    expect(battle.drawPile).toHaveLength(12 - HAND_DRAW_SIZE - 2)
  })
})

function defIds(entries: readonly CardInstance[]) {
  return entries.map((piece) => piece.defId)
}

function snapshotHandIds(state: ReturnType<typeof startCombat>) {
  return state.hand.map((piece) => piece.instanceId).join(':')
}
