import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import type { EventOutcome } from '@/data/events'
import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { upgradeCard } from '@/game/cardUpgrades'
import {
  applyRelicReward,
  applyRestHeal,
  applyRewardCard,
  buyShopCard,
  enterCombatNode,
  enterEventNode,
  enterShop,
  generateRun,
  getCardShopPrice,
  leaveShop,
  removeShopCard,
  resolveBossVictory,
  resolveEventChoice,
  resolveNodeReward,
  resolveRestNode,
  skipRest,
} from '@/game/runEngine'
import type { RunState } from '@/game/runTypes'
import { clearCombatSave } from '@/game/store/combatSave'
import { sanitizeSeed } from '@/lib/rng'

const SAVE_KEY = 'webcard_run_v1'

function saveRun(run: RunState | null) {
  try {
    if (run) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(run))
    } else {
      localStorage.removeItem(SAVE_KEY)
    }
  } catch { /* storage dolu vb. */ }
}

function loadSavedRun(): RunState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? (JSON.parse(raw) as RunState) : null
  } catch {
    return null
  }
}

type RunStore = {
  run: RunState | null

  /** Kaydedilmiş koşu varsa döndürür (Continue butonu için). */
  hasSavedRun: () => boolean

  /** Kaydedilmiş koşuyu yükle. */
  loadRun: () => void

  /** Yeni koşu başlat. */
  startRun: (masterSeed?: number, characterId?: string) => void

  /** Savaş/elite/boss düğümü tamamlandı; ödül hesapla. */
  completeCombatNode: (playerHpAfterCombat: number) => void

  /** Boss düğümü tamamlandı; koşu galibiyeti. */
  completeBossNode: (playerHpAfterCombat: number) => void

  /** Haritada savaş/elit/boss düğümü seçildi. */
  enterCombatNodeAction: () => void

  /** Oyuncu mola düğümüne girdi. */
  enterRestNode: () => void

  /** Mola ekranında iyileş seçeneği. */
  chooseHeal: () => void

  /** Mola ekranında pas geç. */
  chooseSkipRest: () => void

  /** Ödül ekranından kart seç (null = atla). */
  selectRewardCard: (defId: string | null) => void

  /** Relic ödülü ekranından relic seç (null = atla). */
  selectRelicReward: (relicId: string | null) => void

  /** Yenilgi (savaşta can bitince). */
  defeatRun: () => void

  /**
   * Molada kart yükseltme: desteki `defId` olan kartı `defId+` sürümüyle değiştirir.
   * Yükseltilebilir değilse işlem yapmaz.
   */
  upgradeCardInDeck: (defId: string) => void

  /** Mağaza düğümüne gir. */
  enterShopNode: () => void
  /** Mağazadan kart satın al. */
  buyCardFromShop: (defId: string) => void
  /** Desteden kart çıkar (ücretli). */
  removeCardFromDeck: (defId: string) => void
  /** Mağazadan çık ve haritaya dön. */
  leaveShopNode: () => void

  /** Event düğümüne gir. */
  enterEventNodeAction: () => void
  /** Event seçeneği seç. */
  resolveEventChoiceAction: (outcome: EventOutcome) => void

  /** Ana menüye dön; koşu (ve süren savaş) kayıtlı kalır, "Devam et" ile sürer. */
  exitToMenu: () => void

  /** Koşuyu tamamen terk et (kayıt silinir). */
  abandonRun: () => void
}

export const useRunStore = create(
  immer<RunStore>((set, get) => ({
    run: null,

    hasSavedRun() {
      try { return Boolean(localStorage.getItem(SAVE_KEY)) } catch { return false }
    },

    loadRun() {
      const saved = loadSavedRun()
      if (saved) set((draft) => { draft.run = saved })
    },

    startRun(masterSeed, characterId = 'demirci') {
      const seed = masterSeed !== undefined ? masterSeed : Date.now()
      const newRun = generateRun(sanitizeSeed(seed), characterId)
      saveRun(newRun)
      set((draft) => { draft.run = newRun })
    },

    completeCombatNode(playerHpAfterCombat) {
      const run = get().run
      if (!run) return
      const node = run.nodes[run.currentNodeIndex]
      if (!node || node.kind === 'boss') return
      set((draft) => {
        draft.run = resolveNodeReward(run, playerHpAfterCombat)
      })
    },

    completeBossNode(playerHpAfterCombat) {
      const run = get().run
      if (!run) return
      set((draft) => {
        draft.run = resolveBossVictory(run, playerHpAfterCombat)
      })
    },

    enterCombatNodeAction() {
      const run = get().run
      if (!run) return
      set((draft) => { draft.run = enterCombatNode(run) })
    },

    enterRestNode() {
      const run = get().run
      if (!run) return
      set((draft) => {
        draft.run = resolveRestNode(run)
      })
    },

    chooseHeal() {
      const run = get().run
      if (!run) return
      set((draft) => {
        draft.run = applyRestHeal(run)
      })
    },

    chooseSkipRest() {
      const run = get().run
      if (!run) return
      set((draft) => {
        draft.run = skipRest(run)
      })
    },

    selectRewardCard(defId) {
      const run = get().run
      if (!run) return
      set((draft) => {
        draft.run = applyRewardCard(run, defId)
      })
    },

    selectRelicReward(relicId) {
      const run = get().run
      if (!run) return
      set((draft) => {
        draft.run = applyRelicReward(run, relicId)
      })
    },

    defeatRun() {
      set((draft) => {
        if (draft.run) draft.run.phase = 'run_defeat'
      })
    },

    enterShopNode() {
      const run = get().run
      if (!run) return
      set((draft) => { draft.run = enterShop(run) })
    },

    buyCardFromShop(defId) {
      const run = get().run
      if (!run) return
      const price = getCardShopPrice(defId)
      set((draft) => { draft.run = buyShopCard(run, defId, price) })
    },

    removeCardFromDeck(defId) {
      const run = get().run
      if (!run) return
      set((draft) => { draft.run = removeShopCard(run, defId) })
    },

    leaveShopNode() {
      const run = get().run
      if (!run) return
      set((draft) => { draft.run = leaveShop(run) })
    },

    upgradeCardInDeck(defId) {
      const run = get().run
      if (!run) return
      const baseDef = CARD_DEFINITIONS_MAP[defId]
      if (!baseDef || baseDef.isUpgraded) return
      const upgradedDef = upgradeCard(baseDef)
      if (!upgradedDef) return

      // Destede ilk eşleşen kartı yükselt
      const idx = run.deckDefIds.indexOf(defId)
      if (idx === -1) return

      set((draft) => {
        if (!draft.run) return
        const newDeck = [...draft.run.deckDefIds]
        newDeck[idx] = upgradedDef.id
        draft.run.deckDefIds = newDeck
        draft.run.phase = 'map'
        draft.run.currentNodeIndex = run.currentNodeIndex + 1
      })
    },

    enterEventNodeAction() {
      const run = get().run
      if (!run) return
      set((draft) => { draft.run = enterEventNode(run) })
    },

    resolveEventChoiceAction(outcome) {
      const run = get().run
      if (!run) return
      set((draft) => { draft.run = resolveEventChoice(run, outcome) })
    },

    exitToMenu() {
      // Kayda dokunmadan bellekteki koşuyu bırak
      set((draft) => { draft.run = null })
    },

    abandonRun() {
      saveRun(null)
      clearCombatSave()
      set((draft) => { draft.run = null })
    },
  })),
)

// Her run değişikliğinde otomatik kayıt
// Her run değişikliğinde otomatik kayıt. `run === null` kaydı silmez:
// menüye dönüş (exitToMenu) kaydı korur, silme yalnızca abandonRun'da.
useRunStore.subscribe((state, prev) => {
  if (state.run === prev.run || !state.run) return
  saveRun(state.run)
  // Savaş fazı dışına çıkıldıysa (ödül, yenilgi, harita…) savaş ara kaydı geçersiz
  if (state.run.phase !== 'combat') clearCombatSave()
})
