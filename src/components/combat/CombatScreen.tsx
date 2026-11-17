import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useEffect } from 'react'

import { Hand } from '@/components/cards/Hand'
import { EnemyPanel } from '@/components/combat/EnemyPanel'
import { DeckPile } from '@/components/combat/DeckPile'
import { DiscardPile } from '@/components/combat/DiscardPile'
import { EndTurnButton } from '@/components/combat/EndTurnButton'
import { EnergyOrb } from '@/components/combat/EnergyOrb'
import { PlayerPanel } from '@/components/combat/PlayerPanel'
import { RelicBadgeRow } from '@/components/relics/RelicCard'
import { UIButton } from '@/components/ui/UIButton'
import type { BattleChoice } from '@/game/battleChoice'
import { RELIC_MAP } from '@/game/relics'
import { useGameStore } from '@/game/store/gameStore'
import type { EnemyRuntime, GamePhase } from '@/game/types'

type Props = Readonly<{
  battle: BattleChoice
  onLeaveBattle: () => void
  /** Koşu modu: galibiyette bu callback tetiklenir; menüye dönmek yerine ödüle geçilir. */
  onVictory?: (playerHpRemaining: number) => void
  /** Koşu modu: yenilgide bu callback tetiklenir. */
  onDefeat?: () => void
}>

/** Tek viewport içinde: üst çubuk, düşman orta bölge, alt bölümde el + oyuncu paneli (kaydırmasız) */
export function CombatScreen({ battle, onLeaveBattle, onVictory, onDefeat }: Props) {
  const game = useGameStore((s) => s.game)
  const targetBundle = useGameStore((s) => s.targetMode)
  const playCardBridge = useGameStore((s) => s.playCardAction)
  const lockTargetLens = useGameStore((s) => s.enterTargetMode)
  const dissolveTargetLens = useGameStore((s) => s.cancelTargetMode)
  const resolveRound = useGameStore((s) => s.endTurn)
  const restartCombat = useGameStore((s) => s.startNewCombat)
  const resumeOrStartCombat = useGameStore((s) => s.resumeOrStartCombat)
  const devKill = useGameStore((s) => s.devKillAllEnemies)

  useEffect(() => {
    // Koşu modunda (persistKey) yarım kalan savaş kaydı varsa oradan sürer.
    resumeOrStartCombat(battle)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle.seed, battle.enemyDefId, battle.persistKey])

  const playerMayAct = game.phase === 'playerTurn'
  const livingEnemies = game.enemies.filter((e) => e.hp > 0)
  const needsTargetPick = playerMayAct && livingEnemies.length > 1

  const handleCardTap = (instanceId: string) => {
    if (!playerMayAct) return

    const alive = game.enemies.filter((e) => e.hp > 0)
    if (alive.length > 1) {
      lockTargetLens(instanceId)
      return
    }
    playCardBridge(instanceId, alive.at(0)?.uid ?? null)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dissolveTargetLens()
        return
      }
      if (!playerMayAct) return
      const idx = parseInt(e.key, 10) - 1
      if (!isNaN(idx) && idx >= 0 && idx < game.hand.length) {
        handleCardTap(game.hand[idx].instanceId)
        return
      }
      if ((e.key === 'e' || e.key === 'E') && !targetBundle) {
        resolveRound(battle.relicIds)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dissolveTargetLens, playerMayAct, game.hand, targetBundle])

  const handleEnemyChosen = (enemy: EnemyRuntime) => () => {
    const id = targetBundle?.cardInstanceId
    if (!id) return
    playCardBridge(id, enemy.uid)
  }

  const statusCopy = summarizePhase(game.phase)

  const retryBattle = () => {
    restartCombat(
      battle.seed,
      battle.enemyDefId,
      battle.deckDefinitionIds,
      battle.playerCurrentHp,
      battle.playerMaxHp,
      battle.relicIds,
    )
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#080807]">
      <OutcomeModal
        phase={game.phase}
        onRestart={retryBattle}
        onGoLobby={onLeaveBattle}
        onContinueRun={onVictory ? () => onVictory(game.player.hp) : undefined}
        onRunDefeat={onDefeat}
      />

      {/* Üst çubuk */}
      <header className="surface-playmat flex shrink-0 items-center gap-3 border-b border-[#2c2824] px-3 py-2.5 backdrop-blur-sm sm:gap-4 sm:px-4">
        <UIButton
          tone="ghost"
          size="compact"
          className="shrink-0"
          title={battle.persistKey ? 'Menüye dön — koşu kaydedilir, "Devam et" ile sürer' : undefined}
          onClick={() => onLeaveBattle()}
        >
          ← Menü
        </UIButton>
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <span className="truncate font-display text-[0.955rem] font-semibold tracking-tight text-[#e4ddd0] sm:text-[1rem]">
            {battle.label}
          </span>
          {battle.relicIds && battle.relicIds.length > 0 && (
            <RelicBadgeRow relicIds={battle.relicIds} relicMap={RELIC_MAP} />
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#746b5f]">Tur</div>
            <div className="font-display text-xl font-semibold tabular-nums leading-none tracking-tight text-[#dfc07a]">
              {game.playerTurnCount}
            </div>
          </div>
          {import.meta.env.DEV && (
            <button
              onClick={devKill}
              title="DEV: Düşmanları öldür"
              className="rounded border border-dashed border-[#c45a3e]/50 px-2 py-0.5 text-[9px] font-mono text-[#c45a3e]/70 transition-colors hover:border-[#c45a3e] hover:text-[#c45a3e]"
            >
              ☠ dev
            </button>
          )}
          <EnergyOrb capacity={game.player.maxEnergy} current={game.player.energy} size="compact" />
        </div>
      </header>

      {/* Orta + alt: esnek yükseklik, el için ayrılmış alt bölüm */}
      <div className="relative flex min-h-0 flex-1 flex-col px-3 pb-2 pt-2 sm:px-4">
        <BackdropDimOverlay show={game.phase === 'enemyTurn'} />

        <LayoutGroup id="battlefield-layout">
          <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:flex-row lg:gap-3">
            {/* Deste / çöp */}
            <div className="flex shrink-0 flex-row justify-center gap-4 lg:w-[100px] lg:flex-col lg:justify-start lg:gap-2">
              <DeckPile count={game.drawPile.length} label="Deste" size="compact" />
              <DiscardPile count={game.discardPile.length} label="Çöp" size="compact" />
            </div>

            {/* Düşman — kalan yüksekliği doldur; kırpma yok, portre flex ile sığar */}
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="mx-auto flex w-full max-w-2xl flex-1 min-h-0 flex-col gap-2">
                  {game.enemies.map((enemy) => {
                    const awaits = Boolean(needsTargetPick && targetBundle)
                    return (
                      <div key={enemy.uid} className="flex min-h-0 flex-1 flex-col">
                        <EnemyPanel
                          enemy={enemy}
                          layout="compact"
                          awaitingTargetPick={awaits}
                          disabled={!awaits}
                          onDeclareTarget={targetBundle ? handleEnemyChosen(enemy) : () => undefined}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Alt blok */}
          <footer className="mt-1.5 flex shrink-0 flex-col gap-1.5 border-t border-[#252220] pt-1.5">
            {/* Oyuncu + kontroller */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <PlayerPanel player={game.player} layout="compact" />
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {targetBundle && playerMayAct && (
                  <p className="hidden max-w-[160px] text-[10px] leading-tight text-[#dfc07a]/85 sm:block">
                    Düşmana tıkla ·{' '}
                    <kbd className="rounded border border-[#3f3a34] bg-black/52 px-1 py-px text-[9px] text-[#c9bfaf]">
                      Esc
                    </kbd>
                  </p>
                )}
                {targetBundle && (
                  <UIButton tone="ghost" size="compact" onClick={() => dissolveTargetLens()}>
                    İptal
                  </UIButton>
                )}
                <UIButton tone="ghost" size="compact" onClick={() => retryBattle()}>
                  ↺
                </UIButton>
                <EndTurnButton
                  size="compact"
                  disabled={!playerMayAct || Boolean(targetBundle)}
                  onPush={() => resolveRound(battle.relicIds)}
                />
              </div>
            </div>

            {/* Durum şeridi */}
            <div className="flex items-center justify-between gap-2 px-0.5">
              <p className="text-[10px] leading-none text-[#5a5449]">{statusCopy}</p>
              {playerMayAct && !targetBundle && (
                <p className="hidden text-[9px] leading-none text-[#3f3b36] sm:block">
                  <kbd className="rounded border border-[#2c2924] bg-black/40 px-1">1–7</kbd> kart ·{' '}
                  <kbd className="rounded border border-[#2c2924] bg-black/40 px-1">E</kbd> tur bitir
                </p>
              )}
              {targetBundle && playerMayAct && (
                <p className="text-[10px] leading-none text-[#dfc07a]/70 sm:hidden">
                  Düşmana tıkla ya da{' '}
                  <kbd className="rounded border border-[#3f3a34] bg-black/52 px-1 py-px text-[9px] text-[#c9bfaf]">
                    Esc
                  </kbd>
                </p>
              )}
            </div>

            <div className="min-h-[15rem] shrink-0 sm:min-h-[15.5rem]">
              <Hand
                cards={game.hand}
                energy={game.player.energy}
                phaseAllowsPlay={playerMayAct}
                targetModeCardId={targetBundle?.cardInstanceId ?? null}
                onSelectCard={(id) => handleCardTap(id)}
                layout="compact"
              />
            </div>
          </footer>
        </LayoutGroup>
      </div>
    </div>
  )
}

function summarizePhase(phase: GamePhase): string {
  switch (phase) {
    case 'playerTurn':
      return 'Senin turun — kart oyna, enerjiyi kullan.'
    case 'enemyTurn':
      return 'Düşman turu.'
    case 'victory':
      return 'Kazandın.'
    case 'defeat':
      return 'Kaybettin.'
  }
}

function BackdropDimOverlay({ show }: { show: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 rounded-xl bg-[#070605]/74 sm:rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>
  )
}

function OutcomeModal({
  phase,
  onRestart,
  onGoLobby,
  onContinueRun,
  onRunDefeat,
}: {
  phase: GamePhase
  onRestart: () => void
  onGoLobby: () => void
  /** Koşu modunda galibiyette: ödül ekranına geç */
  onContinueRun?: () => void
  /** Koşu modunda yenilgide tetiklenir */
  onRunDefeat?: () => void
}) {
  const open = phase === 'victory' || phase === 'defeat'

  // Koşu yenilgisini dışarıya bildir
  useEffect(() => {
    if (phase === 'defeat' && onRunDefeat) {
      const t = setTimeout(onRunDefeat, 1800)
      return () => clearTimeout(t)
    }
  }, [phase, onRunDefeat])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[500] bg-[#060504]/92 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mx-auto mt-[12vh] max-w-md rounded-lg border border-[#3f3a34] bg-[#10100e]/98 p-8 text-center shadow-[0_32px_64px_-20px_rgb(0_0_0/0.85)] backdrop-blur-sm">
            <h2 className="font-display text-[2.125rem] font-semibold tracking-tight text-[#f2eae1] sm:text-[2.5rem]">
              {phase === 'victory' ? 'Zafer' : 'Yenilgi'}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#959084] sm:text-[0.9425rem]">
              {phase === 'victory'
                ? 'Rakibi devirdin.'
                : onRunDefeat
                  ? 'Can sıfırlandı. Koşu sona eriyor…'
                  : 'Can sıfırlandı. Tekrar dene.'}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {phase === 'victory' && onContinueRun ? (
                <>
                  <UIButton tone="primary" size="normal" onClick={onContinueRun}>
                    Devam et →
                  </UIButton>
                  <UIButton tone="ghost" size="normal" onClick={() => onGoLobby()}>
                    Menüye dön
                  </UIButton>
                </>
              ) : phase === 'defeat' && onRunDefeat ? (
                <UIButton tone="primary" size="normal" onClick={onRunDefeat}>
                  Devam et →
                </UIButton>
              ) : phase === 'victory' ? (
                <>
                  <UIButton tone="primary" size="normal" onClick={() => onRestart()}>
                    Aynı savaşı tekrarla
                  </UIButton>
                  <UIButton tone="ghost" size="normal" onClick={() => onGoLobby()}>
                    Menüye dön
                  </UIButton>
                </>
              ) : (
                <>
                  <UIButton tone="primary" size="normal" onClick={() => onRestart()}>
                    Tekrar dene
                  </UIButton>
                  <UIButton tone="ghost" size="normal" onClick={() => onGoLobby()}>
                    Menüye dön
                  </UIButton>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
