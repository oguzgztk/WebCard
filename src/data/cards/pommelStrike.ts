import type { CardDefinition } from '@/game/types'

export const pommelStrike: CardDefinition = {
  id: 'pommel_strike',
  name: 'Pommel Strike',
  cost: 1,
  type: 'attack',
  description: '6 hasar ve 2 kart çek.',
  effects: [
    { kind: 'damage', amount: 6, target: 'enemy' },
    { kind: 'draw', amount: 2 },
  ],
}
