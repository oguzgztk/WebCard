/**
 * Kart yükseltme sistemi.
 * Her temel kart için bir upgrade spec tanımlanır.
 * Yükseltilmiş kart ID'si: `${baseId}+` (ör. `strike+`).
 */

import type { CardDefinition, Effect } from '@/game/types'

// ---------------------------------------------------------------------------
// Upgrade spec tipini
// ---------------------------------------------------------------------------

type UpgradeSpec = {
  /** Maliyet değişimi (negatif = ucuzlar). */
  costDelta?: number
  /** Etkiler üzerinde uygulanan dönüşüm. */
  effectPatch: (effects: ReadonlyArray<Effect>) => Effect[]
  /** Yeni açıklama metni. */
  description: string
}

// ---------------------------------------------------------------------------
// Her kart için yükseltme spesifikasyonları
// ---------------------------------------------------------------------------

const UPGRADE_SPECS: Record<string, UpgradeSpec> = {
  strike: {
    description: '12 hasar.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'damage' ? { ...eff, amount: 12 } : eff)),
  },
  defend: {
    description: '8 blok.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'block' ? { ...eff, amount: 8 } : eff)),
  },
  bash: {
    description: '14 hasar; 3 Tur Savunmasız.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'damage' ? { ...eff, amount: 14 } : eff)),
  },
  pommel_strike: {
    description: '10 hasar; 2 kart çek.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'draw' ? { ...eff, amount: 2 } : eff.kind === 'damage' ? { ...eff, amount: 10 } : eff)),
  },
  weakening_ray: {
    description: 'Düşmana 5 Tur Zayıf.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'applyStatus' ? { ...eff, amount: 5 } : eff)),
  },
  twin_strike: {
    description: '2×7 hasar.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'damage' ? { ...eff, amount: 7 } : eff)),
  },
  iron_wave: {
    description: '8 hasar; 8 blok.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'damage' ? { ...eff, amount: 8 } : eff.kind === 'block' ? { ...eff, amount: 8 } : eff)),
  },
  blade_dance: {
    description: '3×6 hasar.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'damage' ? { ...eff, amount: 6 } : eff)),
  },
  thunderclap: {
    description: '7 hasar; herkese 2 Tur Savunmasız.',
    effectPatch: (e) =>
      e.map((eff) =>
        eff.kind === 'damage' ? { ...eff, amount: 7 } :
        eff.kind === 'applyStatus' ? { ...eff, amount: 2 } : eff,
      ),
  },
  shrug_it_off: {
    description: '11 blok; 1 kart çek.',
    effectPatch: (e): Effect[] => [
      ...e.map((eff): Effect => (eff.kind === 'block' ? { ...eff, amount: 11 } : eff)),
      { kind: 'draw', amount: 1 },
    ],
  },
  backflip: {
    description: '9 blok; 2 kart çek.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'block' ? { ...eff, amount: 9 } : eff)),
  },
  heavy_blade: {
    description: '20 hasar.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'damage' ? { ...eff, amount: 20 } : eff)),
  },
  neutralize: {
    description: '4 hasar; 3 Tur Zayıf.',
    effectPatch: (e) =>
      e.map((eff) =>
        eff.kind === 'damage' ? { ...eff, amount: 4 } :
        eff.kind === 'applyStatus' ? { ...eff, amount: 3 } : eff,
      ),
  },
  whirlwind: {
    description: 'Tüm düşmanlara 11 hasar.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'damage' ? { ...eff, amount: 11 } : eff)),
  },
  battle_cry: {
    description: '4 kart çek.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'draw' ? { ...eff, amount: 4 } : eff)),
  },
  cloth_armor: {
    description: '14 blok; 1 kart çek.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'block' ? { ...eff, amount: 14 } : eff)),
  },
  body_slam: {
    description: '20 hasar; 3 Tur Savunmasız.',
    effectPatch: (e) =>
      e.map((eff) =>
        eff.kind === 'damage' ? { ...eff, amount: 20 } :
        eff.kind === 'applyStatus' ? { ...eff, amount: 3 } : eff,
      ),
  },
  carnage: {
    description: '28 hasar. Tüket.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'damage' ? { ...eff, amount: 28 } : eff)),
  },
  seeing_red: {
    costDelta: 0,
    description: '3 enerji kazan. Tüket.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'gainEnergy' ? { ...eff, amount: 3 } : eff)),
  },
  ghost_blade: {
    description: '14 hasar. Geçici.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'damage' ? { ...eff, amount: 14 } : eff)),
  },
  war_cry: {
    description: '2 kart çek. İçgüdü. Tüket.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'draw' ? { ...eff, amount: 2 } : eff)),
  },
  rage_burst: {
    description: '3 güç kazan. Tüket.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'applyStatus' ? { ...eff, amount: 3 } : eff)),
  },
  mirror_image: {
    description: '20 blok kazan. Geçici.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'block' ? { ...eff, amount: 20 } : eff)),
  },
  // Gölge kartları
  dagger: {
    description: '9 hasar ver.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'damage' ? { ...eff, amount: 9 } : eff)),
  },
  deflect: {
    description: '7 blok kazan.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'block' ? { ...eff, amount: 7 } : eff)),
  },
  envenom: {
    description: 'Düşmana 5 Zehir uygula.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'applyStatus' ? { ...eff, amount: 5 } : eff)),
  },
  shadow_step: {
    description: '9 blok kazan; 2 kart çek.',
    effectPatch: (e) =>
      e.map((eff) =>
        eff.kind === 'block' ? { ...eff, amount: 9 } :
        eff.kind === 'draw'  ? { ...eff, amount: 2 } : eff,
      ),
  },
  poison_cloud: {
    description: 'Tüm düşmanlara 8 Zehir uygula.',
    effectPatch: (e) =>
      e.map((eff) => (eff.kind === 'applyStatus' ? { ...eff, amount: 8 } : eff)),
  },
  after_image: {
    description: '12 blok kazan; 2 kart çek. Geçici.',
    effectPatch: (e) =>
      e.map((eff) =>
        eff.kind === 'block' ? { ...eff, amount: 12 } :
        eff.kind === 'draw'  ? { ...eff, amount: 2 }  : eff,
      ),
  },
  venomous_strike: {
    description: '14 hasar ver; 4 Zehir uygula.',
    effectPatch: (e) =>
      e.map((eff) =>
        eff.kind === 'damage'      ? { ...eff, amount: 14 } :
        eff.kind === 'applyStatus' ? { ...eff, amount: 4  } : eff,
      ),
  },
  smoke_bomb: {
    description: '16 blok kazan; düşmana 3 Zayıf uygula.',
    effectPatch: (e) =>
      e.map((eff) =>
        eff.kind === 'block'       ? { ...eff, amount: 16 } :
        eff.kind === 'applyStatus' ? { ...eff, amount: 3  } : eff,
      ),
  },
  assassinate: {
    costDelta: -1,
    description: '30 hasar ver. Tüket.',
    effectPatch: (e) => [...e],
  },
  shadow_flurry: {
    costDelta: -1,
    description: '3 kart çek.',
    effectPatch: (e) => [...e],
  },
  crippling_venom: {
    description: 'Düşmana 6 Zehir + 3 Savunmasız uygula.',
    effectPatch: (e) =>
      e.map((eff) =>
        eff.kind === 'applyStatus' && eff.status === 'poison'      ? { ...eff, amount: 6 } :
        eff.kind === 'applyStatus' && eff.status === 'vulnerable'  ? { ...eff, amount: 3 } : eff,
      ),
  },
}

// ---------------------------------------------------------------------------
// Yükseltme fonksiyonu
// ---------------------------------------------------------------------------

/**
 * Temel kartı yükselter, yeni bir `CardDefinition` döndürür.
 * Tanımsız kart için `null` döner.
 */
export function upgradeCard(base: CardDefinition): CardDefinition | null {
  const spec = UPGRADE_SPECS[base.id]
  if (!spec) return null

  return {
    ...base,
    id: `${base.id}+`,
    name: `${base.name}+`,
    cost: Math.max(0, base.cost + (spec.costDelta ?? 0)),
    description: spec.description,
    effects: spec.effectPatch(base.effects),
    isUpgraded: true,
  }
}

/**
 * Yükseltilmiş versiyonu olan tüm kartları döndürür
 * (temel karttaki yükseltme spec'i varsa).
 */
export function isUpgradeable(def: CardDefinition): boolean {
  return !def.isUpgraded && Boolean(UPGRADE_SPECS[def.id])
}
