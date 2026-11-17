import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import { CardInteractive } from '@/components/cards/CardInteractive'
import { RelicCard } from '@/components/relics/RelicCard'
import { RunHud } from '@/components/screens/RunHud'
import { DeckViewer } from '@/components/ui/DeckViewer'
import { Coin } from '@/components/ui/Coin'
import { UIButton } from '@/components/ui/UIButton'
import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { POTION_MAP, POTION_SLOTS } from '@/data/potions'
import { potionTooltip } from '@/game/potionText'
import { RELIC_MAP } from '@/game/relics'
import type { RunState } from '@/game/runTypes'
import { sfx } from '@/lib/audio'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  run: RunState
  onBuyCard: (defId: string) => void
  onBuyRelic: () => void
  onBuyPotion: (potionId: string) => void
  onRemoveCard: (defId: string) => void
  onLeave: () => void
}>

function Price({ price, affordable, onSale }: { price: number; affordable: boolean; onSale?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-[13px] font-semibold tabular-nums',
        affordable ? 'border-[#5a4a2a]/70 bg-black/50 text-[#e0b450]' : 'border-[#3a3028]/50 bg-black/30 text-[#7a5a4a]',
      )}
    >
      <Coin /> {price}
      {onSale && <span className="ml-1 rounded bg-[#8a2a1a] px-1 text-[9px] font-bold uppercase text-[#ffe0d0]">İndirim</span>}
    </span>
  )
}

export function ShopScreen({ run, onBuyCard, onBuyRelic, onBuyPotion, onRemoveCard, onLeave }: Props) {
  const bagFull = run.potions.length >= POTION_SLOTS
  const [removing, setRemoving] = useState(false)
  const relic = run.shopRelic ? RELIC_MAP[run.shopRelic.defId] : null
  const canRemove = !run.shopRemovalUsed && run.gold >= run.shopRemovalPrice

  const buy = (affordable: boolean, action: () => void) => {
    if (!affordable) {
      sfx.denied()
      return
    }
    sfx.coin()
    action()
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#080807]">
      <RunHud run={run} />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-[-20%] top-[-15%] h-[40vh] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(30_60_110/0.22),_transparent_65%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto flex w-full max-w-5xl flex-col gap-7 px-4 py-6"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5090e0]">Tüccar</p>
          <h1 className="mt-1 font-display text-[2rem] font-semibold tracking-tight text-[#ede6d8]">Gezgin Tüccar</h1>
          <p className="mt-1 text-[13px] text-[#7a7060]">“Her şeyin bir bedeli var, yolcu. Bazıları altınla ödenir.”</p>
        </div>

        <section>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a7060]">Kartlar</h2>
          {run.shopCards.length === 0 ? (
            <p className="text-[14px] text-[#4a4438]">Tezgâh boş — hepsi satıldı.</p>
          ) : (
            <div className="flex flex-wrap gap-x-5 gap-y-6">
              <AnimatePresence mode="popLayout">
                {run.shopCards.map((offer) => {
                  const def = CARD_DEFINITIONS_MAP[offer.defId]
                  if (!def) return null
                  const affordable = run.gold >= offer.price
                  return (
                    <motion.div
                      key={offer.defId}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, y: -40, scale: 0.8, transition: { duration: 0.3 } }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className={cn(!affordable && 'opacity-60')}>
                        <CardInteractive definition={def} size="normal" onInteract={() => buy(affordable, () => onBuyCard(offer.defId))} />
                      </div>
                      <Price price={offer.price} affordable={affordable} onSale={offer.onSale} />
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        <section className="flex flex-wrap items-start gap-8 border-t border-[#2e2820]/60 pt-6">
          <div>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a7060]">Yadigâr</h2>
            {relic && run.shopRelic ? (
              <div className="flex flex-col items-center gap-2">
                <RelicCard
                  relic={relic}
                  selectable
                  onSelect={() => buy(run.gold >= run.shopRelic!.price, onBuyRelic)}
                />
                <Price price={run.shopRelic.price} affordable={run.gold >= run.shopRelic.price} />
              </div>
            ) : (
              <p className="text-[13px] text-[#4a4438]">Satıldı.</p>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a7060]">
              İksirler {bagFull && <span className="normal-case tracking-normal text-[#a07060]">(çanta dolu)</span>}
            </h2>
            <div className="flex gap-3">
              {run.shopPotions.length === 0 && <p className="text-[13px] text-[#4a4438]">Satıldı.</p>}
              {run.shopPotions.map((offer) => {
                const p = POTION_MAP[offer.defId]
                if (!p) return null
                const ok = run.gold >= offer.price && !bagFull
                return (
                  <motion.button
                    key={offer.defId}
                    type="button"
                    whileHover={ok ? { y: -3 } : undefined}
                    onClick={() => buy(ok, () => onBuyPotion(offer.defId))}
                    title={potionTooltip(offer.defId)}
                    className={cn(
                      'flex w-28 flex-col items-center gap-1.5 rounded-xl border border-[#4a3a6a]/70 bg-gradient-to-b from-[#1a1428] to-black/90 p-3 text-center transition',
                      !ok && 'opacity-50',
                    )}
                  >
                    <span className="text-3xl">{p.icon}</span>
                    <span className="text-[12px] font-semibold leading-tight text-[#ede6d8]">{p.name}</span>
                    <span className="text-[10px] leading-snug text-[#8a8070]">{potionTooltip(offer.defId).split(': ')[1]}</span>
                    <Price price={offer.price} affordable={run.gold >= offer.price} />
                  </motion.button>
                )
              })}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a7060]">Hizmet</h2>
            <button
              type="button"
              disabled={!canRemove}
              onClick={() => setRemoving(true)}
              className="flex w-48 flex-col items-center gap-2 rounded-xl border border-[#4a3830]/70 bg-gradient-to-b from-[#1e1210] to-black/90 p-5 text-center transition enabled:hover:border-[#c47a5a]/70 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="text-3xl">🗑</span>
              <span className="font-display text-[1.05rem] font-semibold text-[#ede6d8]">Kart Çıkar</span>
              <span className="text-[11px] text-[#7a7268]">
                {run.shopRemovalUsed ? 'Bu ziyarette kullanıldı' : 'Desteden bir kartı kalıcı olarak at'}
              </span>
              {!run.shopRemovalUsed && <Price price={run.shopRemovalPrice} affordable={run.gold >= run.shopRemovalPrice} />}
            </button>
          </div>

          <div className="ml-auto self-end">
            <UIButton tone="primary" size="normal" onClick={onLeave}>
              Yola Devam →
            </UIButton>
          </div>
        </section>
      </motion.div>

      <DeckViewer
        open={removing}
        onClose={() => setRemoving(false)}
        title="Çıkarılacak kartı seç"
        defIds={run.deckDefIds}
        onPick={(defId) => {
          sfx.coin()
          onRemoveCard(defId)
          setRemoving(false)
        }}
      />
    </div>
  )
}
