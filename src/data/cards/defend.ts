import type { CardDefinition } from '@/game/types'

export const defend: CardDefinition = {
  id: 'defend',
  name: 'Defend',
  cost: 1,
  type: 'skill',
  description: '5 blok.',
  effects: [{ kind: 'block', amount: 5 }],
}
