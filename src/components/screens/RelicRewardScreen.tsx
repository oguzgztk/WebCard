import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import { RelicCard } from '@/components/relics/RelicCard'
import { RunHud } from '@/components/screens/RunHud'
import { UIButton } from '@/components/ui/UIButton'
import { RELIC_MAP } from '@/game/relics'
import type { RunState } from '@/game/runTypes'
import { sfx } from '@/lib/audio'

type Props = Readonly<{
  run: RunState
  /** Hazine düğümü: önce sandık açılır. */
  treasure?: boolean
  onSelectRelic: (relicId: string | null) => void
}>

export function RelicRewardScreen({ run, treasure, onSelectRelic }: Props) {
  const relics = run.pendingRelicReward.map((id) => RELIC_MAP[id]).filter((r) => r !== undefined)
  const [opened, setOpened] = useState(!treasure)

  return (
    <div className="flex min-h-dvh flex-col bg-[#080807]">
      <RunHud run={run} />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-[-20%] top-[-10%] h-[45vh] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(90_60_130/0.22),_transparent_65%)]"
      />

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-8">
        <div className="text-center">
          <p className="font-display text-[0.8rem] font-semibold uppercase tracking-[0.28em] text-[#a080e0]">
            {treasure ? 'Hazine' : 'Yadigâr Ödülü'}
          </p>
          <h1 className="mt-2 font-display text-[2.25rem] font-semibold tracking-tight text-[#ede6d8]">
            {treasure ? (opened ? 'Sandığın İçinden' : 'Eski Bir Sandık') : 'Bir Yadigâr Seç'}
          </h1>
          <p className="mt-2 text-[13px] text-[#7a7060]">
            {treasure
              ? opened
                ? `Yadigâr ve ${run.pendingRewardGold} altın seni bekliyor.`
                : 'Kilidi paslanmış ama hâlâ sağlam. Açmak için dokun.'
              : 'Seçtiğin yadigâr tüm koşu boyunca etkisini gösterir.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!opened ? (
            <motion.button
              key="chest"
              type="button"
              onClick={() => {
                sfx.relic()
                setOpened(true)
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: [0, -2, 2, -2, 0] }}
              exit={{ scale: 1.4, opacity: 0, transition: { duration: 0.3 } }}
              transition={{ rotate: { duration: 0.6, repeat: Infinity, repeatDelay: 1.4 } }}
              whileHover={{ scale: 1.08 }}
              className="text-[7rem] drop-shadow-[0_0_40px_rgb(232_200_96/0.45)]"
              aria-label="Sandığı aç"
            >
              🎁
            </motion.button>
          ) : (
            <motion.div key="relics" className="flex flex-wrap items-start justify-center gap-5">
              {relics.map((relic, i) => (
                <motion.div
                  key={relic.id}
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <RelicCard
                    relic={relic}
                    selectable
                    onSelect={() => {
                      sfx.relic()
                      onSelectRelic(relic.id)
                    }}
                  />
                </motion.div>
              ))}
              {relics.length === 0 && <p className="text-[14px] text-[#6a6258]">Tüm yadigârlar zaten sende.</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {opened && (
          <UIButton tone="ghost" size="normal" onClick={() => onSelectRelic(null)}>
            {treasure ? (relics.length ? 'Yalnızca altını al' : 'Altını al') : 'Atla'}
          </UIButton>
        )}
      </div>
    </div>
  )
}
