import { nanoid } from 'nanoid'

import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { POTION_MAP } from '@/data/potions'
import { ENEMY_DEFINITIONS_MAP } from '@/data/enemies'
import { HAND_DRAW_SIZE, PLAYER_MAX_HP, STARTING_MAX_ENERGY } from '@/game/constants'
import { discardWholeHandIntoDiscard, drawCards, instantiateDeck, shuffleDeck } from '@/game/engine/deckEngine'
import {
  calcDamage,
  clampStatusStacks,
  enemyHitsPlayer,
  evaluateVictory,
  gainPlayerBlock,
  rawDamageEnemy,
  resolveCardEffectsSequential,
} from '@/game/engine/effectResolver'
import { syncEnemyIntents, wipeEnemyTransientBlock } from '@/game/engine/intentEngine'
import {
  applyRelicsOnCardPlayed,
  applyRelicsOnCombatStart,
  applyRelicsOnTurnEnd,
  applyRelicsOnTurnStart,
} from '@/game/relics'
import { emptyStatuses, normalizeStatuses } from '@/game/statuses'
import type { CardDefinitionsMap, EnemyRuntime, GameState, Statuses } from '@/game/types'
import { sanitizeSeed } from '@/lib/rng'

type RelicIds = ReadonlyArray<string> | undefined

export function createEnemyRuntime(defId: string, intentOffset = 0, hpScale = 1): EnemyRuntime {
  const def = ENEMY_DEFINITIONS_MAP[defId]
  const maxHp = Math.max(1, Math.round(def.maxHp * hpScale))
  return {
    uid: nanoid(),
    defId,
    hp: maxHp,
    maxHp,
    block: 0,
    statuses: normalizeStatuses(def.startingStatuses),
    intent: def.intentScript(intentOffset),
    intentOffset,
  }
}

export type StartCombatOptions = {
  seed: number
  /** Tek düşman (geriye dönük). `enemyDefIds` verilirse yok sayılır. */
  enemyDefId?: string
  /** Birden çok düşmanlı karşılaşma. */
  enemyDefIds?: ReadonlyArray<string>
  /** Düşman can çarpanı (kat/zorluk ölçekleme). */
  enemyHpScale?: number
  /** Düşmanların savaş başı Güç bonusu. */
  enemyStrength?: number
  deckDefinitionIds: ReadonlyArray<string>
  playerMaxHp?: number
  /** Koşu modunda savaşlar arası taşınan can; belirtilmezse tam candan başlar. */
  playerCurrentHp?: number
  /** Aktif relic ID listesi. */
  relicIds?: ReadonlyArray<string>
  /** Savaşa getirilen iksirler. */
  potions?: ReadonlyArray<string>
}

export function startCombat(options: StartCombatOptions): GameState {
  const instances = instantiateDeck(options.deckDefinitionIds)
  const { shuffled, rngSeed } = shuffleDeck(instances, sanitizeSeed(options.seed))

  const enemyIds = options.enemyDefIds?.length ? options.enemyDefIds : [options.enemyDefId ?? 'jaw_worm']
  const enemies = enemyIds.map((id, i) => {
    const e = createEnemyRuntime(id, i * 2, options.enemyHpScale ?? 1)
    const bonus = options.enemyStrength ?? 0
    return bonus ? { ...e, statuses: { ...e.statuses, strength: e.statuses.strength + bonus } } : e
  })

  const maxHp = options.playerMaxHp ?? PLAYER_MAX_HP
  const hp =
    options.playerCurrentHp !== undefined ? Math.max(1, Math.min(options.playerCurrentHp, maxHp)) : maxHp

  // Innate: çekmeden önce destenin üstüne (dizinin sonuna) taşı.
  const isInnate = (defId: string) => Boolean(CARD_DEFINITIONS_MAP[defId]?.innate)
  const innate = shuffled.filter((c) => isInnate(c.defId))
  const drawPile = [...shuffled.filter((c) => !isInnate(c.defId)), ...innate]

  let state: GameState = {
    phase: 'playerTurn',
    rngSeed,
    playerTurnCount: 0,
    enemyIntentIndex: 0,
    player: { hp, maxHp, block: 0, energy: STARTING_MAX_ENERGY, maxEnergy: STARTING_MAX_ENERGY, statuses: emptyStatuses() },
    enemies,
    drawPile,
    discardPile: [],
    hand: [],
    exhaustPile: [],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0 },
    turnCounters: { attacks: 0, skills: 0 },
    potions: [...(options.potions ?? [])],
  }

  state = syncEnemyIntents(state)
  state = drawCards(state, Math.max(HAND_DRAW_SIZE, innate.length))
  state = applyRelicsOnCombatStart(state, options.relicIds ?? [])
  state = applyRelicsOnTurnStart(state, options.relicIds ?? [])
  return state
}

/** Kartın şu an oynanabilir olup olmadığı. */
export function canPlayCard(state: GameState, instanceId: string, cardDefs: CardDefinitionsMap = CARD_DEFINITIONS_MAP) {
  if (state.phase !== 'playerTurn') return false
  const inst = state.hand.find((c) => c.instanceId === instanceId)
  const def = inst ? cardDefs[inst.defId] : undefined
  return Boolean(def && state.player.energy >= def.cost)
}

export function playCard(
  state: GameState,
  instanceId: string,
  targetEnemyUid?: string | null,
  cardDefs: CardDefinitionsMap = CARD_DEFINITIONS_MAP,
  relicIds?: RelicIds,
): GameState {
  if (state.phase !== 'playerTurn' || state.enemies.length === 0) return state

  const cardIdx = state.hand.findIndex((c) => c.instanceId === instanceId)
  if (cardIdx === -1) return state
  const instance = state.hand[cardIdx]
  const def = cardDefs[instance.defId]
  if (!def || state.player.energy < def.cost) return state

  const hand = [...state.hand.slice(0, cardIdx), ...state.hand.slice(cardIdx + 1)]
  // Güç kartları ve Tüket kartları bu savaştan çıkar.
  const leavesCombat = def.exhaust || def.type === 'power'

  let next: GameState = {
    ...state,
    hand,
    discardPile: leavesCombat ? state.discardPile : [...state.discardPile, instance],
    exhaustPile: leavesCombat ? [...state.exhaustPile, instance] : state.exhaustPile,
    player: { ...state.player, energy: state.player.energy - def.cost },
    stats: { ...state.stats, cardsPlayed: state.stats.cardsPlayed + 1 },
    turnCounters: {
      attacks: state.turnCounters.attacks + (def.type === 'attack' ? 1 : 0),
      skills: state.turnCounters.skills + (def.type === 'skill' ? 1 : 0),
    },
  }

  next = resolveCardEffectsSequential(next, def.effects, { targetEnemyUid: targetEnemyUid ?? null })
  if (next.phase === 'playerTurn') next = applyRelicsOnCardPlayed(next, def, relicIds ?? [])
  return next
}

/** İksir kullan — enerji harcamaz; yalnızca oyuncu turunda. */
export function drinkPotion(state: GameState, index: number, targetEnemyUid?: string | null): GameState {
  if (state.phase !== 'playerTurn') return state
  const id = state.potions[index]
  const def = id ? POTION_MAP[id] : undefined
  if (!def) return state
  const next: GameState = { ...state, potions: state.potions.filter((_, i) => i !== index) }
  return resolveCardEffectsSequential(next, def.effects, { targetEnemyUid: targetEnemyUid ?? null })
}

// ---------------------------------------------------------------------------
// Tur akışı: beginEnemyTurn → resolveEnemyAction (her düşman) → finishEnemyTurn
// Arayüz adımları gecikmeyle oynatır; testler ve kayıttan dönüş `endPlayerTurn` ile tek seferde.
// ---------------------------------------------------------------------------

const decayDebuffs = (s: Statuses): Statuses => ({
  ...s,
  vulnerable: Math.max(0, s.vulnerable - 1),
  weak: Math.max(0, s.weak - 1),
})

/** Zehir: blok yok sayar, sonra 1 azalır. */
function tickEnemyPoison(state: GameState): GameState {
  let next = state
  for (const enemy of state.enemies) {
    const stacks = enemy.statuses.poison ?? 0
    if (stacks <= 0 || enemy.hp <= 0) continue
    next = rawDamageEnemy(next, enemy.uid, stacks, true)
    next = {
      ...next,
      enemies: next.enemies.map((e) =>
        e.uid === enemy.uid ? { ...e, statuses: { ...e.statuses, poison: stacks - 1 } } : e,
      ),
    }
  }
  return evaluateVictory(next)
}

/** Oyuncu turu biter: el atılır, tur sonu etkileri, oyuncu debuff'ları azalır, düşman zehri işler. */
export function beginEnemyTurn(state: GameState, relicIds?: RelicIds): GameState {
  if (state.phase !== 'playerTurn') return state

  let next = discardWholeHandIntoDiscard(state, CARD_DEFINITIONS_MAP)

  const metallicize = next.player.statuses.metallicize ?? 0
  if (metallicize > 0) next = gainPlayerBlock(next, metallicize, false)
  next = applyRelicsOnTurnEnd(next, relicIds ?? [])

  next = {
    ...next,
    phase: 'enemyTurn',
    player: { ...next.player, statuses: decayDebuffs(next.player.statuses) },
    enemies: wipeEnemyTransientBlock(next.enemies),
  }

  return tickEnemyPoison(next)
}

/** Tek düşmanın niyetini uygular. */
export function resolveEnemyAction(state: GameState, enemyUid: string): GameState {
  if (state.phase !== 'enemyTurn') return state
  const enemy = state.enemies.find((e) => e.uid === enemyUid && e.hp > 0)
  if (!enemy) return state

  const intent = enemy.intent
  const patchSelf = (patch: (e: EnemyRuntime) => EnemyRuntime): GameState => ({
    ...state,
    enemies: state.enemies.map((e) => (e.uid === enemyUid ? patch(e) : e)),
  })

  const attack = (from: GameState, raw: number, hits: number): GameState => {
    let next = from
    for (let s = 0; s < hits; s++) {
      const attacker = next.enemies.find((e) => e.uid === enemyUid && e.hp > 0)
      if (!attacker || next.phase !== 'enemyTurn') break
      next = enemyHitsPlayer(next, attacker, raw)
    }
    return next
  }

  switch (intent.kind) {
    case 'attack':
      return attack(state, intent.value ?? 0, Math.max(1, Math.min(99, intent.hits ?? 1)))
    case 'attack_defend': {
      const withBlock = patchSelf((e) => ({ ...e, block: e.block + (intent.block ?? 0) }))
      return attack(withBlock, intent.value ?? 0, Math.max(1, intent.hits ?? 1))
    }
    case 'defend':
      return patchSelf((e) => ({ ...e, block: e.block + (intent.value ?? 0) }))
    case 'buff':
      return patchSelf((e) => ({
        ...e,
        statuses: { ...e.statuses, strength: clampStatusStacks(e.statuses.strength + (intent.value ?? 0)) },
      }))
    case 'apply_player_weak':
    case 'apply_player_vulnerable': {
      const key = intent.kind === 'apply_player_weak' ? 'weak' : 'vulnerable'
      return {
        ...state,
        player: {
          ...state.player,
          statuses: { ...state.player.statuses, [key]: clampStatusStacks(state.player.statuses[key] + (intent.value ?? 0)) },
        },
      }
    }
  }
}

/** Düşman turu biter: düşman debuff'ları azalır, yeni niyetler, oyuncu turu başlar. */
export function finishEnemyTurn(state: GameState, relicIds?: RelicIds): GameState {
  if (state.phase !== 'enemyTurn') return state

  let next: GameState = {
    ...state,
    enemies: state.enemies.map((e) => ({ ...e, statuses: decayDebuffs(e.statuses) })),
    enemyIntentIndex: state.enemyIntentIndex + 1,
  }
  next = syncEnemyIntents(next)

  next = {
    ...next,
    phase: 'playerTurn',
    playerTurnCount: next.playerTurnCount + 1,
    player: { ...next.player, block: 0, energy: next.player.maxEnergy },
    turnCounters: { attacks: 0, skills: 0 },
  }

  // Oyuncu zehri (tur başı, blok yok sayar)
  const poison = next.player.statuses.poison ?? 0
  if (poison > 0) {
    const hp = Math.max(0, next.player.hp - poison)
    next = {
      ...next,
      player: { ...next.player, hp, statuses: { ...next.player.statuses, poison: poison - 1 } },
      stats: { ...next.stats, damageTaken: next.stats.damageTaken + (next.player.hp - hp) },
    }
    if (hp <= 0) return { ...next, phase: 'defeat' }
  }

  // Zehirli Duman: tüm düşmanlara zehir
  const noxious = next.player.statuses.noxious ?? 0
  if (noxious > 0) {
    next = {
      ...next,
      enemies: next.enemies.map((e) => ({
        ...e,
        statuses: { ...e.statuses, poison: clampStatusStacks(e.statuses.poison + noxious) },
      })),
    }
  }

  next = drawCards(next, HAND_DRAW_SIZE)
  next = applyRelicsOnTurnStart(next, relicIds ?? [])
  return next
}

/** Turu tek seferde çözer (testler, kayıttan dönüş, yapay zekâ simülasyonu). */
export function endPlayerTurn(state: GameState, relicIds?: RelicIds): GameState {
  let next = beginEnemyTurn(state, relicIds)
  for (const enemy of next.enemies) {
    if (next.phase !== 'enemyTurn') break
    next = resolveEnemyAction(next, enemy.uid)
  }
  return finishEnemyTurn(next, relicIds)
}

// ---------------------------------------------------------------------------
// Önizleme yardımcıları (arayüz)
// ---------------------------------------------------------------------------

/** Düşman niyetinin oyuncuya vuruş başına gerçek hasarı (saldırı değilse `null`). */
export function intentHitDamage(state: GameState, enemy: EnemyRuntime): number | null {
  const { intent } = enemy
  if (intent.kind !== 'attack' && intent.kind !== 'attack_defend') return null
  return calcDamage(intent.value ?? 0, enemy.statuses, state.player.statuses)
}

/** Bu tur oyuncuya gelecek toplam saldırı hasarı (blok düşülmeden). */
export function incomingDamage(state: GameState): number {
  return state.enemies.reduce((sum, e) => {
    const per = intentHitDamage(state, e)
    return per === null ? sum : sum + per * Math.max(1, e.intent.hits ?? 1)
  }, 0)
}
