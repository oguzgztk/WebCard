import { nanoid } from 'nanoid'

import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { ENEMY_DEFINITIONS_MAP } from '@/data/enemies'
import { HAND_DRAW_SIZE, PLAYER_MAX_HP, STARTING_MAX_ENERGY } from '@/game/constants'
import { discardWholeHandIntoDiscard, drawCards, instantiateDeck, shuffleDeck } from '@/game/engine/deckEngine'
import {
  clampStatusStacks,
  enemyIntentDamagePlayer,
  evaluateVictory,
  resolveCardEffectsSequential,
} from '@/game/engine/effectResolver'
import { syncEnemyIntents, wipeEnemyTransientBlock } from '@/game/engine/intentEngine'
import { applyRelicsOnCombatStart, applyRelicsOnTurnStart } from '@/game/relics'
import { STARTER_DECK_DEFINITION_IDS } from '@/game/starterDeck'
import type { CardDefinitionsMap, EnemyRuntime, GameState, StatusKey } from '@/game/types'
import { sanitizeSeed } from '@/lib/rng'

export const DEFAULT_CARD_LIBRARY: CardDefinitionsMap = CARD_DEFINITIONS_MAP

function emptyStatuses(): Record<StatusKey, number> {
  return { vulnerable: 0, weak: 0, strength: 0, poison: 0 }
}

export function createEnemyRuntime(defId: string, intentIndex: number): EnemyRuntime {
  const def = ENEMY_DEFINITIONS_MAP[defId]
  const intent = def.intentScript(intentIndex)
  return {
    uid: nanoid(),
    defId,
    hp: def.maxHp,
    maxHp: def.maxHp,
    block: 0,
    statuses: emptyStatuses(),
    intent,
  }
}

export function startCombat(options: {
  seed: number
  enemyDefId: string
  deckDefinitionIds?: ReadonlyArray<string>
  playerMaxHp?: number
  /** Koşu modunda savaşlar arası taşınan can; belirtilmezse tam candan başlar. */
  playerCurrentHp?: number
  /** Aktif relic ID listesi. */
  relicIds?: ReadonlyArray<string>
}): GameState {
  const deckIds = options.deckDefinitionIds ?? [...STARTER_DECK_DEFINITION_IDS]
  const instances = instantiateDeck(deckIds)
  const sanitizedSeed = sanitizeSeed(options.seed)
  const { shuffled: drawPile, rngSeed } = shuffleDeck(instances, sanitizedSeed)

  const enemy = createEnemyRuntime(options.enemyDefId, 0)

  const maxHpPlayer = options.playerMaxHp ?? PLAYER_MAX_HP
  const currentHpPlayer = options.playerCurrentHp !== undefined
    ? Math.max(1, Math.min(options.playerCurrentHp, maxHpPlayer))
    : maxHpPlayer

  let initial: GameState = {
    phase: 'playerTurn',
    rngSeed,
    playerTurnCount: 0,
    enemyIntentIndex: 0,
    player: {
      hp: currentHpPlayer,
      maxHp: maxHpPlayer,
      block: 0,
      energy: STARTING_MAX_ENERGY,
      maxEnergy: STARTING_MAX_ENERGY,
      statuses: emptyStatuses(),
    },
    enemies: [enemy],
    drawPile,
    discardPile: [],
    hand: [],
    exhaustPile: [],
  }

  // Innate: çekmeden önce innate kartları destenin üstüne (dizinin sonuna) taşı;
  // böylece el boyutu bozulmadan ilk elde yer alırlar.
  const innateCards = initial.drawPile.filter((c) => DEFAULT_CARD_LIBRARY[c.defId]?.innate)
  if (innateCards.length > 0) {
    const rest = initial.drawPile.filter((c) => !DEFAULT_CARD_LIBRARY[c.defId]?.innate)
    initial = { ...initial, drawPile: [...rest, ...innateCards] }
  }

  initial = syncEnemyIntents(initial)
  initial = drawCards(initial, Math.max(HAND_DRAW_SIZE, innateCards.length))

  // Relic hook: savaş başlangıcı
  if (options.relicIds && options.relicIds.length > 0) {
    initial = applyRelicsOnCombatStart(initial, options.relicIds)
  }

  return initial
}

export function playCard(
  state: GameState,
  instanceId: string,
  targetEnemyUid?: string | null,
  cardDefs: CardDefinitionsMap = CARD_DEFINITIONS_MAP,
) {
  if (state.phase !== 'playerTurn') return state
  if (state.enemies.length === 0) return state

  const cardIdx = state.hand.findIndex((c) => c.instanceId === instanceId)
  if (cardIdx === -1) return state

  const instance = state.hand[cardIdx]
  const blueprint = cardDefs[instance.defId]
  if (!blueprint || state.player.energy < blueprint.cost) {
    return state
  }

  const handWithout = [...state.hand.slice(0, cardIdx), ...state.hand.slice(cardIdx + 1)]
  let next: GameState = blueprint.exhaust
    ? {
        ...state,
        hand: handWithout,
        exhaustPile: [...state.exhaustPile, instance],
        player: { ...state.player, energy: state.player.energy - blueprint.cost },
      }
    : {
        ...state,
        hand: handWithout,
        discardPile: [...state.discardPile, instance],
        player: { ...state.player, energy: state.player.energy - blueprint.cost },
      }

  next = resolveCardEffectsSequential(next, blueprint.effects, {
    targetEnemyUid: targetEnemyUid ?? null,
  })

  if (next.phase === 'victory' || next.phase === 'defeat') {
    return next
  }

  return next
}

function applyEnemyTurn(state: GameState): GameState {
  if (state.phase !== 'enemyTurn') return state

  let next: GameState = {
    ...state,
    enemies: wipeEnemyTransientBlock(state.enemies),
  }

  const livingEnemiesOrder = [...next.enemies]

  for (const enemyBlueprint of livingEnemiesOrder) {
    const refreshed = next.enemies.find((e) => e.uid === enemyBlueprint.uid && e.hp > 0)

    if (!refreshed) continue

    const intent = refreshed.intent
    switch (intent.kind) {
      case 'attack': {
        const raw = intent.value ?? 0
        const swings = Math.max(1, Math.min(99, intent.hits ?? 1))
        for (let s = 0; s < swings; s++) {
          const attacker = next.enemies.find((e) => e.uid === refreshed.uid && e.hp > 0)
          if (!attacker) break
          next = enemyIntentDamagePlayer(next, attacker, raw)
          if (next.phase === 'defeat') return next
        }
        break
      }
      case 'defend': {
        const blockGain = intent.value ?? 0
        const updated = next.enemies.map((e) =>
          e.uid === refreshed.uid ? { ...e, block: e.block + blockGain } : e,
        )
        next = { ...next, enemies: updated }
        break
      }
      case 'buff': {
        // Buff: düşman güç (strength) kazanır
        const strengthGain = intent.value ?? 0
        const updated = next.enemies.map((e) =>
          e.uid === refreshed.uid
            ? { ...e, statuses: { ...e.statuses, strength: clampStatusStacks((e.statuses.strength ?? 0) + strengthGain) } }
            : e,
        )
        next = { ...next, enemies: updated }
        break
      }
      case 'apply_player_weak':
      case 'apply_player_vulnerable': {
        const key = intent.kind === 'apply_player_weak' ? 'weak' : 'vulnerable'
        const add = intent.value ?? 0
        next = {
          ...next,
          player: {
            ...next.player,
            statuses: {
              ...next.player.statuses,
              [key]: clampStatusStacks((next.player.statuses[key] ?? 0) + add),
            },
          },
        }
        break
      }
      default:
        break
    }
  }

  return next
}

function decayAllStatuses(state: GameState): GameState {
  // Tur sonu: vulnerable/weak -1. Strength kalıcı. Poison: tur başı tetiklenir ayrıca.
  const decay = (status: Record<StatusKey, number>): Record<StatusKey, number> => ({
    vulnerable: Math.max(0, status.vulnerable - 1),
    weak: Math.max(0, status.weak - 1),
    strength: status.strength,   // kalıcı
    poison: Math.max(0, status.poison - 1),  // tur sonunda -1
  })

  return {
    ...state,
    player: {
      ...state.player,
      statuses: decay(state.player.statuses),
    },
    enemies: state.enemies.map((enemy) => ({
      ...enemy,
      statuses: decay(enemy.statuses),
    })),
  }
}

/** Poison: tur başında her zehirli birim N hasar alır, sonra yığın -1 (decayAllStatuses ile). */
function applyPoisonDamage(state: GameState): GameState {
  let next = state

  // Düşmanlar üzerindeki poison
  for (const enemy of next.enemies) {
    const stacks = enemy.statuses.poison ?? 0
    if (stacks <= 0 || enemy.hp <= 0) continue
    const newHp = Math.max(0, enemy.hp - stacks)
    next = {
      ...next,
      enemies: next.enemies.map((e) =>
        e.uid === enemy.uid ? { ...e, hp: newHp } : e,
      ),
    }
  }

  // Oyuncu üzerindeki poison (düşman uygularsa)
  const playerPoison = next.player.statuses.poison ?? 0
  if (playerPoison > 0) {
    const newHp = Math.max(0, next.player.hp - playerPoison)
    next = { ...next, player: { ...next.player, hp: newHp } }
    if (next.player.hp <= 0) return { ...next, phase: 'defeat' }
  }

  // Zehirle ölen düşmanları temizle; hepsi öldüyse savaş biter.
  return evaluateVictory(next)
}

function refreshPlayerTurnResources(state: GameState, relicIds?: ReadonlyArray<string>): GameState {
  let next: GameState = {
    ...state,
    player: {
      ...state.player,
      block: 0,
      energy: state.player.maxEnergy,
    },
  }

  next = drawCards(next, HAND_DRAW_SIZE)

  // Relic hook: tur başlangıcı (enerji ve ekstralar)
  if (relicIds && relicIds.length > 0) {
    next = applyRelicsOnTurnStart(next, relicIds)
  }

  return next
}

export function endPlayerTurn(state: GameState, relicIds?: ReadonlyArray<string>): GameState {
  if (state.phase !== 'playerTurn') return state

  let next: GameState = discardWholeHandIntoDiscard({ ...state, phase: 'enemyTurn' }, DEFAULT_CARD_LIBRARY)

  // Tur başı: poison hasarı uygula (her iki taraf için)
  next = applyPoisonDamage(next)
  if (next.phase === 'victory' || next.phase === 'defeat') return next

  next = applyEnemyTurn(next)
  if (next.phase === 'defeat') {
    return next
  }

  next = {
    ...next,
    enemyIntentIndex: next.enemyIntentIndex + 1,
  }
  next = syncEnemyIntents(next)
  next = decayAllStatuses(next)
  next = refreshPlayerTurnResources(next, relicIds)

  next = {
    ...next,
    phase: 'playerTurn',
    playerTurnCount: next.playerTurnCount + 1,
  }

  return next
}
