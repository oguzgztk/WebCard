import { AnimatePresence, motion } from 'framer-motion'

import type { Floater } from '@/hooks/useHpDelta'
import { cn } from '@/lib/cn'

export function FloatingNumbers({ floaters, className }: { floaters: Floater[]; className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 z-20 flex items-center justify-center', className)}>
      <AnimatePresence>
        {floaters.map((f, i) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 0, y: 0, scale: f.kind === 'damage' ? 1.8 : 1.2 }}
            animate={{ opacity: 1, y: -50 - i * 18, scale: 1 }}
            exit={{ opacity: 0, y: -90 - i * 18 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className={cn(
              'absolute font-display font-bold tabular-nums drop-shadow-[0_2px_10px_rgb(0_0_0/0.95)]',
              f.kind === 'damage' && 'text-[2.6rem] text-[#ff7a5a]',
              f.kind === 'heal' && 'text-[1.8rem] text-[#8fe07a]',
              f.kind === 'block' && 'text-[1.3rem] text-[#9ac4e8]',
            )}
          >
            {f.text}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
