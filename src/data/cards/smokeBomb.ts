import type { CardDefinition } from '@/game/types'

export const smokeBomb: CardDefinition = {
  id: 'smoke_bomb',
  name: 'Duman Bombası',
  cost: 2,
  type: 'skill',
  description: '12 blok kazan; düşmana 2 Zayıf uygula.',
  effects: [
    { kind: 'block', amount: 12 },
    { kind: 'applyStatus', status: 'weak', amount: 2, target: 'enemy' },
  ],
}
