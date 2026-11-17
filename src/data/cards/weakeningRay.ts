import type { CardDefinition } from '@/game/types'

export const weakeningRay: CardDefinition = {
  id: 'weakening_ray',
  name: 'Weakening Ray',
  cost: 0,
  type: 'skill',
  description: 'Düşmana 2 tur süresince zayıf (çıkan hasarı %25 düşürür) uygular.',
  effects: [{ kind: 'applyStatus', status: 'weak', amount: 2, target: 'enemy' }],
}
