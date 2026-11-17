import { motion } from 'framer-motion'

type Props = Readonly<{
  current: number
  capacity: number
  /** Savaş ekranı üst çubuğu için daha küçük gösterim */
  size?: 'default' | 'compact'
}>

export function EnergyOrb({ capacity, current, size = 'default' }: Props) {
  const safeCapacity = Math.max(1, capacity)
  const clamped = Math.max(0, Math.min(safeCapacity, current))
  const ratio = clamped / safeCapacity
  const label = `Enerji ${clamped}/${safeCapacity}`
  const compact = size === 'compact'

  const empty = clamped === 0

  if (compact) {
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

  return (
    <div aria-label={label} className="relative flex gap-6">
      <div className="relative h-[94px] w-[94px] rounded-full bg-[#0f0d0a] p-[6px] shadow-[inset_0_3px_12px_rgb(0_0_0/0.82)] ring-[1.75px] ring-[#766343]/80 ring-offset-[2px] ring-offset-[#080807]">
        <div className="relative h-full w-full overflow-hidden rounded-full bg-[#050403]">
          <motion.div
            className="absolute inset-x-[7%] bottom-[7%] rounded-full bg-gradient-to-t from-[#3d2f16] via-[#967b3c] to-[#efd89a]"
            initial={false}
            animate={{ height: `${Math.max(8, ratio * 100)}%` }}
            transition={{ type: 'spring', stiffness: 220, damping: 25 }}
          />
          <div className="pointer-events-none absolute inset-[13%] rounded-full bg-gradient-to-b from-[#ffffff]/18 via-transparent to-transparent mix-blend-screen" />
        </div>
        <div className="absolute inset-[18px] flex items-center justify-center text-3xl font-semibold tabular-nums text-[#faf4e9] drop-shadow-[0_2px_14px_rgb(0_0_0/0.85)]">
          {clamped}
        </div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-[-12%] rounded-full border-[1.5px] border-[#c9a756]/55"
          animate={{ opacity: ratio > 0 ? 1 : 0.5, rotate: ratio * 20 }}
          transition={{ duration: 0.35 }}
        />
      </div>
      <dl className="flex flex-col justify-center text-sm leading-tight">
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#746b5e]">Enerji</div>
        <dt className="sr-only">Mevcut enerji</dt>
        <dd className="text-[1.875rem] font-semibold tabular-nums tracking-tight text-[#eae2d6]">{clamped}</dd>
        <div className="text-xs text-[#5c574e]">En fazla {safeCapacity}</div>
      </dl>
    </div>
  )
}
