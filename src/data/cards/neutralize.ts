import type { CardDefinition } from '@/game/types'

export const neutralize: CardDefinition = {
  id: 'neutralize',
  name: 'Neutralize',
  cost: 2,
  type: 'attack',
  description: '9 hasar; düşmana 3 tur zayıf.',
  effects: [
    { kind: 'damage', amount: 9, target: 'enemy' },
    { kind: 'applyStatus', status: 'weak', amount: 3, target: 'enemy' },
  ],
}
