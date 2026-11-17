/** Lobi → savaş geçişi için sabit seçenek kimliği */
export type BattleChoice = Readonly<{
  seed: number
  enemyDefId: string
  label: string
  /** Koşu modunda: run'ın güncel destesi. Belirtilmezse başlangıç destesi kullanılır. */
  deckDefinitionIds?: ReadonlyArray<string>
  /** Koşu modunda: run'dan taşınan mevcut can. Belirtilmezse tam can başlar. */
  playerCurrentHp?: number
  /** Koşu modunda: oyuncunun maksimum canı. Belirtilmezse sabit değer kullanılır. */
  playerMaxHp?: number
  /** Koşu modunda: aktif relic ID listesi. */
  relicIds?: ReadonlyArray<string>
  /** Koşu modunda: savaş ara kaydı anahtarı (düğüm ID'si). Yoksa savaş kaydedilmez. */
  persistKey?: string
}>
