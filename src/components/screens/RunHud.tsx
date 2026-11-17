import { motion } from 'framer-motion'
import { useState } from 'react'

import { RelicBadgeRow } from '@/components/relics/RelicCard'
import { DeckViewer } from '@/components/ui/DeckViewer'
import { Modal } from '@/components/ui/Modal'
import { PotionBar } from '@/components/ui/PotionBar'
import { potionTooltip } from '@/game/potionText'
import { UIButton } from '@/components/ui/UIButton'
import { POTION_MAP } from '@/data/potions'
import { SettingsButton } from '@/components/ui/SettingsButton'
import { CHARACTER_MAP } from '@/data/characters'
import { ACTS } from '@/data/encounters'
import { ASCENSION_RULES } from '@/game/ascension'
import { MAP_FLOORS } from '@/game/mapGen'
import { currentNode, potionSlots } from '@/game/runEngine'
import type { RunState } from '@/game/runTypes'
import { useRunStore } from '@/game/store/runStore'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  run: RunState
  onExit?: () => void
  className?: string
}>

/** Koşu üst çubuğu — can, altın, deste, kat, yadigârlar. Harita ve düğüm ekranlarında ortak. */
export function RunHud({ run, onExit, className }: Props) {
  const [deckOpen, setDeckOpen] = useState(false)
  const [potionIdx, setPotionIdx] = useState<number | null>(null)
  const discardPotion = useRunStore((st) => st.discardPotion)
  const potionId = potionIdx !== null ? run.potions[potionIdx] : undefined
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
          <HudStat label={`Perde ${run.act} · Kat`} title={ACTS[run.act]?.name}>
            <span className="text-[#a89f92]">{floor}</span>
            <span className="text-[12px] text-[#5a5040]">/{MAP_FLOORS}</span>
          </HudStat>
          {run.ascension > 0 && (
            <span
              title={ASCENSION_RULES.slice(1, run.ascension + 1).map((r, i) => `${i + 1}. ${r}`).join('\n')}
              className="hidden cursor-help rounded border border-[#7a3020] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#ff9a7a] sm:inline"
            >
              Y{run.ascension}
            </span>
          )}
        </div>
        <PotionBar potions={run.potions} slots={potionSlots(run)} onUse={setPotionIdx} className="hidden sm:flex" />
        <SettingsButton />
      </div>
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
        <RelicBadgeRow relicIds={run.relics} />
        <PotionBar potions={run.potions} slots={potionSlots(run)} onUse={setPotionIdx} className="sm:hidden" />
      </div>
      <Modal open={Boolean(potionId)} onClose={() => setPotionIdx(null)} title={potionId ? POTION_MAP[potionId]?.name : ''} className="max-w-sm">
        {potionId && (
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="text-5xl">{POTION_MAP[potionId]?.icon}</span>
            <p className="text-[14px] text-[#c4beb4]">{potionTooltip(potionId).split(': ').slice(1).join(': ')}</p>
            <p className="text-[12px] text-[#7a7060]">İksirler savaş sırasında, enerji harcamadan kullanılır.</p>
            <UIButton
              tone="danger"
              size="compact"
              onClick={() => {
                discardPotion(potionIdx!)
                setPotionIdx(null)
              }}
            >
              İksiri at
            </UIButton>
          </div>
        )}
      </Modal>
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
