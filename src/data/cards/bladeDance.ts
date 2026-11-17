import type { CardDefinition } from '@/game/types'

export const bladeDance: CardDefinition = {
  id: 'blade_dance',
  name: 'Blade Dance',
  cost: 2,
  type: 'attack',
  description: '5 hasar ve 2 kart çek.',
  effects: [
    { kind: 'damage', amount: 5, target: 'enemy' },
    { kind: 'draw', amount: 2 },
  ],
}
