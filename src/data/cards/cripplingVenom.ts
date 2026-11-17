import type { CardDefinition } from '@/game/types'

export const cripplingVenom: CardDefinition = {
  id: 'crippling_venom',
  name: 'Kırıcı Zehir',
  cost: 1,
  type: 'skill',
  description: 'Düşmana 4 Zehir + 2 Savunmasız uygula.',
  effects: [
    { kind: 'applyStatus', status: 'poison', amount: 4, target: 'enemy' },
    { kind: 'applyStatus', status: 'vulnerable', amount: 2, target: 'enemy' },
  ],
}
