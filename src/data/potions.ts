/** İksirler — tek kullanımlık, enerji harcamaz; etkileri kartlarla aynı `Effect` dilini kullanır. */

import type { Effect } from '@/game/types'

export interface PotionDefinition {
  id: string
  name: string
  icon: string
  rarity: 'common' | 'uncommon' | 'rare'
  effects: Effect[]
}

export const ALL_POTIONS: readonly PotionDefinition[] = [
  { id: 'heal_potion', name: 'Şifa İksiri', icon: '🧪', rarity: 'common', effects: [{ kind: 'heal', amount: 12 }] },
  { id: 'block_potion', name: 'Kalkan İksiri', icon: '🛡', rarity: 'common', effects: [{ kind: 'block', amount: 10 }] },
  { id: 'fire_potion', name: 'Ateş İksiri', icon: '🔥', rarity: 'common', effects: [{ kind: 'damage', amount: 15, target: 'enemy' }] },
  { id: 'explosive_potion', name: 'Patlayıcı İksir', icon: '💥', rarity: 'common', effects: [{ kind: 'damage', amount: 8, target: 'allEnemies' }] },
  { id: 'swift_potion', name: 'Çabukluk İksiri', icon: '🌀', rarity: 'common', effects: [{ kind: 'draw', amount: 3 }] },
  { id: 'weak_potion', name: 'Zayıflık İksiri', icon: '🥀', rarity: 'common', effects: [{ kind: 'applyStatus', status: 'weak', amount: 3, target: 'enemy' }] },
  { id: 'poison_potion', name: 'Zehir Şişesi', icon: '☠', rarity: 'uncommon', effects: [{ kind: 'applyStatus', status: 'poison', amount: 6, target: 'enemy' }] },
  { id: 'energy_potion', name: 'Enerji İksiri', icon: '⚡', rarity: 'uncommon', effects: [{ kind: 'gainEnergy', amount: 2 }] },
  { id: 'strength_potion', name: 'Güç İksiri', icon: '💪', rarity: 'uncommon', effects: [{ kind: 'applyStatus', status: 'strength', amount: 2, target: 'self' }] },
  { id: 'iron_potion', name: 'Demir İksiri', icon: '🔩', rarity: 'rare', effects: [{ kind: 'applyStatus', status: 'metallicize', amount: 3, target: 'self' }] },
]

export const POTION_MAP: Record<string, PotionDefinition> = Object.fromEntries(ALL_POTIONS.map((p) => [p.id, p]))

export const POTION_SLOTS = 3

/** İksir tek bir düşmanı mı hedefliyor? (birden çok düşmanda hedef seçimi gerekir) */
export function potionNeedsTarget(id: string) {
  return POTION_MAP[id]?.effects.some((e) => 'target' in e && e.target === 'enemy') ?? false
}
