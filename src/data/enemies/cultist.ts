import type { EnemyDefinition } from '@/game/types'

/** Ritüel koruma + lanet + ardışık vuruşlar; uzun sürece dönüş kanlı. */
export const cultist: EnemyDefinition = {
  id: 'cultist',
  name: 'Cultist',
  maxHp: 72,
  intentScript(intentIndex: number): ReturnType<EnemyDefinition['intentScript']> {
    const i = intentIndex % 7
    switch (i) {
      case 0:
        return { kind: 'attack', value: 16 }
      case 1:
        return { kind: 'buff', value: 3 }
      case 2:
        return { kind: 'apply_player_vulnerable', value: 3 }
      case 3:
        return { kind: 'attack', value: 8, hits: 2 }
      case 4:
        return { kind: 'attack', value: 18 }
      case 5:
        return { kind: 'apply_player_weak', value: 3 }
      default:
        return { kind: 'defend', value: 13 }
    }
  },
}
