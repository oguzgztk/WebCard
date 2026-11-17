import { drawCards } from '@/game/engine/deckEngine'
import type { Effect, EnemyRuntime, GameState, StatusKey, TargetType } from '@/game/types'

const STATUS_CAP = 99

function modifyOutgoingDamage(raw: number, attackerStatuses: Record<StatusKey, number>) {
  let dmg = raw
  // Strength: sabit bonus (saldırı başına +N hasar)
  if (attackerStatuses.strength > 0) {
    dmg = dmg + attackerStatuses.strength
  }
  // Weak: %25 hasar azalması
  if (attackerStatuses.weak > 0) {
    dmg = Math.floor(dmg * 0.75)
  }
  return Math.max(0, dmg)
}

function modifyIncomingDamage(raw: number, defenderStatuses: Record<StatusKey, number>) {
  let dmg = raw
  if (defenderStatuses.vulnerable > 0) {
    dmg = Math.floor(dmg * 1.5)
  }
  return dmg
}

function applyOutgoingDamageAgainstEntity(
  baseDamage: number,
  defender: { statuses: Record<StatusKey, number>; block: number; hp: number },
  attackerStatuses: Record<StatusKey, number>,
) {
  let damage = modifyOutgoingDamage(baseDamage, attackerStatuses)
  damage = modifyIncomingDamage(damage, defender.statuses)

  const absorbed = Math.min(defender.block, damage)
  const nextBlock = defender.block - absorbed
  const hpLoss = damage - absorbed
  const nextHp = Math.max(0, defender.hp - hpLoss)

  return {
    defender: {
      ...defender,
      block: nextBlock,
      hp: nextHp,
    },
  }
}

export function clampStatusStacks(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(STATUS_CAP, value))
}

function applyStacks(current: Record<StatusKey, number>, key: StatusKey, delta: number) {
  return {
    ...current,
    [key]: clampStatusStacks((current[key] ?? 0) + delta),
  }
}

function pickPrimaryEnemy(state: GameState, preferredUid?: string | null) {
  if (preferredUid) {
    const match = state.enemies.find((enemy) => enemy.uid === preferredUid)
    if (match) return match
  }
  return state.enemies[0] ?? null
}

function mapEnemies(state: GameState, updater: (enemy: EnemyRuntime) => EnemyRuntime) {
  return {
    ...state,
    enemies: state.enemies.map(updater),
  }
}

/** Ölü düşmanları çıkarır; hiç kalmadıysa `victory`. Zehir gibi kart dışı hasar sonrası da çağrılmalı. */
export function evaluateVictory(state: GameState): GameState {
  const alive = state.enemies.filter((enemy) => enemy.hp > 0)
  if (alive.length === 0 && state.phase !== 'defeat') {
    return { ...state, enemies: [], phase: 'victory' }
  }
  return { ...state, enemies: alive }
}

function evaluateDefeat(state: GameState): GameState {
  if (state.player.hp <= 0) {
    return { ...state, phase: 'defeat' }
  }
  return state
}

function applyDamageToEnemyTarget(
  state: GameState,
  amount: number,
  target: TargetType,
  preferredUid: string | null,
) {
  const attackerStatuses = state.player.statuses

  if (target === 'allEnemies') {
    let nextState = state
    for (const enemy of state.enemies) {
      const live = nextState.enemies.find((e) => e.uid === enemy.uid)
      if (!live || live.hp <= 0) continue

      const { defender } = applyOutgoingDamageAgainstEntity(
        amount,
        {
          statuses: live.statuses,
          block: live.block,
          hp: live.hp,
        },
        attackerStatuses,
      )

      nextState = {
        ...nextState,
        enemies: nextState.enemies.map((candidate) =>
          candidate.uid === live.uid ? { ...candidate, ...defender } : candidate,
        ),
      }

      nextState = evaluateVictory(nextState)

      if (nextState.phase === 'victory') {
        break
      }
    }

    return nextState
  }

  const enemy = pickPrimaryEnemy(state, preferredUid)
  if (!enemy) {
    return state
  }

  const { defender } = applyOutgoingDamageAgainstEntity(amount, enemy, attackerStatuses)
  const patchedEnemy = { ...enemy, ...defender }

  const replacements = state.enemies.map((e) => (e.uid === patchedEnemy.uid ? patchedEnemy : e))

  let next: GameState = { ...state, enemies: replacements }
  next = evaluateVictory(next)
  return next
}

function applyDamageFromEnemyToPlayer(state: GameState, amount: number, attacker: EnemyRuntime) {
  const attackerStatuses = attacker.statuses
  const defender = state.player
  const { defender: updated } = applyOutgoingDamageAgainstEntity(amount, defender, attackerStatuses)

  let next: GameState = {
    ...state,
    player: {
      ...state.player,
      block: updated.block,
      hp: updated.hp,
    },
  }

  next = evaluateDefeat(next)
  return next
}

function applyStatusToTarget(
  state: GameState,
  status: StatusKey,
  amount: number,
  target: TargetType,
  preferredUid: string | null,
) {
  if (target === 'self') {
    return {
      ...state,
      player: {
        ...state.player,
        statuses: applyStacks(state.player.statuses, status, amount),
      },
    }
  }

  if (target === 'allEnemies') {
    return mapEnemies(state, (enemy) => ({
      ...enemy,
      statuses: applyStacks(enemy.statuses, status, amount),
    }))
  }

  const enemy = pickPrimaryEnemy(state, preferredUid)
  if (!enemy) return state

  return mapEnemies(state, (e) =>
    e.uid === enemy.uid
      ? {
          ...e,
          statuses: applyStacks(e.statuses, status, amount),
        }
      : e,
  )
}

export type ResolveEffectsOptions = Readonly<{ targetEnemyUid?: string | null }>

export function resolveCardEffectsSequential(
  state: GameState,
  effects: ReadonlyArray<Effect>,
  options: ResolveEffectsOptions = {},
): GameState {
  const preferredEnemyUid = options.targetEnemyUid ?? null

  return effects.reduce<GameState>((acc, effect) => {
    switch (effect.kind) {
      case 'damage': {
        return applyDamageToEnemyTarget(acc, effect.amount, effect.target, preferredEnemyUid)
      }
      case 'block': {
        return {
          ...acc,
          player: {
            ...acc.player,
            block: acc.player.block + effect.amount,
          },
        }
      }
      case 'draw': {
        return drawCards(acc, effect.amount)
      }
      case 'gainEnergy': {
        return {
          ...acc,
          player: {
            ...acc.player,
            energy: acc.player.energy + effect.amount,
          },
        }
      }
      case 'applyStatus': {
        return applyStatusToTarget(
          acc,
          effect.status,
          effect.amount,
          effect.target,
          preferredEnemyUid,
        )
      }
    }
  }, state)
}

export function enemyIntentDamagePlayer(state: GameState, attacker: EnemyRuntime, rawAmount: number) {
  return applyDamageFromEnemyToPlayer(state, rawAmount, attacker)
}
