import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = Readonly<{
  label: string
  count: number
  size?: 'default' | 'compact'
}>

/** Deste sırtı küçük koleksiyon — animasyon mikro etkisi */
export function DeckPile({ count, label, size }: Props) {
  return (
    <Stack
      label={label}
      count={count}
      size={size}
      accent="linear-gradient(152deg,#090807 0%,#1f1a15 48%,#49402e 92%,#766444 100%)"
    >
      Deste
    </Stack>
  )
}

export function DiscardPile({ count, label, size }: Props) {
  return (
    <Stack
      label={label}
      count={count}
      size={size}
      accent="linear-gradient(158deg,#090807 0%,#1f1210 52%,#44221b 88%,#713d32 100%)"
    >
      Çöp
    </Stack>
  )
}

type StackProps = Props & Readonly<{ accent: string; children: ReactNode }>

function Stack({ label, accent, children, count, size = 'default' }: StackProps) {
  const layers = [0, 1, 2]
  const compact = size === 'compact'

  const shellH = compact ? 88 : 140
  const shellW = compact ? 72 : 96
  const cardH = compact ? 72 : 108
  const cardW = compact ? 48 : 72
  const shiftX = compact ? 3 : 4
  const shiftY = compact ? 4 : 5
  const badgePy = compact ? 'py-2' : 'py-[18px]'
  const badgePx = compact ? 'px-3' : 'px-6'
  const countText = compact ? 'text-3xl' : 'text-[42px]'

  return (
    <section
      className={`flex flex-col items-center ${compact ? 'gap-1 text-[9px]' : 'gap-[10px] text-[11px]'} font-semibold uppercase tracking-[0.22em] text-[#5e574d]`}
    >
      <p>{label}</p>
      <div className="relative" style={{ width: shellW, height: shellH }} aria-live="polite">
        <div className="absolute inset-0 flex items-end justify-center">
          {layers.map((layer) => (
            <motion.span
              key={layer}
              aria-hidden
              className="absolute rounded-[16px] border border-white/10 shadow-2xl shadow-black/80"
              style={{
                height: cardH,
                width: cardW,
                backgroundImage: accent,
                translateX: layer * shiftX,
                translateY: -layer * shiftY,
                opacity: 0.35 + layer * 0.2,
              }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.35 + layer * 0.2 }}
              transition={{
                duration: 0.45 + layer * 0.05,
                delay: layer * 0.05,
                type: 'spring',
              }}
            />
          ))}
          <motion.div
            layout
            className={`relative z-[5] mb-1 flex flex-col rounded-xl border border-white/10 bg-black/72 text-center backdrop-blur ${badgePx} ${badgePy}`}
            style={{ width: shellW }}
          >
            <span className={compact ? 'text-[10px] text-[#7a7368]' : 'text-[12px] text-[#7a7368]'}>
              {children}
            </span>
            <motion.span layout className={`${countText} font-semibold tabular-nums tracking-tight text-[#dfd2a8]`}>
              {count}
            </motion.span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
