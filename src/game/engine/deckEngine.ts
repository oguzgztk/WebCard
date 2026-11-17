import { nanoid } from 'nanoid'

import { MAX_HAND_SIZE } from '@/game/constants'
import type { CardInstance, GameState } from '@/game/types'
import { rngFloat01 } from '@/lib/rng'

export function instantiateDeck(definitionIds: ReadonlyArray<string>): CardInstance[] {
  return definitionIds.map((defId) => ({ instanceId: nanoid(), defId }))
}

/** Fisher-Yates karışması; her adımda RNG tohum güncellenir. */
export function shuffleDeck<T>(
  pile: readonly T[],
  rngSeed: number,
): { shuffled: T[]; rngSeed: number } {
  let nextSeed = rngSeed
  const items = [...pile]
  for (let i = items.length - 1; i > 0; i -= 1) {
    const { float, nextSeed: ns } = rngFloat01(nextSeed)
    nextSeed = ns
    const j = Math.floor(float * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return {
    shuffled: items,
    rngSeed: nextSeed,
  }
}

/** Üstden sıra kaydırmasını sıraylı tutmak için sırtı son elemanından okumak gerekiyor. */
function takeFromDrawTop(count: number, drawPile: CardInstance[]) {
  if (count <= 0) return { drawRemain: drawPile, grabbed: [] as CardInstance[] }
  const start = Math.max(0, drawPile.length - count)
  const segment = drawPile.slice(start)
  const grabbed = [...segment].reverse()
  const drawRemain = drawPile.slice(0, start)
  return { drawRemain, grabbed }
}

export function reshuffleDiscardIntoDrawIfNeeded(state: GameState): GameState {
  if (state.drawPile.length > 0 || state.discardPile.length === 0) {
    return state
  }

  const { shuffled, rngSeed: nextSeed } = shuffleDeck(state.discardPile, state.rngSeed)

  return {
    ...state,
    drawPile: shuffled,
    discardPile: [],
    rngSeed: nextSeed,
  }
}

/** El limitine saygılı çift yönde çözünülen çökme sırasından çekilir. */
export function drawCards(state: GameState, amount: number): GameState {
  if (amount <= 0) return state

  let mutable: GameState = { ...state, hand: [...state.hand], drawPile: [...state.drawPile] }
  let pending = amount

  while (pending > 0 && mutable.hand.length < MAX_HAND_SIZE) {
    mutable = reshuffleDiscardIntoDrawIfNeeded(mutable)

    if (mutable.drawPile.length === 0 && mutable.discardPile.length === 0) {
      break
    }

    if (mutable.drawPile.length === 0 && mutable.discardPile.length > 0) {
      mutable = reshuffleDiscardIntoDrawIfNeeded(mutable)
    }

    if (mutable.drawPile.length === 0) {
      break
    }

    const cap = MAX_HAND_SIZE - mutable.hand.length
    if (cap <= 0) break

    const drawNow = Math.min(cap, pending)
    const { drawRemain, grabbed } = takeFromDrawTop(drawNow, mutable.drawPile)

    mutable = {
      ...mutable,
      drawPile: drawRemain,
      hand: [...mutable.hand, ...grabbed],
    }

    pending -= grabbed.length
  }

  return mutable
}

/**
 * Tur sonu: Elde kalan ethereal kartlar exhaust'a, geri kalanlar discard'a gider.
 * Kartların keyword bilgisi için defs haritası gerekir.
 */
export function discardWholeHandIntoDiscard(
  state: GameState,
  defs: Readonly<Record<string, { ethereal?: boolean }>> = {},
): GameState {
  if (state.hand.length === 0) return state

  const ethereal: typeof state.hand = []
  const normal: typeof state.hand = []

  for (const card of state.hand) {
    if (defs[card.defId]?.ethereal) {
      ethereal.push(card)
    } else {
      normal.push(card)
    }
  }

  return {
    ...state,
    discardPile: [...state.discardPile, ...normal],
    exhaustPile: [...state.exhaustPile, ...ethereal],
    hand: [],
  }
}

/** Tek bir kart örneğini elden exhaust yığınına taşır. */
export function exhaustCardFromHand(state: GameState, instanceId: string): GameState {
  const idx = state.hand.findIndex((c) => c.instanceId === instanceId)
  if (idx === -1) return state
  const card = state.hand[idx]
  return {
    ...state,
    hand: [...state.hand.slice(0, idx), ...state.hand.slice(idx + 1)],
    exhaustPile: [...state.exhaustPile, card],
  }
}
