/** Karşılaşma havuzları — harita üretimi perde, kat ve düğüm türüne göre buradan seçer. */

export type EncounterTier = 'easy' | 'normal' | 'elite' | 'boss'

export interface Encounter {
  enemyDefIds: string[]
  weight: number
}

export interface ActDefinition {
  /** Perde adı (geçiş ekranı, HUD). */
  name: string
  subtitle: string
  encounters: Record<EncounterTier, Encounter[]>
}

export const ACTS: Record<number, ActDefinition> = {
  1: {
    name: 'Zindan',
    subtitle: 'Karanlık koridorlar; sonunda Gölge Efendisi ya da Şahmeran bekler',
    encounters: {
      /** İlk 3 kat — tek düşman veya zayıf ikili. */
      easy: [
        { enemyDefIds: ['jaw_worm'], weight: 3 },
        { enemyDefIds: ['cultist'], weight: 3 },
        { enemyDefIds: ['louse', 'louse'], weight: 2 },
        { enemyDefIds: ['bat', 'bat'], weight: 2 },
        { enemyDefIds: ['bandit'], weight: 2 },
        { enemyDefIds: ['mushroom', 'mushroom', 'mushroom'], weight: 1 },
      ],
      normal: [
        { enemyDefIds: ['jaw_worm'], weight: 2 },
        { enemyDefIds: ['bandit', 'louse'], weight: 2 },
        { enemyDefIds: ['mushroom', 'mushroom', 'cultist'], weight: 1 },
        { enemyDefIds: ['bandit', 'bat'], weight: 1 },
        { enemyDefIds: ['cultist'], weight: 2 },
        { enemyDefIds: ['skeleton'], weight: 2 },
        { enemyDefIds: ['louse', 'louse', 'louse'], weight: 2 },
        { enemyDefIds: ['bat', 'bat', 'bat'], weight: 2 },
        { enemyDefIds: ['cultist', 'bat'], weight: 2 },
        { enemyDefIds: ['louse', 'skeleton'], weight: 1 },
        { enemyDefIds: ['jaw_worm', 'bat'], weight: 1 },
      ],
      elite: [
        { enemyDefIds: ['fungibeast'], weight: 1 },
        { enemyDefIds: ['stone_golem'], weight: 1 },
        { enemyDefIds: ['skeleton', 'skeleton'], weight: 1 },
        { enemyDefIds: ['karakoncolos'], weight: 1 },
      ],
      boss: [
        { enemyDefIds: ['shadow_lord'], weight: 1 },
        { enemyDefIds: ['sahmeran'], weight: 1 },
      ],
    },
  },
  2: {
    name: 'Kemik Mahzenleri',
    subtitle: 'Efendinin altında, daha eski ve daha aç bir şey uyuyor',
    encounters: {
      easy: [
        { enemyDefIds: ['gargoyle'], weight: 2 },
        { enemyDefIds: ['wraith'], weight: 2 },
        { enemyDefIds: ['spider', 'spider'], weight: 2 },
        { enemyDefIds: ['skeleton', 'skeleton'], weight: 1 },
        { enemyDefIds: ['gulyabani'], weight: 2 },
        { enemyDefIds: ['albasti'], weight: 2 },
      ],
      normal: [
        { enemyDefIds: ['gargoyle'], weight: 2 },
        { enemyDefIds: ['necromancer', 'skeleton'], weight: 2 },
        { enemyDefIds: ['gulyabani', 'spider'], weight: 2 },
        { enemyDefIds: ['albasti', 'wraith'], weight: 1 },
        { enemyDefIds: ['necromancer', 'skeleton', 'skeleton'], weight: 1 },
        { enemyDefIds: ['wraith', 'wraith'], weight: 2 },
        { enemyDefIds: ['spider', 'spider', 'spider'], weight: 2 },
        { enemyDefIds: ['skeleton', 'spider'], weight: 2 },
        { enemyDefIds: ['skeleton', 'wraith'], weight: 2 },
        { enemyDefIds: ['cultist', 'cultist'], weight: 1 },
        { enemyDefIds: ['gargoyle', 'spider'], weight: 1 },
      ],
      elite: [
        { enemyDefIds: ['fallen_knight'], weight: 1 },
        { enemyDefIds: ['crypt_witch'], weight: 1 },
        { enemyDefIds: ['gargoyle', 'gargoyle'], weight: 1 },
        { enemyDefIds: ['tepegoz'], weight: 1 },
      ],
      boss: [{ enemyDefIds: ['bone_dragon'], weight: 1 }],
    },
  },
}

export const ACT_COUNT = Object.keys(ACTS).length
