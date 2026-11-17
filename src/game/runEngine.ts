/**
 * Koşu motoru — harita üretimi, kart ödülü seçimi.
 * UI'ya bağımlılık yoktur; saf veri dönüşümleri.
 */

import { nanoid } from 'nanoid'

import { allCardsList } from '@/data/cards'
import { getCardRarity } from '@/data/cards/rarity'
import type { CardRarity } from '@/data/cards/rarity'
import { CHARACTER_MAP, DEMIRCI } from '@/data/characters'
import { ALL_EVENTS } from '@/data/events'
import type { EventOutcome } from '@/data/events'
import { applyRelicsOnCombatEnd, pickRelicReward } from '@/game/relics'
import type { MapNode, MapNodeKind, RunState } from '@/game/runTypes'
import { rngFloat01, rngStep, sanitizeSeed } from '@/lib/rng'

// ---------------------------------------------------------------------------
// Harita şablonu
// ---------------------------------------------------------------------------

type NodeTemplate =
  | { kind: 'rest' | 'shop' | 'event' }
  | { kind: 'combat' | 'elite' | 'boss'; pool: ReadonlyArray<string> }

const MAP_TEMPLATE: NodeTemplate[] = [
  { kind: 'combat', pool: ['jaw_worm', 'cultist', 'louse'] },
  { kind: 'event' },
  { kind: 'combat', pool: ['jaw_worm', 'cultist', 'louse'] },
  { kind: 'rest' },
  { kind: 'combat', pool: ['jaw_worm', 'cultist', 'louse'] },
  { kind: 'elite',  pool: ['fungibeast'] },
  { kind: 'shop' },
  { kind: 'event' },
  { kind: 'combat', pool: ['jaw_worm', 'cultist', 'louse'] },
  { kind: 'rest' },
  { kind: 'boss',   pool: ['shadow_lord'] },
]

// Düğüm türüne göre altın ödülü
const GOLD_BY_KIND: Record<MapNodeKind, [number, number]> = {
  combat: [12, 22],
  elite:  [28, 42],
  rest:   [0, 0],
  shop:   [0, 0],
  event:  [0, 0],
  boss:   [50, 50],
}

// Kart fiyatları — rarity'ye göre; yükseltilmiş kart +20
const SHOP_PRICE_BY_RARITY: Record<CardRarity, number> = {
  common: 75,
  uncommon: 100,
  rare: 150,
}
const UPGRADED_PRICE_BONUS = 20

export function getCardShopPrice(defId: string): number {
  const bonus = defId.endsWith('+') ? UPGRADED_PRICE_BONUS : 0
  return SHOP_PRICE_BY_RARITY[getCardRarity(defId)] + bonus
}

export const SHOP_REMOVAL_PRICE = 75

// ---------------------------------------------------------------------------
// Yardımcı — RNG ile aralık
// ---------------------------------------------------------------------------

function rngRange(seed: number, min: number, max: number): { value: number; nextSeed: number } {
  const { float, nextSeed } = rngFloat01(seed)
  return { value: Math.floor(float * (max - min + 1)) + min, nextSeed }
}

// ---------------------------------------------------------------------------
// Harita üretimi
// ---------------------------------------------------------------------------

export function generateRun(masterSeed: number, characterId = 'demirci'): RunState {
  const character = CHARACTER_MAP[characterId] ?? DEMIRCI
  let seed = sanitizeSeed(masterSeed)

  const nodes: MapNode[] = []

  for (const template of MAP_TEMPLATE) {
    let enemyDefId = ''
    let eventId: string | undefined
    const kind = template.kind as MapNodeKind

    if ('pool' in template) {
      const { float, nextSeed } = rngFloat01(seed)
      seed = nextSeed
      enemyDefId = template.pool[Math.floor(float * template.pool.length)] ?? template.pool[0]!
    }

    if (kind === 'event') {
      const { float, nextSeed } = rngFloat01(seed)
      seed = nextSeed
      const idx = Math.floor(float * ALL_EVENTS.length)
      eventId = ALL_EVENTS[idx]?.id ?? ALL_EVENTS[0]!.id
    }

    // Savaş için ayrı bir tohum
    const { value: combatSeedRaw, nextSeed: ns } = rngStep(seed)
    seed = ns
    const combatSeed = combatSeedRaw + 1

    nodes.push({
      id: nanoid(),
      kind,
      enemyDefId,
      eventId,
      seed: combatSeed,
      completed: false,
    })
  }

  return {
    phase: 'map',
    characterId: character.id,
    rngSeed: seed,
    playerHp: character.maxHp,
    playerMaxHp: character.maxHp,
    deckDefIds: [...character.starterDeckIds] as string[],
    gold: 0,
    nodes,
    currentNodeIndex: 0,
    pendingRewardCards: [],
    pendingRewardGold: 0,
    shopInventory: [],
    shopRemovalPrice: SHOP_REMOVAL_PRICE,
    relics: [],
    pendingRelicReward: [],
    activeEventId: undefined,
  }
}

// ---------------------------------------------------------------------------
// Kart ödülü seçimi
// ---------------------------------------------------------------------------

const REWARD_CARD_COUNT = 3

const REWARD_WEIGHT_BY_RARITY: Record<CardRarity, number> = {
  common: 8,
  uncommon: 4,
  rare: 1,
}

function rarityWeight(defId: string): number {
  return REWARD_WEIGHT_BY_RARITY[getCardRarity(defId)]
}

export function pickRewardCards(
  seed: number,
  count = REWARD_CARD_COUNT,
  characterCardPoolIds?: ReadonlyArray<string>,
): { cards: ReadonlyArray<string>; nextSeed: number } {
  let s = seed

  // Karakterin havuzuna göre filtrele
  const sourceCards = characterCardPoolIds && characterCardPoolIds.length > 0
    ? allCardsList.filter((c) => characterCardPoolIds.includes(c.id))
    : allCardsList

  // Ağırlıklı havuz oluştur
  const pool: string[] = []
  for (const card of sourceCards) {
    const weight = rarityWeight(card.id)
    for (let w = 0; w < weight; w++) pool.push(card.id)
  }

  const picked: string[] = []
  const usedIds = new Set<string>()
  let attempts = 0

  while (picked.length < count && attempts < pool.length * 2) {
    const { float, nextSeed } = rngFloat01(s)
    s = nextSeed
    attempts++
    const candidate = pool[Math.floor(float * pool.length)]!
    if (!usedIds.has(candidate)) {
      usedIds.add(candidate)
      picked.push(candidate)
    }
  }

  return { cards: picked, nextSeed: s }
}

// ---------------------------------------------------------------------------
// Düğüm tamamlama: run state güncelleme
// ---------------------------------------------------------------------------

export function resolveNodeReward(
  run: RunState,
  playerHpAfterCombat: number,
): RunState {
  const node = run.nodes[run.currentNodeIndex]
  if (!node) return run

  const character = CHARACTER_MAP[run.characterId]
  const [goldMin, goldMax] = GOLD_BY_KIND[node.kind]
  const { value: goldGained, nextSeed: seedAfterGold } = rngRange(run.rngSeed, goldMin, goldMax)
  const { cards: rewardCards, nextSeed: seedAfterCards } = pickRewardCards(
    seedAfterGold, REWARD_CARD_COUNT, character?.cardPoolIds,
  )

  const updatedNodes = run.nodes.map((n, i) =>
    i === run.currentNodeIndex ? { ...n, completed: true } : n,
  )

  // Elit ve boss düğümlerinde relic ödülü
  const givesRelic = node.kind === 'elite' || node.kind === 'boss'
  let pendingRelicReward: string[] = []
  let finalSeed = seedAfterCards

  if (givesRelic) {
    const { relics, nextSeed } = pickRelicReward(seedAfterCards, run.relics)
    pendingRelicReward = [...relics]
    finalSeed = nextSeed
  }

  // Relic combat end efekti uygula (Kızıl Kan vb.)
  const hpAfterRelics = applyRelicsOnCombatEnd(
    { ...run, playerHp: Math.max(1, playerHpAfterCombat) },
    run.relics,
  ).playerHp

  return {
    ...run,
    phase: 'reward',
    rngSeed: finalSeed,
    playerHp: hpAfterRelics,
    nodes: updatedNodes,
    gold: run.gold + goldGained,
    pendingRewardCards: [...rewardCards],
    pendingRewardGold: goldGained,
    pendingRelicReward,
  }
}

/** Haritada savaş/elit/boss düğümü seçildi → savaş fazı. */
export function enterCombatNode(run: RunState): RunState {
  const node = run.nodes[run.currentNodeIndex]
  if (!node || run.phase !== 'map') return run
  if (node.kind !== 'combat' && node.kind !== 'elite' && node.kind !== 'boss') return run
  return { ...run, phase: 'combat' }
}

export function resolveRestNode(run: RunState): RunState {
  const updatedNodes = run.nodes.map((n, i) =>
    i === run.currentNodeIndex ? { ...n, completed: true } : n,
  )
  return {
    ...run,
    nodes: updatedNodes,
    phase: 'rest',
  }
}

export function applyRestHeal(run: RunState): RunState {
  const healed = Math.floor(run.playerMaxHp * 0.3)
  return {
    ...run,
    phase: 'map',
    playerHp: Math.min(run.playerMaxHp, run.playerHp + healed),
    currentNodeIndex: run.currentNodeIndex + 1,
  }
}

export function skipRest(run: RunState): RunState {
  return {
    ...run,
    phase: 'map',
    currentNodeIndex: run.currentNodeIndex + 1,
  }
}

export function applyRewardCard(run: RunState, defId: string | null): RunState {
  const newDeck = defId ? [...run.deckDefIds, defId] : [...run.deckDefIds]

  // Relic ödülü varsa önce onu göster
  if (run.pendingRelicReward.length > 0) {
    return {
      ...run,
      phase: 'relic_reward',
      deckDefIds: newDeck,
      pendingRewardCards: [],
      pendingRewardGold: 0,
    }
  }

  const nextIndex = run.currentNodeIndex + 1
  const isLast = nextIndex >= run.nodes.length

  return {
    ...run,
    phase: isLast ? 'run_victory' : 'map',
    deckDefIds: newDeck,
    currentNodeIndex: nextIndex,
    pendingRewardCards: [],
    pendingRewardGold: 0,
  }
}

export function applyRelicReward(run: RunState, relicId: string | null): RunState {
  const newRelics = relicId ? [...run.relics, relicId] : [...run.relics]
  const nextIndex = run.currentNodeIndex + 1
  const isLast = nextIndex >= run.nodes.length

  return {
    ...run,
    phase: isLast ? 'run_victory' : 'map',
    relics: newRelics,
    currentNodeIndex: nextIndex,
    pendingRelicReward: [],
  }
}

// ---------------------------------------------------------------------------
// Mağaza
// ---------------------------------------------------------------------------

/** Mağaza düğümüne gir: envanter oluştur. */
export function enterShop(run: RunState): RunState {
  const character = CHARACTER_MAP[run.characterId]
  const { cards: inventory, nextSeed } = pickRewardCards(run.rngSeed, 4, character?.cardPoolIds)
  const updatedNodes = run.nodes.map((n, i) =>
    i === run.currentNodeIndex ? { ...n, completed: true } : n,
  )
  return {
    ...run,
    phase: 'shop',
    rngSeed: nextSeed,
    nodes: updatedNodes,
    shopInventory: [...inventory],
  }
}

/** Mağazadan kart satın al. */
export function buyShopCard(run: RunState, defId: string, price: number): RunState {
  if (run.gold < price) return run
  const idx = run.shopInventory.indexOf(defId)
  if (idx === -1) return run
  const newInventory = [...run.shopInventory]
  newInventory.splice(idx, 1)
  return {
    ...run,
    gold: run.gold - price,
    deckDefIds: [...run.deckDefIds, defId],
    shopInventory: newInventory,
  }
}

/** Desteden bir kart çıkar (ücretli). */
export function removeShopCard(run: RunState, defId: string): RunState {
  if (run.gold < run.shopRemovalPrice) return run
  const idx = run.deckDefIds.indexOf(defId)
  if (idx === -1) return run
  const newDeck = [...run.deckDefIds]
  newDeck.splice(idx, 1)
  return {
    ...run,
    gold: run.gold - run.shopRemovalPrice,
    deckDefIds: newDeck,
  }
}

/** Mağazadan çık, haritaya dön. */
export function leaveShop(run: RunState): RunState {
  const nextIndex = run.currentNodeIndex + 1
  const isLast = nextIndex >= run.nodes.length
  return {
    ...run,
    phase: isLast ? 'run_victory' : 'map',
    currentNodeIndex: nextIndex,
    shopInventory: [],
  }
}

// ---------------------------------------------------------------------------
// Olay (Event) düğümleri
// ---------------------------------------------------------------------------

/** Event düğümüne gir; aktif event ID'sini kaydet, faz değiştir. */
export function enterEventNode(run: RunState): RunState {
  const node = run.nodes[run.currentNodeIndex]
  if (!node || node.kind !== 'event') return run

  const updatedNodes = run.nodes.map((n, i) =>
    i === run.currentNodeIndex ? { ...n, completed: true } : n,
  )

  return {
    ...run,
    phase: 'event',
    nodes: updatedNodes,
    activeEventId: node.eventId,
  }
}

/** Seçimin altın maliyeti — UI'da yetersiz altında seçeneği kapatmak için. */
export function eventOutcomeGoldCost(outcome: EventOutcome): number {
  return outcome.effects.reduce((sum, e) => (e.kind === 'loseGold' ? sum + e.amount : sum), 0)
}

/** Olay seçeneği seçildi; etkileri sırayla uygula ve haritaya dön. */
export function resolveEventChoice(run: RunState, outcome: EventOutcome): RunState {
  // Altını yetmeyen seçim uygulanmaz (UI zaten kapatır; bu ikinci savunma hattı).
  if (run.gold < eventOutcomeGoldCost(outcome)) return run

  let next: RunState = { ...run }

  for (const effect of outcome.effects) {
    switch (effect.kind) {
      case 'gainGold':
        next = { ...next, gold: next.gold + effect.amount }
        break
      case 'loseGold':
        next = { ...next, gold: Math.max(0, next.gold - effect.amount) }
        break
      case 'gainHp':
        next = { ...next, playerHp: Math.min(next.playerMaxHp, next.playerHp + effect.amount) }
        break
      case 'loseHp':
        next = { ...next, playerHp: Math.max(1, next.playerHp - effect.amount) }
        break
      case 'gainCard':
        next = { ...next, deckDefIds: [...next.deckDefIds, effect.cardId] }
        break
    }
  }

  const nextIndex = next.currentNodeIndex + 1
  const isLast = nextIndex >= next.nodes.length

  return {
    ...next,
    phase: isLast ? 'run_victory' : 'map',
    currentNodeIndex: nextIndex,
    activeEventId: undefined,
  }
}

export function resolveBossVictory(run: RunState, playerHpAfterCombat: number): RunState {
  // Boss sonrası da relic ödülü + kart ödülü var; resolveNodeReward bunu halleder
  return resolveNodeReward(run, playerHpAfterCombat)
}
