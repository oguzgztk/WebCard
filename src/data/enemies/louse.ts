import type { EnemyDefinition } from '@/game/types'

/** Hızlı ama kırılgan — oyuncuyu zayıflatır, art arda küçük darbeler vurur. */
export const louse: EnemyDefinition = {
  id: 'louse',
  name: 'Asalak',
  maxHp: 52,
  intentScript(intentIndex: number): ReturnType<EnemyDefinition['intentScript']> {
    const i = intentIndex % 6
    switch (i) {
      case 0:
        return { kind: 'attack', value: 8 }
      case 1:
        return { kind: 'apply_player_weak', value: 2 }
      case 2:
        return { kind: 'attack', value: 7, hits: 2 }
      case 3:
        return { kind: 'attack', value: 11 }
      case 4:
        return { kind: 'apply_player_vulnerable', value: 2 }
      default:
        return { kind: 'attack', value: 9 }
    }
  },
}
