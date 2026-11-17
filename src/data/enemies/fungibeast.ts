import type { EnemyDefinition } from '@/game/types'

/** Yavaş ama ağır — blok biriktirir, sonra savunması kırığı + büyük darbe döngüsü kurar. */
export const fungibeast: EnemyDefinition = {
  id: 'fungibeast',
  name: 'Mantar Canavarı',
  maxHp: 94,
  intentScript(intentIndex: number): ReturnType<EnemyDefinition['intentScript']> {
    const i = intentIndex % 8
    switch (i) {
      case 0:
        return { kind: 'defend', value: 15 }
      case 1:
        return { kind: 'attack', value: 13 }
      case 2:
        return { kind: 'defend', value: 11 }
      case 3:
        return { kind: 'apply_player_vulnerable', value: 3 }
      case 4:
        return { kind: 'attack', value: 21 }
      case 5:
        return { kind: 'buff', value: 2 }
      case 6:
        return { kind: 'attack', value: 16 }
      default:
        return { kind: 'defend', value: 17 }
    }
  },
}
