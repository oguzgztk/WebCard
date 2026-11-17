import { motion } from 'framer-motion'

import { RelicCard } from '@/components/relics/RelicCard'
import { UIButton } from '@/components/ui/UIButton'
import { RELIC_MAP } from '@/game/relics'

type Props = Readonly<{
  relicIds: ReadonlyArray<string>
  onSelectRelic: (relicId: string | null) => void
}>

export function RelicRewardScreen({ relicIds, onSelectRelic }: Props) {
  const relics = relicIds.map((id) => RELIC_MAP[id]).filter(Boolean)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#080807] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-[-20%] top-[-10%] h-[40vh] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(60_40_90/0.2),_transparent_65%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, type: 'spring', stiffness: 260, damping: 28 }}
        className="flex w-full max-w-3xl flex-col items-center gap-8"
      >
        {/* Başlık */}
        <div className="text-center">
          <p className="font-display text-[0.8rem] font-semibold uppercase tracking-[0.28em] text-[#9060d0]">
            Yadigâr Ödülü
          </p>
          <h1 className="font-display mt-2 text-[2.25rem] font-semibold tracking-tight text-[#ede6d8]">
            Bir Yadigâr Seç
          </h1>
          <p className="mt-2 text-[13px] text-[#5a5447]">
            Seçtiğin yadigâr tüm koşu boyunca etkisini gösterir.
          </p>
        </div>

        {/* Relic kartları */}
        <div className="flex flex-wrap items-start justify-center gap-5">
          {relics.map((relic, i) => (
            <motion.div
              key={relic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.09, type: 'spring', stiffness: 260, damping: 26 }}
            >
              <RelicCard relic={relic} selectable onSelect={() => onSelectRelic(relic.id)} />
            </motion.div>
          ))}

          {relics.length === 0 && (
            <p className="text-[14px] text-[#3a342b]">Tüm yadigârlar zaten sende.</p>
          )}
        </div>

        {/* Atla */}
        <UIButton tone="ghost" size="normal" onClick={() => onSelectRelic(null)}>
          Atla — yadigâr alma
        </UIButton>
      </motion.div>
    </div>
  )
}
