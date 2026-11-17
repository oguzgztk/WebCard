/** `public/game-art/` altındaki görsellerin yolları. Eşleme kart/düşman tanımındaki `art` alanındadır. */

import { ENEMY_DEFINITIONS_MAP } from '@/data/enemies'
import type { CardDefinition } from '@/game/types'

export function getCardArtSrc(def: Pick<CardDefinition, 'art'>): string | null {
  return def.art ? `/game-art/cards/${def.art}.webp` : null
}

export function getEnemyArtSrc(enemyDefId: string): string | null {
  const art = ENEMY_DEFINITIONS_MAP[enemyDefId]?.art
  return art ? `/game-art/enemies/${art}.webp` : null
}
