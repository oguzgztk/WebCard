import type { EnemyDefinitionsMap } from '@/game/types'

import { cultist } from '@/data/enemies/cultist'
import { fungibeast } from '@/data/enemies/fungibeast'
import { jawWorm } from '@/data/enemies/jawWorm'
import { louse } from '@/data/enemies/louse'
import { shadowLord } from '@/data/enemies/shadowLord'

export const allEnemiesList = [jawWorm, cultist, louse, fungibeast, shadowLord] as const

export function buildEnemyDefinitionsMap(): EnemyDefinitionsMap {
  const acc: EnemyDefinitionsMap = {}
  for (const e of allEnemiesList) {
    acc[e.id] = e
  }
  return acc
}

export const ENEMY_DEFINITIONS_MAP = buildEnemyDefinitionsMap()
