import { cn } from '@/lib/cn'

/** Altın sikke simgesi — emoji fontlarından bağımsız, her platformda aynı görünür. */
export function Coin({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-[0.9em] w-[0.9em] shrink-0 rounded-full border border-[#8a6a20] bg-[radial-gradient(circle_at_35%_30%,#fff2b0,#e0b040_45%,#8a6418)] align-[-0.1em] shadow-[0_0_6px_rgb(224_176_64/0.5)]',
        className,
      )}
    />
  )
}
