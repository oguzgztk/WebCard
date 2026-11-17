import { drawCards } from '@/game/engine/deckEngine'
import type { Effect, EnemyRuntime, GameState, StatusKey, Statuses, TargetType } from '@/game/types'

const STATUS_CAP = 999

function modifyOutgoingDamage(raw: number, attacker: Statuses) {
  let dmg = raw + (attacker.strength ?? 0)
  if ((attacker.weak ?? 0) > 0) dmg = Math.floor(dmg * 0.75)
  return Math.max(0, dmg)
}

function modifyIncomingDamage(raw: number, defender: Statuses) {
  return (defender.vulnerable ?? 0) > 0 ? Math.floor(raw * 1.5) : raw
}

/**
 * Saldıranın ve (varsa) savunanın durumlarına göre nihai vuruş hasarı.
 * Kart önizlemesi ve niyet göstergesi de bunu kullanır; tek doğru kaynak.
 */
export function calcDamage(raw: number, attacker: Statuses, defender?: Statuses) {
  const out = modifyOutgoingDamage(raw, attacker)
  return defender ? modifyIncomingDamage(out, defender) : out
}

/** Bloğu düşüp kalan hasarı cana uygular. Zehir/diken gibi ham hasar için de kullanılır. */
function absorb<T extends { block: number; hp: number }>(target: T, damage: number): { next: T; hpLoss: number } {
  const absorbed = Math.min(target.block, damage)
  const hpLoss = Math.min(target.hp, damage - absorbed)
  return { next: { ...target, block: target.block - absorbed, hp: target.hp - hpLoss }, hpLoss }
}

export function clampStatusStacks(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(STATUS_CAP, Math.round(value)))
}

function addStacks(current: Statuses, key: StatusKey, delta: number): Statuses {
  return { ...current, [key]: clampStatusStacks((current[key] ?? 0) + delta) }
}

function pickPrimaryEnemy(state: GameState, preferredUid?: string | null) {
  const alive = state.enemies.filter((e) => e.hp > 0)
  if (preferredUid) {
    const match = alive.find((enemy) => enemy.uid === preferredUid)
    if (match) return match
  }
  return alive[0] ?? null
}

/** Etkilenen düşmanların UID listesi. */
function targetUids(state: GameState, target: TargetType, preferredUid: string | null): string[] {
  if (target === 'allEnemies') return state.enemies.filter((e) => e.hp > 0).map((e) => e.uid)
  if (target === 'self') return []
  const enemy = pickPrimaryEnemy(state, preferredUid)
  return enemy ? [enemy.uid] : []
}

function patchEnemy(state: GameState, uid: string, patch: (e: EnemyRuntime) => EnemyRuntime): GameState {
  return { ...state, enemies: state.enemies.map((e) => (e.uid === uid ? patch(e) : e)) }
}

/** Ölü düşmanları çıkarır; hiç kalmadıysa `victory`. Zehir gibi kart dışı hasar sonrası da çağrılmalı. */
export function evaluateVictory(state: GameState): GameState {
  const alive = state.enemies.filter((enemy) => enemy.hp > 0)
  if (alive.length === 0 && state.phase !== 'defeat') {
    return { ...state, enemies: [], phase: 'victory' }
  }
  return alive.length === state.enemies.length ? state : { ...state, enemies: alive }
}

function evaluateDefeat(state: GameState): GameState {
  return state.player.hp <= 0 ? { ...state, phase: 'defeat' } : state
}

/** Oyuncudan düşmana tek vuruş (Güç/Zayıf/Savunmasız uygulanır). */
function playerHitsEnemy(state: GameState, uid: string, raw: number): GameState {
  const enemy = state.enemies.find((e) => e.uid === uid && e.hp > 0)
  if (!enemy) return state
  const damage = calcDamage(raw, state.player.statuses, enemy.statuses)
  const { next, hpLoss } = absorb(enemy, damage)
  return {
    ...patchEnemy(state, uid, () => next),
    stats: { ...state.stats, damageDealt: state.stats.damageDealt + hpLoss },
  }
}

function applyDamageEffect(
  state: GameState,
  raw: number,
  hits: number,
  target: TargetType,
  preferredUid: string | null,
): GameState {
  let next = state
  for (let h = 0; h < hits; h++) {
    for (const uid of targetUids(next, target, preferredUid)) {
      next = playerHitsEnemy(next, uid, raw)
    }
    next = evaluateVictory(next)
    if (next.phase === 'victory') break
  }
  return next
}

/** Ham hasar (zehir, diken) — durum çarpanları uygulanmaz. */
export function rawDamageEnemy(state: GameState, uid: string, amount: number, ignoreBlock = false): GameState {
  const enemy = state.enemies.find((e) => e.uid === uid && e.hp > 0)
  if (!enemy || amount <= 0) return state
  const { next, hpLoss } = ignoreBlock
    ? { next: { ...enemy, hp: Math.max(0, enemy.hp - amount) }, hpLoss: Math.min(enemy.hp, amount) }
    : absorb(enemy, amount)
  return {
    ...patchEnemy(state, uid, () => next),
    stats: { ...state.stats, damageDealt: state.stats.damageDealt + hpLoss },
  }
}

/**
 * Düşmandan oyuncuya tek vuruş. Oyuncunun Dikeni saldırana geri vurur.
 * Dönen `hpLoss` arayüz geri bildirimi için kullanılabilir.
 */
export function enemyHitsPlayer(state: GameState, attacker: EnemyRuntime, raw: number): GameState {
  const damage = calcDamage(raw, attacker.statuses, state.player.statuses)
  const { next: player, hpLoss } = absorb(state.player, damage)
  let next: GameState = {
    ...state,
    player,
    stats: { ...state.stats, damageTaken: state.stats.damageTaken + hpLoss },
  }
  next = evaluateDefeat(next)
  if (next.phase === 'defeat') return next

  const thorns = next.player.statuses.thorns ?? 0
  if (thorns > 0) {
    next = rawDamageEnemy(next, attacker.uid, thorns)
    next = evaluateVictory(next)
  }
  return next
}

function applyStatusToTarget(
  state: GameState,
  status: StatusKey,
  amount: number,
  target: TargetType,
  preferredUid: string | null,
): GameState {
  if (target === 'self') {
    return { ...state, player: { ...state.player, statuses: addStacks(state.player.statuses, status, amount) } }
  }
  let next = state
  for (const uid of targetUids(state, target, preferredUid)) {
    next = patchEnemy(next, uid, (e) => ({ ...e, statuses: addStacks(e.statuses, status, amount) }))
  }
  return next
}

function multiplyStatusOnTarget(
  state: GameState,
  status: StatusKey,
  factor: number,
  target: TargetType,
  preferredUid: string | null,
): GameState {
  const mul = (s: Statuses): Statuses => ({ ...s, [status]: clampStatusStacks((s[status] ?? 0) * factor) })
  if (target === 'self') return { ...state, player: { ...state.player, statuses: mul(state.player.statuses) } }
  let next = state
  for (const uid of targetUids(state, target, preferredUid)) {
    next = patchEnemy(next, uid, (e) => ({ ...e, statuses: mul(e.statuses) }))
  }
  return next
}

/** Oyuncuya blok ekler (Çeviklik dahil). */
export function gainPlayerBlock(state: GameState, amount: number, applyDexterity = true): GameState {
  const bonus = applyDexterity ? (state.player.statuses.dexterity ?? 0) : 0
  const gained = Math.max(0, amount + bonus)
  return { ...state, player: { ...state.player, block: state.player.block + gained } }
}

export type ResolveEffectsOptions = Readonly<{ targetEnemyUid?: string | null }>

export function resolveCardEffectsSequential(
  state: GameState,
  effects: ReadonlyArray<Effect>,
  options: ResolveEffectsOptions = {},
): GameState {
  const preferred = options.targetEnemyUid ?? null
  let acc = state

  for (const effect of effects) {
    if (acc.phase === 'victory' || acc.phase === 'defeat') break
    switch (effect.kind) {
      case 'damage':
        acc = applyDamageEffect(acc, effect.amount, Math.max(1, effect.hits ?? 1), effect.target, preferred)
        break
      case 'damageFromBlock':
        acc = applyDamageEffect(acc, acc.player.block, 1, effect.target, preferred)
        break
      case 'block':
        acc = gainPlayerBlock(acc, effect.amount)
        break
      case 'draw':
        acc = drawCards(acc, effect.amount)
        break
      case 'gainEnergy':
        acc = { ...acc, player: { ...acc.player, energy: acc.player.energy + effect.amount } }
        break
      case 'applyStatus':
        acc = applyStatusToTarget(acc, effect.status, effect.amount, effect.target, preferred)
        break
      case 'multiplyStatus':
        acc = multiplyStatusOnTarget(acc, effect.status, effect.factor, effect.target, preferred)
        break
    }
  }
  return acc
}
