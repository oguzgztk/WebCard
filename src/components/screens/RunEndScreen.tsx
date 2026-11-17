import { motion } from 'framer-motion'
import { useState } from 'react'

import { RelicBadgeRow } from '@/components/relics/RelicCard'
import { DeckViewer } from '@/components/ui/DeckViewer'
import { UIButton } from '@/components/ui/UIButton'
import { CHARACTER_MAP } from '@/data/characters'
import type { RunState } from '@/game/runTypes'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  run: RunState
  onContinue: () => void
}>

/** Koşu sonu — zafer/yenilgi, istatistikler, son deste ve yadigârlar. */
export function RunEndScreen({ run, onContinue }: Props) {
  const victory = run.phase === 'run_victory'
  const character = CHARACTER_MAP[run.characterId]
  const [deckOpen, setDeckOpen] = useState(false)
  const s = run.stats
  const score =
    s.floorsCleared * 10 + s.enemiesKilled * 3 + s.elitesKilled * 15 + Math.floor(s.goldEarned / 4) + (victory ? 200 : 0)

  const rows: Array<[string, number | string]> = [
    ['Geçilen kat', s.floorsCleared],
    ['Yenilen düşman', s.enemiesKilled],
    ['Yenilen elit', s.elitesKilled],
    ['Verilen hasar', s.damageDealt],
    ['Alınan hasar', s.damageTaken],
    ['Oynanan kart', s.cardsPlayed],
    ['Kazanılan altın', s.goldEarned],
  ]

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#080807] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background: victory
            ? 'radial-gradient(ellipse at 50% 25%, rgb(110 90 20/0.3) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 50% 25%, rgb(100 20 20/0.3) 0%, transparent 60%)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-[#3f3a34] bg-[#10100e]/98 p-8 text-center shadow-[0_32px_64px_-20px_rgb(0_0_0/0.85)]"
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 12 }}
          className="text-6xl"
        >
          {victory ? '🏆' : '💀'}
        </motion.div>
        <h1 className="mt-3 font-display text-[2.5rem] font-semibold tracking-tight text-[#f2eae1]">
          {victory ? 'Zindan Fethedildi' : 'Yolculuk Bitti'}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#8a8070]">
          {victory
            ? `${character?.name ?? 'Gezgin'}, Gölge Efendisi'ni devirdi${run.difficulty === 'hard' ? ' — üstelik zor modda' : ''}.`
            : `${character?.name ?? 'Gezgin'} ${s.floorsCleared}. katta düştü. Bir dahaki sefere…`}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 border-y border-[#2a2520] py-4 text-left text-[13px]">
          {rows.map(([label, value], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className="flex justify-between gap-2"
            >
              <span className="text-[#7a7268]">{label}</span>
              <span className="font-semibold tabular-nums text-[#e4ddd0]">{value}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className={cn('mt-4 font-display text-[1.6rem] font-semibold tabular-nums', victory ? 'text-[#e0b450]' : 'text-[#c4beb4]')}
        >
          Puan: {score}
        </motion.p>

        <p className="mt-1 text-[11px] text-[#6a6050]">
          {run.daily ? 'Günün Koşusu · ' : ''}Tohum: <span className="font-mono">{run.masterSeed}</span>
          {run.difficulty === 'hard' ? ' · Zor' : ''}
        </p>

        {run.relics.length > 0 && (
          <div className="mt-3 flex justify-center">
            <RelicBadgeRow relicIds={run.relics} />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <UIButton tone="primary" size="normal" onClick={onContinue} autoFocus>
            Ana Menüye Dön
          </UIButton>
          <UIButton tone="ghost" size="normal" onClick={() => setDeckOpen(true)}>
            Son Desteyi Gör ({run.deckDefIds.length})
          </UIButton>
        </div>
      </motion.div>
      <DeckViewer open={deckOpen} onClose={() => setDeckOpen(false)} title="Son Deste" defIds={run.deckDefIds} />
    </div>
  )
}
