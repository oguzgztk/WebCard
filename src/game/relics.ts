/**
 * Relic (Yadigâr) sistemi.
 * Pasif güçler — hook noktalarında GameState veya RunState üzerinde etki uygular.
 * Yeni relic: ALL_RELICS'e tanım + ilgili hook'a bir `case`.
 */

import { drawCards } from '@/game/engine/deckEngine'
import { evaluateVictory, gainPlayerBlock, rawDamageEnemy } from '@/game/engine/effectResolver'
import type { RunState } from '@/game/runTypes'
import type { CardDefinition, GameState, StatusKey } from '@/game/types'
import { rngFloat01 } from '@/lib/rng'

export type RelicTier = 'common' | 'uncommon' | 'rare' | 'boss'

export interface RelicDefinition {
  id: string
  name: string
  description: string
  tier: RelicTier
  /** Emoji ikon (UI'da küçük rozet). */
  icon: string
}

export const ALL_RELICS: ReadonlyArray<RelicDefinition> = [
  // Yaygın
  { id: 'anchor', name: 'Demir Çapa', tier: 'common', icon: '⚓', description: 'Her savaşın başında 10 Blok kazan.' },
  { id: 'bag_of_prep', name: 'Hazırlık Çantası', tier: 'common', icon: '🎒', description: 'Her savaşın başında 2 ekstra kart çek.' },
  { id: 'happy_flower', name: 'Mutlu Çiçek', tier: 'common', icon: '🌸', description: 'Her 3 turda bir 1 Enerji kazan.' },
  { id: 'smooth_stone', name: 'Pürüzsüz Taş', tier: 'common', icon: '🪨', description: 'Her savaşın başında 1 Çeviklik kazan.' },
  { id: 'blood_vial', name: 'Kan Şişesi', tier: 'common', icon: '🧪', description: 'Her savaşın başında 3 can kazan.' },
  { id: 'strawberry', name: 'Yaban Çileği', tier: 'common', icon: '🍓', description: 'Alındığında Maksimum Canın 7 artar.' },
  { id: 'snake_ring', name: 'Yılan Yüzüğü', tier: 'common', icon: '🐍', description: 'Her savaşın başında tüm düşmanlara 2 Zehir uygula.' },
  { id: 'lantern', name: 'Fener', tier: 'common', icon: '🏮', description: 'Her savaşın ilk turunda 1 ekstra Enerji.' },
  // Nadir
  { id: 'burning_blood', name: 'Kızıl Kan', tier: 'uncommon', icon: '🩸', description: 'Her savaşın sonunda 6 can kazan.' },
  { id: 'vajra', name: 'Vajra', tier: 'uncommon', icon: '⚡', description: 'Her savaşın başında 1 Güç kazan.' },
  { id: 'orichalcum', name: 'Orikalkum', tier: 'uncommon', icon: '🔶', description: 'Turu bloksuz bitirirsen 6 Blok kazan.' },
  { id: 'bronze_scales', name: 'Bronz Pullar', tier: 'uncommon', icon: '🐉', description: 'Her savaşın başında 3 Diken kazan.' },
  { id: 'ornamental_fan', name: 'Süslü Yelpaze', tier: 'uncommon', icon: '🪭', description: 'Bir turda her 3 saldırı kartında 4 Blok kazan.' },
  { id: 'letter_opener', name: 'Mektup Açacağı', tier: 'uncommon', icon: '🗡', description: 'Bir turda her 3 beceri kartında tüm düşmanlara 5 hasar.' },
  // Efsanevi
  { id: 'philosophers_stone', name: 'Felsefe Taşı', tier: 'rare', icon: '💎', description: 'Her tur 1 ekstra Enerji. Düşmanlar savaş başında 1 Güç kazanır.' },
  { id: 'meat_on_the_bone', name: 'Kemikte Et', tier: 'rare', icon: '🍖', description: 'Savaş sonunda canın %50’nin altındaysa 12 can kazan.' },
  { id: 'shuriken', name: 'Shuriken', tier: 'rare', icon: '✴', description: 'Bir turda her 3 saldırı kartında 1 Güç kazan.' },
]

export const RELIC_MAP: Record<string, RelicDefinition> = Object.fromEntries(ALL_RELICS.map((r) => [r.id, r]))

const TIER_WEIGHT: Record<RelicTier, number> = { common: 6, uncommon: 3, rare: 1, boss: 0 }

/** Ödül/mağaza için `count` relic seç — tekrar yok, ağırlıklı tier, sahip olunanlar hariç. */
export function pickRelicReward(
  seed: number,
  alreadyOwned: ReadonlyArray<string>,
  count = 3,
  minTier?: RelicTier,
): { relics: ReadonlyArray<string>; nextSeed: number } {
  const order: RelicTier[] = ['common', 'uncommon', 'rare', 'boss']
  const minIdx = minTier ? order.indexOf(minTier) : 0
  const pool = ALL_RELICS.filter((r) => !alreadyOwned.includes(r.id) && order.indexOf(r.tier) >= minIdx).flatMap(
    (r) => Array<string>(TIER_WEIGHT[r.tier]).fill(r.id),
  )
  if (pool.length === 0) return { relics: [], nextSeed: seed }

  let s = seed
  const picked: string[] = []
  let attempts = 0
  while (picked.length < count && attempts < pool.length * 3) {
    const { float, nextSeed } = rngFloat01(s)
    s = nextSeed
    attempts++
    const candidate = pool[Math.floor(float * pool.length)]!
    if (!picked.includes(candidate)) picked.push(candidate)
  }
  return { relics: picked, nextSeed: s }
}

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

function addPlayerStatus(state: GameState, key: StatusKey, n: number): GameState {
  return {
    ...state,
    player: { ...state.player, statuses: { ...state.player.statuses, [key]: state.player.statuses[key] + n } },
  }
}

function gainEnergy(state: GameState, n: number): GameState {
  return { ...state, player: { ...state.player, energy: state.player.energy + n } }
}

// ---------------------------------------------------------------------------
// Savaş hook'ları
// ---------------------------------------------------------------------------

export function applyRelicsOnCombatStart(state: GameState, relicIds: ReadonlyArray<string>): GameState {
  let next = state
  for (const id of relicIds) {
    switch (id) {
      case 'anchor':
        next = gainPlayerBlock(next, 10, false)
        break
      case 'bag_of_prep':
        next = drawCards(next, 2)
        break
      case 'vajra':
        next = addPlayerStatus(next, 'strength', 1)
        break
      case 'smooth_stone':
        next = addPlayerStatus(next, 'dexterity', 1)
        break
      case 'bronze_scales':
        next = addPlayerStatus(next, 'thorns', 3)
        break
      case 'snake_ring':
        next = {
          ...next,
          enemies: next.enemies.map((e) => ({ ...e, statuses: { ...e.statuses, poison: e.statuses.poison + 2 } })),
        }
        break
      case 'blood_vial':
        next = { ...next, player: { ...next.player, hp: Math.min(next.player.maxHp, next.player.hp + 3) } }
        break
      case 'philosophers_stone':
        next = {
          ...next,
          enemies: next.enemies.map((e) => ({ ...e, statuses: { ...e.statuses, strength: e.statuses.strength + 1 } })),
        }
        break
    }
  }
  return next
}

/** Oyuncu turu başında (ilk tur dahil; `playerTurnCount` 0'dan başlar). */
export function applyRelicsOnTurnStart(state: GameState, relicIds: ReadonlyArray<string>): GameState {
  let next = state
  for (const id of relicIds) {
    switch (id) {
      case 'happy_flower':
        if (next.playerTurnCount % 3 === 2) next = gainEnergy(next, 1)
        break
      case 'lantern':
        if (next.playerTurnCount === 0) next = gainEnergy(next, 1)
        break
      case 'philosophers_stone':
        next = gainEnergy(next, 1)
        break
    }
  }
  return next
}

/** Oyuncu turu sonunda (el atıldıktan sonra, düşmanlar oynamadan önce). */
export function applyRelicsOnTurnEnd(state: GameState, relicIds: ReadonlyArray<string>): GameState {
  let next = state
  for (const id of relicIds) {
    if (id === 'orichalcum' && next.player.block === 0) next = gainPlayerBlock(next, 6, false)
  }
  return next
}

/** Kart oynandıktan sonra (`turnCounters` zaten güncel). */
export function applyRelicsOnCardPlayed(
  state: GameState,
  def: CardDefinition,
  relicIds: ReadonlyArray<string>,
): GameState {
  let next = state
  const { attacks, skills } = next.turnCounters
  const everyThird = (n: number) => n > 0 && n % 3 === 0
  for (const id of relicIds) {
    switch (id) {
      case 'ornamental_fan':
        if (def.type === 'attack' && everyThird(attacks)) next = gainPlayerBlock(next, 4, false)
        break
      case 'shuriken':
        if (def.type === 'attack' && everyThird(attacks)) next = addPlayerStatus(next, 'strength', 1)
        break
      case 'letter_opener':
        if (def.type === 'skill' && everyThird(skills)) {
          for (const e of next.enemies) next = rawDamageEnemy(next, e.uid, 5)
          next = evaluateVictory(next)
        }
        break
    }
  }
  return next
}

// ---------------------------------------------------------------------------
// Koşu hook'ları
// ---------------------------------------------------------------------------

/** Savaş sonu ek iyileşme. `run.playerHp` savaştan çıkan candır. */
export function applyRelicsOnCombatEnd(run: RunState, relicIds: ReadonlyArray<string>): RunState {
  let hp = run.playerHp
  for (const id of relicIds) {
    if (id === 'burning_blood') hp += 6
    if (id === 'meat_on_the_bone' && run.playerHp < run.playerMaxHp * 0.5) hp += 12
  }
  return { ...run, playerHp: Math.min(run.playerMaxHp, hp) }
}

/** Relic alındığı anda (ör. maksimum can). */
export function applyRelicOnPickup(run: RunState, relicId: string): RunState {
  if (relicId === 'strawberry') {
    return { ...run, playerMaxHp: run.playerMaxHp + 7, playerHp: run.playerHp + 7 }
  }
  return run
}
