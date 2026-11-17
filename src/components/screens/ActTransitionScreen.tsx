import { motion } from 'framer-motion'
import { useEffect } from 'react'

import { RunHud } from '@/components/screens/RunHud'
import { UIButton } from '@/components/ui/UIButton'
import { ACTS } from '@/data/encounters'
import { actTransitionHeal } from '@/game/runEngine'
import type { RunState } from '@/game/runTypes'
import { sfx } from '@/lib/audio'

type Props = Readonly<{ run: RunState; onContinue: () => void }>

/** Perde arası — bossun ardından iniş; iyileşme ve sıradaki perdenin tanıtımı. */
export function ActTransitionScreen({ run, onContinue }: Props) {
  const next = ACTS[run.act + 1]
  const heal = actTransitionHeal(run)

  useEffect(() => {
    sfx.victory()
  }, [])

  return (
    <div className="flex min-h-dvh flex-col bg-[#060508]">
      <RunHud run={run} />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_70%,rgb(120_110_150/0.18),transparent_60%)]"
      />
      <div className="relative mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.1em' }}
          animate={{ opacity: 1, letterSpacing: '0.4em' }}
          transition={{ duration: 1.2 }}
          className="font-display text-[0.85rem] font-semibold uppercase text-[#a89fc0]"
        >
          Perde {run.act + 1}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.3, duration: 0.9 }}
          className="font-display text-[3rem] font-semibold leading-tight tracking-tight text-[#f2eae1]"
        >
          {next?.name ?? 'Derinlikler'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="text-[14px] italic leading-relaxed text-[#9a92a8]"
        >
          {next?.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4 }}
          className="rounded-xl border border-[#3a3448] bg-black/40 px-6 py-4 text-[13px] text-[#c4beb4]"
        >
          {ACTS[run.act]?.name} geride kaldı. Merdivenlerden inerken soluklanıyorsun:
          <p className="mt-2 font-display text-[1.4rem] font-semibold text-[#8fe07a]">
            {heal > 0 ? `+${heal} can` : 'Can dolu'}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
          <UIButton
            tone="primary"
            size="normal"
            autoFocus
            onClick={() => {
              sfx.heal()
              onContinue()
            }}
          >
            Derinlere İn →
          </UIButton>
        </motion.div>
      </div>
    </div>
  )
}
