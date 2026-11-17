import { create } from 'zustand'

import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { QUICK_BATTLE_DECK } from '@/data/characters'
import { potionNeedsTarget } from '@/data/potions'
import type { BattleChoice } from '@/game/battleChoice'
import {
  beginEnemyTurn,
  canPlayCard,
  finishEnemyTurn,
  playCard,
  resolveEnemyAction,
  startCombat,
  drinkPotion,
} from '@/game/engine/combatEngine'
import { loadCombat, saveCombat } from '@/game/store/persistence'
import { getSettings } from '@/game/store/settingsStore'
import type { GameState } from '@/game/types'
import { haptic, sfx } from '@/lib/audio'

/** Hedef seçimi bekleyen kart ya da iksir. */
export type TargetModeState = { cardInstanceId: string; potionIndex?: undefined } | { potionIndex: number; cardInstanceId?: undefined }

type CombatStore = {
  game: GameState
  battle: BattleChoice | null
  targetMode: TargetModeState | null
  /** Doluysa her değişiklikte savaş bu anahtarla kaydedilir (koşu modu). */
  persistKey: string | null
  /** Düşman turu oynatılıyor — oyuncu girdisi kilitli. */
  busy: boolean
  /** Şu an hamlesini yapan düşman (saldırı animasyonu için). */
  actingEnemyUid: string | null

  /** `battle.persistKey` ile eşleşen kayıt varsa onu yükler, yoksa yeni savaş başlatır. */
  startBattle: (battle: BattleChoice, opts?: { fresh?: boolean }) => void
  playCardAction: (instanceId: string, enemyUid?: string | null) => void
  /** Kartı oyna; birden çok düşman ve tek hedefli kartsa hedef seçimine gir. */
  tapCard: (instanceId: string) => void
  /** İksire dokun: gerekirse hedef seçimine gir, değilse hemen kullan. */
  tapPotion: (index: number) => void
  drinkPotionAction: (index: number, enemyUid?: string | null) => void
  endTurn: () => void
  enterTargetMode: (instanceId: string) => void
  cancelTargetMode: () => void
  /** DEV ONLY: tüm düşmanları anında öldür. */
  devKillAllEnemies: () => void
}

let turnToken = 0

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms * (getSettings().fastMode ? 0.45 : 1)))

function needsTarget(defId: string) {
  return CARD_DEFINITIONS_MAP[defId]?.effects.some(
    (e) => 'target' in e && e.target === 'enemy',
  ) ?? false
}

const placeholder = startCombat({ seed: 1, enemyDefId: 'jaw_worm', deckDefinitionIds: QUICK_BATTLE_DECK })

export const useGameStore = create<CombatStore>((set, get) => ({
  game: placeholder,
  battle: null,
  targetMode: null,
  persistKey: null,
  busy: false,
  actingEnemyUid: null,

  startBattle(battle, opts) {
    turnToken++
    const key = battle.persistKey ?? null
    const saved = key && !opts?.fresh ? loadCombat(key) : null
    set({
      battle,
      game:
        saved ??
        startCombat({
          seed: battle.seed,
          enemyDefIds: battle.enemyDefIds,
          enemyHpScale: battle.enemyHpScale,
          enemyStrength: battle.enemyStrength,
          deckDefinitionIds: battle.deckDefinitionIds,
          playerCurrentHp: battle.playerCurrentHp,
          playerMaxHp: battle.playerMaxHp,
          relicIds: battle.relicIds,
          potions: battle.potions,
        }),
      targetMode: null,
      persistKey: key,
      busy: false,
      actingEnemyUid: null,
    })
  },

  playCardAction(instanceId, enemyUid = null) {
    const { game, busy, battle } = get()
    if (busy) return
    if (!canPlayCard(game, instanceId)) {
      sfx.denied()
      set({ targetMode: null })
      return
    }
    set({ game: playCard(game, instanceId, enemyUid, CARD_DEFINITIONS_MAP, battle?.relicIds), targetMode: null })
  },

  tapCard(instanceId) {
    const { game, busy, targetMode } = get()
    if (busy || game.phase !== 'playerTurn') return
    if (targetMode && targetMode.cardInstanceId === instanceId) {
      set({ targetMode: null })
      return
    }
    const inst = game.hand.find((c) => c.instanceId === instanceId)
    if (!inst) return
    if (!canPlayCard(game, instanceId)) {
      sfx.denied()
      return
    }
    const alive = game.enemies.filter((e) => e.hp > 0)
    if (alive.length > 1 && needsTarget(inst.defId)) {
      sfx.click()
      set({ targetMode: { cardInstanceId: instanceId } })
      return
    }
    get().playCardAction(instanceId, alive[0]?.uid ?? null)
  },

  tapPotion(index) {
    const { game, busy, targetMode } = get()
    if (busy || game.phase !== 'playerTurn' || !game.potions[index]) return
    if (targetMode?.potionIndex === index) {
      set({ targetMode: null })
      return
    }
    const alive = game.enemies.filter((e) => e.hp > 0)
    if (alive.length > 1 && potionNeedsTarget(game.potions[index]!)) {
      sfx.click()
      set({ targetMode: { potionIndex: index } })
      return
    }
    get().drinkPotionAction(index, alive[0]?.uid ?? null)
  },

  drinkPotionAction(index, enemyUid = null) {
    const { game, busy } = get()
    if (busy) return
    sfx.relic()
    set({ game: drinkPotion(game, index, enemyUid), targetMode: null })
  },

  endTurn() {
    const { game, busy, battle } = get()
    if (busy || game.phase !== 'playerTurn') return
    const token = ++turnToken
    const relics = battle?.relicIds
    const alive = () => turnToken === token

    set({ busy: true, targetMode: null, game: beginEnemyTurn(game, relics) })
    sfx.enemyTurn()

    void (async () => {
      await wait(420)
      for (const enemy of get().game.enemies) {
        if (!alive() || get().game.phase !== 'enemyTurn') break
        if (!get().game.enemies.some((e) => e.uid === enemy.uid && e.hp > 0)) continue
        set({ actingEnemyUid: enemy.uid })
        await wait(240) // atılma animasyonu
        if (!alive()) return
        set({ game: resolveEnemyAction(get().game, enemy.uid) })
        await wait(380)
        if (!alive()) return
        set({ actingEnemyUid: null })
      }
      if (!alive()) return
      set({ game: finishEnemyTurn(get().game, relics), busy: false, actingEnemyUid: null })
    })()
  },

  enterTargetMode(instanceId) {
    if (get().game.phase !== 'playerTurn' || get().busy) return
    set({ targetMode: { cardInstanceId: instanceId } })
  },

  cancelTargetMode() {
    set({ targetMode: null })
  },

  devKillAllEnemies() {
    set((s) => ({ game: { ...s.game, enemies: [], phase: 'victory' }, targetMode: null }))
  },
}))

// ---------------------------------------------------------------------------
// Kalıcılık: koşu savaşını kaydet. Düşman turu ortası kaydedilmez — oyuncu
// menüden dönerse turu bitirmeden önceki ana döner (aynı tohum → aynı sonuç).
// ---------------------------------------------------------------------------

useGameStore.subscribe((state, prev) => {
  if (state.persistKey && state.game !== prev.game && state.game.phase !== 'enemyTurn') {
    saveCombat(state.persistKey, state.game)
  }
})

// ---------------------------------------------------------------------------
// Geri bildirim: durum farklarından ses + titreşim üret. Bileşenler bağımsız kalır.
// ---------------------------------------------------------------------------

useGameStore.subscribe((state, prev) => {
  const a = prev.game
  const b = state.game
  if (a === b || state.battle !== prev.battle) return

  // Oyuncu
  const hurt = a.player.hp - b.player.hp
  if (hurt > 0) {
    sfx.playerHurt(hurt)
    haptic(hurt >= 12 ? [60, 40, 80] : 45)
  } else if (b.player.block < a.player.block && b.phase === 'enemyTurn') {
    sfx.block()
  }
  if (b.player.block > a.player.block && b.phase === 'playerTurn') sfx.block()
  if (b.player.statuses.strength > a.player.statuses.strength || b.player.statuses.dexterity > a.player.statuses.dexterity) sfx.buff()
  if (b.player.statuses.weak > a.player.statuses.weak || b.player.statuses.vulnerable > a.player.statuses.vulnerable) sfx.debuff()

  // Kart oynandı
  if (b.stats.cardsPlayed > a.stats.cardsPlayed) sfx.cardPlay()

  // Düşmanlar
  let dealt = 0
  let died = false
  let poisoned = false
  for (const before of a.enemies) {
    const after = b.enemies.find((e) => e.uid === before.uid)
    if (!after) {
      if (before.hp > 0) died = true
      dealt += before.hp
      continue
    }
    dealt += Math.max(0, before.hp - after.hp)
    if (after.statuses.poison > before.statuses.poison) poisoned = true
    if (after.statuses.strength > before.statuses.strength && b.phase === 'enemyTurn') sfx.buff()
  }
  if (dealt > 0) {
    sfx.hit(dealt)
    haptic(dealt >= 15 ? 35 : 15)
  }
  if (died) sfx.enemyDeath()
  if (poisoned) sfx.poison()

  // Faz
  if (a.phase !== b.phase) {
    if (b.phase === 'victory') sfx.victory()
    if (b.phase === 'defeat') {
      sfx.defeat()
      haptic([100, 60, 200])
    }
    if (a.phase === 'enemyTurn' && b.phase === 'playerTurn') sfx.turnStart()
  }
})

if (import.meta.env.DEV) {
  const exposed = window as typeof window & { __GAME_STORE__?: typeof useGameStore }
  exposed.__GAME_STORE__ = useGameStore
}
