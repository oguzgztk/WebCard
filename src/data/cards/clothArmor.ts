import type { CardDefinition } from '@/game/types'

/** Savunma + ivme — hem blok hem bir kart daha. */
export const clothArmor: CardDefinition = {
  id: 'cloth_armor',
  name: 'Bez Zırh',
  cost: 1,
  type: 'skill',
  description: '10 blok kazan. 1 kart çek.',
  effects: [
    { kind: 'block', amount: 10 },
    { kind: 'draw', amount: 1 },
  ],
}
