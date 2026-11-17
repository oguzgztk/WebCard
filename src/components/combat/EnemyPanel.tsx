import { AnimatePresence, motion } from 'framer-motion'
import { memo } from 'react'

import { FloatingNumbers } from '@/components/combat/FloatingNumbers'
import { StatusBadges } from '@/components/ui/StatusBadges'
import { useHpDelta } from '@/hooks/useHpDelta'
import { ENEMY_DEFINITIONS_MAP } from '@/data/enemies'
import type { EnemyIntent, EnemyRuntime } from '@/game/types'
import { getEnemyArtSrc } from '@/game/visuals'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  enemy: EnemyRuntime
  /** Saldırı niyetinin vuruş başına gerçek hasarı (Güç/Zayıf/Savunmasız dahil). */
  intentDamage: number | null
  targetable: boolean
  acting: boolean
  onSelect: () => void
  /** Hedef seçiminde klavye kısayolu. */
  hotkey?: number
  /** Kaç düşman var — boyutlandırma için. */
  count: number
}>

function intentView(intent: EnemyIntent, dmg: number | null): { icon: string; text: string; tone: string; title: string } {
  const hits = Math.max(1, intent.hits ?? 1)
  const dmgText = dmg === null ? '' : hits > 1 ? `${dmg}×${hits}` : `${dmg}`
  switch (intent.kind) {
    case 'attack':
      return { icon: '⚔', text: dmgText, tone: 'text-[#ff9a7a] border-[#7a3020]', title: `Saldıracak: ${hits > 1 ? `${hits} kez ${dmg}` : dmg} hasar` }
    case 'attack_defend':
      return { icon: '⚔🛡', text: dmgText, tone: 'text-[#ffb48a] border-[#7a4a20]', title: `Saldıracak (${dmg}) ve ${intent.block} Blok kazanacak` }
    case 'defend':
      return { icon: '🛡', text: `${intent.value ?? 0}`, tone: 'text-[#9ac4e8] border-[#2a4a6a]', title: `${intent.value} Blok kazanacak` }
    case 'buff':
      return { icon: '💪', text: `+${intent.value ?? 0}`, tone: 'text-[#f0c060] border-[#6a5020]', title: `${intent.value} Güç kazanacak` }
    case 'apply_player_weak':
      return { icon: '🥀', text: `${intent.value ?? 0}`, tone: 'text-[#c8a0e8] border-[#4a2a6a]', title: `Sana ${intent.value} Zayıf uygulayacak` }
    case 'apply_player_vulnerable':
      return { icon: '💔', text: `${intent.value ?? 0}`, tone: 'text-[#c8a0e8] border-[#4a2a6a]', title: `Sana ${intent.value} Savunmasız uygulayacak` }
  }
}

function EnemyPanelImpl({ enemy, intentDamage, targetable, acting, onSelect, hotkey, count }: Props) {
  const def = ENEMY_DEFINITIONS_MAP[enemy.defId]
  const art = getEnemyArtSrc(enemy.defId)
  const { floaters, hitKey } = useHpDelta(enemy.hp, enemy.block)
  const ratio = Math.max(0, Math.min(1, enemy.hp / Math.max(1, enemy.maxHp)))
  const intent = intentView(enemy.intent, intentDamage)

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.7, filter: 'grayscale(1) brightness(0.4)', transition: { duration: 0.5 } }}
      onClick={(e) => {
        e.stopPropagation()
        if (targetable) onSelect()
      }}
      role={targetable ? 'button' : undefined}
      tabIndex={targetable ? 0 : -1}
      aria-label={`${def?.name ?? 'Düşman'}, ${enemy.hp}/${enemy.maxHp} can${enemy.block ? `, ${enemy.block} blok` : ''}. Niyet: ${intent.title}`}
      onKeyDown={(e) => {
        if (targetable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'relative flex min-w-0 flex-1 flex-col items-center justify-center',
        count === 1 ? 'max-w-[22rem]' : count === 2 ? 'max-w-[17rem]' : 'max-w-[13rem]',
        targetable && 'cursor-crosshair',
      )}
    >
      {/* Niyet balonu */}
      <motion.div
        key={`${intent.icon}-${intent.text}`}
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        title={intent.title}
        className={cn(
          'z-10 mb-1 flex shrink-0 items-center gap-1 rounded-full border bg-black/70 px-2.5 py-0.5 font-display text-[15px] font-bold tabular-nums shadow-[0_4px_14px_rgb(0_0_0/0.6)]',
          intent.tone,
        )}
      >
        <span aria-hidden className="text-[13px]">{intent.icon}</span>
        {intent.text}
      </motion.div>

      {/* Portre */}
      <motion.div
        animate={acting ? { y: [0, 26, 0], scale: [1, 1.08, 1] } : { y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={cn(
          'relative flex h-[clamp(6.5rem,30dvh,18rem)] w-full items-center justify-center rounded-2xl transition-[box-shadow,outline-color]',
          targetable && 'outline outline-2 outline-offset-2 outline-[#c4a054]/60 hover:outline-[#f0d080] hover:shadow-[0_0_40px_-6px_rgb(240_208_128/0.6)]',
        )}
      >
        <motion.div
          key={hitKey}
          initial={hitKey ? { x: -8, filter: 'brightness(2.2) saturate(0.4)' } : false}
          animate={{ x: 0, filter: 'brightness(1) saturate(1)' }}
          transition={{ duration: 0.35 }}
          className="flex h-full w-full items-center justify-center"
        >
          {art ? (
            <img
              src={art}
              alt=""
              className="pointer-events-none h-full w-full select-none object-contain [mask-image:radial-gradient(ellipse_at_50%_50%,black_55%,transparent_78%)]"
              draggable={false}
            />
          ) : (
            <span className="select-none text-[clamp(3.5rem,10vh,6.5rem)] drop-shadow-[0_10px_20px_rgb(0_0_0/0.9)]">
              {def?.glyph ?? '👾'}
            </span>
          )}
        </motion.div>
        <FloatingNumbers floaters={floaters} />
        {targetable && hotkey !== undefined && (
          <span className="absolute right-1 top-1 rounded border border-[#5a4a2a] bg-black/70 px-1.5 text-[10px] font-semibold text-[#e8c878]">
            {hotkey}
          </span>
        )}
      </motion.div>

      {/* İsim + can */}
      <div className="mt-1 w-full shrink-0 px-1">
        <p className="truncate text-center font-display text-[15px] font-semibold text-[#f0e7da]">{def?.name ?? '???'}</p>
        <div className="relative mt-0.5 flex items-center gap-1.5">
          <AnimatePresence>
            {enemy.block > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="z-10 -mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#4a7aa8] bg-[#14283c] text-[11px] font-bold tabular-nums text-[#cfe4f8] shadow"
                title={`${enemy.block} Blok`}
              >
                {enemy.block}
              </motion.span>
            )}
          </AnimatePresence>
          <div
            className={cn(
              'relative h-4 flex-1 overflow-hidden rounded-full bg-black/80 ring-1',
              enemy.block > 0 ? 'ring-[#4a7aa8]' : 'ring-[#613c36]/80',
            )}
          >
            <motion.div
              className="absolute inset-y-0 left-0 bg-[#f0d0a0]/50"
              initial={false}
              animate={{ width: `${ratio * 100}%` }}
              transition={{ duration: 0.9, delay: 0.25, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#5a1e18] via-[#a8443a] to-[#d8785a]"
              initial={false}
              animate={{ width: `${ratio * 100}%` }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-white drop-shadow-[0_1px_2px_rgb(0_0_0)]">
              {enemy.hp}/{enemy.maxHp}
            </span>
          </div>
        </div>
        <StatusBadges statuses={enemy.statuses} className="mt-1 justify-center" />
      </div>
    </motion.article>
  )
}

export const EnemyPanel = memo(EnemyPanelImpl)
