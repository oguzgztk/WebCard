import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { CardInteractive } from '@/components/cards/CardInteractive'
import { UIButton } from '@/components/ui/UIButton'
import { CARD_DEFINITIONS_MAP } from '@/data/cards'
import { isUpgradeable, upgradeCard } from '@/game/cardUpgrades'
import type { RunState } from '@/game/runTypes'

type Props = Readonly<{
  run: RunState
  onHeal: () => void
  onSkip: () => void
  onUpgradeCard: (defId: string) => void
}>

export function RestScreen({ run, onHeal, onSkip, onUpgradeCard }: Props) {
  const [mode, setMode] = useState<'choose' | 'upgrade'>('choose')

  const healAmount = Math.floor(run.playerMaxHp * 0.3)
  const healedHp = Math.min(run.playerMaxHp, run.playerHp + healAmount)
  const alreadyFull = run.playerHp >= run.playerMaxHp

  // Yükseltilebilir (tekil) kartlar listesi — her defId bir kez göster
  const upgradeableDefs = [...new Set(run.deckDefIds)]
    .map((id) => CARD_DEFINITIONS_MAP[id])
    .filter((def): def is NonNullable<typeof def> => !!def && isUpgradeable(def))

  if (mode === 'upgrade') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-start overflow-hidden bg-[#080807] px-4 py-10">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-[-25%] top-[-10%] h-[45vh] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(40_80_60/0.18),_transparent_65%)]"
        />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-3xl flex-col items-center gap-6"
        >
          <div className="text-center">
            <p className="font-display text-[0.8rem] font-semibold uppercase tracking-[0.28em] text-[#7ab07a]">
              Mola
            </p>
            <h1 className="font-display mt-1 text-[1.9rem] font-semibold tracking-tight text-[#ede6d8]">
              Hangi kartı yükseltmek istersin?
            </h1>
            <p className="mt-2 text-[13px] text-[#5a5447]">
              Seçtiğin kart kalıcı olarak güçlenir.
            </p>
          </div>

          {upgradeableDefs.length === 0 ? (
            <p className="text-[14px] text-[#4a4438]">Yükseltilebilir kart yok.</p>
          ) : (
            <div className="flex flex-col gap-5 w-full max-w-2xl">
              {upgradeableDefs.map((def) => {
                const upgraded = upgradeCard(def)
                if (!upgraded) return null
                return (
                  <motion.button
                    key={def.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                    onClick={() => onUpgradeCard(def.id)}
                    className="group relative flex items-center gap-3 rounded-xl border border-[#2e2b24] bg-[#111009] px-4 py-4 text-left transition hover:border-[#7ab07a]/60 hover:bg-[#151d14]"
                  >
                    {/* Mevcut kart */}
                    <div className="flex-1 min-w-0">
                      <CardInteractive
                        definition={def}
                        instanceId={`upgrade-before-${def.id}`}
                        size="compact"
                      />
                    </div>

                    {/* Ok */}
                    <div className="flex flex-col items-center gap-1 px-1 shrink-0">
                      <span className="text-[18px] text-[#7ab07a] group-hover:scale-110 transition-transform">→</span>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#3a6a3a]">Yükselt</span>
                    </div>

                    {/* Yükseltilmiş kart */}
                    <div className="flex-1 min-w-0">
                      <CardInteractive
                        definition={upgraded}
                        instanceId={`upgrade-after-${def.id}`}
                        size="compact"
                      />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          )}

          <UIButton tone="ghost" size="normal" onClick={() => setMode('choose')}>
            ← Geri
          </UIButton>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#080807] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-[-25%] top-[-10%] h-[45vh] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(60_80_30/0.18),_transparent_65%)]"
      />

      <AnimatePresence>
        <motion.div
          key="rest-main"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 28 }}
          className="flex w-full max-w-sm flex-col items-center gap-8"
        >
          {/* İkon */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#3b4a2b]/60 bg-gradient-to-b from-[#101a08]/90 to-black/70 text-5xl shadow-[0_0_32px_-10px_rgb(80_140_40/0.35)]">
              🔥
            </div>
            <div>
              <p className="font-display text-[0.8rem] font-semibold uppercase tracking-[0.28em] text-[#7ab07a]">
                Konaklama
              </p>
              <h1 className="font-display mt-1 text-[2rem] font-semibold tracking-tight text-[#ede6d8]">
                Mola Noktası
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-[#5a5447]">
                Ateş yanıyor. Bir süre nefes al.
              </p>
            </div>
          </div>

          {/* Mevcut can */}
          <div className="w-full rounded-xl border border-[#2e2820]/70 bg-black/35 p-4">
            <div className="flex items-center justify-between text-[12px] text-[#6a6458]">
              <span>Mevcut can</span>
              <span className="font-semibold tabular-nums text-[#c47a5a]">
                {run.playerHp} / {run.playerMaxHp}
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/60 ring-[0.75px] ring-[#613c36]/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#381e1b] via-[#954338] to-[#c4785a] transition-all duration-500"
                style={{ width: `${Math.max(4, (run.playerHp / run.playerMaxHp) * 100)}%` }}
              />
            </div>
            {!alreadyFull && (
              <p className="mt-2 text-[11px] text-[#7ab07a]">
                İyileşirsen: {healedHp} can (+{healAmount})
              </p>
            )}
          </div>

          {/* Seçenekler */}
          <div className="flex w-full flex-col gap-3">
            <UIButton
              tone="primary"
              size="normal"
              className="w-full"
              onClick={onHeal}
              disabled={alreadyFull}
            >
              {alreadyFull ? 'Can zaten dolu' : `İyileş (+${healAmount} can)`}
            </UIButton>

            {upgradeableDefs.length > 0 && (
              <UIButton
                tone="ghost"
                size="normal"
                className="w-full border-[#3b4a2b]/60 text-[#7ab07a] hover:border-[#5a6b4a]/80 hover:text-[#9aca8a]"
                onClick={() => setMode('upgrade')}
              >
                ⚒ Kart yükselt
              </UIButton>
            )}

            <UIButton tone="ghost" size="normal" className="w-full" onClick={onSkip}>
              Devam et — dinlenme
            </UIButton>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
