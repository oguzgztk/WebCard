import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

import { CardInteractive } from '@/components/cards/CardInteractive'
import { RunHud } from '@/components/screens/RunHud'
import { UIButton } from '@/components/ui/UIButton'
import { CARD_DEFINITIONS_MAP, getUpgradedDefinition, isUpgradeable } from '@/data/cards'
import { restHealAmount } from '@/game/runEngine'
import type { RunState } from '@/game/runTypes'
import type { CardDefinition } from '@/game/types'
import { sfx } from '@/lib/audio'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  run: RunState
  onHeal: () => void
  onSkip: () => void
  onUpgradeCard: (defId: string) => void
}>

export function RestScreen({ run, onHeal, onSkip, onUpgradeCard }: Props) {
  const [mode, setMode] = useState<'choose' | 'upgrade'>('choose')
  const [preview, setPreview] = useState<CardDefinition | null>(null)

  const healAmount = restHealAmount(run)
  const missing = run.playerMaxHp - run.playerHp
  const upgradeable = [...new Set(run.deckDefIds)]
    .map((id) => CARD_DEFINITIONS_MAP[id])
    .filter((d): d is CardDefinition => Boolean(d && isUpgradeable(d)))
  const upgraded = preview ? getUpgradedDefinition(preview) : null

  return (
    <div className="flex min-h-dvh flex-col bg-[#080807]">
      <RunHud run={run} />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-[-25%] bottom-[-20%] h-[55vh] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(160_80_20/0.22),_transparent_65%)]"
      />

      <AnimatePresence mode="wait">
        {mode === 'choose' ? (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-8 px-4 py-8"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <motion.div
                animate={{ scale: [1, 1.06, 0.98, 1.04, 1], rotate: [0, -2, 1, -1, 0] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="text-[4.5rem] drop-shadow-[0_0_36px_rgb(240_140_40/0.55)]"
              >
                🔥
              </motion.div>
              <h1 className="font-display text-[2.2rem] font-semibold tracking-tight text-[#ede6d8]">Kamp Ateşi</h1>
              <p className="text-[13px] text-[#7a7060]">Alevler çıtırdıyor. Bir şey yapabilecek kadar vaktin var.</p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <RestOption
                icon="💤"
                title="Dinlen"
                text={missing > 0 ? `${Math.min(healAmount, missing)} can iyileş (${run.playerHp} → ${Math.min(run.playerMaxHp, run.playerHp + healAmount)})` : 'Can zaten dolu'}
                disabled={missing <= 0}
                onClick={() => {
                  sfx.heal()
                  onHeal()
                }}
              />
              <RestOption
                icon="⚒"
                title="Dövüş"
                text={upgradeable.length ? 'Bir kartı kalıcı olarak yükselt' : 'Yükseltilecek kart yok'}
                disabled={upgradeable.length === 0}
                onClick={() => setMode('upgrade')}
              />
            </div>
            <UIButton tone="ghost" size="compact" onClick={onSkip}>
              Hiçbir şey yapmadan devam et
            </UIButton>
          </motion.div>
        ) : (
          <motion.div
            key="upgrade"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-6 px-4 py-6"
          >
            <div className="text-center">
              <h1 className="font-display text-[1.9rem] font-semibold tracking-tight text-[#ede6d8]">Hangi kartı dövelim?</h1>
              <p className="mt-1 text-[13px] text-[#7a7060]">Bir karta dokun, farkı gör ve onayla.</p>
            </div>

            <AnimatePresence>
              {preview && upgraded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col items-center gap-4 overflow-hidden px-3 pt-3"
                >
                  <div className="flex items-center gap-4 sm:gap-8">
                    <CardInteractive definition={preview} size="normal" />
                    <span className="text-3xl text-[#a8e08a]">→</span>
                    <CardInteractive definition={upgraded} size="normal" />
                  </div>
                  <div className="flex gap-3">
                    <UIButton
                      tone="primary"
                      size="normal"
                      onClick={() => {
                        sfx.upgrade()
                        onUpgradeCard(preview.id)
                      }}
                    >
                      ⚒ Yükselt
                    </UIButton>
                    <UIButton tone="ghost" size="normal" onClick={() => setPreview(null)}>
                      Başka kart
                    </UIButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(8.4rem,1fr))] justify-items-center gap-x-3 gap-y-5">
              {upgradeable.map((def) => (
                <div key={def.id} className={cn('rounded-xl transition', preview?.id === def.id && 'ring-2 ring-[#a8e08a]')}>
                  <CardInteractive definition={def} size="small" onInteract={() => setPreview(def)} />
                </div>
              ))}
            </div>
            <UIButton
              tone="ghost"
              size="normal"
              onClick={() => {
                setPreview(null)
                setMode('choose')
              }}
            >
              ← Geri
            </UIButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RestOption({
  icon,
  title,
  text,
  disabled,
  onClick,
}: {
  icon: string
  title: string
  text: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { y: -3 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className="flex flex-col items-center gap-2 rounded-2xl border border-[#4a3a24]/70 bg-gradient-to-b from-[#1e160c]/90 to-black/90 px-5 py-6 text-center transition enabled:hover:border-[#c4a054]/70 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="text-4xl">{icon}</span>
      <span className="font-display text-[1.4rem] font-semibold text-[#f2ebe3]">{title}</span>
      <span className="text-[12px] leading-snug text-[#8a8070]">{text}</span>
    </motion.button>
  )
}
