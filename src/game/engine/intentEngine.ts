import { ENEMY_DEFINITIONS_MAP } from '@/data/enemies'
import type { EnemyRuntime, GameState } from '@/game/types'

/** Niyeti tanımla — indeks sırasını senk etmek için savaş sırasından okunur */
export function syncEnemyIntents(state: GameState): GameState {
  const idx = state.enemyIntentIndex
  let enemies = [...state.enemies]

  enemies = enemies.map((enemyRuntime) => {
    const blueprint = ENEMY_DEFINITIONS_MAP[enemyRuntime.defId]
    const intent = blueprint.intentScript(idx + (enemyRuntime.intentOffset ?? 0))
    return { ...enemyRuntime, intent }
  })

  return { ...state, enemies }
}

export function wipeEnemyTransientBlock(enemies: EnemyRuntime[]): EnemyRuntime[] {
  return enemies.map((enemy) => ({ ...enemy, block: 0 }))
}
