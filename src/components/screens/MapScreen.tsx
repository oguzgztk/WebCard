import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

import { RunHud } from '@/components/screens/RunHud'
import { MAP_FLOORS, MAP_LANES } from '@/game/mapGen'
import { nodeTitle } from '@/game/nodeText'
import { availableNodeIds, currentNode } from '@/game/runEngine'
import type { MapNode, MapNodeKind, RunState } from '@/game/runTypes'
import { sfx } from '@/lib/audio'
import { cn } from '@/lib/cn'

type Props = Readonly<{
  run: RunState
  onSelectNode: (nodeId: string) => void
  onExit: () => void
  onAbandon: () => void
}>

const W = 400
const ROW = 78
const PAD = 46
const R = 19

const KIND: Record<MapNodeKind, { icon: string; label: string; fill: string; stroke: string }> = {
  combat: { icon: '⚔', label: 'Savaş', fill: '#2a1a0e', stroke: '#c4a054' },
  elite: { icon: '☠', label: 'Elit', fill: '#2e0e0c', stroke: '#e0664a' },
  rest: { icon: '🔥', label: 'Mola', fill: '#122010', stroke: '#6ab06a' },
  boss: { icon: '👑', label: 'Boss', fill: '#1c0a2e', stroke: '#a070e0' },
  shop: { icon: '💰', label: 'Tüccar', fill: '#0a1228', stroke: '#5090e0' },
  event: { icon: '❓', label: 'Olay', fill: '#241808', stroke: '#d4a040' },
  treasure: { icon: '🎁', label: 'Hazine', fill: '#241e08', stroke: '#e8c860' },
}

/** Düğüm ID'sinden sabit küçük kayma — ızgara görünümünü kırar. */
function jitter(id: string, span: number) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return ((h % 1000) / 1000) * span
}

function pos(node: MapNode) {
  const laneW = (W - PAD * 2) / (MAP_LANES - 1)
  const x = PAD + node.lane * laneW + (node.kind === 'boss' ? 0 : jitter(node.id, 18) - 9)
  const y = PAD + (MAP_FLOORS - 1 - node.floor) * ROW + (node.kind === 'boss' ? -10 : jitter(node.id + 'y', 14) - 7)
  return { x, y }
}

export function MapScreen({ run, onSelectNode, onExit, onAbandon }: Props) {
  const available = useMemo(() => new Set(availableNodeIds(run)), [run])
  const cur = currentNode(run)
  const [hover, setHover] = useState<MapNode | null>(null)
  const [confirmAbandon, setConfirmAbandon] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const byId = useMemo(() => new Map(run.nodes.map((n) => [n.id, n])), [run.nodes])
  const svgH = PAD * 2 + (MAP_FLOORS - 1) * ROW

  // Mevcut kata kaydır (harita aşağıdan yukarı okunur)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const floor = cur ? cur.floor + 1 : 0
    const y = PAD + (MAP_FLOORS - 1 - floor) * ROW
    el.scrollTo({ top: Math.max(0, y - el.clientHeight * 0.55), behavior: cur ? 'smooth' : 'auto' })
  }, [cur])

  const info = hover ?? (available.size === 1 ? byId.get([...available][0]!) : null)

  return (
    <div className="flex h-dvh flex-col bg-[#080807]">
      <RunHud run={run} onExit={onExit} />

      {/* Bilgi şeridi */}
      <div className="z-10 mx-auto flex h-11 w-full max-w-md items-center justify-center px-4 text-center">
        {info ? (
          <p className="truncate text-[13px] text-[#c4beb4]">
            <span className="mr-1.5 font-semibold" style={{ color: KIND[info.kind].stroke }}>
              {KIND[info.kind].icon} {KIND[info.kind].label}
            </span>
            {nodeTitle(info)}
          </p>
        ) : (
          <p className="text-[12px] text-[#6a6258]">Bir sonraki durağını seç — parlayan düğümler.</p>
        )}
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgb(90_40_120/0.18),transparent_45%)]"
          style={{ height: svgH }}
        />
        <svg width={W} height={svgH} viewBox={`0 0 ${W} ${svgH}`} className="relative mx-auto block max-w-full" role="list" aria-label="Zindan haritası">
          {/* Bağlantılar */}
          {run.nodes.flatMap((n) =>
            n.next.map((id) => {
              const to = byId.get(id)
              if (!to) return null
              const a = pos(n)
              const b = pos(to)
              const walked = n.visited && to.visited
              const open = cur?.id === n.id && available.has(id)
              return (
                <line
                  key={`${n.id}-${id}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={walked ? '#c4a054' : open ? '#e8d8a8' : '#3a342b'}
                  strokeWidth={walked ? 3 : open ? 2.5 : 1.5}
                  strokeDasharray={walked || open ? undefined : '4 5'}
                  strokeLinecap="round"
                  opacity={walked ? 0.9 : open ? 0.9 : 0.6}
                />
              )
            }),
          )}

          {/* Düğümler */}
          {run.nodes.map((n) => {
            const { x, y } = pos(n)
            const k = KIND[n.kind]
            const isAvail = available.has(n.id)
            const isCur = cur?.id === n.id
            const past = n.visited && !isCur
            const r = n.kind === 'boss' ? R + 12 : R
            const dim = !isAvail && !n.visited && !isCur
            return (
              <g
                key={n.id}
                role="listitem"
                aria-label={`${k.label}${isAvail ? ' (seçilebilir)' : ''}: ${nodeTitle(n)}`}
                tabIndex={isAvail ? 0 : -1}
                style={{ cursor: isAvail ? 'pointer' : 'default', outline: 'none' }}
                onMouseEnter={() => {
                  setHover(n)
                  if (isAvail) sfx.hover()
                }}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(n)}
                onClick={() => {
                  if (!isAvail) return
                  sfx.click()
                  onSelectNode(n.id)
                }}
                onKeyDown={(e) => {
                  if (isAvail && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onSelectNode(n.id)
                  }
                }}
              >
                {isAvail && (
                  <motion.circle
                    cx={x}
                    cy={y}
                    fill="none"
                    stroke={k.stroke}
                    strokeWidth={2}
                    initial={{ r: r + 3, opacity: 0.7 }}
                    animate={{ r: [r + 3, r + 11, r + 3], opacity: [0.7, 0.1, 0.7] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={past ? '#0c0a08' : k.fill}
                  stroke={isCur ? '#f2eae1' : past ? '#5a4a30' : k.stroke}
                  strokeWidth={isCur ? 3 : isAvail ? 2.5 : 1.5}
                  opacity={dim ? 0.55 : 1}
                />
                <text
                  x={x}
                  y={y + (n.kind === 'boss' ? 9 : 6)}
                  textAnchor="middle"
                  fontSize={n.kind === 'boss' ? 26 : 17}
                  fontWeight={700}
                  fill={past ? '#7a6a50' : k.stroke}
                  opacity={past ? 0.45 : dim ? 0.6 : 1}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {k.icon}
                </text>
                {past && (
                  <text x={x + r - 4} y={y - r + 8} fontSize={11} fill="#c4a054" style={{ pointerEvents: 'none' }}>
                    ✓
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Alt bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-[#1e1b17] bg-black/40 px-4 py-2 text-[10px] text-[#6a6258]">
        {(['combat', 'elite', 'event', 'rest', 'shop', 'treasure'] as const).map((kind) => (
          <span key={kind} className="flex items-center gap-1">
            <span>{KIND[kind].icon}</span>
            {KIND[kind].label}
          </span>
        ))}
        <span className="ml-2">
          {confirmAbandon ? (
            <span className="text-[#c47a5a]">
              Emin misin?{' '}
              <button className="underline hover:text-[#ff9a7a]" onClick={onAbandon}>
                Evet, terk et
              </button>{' '}
              ·{' '}
              <button className="underline" onClick={() => setConfirmAbandon(false)}>
                Vazgeç
              </button>
            </span>
          ) : (
            <button className={cn('underline underline-offset-2 hover:text-[#a89f92]')} onClick={() => setConfirmAbandon(true)}>
              Koşuyu terk et
            </button>
          )}
        </span>
      </div>
    </div>
  )
}
