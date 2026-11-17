import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type ButtonTone = 'primary' | 'ghost' | 'danger'
type ButtonSize = 'compact' | 'normal'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone
  size?: ButtonSize
}

const toneLookup: Record<ButtonTone, string> = {
  primary:
    'border border-[#5e4f2f] bg-gradient-to-b from-[#dfc07a] to-[#9c7f3d] font-semibold text-[#17130d] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_4px_16px_-2px_rgb(0_0_0/0.55)] hover:from-[#e8cf8e] hover:to-[#aa8a43] hover:text-[#0f0d09] active:brightness-95 focus-visible:ring-[#c4a054]',
  ghost:
    'border border-stone-600/45 bg-black/35 text-[#dbd3c7] backdrop-blur-sm hover:bg-stone-900/85 hover:border-stone-500/55 hover:text-[#f0eae2] focus-visible:ring-[#73664f]',
  danger:
    'border border-[#5f2f2e] bg-gradient-to-b from-[#ae4a43] to-[#7f2f2c] text-[#fdeeed] hover:from-[#bc5750] hover:to-[#8f3935] focus-visible:ring-[#c45c42]',
}

const sizing: Record<ButtonSize, string> = {
  compact: 'px-3 py-2 text-[12px] leading-snug',
  normal: 'px-6 py-3.5 text-[14px] leading-snug',
}

export function UIButton({
  className,
  tone = 'ghost',
  size = 'compact',
  disabled,
  ...rest
}: Props) {
  const toneClass = toneLookup[tone]
  const sizingClass = sizing[size]

  const disabledTone = disabled
    ? 'cursor-not-allowed opacity-[0.42] saturate-[0.9] grayscale-[0.15]'
    : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080807]'

  return (
    <button
      type="button"
      className={cn(
        'rounded-lg tracking-tight transition-[transform,filter,box-shadow,color,background-color] duration-200',
        'active:translate-y-px disabled:active:translate-y-0 disabled:active:brightness-100',
        toneClass,
        sizingClass,
        disabledTone,
        className,
      )}
      disabled={disabled}
      {...rest}
    />
  )
}
