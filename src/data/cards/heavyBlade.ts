import type { CardDefinition } from '@/game/types'

export const heavyBlade: CardDefinition = {
  id: 'heavy_blade',
  name: 'Heavy Blade',
  cost: 3,
  type: 'attack',
  description: '20 hasar — ağır ama tüm enerjiyi yer.',
  effects: [{ kind: 'damage', amount: 20, target: 'enemy' }],
}
