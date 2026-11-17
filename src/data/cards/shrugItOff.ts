import type { CardDefinition } from '@/game/types'

export const shrugItOff: CardDefinition = {
  id: 'shrug_it_off',
  name: 'Shrug It Off',
  cost: 1,
  type: 'skill',
  description: '10 blok kazan.',
  effects: [{ kind: 'block', amount: 10 }],
}
