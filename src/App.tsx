import { useCallback, useState } from 'react'

import { CombatScreen } from '@/components/combat/CombatScreen'
import { EventScreen } from '@/components/screens/EventScreen'
import { LobbyScreen } from '@/components/screens/LobbyScreen'
import { MapScreen } from '@/components/screens/MapScreen'
import { RelicRewardScreen } from '@/components/screens/RelicRewardScreen'
import { RestScreen } from '@/components/screens/RestScreen'
import { RewardScreen } from '@/components/screens/RewardScreen'
import { ShopScreen } from '@/components/screens/ShopScreen'
import type { BattleChoice } from '@/game/battleChoice'
import { useRunStore } from '@/game/store/runStore'
import type { MapNode } from '@/game/runTypes'
import { UIButton } from '@/components/ui/UIButton'
import { motion, AnimatePresence } from 'framer-motion'

/** Lobi → hızlı savaş modu (run dışı) */
type StandaloneState =
  | { mode: 'lobby' }
  | { mode: 'standalone_combat'; battle: BattleChoice }

export default function App() {
  const [standalone, setStandalone] = useState<StandaloneState>({ mode: 'lobby' })

  const run = useRunStore((s) => s.run)
  const startRun = useRunStore((s) => s.startRun)
  const loadRun = useRunStore((s) => s.loadRun)
  const hasSavedRun = useRunStore((s) => s.hasSavedRun)
  const completeCombatNode = useRunStore((s) => s.completeCombatNode)
  const completeBossNode = useRunStore((s) => s.completeBossNode)
  const enterCombatNodeAction = useRunStore((s) => s.enterCombatNodeAction)
  const enterRestNode = useRunStore((s) => s.enterRestNode)
  const chooseHeal = useRunStore((s) => s.chooseHeal)
  const chooseSkipRest = useRunStore((s) => s.chooseSkipRest)
  const selectRewardCard = useRunStore((s) => s.selectRewardCard)
  const selectRelicReward = useRunStore((s) => s.selectRelicReward)
  const upgradeCardInDeck = useRunStore((s) => s.upgradeCardInDeck)
  const enterShopNode = useRunStore((s) => s.enterShopNode)
  const buyCardFromShop = useRunStore((s) => s.buyCardFromShop)
  const removeCardFromDeck = useRunStore((s) => s.removeCardFromDeck)
  const leaveShopNode = useRunStore((s) => s.leaveShopNode)
  const enterEventNodeAction = useRunStore((s) => s.enterEventNodeAction)
  const resolveEventChoiceAction = useRunStore((s) => s.resolveEventChoiceAction)
  const defeatRun = useRunStore((s) => s.defeatRun)
  const abandonRun = useRunStore((s) => s.abandonRun)
  const exitToMenu = useRunStore((s) => s.exitToMenu)

  // -------------------------------------------------------------------------
  // Lobi / hızlı savaş
  // -------------------------------------------------------------------------

  const handleStartBattle = useCallback((choice: BattleChoice) => {
    setStandalone({ mode: 'standalone_combat', battle: choice })
  }, [])

  const handleLeaveBattle = useCallback(() => {
    setStandalone({ mode: 'lobby' })
  }, [])

  const handleStartRun = useCallback((characterId: string) => {
    startRun(Date.now(), characterId)
  }, [startRun])

  const handleContinueRun = useCallback(() => {
    loadRun()
  }, [loadRun])

  // -------------------------------------------------------------------------
  // Run modu: düğüm seçimi
  // -------------------------------------------------------------------------

  const handleSelectNode = useCallback(
    (nodeIndex: number) => {
      if (!run || run.phase !== 'map' || nodeIndex !== run.currentNodeIndex) return
      const node: MapNode | undefined = run.nodes[nodeIndex]
      if (!node || node.completed) return

      if (node.kind === 'rest') {
        enterRestNode()
        return
      }
      if (node.kind === 'shop') {
        enterShopNode()
        return
      }
      if (node.kind === 'event') {
        enterEventNodeAction()
        return
      }
      // combat / elite / boss
      enterCombatNodeAction()
    },
    [run, enterCombatNodeAction, enterRestNode, enterShopNode, enterEventNodeAction],
  )

  // -------------------------------------------------------------------------
  // Run modu: savaş sonuçları
  // -------------------------------------------------------------------------

  const handleRunVictory = useCallback(
    (playerHp: number) => {
      if (!run) return
      const node = run.nodes[run.currentNodeIndex]
      if (!node) return
      if (node.kind === 'boss') {
        completeBossNode(playerHp)
      } else {
        completeCombatNode(playerHp)
      }
    },
    [run, completeCombatNode, completeBossNode],
  )

  const handleRunDefeat = useCallback(() => {
    defeatRun()
  }, [defeatRun])

  // -------------------------------------------------------------------------
  // Run modu: combatScreen için BattleChoice hesapla
  // -------------------------------------------------------------------------

  const runBattle: BattleChoice | null = (() => {
    if (!run || run.phase !== 'combat') return null
    const node = run.nodes[run.currentNodeIndex]
    if (!node || node.kind === 'rest' || node.kind === 'shop' || node.kind === 'event') return null
    return {
      seed: node.seed,
      enemyDefId: node.enemyDefId,
      label: nodeCombatLabel(node),
      deckDefinitionIds: run.deckDefIds,
      playerCurrentHp: run.playerHp,
      playerMaxHp: run.playerMaxHp,
      relicIds: run.relics,
      persistKey: node.id,
    }
  })()

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Koşu aktifse
  if (run) {
    // Koşu bitti — zafer
    if (run.phase === 'run_victory') {
      return (
        <RunEndScreen
          outcome="victory"
          gold={run.gold}
          deckSize={run.deckDefIds.length}
          onContinue={abandonRun}
        />
      )
    }

    // Koşu bitti — yenilgi
    if (run.phase === 'run_defeat') {
      return (
        <RunEndScreen
          outcome="defeat"
          gold={run.gold}
          deckSize={run.deckDefIds.length}
          onContinue={abandonRun}
        />
      )
    }

    // Ödül ekranı
    if (run.phase === 'reward') {
      return (
        <RewardScreen
          rewardCardIds={run.pendingRewardCards}
          goldGained={run.pendingRewardGold}
          onSelectCard={selectRewardCard}
        />
      )
    }

    // Relic ödülü ekranı
    if (run.phase === 'relic_reward') {
      return (
        <RelicRewardScreen
          relicIds={run.pendingRelicReward}
          onSelectRelic={selectRelicReward}
        />
      )
    }

    // Mağaza ekranı
    if (run.phase === 'shop') {
      return (
        <ShopScreen
          run={run}
          onBuyCard={buyCardFromShop}
          onRemoveCard={removeCardFromDeck}
          onLeave={leaveShopNode}
        />
      )
    }

    // Olay ekranı
    if (run.phase === 'event') {
      return (
        <EventScreen
          run={run}
          onChoose={resolveEventChoiceAction}
        />
      )
    }

    // Mola ekranı
    if (run.phase === 'rest') {
      return (
        <RestScreen
          run={run}
          onHeal={chooseHeal}
          onSkip={chooseSkipRest}
          onUpgradeCard={upgradeCardInDeck}
        />
      )
    }

    // Savaş ekranı (combat / elite / boss düğümü seçiliyse)
    if (runBattle) {
      return (
        <CombatScreen
          battle={runBattle}
          onLeaveBattle={exitToMenu}
          onVictory={handleRunVictory}
          onDefeat={handleRunDefeat}
        />
      )
    }

    // Harita ekranı
    return (
      <MapScreen
        run={run}
        onSelectNode={handleSelectNode}
        onAbandon={abandonRun}
      />
    )
  }

  // -------------------------------------------------------------------------
  // Standalone (run dışı) akış
  // -------------------------------------------------------------------------

  if (standalone.mode === 'standalone_combat') {
    return (
      <CombatScreen
        battle={standalone.battle}
        onLeaveBattle={handleLeaveBattle}
      />
    )
  }

  return (
    <LobbyScreen
      onStartBattle={handleStartBattle}
      onStartRun={handleStartRun}
      onContinueRun={handleContinueRun}
      hasSavedRun={hasSavedRun()}
    />
  )
}

// ---------------------------------------------------------------------------
// Yardımcı: düğüm etiketleri
// ---------------------------------------------------------------------------

function nodeCombatLabel(node: MapNode): string {
  const prefixes: Record<string, string> = {
    elite: 'Elit',
    boss: 'Boss',
    combat: 'Savaş',
  }
  return `${prefixes[node.kind] ?? 'Savaş'} — ${node.enemyDefId.replace('_', ' ')}`
}

// ---------------------------------------------------------------------------
// Koşu bitiş ekranı
// ---------------------------------------------------------------------------

function RunEndScreen({
  outcome,
  gold,
  deckSize,
  onContinue,
}: {
  outcome: 'victory' | 'defeat'
  gold: number
  deckSize: number
  onContinue: () => void
}) {
  const isVictory = outcome === 'victory'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#080807] px-4">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background: isVictory
            ? 'radial-gradient(ellipse at 50% 30%, rgb(80 68 20/0.22) 0%, transparent 65%)'
            : 'radial-gradient(ellipse at 50% 30%, rgb(80 20 20/0.22) 0%, transparent 65%)',
        }}
      />
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, type: 'spring', stiffness: 220, damping: 26 }}
          className="relative z-10 w-full max-w-md rounded-2xl border border-[#3f3a34] bg-[#10100e]/98 p-10 text-center shadow-[0_32px_64px_-20px_rgb(0_0_0/0.85)]"
        >
          <div className="mb-4 text-5xl">{isVictory ? '🏆' : '💀'}</div>
          <h1 className="font-display text-[2.5rem] font-semibold tracking-tight text-[#f2eae1]">
            {isVictory ? 'Koşu Tamamlandı' : 'Koşu Sona Erdi'}
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-[#7a7268]">
            {isVictory
              ? 'Tüm düşmanları yendin. Zindan sana boyun eğdi.'
              : 'Canın tükendi. Ancak edindiğin deneyim silinmez.'}
          </p>

          <div className="mt-8 flex justify-center gap-8 border-t border-[#2a2520] pt-6">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#5a5447]">Toplam Altın</p>
              <p className="font-display mt-1 text-2xl font-semibold tabular-nums text-[#c4a054]">
                {gold}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#5a5447]">Son Deste</p>
              <p className="font-display mt-1 text-2xl font-semibold tabular-nums text-[#c4beb4]">
                {deckSize} kart
              </p>
            </div>
          </div>

          <div className="mt-8">
            <UIButton tone="primary" size="normal" className="w-full" onClick={onContinue}>
              Ana Menüye Dön
            </UIButton>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
