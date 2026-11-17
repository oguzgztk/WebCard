import type { CardDefinition } from '@/game/types'

/** Öfke Patlaması — 2 güç kazan, sonra yüklenir. */
export const rageBurst: CardDefinition = {
  id: 'rage_burst',
  name: 'Öfke Patlaması',
  cost: 1,
  type: 'skill',
  description: '2 güç kazan. Tüket.',
  effects: [{ kind: 'applyStatus', status: 'strength', amount: 2, target: 'self' }],
  exhaust: true,
}
