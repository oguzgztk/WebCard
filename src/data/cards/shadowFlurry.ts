import type { CardDefinition } from '@/game/types'

/** Gölge fırtınası — kart çek ve enerji kazan. */
export const shadowFlurry: CardDefinition = {
  id: 'shadow_flurry',
  name: 'Gölge Fırtınası',
  cost: 2,
  type: 'skill',
  description: '3 kart çek.',
  effects: [{ kind: 'draw', amount: 3 }],
}
