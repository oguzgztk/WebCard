import { create } from 'zustand'

import type { EventOutcome } from '@/data/events'
import {
  applyRelicReward,
  applyRestHeal,
  applyRestUpgrade,
  applyRewardCard,
  buyShopCard,
  buyShopPotion,
  buyShopRelic,
  discardPotion,
  generateRun,
  leaveShop,
  removeShopCard,
  resolveCombatDefeat,
  resolveCombatVictory,
  resolveEventChoice,
  selectNode,
  skipRest,
} from '@/game/runEngine'
import type { Difficulty, RunState } from '@/game/runTypes'
import {
  clearCombatSave,
  clearLegacySaves,
  hasSavedRun,
  loadRun,
  saveRun,
  updateMeta,
} from '@/game/store/persistence'
import type { CombatStats } from '@/game/types'

type RunStore = {
  run: RunState | null
  hasSavedRun: () => boolean
  loadRun: () => void
  startRun: (masterSeed: number, characterId: string, difficulty?: Difficulty, daily?: boolean) => void
  selectNode: (nodeId: string) => void
  completeCombat: (playerHp: number, stats?: Partial<CombatStats>, potionsLeft?: ReadonlyArray<string>) => void
  defeatRun: (stats?: Partial<CombatStats>) => void
  chooseHeal: () => void
  chooseSkipRest: () => void
  upgradeCardInDeck: (defId: string) => void
  selectRewardCard: (defId: string | null) => void
  /** Relic ödülü veya hazine seçimi (null = atla). */
  selectRelicReward: (relicId: string | null) => void
  buyCard: (defId: string) => void
  buyRelic: () => void
  buyPotion: (potionId: string) => void
  discardPotion: (index: number) => void
  removeCard: (defId: string) => void
  leaveShop: () => void
  resolveEvent: (outcome: EventOutcome) => void
  /** Ana menüye dön; koşu (ve süren savaş) kayıtlı kalır. */
  exitToMenu: () => void
  /** Koşuyu tamamen terk et (kayıt silinir). */
  abandonRun: () => void
}

/** Saf `runEngine` dönüşümünü mevcut koşuya uygular. */
function apply(set: (fn: (s: RunStore) => Partial<RunStore>) => void, fn: (run: RunState) => RunState) {
  set((s) => (s.run ? { run: fn(s.run) } : {}))
}

export const useRunStore = create<RunStore>((set) => ({
  run: null,

  hasSavedRun,

  loadRun() {
    const saved = loadRun()
    if (saved) set({ run: saved })
  },

  startRun(masterSeed, characterId, difficulty = 'normal', daily = false) {
    clearLegacySaves()
    clearCombatSave()
    updateMeta((m) => ({ ...m, runsStarted: m.runsStarted + 1 }))
    set({ run: { ...generateRun(masterSeed, characterId, difficulty), daily } })
  },

  selectNode: (nodeId) => apply(set, (r) => selectNode(r, nodeId)),
  completeCombat: (hp, stats, potions) => apply(set, (r) => resolveCombatVictory(r, hp, stats, potions)),
  defeatRun: (stats) => apply(set, (r) => resolveCombatDefeat(r, stats)),
  chooseHeal: () => apply(set, applyRestHeal),
  chooseSkipRest: () => apply(set, skipRest),
  upgradeCardInDeck: (defId) => apply(set, (r) => applyRestUpgrade(r, defId)),
  selectRewardCard: (defId) => apply(set, (r) => applyRewardCard(r, defId)),
  selectRelicReward: (relicId) => apply(set, (r) => applyRelicReward(r, relicId)),
  buyCard: (defId) => apply(set, (r) => buyShopCard(r, defId)),
  buyRelic: () => apply(set, buyShopRelic),
  buyPotion: (id) => apply(set, (r) => buyShopPotion(r, id)),
  discardPotion: (i) => apply(set, (r) => discardPotion(r, i)),
  removeCard: (defId) => apply(set, (r) => removeShopCard(r, defId)),
  leaveShop: () => apply(set, leaveShop),
  resolveEvent: (outcome) => apply(set, (r) => resolveEventChoice(r, outcome)),

  exitToMenu() {
    set({ run: null })
  },

  abandonRun() {
    saveRun(null)
    clearCombatSave()
    set({ run: null })
  },
}))

// Her run değişikliğinde otomatik kayıt. `run === null` kaydı silmez (menüye dönüş);
// silme yalnızca abandonRun'da. Koşu bitince meta istatistikleri güncellenir.
useRunStore.subscribe((state, prev) => {
  const run = state.run
  if (run === prev.run || !run) return
  saveRun(run)
  if (run.phase !== 'combat') clearCombatSave()

  const ended = run.phase === 'run_victory' || run.phase === 'run_defeat'
  const wasEnded = prev.run?.phase === 'run_victory' || prev.run?.phase === 'run_defeat'
  if (ended && !wasEnded) {
    const won = run.phase === 'run_victory'
    updateMeta((m) => ({
      ...m,
      wins: m.wins + (won ? 1 : 0),
      hardWins: m.hardWins + (won && run.difficulty === 'hard' ? 1 : 0),
      bestFloor: Math.max(m.bestFloor, run.stats.floorsCleared),
      winsByCharacter: won
        ? { ...m.winsByCharacter, [run.characterId]: (m.winsByCharacter[run.characterId] ?? 0) + 1 }
        : m.winsByCharacter,
    }))
  }
})

if (import.meta.env.DEV) {
  const exposed = window as typeof window & { __RUN_STORE__?: typeof useRunStore }
  exposed.__RUN_STORE__ = useRunStore
}
