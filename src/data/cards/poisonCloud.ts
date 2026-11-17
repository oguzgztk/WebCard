import type { CardDefinition } from '@/game/types'

/** Tüm düşmanlara zehir bulutu. */
export const poisonCloud: CardDefinition = {
  id: 'poison_cloud',
  name: 'Zehir Bulutu',
  cost: 2,
  type: 'skill',
  description: 'Tüm düşmanlara 5 Zehir uygula.',
  effects: [{ kind: 'applyStatus', status: 'poison', amount: 5, target: 'allEnemies' }],
}
