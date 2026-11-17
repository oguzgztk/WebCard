import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { CardInteractive } from '@/components/cards/CardInteractive'
import { UIButton } from '@/components/ui/UIButton'
import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { getCardShopPrice } from '@/game/runEngine'
import type { RunState } from '@/game/runTypes'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  run: RunState
  onBuyCard: (defId: string) => void
  onRemoveCard: (defId: string) => void
  onLeave: () => void
}>

type RemoveMode = 'off' | 'picking'

export function ShopScreen({ run, onBuyCard, onRemoveCard, onLeave }: Props) {
  const [removeMode, setRemoveMode] = useState<RemoveMode>('off')

  const shopCards = run.shopInventory
    .map((id) => CARD_DEFINITIONS_MAP[id])
    .filter(Boolean)

  // Kart çıkarma için desteyiz — yükseltilmişler dahil
  const removableCards = [...new Set(run.deckDefIds)]
    .map((id) => CARD_DEFINITIONS_MAP[id])
    .filter(Boolean)

  const canAffordRemoval = run.gold >= run.shopRemovalPrice

  return (
    <div className="flex min-h-dvh flex-col items-center overflow-hidden bg-[#080807] px-4 py-8">
      {/* Arkaplan parıltısı */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-[-20%] top-[-15%] h-[40vh] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(20_50_90/0.2),_transparent_65%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, type: 'spring', stiffness: 260, damping: 28 }}
        className="flex w-full max-w-3xl flex-col gap-8"
      >
        {/* Başlık */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#5090e0]">
              Düğüm
            </p>
            <h1 className="font-display mt-1 text-[2rem] font-semibold tracking-tight text-[#ede6d8]">
              Tüccar
            </h1>
            <p className="mt-1 text-[13px] text-[#5a5447]">
              Yolun ortasında küçük bir tezgâh. Satıcı gözünü kırpmadan bakar.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-[0.18em] text-[#7a6e57]">Altın</p>
            <p className="font-display text-2xl font-semibold tabular-nums text-[#c4a054]">
              {run.gold}
            </p>
          </div>
        </div>

        {/* Satıştaki kartlar */}
        <AnimatePresence mode="popLayout">
          {removeMode === 'off' && (
            <motion.section
              key="shop-cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5a5447]">
                Satılık Kartlar
              </p>
              {shopCards.length === 0 ? (
                <p className="text-[14px] text-[#3a342b]">Tezgâh boş — bugünlük hepsi satıldı.</p>
              ) : (
                <div className="flex flex-wrap gap-4 sm:gap-5">
                  {shopCards.map((def, i) => {
                    const price = getCardShopPrice(def.id)
                    const canAfford = run.gold >= price
                    return (
                      <motion.div
                        key={def.id}
                        layout
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 26 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <CardInteractive
                          definition={def}
                          instanceId={`shop-${def.id}`}
                          size="default"
                          disabled={!canAfford}
                          onInteract={() => canAfford && onBuyCard(def.id)}
                        />
                        <div
                          className={cn(
                            'rounded-md border px-3 py-1 font-semibold tabular-nums text-[13px] transition-colors',
                            canAfford
                              ? 'border-[#5a4a2a]/70 bg-black/40 text-[#c4a054]'
                              : 'border-[#3a3028]/50 bg-black/30 text-[#4a4438] line-through',
                          )}
                        >
                          {price} altın
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.section>
          )}

          {/* Kart çıkarma modu */}
          {removeMode === 'picking' && (
            <motion.section
              key="remove-cards"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5a5447]">
                  Hangi kartı çıkarmak istersin?
                </p>
                <button
                  onClick={() => setRemoveMode('off')}
                  className="ml-auto text-[11px] text-[#4a4438] underline underline-offset-2 hover:text-[#7a6e57]"
                >
                  ← Geri
                </button>
              </div>
              <div className="flex flex-wrap gap-4 sm:gap-5">
                {removableCards.map((def, i) => (
                  <motion.div
                    key={`remove-${def.id}-${i}`}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 26 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <CardInteractive
                      definition={def}
                      instanceId={`remove-${def.id}-${i}`}
                      size="default"
                      onInteract={() => {
                        onRemoveCard(def.id)
                        setRemoveMode('off')
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Alt işlemler */}
        <div className="flex flex-wrap items-center gap-3 border-t border-[#2e2820]/60 pt-5">
          {removeMode === 'off' && (
            <UIButton
              tone="ghost"
              size="normal"
              disabled={!canAffordRemoval || removableCards.length === 0}
              onClick={() => setRemoveMode('picking')}
              className="border-[#4a3830]/60 text-[#c47a5a] hover:border-[#5a4040]/80 disabled:opacity-38"
            >
              🗑 Kart çıkar ({run.shopRemovalPrice} altın)
            </UIButton>
          )}
          <UIButton
            tone="ghost"
            size="normal"
            className="ml-auto"
            onClick={onLeave}
          >
            Çık →
          </UIButton>
        </div>
      </motion.div>
    </div>
  )
}
