import type { EnemyDefinition } from '@/game/types'

/** Daha agresif ritim: çift vuruş, zayıflatma ve savunması kırığı ile baskı kurar. */
export const jawWorm: EnemyDefinition = {
  id: 'jaw_worm',
  name: 'Jaw Worm',
  maxHp: 66,
  intentScript(intentIndex: number): ReturnType<EnemyDefinition['intentScript']> {
    const i = intentIndex % 8
    switch (i) {
      case 0:
        return { kind: 'attack', value: 17 }
      case 1:
        return { kind: 'defend', value: 13 }
      case 2:
        return { kind: 'attack', value: 10, hits: 2 }
      case 3:
        return { kind: 'apply_player_weak', value: 2 }
      case 4:
        return { kind: 'attack', value: 20 }
      case 5:
        return { kind: 'defend', value: 17 }
      case 6:
        return { kind: 'apply_player_vulnerable', value: 2 }
      default:
        return { kind: 'attack', value: 15 }
    }
  },
}
