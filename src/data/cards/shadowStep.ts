import type { CardDefinition } from '@/game/types'

/** Gölgede kaybol: blok + kart çek. */
export const shadowStep: CardDefinition = {
  id: 'shadow_step',
  name: 'Gölge Adımı',
  cost: 1,
  type: 'skill',
  description: '6 blok kazan; 1 kart çek.',
  effects: [
    { kind: 'block', amount: 6 },
    { kind: 'draw', amount: 1 },
  ],
}
