/** Koşu (run) sistemi — `GameState` tek savaşı temsil eder; `RunState` tüm koşuyu. */

export type MapNodeKind = 'combat' | 'elite' | 'rest' | 'boss' | 'shop' | 'event' | 'treasure'

export interface MapNode {
  id: string
  /** 0'dan başlayan kat. */
  floor: number
  /** Kat içindeki sütun (0..MAP_LANES-1) — çizim ve kesişmesiz bağlantı için. */
  lane: number
  kind: MapNodeKind
  /** Savaş/elit/boss düğümleri için düşman tanım ID'leri. */
  enemyDefIds: string[]
  /** Düşman can çarpanı (kat ilerledikçe artar). */
  enemyHpScale: number
  /** Düşmanların savaş başı Güç bonusu (zor mod). */
  enemyStrength?: number
  /** Olay düğümü için olay tanım ID'si. */
  eventId?: string
  /** Bir üst kattaki bağlı düğümler. */
  next: string[]
  /** Bu düğüm için deterministik tohum (savaş karıştırma, ödüller). */
  seed: number
  /** Oyuncu bu düğümden geçti mi. */
  visited: boolean
}

export type RunPhase =
  | 'map'
  | 'combat'
  | 'reward'
  | 'relic_reward'
  | 'rest'
  | 'shop'
  | 'event'
  | 'treasure'
  | 'run_victory'
  | 'run_defeat'

export interface ShopOffer {
  defId: string
  price: number
  /** İndirimli teklif. */
  onSale?: boolean
}

export interface RunStats {
  floorsCleared: number
  enemiesKilled: number
  elitesKilled: number
  damageDealt: number
  damageTaken: number
  cardsPlayed: number
  goldEarned: number
}

export type Difficulty = 'normal' | 'hard'

export interface RunState {
  /** Kayıt şeması sürümü — uyumsuz eski kayıtlar yüklenmez. */
  version: 2
  phase: RunPhase
  difficulty: Difficulty
  /** Seçilen karakter ID'si. */
  characterId: string
  /** Koşunun ana tohumu (paylaşılabilir). */
  masterSeed: number
  /** Ödül RNG'si; her kullanımda ilerler. */
  rngSeed: number

  /** Savaşlar arası taşınan oyuncu canı. */
  playerHp: number
  playerMaxHp: number

  /** Güncel deste tanım ID listesi — ödüllerle büyür. */
  deckDefIds: string[]
  gold: number
  /** Sahip olunan relic ID listesi — tüm run boyunca taşınır. */
  relics: string[]
  /** İksir çantası (en fazla POTION_SLOTS). */
  potions: string[]
  /** Son savaştan düşen iksir (ödül ekranında gösterilir). */
  pendingPotion: string | null

  nodes: MapNode[]
  /** Şu an bulunulan düğüm; `null` = haritanın başı (ilk kat seçilecek). */
  currentNodeId: string | null

  /** Ödül ekranında sunulan kart seçenekleri. */
  pendingRewardCards: string[]
  /** Bu düğümden kazanılan altın (ödül ekranında gösterilir). */
  pendingRewardGold: number
  /** Relic ödülü / hazine ekranında sunulan seçenekler. */
  pendingRelicReward: string[]

  /** Mağaza: kart teklifleri (satın alınanlar çıkar). */
  shopCards: ShopOffer[]
  /** Mağaza: satılık relic (yoksa `null`). */
  shopRelic: ShopOffer | null
  /** Mağaza: satılık iksirler. */
  shopPotions: ShopOffer[]
  /** Kart çıkarma fiyatı — her kullanımda artar. */
  shopRemovalPrice: number
  /** Bu mağaza ziyaretinde kart çıkarıldı mı (ziyaret başına bir). */
  shopRemovalUsed: boolean

  /** Aktif event ID'si (event fazındayken). */
  activeEventId?: string

  stats: RunStats
}
