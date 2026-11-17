/** Savaş başlatma parametreleri — lobi (hızlı savaş) ve koşu düğümleri ortak kullanır. */
export type BattleChoice = Readonly<{
  seed: number
  enemyDefIds: ReadonlyArray<string>
  /** Düşman can çarpanı (kat/zorluk). */
  enemyHpScale?: number
  enemyStrength?: number
  label: string
  deckDefinitionIds: ReadonlyArray<string>
  /** Koşu modunda: run'dan taşınan mevcut can. Belirtilmezse tam can başlar. */
  playerCurrentHp?: number
  playerMaxHp?: number
  relicIds?: ReadonlyArray<string>
  potions?: ReadonlyArray<string>
  potionSlots?: number
  /** Koşu modunda: savaş ara kaydı anahtarı (düğüm ID'si). Yoksa savaş kaydedilmez. */
  persistKey?: string
  /** Oyuncu paneli için karakter. */
  characterId?: string
  /** Elit/boss vurgusu. */
  tier?: 'normal' | 'elite' | 'boss'
}>
