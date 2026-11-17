/**
 * Kart nadirlik tablosu — ödül ağırlıkları ve mağaza fiyatları buradan okunur.
 * Yeni kart eklerken buraya da kaydedin; listede olmayan kart `common` sayılır.
 */

export type CardRarity = 'common' | 'uncommon' | 'rare'

const CARD_RARITY: Readonly<Record<string, CardRarity>> = {
  // Demirci
  strike: 'common',
  defend: 'common',
  bash: 'common',
  pommel_strike: 'common',
  twin_strike: 'common',
  thunderclap: 'common',
  weakening_ray: 'common',
  iron_wave: 'uncommon',
  blade_dance: 'uncommon',
  neutralize: 'uncommon',
  backflip: 'uncommon',
  shrug_it_off: 'uncommon',
  heavy_blade: 'uncommon',
  cloth_armor: 'uncommon',
  battle_cry: 'uncommon',
  seeing_red: 'uncommon',
  carnage: 'rare',
  whirlwind: 'rare',
  body_slam: 'rare',

  // Keyword kartlar
  ghost_blade: 'common',
  war_cry: 'common',
  mirror_image: 'uncommon',
  rage_burst: 'uncommon',

  // Gölge
  dagger: 'common',
  deflect: 'common',
  shadow_step: 'common',
  envenom: 'common',
  after_image: 'uncommon',
  venomous_strike: 'uncommon',
  smoke_bomb: 'uncommon',
  crippling_venom: 'uncommon',
  poison_cloud: 'uncommon',
  assassinate: 'rare',
  shadow_flurry: 'rare',
}

/** `defId` yükseltilmiş (`id+`) olabilir; nadirlik temel karttan okunur. */
export function getCardRarity(defId: string): CardRarity {
  const baseId = defId.endsWith('+') ? defId.slice(0, -1) : defId
  return CARD_RARITY[baseId] ?? 'common'
}
