/**
 * Koşu içi savaşın ara kaydı — sayfa yenilense veya menüye dönülse de savaş kaldığı yerden sürer.
 * Anahtar, savaşın ait olduğu harita düğümünün ID'sidir; başka düğüme ait kayıt yok sayılır.
 */

import type { GameState } from '@/game/types'

const COMBAT_SAVE_KEY = 'webcard_combat_v1'

type CombatSave = { key: string; game: GameState }

export function saveCombat(key: string, game: GameState) {
  try {
    localStorage.setItem(COMBAT_SAVE_KEY, JSON.stringify({ key, game } satisfies CombatSave))
  } catch {
    /* storage dolu / erişilemez */
  }
}

export function loadCombat(key: string): GameState | null {
  try {
    const raw = localStorage.getItem(COMBAT_SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CombatSave
    return parsed.key === key ? parsed.game : null
  } catch {
    return null
  }
}

export function clearCombatSave() {
  try {
    localStorage.removeItem(COMBAT_SAVE_KEY)
  } catch {
    /* yok say */
  }
}
