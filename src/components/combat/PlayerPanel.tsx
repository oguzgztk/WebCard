import { AnimatePresence, motion } from 'framer-motion'
import { memo } from 'react'

import { FloatingNumbers } from '@/components/combat/FloatingNumbers'
import { StatusBadges } from '@/components/ui/StatusBadges'
import { useHpDelta } from '@/hooks/useHpDelta'
import { CHARACTER_MAP } from '@/data/characters'
import type { PlayerRuntime } from '@/game/types'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  player: PlayerRuntime
  characterId?: string
  /** Bu tur düşmanlardan gelecek toplam saldırı hasarı (blok düşülmeden). */
  incoming: number
  showIncoming: boolean
}>

function PlayerPanelImpl({ player, characterId, incoming, showIncoming }: Props) {
  const character = characterId ? CHARACTER_MAP[characterId] : undefined
  const { floaters, hitKey } = useHpDelta(player.hp, player.block)
  const ratio = Math.max(0, Math.min(1, player.hp / Math.max(1, player.maxHp)))
  const unblocked = Math.max(0, incoming - player.block)
  const lowHp = ratio <= 0.3

  return (
    <section
      aria-label={`Oyuncu: ${player.hp}/${player.maxHp} can, ${player.block} blok`}
      className="relative flex min-w-0 items-center gap-3 rounded-xl border border-[#3f4a43]/40 bg-gradient-to-br from-[#0f1613]/90 to-black/70 px-2.5 py-2"
    >
      <FloatingNumbers floaters={floaters} className="justify-start pl-10" />

      {/* Portre */}
      <motion.div
        key={hitKey}
        initial={hitKey ? { x: -6, filter: 'brightness(2) sepia(1) hue-rotate(-40deg)' } : false}
        animate={{ x: 0, filter: 'brightness(1) sepia(0) hue-rotate(0deg)' }}
        transition={{ duration: 0.4 }}
        className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 bg-black"
        style={{ borderColor: character?.accentColor ?? '#6a5f4f' }}
      >
        {character ? (
          <img src={character.portraitSrc} alt="" className="h-full w-full object-cover object-top" draggable={false} />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xl">⚔</span>
        )}
      </motion.div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-display text-[15px] font-semibold text-[#eae3d9]">{character?.name ?? 'Gezgin'}</p>
          <AnimatePresence>
            {showIncoming && incoming > 0 && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                title={`Düşmanlar bu tur toplam ${incoming} hasar vuracak; bloğun ${player.block}.`}
                className={cn(
                  'shrink-0 rounded-md border px-1.5 py-px text-[10px] font-semibold tabular-nums',
                  unblocked > 0 ? 'border-[#7a3020] bg-[#2a0c08] text-[#ff9a7a]' : 'border-[#2a4a6a] bg-[#0c1a28] text-[#9ac4e8]',
                )}
              >
                {unblocked > 0 ? `⚠ −${unblocked}` : '🛡 Güvende'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <AnimatePresence>
            {player.block > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="z-10 -mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#4a7aa8] bg-[#14283c] text-[11px] font-bold tabular-nums text-[#cfe4f8] shadow"
                title={`${player.block} Blok`}
              >
                {player.block}
              </motion.span>
            )}
          </AnimatePresence>
          <div
            className={cn(
              'relative h-4 flex-1 overflow-hidden rounded-full bg-black/80 ring-1',
              player.block > 0 ? 'ring-[#4a7aa8]' : 'ring-[#545d56]/60',
              lowHp && 'animate-pulse',
            )}
          >
            <motion.div
              className="absolute inset-y-0 left-0 bg-[#f0d0a0]/45"
              initial={false}
              animate={{ width: `${ratio * 100}%` }}
              transition={{ duration: 0.9, delay: 0.25, ease: 'easeOut' }}
            />
            <motion.div
              className={cn(
                'absolute inset-y-0 left-0 bg-gradient-to-r',
                lowHp ? 'from-[#5a1e18] via-[#a8443a] to-[#d8785a]' : 'from-[#514430] via-[#9f864a] to-[#e9d9b2]',
              )}
              initial={false}
              animate={{ width: `${ratio * 100}%` }}
              transition={{ type: 'spring', stiffness: 220, damping: 30 }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-white drop-shadow-[0_1px_2px_rgb(0_0_0)]">
              {player.hp}/{player.maxHp}
            </span>
          </div>
        </div>
        <StatusBadges statuses={player.statuses} className="mt-1" />
      </div>
    </section>
  )
}

export const PlayerPanel = memo(PlayerPanelImpl)
