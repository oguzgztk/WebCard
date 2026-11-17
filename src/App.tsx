import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'

import { CombatScreen } from '@/components/combat/CombatScreen'
import { EventScreen } from '@/components/screens/EventScreen'
import { LobbyScreen } from '@/components/screens/LobbyScreen'
import { MapScreen } from '@/components/screens/MapScreen'
import { RelicRewardScreen } from '@/components/screens/RelicRewardScreen'
import { RestScreen } from '@/components/screens/RestScreen'
import { RewardScreen } from '@/components/screens/RewardScreen'
import { RunEndScreen } from '@/components/screens/RunEndScreen'
import { ShopScreen } from '@/components/screens/ShopScreen'
import type { BattleChoice } from '@/game/battleChoice'
import { nodeTitle } from '@/game/nodeText'
import { currentNode } from '@/game/runEngine'
import type { RunState } from '@/game/runTypes'
import { useRunStore } from '@/game/store/runStore'

/** Koşu düğümünden savaş parametreleri. */
function runBattle(run: RunState): BattleChoice | null {
  const node = currentNode(run)
  if (run.phase !== 'combat' || !node || !node.enemyDefIds.length) return null
  const prefix = node.kind === 'boss' ? 'Boss' : node.kind === 'elite' ? 'Elit' : `Kat ${node.floor + 1}`
  return {
    seed: node.seed,
    enemyDefIds: node.enemyDefIds,
    enemyHpScale: node.enemyHpScale,
    enemyStrength: node.enemyStrength,
    label: `${prefix} — ${nodeTitle(node)}`,
    deckDefinitionIds: run.deckDefIds,
    playerCurrentHp: run.playerHp,
    playerMaxHp: run.playerMaxHp,
    relicIds: run.relics,
    potions: run.potions,
    persistKey: node.id,
    characterId: run.characterId,
    tier: node.kind === 'boss' ? 'boss' : node.kind === 'elite' ? 'elite' : 'normal',
  }
}

export default function App() {
  const [quickBattle, setQuickBattle] = useState<BattleChoice | null>(null)
  const store = useRunStore()
  const { run } = store

  // Savaş parametreleri yalnızca düğüm değişince yeniden hesaplanır (kayıt/HP güncellemeleri savaşı sıfırlamasın).
  const nodeId = run?.phase === 'combat' ? run.currentNodeId : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const battle = useMemo(() => (run ? runBattle(run) : null), [nodeId])

  const screen = (() => {
    if (run) {
      switch (run.phase) {
        case 'run_victory':
        case 'run_defeat':
          return { key: 'end', el: <RunEndScreen run={run} onContinue={store.abandonRun} /> }
        case 'reward':
          return { key: 'reward', el: <RewardScreen run={run} onSelectCard={store.selectRewardCard} /> }
        case 'relic_reward':
        case 'treasure':
          return {
            key: run.phase,
            el: <RelicRewardScreen run={run} treasure={run.phase === 'treasure'} onSelectRelic={store.selectRelicReward} />,
          }
        case 'shop':
          return {
            key: 'shop',
            el: (
              <ShopScreen
                run={run}
                onBuyCard={store.buyCard}
                onBuyRelic={store.buyRelic}
                onBuyPotion={store.buyPotion}
                onRemoveCard={store.removeCard}
                onLeave={store.leaveShop}
              />
            ),
          }
        case 'event':
          return { key: 'event', el: <EventScreen run={run} onChoose={store.resolveEvent} /> }
        case 'rest':
          return {
            key: 'rest',
            el: <RestScreen run={run} onHeal={store.chooseHeal} onSkip={store.chooseSkipRest} onUpgradeCard={store.upgradeCardInDeck} />,
          }
        case 'combat':
          if (battle) {
            return {
              key: `combat-${battle.persistKey}`,
              el: (
                <CombatScreen battle={battle} onExit={store.exitToMenu} onVictory={store.completeCombat} onDefeat={store.defeatRun} />
              ),
            }
          }
          break
      }
      return {
        key: 'map',
        el: <MapScreen run={run} onSelectNode={store.selectNode} onExit={store.exitToMenu} onAbandon={store.abandonRun} />,
      }
    }

    if (quickBattle) {
      return {
        key: `quick-${quickBattle.seed}`,
        el: <CombatScreen battle={quickBattle} onExit={() => setQuickBattle(null)} />,
      }
    }

    return {
      key: 'lobby',
      el: (
        <LobbyScreen
          onStartBattle={setQuickBattle}
          onStartRun={(characterId, difficulty) => store.startRun(Date.now(), characterId, difficulty)}
          onContinueRun={store.loadRun}
          hasSavedRun={store.hasSavedRun()}
        />
      ),
    }
  })()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen.key}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
      >
        {screen.el}
      </motion.div>
    </AnimatePresence>
  )
}
