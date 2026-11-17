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
   * Başlangıç kartları havuzda yer almaz.
   */
  cardPoolIds: string[]
  /** Koşuya bu relic ile başlanır. */
  starterRelicId: string
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
    'pommel_strike', 'twin_strike', 'thunderclap', 'iron_wave', 'shrug_it_off', 'war_cry', 'ghost_blade',
    'blade_dance', 'backflip', 'heavy_blade', 'whirlwind', 'seeing_red', 'battle_cry', 'body_slam',
    'mirror_image', 'cloth_armor', 'rage_burst', 'spiked_armor',
    'carnage', 'earthquake', 'forge_spirit',
  ],
  starterRelicId: 'burning_blood',
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
    'neutralize', 'weakening_ray', 'venomous_strike', 'after_image', 'deadly_poison', 'blade_fan',
    'pommel_strike', 'ghost_blade', 'backflip', 'blade_dance',
    'poison_cloud', 'smoke_bomb', 'shadow_flurry', 'crippling_venom', 'catalyst', 'footwork', 'mirror_image',
    'assassinate', 'noxious_fumes',
  ],
  starterRelicId: 'bag_of_prep',
  accentColor: '#6a9a6a',
  icon: '🗡',
  portraitSrc: '/game-art/characters/golge.webp',
}

export const ALL_CHARACTERS: CharacterDefinition[] = [DEMIRCI, GOLGE]

export const CHARACTER_MAP: Record<string, CharacterDefinition> = Object.fromEntries(
  ALL_CHARACTERS.map((c) => [c.id, c]),
)

/** Lobideki hızlı savaş destesi — Demirci başlangıcı + birkaç tanıtım kartı. */
export const QUICK_BATTLE_DECK: readonly string[] = [
  'strike', 'strike', 'strike', 'strike', 'defend', 'defend', 'defend', 'defend', 'bash',
  'pommel_strike', 'iron_wave', 'thunderclap', 'shrug_it_off', 'body_slam', 'rage_burst', 'heavy_blade',
]
