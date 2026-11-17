import { DEMIRCI_CARDS } from '@/data/cards/demirci'
import { GOLGE_CARDS } from '@/data/cards/golge'
import type { CardBlueprint, CardDefinition, CardDefinitionsMap, CardRarity } from '@/game/types'

export const ALL_CARD_BLUEPRINTS: readonly CardBlueprint[] = [...DEMIRCI_CARDS, ...GOLGE_CARDS]

function toDefinition({ upgrade: _upgrade, ...base }: CardBlueprint): CardDefinition {
  return base
}

/** Temel kartın `+` sürümü. Yükseltmede belirtilmeyen alanlar temelden gelir. */
export function upgradeBlueprint(bp: CardBlueprint): CardDefinition {
  return {
    ...toDefinition(bp),
    ...bp.upgrade,
    id: `${bp.id}+`,
    name: `${bp.name}+`,
    isUpgraded: true,
  }
}

/** Temel kartlar (yükseltilmemiş). Ödül/mağaza havuzları buradan seçer. */
export const allCardsList: readonly CardDefinition[] = ALL_CARD_BLUEPRINTS.map(toDefinition)

/** `id → tanım`. Hem temel hem yükseltilmiş (`id+`) versiyonları içerir. */
export const CARD_DEFINITIONS_MAP: CardDefinitionsMap = Object.fromEntries(
  ALL_CARD_BLUEPRINTS.flatMap((bp) => {
    const up = upgradeBlueprint(bp)
    return [
      [bp.id, toDefinition(bp)],
      [up.id, up],
    ]
  }),
)

export function isUpgradeable(def: CardDefinition): boolean {
  return !def.isUpgraded && Boolean(CARD_DEFINITIONS_MAP[`${def.id}+`])
}

/** Temel kartın yükseltilmiş tanımı; yoksa `null`. */
export function getUpgradedDefinition(def: CardDefinition): CardDefinition | null {
  return def.isUpgraded ? null : (CARD_DEFINITIONS_MAP[`${def.id}+`] ?? null)
}

/** `defId` yükseltilmiş olabilir; nadirlik temel karttan okunur. Bilinmeyen kart `common`. */
export function getCardRarity(defId: string): CardRarity {
  return CARD_DEFINITIONS_MAP[defId]?.rarity ?? 'common'
}
