import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { CardInteractive } from '@/components/cards/CardInteractive'
import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { sfx } from '@/lib/audio'
import type { CardTextContext } from '@/game/cardText'
import type { CardInstance } from '@/game/types'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  cards: ReadonlyArray<CardInstance>
  energy: number
  phaseAllowsPlay: boolean
  targetModeCardId: string | null
  onSelectCard: (instanceId: string) => void
  textContext?: CardTextContext
}>

/** Kart genişliği (rem → px, 9rem). */
const CARD_W = 144

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry!.contentRect.width))
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/** Dokunmatik cihaz mı? (Fare yoksa ilk dokunuş kartı seçer, ikincisi oynar.) */
const coarsePointer = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

/** El — yelpaze düzeni; kartlar kaba sığacak kadar üst üste biner, hover'da öne çıkar. */
export function Hand({ cards, energy, phaseAllowsPlay, targetModeCardId, onSelectCard, textContext }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>()
  // Dokunmatikte üst üste binen kartlar okunamaz ve yanlışlıkla oynanır: önce "kaldır", sonra oyna.
  const [armedId, setArmedId] = useState<string | null>(null)
  useEffect(() => setArmedId(null), [cards, phaseAllowsPlay])
  const handleTap = (id: string) => {
    if (coarsePointer() && armedId !== id) {
      sfx.hover()
      setArmedId(id)
      return
    }
    setArmedId(null)
    onSelectCard(id)
  }
  const n = cards.length
  const center = (n - 1) / 2
  // Sığması için gereken üst üste binme (px); en az 10px nefes.
  const overlap = n > 1 && width > 0 ? Math.max(-6, Math.min(CARD_W * 0.72, (n * CARD_W - width + 24) / (n - 1))) : -6

  return (
    <div ref={ref} className="relative flex h-full min-h-0 w-full items-end justify-center">
      <AnimatePresence mode="popLayout" initial={false}>
        {cards.map((instance, idx) => {
          const def = CARD_DEFINITIONS_MAP[instance.defId]
          if (!def) return null
          const offset = idx - center
          const rotation = Math.max(-10, Math.min(10, offset * (n > 6 ? 3 : 5)))
          // Yelpaze: ortadaki kartlar yukarıda, kenarlar tabanda (kap dışına taşmaz)
          const lift = (Math.abs(offset) ** 1.6 - Math.abs(center) ** 1.6) * 2.2
          const affordable = def.cost <= energy
          const isSelected = targetModeCardId === instance.instanceId || armedId === instance.instanceId
          const armed = armedId === instance.instanceId
          const dimmed = Boolean(targetModeCardId && !isSelected)

          return (
            <motion.div
              key={instance.instanceId}
              layout
              initial={{ opacity: 0, x: -260, y: 120, rotate: -30, scale: 0.6 }}
              animate={{
                opacity: dimmed ? 0.5 : 1,
                x: 0,
                y: armed ? lift - 40 : lift,
                rotate: armed ? 0 : rotation,
                scale: armed ? 1.22 : 1,
              }}
              exit={{ opacity: 0, y: -160, scale: 0.75, transition: { duration: 0.25 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 28, delay: Math.min(idx, 6) * 0.03 }}
              className={cn('relative shrink-0 origin-bottom hover:z-30', isSelected && 'z-30')}
              style={{ marginLeft: idx === 0 ? 0 : -overlap }}
            >
              <CardInteractive
                definition={def}
                size="hand"
                emphasize={isSelected}
                unaffordable={!affordable}
                disabled={!phaseAllowsPlay}
                textContext={textContext}
                onInteract={() => handleTap(instance.instanceId)}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
