import type { CardDefinition } from '@/game/types'

/** Hayalet görüntü — tur sonu kaybolur ama anlık büyük koruma sağlar. */
export const mirrorImage: CardDefinition = {
  id: 'mirror_image',
  name: 'Ayna İmgesi',
  cost: 0,
  type: 'skill',
  description: '15 blok kazan. Geçici.',
  effects: [{ kind: 'block', amount: 15 }],
  ethereal: true,
}
