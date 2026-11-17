import type { CardDefinition } from '@/game/types'

/** Başlangıç imzası — düşmana zehir yığar. */
export const envenom: CardDefinition = {
  id: 'envenom',
  name: 'Zehirle',
  cost: 1,
  type: 'skill',
  description: 'Düşmana 3 Zehir uygula.',
  effects: [{ kind: 'applyStatus', status: 'poison', amount: 3, target: 'enemy' }],
}
