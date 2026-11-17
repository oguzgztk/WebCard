import { useMemo, useState } from 'react'

import { CardInteractive } from '@/components/cards/CardInteractive'
import { Modal } from '@/components/ui/Modal'
import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { DEMIRCI_CARDS } from '@/data/cards/demirci'
import { GOLGE_CARDS } from '@/data/cards/golge'
import type { CardRarity } from '@/game/types'
import { cn } from '@/lib/cn'

const RARITY_ORDER: Record<CardRarity, number> = { rare: 0, uncommon: 1, common: 2, starter: 3 }
const RARITY_TITLE: Record<CardRarity, string> = { rare: 'Efsanevi', uncommon: 'Nadir', common: 'Yaygın', starter: 'Başlangıç' }

const TABS = [
  { id: 'demirci', label: 'Demirci', cards: DEMIRCI_CARDS },
  { id: 'golge', label: 'Gölge', cards: GOLGE_CARDS },
] as const

/** Tüm kartlar — nadirliğe göre gruplu; çerçeve tasarımlarını ve yükseltmeleri sergiler. */
export function CollectionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('demirci')
  const [upgraded, setUpgraded] = useState(false)

  const groups = useMemo(() => {
    const list = TABS.find((t) => t.id === tab)!.cards
      .map((bp) => CARD_DEFINITIONS_MAP[upgraded ? `${bp.id}+` : bp.id]!)
      .sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.cost - b.cost)
    const byRarity = new Map<CardRarity, typeof list>()
    for (const c of list) byRarity.set(c.rarity, [...(byRarity.get(c.rarity) ?? []), c])
    return [...byRarity]
  }, [tab, upgraded])

  return (
    <Modal open={open} onClose={onClose} title="Kart Koleksiyonu" className="max-w-5xl">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-[#3a342b] bg-black/40 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-md px-4 py-1.5 text-[13px] font-semibold transition',
                tab === t.id ? 'bg-[#3a2e18] text-[#f0d890]' : 'text-[#7a7060] hover:text-[#c4beb4]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#a89f92]">
          <input type="checkbox" checked={upgraded} onChange={(e) => setUpgraded(e.target.checked)} className="accent-[#8fe07a]" />
          Yükseltilmiş hallerini göster
        </label>
        <span className="ml-auto text-[11px] text-[#6a6050]">Kartların üzerinde gezin — eğilir ve parlar.</span>
      </div>

      <div className="flex flex-col gap-7">
        {groups.map(([rarity, cards]) => (
          <section key={rarity}>
            <h3
              className={cn(
                'mb-3 font-display text-[1.1rem] font-semibold',
                rarity === 'rare' && 'text-[#f0c860]',
                rarity === 'uncommon' && 'text-[#9ac4e8]',
                rarity === 'common' && 'text-[#d8a070]',
                rarity === 'starter' && 'text-[#a89f92]',
              )}
            >
              {RARITY_TITLE[rarity]} <span className="text-[12px] text-[#6a6050]">({cards.length})</span>
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(12.2rem,1fr))] justify-items-center gap-x-4 gap-y-6">
              {cards.map((def) => (
                <CardInteractive key={def.id} definition={def} size="normal" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  )
}
