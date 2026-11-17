import { useGameStore } from '@/game/store/gameStore'
import type { GameState } from '@/game/types'

export type GameStoreState = ReturnType<typeof useGameStore.getState>

export const selectGame = (store: GameStoreState) => store.game

export const selectHand = (store: GameStoreState) => store.game.hand

export const selectPlayer = (store: GameStoreState) => store.game.player

export const selectEnemies = (store: GameStoreState) => store.game.enemies

export const selectPhase = (store: GameStoreState) => store.game.phase

export const selectPiles = (store: GameStoreState) =>
  ({
    draw: store.game.drawPile.length,
    discard: store.game.discardPile.length,
  }) as const

export const selectTurnLabel = (store: GameStoreState) => store.game.playerTurnCount

export const selectTargetMode = (store: GameStoreState) => store.targetMode

export const selectDeckMetrics = (store: GameStoreState) => {
  const { drawPile, discardPile, hand } = store.game
  return {
    draw: drawPile.length,
    discard: discardPile.length,
    hand: hand.length,
  }
}

export const isPlayerTurn = (state: GameState) => state.phase === 'playerTurn'
