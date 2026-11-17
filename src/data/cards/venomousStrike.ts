import type { CardDefinition } from '@/game/types'

export const venomousStrike: CardDefinition = {
  id: 'venomous_strike',
  name: 'Zehirli Vuruş',
  cost: 2,
  type: 'attack',
  description: '10 hasar ver; 3 Zehir uygula.',
  effects: [
    { kind: 'damage', amount: 10, target: 'enemy' },
    { kind: 'applyStatus', status: 'poison', amount: 3, target: 'enemy' },
  ],
}
