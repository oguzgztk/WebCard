import { motion } from 'framer-motion'

import type { CardDefinition } from '@/game/types'
import { getCardArtSrc } from '@/game/visuals'
import { cn } from '@/lib/cn'

export type CardInteractiveProps = {
  definition: CardDefinition
  instanceId: string
  disabled?: boolean
  emphasize?: boolean
  /** Savaş ekranı el destesi — sabit oranlı kart */
  size?: 'default' | 'compact'
  /** Belirtilmezse kart tıklanamaz (saf görüntü modu). */
  onInteract?: () => void
}

const hoverLift = { default: 10, compact: 8 } as const

const typeTone: Record<CardDefinition['type'], string> = {
  attack:
    'from-[#261412] via-[#130e0e] to-[#080706] border-[#704237]/55 shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_8px_24px_-6px_rgb(0_0_0/0.65)]',
  skill:
    'from-[#121a17] via-[#0e1210] to-[#070808] border-[#3d5348]/52 shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_8px_24px_-6px_rgb(0_0_0/0.6)]',
  power:
    'from-[#1f190e] via-[#141007] to-[#080706] border-[#6f5f32]/55 shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_8px_24px_-6px_rgb(0_0_0/0.62)]',
}

/** El: ISO oyun kartına yakın oran 63:88 (≈5:7) — sabit kutular, kırpma yok */
const shellCompact = cn(
  'flex h-[13.9rem] w-[9.875rem] flex-col overflow-hidden rounded-lg border bg-gradient-to-b p-2',
)
const shellDefault = cn(
  'flex h-[17.35rem] w-[12.375rem] flex-col overflow-hidden rounded-xl border bg-gradient-to-b p-3',
)

export function CardInteractive({
  definition,
  instanceId,
  disabled,
  emphasize,
  size = 'default',
  onInteract,
}: CardInteractiveProps) {
  const tone = typeTone[definition.type]
  const compact = size === 'compact'
  // Yükseltilmiş kart görseli için base ID kullan (strike+ → strike)
  const baseId = definition.isUpgraded ? definition.id.replace(/\+$/, '') : definition.id
  const artSrc = getCardArtSrc(baseId)

  const glowColor = {
    attack: 'rgb(140 60 46/0.55)',
    skill: 'rgb(58 92 76/0.5)',
    power: 'rgb(138 116 52/0.55)',
  }[definition.type]

  return (
    <motion.article
      layoutId={`card-${instanceId}`}
      layout
      aria-disabled={disabled}
      whileHover={
        disabled
          ? undefined
          : {
              y: -hoverLift[compact ? 'compact' : 'default'],
              rotate: -0.5,
              boxShadow: `0 0 0 1px ${glowColor}, 0 16px 36px -10px rgb(0 0 0/0.7), 0 0 28px -4px ${glowColor}`,
            }
      }
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{
        layout: { duration: 0.45, type: 'spring', stiffness: 320, damping: 34 },
      }}
      onClick={(evt) => {
        evt.preventDefault()
        evt.stopPropagation()
        if (!disabled && onInteract) onInteract()
      }}
      role={onInteract ? 'button' : undefined}
      tabIndex={disabled || !onInteract ? -1 : 0}
      onKeyDown={(evt) => {
        if (disabled || !onInteract) return
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault()
          onInteract()
        }
      }}
      className={cn(
        'relative isolate min-h-0 text-left shadow-black/55 ring-offset-2 ring-offset-[#080807]',
        compact ? shellCompact : shellDefault,
        tone,
        disabled && 'pointer-events-none opacity-42 saturate-[0.92]',
        emphasize &&
          'z-10 shadow-[0_0_0_2px_rgb(196_160_84/0.85),0_12px_32px_-6px_rgb(0_0_0/0.75)] ring-2 ring-[#d4af37]/95',
      )}
      title={compact ? `${definition.name} — ${definition.description}` : undefined}
    >
      {/* Illüstrasyon: kırpmadan sığdır, koyu nötr kenar */}
      <div
        className={cn(
          'relative mb-2 flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/40 bg-[#090807]',
          compact ? 'h-[5.5rem]' : 'h-[7rem]',
        )}
      >
        {artSrc ? (
          <img
            src={artSrc}
            alt=""
            className="pointer-events-none max-h-[94%] max-w-[94%] object-contain object-center"
            draggable={false}
          />
        ) : (
          <span className="text-[10px] uppercase tracking-widest text-[#454038] opacity-55">kart</span>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] pb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#969088]">
        <span className="truncate text-[#c4beb4]">{definition.type}</span>
        <motion.span
          layout
          className={cn(
            'shrink-0 font-semibold tabular-nums text-[#d4bc7a]',
            compact ? 'text-base' : 'text-[1.2rem]',
          )}
        >
          {definition.cost}
        </motion.span>
      </div>

      <p
        className={cn(
          'mt-2 line-clamp-2 font-display font-semibold leading-tight tracking-tight text-[#ebe4d9]',
          compact ? 'text-[13px]' : 'text-[1.0625rem]',
        )}
      >
        {definition.name}
        {definition.isUpgraded && (
          <span className="ml-1 rounded-sm bg-[#c4a054]/18 px-1 py-px text-[10px] font-semibold text-[#dbb96a]">
            +
          </span>
        )}
      </p>
      <p
        className={cn(
          'mt-1.5 min-h-0 flex-1 overflow-hidden leading-snug text-[#bfb6aa]',
          compact ? 'line-clamp-4 text-[11px]' : 'line-clamp-5 text-[13px]',
        )}
      >
        {definition.description}
      </p>

      {/* Keyword rozetleri */}
      {(definition.exhaust || definition.ethereal || definition.innate) && (
        <div className={cn('mt-auto flex shrink-0 flex-wrap gap-1', compact ? 'pt-1' : 'pt-1.5')}>
          {definition.exhaust && (
            <span className="rounded bg-[#8b1a1a]/35 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[#d46a6a]">
              Tüket
            </span>
          )}
          {definition.ethereal && (
            <span className="rounded bg-[#2a1f5e]/45 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[#8b82e0]">
              Geçici
            </span>
          )}
          {definition.innate && (
            <span className="rounded bg-[#3d5c25]/45 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[#7ab04e]">
              İçgüdü
            </span>
          )}
        </div>
      )}

      {!compact && !definition.exhaust && !definition.ethereal && !definition.innate ? (
        <div className="mt-auto shrink-0 border-t border-white/[0.05] pt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#5c574e]">
          #{definition.id}
        </div>
      ) : null}

      <motion.div
        layout
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-[-4px] -z-10 rounded-[inherit] blur-[32px]',
          definition.type === 'attack' ? 'bg-[#8b3d32]' : '',
          definition.type === 'skill' ? 'bg-[#3f5c4f]' : '',
          definition.type === 'power' ? 'bg-[#8a7438]' : '',
        )}
        initial={{ opacity: 0.08 }}
        whileHover={disabled ? undefined : { opacity: 0.28 }}
        transition={{ duration: 0.2 }}
      />
    </motion.article>
  )
}
