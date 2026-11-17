import { POTION_MAP } from '@/data/potions'
import { describeEffects } from '@/game/cardText'

/** "İksir Adı: etki açıklaması" — ipuçları ve mağaza için. */
export function potionTooltip(id: string) {
  const p = POTION_MAP[id]
  return p ? `${p.name}: ${describeEffects(p.effects)}` : ''
}
