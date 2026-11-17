import type { CardDefinition } from '@/game/types'

/** Tek büyük vuruş — üç enerji maliyeti ile sınırlandırıldı. Exhaust: deste dönemez. */
export const carnage: CardDefinition = {
  id: 'carnage',
  name: 'Katliam',
  cost: 2,
  type: 'attack',
  description: '20 hasar ver. Tüket.',
  effects: [{ kind: 'damage', amount: 20, target: 'enemy' }],
  exhaust: true,
}
