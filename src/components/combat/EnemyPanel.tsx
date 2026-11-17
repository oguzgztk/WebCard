import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { nanoid } from 'nanoid'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ENEMY_DEFINITIONS_MAP } from '@/data/enemies'
import type { EnemyIntent, EnemyRuntime } from '@/game/types'
import { getEnemyArtSrc } from '@/game/visuals'
import { cn } from '@/lib/cn'

export type EnemyPresentationProps = Readonly<{
  enemy: EnemyRuntime
  awaitingTargetPick: boolean
  onDeclareTarget: () => void
  disabled?: boolean
  layout?: 'default' | 'compact'
}>

/** Düşman portresi — niyet balonu ve hasar partikül animasyonları */
export function EnemyPanel({
  awaitingTargetPick,
  disabled,
  enemy,
  layout = 'default',
  onDeclareTarget,
}: EnemyPresentationProps) {
  const definition = ENEMY_DEFINITIONS_MAP[enemy.defId]
  const controllers = useAnimationControls()
  const previousHpReference = useRef(enemy.hp)
  const [floaters, setFloaters] = useState<Array<{ id: string; value: number }>>([])

  useEffect(() => {
    const previousHp = previousHpReference.current
    const delta = Math.max(0, previousHp - enemy.hp)
    previousHpReference.current = enemy.hp

    if (delta <= 0) return

    const identifier = nanoid()

    void controllers.start({
      x: [-6, 10, -12, 8, -4, 0],
      rotate: [-1.25, 1.85, -1.95, 1.05, -0.45, 0],
      transition: {
        duration: 0.55,
      },
    })

    setFloaters((current) => [...current, { id: identifier, value: delta }])

    const timeoutHandle = window.setTimeout(() => {
      setFloaters((marks) => marks.filter((mark) => mark.id !== identifier))
    }, 970)

    return () => window.clearTimeout(timeoutHandle)
  }, [controllers, enemy.hp])

  const narration = useMemo(() => localizeIntentSpeech(enemy.intent), [enemy.intent])
  const portraitSrc = getEnemyArtSrc(enemy.defId)

  const healthRatio =
    enemy.maxHp <= 0 ? 0 : Math.max(0, Math.min(1, Math.max(enemy.hp, 0.0001) / enemy.maxHp))

  const compact = layout === 'compact'

  if (compact) {
    return (
      <motion.article
        aria-disabled={disabled}
        animate={controllers}
        layout
        className={cn(
          'group relative mx-auto flex h-full min-h-0 w-full max-w-2xl overflow-hidden rounded-2xl border border-[#4a3530]/55 bg-gradient-to-b from-[#1a0f0e] via-[#0c0908] to-black shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_18px_40px_-18px_rgb(0_0_0/0.8)] backdrop-blur-sm',
          awaitingTargetPick &&
            'outline outline-[2.5px] outline-[#c4a054]/90 ring-2 ring-black/40 ring-offset-2 ring-offset-[#080807]',
        )}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          if (!awaitingTargetPick || disabled) return
          onDeclareTarget()
        }}
        role={awaitingTargetPick ? 'button' : undefined}
        tabIndex={awaitingTargetPick ? 0 : -1}
        onKeyDown={(event) => {
          if (!awaitingTargetPick || disabled) return
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          onDeclareTarget()
        }}
      >
        {portraitSrc ? (
          <img
            src={portraitSrc}
            alt={definition?.name ? `${definition.name} portresi` : 'Düşman'}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain object-center p-2 sm:p-3"
            draggable={false}
          />
        ) : null}

        {/* Üst overlay: isim + blok */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex items-start justify-between gap-3 bg-gradient-to-b from-black/85 via-black/55 to-transparent px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#ae9189]">Düşman</p>
            <h2 className="truncate font-display text-lg font-semibold tracking-tight text-[#f0e7da] drop-shadow-[0_2px_6px_rgb(0_0_0/0.85)] sm:text-xl">
              {definition?.name ?? '???'}
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-[0.18em] text-[#ae9189]">Blok</p>
            <span className="font-display block text-2xl font-semibold tabular-nums leading-none text-[#dcc89a] drop-shadow-[0_2px_6px_rgb(0_0_0/0.85)] sm:text-[1.65rem]">
              {enemy.block}
            </span>
          </div>
        </div>

        {/* Alt overlay: niyet + can barı + durum */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex flex-col gap-1.5 bg-gradient-to-t from-black/92 via-black/72 to-transparent px-3 pb-2 pt-6 sm:px-4 sm:pb-2.5 sm:pt-8">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-[#c8bdad] font-medium leading-tight drop-shadow-[0_1px_2px_rgb(0_0_0/0.85)]">
              <span className="text-[9px] uppercase tracking-[0.18em] text-[#ae9189]">Niyet · </span>
              {narration}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-[#ebe4d9]">
              {enemy.hp}/{enemy.maxHp}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/70 ring-[0.75px] ring-[#613c36]/80">
            <motion.div
              className={cn('h-full rounded-full bg-gradient-to-r from-[#381e1b] via-[#954338] to-[#c4785a]')}
              initial={false}
              animate={{ scaleX: Math.max(healthRatio, 0.05) }}
              style={{ originX: 0 }}
              transition={{ type: 'spring', stiffness: 250, damping: 32 }}
            />
          </div>
          <StatusesRow statuses={enemy.statuses} caption="Durum" compact />
        </div>

        <AnimatePresence>
          {floaters.map((floaterMark) => (
            <motion.span
              animate={{ opacity: 1, y: -72 }}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/3 z-[3] -translate-x-1/2 font-display text-4xl font-semibold uppercase tabular-nums text-[#c9795a] drop-shadow-[0_2px_14px_rgb(0_0_0/0.85)]"
              exit={{ opacity: 0, y: -100 }}
              initial={{ opacity: 0.85, y: -4 }}
              key={floaterMark.id}
              transition={{ duration: 0.85, ease: 'easeOut' }}
            >
              −{floaterMark.value}
            </motion.span>
          ))}
        </AnimatePresence>
      </motion.article>
    )
  }

  return (
    <motion.article
      aria-disabled={disabled}
      animate={controllers}
      layout
      className={cn(
        'relative flex w-full max-w-md flex-col gap-[18px] rounded-[22px] border border-[#4a3530]/55 bg-gradient-to-b from-[#1a1210]/96 via-[#0e0c0b]/97 to-black/94 p-8 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] backdrop-blur-sm',
        awaitingTargetPick &&
          'outline outline-[3px] outline-[#d4af37]/92 ring-[3px] ring-black/45 ring-offset-2 ring-offset-[#080807]',
      )}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!awaitingTargetPick || disabled) return
        onDeclareTarget()
      }}
      role={awaitingTargetPick ? 'button' : undefined}
      tabIndex={awaitingTargetPick ? 0 : -1}
      onKeyDown={(event) => {
        if (!awaitingTargetPick || disabled) return
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onDeclareTarget()
      }}
    >
      {portraitSrc ? (
        <div className="flex max-h-[min(52dvh,28rem)] min-h-[10rem] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#3f3330]/45 bg-gradient-to-b from-[#151210] to-black px-4 py-3">
          <img
            src={portraitSrc}
            alt={definition?.name ? `${definition.name} portresi` : 'Düşman'}
            className="max-h-[min(48dvh,26rem)] w-full max-w-full object-contain object-center"
            draggable={false}
          />
        </div>
      ) : null}
      <header className="flex justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ae9189]">Düşman</p>
          <h2 className="font-display mt-1 text-[2.25rem] font-semibold tracking-tight text-[#eae3d9] sm:text-[2.5rem]">
            {definition?.name ?? '???'}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#ae9189]">Blok</p>
          <span className="font-display mt-2 block text-6xl font-semibold tabular-nums tracking-tight text-[#d4bfb5]">
            {enemy.block}
          </span>
        </div>
      </header>
      <motion.div
        aria-live="polite"
        className="rounded-xl border border-[#3f3330]/45 bg-black/62 p-[18px] text-sm shadow-[inset_0_2px_12px_rgb(0_0_0/0.55)]"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ae9189]">
          Ön görülen niyet
        </p>
        <p className="mt-2 text-[15px] font-medium leading-snug text-[#d8cfc5]">{narration}</p>
      </motion.div>
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-[#847c71]">
          <span>Can barı</span>
          <span className="font-semibold tabular-nums text-[#ebe4d9]">
            {enemy.hp}/{enemy.maxHp}
          </span>
        </div>
        <div className="h-6 overflow-hidden rounded-full bg-black/56 ring-[0.75px] ring-[#613c36]/75">
          <motion.div
            className={cn(
              'h-full rounded-full bg-gradient-to-r from-[#381e1b] via-[#954338] to-[#c4785a]',
            )}
            initial={false}
            animate={{ scaleX: Math.max(healthRatio, 0.04) }}
            style={{ originX: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 32 }}
          />
        </div>
        <StatusesRow statuses={enemy.statuses} caption="Durum etiketleri" />
      </div>
      <AnimatePresence>
        {floaters.map((floaterMark) => (
          <motion.span
            animate={{ opacity: 1, y: -112 }}
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[-52px] -translate-x-1/2 font-display text-[3rem] font-semibold uppercase tabular-nums text-[#c9795a] drop-shadow-[0_3px_18px_rgb(0_0_0/0.65)] sm:text-[3.25rem]"
            exit={{ opacity: 0, y: -140 }}
            initial={{ opacity: 0.8, y: -8 }}
            key={floaterMark.id}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            −{floaterMark.value}
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.article>
  )
}

function localizeIntentSpeech(intent: EnemyIntent) {
  switch (intent.kind) {
    case 'attack': {
      const v = intent.value ?? 0
      const hits = Math.max(1, intent.hits ?? 1)
      if (hits > 1) {
        return `${hits} ardışık vuruş (her biri ${v} hasar)`
      }
      return `${v} hasarlı saldırı`
    }
    case 'defend':
      return `${intent.value ?? 0} blok kazanıyor`
    case 'buff':
      return `Ritüel kalkanı: +${intent.value ?? 0} blok`
    case 'apply_player_weak':
      return `Zayıflatma — sana ${intent.value ?? 0} tur zayıf`
    case 'apply_player_vulnerable':
      return `Savunma kırığı — sana ${intent.value ?? 0} tur hassasiyet`
  }
}

function StatusesRow({
  caption,
  statuses,
  compact = false,
}: Readonly<{
  statuses: Record<import('@/game/types').StatusKey, number>
  caption: string
  compact?: boolean
}>) {
  const ordering = ['strength', 'vulnerable', 'weak', 'poison'] as const
  const rendered = ordering.filter((flag) => (statuses[flag] ?? 0) > 0)

  const flagLabel: Record<typeof ordering[number], string> = {
    vulnerable: 'Savunmasız',
    weak: 'Zayıf',
    strength: 'Güç',
    poison: 'Zehir',
  }

  const flagTooltip: Record<typeof ordering[number], string> = {
    vulnerable: 'Alınan hasar %50 artar',
    weak:       'Verilen hasar %25 azalır',
    strength:   'Verilen her hasara bu değer eklenir',
    poison:     'Tur başında bu kadar hasar alır; sonra 1 azalır',
  }

  const flagColor: Record<typeof ordering[number], string> = {
    vulnerable: 'border-[#6b3f36]/76 bg-black/44 text-[#f4e8e5]',
    weak:       'border-[#4a4238]/72 bg-black/42 text-[#c8bfb4]',
    strength:   'border-[#5a3a10]/70 bg-black/40 text-[#e8a04a]',
    poison:     'border-[#2a4a1a]/70 bg-black/40 text-[#7acc5a]',
  }

  if (!rendered.length) {
    return (
      <p className={compact ? 'text-[10px] text-[#6b665c]' : 'text-[12px] text-[#6b665c]'}>
        {caption} — pasif
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      <p className="sr-only">{caption}</p>
      {rendered.map((flag) => (
        <motion.span
          key={flag}
          layout
          title={flagTooltip[flag]}
          className={cn(
            'cursor-help rounded-md border font-semibold',
            compact ? 'px-2 py-0.5 text-[9px] tracking-[0.08em]' : 'px-4 py-[3px] text-[11px] tracking-[0.14em]',
            flagColor[flag],
          )}
        >
          {flagLabel[flag]} ×{statuses[flag]}
        </motion.span>
      ))}
    </div>
  )
}
