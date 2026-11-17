import { ENEMY_DEFINITIONS_MAP } from '@/data/enemies'
import { EVENT_MAP } from '@/data/events'
import type { MapNode } from '@/game/runTypes'

/** Harita düğümünün kısa açıklaması (düşman adları gruplanır: "3× Asalak"). */
export function nodeTitle(node: MapNode): string {
  if (node.kind === 'event') return EVENT_MAP[node.eventId ?? '']?.title ?? 'Gizemli Olay'
  if (node.kind === 'rest') return 'Kamp ateşi — iyileş veya yükselt'
  if (node.kind === 'shop') return 'Tüccar — kart, yadigâr, kart çıkarma'
  if (node.kind === 'treasure') return 'Hazine sandığı — bir yadigâr'
  const names = node.enemyDefIds.map((id) => ENEMY_DEFINITIONS_MAP[id]?.name ?? '???')
  const grouped = Object.entries(names.reduce<Record<string, number>>((a, n) => ({ ...a, [n]: (a[n] ?? 0) + 1 }), {}))
    .map(([n, c]) => (c > 1 ? `${c}× ${n}` : n))
    .join(', ')
  return grouped
}
