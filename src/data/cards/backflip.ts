import type { CardDefinition } from '@/game/types'

export const backflip: CardDefinition = {
  id: 'backflip',
  name: 'Backflip',
  cost: 3,
  type: 'skill',
  description: '11 blok ve 2 kart çek.',
  effects: [
    { kind: 'block', amount: 11 },
    { kind: 'draw', amount: 2 },
  ],
}
