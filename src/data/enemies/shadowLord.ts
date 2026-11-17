import type { EnemyDefinition } from '@/game/types'

/** Boss düşmanı — yüksek can, çoklu vuruş ve güç biriktirme döngüsü. */
export const shadowLord: EnemyDefinition = {
  id: 'shadow_lord',
  name: 'Gölge Efendisi',
  maxHp: 210,
  intentScript(intentIndex: number): ReturnType<EnemyDefinition['intentScript']> {
    const i = intentIndex % 10
    switch (i) {
      case 0:
        return { kind: 'buff', value: 3 }
      case 1:
        return { kind: 'attack', value: 18 }
      case 2:
        return { kind: 'defend', value: 20 }
      case 3:
        return { kind: 'attack', value: 12, hits: 2 }
      case 4:
        return { kind: 'apply_player_vulnerable', value: 3 }
      case 5:
        return { kind: 'attack', value: 24 }
      case 6:
        return { kind: 'defend', value: 16 }
      case 7:
        return { kind: 'attack', value: 10, hits: 3 }
      case 8:
        return { kind: 'apply_player_weak', value: 3 }
      default:
        return { kind: 'attack', value: 28 }
    }
  },
}
