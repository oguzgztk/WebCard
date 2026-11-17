import { motion } from 'framer-motion'

import { cn } from '@/lib/cn'

type Props = Readonly<{
  disabled?: boolean
  /** Oynanabilir kart kalmadı — butonu vurgula. */
  nudge?: boolean
  busy?: boolean
  onPush: () => void
}>

export function EndTurnButton({ disabled, nudge, busy, onPush }: Props) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onPush}
      title="Turu bitir (E)"
      animate={nudge && !disabled ? { boxShadow: ['0 0 0 0 rgb(224 192 122/0)', '0 0 22px 2px rgb(224 192 122/0.55)', '0 0 0 0 rgb(224 192 122/0)'] } : {}}
      transition={{ duration: 1.6, repeat: Infinity }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className={cn(
        'relative min-w-[7.5rem] rounded-xl border px-4 py-3 font-display text-[15px] font-bold tracking-tight transition-[filter,opacity]',
        disabled
          ? 'cursor-not-allowed border-[#3f3a34] bg-[#1a1814] text-[#6a6258]'
          : 'border-[#8a7030] bg-gradient-to-b from-[#e8cf8a] to-[#9c7f3d] text-[#1a140a] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_6px_18px_-4px_rgb(0_0_0/0.7)] hover:brightness-110',
      )}
    >
      {busy ? 'Düşman Turu…' : 'Turu Bitir'}
      {!disabled && <kbd className="ml-2 hidden rounded border border-black/20 px-1 text-[10px] font-semibold opacity-60 sm:inline">E</kbd>}
    </motion.button>
  )
}
