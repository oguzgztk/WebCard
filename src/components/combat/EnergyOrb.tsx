import { motion } from 'framer-motion'

type Props = Readonly<{
  current: number
  capacity: number
}>

export function EnergyOrb({ capacity, current }: Props) {
  const safeCapacity = Math.max(1, capacity)
  // Enerji maksimumu aşabilir (ör. Kızıl Göz) — sayı kırpılmaz, yalnızca dolum oranı.
  const clamped = Math.max(0, current)
  const ratio = Math.min(1, clamped / safeCapacity)
  const label = `Enerji ${clamped}/${safeCapacity}`

  const empty = clamped === 0

  return (
    <div aria-label={label} className="relative flex items-center gap-2">
      <motion.div
        className="relative h-[52px] w-[52px] shrink-0 rounded-full bg-[#0f0d0a] p-[3px]"
        animate={
          empty
            ? {
                boxShadow: [
                  'inset 0 2px 6px rgb(0 0 0/0.85), 0 0 0 1.5px rgb(88 36 28/0.8), 0 0 12px -2px rgb(180 60 40/0)',
                  'inset 0 2px 6px rgb(0 0 0/0.85), 0 0 0 1.5px rgb(160 55 38/0.9), 0 0 16px -2px rgb(180 60 40/0.4)',
                  'inset 0 2px 6px rgb(0 0 0/0.85), 0 0 0 1.5px rgb(88 36 28/0.8), 0 0 12px -2px rgb(180 60 40/0)',
                ],
                transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
              }
            : {
                boxShadow: 'inset 0 2px 6px rgb(0 0 0/0.85), 0 0 0 1.5px rgb(107 92 63/0.85)',
              }
        }
      >
        <div className="relative h-full w-full overflow-hidden rounded-full bg-[#050403]">
          <motion.div
            className={`absolute inset-x-[10%] bottom-[9%] rounded-full bg-gradient-to-t ${empty ? 'from-[#2a0d0b] via-[#5c2018] to-[#8b3028]' : 'from-[#3d2f16] via-[#8a6f32] to-[#e2c77a]'}`}
            initial={false}
            animate={{ height: `${Math.max(empty ? 6 : 8, ratio * 100)}%` }}
            transition={{ type: 'spring', stiffness: 220, damping: 25 }}
          />
        </div>
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums drop-shadow-[0_1px_2px_rgb(0_0_0/0.9)]"
          animate={
            empty
              ? { color: ['#d4bfb5', '#c45a3e', '#d4bfb5'], transition: { duration: 1.6, repeat: Infinity } }
              : { color: '#fcf6e8' }
          }
        >
          {clamped}
        </motion.div>
      </motion.div>
      <span className="text-[10px] font-medium tabular-nums tracking-wider text-[#6e675c]">/{safeCapacity}</span>
    </div>
  )
}
