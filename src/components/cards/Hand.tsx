import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { CardInteractive } from '@/components/cards/CardInteractive'
import type { CardInstance } from '@/game/types'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  cards: ReadonlyArray<CardInstance>
  energy: number
  phaseAllowsPlay: boolean
  targetModeCardId: string | null
  onSelectCard: (instanceId: string) => void
  layout?: 'default' | 'compact'
}>

/** El destesini zarif yay efektiyle gösteriyoruz */
export function Hand({
  cards,
  energy,
  phaseAllowsPlay,
  targetModeCardId,
  onSelectCard,
  layout = 'default',
}: Props) {
  const quantity = cards.length || 1
  const center = (quantity - 1) / 2
  const compact = layout === 'compact'

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-nowrap items-end justify-center overflow-x-auto overflow-y-visible',
        compact ? 'pt-3 pb-1' : 'pt-14',
      )}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-2 rounded-[28px] bg-gradient-to-b from-[#1a1714]/92 to-transparent blur-2xl',
          compact ? 'top-0 h-28' : 'top-[18px] h-48 inset-x-6',
        )}
      />
      {cards.map((instance, idx) => {
        const blueprint = CARD_DEFINITIONS_MAP[instance.defId]
        if (!blueprint) return null
        const offset = idx - center
        const rotation = Math.max(compact ? -8 : -13, Math.min(compact ? 8 : 13, offset * (compact ? 6 : 9)))
        const lift = Math.abs(offset) * (compact ? 3 : 5)
        const canPay = blueprint.cost <= energy
        const selectable = phaseAllowsPlay && (!targetModeCardId || targetModeCardId === instance.instanceId)
        const isSelected = Boolean(targetModeCardId && instance.instanceId === targetModeCardId)

        const transform = `translateY(${lift}px) rotate(${rotation.toFixed(1)}deg)`

        return (
          <div
            key={instance.instanceId}
            role="presentation"
            className={cn('relative z-[3] shrink-0')}
            style={{
              transform,
              transformOrigin: 'bottom center',
              marginInline: compact ? -8 : -9,
            }}
          >
            <CardInteractive
              emphasize={isSelected}
              instanceId={instance.instanceId}
              definition={blueprint}
              size={compact ? 'compact' : 'default'}
              disabled={Boolean(!phaseAllowsPlay || !canPay || !selectable)}
              onInteract={() => onSelectCard(instance.instanceId)}
            />
          </div>
        )
      })}
    </div>
  )
}
