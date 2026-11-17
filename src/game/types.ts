/** Kart sınıfları — Slay the Spire benzeri. */
export type CardType = 'attack' | 'skill' | 'power'

/** Etkilerin hedefi. MVP'de tek düşman olduğundan `enemy` çoğu zamanda sıradaki düşman demek. */
export type TargetType = 'enemy' | 'self' | 'allEnemies'

export type StatusKey = 'vulnerable' | 'weak' | 'strength' | 'poison'

/** Veri tanımlı etkiler — yeni kart = yeni `effects` satırı, UI’ya kart başına bileşen gerekmez. */
export type Effect =
  | { kind: 'damage'; amount: number; target: TargetType }
  | { kind: 'block'; amount: number }
  | { kind: 'draw'; amount: number }
  | { kind: 'gainEnergy'; amount: number }
  | { kind: 'applyStatus'; status: StatusKey; amount: number; target: TargetType }

export interface CardDefinition {
  id: string
  name: string
  cost: number
  type: CardType
  description: string
  effects: Effect[]
  /** Yükseltilmiş varyant — `true` ise ID formatı `baseId+` şeklindedir. */
  isUpgraded?: boolean
  /** Oynanınca desteye dönmez; bu savaştan kalıcı çıkar. */
  exhaust?: boolean
  /** Tur sonu elde kalırsa otomatik exhaust olur. */
  ethereal?: boolean
  /** Savaş başı her zaman elde başlar. */
  innate?: boolean
}

/** Destede aynı karttan çokça olabileceği için örnek kimliği. */
export interface CardInstance {
  instanceId: string
  defId: string
}

export type EnemyIntentKind =
  | 'attack'
  | 'defend'
  | 'buff'
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
}

export interface EnemyDefinition {
  id: string
  name: string
  maxHp: number
  /** Tur indeksine göre gösterilen / çözülecek bir sonraki niyet. */
  intentScript: (intentIndex: number) => EnemyIntent
}

/** Aktif düşman (çatışma anı durumu). */
export interface EnemyRuntime {
  uid: string
  defId: string
  hp: number
  maxHp: number
  block: number
  statuses: Record<StatusKey, number>
  intent: EnemyIntent
}

export interface PlayerRuntime {
  hp: number
  maxHp: number
  block: number
  energy: number
  maxEnergy: number
  statuses: Record<StatusKey, number>
}

/** Şu anda sadece kullanıcı ve düşman turları kullanılıyor; gelecek fazlar için rezerve. */
export type GamePhase = 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat'

export interface GameState {
  phase: GamePhase
  /** Deterministik rastlantı dizisi için tohum durumu */
  rngSeed: number
  /** Oyuncu turu sayacı — UI veya gelecek özellikler için tutuluyor */
  playerTurnCount: number
  /** düşman niyeti indeksi — `intentScript(enemyIntentIndex)` senk için */
  enemyIntentIndex: number
  player: PlayerRuntime
  enemies: EnemyRuntime[]
  drawPile: CardInstance[]
  hand: CardInstance[]
  discardPile: CardInstance[]
  /** Bu savaşta exhaust olan kartlar — savaş bitince yok sayılır. */
  exhaustPile: CardInstance[]
}

export type CardDefinitionsMap = Record<string, CardDefinition>
export type EnemyDefinitionsMap = Record<string, EnemyDefinition>
