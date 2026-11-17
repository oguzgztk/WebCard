import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import type { BattleChoice } from '@/game/battleChoice'
import { endPlayerTurn, playCard, startCombat } from '@/game/engine/combatEngine'
import { loadCombat, saveCombat } from '@/game/store/combatSave'
import type { GameState } from '@/game/types'

const DEFAULT_SEED = 4242

export interface TargetModeState {
  cardInstanceId: string
}

type CombatSlice = Readonly<{
  game: GameState
  targetMode: TargetModeState | null
  /** Doluysa her değişiklikte savaş bu anahtarla kaydedilir (koşu modu). */
  persistKey: string | null
}>

export type CombatStore = CombatSlice &
  Readonly<{
    startNewCombat: (
      seed?: number,
      enemyDefId?: string,
      deckDefinitionIds?: ReadonlyArray<string> | null,
      playerCurrentHp?: number | null,
      playerMaxHp?: number | null,
      relicIds?: ReadonlyArray<string> | null,
    ) => void
    /** `battle.persistKey` ile eşleşen kayıt varsa onu yükler, yoksa yeni savaş başlatır. */
    resumeOrStartCombat: (battle: BattleChoice) => void
    /** store eylemi — UI doğrudan `playCard(...)` yazmasın diye daha açık isimlendirildi */
    playCardAction: (instanceId: string, enemyUid?: string | null) => void
    endTurn: (relicIds?: ReadonlyArray<string>) => void
    enterTargetMode: (instanceId: string) => void
    /** DEV ONLY: tüm düşmanları anında öldür. */
    devKillAllEnemies: () => void
    cancelTargetMode: () => void
  }>

export const useGameStore = create(
  immer<CombatStore>((set, get) => ({
    game: startCombat({ seed: DEFAULT_SEED, enemyDefId: 'jaw_worm' }),
    targetMode: null,
    persistKey: null,

    resumeOrStartCombat(battle) {
      const key = battle.persistKey ?? null
      const saved = key ? loadCombat(key) : null
      set((draft) => {
        draft.game =
          saved ??
          startCombat({
            seed: battle.seed,
            enemyDefId: battle.enemyDefId,
            deckDefinitionIds: battle.deckDefinitionIds,
            playerCurrentHp: battle.playerCurrentHp,
            playerMaxHp: battle.playerMaxHp,
            relicIds: battle.relicIds,
          })
        draft.targetMode = null
        draft.persistKey = key
      })
    },

    startNewCombat(seed = DEFAULT_SEED, enemyDefId = 'jaw_worm', deckDefinitionIds, playerCurrentHp, playerMaxHp, relicIds) {
      set((draft) => {
        draft.game = startCombat({
          seed: seed ?? DEFAULT_SEED,
          enemyDefId: enemyDefId ?? 'jaw_worm',
          deckDefinitionIds: deckDefinitionIds ?? undefined,
          playerCurrentHp: playerCurrentHp ?? undefined,
          playerMaxHp: playerMaxHp ?? undefined,
          relicIds: relicIds ?? undefined,
        })
        draft.targetMode = null
        draft.persistKey = null
      })
    },

    playCardAction(instanceId, enemyUid = null) {
      set((draft) => {
        draft.game = playCard(get().game, instanceId, enemyUid, CARD_DEFINITIONS_MAP)
        draft.targetMode = null
      })
    },

    endTurn(relicIds?: ReadonlyArray<string>) {
      if (get().game.phase !== 'playerTurn') return
      set((draft) => {
        draft.game = endPlayerTurn(get().game, relicIds)
        draft.targetMode = null
      })
    },

    enterTargetMode(instanceId) {
      if (get().game.phase !== 'playerTurn') return
      set((draft) => {
        draft.targetMode = { cardInstanceId: instanceId }
      })
    },

    cancelTargetMode() {
      set((draft) => {
        draft.targetMode = null
      })
    },

    devKillAllEnemies() {
      set((draft) => {
        draft.game = {
          ...draft.game,
          enemies: [],
          phase: 'victory',
        }
        draft.targetMode = null
      })
    },
  })),
)

// Koşu savaşını her değişiklikte kaydet
useGameStore.subscribe((state, prev) => {
  if (state.persistKey && state.game !== prev.game) {
    saveCombat(state.persistKey, state.game)
  }
})

if (import.meta.env.DEV) {
  const exposed = window as typeof window & { __GAME_STORE__?: typeof useGameStore }
  exposed.__GAME_STORE__ = useGameStore
}
