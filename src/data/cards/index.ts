import { afterImage } from '@/data/cards/afterImage'
import { assassinate } from '@/data/cards/assassinate'
import { backflip } from '@/data/cards/backflip'
import { bash } from '@/data/cards/bash'
import { battleCry } from '@/data/cards/battleCry'
import { bladeDance } from '@/data/cards/bladeDance'
import { bodySlam } from '@/data/cards/bodySlam'
import { carnage } from '@/data/cards/carnage'
import { clothArmor } from '@/data/cards/clothArmor'
import { cripplingVenom } from '@/data/cards/cripplingVenom'
import { dagger } from '@/data/cards/dagger'
import { defend } from '@/data/cards/defend'
import { deflect } from '@/data/cards/deflect'
import { envenom } from '@/data/cards/envenom'
import { ghostBlade } from '@/data/cards/ghostBlade'
import { heavyBlade } from '@/data/cards/heavyBlade'
import { ironWave } from '@/data/cards/ironWave'
import { mirrorImage } from '@/data/cards/mirrorImage'
import { neutralize } from '@/data/cards/neutralize'
import { poisonCloud } from '@/data/cards/poisonCloud'
import { pommelStrike } from '@/data/cards/pommelStrike'
import { rageBurst } from '@/data/cards/rageBurst'
import { seeingRed } from '@/data/cards/seeingRed'
import { shadowFlurry } from '@/data/cards/shadowFlurry'
import { shadowStep } from '@/data/cards/shadowStep'
import { smokeBomb } from '@/data/cards/smokeBomb'
import { shrugItOff } from '@/data/cards/shrugItOff'
import { strike } from '@/data/cards/strike'
import { thunderclap } from '@/data/cards/thunderclap'
import { twinStrike } from '@/data/cards/twinStrike'
import { warCry } from '@/data/cards/warCry'
import { venomousStrike } from '@/data/cards/venomousStrike'
import { weakeningRay } from '@/data/cards/weakeningRay'
import { whirlwind } from '@/data/cards/whirlwind'
import { upgradeCard } from '@/game/cardUpgrades'
import type { CardDefinitionsMap } from '@/game/types'

export const allCardsList = [
  // Demirci kartları
  strike,
  defend,
  bash,
  pommelStrike,
  weakeningRay,
  twinStrike,
  ironWave,
  bladeDance,
  thunderclap,
  shrugItOff,
  backflip,
  heavyBlade,
  neutralize,
  whirlwind,
  carnage,
  seeingRed,
  battleCry,
  clothArmor,
  bodySlam,
  // Keyword kartlar (Faz 3.3)
  ghostBlade,
  mirrorImage,
  rageBurst,
  warCry,
  // Gölge kartları (Faz 4)
  dagger,
  deflect,
  envenom,
  shadowStep,
  poisonCloud,
  afterImage,
  venomousStrike,
  smokeBomb,
  assassinate,
  shadowFlurry,
  cripplingVenom,
] satisfies ReadonlyArray<typeof strike>

/**
 * `id → tanım`. Hem temel hem yükseltilmiş (`id+`) versiyonları içerir.
 * Yeni kartlar burayı genişleterek kayıtta tutuluyor.
 */
export function buildCardDefinitionsMap(defs = allCardsList): CardDefinitionsMap {
  const map = defs.reduce<CardDefinitionsMap>((acc, c) => {
    acc[c.id] = c
    return acc
  }, {})

  // Yükseltilmiş versiyonları da ekle
  for (const base of defs) {
    const upgraded = upgradeCard(base)
    if (upgraded) map[upgraded.id] = upgraded
  }

  return map
}

export const CARD_DEFINITIONS_MAP: CardDefinitionsMap = buildCardDefinitionsMap()
