/** `public/game-art/` altındaki varlıklar — kart kimliği / düşman `defId` eşlemesi */

const CARD_ART_KEY: Record<string, string> = {
  strike:        'swift',
  twin_strike:   'twin_strike',
  thunderclap:   'thunderclap',

  bash:          'heavy',
  heavy_blade:   'heavy_blade',

  defend:        'shield',
  shrug_it_off:  'shrug_it_off',
  backflip:      'backflip',

  iron_wave:     'wedge',

  blade_dance:   'duel',
  pommel_strike: 'pommel_strike',

  weakening_ray: 'decay',
  neutralize:    'neutralize',

  whirlwind:     'flame',
  carnage:       'carnage',

  seeing_red:    'surge',
  battle_cry:    'battle_cry',

  cloth_armor:   'plating',
  body_slam:     'slam',

  // Keyword kartlar (Faz 3.3)
  ghost_blade:   'ghost_blade',
  mirror_image:  'mirror_image',
  rage_burst:    'rage_burst',
  war_cry:       'war_cry',
  // Gölge kartları (Faz 4)
  dagger:           'dagger',
  deflect:          'deflect',
  envenom:          'envenom',
  shadow_step:      'shadow_step',
  poison_cloud:     'poison_cloud',
  after_image:      'after_image',
  venomous_strike:  'venomous_strike',
  smoke_bomb:       'smoke_bomb',
  assassinate:      'assassinate',
  shadow_flurry:    'shadow_flurry',
  crippling_venom:  'crippling_venom',
}

const ENEMY_ART: Record<string, string> = {
  jaw_worm:     'jaw-worm',
  cultist:      'cultist',
  louse:        'louse',
  fungibeast:   'fungibeast',
  shadow_lord:  'shadow_lord',
}

export function getCardArtSrc(defId: string): string | null {
  const key = CARD_ART_KEY[defId]
  return key ? `/game-art/cards/${key}.webp` : null
}

export function getEnemyArtSrc(enemyDefId: string): string | null {
  const key = ENEMY_ART[enemyDefId]
  return key ? `/game-art/enemies/${key}.webp` : null
}
