import { motion } from 'framer-motion'
import { useEffect } from 'react'

import { CardInteractive } from '@/components/cards/CardInteractive'
import { RunHud } from '@/components/screens/RunHud'
import { Coin } from '@/components/ui/Coin'
import { UIButton } from '@/components/ui/UIButton'
import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { POTION_MAP } from '@/data/potions'
import type { RunState } from '@/game/runTypes'
import { sfx } from '@/lib/audio'

type Props = Readonly<{
  run: RunState
  onSelectCard: (defId: string | null) => void
}>

export function RewardScreen({ run, onSelectCard }: Props) {
  const cards = run.pendingRewardCards.map((id) => CARD_DEFINITIONS_MAP[id]).filter((d) => d !== undefined)
  const gold = run.pendingRewardGold

  useEffect(() => {
    if (gold > 0) sfx.coin()
  }, [gold])

  return (
    <div className="flex min-h-dvh flex-col bg-[#080807]">
      <RunHud run={run} />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-[-20%] top-[-10%] h-[40vh] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(80_68_30/0.22),_transparent_65%)]"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-8"
      >
        <div className="text-center">
          <p className="font-display text-[0.8rem] font-semibold uppercase tracking-[0.28em] text-[#9e8f68]">Galibiyet</p>
          <h1 className="mt-2 font-display text-[2.25rem] font-semibold tracking-tight text-[#ede6d8]">Ganimet</h1>
          {gold > 0 && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 18 }}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#5a4a2a]/60 bg-black/40 px-4 py-2"
            >
              <Coin className="text-[17px]" />
              <span className="font-display text-[18px] font-semibold text-[#e0b450]">+{gold}</span>
              <span className="text-[12px] text-[#7a6e57]">altın</span>
            </motion.div>
          )}
          {run.pendingPotion && POTION_MAP[run.pendingPotion] && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 18 }}
              className="ml-2 mt-3 inline-flex items-center gap-2 rounded-lg border border-[#4a3a6a]/70 bg-black/40 px-4 py-2"
            >
              <span className="text-[17px]">{POTION_MAP[run.pendingPotion].icon}</span>
              <span className="text-[13px] font-semibold text-[#c8b0f0]">{POTION_MAP[run.pendingPotion].name}</span>
            </motion.div>
          )}
          <p className="mt-3 text-[13px] text-[#7a7060]">Destene eklemek için bir kart seç.</p>
        </div>

        <div className="flex flex-wrap items-start justify-center gap-5 sm:gap-7">
          {cards.map((def, i) => (
            <motion.div
              key={def.id}
              initial={{ opacity: 0, y: 40, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.09, type: 'spring', stiffness: 300, damping: 24 }}
            >
              <CardInteractive
                definition={def}
                size="normal"
                onInteract={() => {
                  sfx.cardPlay()
                  onSelectCard(def.id)
                }}
              />
            </motion.div>
          ))}
        </div>

        <UIButton tone="ghost" size="normal" onClick={() => onSelectCard(null)}>
          Atla
        </UIButton>
      </motion.div>
    </div>
  )
}
