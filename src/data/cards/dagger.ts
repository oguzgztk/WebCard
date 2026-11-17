import type { CardDefinition } from '@/game/types'

export const dagger: CardDefinition = {
  id: 'dagger',
  name: 'Hançer',
  cost: 1,
  type: 'attack',
  description: '6 hasar ver.',
  effects: [{ kind: 'damage', amount: 6, target: 'enemy' }],
}
