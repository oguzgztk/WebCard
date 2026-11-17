import type { CardDefinition } from '@/game/types'

export const thunderclap: CardDefinition = {
  id: 'thunderclap',
  name: 'Thunderclap',
  cost: 1,
  type: 'attack',
  description: '4 hasar; düşmana 1 tur savunması kırığı.',
  effects: [
    { kind: 'damage', amount: 4, target: 'enemy' },
    { kind: 'applyStatus', status: 'vulnerable', amount: 1, target: 'enemy' },
  ],
}
