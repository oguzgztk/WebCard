import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Hand } from '@/components/cards/Hand'
import { EndTurnButton } from '@/components/combat/EndTurnButton'
import { EnemyPanel } from '@/components/combat/EnemyPanel'
import { EnergyOrb } from '@/components/combat/EnergyOrb'
import { PileIndicator } from '@/components/combat/PileIndicators'
import { PlayerPanel } from '@/components/combat/PlayerPanel'
import { RelicBadgeRow } from '@/components/relics/RelicCard'
import { DeckViewer } from '@/components/ui/DeckViewer'
import { SettingsButton } from '@/components/ui/SettingsButton'
import { UIButton } from '@/components/ui/UIButton'
import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import type { BattleChoice } from '@/game/battleChoice'
import { incomingDamage, intentHitDamage } from '@/game/engine/combatEngine'
import { useGameStore } from '@/game/store/gameStore'
import type { CombatStats, GameState } from '@/game/types'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  battle: BattleChoice
  /** Menüye dön (koşu modunda koşu kayıtlı kalır). */
  onExit: () => void
  /** Koşu modu: galibiyette ödüle geç. */
  onVictory?: (playerHp: number, stats: CombatStats) => void
  /** Koşu modu: yenilgi. */
  onDefeat?: (stats: CombatStats) => void
}>

type Pile = 'draw' | 'discard' | 'exhaust' | null

export function CombatScreen({ battle, onExit, onVictory, onDefeat }: Props) {
  const game = useGameStore((s) => s.game)
  const targetMode = useGameStore((s) => s.targetMode)
  const busy = useGameStore((s) => s.busy)
  const actingEnemyUid = useGameStore((s) => s.actingEnemyUid)
  const startBattle = useGameStore((s) => s.startBattle)
  const tapCard = useGameStore((s) => s.tapCard)
  const playCardAction = useGameStore((s) => s.playCardAction)
  const cancelTargetMode = useGameStore((s) => s.cancelTargetMode)
  const endTurn = useGameStore((s) => s.endTurn)
  const devKill = useGameStore((s) => s.devKillAllEnemies)
  const activeBattle = useGameStore((s) => s.battle)

  const runMode = Boolean(onVictory)
  const [pile, setPile] = useState<Pile>(null)
  const shake = useAnimationControls()

  useEffect(() => {
    startBattle(battle)
    // Savaş kimliği değişince yeniden başlat; diğer alanlar aynı savaşın parçası.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle.seed, battle.persistKey, battle.enemyDefIds.join()])

  // Oyuncu hasar alınca ekran sarsıntısı
  const prevHp = useRef(game.player.hp)
  useEffect(() => {
    const lost = prevHp.current - game.player.hp
    prevHp.current = game.player.hp
    if (lost > 0) {
      const k = Math.min(1, lost / 18)
      void shake.start({ x: [0, -10 * k - 3, 9 * k + 2, -6 * k, 3, 0], transition: { duration: 0.4 } })
    }
  }, [game.player.hp, shake])

  const playerTurn = game.phase === 'playerTurn' && !busy
  const livingEnemies = game.enemies.filter((e) => e.hp > 0)
  const incoming = useMemo(() => incomingDamage(game), [game])
  const hasPlayable = game.hand.some((c) => (CARD_DEFINITIONS_MAP[c.defId]?.cost ?? 99) <= game.player.energy)

  const textContext = useMemo(
    () => ({
      player: game.player.statuses,
      block: game.player.block,
      target: livingEnemies.length === 1 ? livingEnemies[0]!.statuses : undefined,
    }),
    [game.player.statuses, game.player.block, livingEnemies],
  )

  // Klavye: 1–9 kart, E tur bitir, Esc iptal; hedef modunda 1–n düşman seç.
  const stateRef = useRef({ game, targetMode, playerTurn, pile })
  stateRef.current = { game, targetMode, playerTurn, pile }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { game: g, targetMode: tm, playerTurn: pt, pile: p } = stateRef.current
      if (p || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') {
        cancelTargetMode()
        return
      }
      if (!pt) return
      const n = parseInt(e.key, 10)
      if (!Number.isNaN(n) && n >= 1) {
        if (tm) {
          const enemy = g.enemies.filter((x) => x.hp > 0)[n - 1]
          if (enemy) playCardAction(tm.cardInstanceId, enemy.uid)
        } else if (g.hand[n - 1]) {
          tapCard(g.hand[n - 1]!.instanceId)
        }
        return
      }
      if (e.key.toLowerCase() === 'e' && !tm) endTurn()
      if (e.key.toLowerCase() === 'd') setPile('draw')
      if (e.key.toLowerCase() === 'a') setPile('discard')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancelTargetMode, playCardAction, tapCard, endTurn])

  // Store bu savaşı başlatana kadar çizme — önceki savaşın durumundan sahte can/blok animasyonları olmasın.
  if (activeBattle !== battle) return <div className="h-dvh bg-[#080807]" />

  const tierBadge =
    battle.tier === 'boss' ? 'border-[#6a3aa8] text-[#c8a0f0]' : battle.tier === 'elite' ? 'border-[#a84a3a] text-[#f0a08a]' : ''

  return (
    <motion.div
      animate={shake}
      className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#080807]"
      onClick={() => targetMode && cancelTargetMode()}
    >
      {/* Sahne ışığı */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-700',
          battle.tier === 'boss' ? 'opacity-100' : 'opacity-60',
        )}
        style={{
          background:
            battle.tier === 'boss'
              ? 'radial-gradient(ellipse 70% 50% at 50% 30%, rgb(70 30 90/0.35), transparent 70%)'
              : 'radial-gradient(ellipse 70% 50% at 50% 30%, rgb(90 60 35/0.28), transparent 70%)',
        }}
      />
      <AnimatePresence>
        {game.phase === 'enemyTurn' && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_50%_100%,rgb(120_20_10/0.25),transparent_60%)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <OutcomeOverlay
        game={game}
        runMode={runMode}
        onContinue={() => onVictory?.(game.player.hp, game.stats)}
        onDefeat={() => onDefeat?.(game.stats)}
        onRetry={() => startBattle(battle, { fresh: true })}
        onExit={onExit}
      />
      <TurnBanner game={game} />

      {/* Üst çubuk */}
      <header className="relative z-20 flex shrink-0 items-center gap-2 border-b border-[#2c2824] bg-black/30 px-3 py-2 backdrop-blur-sm sm:gap-3 sm:px-4">
        <UIButton
          tone="ghost"
          size="compact"
          className="shrink-0"
          title={runMode ? 'Menüye dön — koşu kaydedilir, "Devam et" ile sürer' : 'Menüye dön'}
          onClick={(e) => {
            e.stopPropagation()
            onExit()
          }}
        >
          ← Menü
        </UIButton>
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <span
            className={cn(
              'truncate font-display text-[1rem] font-semibold tracking-tight text-[#e4ddd0]',
              tierBadge && `rounded-md border px-2 ${tierBadge}`,
            )}
          >
            {battle.label}
          </span>
          {battle.relicIds && battle.relicIds.length > 0 && <RelicBadgeRow relicIds={battle.relicIds} />}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#746b5f]">Tur</div>
            <div className="font-display text-xl font-semibold tabular-nums leading-none text-[#dfc07a]">
              {game.playerTurnCount + 1}
            </div>
          </div>
          {import.meta.env.DEV && (
            <button
              onClick={devKill}
              title="DEV: Düşmanları öldür"
              className="rounded border border-dashed border-[#c45a3e]/50 px-2 py-0.5 font-mono text-[9px] text-[#c45a3e]/70 hover:text-[#c45a3e]"
            >
              ☠ dev
            </button>
          )}
          <SettingsButton />
        </div>
      </header>

      {/* Düşmanlar */}
      <main className="relative z-0 flex min-h-0 flex-1 items-center justify-center gap-2 px-3 pb-1 pt-3 sm:gap-8 sm:px-6">
        <AnimatePresence>
          {game.enemies.map((enemy) => {
            const idx = livingEnemies.findIndex((e) => e.uid === enemy.uid)
            return (
              <EnemyPanel
                key={enemy.uid}
                enemy={enemy}
                count={game.enemies.length}
                intentDamage={intentHitDamage(game, enemy)}
                targetable={Boolean(targetMode) && playerTurn}
                acting={actingEnemyUid === enemy.uid}
                hotkey={idx >= 0 ? idx + 1 : undefined}
                onSelect={() => targetMode && playCardAction(targetMode.cardInstanceId, enemy.uid)}
              />
            )
          })}
        </AnimatePresence>
        <AnimatePresence>
          {targetMode && playerTurn && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-[#5a4a2a] bg-black/80 px-3 py-1 text-[12px] font-medium text-[#e8c878]"
            >
              Hedef seç · <kbd className="text-[10px] opacity-70">1–{livingEnemies.length}</kbd> · Esc iptal
            </motion.p>
          )}
        </AnimatePresence>
      </main>

      {/* Alt bölüm */}
      <footer className="relative z-20 flex shrink-0 flex-col gap-1.5 border-t border-[#252220] bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-1.5 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="min-w-0 flex-1 sm:max-w-md">
            <PlayerPanel
              player={game.player}
              characterId={battle.characterId}
              incoming={incoming}
              showIncoming={game.phase === 'playerTurn'}
            />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <EndTurnButton disabled={!playerTurn || Boolean(targetMode)} busy={busy} nudge={!hasPlayable} onPush={endTurn} />
          </div>
        </div>

        <div className="flex h-[13.4rem] min-h-0 items-end gap-1.5 sm:gap-3">
          <div className="flex shrink-0 flex-col items-center gap-2 pb-1">
            <EnergyOrb capacity={game.player.maxEnergy} current={game.player.energy} />
            <PileIndicator label="Çekme destesi" icon="🂠" count={game.drawPile.length} onOpen={() => setPile('draw')} hotkey="D" />
          </div>
          <div className="min-w-0 flex-1 self-stretch">
            <Hand
              cards={game.hand}
              energy={game.player.energy}
              phaseAllowsPlay={playerTurn}
              targetModeCardId={targetMode?.cardInstanceId ?? null}
              onSelectCard={tapCard}
              textContext={textContext}
            />
          </div>
          <div className="flex shrink-0 flex-col items-center gap-2 pb-1">
            <PileIndicator label="Atılanlar" icon="♻" tone="discard" count={game.discardPile.length} onOpen={() => setPile('discard')} hotkey="A" />
            <PileIndicator label="Tükenenler" icon="✕" tone="exhaust" count={game.exhaustPile.length} onOpen={() => setPile('exhaust')} />
          </div>
        </div>
      </footer>

      <DeckViewer
        open={pile !== null}
        onClose={() => setPile(null)}
        title={pile === 'draw' ? 'Çekme Destesi' : pile === 'discard' ? 'Atılanlar' : 'Tükenenler'}
        defIds={(pile === 'draw' ? game.drawPile : pile === 'discard' ? game.discardPile : game.exhaustPile).map((c) => c.defId)}
        sorted
        emptyText="Bu yığında kart yok."
      />
    </motion.div>
  )
}

// ---------------------------------------------------------------------------

function TurnBanner({ game }: { game: GameState }) {
  const [banner, setBanner] = useState<{ key: number; text: string; enemy: boolean } | null>(null)
  const prev = useRef(game.phase)

  useEffect(() => {
    const from = prev.current
    prev.current = game.phase
    if (from === game.phase) return
    if (game.phase === 'enemyTurn') setBanner({ key: Date.now(), text: 'Düşman Turu', enemy: true })
    else if (game.phase === 'playerTurn' && from === 'enemyTurn') setBanner({ key: Date.now(), text: 'Senin Turun', enemy: false })
    else return
    const t = window.setTimeout(() => setBanner(null), 900)
    return () => window.clearTimeout(t)
  }, [game.phase])

  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          key={banner.key}
          className="pointer-events-none absolute inset-x-0 top-[38%] z-40 flex justify-center"
          initial={{ opacity: 0, scaleX: 0.3 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 1.2 }}
          transition={{ duration: 0.28 }}
        >
          <div
            className={cn(
              'w-full max-w-xl border-y py-3 text-center font-display text-[2.1rem] font-semibold tracking-tight backdrop-blur-sm',
              banner.enemy
                ? 'border-[#7a3020]/70 bg-[linear-gradient(90deg,transparent,rgb(60_12_8/0.85),transparent)] text-[#ffb4a0]'
                : 'border-[#8a7030]/70 bg-[linear-gradient(90deg,transparent,rgb(50_40_14/0.85),transparent)] text-[#f0d890]',
            )}
          >
            {banner.text}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function OutcomeOverlay({
  game,
  runMode,
  onContinue,
  onDefeat,
  onRetry,
  onExit,
}: {
  game: GameState
  runMode: boolean
  onContinue: () => void
  onDefeat: () => void
  onRetry: () => void
  onExit: () => void
}) {
  const open = game.phase === 'victory' || game.phase === 'defeat'
  const victory = game.phase === 'victory'
  const { damageDealt, damageTaken, cardsPlayed } = game.stats

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-[#060504]/85 px-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.35 }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 22 }}
            className="w-full max-w-md rounded-2xl border border-[#3f3a34] bg-[#10100e]/98 p-8 text-center shadow-[0_32px_64px_-20px_rgb(0_0_0/0.85)]"
          >
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.55, type: 'spring', stiffness: 300, damping: 14 }}
              className="text-5xl"
            >
              {victory ? '⚔' : '💀'}
            </motion.div>
            <h2 className="mt-2 font-display text-[2.4rem] font-semibold tracking-tight text-[#f2eae1]">
              {victory ? 'Zafer' : 'Yenilgi'}
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-2 border-y border-[#2a2520] py-3 text-[11px] text-[#7a7268]">
              <Stat label="Verilen" value={damageDealt} tone="text-[#ff9a7a]" />
              <Stat label="Alınan" value={damageTaken} tone="text-[#c4a054]" />
              <Stat label="Kart" value={cardsPlayed} tone="text-[#c4beb4]" />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {victory && runMode && (
                <UIButton tone="primary" size="normal" autoFocus onClick={onContinue}>
                  Ödülleri Topla →
                </UIButton>
              )}
              {!victory && runMode && (
                <UIButton tone="primary" size="normal" autoFocus onClick={onDefeat}>
                  Koşu Sonu →
                </UIButton>
              )}
              {!runMode && (
                <>
                  <UIButton tone="primary" size="normal" autoFocus onClick={onRetry}>
                    {victory ? 'Tekrar Savaş' : 'Tekrar Dene'}
                  </UIButton>
                  <UIButton tone="ghost" size="normal" onClick={onExit}>
                    Menüye Dön
                  </UIButton>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <p className="uppercase tracking-[0.18em]">{label}</p>
      <p className={cn('mt-0.5 font-display text-2xl font-semibold tabular-nums', tone)}>{value}</p>
    </div>
  )
}
