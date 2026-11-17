import { motion } from 'framer-motion'

import { cn } from '@/lib/cn'

type Props = Readonly<{
  label: string
  count: number
  icon: string
  onOpen: () => void
  hotkey?: string
  tone?: 'draw' | 'discard' | 'exhaust'
}>

const TONE = {
  draw: 'border-[#5a4a2a]/80 from-[#2a2010] to-[#0e0b06] text-[#e8c878]',
  discard: 'border-[#4a3a34]/80 from-[#201614] to-[#0c0908] text-[#d8b4a4]',
  exhaust: 'border-[#3a3048]/80 from-[#18121e] to-[#09070b] text-[#b8a4d8]',
} as const

/** Tıklanabilir yığın göstergesi — deste / atılan / tükenen. Sayı değişince zıplar. */
export function PileIndicator({ label, count, icon, onOpen, hotkey, tone = 'draw' }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title={`${label}: ${count} kart${hotkey ? ` (${hotkey})` : ''}`}
      className={cn(
        'group relative flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-lg border bg-gradient-to-b shadow-[0_4px_12px_rgb(0_0_0/0.6)] transition hover:-translate-y-0.5 hover:brightness-125 sm:h-14 sm:w-11',
        TONE[tone],
      )}
    >
      <span aria-hidden className="text-[13px] leading-none opacity-80">{icon}</span>
      <motion.span
        key={count}
        initial={{ scale: 1.5 }}
        animate={{ scale: 1 }}
        className="mt-0.5 font-display text-[16px] font-bold tabular-nums leading-none"
      >
        {count}
      </motion.span>
      <span className="sr-only">{label}</span>
    </button>
  )
}
