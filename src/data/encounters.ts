/** Karşılaşma havuzları — harita üretimi kat ve düğüm türüne göre buradan seçer. */

export type EncounterTier = 'easy' | 'normal' | 'elite' | 'boss'

export interface Encounter {
  enemyDefIds: string[]
  weight: number
}

export const ENCOUNTERS: Record<EncounterTier, Encounter[]> = {
  /** İlk 3 kat — tek düşman veya zayıf ikili. */
  easy: [
    { enemyDefIds: ['jaw_worm'], weight: 3 },
    { enemyDefIds: ['cultist'], weight: 3 },
    { enemyDefIds: ['louse', 'louse'], weight: 2 },
    { enemyDefIds: ['bat', 'bat'], weight: 2 },
  ],
  normal: [
    { enemyDefIds: ['jaw_worm'], weight: 2 },
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
  ],
  boss: [{ enemyDefIds: ['shadow_lord'], weight: 1 }],
}
