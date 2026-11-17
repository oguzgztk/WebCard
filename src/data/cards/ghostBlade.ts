import type { CardDefinition } from '@/game/types'

/** Hayalet kılıcı — bu tur oynanmazsa kaybolur. */
export const ghostBlade: CardDefinition = {
  id: 'ghost_blade',
  name: 'Hayalet Kılıcı',
  cost: 1,
  type: 'attack',
  description: '10 hasar ver. Geçici.',
  effects: [{ kind: 'damage', amount: 10, target: 'enemy' }],
  ethereal: true,
}
