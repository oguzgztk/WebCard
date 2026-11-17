import { useMemo } from 'react'

import { CardInteractive } from '@/components/cards/CardInteractive'
import { Modal } from '@/components/ui/Modal'
import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import type { CardDefinition } from '@/game/types'

type Props = Readonly<{
  open: boolean
  onClose: () => void
  title: string
  defIds: ReadonlyArray<string>
  /** Desteyi türe/maliyete göre sırala (çekme sırasını gizlemek için de). */
  sorted?: boolean
  emptyText?: string
  /** Seçim modu (ör. mağazada kart çıkarma). */
  onPick?: (defId: string) => void
  footer?: React.ReactNode
}>

const TYPE_ORDER = { attack: 0, skill: 1, power: 2 } as const

/** Kart listesi modali — deste, çekme/atma yığınları, kart çıkarma seçimi. */
export function DeckViewer({ open, onClose, title, defIds, sorted = true, emptyText, onPick, footer }: Props) {
  const defs = useMemo(() => {
    const list = defIds.map((id) => CARD_DEFINITIONS_MAP[id]).filter((d): d is CardDefinition => Boolean(d))
    if (!sorted) return list
    return [...list].sort(
      (a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.cost - b.cost || a.name.localeCompare(b.name, 'tr'),
    )
  }, [defIds, sorted])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <>
          {title} <span className="text-[1rem] text-[#7a7060]">({defs.length})</span>
        </>
      }
    >
      {defs.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-[#6a6258]">{emptyText ?? 'Boş.'}</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8.4rem,1fr))] justify-items-center gap-x-3 gap-y-5 pt-2">
          {defs.map((def, i) => (
            <CardInteractive
              key={`${def.id}-${i}`}
              definition={def}
              size="small"
              onInteract={onPick ? () => onPick(def.id) : undefined}
            />
          ))}
        </div>
      )}
      {footer && <div className="mt-6 border-t border-[#2e2820] pt-4">{footer}</div>}
    </Modal>
  )
}
