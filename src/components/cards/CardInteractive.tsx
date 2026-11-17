import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { memo, useState } from 'react'

import { CardFrame } from '@/components/cards/CardFrame'

import { describeCard, KEYWORD_HELP, type CardTextContext } from '@/game/cardText'
import type { CardDefinition, CardRarity, CardType } from '@/game/types'
import { getCardArtSrc } from '@/game/visuals'
import { cn } from '@/lib/cn'

export type CardSize = 'hand' | 'normal' | 'small'

export type CardInteractiveProps = {
  definition: CardDefinition
  disabled?: boolean
  /** Enerji yetmiyor — maliyet kırmızı görünür, kart yine de görünür kalır. */
  unaffordable?: boolean
  emphasize?: boolean
  size?: CardSize
  /** Savaş içi dinamik sayılar (Güç/Zayıf/Savunmasız/Çeviklik). */
  textContext?: CardTextContext
  /** Belirtilmezse kart tıklanamaz (saf görüntü modu). */
  onInteract?: () => void
  /** El içi düzen animasyonu için. */
  layoutId?: string
  /** İmleci izleyen 3D eğilme + parlama (varsayılan açık). */
  tilt?: boolean
}

/** Dokunmatik cihazda eğilme kapalı (parmak altında kart titremesin). */
const finePointer = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches

const TYPE_LABEL: Record<CardType, string> = { attack: 'Saldırı', skill: 'Beceri', power: 'Güç' }

const TYPE_TONE: Record<CardType, string> = {
  attack: 'from-[#2a1512] via-[#150e0d] to-[#090706] border-[#7a4638]/60',
  skill: 'from-[#122019] via-[#0d1411] to-[#070908] border-[#3f5a4b]/60',
  power: 'from-[#241c0c] via-[#151008] to-[#080706] border-[#7a6830]/65',
}

const TYPE_GLOW: Record<CardType, string> = {
  attack: 'rgb(170 70 52/0.55)',
  skill: 'rgb(70 120 96/0.5)',
  power: 'rgb(180 150 60/0.55)',
}

const RARITY_GEM: Record<CardRarity, string> = {
  starter: 'bg-[#6b655c]',
  common: 'bg-[#9a9285]',
  uncommon: 'bg-[#4f9fd4] shadow-[0_0_6px_rgb(79_159_212/0.8)]',
  rare: 'bg-[#e0b04a] shadow-[0_0_8px_rgb(224_176_74/0.9)]',
}

const RARITY_LABEL: Record<CardRarity, string> = {
  starter: 'Başlangıç',
  common: 'Yaygın',
  uncommon: 'Nadir',
  rare: 'Efsanevi',
}

const SIZES: Record<CardSize, { shell: string; art: string; name: string; text: string; cost: string }> = {
  hand: { shell: 'h-[12.6rem] w-[9rem] p-1.5', art: 'h-[4.9rem]', name: 'text-[13px]', text: 'text-[10.5px]', cost: 'h-7 w-7 text-[15px]' },
  normal: { shell: 'h-[16rem] w-[11.5rem] p-2.5', art: 'h-[6.6rem]', name: 'text-[15px]', text: 'text-[12px]', cost: 'h-8 w-8 text-[17px]' },
  small: { shell: 'h-[11rem] w-[7.9rem] p-1.5', art: 'h-[4.1rem]', name: 'text-[12px]', text: 'text-[9.5px]', cost: 'h-6 w-6 text-[13px]' },
}

function CardInteractiveImpl({
  definition,
  disabled,
  unaffordable,
  emphasize,
  size = 'normal',
  textContext,
  onInteract,
  layoutId,
  tilt = true,
}: CardInteractiveProps) {
  const s = SIZES[size]
  const rare = definition.rarity === 'rare'

  // 3D eğilme: imleç konumu (0..1) → yaylı rotateX/rotateY; parlama ve holo bu değerleri izler
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const springCfg = { stiffness: 260, damping: 22, mass: 0.6 }
  const rotateX = useSpring(useTransform(py, [0, 1], [11, -11]), springCfg)
  const rotateY = useSpring(useTransform(px, [0, 1], [-13, 13]), springCfg)
  const shineX = useTransform(px, (v) => `${v * 100}%`)
  const shineY = useTransform(py, (v) => `${v * 100}%`)
  const shine = useMotionTemplate`radial-gradient(circle at ${shineX} ${shineY}, rgb(255 255 255/0.28), transparent 55%)`
  const holoPos = useMotionTemplate`${shineX} ${shineY}`
  const [hovered, setHovered] = useState(false)
  const tiltOn = tilt && !disabled

  const [artFailed, setArtFailed] = useState(false)
  const artSrc = artFailed ? null : getCardArtSrc(definition)
  const parts = describeCard(definition, textContext)
  const glow = TYPE_GLOW[definition.type]
  const interactive = Boolean(onInteract) && !disabled

  return (
    <motion.article
      layoutId={layoutId}
      layout={layoutId ? true : undefined}
      aria-disabled={disabled}
      whileHover={interactive ? { y: size === 'hand' ? -14 : -6, scale: size === 'hand' ? 1.06 : 1.02 } : undefined}
      whileTap={interactive ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      onClick={(evt) => {
        evt.stopPropagation()
        if (interactive) onInteract?.()
      }}
      role={onInteract ? 'button' : undefined}
      tabIndex={interactive ? 0 : -1}
      aria-label={`${definition.name}, ${definition.cost} enerji. ${parts.map((p) => p.text).join('')}`}
      onKeyDown={(evt) => {
        if (!interactive) return
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault()
          onInteract?.()
        }
      }}
      onPointerMove={(e) => {
        if (!tiltOn || !finePointer()) return
        const r = e.currentTarget.getBoundingClientRect()
        px.set((e.clientX - r.left) / r.width)
        py.set((e.clientY - r.top) / r.height)
        if (!hovered) setHovered(true)
      }}
      onPointerLeave={() => {
        px.set(0.5)
        py.set(0.5)
        setHovered(false)
      }}
      style={{
        ['--card-glow' as string]: glow,
        rotateX: tiltOn ? rotateX : 0,
        rotateY: tiltOn ? rotateY : 0,
        transformPerspective: 700,
      }}
      className={cn(
        'group relative isolate flex select-none flex-col overflow-visible rounded-xl border bg-gradient-to-b text-left [transform-style:preserve-3d]',
        definition.rarity === 'rare' && 'border-[#c8a040]/70 shadow-[0_0_24px_-6px_rgb(232_190_80/0.55)]',
        definition.rarity === 'uncommon' && 'border-[#8a9ab8]/60',
        'shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_10px_26px_-8px_rgb(0_0_0/0.75)]',
        interactive && 'cursor-pointer hover:shadow-[0_0_0_1px_var(--card-glow),0_18px_40px_-10px_rgb(0_0_0/0.8),0_0_30px_-4px_var(--card-glow)]',
        s.shell,
        TYPE_TONE[definition.type],
        disabled && 'opacity-45 saturate-50',
        emphasize && 'z-10 -translate-y-3 shadow-[0_0_0_2px_rgb(212_175_55/0.95),0_0_36px_-4px_rgb(212_175_55/0.6)]',
      )}
    >
      <CardFrame rarity={definition.rarity} type={definition.type} upgraded={definition.isUpgraded} />

      {/* Efsanevi: imleçle kayan holografik folyo */}
      {rare && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] rounded-[inherit] mix-blend-color-dodge"
          style={{
            backgroundImage:
              'linear-gradient(115deg, transparent 20%, rgb(255 80 180/0.35) 35%, rgb(80 220 255/0.35) 48%, rgb(255 240 120/0.35) 60%, transparent 78%)',
            backgroundSize: '250% 250%',
            backgroundPosition: holoPos,
            opacity: hovered ? 0.55 : 0.22,
          }}
        />
      )}

      {/* İmleci izleyen parlama */}
      {tiltOn && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[7] rounded-[inherit] transition-opacity duration-200"
          style={{ background: shine, opacity: hovered ? 1 : 0 }}
        />
      )}

      {/* Maliyet */}
      <span
        className={cn(
          'absolute -left-2 -top-2 z-10 flex items-center justify-center rounded-full border-2 font-display font-bold tabular-nums shadow-[0_2px_8px_rgb(0_0_0/0.8)]',
          s.cost,
          unaffordable
            ? 'border-[#7a2a22] bg-gradient-to-b from-[#5a1a14] to-[#2a0a08] text-[#ff9a8a]'
            : 'border-[#8a7030] bg-gradient-to-b from-[#e8cf8a] to-[#9c7f3d] text-[#1a140a]',
        )}
      >
        {definition.cost}
      </span>

      {/* İsim */}
      <div
        className={cn(
          'relative z-[8] flex shrink-0 items-center justify-center gap-1 px-4 pb-1 pt-0.5',
          rare && 'mx-1 rounded-sm bg-gradient-to-r from-transparent via-[#5a3a0a]/80 to-transparent',
          definition.type === 'power' && !rare && 'mx-1 rounded-sm bg-gradient-to-r from-transparent via-[#3a2050]/70 to-transparent',
        )}
      >
        <p
          className={cn(
            'truncate text-center font-display font-semibold leading-tight tracking-tight',
            s.name,
            definition.isUpgraded ? 'text-[#a8e08a]' : rare ? 'text-[#ffe8a8] drop-shadow-[0_0_6px_rgb(255_200_80/0.6)]' : 'text-[#f0e8dc]',
          )}
        >
          {definition.name}
        </p>
      </div>

      {/* Görsel */}
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-black/50 bg-[#090807]',
          s.art,
        )}
      >
        {artSrc ? (
          <img
            src={artSrc}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setArtFailed(true)}
            className="pointer-events-none h-full w-full object-cover object-center"
            draggable={false}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: `radial-gradient(circle at 50% 45%, ${glow}, transparent 70%)` }}
          >
            <span className="text-[2.2em] drop-shadow-[0_2px_8px_rgb(0_0_0/0.9)]">{definition.glyph ?? '✦'}</span>
          </div>
        )}
      </div>

      {/* Tür + nadirlik */}
      <div className="mt-1 flex shrink-0 items-center justify-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.16em] text-[#a39a8c]">
        <span className={cn('h-1.5 w-1.5 rounded-full', RARITY_GEM[definition.rarity])} title={RARITY_LABEL[definition.rarity]} />
        {TYPE_LABEL[definition.type]}
      </div>

      {/* Açıklama */}
      <p className={cn('mt-1 flex min-h-0 flex-1 items-center justify-center overflow-hidden text-center leading-snug text-[#d4cbbd]', s.text)}>
        <span>
          {parts.map((p, i) => (
            <span
              key={i}
              title={p.keyword ? KEYWORD_HELP[p.text] : undefined}
              className={cn(
                p.tone === 'up' && 'font-bold text-[#8fe07a]',
                p.tone === 'down' && 'font-bold text-[#ff8a7a]',
                p.keyword && 'font-semibold text-[#e8c878]',
              )}
            >
              {p.text}
            </span>
          ))}
        </span>
      </p>
    </motion.article>
  )
}

export const CardInteractive = memo(CardInteractiveImpl)
