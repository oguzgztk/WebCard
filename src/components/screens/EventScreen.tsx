import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { RunHud } from '@/components/screens/RunHud'
import { UIButton } from '@/components/ui/UIButton'
import { EVENT_MAP } from '@/data/events'
import type { EventEffect, EventOutcome } from '@/data/events'
import { eventOutcomeGoldCost } from '@/game/runEngine'
import { sfx } from '@/lib/audio'
import type { RunState } from '@/game/runTypes'

interface EventScreenProps {
  run: RunState
  onChoose: (outcome: EventOutcome) => void
}

export function EventScreen({ run, onChoose }: EventScreenProps) {
  const [result, setResult] = useState<string | null>(null)
  const [pendingOutcome, setPendingOutcome] = useState<EventOutcome | null>(null)

  const event = run.activeEventId ? EVENT_MAP[run.activeEventId] : null
  if (!event) return null

  function handleChoice(outcome: EventOutcome) {
    const kinds = outcome.effects.map((e) => e.kind)
    if (kinds.includes('gainRelic')) sfx.relic()
    else if (kinds.includes('upgradeRandom')) sfx.upgrade()
    else if (kinds.includes('loseHp')) sfx.playerHurt(8)
    else if (kinds.includes('gainGold')) sfx.coin()
    else if (kinds.includes('gainHp') || kinds.includes('gainMaxHp')) sfx.heal()
    else sfx.click()
    setResult(outcome.resultText)
    setPendingOutcome(outcome)
  }

  function handleContinue() {
    if (pendingOutcome) onChoose(pendingOutcome)
  }

  const effectIcon: Record<EventEffect['kind'], string> = {
    gainGold: '💰',
    loseGold: '💸',
    gainHp: '💚',
    loseHp: '🩸',
    gainCard: '🃏',
    gainRandomCard: '🃏',
    gainMaxHp: '❤',
    gainRelic: '🏺',
    upgradeRandom: '⚒',
    removeStarter: '🗑',
  }
  const outcomeIcons = (outcome: EventOutcome) =>
    outcome.effects.length === 0 ? '—' : outcome.effects.map((e) => effectIcon[e.kind]).join('')

  return (
    <div className="flex min-h-dvh flex-col items-center justify-start overflow-hidden bg-[#080807]">
      <RunHud run={run} />
      <div className="flex w-full flex-1 flex-col items-center px-4 py-10">
      {/* Ambiyans ışığı */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-[-30%] top-[-8%] h-[40vh] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(80_50_20/0.15),_transparent_65%)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex w-full max-w-xl flex-col items-center gap-8"
      >
        {/* Başlık */}
        <div className="text-center">
          <p className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-[#b07a3a]">
            Olay
          </p>
          <h1 className="font-display mt-1 text-[2rem] font-semibold tracking-tight text-[#ede6d8]">
            {event.title}
          </h1>
        </div>

        {/* Lore metni */}
        <div className="w-full rounded-xl border border-[#2e2a22] bg-[#0f0d0b] p-6">
          <p className="text-[14px] leading-relaxed text-[#bfb4a6] italic">
            &ldquo;{event.lore}&rdquo;
          </p>
        </div>

        <AnimatePresence mode="wait">
          {result === null ? (
            /* Seçenekler */
            <motion.div
              key="choices"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-col gap-3"
            >
              {event.choices.map((choice, idx) => {
                const goldCost = eventOutcomeGoldCost(choice.outcome)
                const affordable = run.gold >= goldCost
                return (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: affordable ? 1 : 0.45, x: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  disabled={!affordable}
                  onClick={() => handleChoice(choice.outcome)}
                  className="group flex w-full flex-col gap-1 rounded-xl border border-[#2e2a22] bg-[#0f0d0b] px-5 py-4 text-left transition enabled:hover:border-[#a07040]/60 enabled:hover:bg-[#1a1510] disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px]">{outcomeIcons(choice.outcome)}</span>
                    <span className="font-display text-[15px] font-semibold text-[#ede6d8] group-hover:text-[#e0c87a]">
                      {choice.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#7a7060] group-hover:text-[#9a9078]">
                    {choice.description}
                    {!affordable && ` (Yetersiz altın: ${run.gold}/${goldCost})`}
                  </p>
                </motion.button>
                )
              })}
            </motion.div>
          ) : (
            /* Sonuç */
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex w-full flex-col items-center gap-6"
            >
              <div className="w-full rounded-xl border border-[#3a3020] bg-[#131008] p-6 text-center">
                <p className="text-[15px] leading-relaxed text-[#d4c8a8]">{result}</p>
              </div>
              <UIButton tone="primary" size="normal" onClick={handleContinue}>
                Devam et →
              </UIButton>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </div>
    </div>
  )
}
