import type { CardDefinition } from '@/game/types'

export const deflect: CardDefinition = {
  id: 'deflect',
  name: 'Savuş',
  cost: 0,
  type: 'skill',
  description: '4 blok kazan.',
  effects: [{ kind: 'block', amount: 4 }],
}
