/** Kart sınıfları — Slay the Spire benzeri. */
export type CardType = 'attack' | 'skill' | 'power'

export type CardRarity = 'starter' | 'common' | 'uncommon' | 'rare'

/** Etkilerin hedefi. `enemy` = seçilen (yoksa ilk) düşman. */
export type TargetType = 'enemy' | 'self' | 'allEnemies'

export type StatusKey =
  | 'vulnerable'
  | 'weak'
  | 'strength'
  | 'poison'
  /** Kazanılan her bloka +N. */
  | 'dexterity'
  /** Tur sonunda N blok. */
  | 'metallicize'
  /** Saldırana her vuruşta N hasar. */
  | 'thorns'
  /** Tur başında tüm düşmanlara N zehir. */
  | 'noxious'

export type Statuses = Record<StatusKey, number>

/** Veri tanımlı etkiler — yeni kart = yeni `effects` satırı, UI’ya kart başına bileşen gerekmez. */
export type Effect =
  | { kind: 'damage'; amount: number; target: TargetType; hits?: number }
  /** Oyuncunun mevcut bloğu kadar hasar. */
  | { kind: 'damageFromBlock'; target: TargetType }
  | { kind: 'block'; amount: number }
  /** Oyuncu can kazanır (maksimumu aşmaz). */
  | { kind: 'heal'; amount: number }
  | { kind: 'draw'; amount: number }
  | { kind: 'gainEnergy'; amount: number }
  | { kind: 'applyStatus'; status: StatusKey; amount: number; target: TargetType }
  /** Hedefteki durumu katla (ör. zehri ikiye katla). */
  | { kind: 'multiplyStatus'; status: StatusKey; factor: number; target: TargetType }

/** Çalışma zamanı kart tanımı (temel veya yükseltilmiş). Açıklama `cardText` ile etkilerden üretilir. */
export interface CardDefinition {
  id: string
  name: string
  cost: number
  type: CardType
  rarity: CardRarity
  effects: Effect[]
  /** Yükseltilmiş varyant — `true` ise ID formatı `baseId+` şeklindedir. */
  isUpgraded?: boolean
  /** Oynanınca desteye dönmez; bu savaştan kalıcı çıkar. */
  exhaust?: boolean
  /** Tur sonu elde kalırsa otomatik exhaust olur. */
  ethereal?: boolean
  /** Savaş başı her zaman elde başlar. */
  innate?: boolean
  /** `public/game-art/cards/<art>.webp` anahtarı. */
  art?: string
  /** Görseli olmayan kartlar için amblem. */
  glyph?: string
}

/** Veri dosyalarındaki kart: temel tanım + yükseltmede değişen alanlar. */
export interface CardBlueprint extends Omit<CardDefinition, 'isUpgraded'> {
  upgrade: Partial<Pick<CardDefinition, 'cost' | 'effects' | 'exhaust' | 'ethereal' | 'innate'>>
}

/** Destede aynı karttan çokça olabileceği için örnek kimliği. */
export interface CardInstance {
  instanceId: string
  defId: string
}

export type EnemyIntentKind =
  | 'attack'
  | 'defend'
  /** Düşman Güç kazanır. */
  | 'buff'
  /** Saldırı + blok aynı turda. */
  | 'attack_defend'
  /** Oyuncuya zayıf yığını (verdiğin hasarı düşürür). */
  | 'apply_player_weak'
  /** Oyuncuya savunması kırığı (alınan hasarı artırır). */
  | 'apply_player_vulnerable'

export interface EnemyIntent {
  kind: EnemyIntentKind
  /** Saldırı hasarı, blok, veya uygulanan durum yığını. */
  value?: number
  /** `attack` için ardışık vuruş sayısı (varsayılan 1). */
  hits?: number
  /** `attack_defend` için blok miktarı. */
  block?: number
}

export interface EnemyDefinition {
  id: string
  name: string
  maxHp: number
  /** Tur indeksine göre gösterilen / çözülecek bir sonraki niyet. */
  intentScript: (intentIndex: number) => EnemyIntent
  /** Savaş başı durumları (ör. boss dikenleri). */
  startingStatuses?: Partial<Statuses>
  /** `public/game-art/enemies/<art>.webp`; yoksa `glyph` gösterilir. */
  art?: string
  glyph?: string
  /** Lobi/harita için kısa tanıtım. */
  blurb?: string
}

/** Aktif düşman (çatışma anı durumu). */
export interface EnemyRuntime {
  uid: string
  defId: string
  hp: number
  maxHp: number
  block: number
  statuses: Statuses
  intent: EnemyIntent
  /** Aynı türden düşmanlar senkron gitmesin diye niyet dizisindeki kayma. */
  intentOffset?: number
}

export interface PlayerRuntime {
  hp: number
  maxHp: number
  block: number
  energy: number
  maxEnergy: number
  statuses: Statuses
}

export type GamePhase = 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat'

/** Savaş istatistikleri — koşu sonu ekranı için toplanır. */
export interface CombatStats {
  damageDealt: number
  damageTaken: number
  cardsPlayed: number
}

export interface GameState {
  phase: GamePhase
  /** Deterministik rastlantı dizisi için tohum durumu */
  rngSeed: number
  /** Oyuncu turu sayacı — 0 = ilk tur */
  playerTurnCount: number
  /** düşman niyeti indeksi — `intentScript(enemyIntentIndex)` senk için */
  enemyIntentIndex: number
  player: PlayerRuntime
  enemies: EnemyRuntime[]
  drawPile: CardInstance[]
  hand: CardInstance[]
  discardPile: CardInstance[]
  /** Bu savaşta exhaust olan (ve oynanan güç) kartları — savaş bitince yok sayılır. */
  exhaustPile: CardInstance[]
  stats: CombatStats
  /** Bu tur oynanan kart sayaçları (relic tetikleyicileri için); tur başında sıfırlanır. */
  turnCounters: { attacks: number; skills: number }
  /** Savaşa getirilen iksirler (kullanıldıkça azalır, savaş sonunda koşuya geri yazılır). */
  potions: string[]
}

export type CardDefinitionsMap = Record<string, CardDefinition>
export type EnemyDefinitionsMap = Record<string, EnemyDefinition>
