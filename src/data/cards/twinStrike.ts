import type { CardDefinition } from '@/game/types'

export const twinStrike: CardDefinition = {
  id: 'twin_strike',
  name: 'Twin Strike',
  cost: 2,
  type: 'attack',
  description: 'İki kez 7 hasar vur.',
  effects: [
    { kind: 'damage', amount: 7, target: 'enemy' },
    { kind: 'damage', amount: 7, target: 'enemy' },
  ],
}
