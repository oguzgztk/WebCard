/**
 * Relic (Yadigâr) sistemi.
 * Pasif güçler — hook noktalarında GameState veya RunState üzerinde efekt uygular.
 */

import { drawCards } from '@/game/engine/deckEngine'
import type { GameState } from '@/game/types'
import type { RunState } from '@/game/runTypes'
import { rngFloat01 } from '@/lib/rng'

// ---------------------------------------------------------------------------
// Tip tanımları
// ---------------------------------------------------------------------------

export type RelicTier = 'common' | 'uncommon' | 'rare' | 'boss'

export interface RelicDefinition {
  id: string
  name: string
  description: string
  tier: RelicTier
  /** Emoji veya tek karakter ikon (UI'da küçük rozet). */
  icon: string
}

// ---------------------------------------------------------------------------
// Relic tanımları
// ---------------------------------------------------------------------------

export const ALL_RELICS: ReadonlyArray<RelicDefinition> = [
  // Common
  {
    id: 'anchor',
    name: 'Demir Çapa',
    description: 'Her savaş başında 10 Blok kazan.',
    tier: 'common',
    icon: '⚓',
  },
  {
    id: 'bag_of_prep',
    name: 'Hazırlık Çantası',
    description: 'Her savaş başında 2 ekstra kart çek.',
    tier: 'common',
    icon: '🎒',
  },
  {
    id: 'happy_flower',
    name: 'Mutlu Çiçek',
    description: 'Her 3 turda 1 Enerji kazan.',
    tier: 'common',
    icon: '🌸',
  },
  // Uncommon
  {
    id: 'burning_blood',
    name: 'Kızıl Kan',
    description: 'Her savaş sonu 6 can kazan.',
    tier: 'uncommon',
    icon: '🩸',
  },
  {
    id: 'vajra',
    name: 'Vajra',
    description: 'Her savaş başında 1 Güç kazan.',
    tier: 'uncommon',
    icon: '⚡',
  },
  // Rare
  {
    id: 'philosophers_stone',
    name: 'Felsefe Taşı',
    description: 'Her tur başı 1 ekstra Enerji kazan. Düşmanlar savaş başı 1 Güç kazanır.',
    tier: 'rare',
    icon: '💎',
  },
  {
    id: 'meat_on_the_bone',
    name: 'Kanı Kemiklerde',
    description: 'Savaş sonunda canın %50\'nin altındaysa 12 can kazan.',
    tier: 'rare',
    icon: '🍖',
  },
]

export const RELIC_MAP: Record<string, RelicDefinition> = Object.fromEntries(
  ALL_RELICS.map((r) => [r.id, r]),
)

// ---------------------------------------------------------------------------
// Havuzlar — relic ödülü için tier'e göre
// ---------------------------------------------------------------------------

const COMMON_RELIC_IDS    = ALL_RELICS.filter((r) => r.tier === 'common').map((r) => r.id)
const UNCOMMON_RELIC_IDS  = ALL_RELICS.filter((r) => r.tier === 'uncommon').map((r) => r.id)
const RARE_RELIC_IDS      = ALL_RELICS.filter((r) => r.tier === 'rare').map((r) => r.id)

/** Ödül için 3 relic seç — tekrar yok, ağırlıklı tier. */
export function pickRelicReward(
  seed: number,
  alreadyOwned: ReadonlyArray<string>,
  count = 3,
): { relics: ReadonlyArray<string>; nextSeed: number } {
  // Ağırlıklı havuz: common×6 + uncommon×3 + rare×1
  const pool: string[] = [
    ...COMMON_RELIC_IDS.flatMap((id) => Array(6).fill(id)),
    ...UNCOMMON_RELIC_IDS.flatMap((id) => Array(3).fill(id)),
    ...RARE_RELIC_IDS.flatMap((id) => Array(1).fill(id)),
  ].filter((id) => !alreadyOwned.includes(id))

  if (pool.length === 0) return { relics: [], nextSeed: seed }

  let s = seed
  const picked: string[] = []
  const usedIds = new Set<string>()
  let attempts = 0

  while (picked.length < count && attempts < pool.length * 3) {
    const { float, nextSeed } = rngFloat01(s)
    s = nextSeed
    const candidate = pool[Math.floor(float * pool.length)]!
    attempts++
    if (!usedIds.has(candidate)) {
      usedIds.add(candidate)
      picked.push(candidate)
    }
  }

  return { relics: picked, nextSeed: s }
}

// ---------------------------------------------------------------------------
// Hook fonksiyonları — GameState üzerinde
// ---------------------------------------------------------------------------

/**
 * Savaş başlangıcında çalışır: Çapa, Hazırlık Çantası, Vajra, Felsefe Taşı.
 */
export function applyRelicsOnCombatStart(
  state: GameState,
  relicIds: ReadonlyArray<string>,
): GameState {
  let next = state

  for (const id of relicIds) {
    switch (id) {
      case 'anchor': {
        next = { ...next, player: { ...next.player, block: next.player.block + 10 } }
        break
      }
      case 'bag_of_prep': {
        // 2 ekstra kart — normal çekme kuralları (üstten çek, gerekirse karıştır)
        next = drawCards(next, 2)
        break
      }
      case 'vajra': {
        next = {
          ...next,
          player: {
            ...next.player,
            statuses: {
              ...next.player.statuses,
              strength: (next.player.statuses.strength ?? 0) + 1,
            },
          },
        }
        break
      }
      case 'philosophers_stone': {
        // Düşmanlar +1 Güç kazanır
        next = {
          ...next,
          enemies: next.enemies.map((e) => ({
            ...e,
            statuses: {
              ...e.statuses,
              strength: (e.statuses.strength ?? 0) + 1,
            },
          })),
        }
        break
      }
    }
  }

  return next
}

/**
 * Oyuncu tur başlangıcında çalışır: Mutlu Çiçek, Felsefe Taşı.
 * `playerTurnCount` 0-indexed: 0 = ilk tur.
 */
export function applyRelicsOnTurnStart(
  state: GameState,
  relicIds: ReadonlyArray<string>,
): GameState {
  let next = state

  for (const id of relicIds) {
    switch (id) {
      case 'happy_flower': {
        // Tur 2, 5, 8 … (0-indexed 3'ün katları+2) — yani her 3 turda bir
        // playerTurnCount henüz bu turu saymamış, refreshPlayerTurnResources'tan önce çağrılır
        if (next.playerTurnCount > 0 && next.playerTurnCount % 3 === 0) {
          next = { ...next, player: { ...next.player, energy: next.player.energy + 1 } }
        }
        break
      }
      case 'philosophers_stone': {
        next = { ...next, player: { ...next.player, energy: next.player.energy + 1 } }
        break
      }
    }
  }

  return next
}

/**
 * Savaş sonu (koşu boyutunda): Kızıl Kan, Kanı Kemiklerde.
 * `RunState.playerHp` zaten savaştan çıkan HP'yi tutuyor; bu fonksiyon ek iyileşme sağlar.
 */
export function applyRelicsOnCombatEnd(
  run: RunState,
  relicIds: ReadonlyArray<string>,
): RunState {
  let nextHp = run.playerHp

  for (const id of relicIds) {
    switch (id) {
      case 'burning_blood': {
        nextHp = Math.min(run.playerMaxHp, nextHp + 6)
        break
      }
      case 'meat_on_the_bone': {
        if (run.playerHp < run.playerMaxHp * 0.5) {
          nextHp = Math.min(run.playerMaxHp, nextHp + 12)
        }
        break
      }
    }
  }

  return { ...run, playerHp: nextHp }
}
