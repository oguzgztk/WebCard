import { useEffect, useRef, useState } from 'react'

export type Floater = { id: number; text: string; kind: 'damage' | 'block' | 'heal' }

let nextId = 1

/**
 * Can/blok değişimlerinden uçan sayılar üretir.
 * `hitKey` her can kaybında artar — vuruş parlaması animasyonunu yeniden tetiklemek için.
 */
export function useHpDelta(hp: number, block: number) {
  const prev = useRef({ hp, block })
  const [floaters, setFloaters] = useState<Floater[]>([])
  const [hitKey, setHitKey] = useState(0)
  const timers = useRef(new Set<number>())

  // Zamanlayıcılar yalnızca bileşen kaldırılırken temizlenir; ardışık vuruşlarda
  // önceki sayılar da kendi süresi dolunca kaybolur.
  useEffect(() => {
    const set = timers.current
    return () => set.forEach((t) => window.clearTimeout(t))
  }, [])

  useEffect(() => {
    const p = prev.current
    prev.current = { hp, block }
    const added: Floater[] = []
    if (hp < p.hp) added.push({ id: nextId++, text: `−${p.hp - hp}`, kind: 'damage' })
    if (hp > p.hp) added.push({ id: nextId++, text: `+${hp - p.hp}`, kind: 'heal' })
    if (block > p.block) added.push({ id: nextId++, text: `+${block - p.block}🛡`, kind: 'block' })
    // Blok emildiyse ama can düşmediyse "engellendi" göster
    if (block < p.block && hp === p.hp && block > 0) added.push({ id: nextId++, text: 'Engellendi', kind: 'block' })
    if (!added.length) return
    if (hp < p.hp) setHitKey((k) => k + 1)
    setFloaters((f) => [...f, ...added])
    const ids = added.map((a) => a.id)
    const t = window.setTimeout(() => {
      timers.current.delete(t)
      setFloaters((f) => f.filter((x) => !ids.includes(x.id)))
    }, 1100)
    timers.current.add(t)
  }, [hp, block])

  return { floaters, hitKey }
}
