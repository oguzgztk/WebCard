import type { CardDefinition } from '@/game/types'

/** Suikast darbesi — büyük hasar, bir kez kullanım. */
export const assassinate: CardDefinition = {
  id: 'assassinate',
  name: 'Suikast',
  cost: 3,
  type: 'attack',
  description: '30 hasar ver. Tüket.',
  effects: [{ kind: 'damage', amount: 30, target: 'enemy' }],
  exhaust: true,
}
