/**
 * Koşu motoru — harita, ödüller, mağaza, mola, olaylar.
 * UI'ya bağımlılık yoktur; saf veri dönüşümleri. Her fonksiyon geçersiz durumda `run`'ı aynen döndürür.
 */

import { allCardsList, CARD_DEFINITIONS_MAP, getCardRarity, getUpgradedDefinition } from '@/data/cards'
import { CHARACTER_MAP, DEMIRCI } from '@/data/characters'
import type { EventOutcome } from '@/data/events'
import { ALL_POTIONS, POTION_MAP, POTION_SLOTS } from '@/data/potions'
import { generateMap } from '@/game/mapGen'
import { applyRelicOnPickup, applyRelicsOnCombatEnd, pickRelicReward, RELIC_MAP, type RelicTier } from '@/game/relics'
import type { Difficulty, MapNode, MapNodeKind, RunState, RunStats, ShopOffer } from '@/game/runTypes'
import type { CardRarity, CombatStats } from '@/game/types'
import { rngFloat01, sanitizeSeed } from '@/lib/rng'

// ---------------------------------------------------------------------------
// Sabitler
// ---------------------------------------------------------------------------

const GOLD_BY_KIND: Partial<Record<MapNodeKind, [number, number]>> = {
  combat: [12, 20],
  elite: [28, 40],
  boss: [80, 80],
  treasure: [25, 40],
}

const REWARD_CARD_COUNT = 3
/** Olaylarda "başlangıç kartı çıkar" önce bunları hedefler. */
const BASIC_CARD_IDS: ReadonlySet<string> = new Set(['strike', 'defend', 'dagger', 'deflect'])
const REST_HEAL_RATIO = 0.3
export const SHOP_REMOVAL_BASE_PRICE = 75
const SHOP_REMOVAL_STEP = 25
const SHOP_CARD_COUNT = 5

const SHOP_PRICE_BY_RARITY: Record<CardRarity, number> = { starter: 50, common: 50, uncommon: 80, rare: 140 }
const RELIC_PRICE_BY_TIER: Record<RelicTier, number> = { common: 140, uncommon: 190, rare: 250, boss: 300 }
const UPGRADED_PRICE_BONUS = 25
const POTION_PRICE: Record<'common' | 'uncommon' | 'rare', number> = { common: 55, uncommon: 75, rare: 100 }
/** Savaş sonrası iksir düşme şansı. */
const POTION_DROP: Partial<Record<MapNodeKind, number>> = { combat: 0.25, elite: 0.5 }

/** Kart ödülünde nadirlik ağırlıkları — düğüm türüne göre. */
const REWARD_WEIGHTS: Record<'normal' | 'elite' | 'boss', Record<CardRarity, number>> = {
  normal: { starter: 0, common: 60, uncommon: 34, rare: 6 },
  elite: { starter: 0, common: 40, uncommon: 45, rare: 15 },
  boss: { starter: 0, common: 0, uncommon: 0, rare: 1 },
}

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

function rngRange(seed: number, min: number, max: number) {
  const { float, nextSeed } = rngFloat01(seed)
  return { value: Math.floor(float * (max - min + 1)) + min, nextSeed }
}

/** Ağırlıklı rastgele iksir (yaygın daha sık). */
export function pickPotion(seed: number): { id: string; nextSeed: number } {
  const weight = { common: 6, uncommon: 3, rare: 1 } as const
  const pool = ALL_POTIONS.flatMap((p) => Array<string>(weight[p.rarity]).fill(p.id))
  const { float, nextSeed } = rngFloat01(seed)
  return { id: pool[Math.floor(float * pool.length)]!, nextSeed }
}

/** Eski kayıtları güncel şemaya tamamlar. */
export function normalizeRun(run: RunState): RunState {
  return { ...run, potions: run.potions ?? [], pendingPotion: run.pendingPotion ?? null, shopPotions: run.shopPotions ?? [] }
}

function emptyStats(): RunStats {
  return { floorsCleared: 0, enemiesKilled: 0, elitesKilled: 0, damageDealt: 0, damageTaken: 0, cardsPlayed: 0, goldEarned: 0 }
}

export function getNode(run: RunState, id: string | null): MapNode | undefined {
  return id ? run.nodes.find((n) => n.id === id) : undefined
}

export function currentNode(run: RunState): MapNode | undefined {
  return getNode(run, run.currentNodeId)
}

/** Haritada şu an seçilebilecek düğümler. */
export function availableNodeIds(run: RunState): string[] {
  if (run.phase !== 'map') return []
  const cur = currentNode(run)
  if (!cur) return run.nodes.filter((n) => n.floor === 0).map((n) => n.id)
  return cur.next
}

export function getCardShopPrice(defId: string): number {
  const bonus = defId.endsWith('+') ? UPGRADED_PRICE_BONUS : 0
  return SHOP_PRICE_BY_RARITY[getCardRarity(defId)] + bonus
}

function characterPool(run: Pick<RunState, 'characterId'>) {
  const ids = (CHARACTER_MAP[run.characterId] ?? DEMIRCI).cardPoolIds
  return allCardsList.filter((c) => ids.includes(c.id))
}

function addGold(run: RunState, amount: number): RunState {
  return { ...run, gold: run.gold + amount, stats: { ...run.stats, goldEarned: run.stats.goldEarned + amount } }
}

/** Düğüm çözüldü → haritaya dön (boss sonrası koşu biter). */
function returnToMap(run: RunState): RunState {
  const node = currentNode(run)
  const finished = node?.kind === 'boss'
  return {
    ...run,
    phase: finished ? 'run_victory' : 'map',
    stats: { ...run.stats, floorsCleared: Math.max(run.stats.floorsCleared, (node?.floor ?? -1) + 1) },
  }
}

// ---------------------------------------------------------------------------
// Koşu oluşturma
// ---------------------------------------------------------------------------

export function generateRun(masterSeed: number, characterId = 'demirci', difficulty: Difficulty = 'normal'): RunState {
  const character = CHARACTER_MAP[characterId] ?? DEMIRCI
  const seed = sanitizeSeed(masterSeed)
  const { nodes, nextSeed } = generateMap(seed, difficulty)

  const run: RunState = {
    version: 2,
    phase: 'map',
    difficulty,
    characterId: character.id,
    masterSeed: seed,
    rngSeed: nextSeed,
    playerHp: character.maxHp,
    playerMaxHp: character.maxHp,
    deckDefIds: [...character.starterDeckIds],
    gold: 99,
    relics: [character.starterRelicId],
    potions: [],
    pendingPotion: null,
    nodes,
    currentNodeId: null,
    pendingRewardCards: [],
    pendingRewardGold: 0,
    pendingRelicReward: [],
    shopCards: [],
    shopRelic: null,
    shopPotions: [],
    shopRemovalPrice: SHOP_REMOVAL_BASE_PRICE,
    shopRemovalUsed: false,
    activeEventId: undefined,
    stats: emptyStats(),
  }
  return applyRelicOnPickup(run, character.starterRelicId)
}

// ---------------------------------------------------------------------------
// Kart seçimi
// ---------------------------------------------------------------------------

export function pickRewardCards(
  seed: number,
  count: number,
  pool: ReadonlyArray<{ id: string; rarity: CardRarity }>,
  weights: Record<CardRarity, number> = REWARD_WEIGHTS.normal,
): { cards: string[]; nextSeed: number } {
  let s = seed
  const picked: string[] = []
  let attempts = 0
  while (picked.length < count && attempts < 200) {
    attempts++
    // Önce nadirlik, sonra o nadirlikteki kart
    const available = pool.filter((c) => !picked.includes(c.id))
    if (available.length === 0) break
    const rarities = (['common', 'uncommon', 'rare'] as const).filter(
      (r) => weights[r] > 0 && available.some((c) => c.rarity === r),
    )
    const fallback = rarities.length ? rarities : (['common', 'uncommon', 'rare'] as const).filter((r) => available.some((c) => c.rarity === r))
    const total = fallback.reduce((sum, r) => sum + Math.max(1, weights[r]), 0)
    let { float, nextSeed } = rngFloat01(s)
    s = nextSeed
    let roll = float * total
    let rarity = fallback[0]!
    for (const r of fallback) {
      roll -= Math.max(1, weights[r])
      if (roll < 0) {
        rarity = r
        break
      }
    }
    const bucket = available.filter((c) => c.rarity === rarity)
    ;({ float, nextSeed } = rngFloat01(s))
    s = nextSeed
    picked.push(bucket[Math.floor(float * bucket.length)]!.id)
  }
  return { cards: picked, nextSeed: s }
}

// ---------------------------------------------------------------------------
// Harita: düğüm seçimi
// ---------------------------------------------------------------------------

/** Haritadan düğüm seç; türüne göre ilgili faza geç. */
export function selectNode(run: RunState, nodeId: string): RunState {
  if (!availableNodeIds(run).includes(nodeId)) return run
  const node = getNode(run, nodeId)!
  let next: RunState = {
    ...run,
    currentNodeId: nodeId,
    nodes: run.nodes.map((n) => (n.id === nodeId ? { ...n, visited: true } : n)),
  }

  switch (node.kind) {
    case 'combat':
    case 'elite':
    case 'boss':
      return { ...next, phase: 'combat' }
    case 'rest':
      return { ...next, phase: 'rest' }
    case 'event':
      return { ...next, phase: 'event', activeEventId: node.eventId }
    case 'shop':
      return enterShop(next)
    case 'treasure': {
      const { relics, nextSeed } = pickRelicReward(next.rngSeed, next.relics, 1)
      const { value: gold, nextSeed: s2 } = rngRange(nextSeed, ...GOLD_BY_KIND.treasure!)
      next = { ...next, rngSeed: s2, pendingRelicReward: [...relics], pendingRewardGold: gold }
      return { ...next, phase: 'treasure' }
    }
  }
}

// ---------------------------------------------------------------------------
// Savaş sonucu
// ---------------------------------------------------------------------------

export function resolveCombatVictory(
  run: RunState,
  playerHpAfterCombat: number,
  combat?: Partial<CombatStats>,
  /** Savaştan sonra kalan iksirler (verilmezse koşudakiler korunur). */
  potionsLeft?: ReadonlyArray<string>,
): RunState {
  const node = currentNode(run)
  if (!node || run.phase !== 'combat') return run

  const [goldMin, goldMax] = GOLD_BY_KIND[node.kind] ?? [0, 0]
  const { value: goldGained, nextSeed: s1 } = rngRange(run.rngSeed, goldMin, goldMax)
  const weights = REWARD_WEIGHTS[node.kind === 'boss' ? 'boss' : node.kind === 'elite' ? 'elite' : 'normal']
  const { cards, nextSeed: s2 } = pickRewardCards(s1, REWARD_CARD_COUNT, characterPool(run), weights)

  let seed = s2
  let pendingRelicReward: string[] = []
  if (node.kind === 'elite' || node.kind === 'boss') {
    const { relics, nextSeed } = pickRelicReward(seed, run.relics, 3, node.kind === 'boss' ? 'uncommon' : undefined)
    pendingRelicReward = [...relics]
    seed = nextSeed
  }

  // İksir düşmesi (çanta doluysa düşmez)
  const potions = [...(potionsLeft ?? run.potions)]
  let pendingPotion: string | null = null
  const dropChance = POTION_DROP[node.kind] ?? 0
  if (dropChance > 0 && potions.length < POTION_SLOTS) {
    const { float, nextSeed } = rngFloat01(seed)
    seed = nextSeed
    if (float < dropChance) {
      const pick = pickPotion(seed)
      seed = pick.nextSeed
      pendingPotion = pick.id
      potions.push(pick.id)
    }
  }

  const healed = applyRelicsOnCombatEnd({ ...run, playerHp: Math.max(1, playerHpAfterCombat) }, run.relics)

  return {
    ...addGold(healed, goldGained),
    phase: 'reward',
    rngSeed: seed,
    pendingRewardCards: cards,
    pendingRewardGold: goldGained,
    pendingRelicReward,
    potions,
    pendingPotion,
    stats: {
      ...run.stats,
      goldEarned: run.stats.goldEarned + goldGained,
      enemiesKilled: run.stats.enemiesKilled + node.enemyDefIds.length,
      elitesKilled: run.stats.elitesKilled + (node.kind === 'elite' ? 1 : 0),
      damageDealt: run.stats.damageDealt + (combat?.damageDealt ?? 0),
      damageTaken: run.stats.damageTaken + (combat?.damageTaken ?? 0),
      cardsPlayed: run.stats.cardsPlayed + (combat?.cardsPlayed ?? 0),
    },
  }
}

export function resolveCombatDefeat(run: RunState, combat?: Partial<CombatStats>): RunState {
  return {
    ...run,
    phase: 'run_defeat',
    playerHp: 0,
    stats: {
      ...run.stats,
      damageDealt: run.stats.damageDealt + (combat?.damageDealt ?? 0),
      damageTaken: run.stats.damageTaken + (combat?.damageTaken ?? 0),
      cardsPlayed: run.stats.cardsPlayed + (combat?.cardsPlayed ?? 0),
    },
  }
}

export function applyRewardCard(run: RunState, defId: string | null): RunState {
  if (run.phase !== 'reward') return run
  if (defId && !run.pendingRewardCards.includes(defId)) return run
  const next: RunState = {
    ...run,
    deckDefIds: defId ? [...run.deckDefIds, defId] : run.deckDefIds,
    pendingRewardCards: [],
    pendingRewardGold: 0,
    pendingPotion: null,
  }
  return next.pendingRelicReward.length > 0 ? { ...next, phase: 'relic_reward' } : returnToMap(next)
}

export function applyRelicReward(run: RunState, relicId: string | null): RunState {
  if (run.phase !== 'relic_reward' && run.phase !== 'treasure') return run
  if (relicId && !run.pendingRelicReward.includes(relicId)) return run
  let next: RunState = run.phase === 'treasure' ? addGold(run, run.pendingRewardGold) : run
  if (relicId && RELIC_MAP[relicId]) {
    next = applyRelicOnPickup({ ...next, relics: [...next.relics, relicId] }, relicId)
  }
  return returnToMap({ ...next, pendingRelicReward: [], pendingRewardGold: 0 })
}

// ---------------------------------------------------------------------------
// Mola
// ---------------------------------------------------------------------------

export function restHealAmount(run: RunState) {
  return Math.floor(run.playerMaxHp * REST_HEAL_RATIO)
}

export function applyRestHeal(run: RunState): RunState {
  if (run.phase !== 'rest') return run
  return returnToMap({ ...run, playerHp: Math.min(run.playerMaxHp, run.playerHp + restHealAmount(run)) })
}

export function skipRest(run: RunState): RunState {
  return run.phase === 'rest' ? returnToMap(run) : run
}

/** Destedeki ilk `defId` kartını `+` sürümüyle değiştirir. */
function upgradeOne(run: RunState, defId: string): RunState {
  const def = CARD_DEFINITIONS_MAP[defId]
  const up = def ? getUpgradedDefinition(def) : null
  const idx = run.deckDefIds.indexOf(defId)
  if (!up || idx === -1) return run
  const deck = [...run.deckDefIds]
  deck[idx] = up.id
  return { ...run, deckDefIds: deck }
}

export function applyRestUpgrade(run: RunState, defId: string): RunState {
  if (run.phase !== 'rest') return run
  const next = upgradeOne(run, defId)
  return next === run ? run : returnToMap(next)
}

// ---------------------------------------------------------------------------
// Mağaza
// ---------------------------------------------------------------------------

export function enterShop(run: RunState): RunState {
  const { cards, nextSeed } = pickRewardCards(run.rngSeed, SHOP_CARD_COUNT, characterPool(run))
  const { value: saleIdx, nextSeed: s2 } = rngRange(nextSeed, 0, Math.max(0, cards.length - 1))
  const { relics, nextSeed: s3a } = pickRelicReward(s2, run.relics, 1)
  const p1 = pickPotion(s3a)
  let p2 = pickPotion(p1.nextSeed)
  if (p2.id === p1.id) p2 = pickPotion(p2.nextSeed)
  const s3 = p2.nextSeed
  const shopPotions: ShopOffer[] = [...new Set([p1.id, p2.id])].map((id) => ({
    defId: id,
    price: POTION_PRICE[POTION_MAP[id]!.rarity],
  }))

  const shopCards: ShopOffer[] = cards.map((defId, i) => {
    const price = getCardShopPrice(defId)
    return i === saleIdx ? { defId, price: Math.floor(price / 2), onSale: true } : { defId, price }
  })
  const relicId = relics[0]
  const shopRelic: ShopOffer | null = relicId
    ? { defId: relicId, price: RELIC_PRICE_BY_TIER[RELIC_MAP[relicId]!.tier] }
    : null

  return { ...run, phase: 'shop', rngSeed: s3, shopCards, shopRelic, shopPotions, shopRemovalUsed: false }
}

export function buyShopCard(run: RunState, defId: string): RunState {
  if (run.phase !== 'shop') return run
  const offer = run.shopCards.find((o) => o.defId === defId)
  if (!offer || run.gold < offer.price) return run
  return {
    ...run,
    gold: run.gold - offer.price,
    deckDefIds: [...run.deckDefIds, defId],
    shopCards: run.shopCards.filter((o) => o !== offer),
  }
}

export function buyShopRelic(run: RunState): RunState {
  const offer = run.shopRelic
  if (run.phase !== 'shop' || !offer || run.gold < offer.price) return run
  const next: RunState = { ...run, gold: run.gold - offer.price, relics: [...run.relics, offer.defId], shopRelic: null }
  return applyRelicOnPickup(next, offer.defId)
}

export function buyShopPotion(run: RunState, potionId: string): RunState {
  if (run.phase !== 'shop' || run.potions.length >= POTION_SLOTS) return run
  const offer = run.shopPotions.find((o) => o.defId === potionId)
  if (!offer || run.gold < offer.price) return run
  return {
    ...run,
    gold: run.gold - offer.price,
    potions: [...run.potions, potionId],
    shopPotions: run.shopPotions.filter((o) => o !== offer),
  }
}

/** İksiri at (çantada yer açmak için). */
export function discardPotion(run: RunState, index: number): RunState {
  if (index < 0 || index >= run.potions.length) return run
  return { ...run, potions: run.potions.filter((_, i) => i !== index) }
}

/** Desteden bir kart çıkar (ücretli, ziyaret başına bir kez; fiyat her seferinde artar). */
export function removeShopCard(run: RunState, defId: string): RunState {
  if (run.phase !== 'shop' || run.shopRemovalUsed || run.gold < run.shopRemovalPrice) return run
  const idx = run.deckDefIds.indexOf(defId)
  if (idx === -1) return run
  const deck = [...run.deckDefIds]
  deck.splice(idx, 1)
  return {
    ...run,
    gold: run.gold - run.shopRemovalPrice,
    deckDefIds: deck,
    shopRemovalPrice: run.shopRemovalPrice + SHOP_REMOVAL_STEP,
    shopRemovalUsed: true,
  }
}

export function leaveShop(run: RunState): RunState {
  if (run.phase !== 'shop') return run
  return returnToMap({ ...run, shopCards: [], shopRelic: null, shopPotions: [] })
}

// ---------------------------------------------------------------------------
// Olay (Event) düğümleri
// ---------------------------------------------------------------------------

/** Seçimin altın maliyeti — UI'da yetersiz altında seçeneği kapatmak için. */
export function eventOutcomeGoldCost(outcome: EventOutcome): number {
  return outcome.effects.reduce((sum, e) => (e.kind === 'loseGold' ? sum + e.amount : sum), 0)
}

/** Olay seçeneği seçildi; etkileri sırayla uygula ve haritaya dön. */
export function resolveEventChoice(run: RunState, outcome: EventOutcome): RunState {
  if (run.phase !== 'event') return run
  // Altını yetmeyen seçim uygulanmaz (UI zaten kapatır; bu ikinci savunma hattı).
  if (run.gold < eventOutcomeGoldCost(outcome)) return run

  let next: RunState = { ...run }

  for (const effect of outcome.effects) {
    switch (effect.kind) {
      case 'gainGold':
        next = addGold(next, effect.amount)
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
      case 'gainMaxHp':
        next = { ...next, playerMaxHp: next.playerMaxHp + effect.amount, playerHp: next.playerHp + effect.amount }
        break
      case 'gainCard':
        next = { ...next, deckDefIds: [...next.deckDefIds, effect.cardId] }
        break
      case 'gainRandomCard': {
        const pool = characterPool(next).filter((c) => !effect.rarity || c.rarity === effect.rarity)
        const { float, nextSeed } = rngFloat01(next.rngSeed)
        const pick = pool[Math.floor(float * pool.length)]
        next = { ...next, rngSeed: nextSeed, deckDefIds: pick ? [...next.deckDefIds, pick.id] : next.deckDefIds }
        break
      }
      case 'gainRelic': {
        const { relics, nextSeed } = pickRelicReward(next.rngSeed, next.relics, 1)
        next = { ...next, rngSeed: nextSeed }
        if (relics[0]) next = applyRelicOnPickup({ ...next, relics: [...next.relics, relics[0]] }, relics[0])
        break
      }
      case 'upgradeRandom': {
        for (let i = 0; i < effect.amount; i++) {
          const candidates = next.deckDefIds.filter((id) => {
            const def = CARD_DEFINITIONS_MAP[id]
            return def && getUpgradedDefinition(def)
          })
          if (!candidates.length) break
          const { float, nextSeed } = rngFloat01(next.rngSeed)
          next = upgradeOne({ ...next, rngSeed: nextSeed }, candidates[Math.floor(float * candidates.length)]!)
        }
        break
      }
      case 'removeStarter': {
        for (let i = 0; i < effect.amount; i++) {
          // Önce temel vuruş/savunma kartları, sonra diğer başlangıç kartları
          const basic = next.deckDefIds.findIndex((id) => BASIC_CARD_IDS.has(id.replace(/\+$/, '')))
          const idx = basic !== -1 ? basic : next.deckDefIds.findIndex((id) => getCardRarity(id) === 'starter')
          if (idx === -1) break
          const deck = [...next.deckDefIds]
          deck.splice(idx, 1)
          next = { ...next, deckDefIds: deck }
        }
        break
      }
    }
  }

  return returnToMap({ ...next, activeEventId: undefined })
}
