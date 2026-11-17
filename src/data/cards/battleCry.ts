import type { CardDefinition } from '@/game/types'

/** El genişletme — sürece anlık bir ivme katar. */
export const battleCry: CardDefinition = {
  id: 'battle_cry',
  name: 'Savaş Nidası',
  cost: 1,
  type: 'skill',
  description: '3 kart çek.',
  effects: [{ kind: 'draw', amount: 3 }],
}
