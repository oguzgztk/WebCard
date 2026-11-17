import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/cn'

type Props = Readonly<{
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  className?: string
}>

/**
 * Basit modal — Esc ve arka plana tıklama ile kapanır.
 * `document.body`'ye portal ile çizilir: `backdrop-filter`/`transform` taşıyan ataların
 * `position: fixed` için yeni kapsayıcı oluşturup modalı kırpmasını önler.
 */
export function Modal({ open, onClose, title, children, className }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[600] flex items-start justify-center overflow-y-auto bg-[#050403]/88 px-4 py-8 backdrop-blur-md sm:py-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-4xl rounded-2xl border border-[#3f3a34] bg-[#100f0c]/98 p-5 shadow-[0_32px_80px_-20px_rgb(0_0_0/0.9)] sm:p-7',
              className,
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              {title ? (
                <h2 className="font-display text-[1.6rem] font-semibold tracking-tight text-[#f2eae1]">{title}</h2>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3f3a34] text-[#a89f92] transition hover:border-[#6a5f4f] hover:text-[#f2eae1]"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
