/** Koşu (run) sistemi — `GameState` tek savaşı temsil eder; `RunState` tüm koşuyu. */

export type MapNodeKind = 'combat' | 'elite' | 'rest' | 'boss' | 'shop' | 'event'

export interface MapNode {
  id: string
  kind: MapNodeKind
  /** Savaş/elite/boss düğümleri için düşman tanım ID'si. */
  enemyDefId: string
  /** Olay düğümü için olay tanım ID'si. */
  eventId?: string
  /** Bu düğüm savaşı için kullanılacak deterministik tohum. */
  seed: number
  completed: boolean
}

export type RunPhase =
  | 'map'
  | 'combat'
  | 'reward'
  | 'relic_reward'
  | 'rest'
  | 'shop'
  | 'event'
  | 'run_victory'
  | 'run_defeat'

export interface RunState {
  phase: RunPhase
  /** Seçilen karakter ID'si. */
  characterId: string
  /** Harita/ödül RNG için ana tohum; her kullanımda ilerler. */
  rngSeed: number

  /** Savaşlar arası taşınan oyuncu canı. */
  playerHp: number
  playerMaxHp: number

  /** Güncel deste tanım ID listesi — ödüllerle büyür. */
  deckDefIds: string[]

  /** Birikmiş altın. */
  gold: number

  nodes: MapNode[]
  /** nodes[] içindeki aktif düğüm indeksi. */
  currentNodeIndex: number

  /**
   * Ödül ekranında sunulan 3 kart seçeneği.
   * Ödül alındıktan / atlandıktan sonra boşalır.
   */
  pendingRewardCards: string[]

  /** Bu düğümden kazanılan altın (ödül ekranında gösterilir). */
  pendingRewardGold: number

  /**
   * Mağaza envanteri — shop düğümüne girildiğinde oluşturulur,
   * çıkınca temizlenir. Satın alınanlar buradan çıkarılır.
   */
  shopInventory: string[]

  /** Mağazada kart çıkarma fiyatı (sabit). */
  shopRemovalPrice: number

  /** Sahip olunan relic ID listesi — tüm run boyunca taşınır. */
  relics: string[]

  /** Relic ödülü ekranında sunulan seçenekler. */
  pendingRelicReward: string[]

  /** Aktif event ID'si (event fazındayken). */
  activeEventId?: string
}
