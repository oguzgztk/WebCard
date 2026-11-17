/**
 * Dallanan harita üretimi (Slay the Spire benzeri, sade).
 * Birkaç yol aşağıdan yukarı yürür; her adımda sütun -1/0/+1 kayar, kesişen bağlantılar düzleştirilir.
 * Kat kuralları: 0. kat savaş, orta kat hazine, boss öncesi mola, en üstte boss.
 */

import { nanoid } from 'nanoid'

import { ENCOUNTERS, type EncounterTier } from '@/data/encounters'
import { ALL_EVENTS } from '@/data/events'
import type { Difficulty, MapNode, MapNodeKind } from '@/game/runTypes'
import { rngFloat01, rngStep } from '@/lib/rng'

export const MAP_LANES = 4
/** Normal katlar (0..FLOORS-1) + boss katı. */
export const MAP_FLOORS = 13
const BOSS_FLOOR = MAP_FLOORS - 1
const REST_FLOOR = BOSS_FLOOR - 1
const TREASURE_FLOOR = 6
const PATHS = 4

class Rng {
  constructor(public seed: number) {}
  float() {
    const { float, nextSeed } = rngFloat01(this.seed)
    this.seed = nextSeed
    return float
  }
  int(maxExclusive: number) {
    return Math.floor(this.float() * maxExclusive)
  }
  raw() {
    const { value, nextSeed } = rngStep(this.seed)
    this.seed = nextSeed
    return Math.floor(value * 2147483646) + 1
  }
  shuffle<T>(items: T[]): T[] {
    const out = [...items]
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(i + 1)
      ;[out[i], out[j]] = [out[j]!, out[i]!]
    }
    return out
  }
  weighted<T>(items: ReadonlyArray<{ item: T; weight: number }>): T {
    const total = items.reduce((s, x) => s + x.weight, 0)
    let roll = this.float() * total
    for (const x of items) {
      roll -= x.weight
      if (roll < 0) return x.item
    }
    return items[items.length - 1]!.item
  }
}

type Edge = { from: number; to: number } // lane → lane, ardışık katlar arası

function crosses(a: Edge, b: Edge) {
  return (a.from < b.from && a.to > b.to) || (a.from > b.from && a.to < b.to)
}

function kindWeights(floor: number): Array<{ item: MapNodeKind; weight: number }> {
  if (floor <= 1) return [{ item: 'combat', weight: 1 }]
  if (floor <= 3) {
    return [
      { item: 'combat', weight: 60 },
      { item: 'event', weight: 30 },
      { item: 'shop', weight: floor === 3 ? 10 : 0 },
    ]
  }
  return [
    { item: 'combat', weight: 44 },
    { item: 'event', weight: 20 },
    { item: 'elite', weight: 14 },
    { item: 'rest', weight: 12 },
    { item: 'shop', weight: 10 },
  ]
}

/** Aynı yolda art arda gelmemesi gereken türler. */
const NO_REPEAT: ReadonlySet<MapNodeKind> = new Set(['elite', 'rest', 'shop'])

function encounterFor(rng: Rng, tier: EncounterTier): string[] {
  return [...rng.weighted(ENCOUNTERS[tier].map((e) => ({ item: e.enemyDefIds, weight: e.weight })))]
}

/** Kat ve zorluğa göre düşman can çarpanı. */
export function enemyHpScaleFor(floor: number, kind: MapNodeKind, difficulty: Difficulty) {
  const base = kind === 'boss' ? 1 : 1 + floor * 0.035
  return Math.round(base * (difficulty === 'hard' ? 1.2 : 1) * 100) / 100
}

export function generateMap(seed: number, difficulty: Difficulty = 'normal'): { nodes: MapNode[]; nextSeed: number } {
  const rng = new Rng(seed)

  // 1) Yolları yürü → (kat, sütun) düğümleri ve bağlantılar
  const occupied: Array<Set<number>> = Array.from({ length: REST_FLOOR + 1 }, () => new Set())
  const edges: Array<Edge[]> = Array.from({ length: REST_FLOOR }, () => [])
  const starts = rng.shuffle([0, 1, 2, 3])

  for (let p = 0; p < PATHS; p++) {
    // İlk iki yol farklı sütundan başlasın; diğerleri rastgele katılsın
    let lane = p < 2 ? starts[p]! : rng.int(MAP_LANES)
    occupied[0]!.add(lane)
    for (let f = 0; f < REST_FLOOR; f++) {
      let to = Math.max(0, Math.min(MAP_LANES - 1, lane + rng.int(3) - 1))
      if (edges[f]!.some((e) => crosses(e, { from: lane, to }))) to = lane
      if (!edges[f]!.some((e) => e.from === lane && e.to === to)) edges[f]!.push({ from: lane, to })
      occupied[f + 1]!.add(to)
      lane = to
    }
  }

  // 2) Düğümleri oluştur
  const byPos = new Map<string, MapNode>()
  const key = (f: number, l: number) => `${f}:${l}`
  const nodes: MapNode[] = []

  for (let f = 0; f <= REST_FLOOR; f++) {
    for (const lane of [...occupied[f]!].sort((a, b) => a - b)) {
      const node: MapNode = {
        id: nanoid(8),
        floor: f,
        lane,
        kind: 'combat',
        enemyDefIds: [],
        enemyHpScale: 1,
        next: [],
        seed: rng.raw(),
        visited: false,
      }
      byPos.set(key(f, lane), node)
      nodes.push(node)
    }
  }
  const boss: MapNode = {
    id: nanoid(8),
    floor: BOSS_FLOOR,
    lane: 1.5,
    kind: 'boss',
    enemyDefIds: encounterFor(rng, 'boss'),
    enemyHpScale: enemyHpScaleFor(BOSS_FLOOR, 'boss', difficulty),
    next: [],
    seed: rng.raw(),
    visited: false,
  }
  nodes.push(boss)

  for (let f = 0; f < REST_FLOOR; f++) {
    for (const e of edges[f]!) byPos.get(key(f, e.from))!.next.push(byPos.get(key(f + 1, e.to))!.id)
  }
  for (const n of nodes) if (n.floor === REST_FLOOR) n.next = [boss.id]

  // 3) Türleri ata (ebeveynlerle tekrar etmeyecek şekilde)
  const parents = new Map<string, MapNode[]>()
  for (const n of nodes) for (const id of n.next) parents.set(id, [...(parents.get(id) ?? []), n])

  for (const n of nodes) {
    if (n.kind === 'boss') continue
    if (n.floor === TREASURE_FLOOR) n.kind = 'treasure'
    else if (n.floor === REST_FLOOR) n.kind = 'rest'
    else {
      const parentKinds = new Set((parents.get(n.id) ?? []).map((p) => p.kind))
      const options = kindWeights(n.floor).filter((o) => o.weight > 0 && !(NO_REPEAT.has(o.item) && parentKinds.has(o.item)))
      n.kind = rng.weighted(options.length ? options : [{ item: 'combat' as MapNodeKind, weight: 1 }])
    }

    if (n.kind === 'combat' || n.kind === 'elite') {
      const tier: EncounterTier = n.kind === 'elite' ? 'elite' : n.floor < 3 ? 'easy' : 'normal'
      n.enemyDefIds = encounterFor(rng, tier)
      n.enemyHpScale = enemyHpScaleFor(n.floor, n.kind, difficulty)
    }
    if (n.kind === 'event') n.eventId = ALL_EVENTS[rng.int(ALL_EVENTS.length)]!.id
  }

  return { nodes, nextSeed: rng.seed }
}
