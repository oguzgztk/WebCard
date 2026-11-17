import { useMemo, useRef } from 'react'

/** Sürükle-bıraklı deste tasarımları için boşlık tutan kanca */
export function useDragCard() {
  const dragState = useRef({ active: false })
  return useMemo(() => {
    const start = () => {
      dragState.current.active = true
    }
    const end = () => {
      dragState.current.active = false
    }

    return {
      dragState,
      start,
      end,
    }
  }, [])
}
