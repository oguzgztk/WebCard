import type { CardDefinition } from '@/game/types'

/** Tempo kartı — bir sonraki hamleni daha güçlü yapar. Exhaust: deste dönemez. */
export const seeingRed: CardDefinition = {
  id: 'seeing_red',
  name: 'Kızıl Göz',
  cost: 0,
  type: 'skill',
  description: '2 enerji kazan. Tüket.',
  effects: [{ kind: 'gainEnergy', amount: 2 }],
  exhaust: true,
}
