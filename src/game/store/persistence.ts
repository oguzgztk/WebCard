/**
 * localStorage kalıcılığı — koşu, süren savaş ve koşular arası meta istatistikleri.
 * Tüm erişimler try/catch içinde: gizli sekme / dolu depolama oyunu bozmaz.
 */

import { normalizeRun } from '@/game/runEngine'
import type { RunState } from '@/game/runTypes'
import type { GameState } from '@/game/types'

const RUN_KEY = 'webcard_run_v2'
const COMBAT_KEY = 'webcard_combat_v2'
const META_KEY = 'webcard_meta_v1'
const LEGACY_KEYS = ['webcard_run_v1', 'webcard_combat_v1']

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* depolama dolu / erişilemez */
  }
}

// ── Koşu ────────────────────────────────────────────────────────────────────

export function saveRun(run: RunState | null) {
  write(RUN_KEY, run)
}

export function loadRun(): RunState | null {
  const run = read<RunState>(RUN_KEY)
  return run && run.version === 2 && Array.isArray(run.nodes) ? normalizeRun(run) : null
}

export function hasSavedRun() {
  return loadRun() !== null
}

/** Eski şemadaki kayıtları temizle (uyumsuzlar). */
export function clearLegacySaves() {
  for (const k of LEGACY_KEYS) write(k, null)
}

// ── Süren savaş ─────────────────────────────────────────────────────────────

type CombatSave = { key: string; game: GameState }

export function saveCombat(key: string, game: GameState) {
  write(COMBAT_KEY, { key, game } satisfies CombatSave)
}

export function loadCombat(key: string): GameState | null {
  const save = read<CombatSave>(COMBAT_KEY)
  if (!save || save.key !== key || !save.game?.turnCounters) return null
  return { ...save.game, potions: save.game.potions ?? [] }
}

export function clearCombatSave() {
  write(COMBAT_KEY, null)
}

// ── Meta istatistikler ──────────────────────────────────────────────────────

export interface MetaStats {
  runsStarted: number
  wins: number
  hardWins: number
  bestFloor: number
  /** Karakter → galibiyet sayısı. */
  winsByCharacter: Record<string, number>
}

const EMPTY_META: MetaStats = { runsStarted: 0, wins: 0, hardWins: 0, bestFloor: 0, winsByCharacter: {} }

export function loadMeta(): MetaStats {
  return { ...EMPTY_META, ...read<MetaStats>(META_KEY) }
}

export function updateMeta(update: (m: MetaStats) => MetaStats) {
  write(META_KEY, update(loadMeta()))
}

// ── Ayarlar ─────────────────────────────────────────────────────────────────

const SETTINGS_KEY = 'webcard_settings_v1'

export interface Settings {
  sound: boolean
  /** Ambiyans müziği. */
  music: boolean
  volume: number
  haptics: boolean
  /** Animasyon hızı: düşman turu gecikmeleri bununla çarpılır. */
  fastMode: boolean
}

export const DEFAULT_SETTINGS: Settings = { sound: true, music: true, volume: 0.6, haptics: true, fastMode: false }

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Settings>(SETTINGS_KEY) }
}

export function saveSettings(s: Settings) {
  write(SETTINGS_KEY, s)
}

// ── Rehber ──────────────────────────────────────────────────────────────────

const HELP_KEY = 'webcard_help_seen'

export function hasSeenHelp() {
  return read<boolean>(HELP_KEY) === true
}

export function markHelpSeen() {
  write(HELP_KEY, true)
}
