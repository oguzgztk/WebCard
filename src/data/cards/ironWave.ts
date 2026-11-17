import type { CardDefinition } from '@/game/types'

export const ironWave: CardDefinition = {
  id: 'iron_wave',
  name: 'Iron Wave',
  cost: 2,
  type: 'attack',
  description: '8 hasar ver, 5 blok kazan.',
  effects: [
    { kind: 'damage', amount: 8, target: 'enemy' },
    { kind: 'block', amount: 5 },
  ],
}
