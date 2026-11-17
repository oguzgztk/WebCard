import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { nanoid } from 'nanoid'
import { useEffect, useRef, useState } from 'react'

import type { PlayerRuntime } from '@/game/types'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  player: PlayerRuntime
  layout?: 'default' | 'compact'
}>

/** Oyuncu — tunç çerçeve, soluk adaçayı/siyah karışımı (parlak emerald yok) */
export function PlayerPanel({ player, layout = 'default' }: Props) {
  const ratio = Math.min(1, Math.max(player.hp, 1) / player.maxHp)
  const controls = useAnimationControls()
  const prevHpRef = useRef(player.hp)
  const [floaters, setFloaters] = useState<Array<{ id: string; value: number }>>([])

  useEffect(() => {
    const delta = Math.max(0, prevHpRef.current - player.hp)
    prevHpRef.current = player.hp
    if (delta <= 0) return

    const id = nanoid()
    void controls.start({
      x: [-5, 9, -10, 6, -3, 0],
      rotate: [-1, 1.5, -1.5, 0.8, -0.3, 0],
      transition: { duration: 0.5 },
    })
    setFloaters((c) => [...c, { id, value: delta }])
    const t = window.setTimeout(() => setFloaters((c) => c.filter((f) => f.id !== id)), 950)
    return () => window.clearTimeout(t)
  }, [controls, player.hp])

  if (layout === 'compact') {
    return (
      <motion.section
        animate={controls}
        className="relative flex min-w-0 flex-1 items-stretch gap-3 rounded-xl border border-[#3f4a43]/42 bg-gradient-to-br from-[#0f1613]/93 to-black/72 px-3 py-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] backdrop-blur-sm"
      >
        <AnimatePresence>
          {floaters.map((f) => (
            <motion.span
              key={f.id}
              aria-hidden
              className="pointer-events-none absolute left-1/3 top-0 z-10 -translate-x-1/2 font-display text-2xl font-semibold tabular-nums text-[#e07070] drop-shadow-[0_2px_10px_rgb(0_0_0/0.8)]"
              initial={{ opacity: 0.9, y: 0 }}
              animate={{ opacity: 1, y: -40 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              −{f.value}
            </motion.span>
          ))}
        </AnimatePresence>
        <div className="flex shrink-0 flex-col justify-center border-r border-[#3f4d45]/55 pr-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#879990]">Oyuncu</p>
          <p className="font-display mt-1 text-[1.0625rem] font-semibold tracking-tight text-[#eae3d9]">
            Gezgin
          </p>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
          <div className="flex items-center justify-between text-[11px] text-[#7c756a]">
            <span>Can</span>
            <span aria-live="polite" className="font-medium tabular-nums text-[#ede6dc]">
              {player.hp}/{player.maxHp}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-black/55 ring-[0.75px] ring-[#545d56]/52">
            <motion.div
              className={cn(
                'h-full rounded-full bg-gradient-to-r from-[#514430] via-[#9f864a] to-[#e9d9b2]',
              )}
              initial={false}
              animate={{ scaleX: Math.max(Math.min(ratio, 1), 0.06) }}
              style={{ originX: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 32 }}
            />
          </div>
          <StatusesRow caption="Oyuncu durumu" statuses={player.statuses} compact />
        </div>
        <div className="flex shrink-0 flex-col items-end justify-center border-l border-[#3f4d45]/55 pl-3 text-right">
          <p className="text-[9px] uppercase tracking-[0.15em] text-[#879990]">Blok</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[#dcd2be]">{player.block}</p>
        </div>
      </motion.section>
    )
  }

  return (
    <section className="flex max-w-xl flex-col gap-[18px] rounded-2xl border border-[#3f4a43]/42 bg-gradient-to-br from-[#121a16]/93 to-black/74 px-8 py-[22px] shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] backdrop-blur-sm">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#879990]">Oyuncu</p>
          <p className="font-display mt-2 text-[2.25rem] font-semibold tracking-tight text-[#eae3d9]">Gezgin</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#879990]">Savunma</p>
          <p className="mt-1 text-5xl font-semibold tabular-nums text-[#dcd2be]">{player.block}</p>
        </div>
      </header>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-[#7c756a]">
          <span>Can çubuğu</span>
          <span aria-live="polite" className="font-medium tabular-nums text-[#ede6dc]">
            {player.hp}/{player.maxHp}
          </span>
        </div>
        <div className="h-6 overflow-hidden rounded-full bg-black/58 ring-[0.75px] ring-[#545d56]/55">
          <motion.div
            className={cn('h-full rounded-full bg-gradient-to-r from-[#514430] via-[#a99050] to-[#ede1c8]')}
            initial={false}
            animate={{ scaleX: Math.max(Math.min(ratio, 1), 0.05) }}
            style={{ originX: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 32 }}
          />
        </div>
        <StatusesRow caption="Oyuncu durumu" statuses={player.statuses} />
      </div>
    </section>
  )
}

import type { StatusKey } from '@/game/types'

function StatusesRow({
  statuses,
  caption,
  compact = false,
}: Readonly<{
  statuses: Record<StatusKey, number>
  caption: string
  compact?: boolean
}>) {
  const badgeOrder: StatusKey[] = ['strength', 'vulnerable', 'weak', 'poison']
  const badges = badgeOrder.filter((flag) => (statuses[flag] ?? 0) > 0)

  const flagLabel: Record<StatusKey, string> = {
    vulnerable: 'Savunmasız',
    weak: 'Zayıf',
    strength: 'Güç',
    poison: 'Zehir',
  }

  const flagTooltip: Record<StatusKey, string> = {
    vulnerable: 'Alınan hasar %50 artar',
    weak:       'Verilen hasar %25 azalır',
    strength:   'Verilen her hasara bu değer eklenir',
    poison:     'Tur başında bu kadar hasar alır; sonra 1 azalır',
  }

  const flagColor: Record<StatusKey, string> = {
    vulnerable: 'border-[#734238]/72 bg-black/42 text-[#f0dbd4]',
    weak:       'border-[#4a4238]/72 bg-black/42 text-[#c8bfb4]',
    strength:   'border-[#5a3a10]/70 bg-black/40 text-[#e8a04a]',
    poison:     'border-[#2a4a1a]/70 bg-black/40 text-[#7acc5a]',
  }

  if (!badges.length) {
    return (
      <p className={compact ? 'text-[10px] leading-tight text-[#5b564d]' : 'text-[12px] text-[#5b564d]'}>
        {caption} — nötr
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      <p className="sr-only">{caption}</p>
      {badges.map((badge) => (
        <motion.span
          layout
          key={badge}
          title={flagTooltip[badge]}
          className={cn(
            'cursor-help rounded-md border font-semibold tracking-[0.08em]',
            compact ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-[3px] text-[10px] tracking-[0.12em]',
            flagColor[badge],
          )}
        >
          {flagLabel[badge]} ×{statuses[badge]}
        </motion.span>
      ))}
    </div>
  )
}
