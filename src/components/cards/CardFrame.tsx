import { memo, useId } from 'react'

import type { CardRarity, CardType } from '@/game/types'

/**
 * Kart çerçevesi — nadirliğe göre metal, süs ve dikenler.
 * viewBox 100×140: tüm kart boyutları ≈ 5:7 olduğundan süsler hiçbir boyutta çarpılmaz.
 *
 *  - starter   sade demir
 *  - common    bronz + perçinler
 *  - uncommon  gümüş + içe kıvrılan köşe kıvrımları + mavi taş
 *  - rare      altın + içe doğru kıvrılan sivri dikenler + taç dikeni
 *  - power     rün iç çerçevesi (her nadirlikte)
 */

type Props = Readonly<{ rarity: CardRarity; type: CardType; upgraded?: boolean }>

const METAL: Record<CardRarity, [string, string, string]> = {
  starter: ['#8a8680', '#4a4640', '#1e1c18'],
  common: ['#e0a868', '#8a5a28', '#3a2208'],
  uncommon: ['#f0f4ff', '#8a94a8', '#2a3040'],
  rare: ['#fff2b0', '#d8a838', '#5a3a08'],
}

/**
 * Kıvrık diken: tabanı (x,y) kenarda, `angle` yönünde içeri uzanır ve ucu `curl` derece bükülür.
 * İki ikinci derece eğriyle hilal biçimli, sivri bir diken çizer.
 */
function thorn(x: number, y: number, angle: number, len: number, width: number, curl: number) {
  const rad = (d: number) => (d * Math.PI) / 180
  const a = rad(angle)
  const t = rad(angle + curl)
  const px = -Math.sin(a)
  const py = Math.cos(a)
  const tipX = x + Math.cos(t) * len
  const tipY = y + Math.sin(t) * len
  const midX = x + Math.cos(a) * len * 0.55
  const midY = y + Math.sin(a) * len * 0.55
  const w = width / 2
  const f = (n: number) => n.toFixed(2)
  return [
    `M${f(x + px * w)} ${f(y + py * w)}`,
    `Q${f(midX + px * w * 0.5)} ${f(midY + py * w * 0.5)} ${f(tipX)} ${f(tipY)}`,
    `Q${f(midX - px * w * 0.9)} ${f(midY - py * w * 0.9)} ${f(x - px * w)} ${f(y - py * w)}`,
    'Z',
  ].join(' ')
}

/** Efsanevi çerçevenin dikenleri — her köşede iki kıvrık diken, kenar ortalarında birer diken, tepede taç. */
const RARE_THORNS = [
  // sol üst — iki uzun, birbirine doğru kıvrılan diken + küçük bir yan diken
  thorn(10, 1.6, 72, 19, 5.2, 48),
  thorn(1.6, 12, 18, 17, 5, -48),
  thorn(19, 1.4, 88, 7, 2.6, 30),
  // sağ üst
  thorn(90, 1.6, 108, 19, 5.2, -48),
  thorn(98.4, 12, 162, 17, 5, 48),
  thorn(81, 1.4, 92, 7, 2.6, -30),
  // sol alt
  thorn(10, 138.4, -72, 19, 5.2, -48),
  thorn(1.6, 128, -18, 17, 5, 48),
  thorn(19, 138.6, -88, 7, 2.6, -30),
  // sağ alt
  thorn(90, 138.4, -108, 19, 5.2, 48),
  thorn(98.4, 128, -162, 17, 5, -48),
  thorn(81, 138.6, -92, 7, 2.6, 30),
  // kenar ortaları — ikişer kıvrık diken
  thorn(1.4, 62, 5, 11, 3.8, 38),
  thorn(1.4, 78, -5, 11, 3.8, -38),
  thorn(98.6, 62, 175, 11, 3.8, -38),
  thorn(98.6, 78, 185, 11, 3.8, 38),
  thorn(44, 138.6, -95, 10, 3.4, -32),
  thorn(56, 138.6, -85, 10, 3.4, 32),
  // taç: tepe ortasında üç diken
  thorn(42, 1.4, 95, 8, 3, 30),
  thorn(50, 1.2, 90, 12, 3.8, 0),
  thorn(58, 1.4, 85, 8, 3, -30),
].join(' ')

/** Nadir çerçevenin içe kıvrılan köşe kıvrımları (filigran). */
const UNCOMMON_SCROLLS = [
  'M2.5 16 C2.5 7 7 2.5 16 2.5 M6 18 C6 11 9 6 15 6 C12 8 10 11 11 14 C12 16 14 15 13.5 13',
  'M97.5 16 C97.5 7 93 2.5 84 2.5 M94 18 C94 11 91 6 85 6 C88 8 90 11 89 14 C88 16 86 15 86.5 13',
  'M2.5 124 C2.5 133 7 137.5 16 137.5 M6 122 C6 129 9 134 15 134 C12 132 10 129 11 126 C12 124 14 125 13.5 127',
  'M97.5 124 C97.5 133 93 137.5 84 137.5 M94 122 C94 129 91 134 85 134 C88 132 90 129 89 126 C88 124 86 125 86.5 127',
].join(' ')

function CardFrameImpl({ rarity, type, upgraded }: Props) {
  const uid = useId().replace(/:/g, '')
  const [hi, mid, lo] = METAL[rarity]
  const m = `metal-${uid}`
  const g = `glow-${uid}`
  const thick = rarity === 'rare' ? 2.4 : rarity === 'uncommon' ? 1.6 : 1.2

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 140"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 z-[6] h-full w-full overflow-visible"
    >
      <defs>
        <linearGradient id={m} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={hi} />
          <stop offset="0.45" stopColor={mid} />
          <stop offset="0.7" stopColor={hi} />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
        <filter id={g} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* Dış ve iç çerçeve çizgileri */}
      <rect x="0.8" y="0.8" width="98.4" height="138.4" rx="6.5" fill="none" stroke={`url(#${m})`} strokeWidth={thick} />
      <rect x="3.3" y="3.3" width="93.4" height="133.4" rx="4.6" fill="none" stroke={`url(#${m})`} strokeWidth="0.45" opacity="0.75" />

      {/* Yükseltilmiş: yeşil iç parıltı */}
      {upgraded && (
        <rect x="3.3" y="3.3" width="93.4" height="133.4" rx="4.6" fill="none" stroke="#8fe07a" strokeWidth="1.4" opacity="0.55" filter={`url(#${g})`} />
      )}

      {/* Güç kartı: rünlü iç çerçeve */}
      {type === 'power' && (
        <>
          <rect x="5.2" y="5.2" width="89.6" height="129.6" rx="3.4" fill="none" stroke="#c89aff" strokeWidth="0.9" opacity="0.5" filter={`url(#${g})`} />
          <rect x="5.2" y="5.2" width="89.6" height="129.6" rx="3.4" fill="none" stroke="#e8c878" strokeWidth="0.55" strokeDasharray="0.6 1.6 2.4 1.6" opacity="0.9" />
        </>
      )}

      {rarity === 'common' && (
        <g fill={`url(#${m})`} stroke={lo} strokeWidth="0.3">
          <circle cx="5.5" cy="5.5" r="1.4" />
          <circle cx="94.5" cy="5.5" r="1.4" />
          <circle cx="5.5" cy="134.5" r="1.4" />
          <circle cx="94.5" cy="134.5" r="1.4" />
        </g>
      )}

      {rarity === 'uncommon' && (
        <>
          <path d={UNCOMMON_SCROLLS} fill="none" stroke={`url(#${m})`} strokeWidth="1" strokeLinecap="round" />
          <path d="M50 0.2 L53 3 L50 5.8 L47 3 Z" fill="#4f9fd4" stroke={hi} strokeWidth="0.4" />
          <path d="M50 0.2 L53 3 L50 5.8 L47 3 Z" fill="#7ac8ff" opacity="0.7" filter={`url(#${g})`} />
        </>
      )}

      {rarity === 'rare' && (
        <>
          {/* dikenlerin gölgesi + kendisi */}
          <path d={RARE_THORNS} fill="#000" opacity="0.55" transform="translate(0.6 0.9)" />
          <path d={RARE_THORNS} fill={`url(#${m})`} stroke={lo} strokeWidth="0.35" />
          {/* taç taşı */}
          <circle cx="50" cy="3" r="2.1" fill="#ff5a3a" stroke={hi} strokeWidth="0.5" />
          <circle cx="50" cy="3" r="2.6" fill="#ff8a40" opacity="0.6" filter={`url(#${g})`} />
          {/* köşe taşları */}
          <g fill="#ffe6a0" stroke={lo} strokeWidth="0.3">
            <circle cx="4.2" cy="4.2" r="1.3" />
            <circle cx="95.8" cy="4.2" r="1.3" />
            <circle cx="4.2" cy="135.8" r="1.3" />
            <circle cx="95.8" cy="135.8" r="1.3" />
          </g>
        </>
      )}
    </svg>
  )
}

export const CardFrame = memo(CardFrameImpl)
