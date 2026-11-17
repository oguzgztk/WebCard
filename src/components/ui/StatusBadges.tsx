import { AnimatePresence, motion } from 'framer-motion'

import { STATUS_INFO, STATUS_KEYS, statusTooltip } from '@/game/statuses'
import type { Statuses } from '@/game/types'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  statuses: Statuses
  /** Hiç durum yokken gösterilecek metin; boş bırakılırsa hiçbir şey gösterilmez. */
  emptyLabel?: string
  className?: string
}>

/** Durum rozetleri — ikon + yığın; üzerine gelince açıklama. Oyuncu ve düşman ortak. */
export function StatusBadges({ statuses, emptyLabel, className }: Props) {
  const active = STATUS_KEYS.filter((k) => (statuses[k] ?? 0) > 0)

  if (!active.length) {
    return emptyLabel ? <p className="text-[10px] leading-tight text-[#5b564d]">{emptyLabel}</p> : null
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      <AnimatePresence initial={false}>
        {active.map((key) => {
          const info = STATUS_INFO[key]
          const n = statuses[key]
          return (
            <motion.span
              key={key}
              layout
              initial={{ scale: 1.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
              title={`${info.label}: ${statusTooltip(key, n)}`}
              className={cn(
                'inline-flex cursor-help items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                info.positive
                  ? 'border-[#5a4a20]/70 bg-[#1a1408]/80 text-[#e8c070]'
                  : key === 'poison'
                    ? 'border-[#2f5a1f]/70 bg-[#0d1a08]/80 text-[#8fd46a]'
                    : 'border-[#6b3a32]/70 bg-[#1a0c0a]/80 text-[#f0b4a4]',
              )}
            >
              <span aria-hidden className="text-[11px] leading-none">{info.icon}</span>
              <span className="sr-only">{info.label}</span>
              {n}
            </motion.span>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
