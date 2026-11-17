/**
 * Oynanabilir karakter tanımları.
 * Her karakter başlangıç destesi, max can ve ödül havuzuyla ayrışır.
 */

export interface CharacterDefinition {
  id: string
  name: string
  subtitle: string
  description: string
  maxHp: number
  /** Koşu başındaki deste tanım ID listesi. */
  starterDeckIds: string[]
  /**
   * Ödül ve mağaza kart havuzu (temel kartların ID'leri).
   * Boşsa tüm kartlar kullanılır.
   */
  cardPoolIds: string[]
  accentColor: string
  icon: string
  /** Karakter seçim ekranı görseli (public/game-art/characters/). */
  portraitSrc: string
}

export const DEMIRCI: CharacterDefinition = {
  id: 'demirci',
  name: 'Demirci',
  subtitle: 'Güç & Savunma',
  description:
    'Ağır zırh ve büyük kılıçlarla savaşır. Yüksek can ve blok gücüyle düşmanları ezmeye odaklanır.',
  maxHp: 80,
  starterDeckIds: [
    'strike', 'strike', 'strike', 'strike', 'strike',
    'defend', 'defend', 'defend', 'defend',
    'bash',
  ],
  cardPoolIds: [
    'strike', 'defend', 'bash', 'pommel_strike', 'twin_strike',
    'iron_wave', 'blade_dance', 'thunderclap', 'shrug_it_off',
    'backflip', 'heavy_blade', 'cloth_armor', 'body_slam',
    'whirlwind', 'carnage', 'seeing_red', 'battle_cry',
    'rage_burst', 'war_cry',
  ],
  accentColor: '#c4a054',
  icon: '⚒',
  portraitSrc: '/game-art/characters/demirci.webp',
}

export const GOLGE: CharacterDefinition = {
  id: 'golge',
  name: 'Gölge',
  subtitle: 'Hız & Zehir',
  description:
    'Gölgede hareket eder; hızlı bıçak darbeleri ve zehirle düşmanları yıpratır. Düşük can ama yüksek tempolu oyun stili.',
  maxHp: 68,
  starterDeckIds: [
    'dagger', 'dagger', 'dagger', 'dagger',
    'deflect', 'deflect', 'deflect',
    'shadow_step', 'shadow_step',
    'envenom',
  ],
  cardPoolIds: [
    'dagger', 'deflect', 'envenom', 'neutralize', 'weakening_ray',
    'backflip', 'ghost_blade', 'mirror_image', 'pommel_strike',
    'shadow_step', 'poison_cloud', 'blade_dance', 'after_image',
    'venomous_strike', 'smoke_bomb', 'assassinate', 'shadow_flurry', 'crippling_venom',
  ],
  accentColor: '#6a9a6a',
  icon: '🗡',
  portraitSrc: '/game-art/characters/golge.webp',
}

export const ALL_CHARACTERS: CharacterDefinition[] = [DEMIRCI, GOLGE]

export const CHARACTER_MAP: Record<string, CharacterDefinition> = Object.fromEntries(
  ALL_CHARACTERS.map((c) => [c.id, c]),
)
