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
  /** Sürükle-bırak: kart oyun alanına bırakıldı (`enemyUid` = altındaki düşman, yoksa null). */
  onDropCard?: (instanceId: string, enemyUid: string | null) => void
  /** Sürüklerken imlecin altındaki düşman (vurgulama için). */
  onDragHover?: (enemyUid: string | null) => void
  textContext?: CardTextContext
}>

/** Kartın bırakılınca oynanması için elin üst kenarından en az bu kadar yukarı çekilmesi gerekir (px). */
const PLAY_THRESHOLD = 70

/** İmlecin altındaki düşman — sürüklenen kart en üstte olduğundan tüm katmanlara bakılır. */
function enemyUnderPointer(x: number, y: number): string | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const uid = el.closest('[data-enemy-uid]')?.getAttribute('data-enemy-uid')
    if (uid) return uid
  }
  return null
}

function pointerXY(e: MouseEvent | TouchEvent | PointerEvent) {
  if ('changedTouches' in e && e.changedTouches.length) return { x: e.changedTouches[0]!.clientX, y: e.changedTouches[0]!.clientY }
  const p = e as MouseEvent
  return { x: p.clientX, y: p.clientY }
}

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
export function Hand({
  cards,
  energy,
  phaseAllowsPlay,
  targetModeCardId,
  onSelectCard,
  onDropCard,
  onDragHover,
  textContext,
}: Props) {
  const [ref, width] = useWidth<HTMLDivElement>()
  // Sürükleme bitince tarayıcı bir de "click" üretir; onu yok saymak için.
  const justDragged = useRef(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const lastHover = useRef<string | null>(null)
  const inPlayZone = (y: number) => {
    const top = ref.current?.getBoundingClientRect().top ?? 0
    return y < top - PLAY_THRESHOLD
  }
  // Dokunmatikte üst üste binen kartlar okunamaz ve yanlışlıkla oynanır: önce "kaldır", sonra oyna.
  const [armedId, setArmedId] = useState<string | null>(null)
  useEffect(() => setArmedId(null), [cards, phaseAllowsPlay])
  const handleTap = (id: string) => {
    if (justDragged.current) {
      justDragged.current = false
      return
    }
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
              className={cn(
                'relative shrink-0 origin-bottom hover:z-30',
                (isSelected || draggingId === instance.instanceId) && 'z-40',
              )}
              style={{ marginLeft: idx === 0 ? 0 : -overlap }}
            >
              {/* İç katman sürüklenir; dış katman yelpaze yerleşimini korur */}
              <motion.div
                drag={phaseAllowsPlay && Boolean(onDropCard)}
                dragSnapToOrigin
                dragMomentum={false}
                dragElastic={1}
                whileDrag={{ scale: 1.08, rotate: -rotation, cursor: 'grabbing' }}
                onDragStart={() => {
                  justDragged.current = true
                  setArmedId(null)
                  setDraggingId(instance.instanceId)
                }}
                onDrag={(e) => {
                  const { x, y } = pointerXY(e)
                  const uid = inPlayZone(y) ? enemyUnderPointer(x, y) : null
                  if (uid !== lastHover.current) {
                    lastHover.current = uid
                    onDragHover?.(uid)
                  }
                }}
                onDragEnd={(e) => {
                  const { x, y } = pointerXY(e)
                  setDraggingId(null)
                  lastHover.current = null
                  onDragHover?.(null)
                  // Tıklama bastırma bayrağını bir sonraki karede sıfırla (click olayı gelmezse takılı kalmasın)
                  window.setTimeout(() => (justDragged.current = false), 50)
                  if (inPlayZone(y)) onDropCard?.(instance.instanceId, enemyUnderPointer(x, y))
                }}
                className="touch-none"
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
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
