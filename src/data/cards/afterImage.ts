import type { CardDefinition } from '@/game/types'

/** Saldırıdan önce savun. */
export const afterImage: CardDefinition = {
  id: 'after_image',
  name: 'Artık İmge',
  cost: 1,
  type: 'skill',
  description: '8 blok kazan; 1 kart çek. Geçici.',
  effects: [
    { kind: 'block', amount: 8 },
    { kind: 'draw', amount: 1 },
  ],
  ethereal: true,
}
