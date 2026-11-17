import { motion } from 'framer-motion'

import { RelicBadgeRow } from '@/components/relics/RelicCard'
import { ENEMY_DEFINITIONS_MAP } from '@/data/enemies'
import { EVENT_MAP } from '@/data/events'
import { RELIC_MAP } from '@/game/relics'
import type { MapNode, MapNodeKind, RunState } from '@/game/runTypes'

type Props = Readonly<{
  run: RunState
  onSelectNode: (nodeIndex: number) => void
  onAbandon: () => void
}>

// ---------------------------------------------------------------------------
// Sabitler ve yardımcılar
// ---------------------------------------------------------------------------

const NODE_R = 26          // düğüm yarıçapı (px)
const COL_W  = 320         // SVG genişliği
const ROW_H  = 88          // satır yüksekliği
const PADDING = 40         // üst/alt boşluk

/** İndeks bazlı deterministik x konumu (0..1) */
function nodeXFraction(idx: number, total: number): number {
  // Basit sinüs dalgası + periyodik kaydırma → görsel olarak doğal bir yol
  const t = idx / Math.max(total - 1, 1)
  const wave = Math.sin(idx * 1.9 + 0.8) * 0.22
  return Math.max(0.1, Math.min(0.9, 0.5 + wave + (t < 0.5 ? -0.05 : 0.05)))
}

function nodePos(idx: number, total: number) {
  const x = nodeXFraction(idx, total) * COL_W
  const y = PADDING + idx * ROW_H + NODE_R
  return { x, y }
}

const KIND_ICON: Record<MapNodeKind, string> = {
  combat: '⚔',
  elite:  '☠',
  rest:   '🔥',
  boss:   '💀',
  shop:   '🛒',
  event:  '❓',
}

const KIND_FILL: Record<MapNodeKind, string> = {
  combat: '#3a1f0e',
  elite:  '#3a0e0e',
  rest:   '#152010',
  boss:   '#1a0a2e',
  shop:   '#0a1228',
  event:  '#261808',
}

const KIND_STROKE: Record<MapNodeKind, string> = {
  combat: '#c4a054',
  elite:  '#c45a3e',
  rest:   '#6ab06a',
  boss:   '#9060d0',
  shop:   '#5090e0',
  event:  '#d4a040',
}

const KIND_LABEL: Record<MapNodeKind, string> = {
  combat: 'Savaş',
  elite:  'Elit',
  rest:   'Mola',
  boss:   'Boss',
  shop:   'Mağaza',
  event:  'Olay',
}

function nodeTitle(node: MapNode): string {
  if (node.kind === 'rest')  return 'Mola Noktası'
  if (node.kind === 'shop')  return 'Mağaza'
  if (node.kind === 'event') {
    const ev = node.eventId ? EVENT_MAP[node.eventId] : null
    return ev ? ev.title : 'Gizemli Olay'
  }
  if (!node.enemyDefId) return '???'
  const def = ENEMY_DEFINITIONS_MAP[node.enemyDefId]
  if (!def) return '???'
  if (node.kind === 'boss')  return `Boss: ${def.name}`
  if (node.kind === 'elite') return `Elit: ${def.name}`
  return def.name
}

// ---------------------------------------------------------------------------
// Bileşen
// ---------------------------------------------------------------------------

export function MapScreen({ run, onSelectNode, onAbandon }: Props) {
  const nodes  = run.nodes
  const total  = nodes.length
  const svgH   = PADDING * 2 + total * ROW_H

  const positions = nodes.map((_, i) => nodePos(i, total))

  return (
    <div className="flex min-h-dvh flex-col items-center overflow-hidden bg-[#080807]">
      {/* Arka plan */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-[-20%] top-[-15%] h-[40vh] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgb(80_60_38/0.15),_transparent_65%)]"
      />

      {/* Başlık bilgi paneli */}
      <div className="sticky top-0 z-20 w-full bg-[#080807]/90 px-4 pb-3 pt-5 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-xs items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#7a6e57]">Koşu</p>
            <h1 className="font-display text-[1.35rem] font-semibold tracking-tight text-[#ede6d8]">
              Zindan Yolu
            </h1>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-[#7a6e57]">Can</p>
              <p className="font-display text-lg font-semibold tabular-nums text-[#c47a5a]">
                {run.playerHp}<span className="text-[12px] text-[#5a4840]">/{run.playerMaxHp}</span>
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-[#7a6e57]">Altın</p>
              <p className="font-display text-lg font-semibold tabular-nums text-[#c4a054]">{run.gold}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.18em] text-[#7a6e57]">Deste</p>
              <p className="font-display text-lg font-semibold tabular-nums text-[#c4beb4]">{run.deckDefIds.length}</p>
            </div>
          </div>
        </div>

        {run.relics.length > 0 && (
          <div className="mx-auto mt-2 flex w-full max-w-xs items-center gap-2 rounded-lg border border-[#2e2820]/60 bg-black/25 px-3 py-1.5">
            <span className="text-[10px] text-[#5a5447]">Yadigârlar</span>
            <div className="ml-auto">
              <RelicBadgeRow relicIds={run.relics} relicMap={RELIC_MAP} />
            </div>
          </div>
        )}
      </div>

      {/* SVG harita */}
      <div className="relative w-full max-w-xs overflow-x-hidden pb-8">
        <svg
          width={COL_W}
          height={svgH}
          viewBox={`0 0 ${COL_W} ${svgH}`}
          className="mx-auto block w-full"
          style={{ maxWidth: COL_W }}
        >
          {/* Bağlantı yolları */}
          {nodes.map((_, i) => {
            if (i === 0) return null
            const from = positions[i - 1]!
            const to   = positions[i]!
            const done = nodes[i - 1]!.completed
            const mx   = (from.x + to.x) / 2
            const my   = (from.y + to.y) / 2 + 8

            return (
              <path
                key={`path-${i}`}
                d={`M ${from.x} ${from.y + NODE_R} Q ${mx} ${my} ${to.x} ${to.y - NODE_R}`}
                fill="none"
                stroke={done ? '#4a3f2e' : '#201c16'}
                strokeWidth={done ? 2.5 : 1.5}
                strokeDasharray={done ? undefined : '5 4'}
                strokeLinecap="round"
              />
            )
          })}

          {/* Düğümler */}
          {nodes.map((node, idx) => {
            const pos        = positions[idx]!
            const isActive   = idx === run.currentNodeIndex && !node.completed
            const isCompleted = node.completed
            const isFuture   = idx > run.currentNodeIndex
            const clickable  = isActive

            const fill   = KIND_FILL[node.kind]
            const stroke = KIND_STROKE[node.kind]
            const icon   = isCompleted ? '✓' : KIND_ICON[node.kind]

            return (
              <g key={node.id}>
                {/* Aktif halka animasyonu */}
                {isActive && (
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_R + 8}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={1.5}
                    opacity={0.5}
                    animate={{ r: [NODE_R + 6, NODE_R + 14, NODE_R + 6], opacity: [0.5, 0.15, 0.5] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                {/* Dış çerçeve */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_R + 3}
                  fill={isCompleted ? '#0c0a08' : fill}
                  stroke={isCompleted ? '#2a2520' : stroke}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  opacity={isFuture ? 0.45 : 1}
                />

                {/* İkon / metin */}
                <text
                  x={pos.x}
                  y={pos.y + 6}
                  textAnchor="middle"
                  fontSize={isCompleted ? 14 : 16}
                  opacity={isFuture ? 0.4 : isCompleted ? 0.5 : 1}
                  style={{ userSelect: 'none' }}
                >
                  {icon}
                </text>

                {/* Tıklama alanı */}
                {clickable && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_R + 3}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectNode(idx)}
                  />
                )}

                {/* Etiket (sağ veya sol) */}
                {!isFuture && (
                  <g opacity={isCompleted ? 0.35 : 1}>
                    <text
                      x={pos.x > COL_W / 2 ? pos.x - NODE_R - 10 : pos.x + NODE_R + 10}
                      y={pos.y - 5}
                      textAnchor={pos.x > COL_W / 2 ? 'end' : 'start'}
                      fontSize={9}
                      fontWeight="700"
                      letterSpacing="0.1em"
                      fill={isCompleted ? '#4a4438' : stroke}
                      style={{ textTransform: 'uppercase', userSelect: 'none' }}
                    >
                      {KIND_LABEL[node.kind]}
                    </text>
                    <text
                      x={pos.x > COL_W / 2 ? pos.x - NODE_R - 10 : pos.x + NODE_R + 10}
                      y={pos.y + 9}
                      textAnchor={pos.x > COL_W / 2 ? 'end' : 'start'}
                      fontSize={11}
                      fontWeight="600"
                      fill={isCompleted ? '#3a3530' : '#c4beb4'}
                      style={{ userSelect: 'none' }}
                    >
                      {nodeTitle(node)}
                    </text>
                    {isActive && (
                      <text
                        x={pos.x > COL_W / 2 ? pos.x - NODE_R - 10 : pos.x + NODE_R + 10}
                        y={pos.y + 22}
                        textAnchor={pos.x > COL_W / 2 ? 'end' : 'start'}
                        fontSize={9}
                        fill="#7a7060"
                        style={{ userSelect: 'none' }}
                      >
                        Tıkla →
                      </text>
                    )}
                  </g>
                )}

                {/* Gelecek düğüm: sadece simge, gizli etiket */}
                {isFuture && (
                  <text
                    x={pos.x > COL_W / 2 ? pos.x - NODE_R - 10 : pos.x + NODE_R + 10}
                    y={pos.y + 5}
                    textAnchor={pos.x > COL_W / 2 ? 'end' : 'start'}
                    fontSize={10}
                    fill="#3a3530"
                    style={{ userSelect: 'none' }}
                  >
                    {KIND_LABEL[node.kind]}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Terk et */}
      <button
        onClick={onAbandon}
        className="mb-10 text-[11px] text-[#3a3830] underline underline-offset-4 transition-colors hover:text-[#7a6e57]"
      >
        Koşuyu terk et
      </button>
    </div>
  )
}
