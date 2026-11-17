import { motion } from 'framer-motion'

import { CardInteractive } from '@/components/cards/CardInteractive'
import { UIButton } from '@/components/ui/UIButton'
import { CARD_DEFINITIONS_MAP } from '@/data/cards'

type Props = Readonly<{
  rewardCardIds: ReadonlyArray<string>
  goldGained: number
  onSelectCard: (defId: string | null) => void
}>

export function RewardScreen({ rewardCardIds, goldGained, onSelectCard }: Props) {
  const cards = rewardCardIds
    .map((id) => CARD_DEFINITIONS_MAP[id])
    .filter(Boolean)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#080807] px-4 py-10">
      {/* Arkaplan */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-[-20%] top-[-10%] h-[40vh] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(80_68_30/0.2),_transparent_65%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 28 }}
        className="flex w-full max-w-3xl flex-col items-center gap-8"
      >
        {/* Başlık + altın */}
        <div className="text-center">
          <p className="font-display text-[0.8rem] font-semibold uppercase tracking-[0.28em] text-[#9e8f68]">
            Galibiyet
          </p>
          <h1 className="font-display mt-2 text-[2.25rem] font-semibold tracking-tight text-[#ede6d8]">
            Kart Ödülü
          </h1>
          {goldGained > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#5a4a2a]/50 bg-black/40 px-4 py-2">
              <span className="text-[15px] text-[#c4a054]">+{goldGained}</span>
              <span className="text-[12px] text-[#7a6e57]">altın kazandın</span>
            </div>
          )}
          <p className="mt-3 text-[13px] text-[#5a5447]">
            Bir kart seç — destene eklenecek.
          </p>
        </div>

        {/* Kart seçenekleri */}
        <div className="flex flex-wrap items-start justify-center gap-4 sm:gap-6">
          {cards.map((def, i) => (
            <motion.div
              key={def.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 260, damping: 26 }}
            >
              <CardInteractive
                definition={def}
                instanceId={`reward-${def.id}`}
                size="default"
                onInteract={() => onSelectCard(def.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Atla */}
        <UIButton tone="ghost" size="normal" onClick={() => onSelectCard(null)}>
          Atla — kart alma
        </UIButton>
      </motion.div>
    </div>
  )
}
