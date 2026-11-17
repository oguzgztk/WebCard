import { motion } from 'framer-motion'

import type { RelicDefinition } from '@/game/relics'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  relic: RelicDefinition
  /** Seçilebilir mod (ödül ekranı). */
  selectable?: boolean
  onSelect?: () => void
}>

const TIER_STYLE: Record<RelicDefinition['tier'], string> = {
  common:   'border-[#4a4030]/70 bg-gradient-to-b from-[#181408]/95 to-black/90',
  uncommon: 'border-[#3a4a30]/70 bg-gradient-to-b from-[#101808]/95 to-black/90',
  rare:     'border-[#3a305a]/70 bg-gradient-to-b from-[#10081e]/95 to-black/90',
  boss:     'border-[#5a1a1a]/70 bg-gradient-to-b from-[#1e0808]/95 to-black/90',
}

const TIER_LABEL: Record<RelicDefinition['tier'], string> = {
  common:   'Yaygın',
  uncommon: 'Nadir',
  rare:     'Efsanevi',
  boss:     'Boss',
}

const TIER_LABEL_COLOR: Record<RelicDefinition['tier'], string> = {
  common:   'text-[#c4a054]',
  uncommon: 'text-[#7ab07a]',
  rare:     'text-[#9060d0]',
  boss:     'text-[#c45a3e]',
}

export function RelicCard({ relic, selectable = false, onSelect }: Props) {
  return (
    <motion.button
      disabled={!selectable}
      onClick={selectable ? onSelect : undefined}
      whileHover={selectable ? { scale: 1.03, y: -4, transition: { duration: 0.15 } } : undefined}
      whileTap={selectable ? { scale: 0.97 } : undefined}
      className={cn(
        'flex w-48 flex-col items-center gap-3 rounded-xl border p-5 text-center shadow-[0_8px_28px_-10px_rgb(0_0_0/0.7)]',
        TIER_STYLE[relic.tier],
        selectable
          ? 'cursor-pointer transition-colors hover:border-opacity-90'
          : 'cursor-default',
      )}
    >
      {/* İkon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.07] bg-black/50 text-4xl shadow-inner">
        {relic.icon}
      </div>

      {/* Tier etiketi */}
      <span className={cn('text-[9px] font-semibold uppercase tracking-[0.22em]', TIER_LABEL_COLOR[relic.tier])}>
        {TIER_LABEL[relic.tier]}
      </span>

      {/* İsim */}
      <p className="font-display text-[1.0625rem] font-semibold leading-tight tracking-tight text-[#ede6d8]">
        {relic.name}
      </p>

      {/* Açıklama */}
      <p className="text-[12px] leading-snug text-[#7a7268]">
        {relic.description}
      </p>
    </motion.button>
  )
}

/** Aktif relic'leri küçük rozet olarak göster (savaş header / harita). */
export function RelicBadgeRow({
  relicIds,
  relicMap,
}: Readonly<{
  relicIds: ReadonlyArray<string>
  relicMap: Record<string, RelicDefinition>
}>) {
  if (relicIds.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {relicIds.map((id) => {
        const def = relicMap[id]
        if (!def) return null
        return (
          <span
            key={id}
            title={`${def.name}: ${def.description}`}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full border text-base',
              'border-[#3f3830]/80 bg-black/50',
            )}
          >
            {def.icon}
          </span>
        )
      })}
    </div>
  )
}
