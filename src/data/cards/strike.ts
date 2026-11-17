import type { CardDefinition } from '@/game/types'

/** Sts benzeri bıç — zayıflatılmış 6 hasar için 1 mana. */
export const strike: CardDefinition = {
  id: 'strike',
  name: 'Strike',
  cost: 1,
  type: 'attack',
  description: '8 hasar.',
  effects: [{ kind: 'damage', amount: 8, target: 'enemy' }],
}
