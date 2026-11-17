import type { CardDefinition } from '@/game/types'

/** Tüm düşmanlara hasar — birden fazla düşman varken güçlü, yoksa yeterli. */
export const whirlwind: CardDefinition = {
  id: 'whirlwind',
  name: 'Kasırga',
  cost: 2,
  type: 'attack',
  description: 'Tüm düşmanlara 8 hasar ver.',
  effects: [{ kind: 'damage', amount: 8, target: 'allEnemies' }],
}
