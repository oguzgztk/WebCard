import { AnimatePresence, motion } from 'framer-motion'

import { POTION_MAP, POTION_SLOTS } from '@/data/potions'
import { potionTooltip } from '@/game/potionText'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  potions: ReadonlyArray<string>
  /** Tıklanınca; verilmezse yuvalar yalnızca gösterim amaçlıdır. */
  onUse?: (index: number) => void
  disabled?: boolean
  /** Hedef seçimi bekleyen iksir. */
  selectedIndex?: number | null
  className?: string
}>

/** İksir yuvaları — boş yuvalar soluk gösterilir. */
export function PotionBar({ potions, onUse, disabled, selectedIndex, className }: Props) {
  return (
    <div className={cn('flex items-center gap-1', className)} aria-label="İksirler">
      {Array.from({ length: POTION_SLOTS }, (_, i) => {
        const id = potions[i]
        const def = id ? POTION_MAP[id] : undefined
        const interactive = Boolean(def && onUse && !disabled)
        return (
          <div key={i} className="relative h-8 w-8">
            <AnimatePresence>
              {def ? (
                <motion.button
                  key={`${id}-${i}`}
                  type="button"
                  initial={{ scale: 0, rotate: -40 }}
                  animate={{ scale: selectedIndex === i ? 1.15 : 1, rotate: 0 }}
                  exit={{ scale: 1.6, opacity: 0, transition: { duration: 0.3 } }}
                  whileHover={interactive ? { scale: 1.12, y: -2 } : undefined}
                  disabled={!interactive}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (interactive) onUse?.(i)
                  }}
                  title={potionTooltip(id!)}
                  aria-label={potionTooltip(id!)}
                  className={cn(
                    'absolute inset-0 flex items-center justify-center rounded-full border bg-gradient-to-b from-[#1e1a2a] to-[#0a0810] text-[16px] shadow-[0_2px_8px_rgb(0_0_0/0.6)]',
                    selectedIndex === i ? 'border-[#f0d080] shadow-[0_0_14px_rgb(240_208_128/0.6)]' : 'border-[#5a4a7a]/80',
                    interactive ? 'cursor-pointer' : 'cursor-help',
                    disabled && 'opacity-60',
                  )}
                >
                  {def.icon}
                </motion.button>
              ) : (
                <span className="absolute inset-0 rounded-full border border-dashed border-[#3a3448]/70 bg-black/30" />
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
