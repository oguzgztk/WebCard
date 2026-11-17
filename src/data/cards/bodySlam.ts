import type { CardDefinition } from '@/game/types'

/** Yakın mesafe darbesi — hasara ek savunması kırığı vuruş kümesini güçlendirir. */
export const bodySlam: CardDefinition = {
  id: 'body_slam',
  name: 'Gövde Darbesi',
  cost: 2,
  type: 'attack',
  description: '14 hasar ver. Düşmana 2 tur savunması kırığı uygula.',
  effects: [
    { kind: 'damage', amount: 14, target: 'enemy' },
    { kind: 'applyStatus', status: 'vulnerable', amount: 2, target: 'enemy' },
  ],
}
