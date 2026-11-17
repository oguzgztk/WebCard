import { motion } from 'framer-motion'
import { useState } from 'react'

import { RelicBadgeRow } from '@/components/relics/RelicCard'
import { DeckViewer } from '@/components/ui/DeckViewer'
import { SettingsButton } from '@/components/ui/SettingsButton'
import { CHARACTER_MAP } from '@/data/characters'
import { MAP_FLOORS } from '@/game/mapGen'
import { currentNode } from '@/game/runEngine'
import type { RunState } from '@/game/runTypes'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  run: RunState
  onExit?: () => void
  className?: string
}>

/** Koşu üst çubuğu — can, altın, deste, kat, yadigârlar. Harita ve düğüm ekranlarında ortak. */
export function RunHud({ run, onExit, className }: Props) {
  const [deckOpen, setDeckOpen] = useState(false)
  const character = CHARACTER_MAP[run.characterId]
  const floor = (currentNode(run)?.floor ?? -1) + 1
  const hpRatio = run.playerHp / Math.max(1, run.playerMaxHp)

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex w-full shrink-0 flex-col gap-1.5 border-b border-[#2a2520] bg-[#0a0908]/92 px-3 py-2 backdrop-blur-md sm:px-5',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            title="Ana menüye dön (koşu kaydedilir)"
            className="shrink-0 rounded-lg border border-[#3f3a34]/80 px-2.5 py-1.5 text-[12px] text-[#a89f92] transition hover:border-[#6a5f4f] hover:text-[#f2eae1]"
          >
            ← Menü
          </button>
        )}
        {character && (
          <img
            src={character.portraitSrc}
            alt={character.name}
            className="hidden h-9 w-9 shrink-0 rounded-full border-2 object-cover object-top sm:block"
            style={{ borderColor: character.accentColor }}
          />
        )}
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
          <HudStat label="Can" title={`${run.playerHp}/${run.playerMaxHp}`}>
            <span className={cn(hpRatio <= 0.3 ? 'text-[#ff7a5a]' : 'text-[#e08a6a]')}>{run.playerHp}</span>
            <span className="text-[12px] text-[#5a4840]">/{run.playerMaxHp}</span>
          </HudStat>
          <HudStat label="Altın">
            <motion.span key={run.gold} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="inline-block text-[#e0b450]">
              {run.gold}
            </motion.span>
          </HudStat>
          <button type="button" onClick={() => setDeckOpen(true)} className="group text-left" title="Desteyi gör">
            <HudStat label="Deste">
              <span className="text-[#c4beb4] underline decoration-[#5a5040] decoration-dotted underline-offset-4 group-hover:text-[#f2eae1]">
                {run.deckDefIds.length}
              </span>
            </HudStat>
          </button>
          <HudStat label="Kat">
            <span className="text-[#a89f92]">{floor}</span>
            <span className="text-[12px] text-[#5a5040]">/{MAP_FLOORS}</span>
          </HudStat>
          {run.difficulty === 'hard' && (
            <span className="hidden rounded border border-[#7a3020] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#ff9a7a] sm:inline">
              Zor
            </span>
          )}
        </div>
        <SettingsButton />
      </div>
      {run.relics.length > 0 && (
        <div className="mx-auto w-full max-w-4xl">
          <RelicBadgeRow relicIds={run.relics} />
        </div>
      )}
      <DeckViewer open={deckOpen} onClose={() => setDeckOpen(false)} title="Destem" defIds={run.deckDefIds} />
    </header>
  )
}

function HudStat({ label, title, children }: { label: string; title?: string; children: React.ReactNode }) {
  return (
    <div title={title} className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#6a6050]">{label}</p>
      <p className="font-display text-[1.15rem] font-semibold tabular-nums leading-tight">{children}</p>
    </div>
  )
}
