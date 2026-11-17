/**
 * Sentezlenmiş ses efektleri (Web Audio) — harici dosya yok, ağ yükü yok.
 * Tunç/kâğıt temasına uygun: kısa, yumuşak, metalik tınılar.
 * AudioContext ilk kullanıcı etkileşiminde açılır (tarayıcı otomatik oynatma kuralı).
 */

import { getSettings } from '@/game/store/settingsStore'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null

/** AudioContext'i (gerekirse) oluşturur. Ses kapalıyken de müzik için kullanılabilir. */
function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
      master = ctx.createGain()
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function audio(): { ctx: AudioContext; out: GainNode } | null {
  const s = getSettings()
  if (!s.sound) return null
  const c = ensureContext()
  if (!c || !master) return null
  master.gain.value = Math.max(0, Math.min(1, s.volume)) * 0.5
  return { ctx: c, out: master }
}

function noise(c: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

type ToneOpts = {
  freq: number
  to?: number
  dur: number
  type?: OscillatorType
  gain?: number
  delay?: number
  attack?: number
}

function tone({ freq, to, dur, type = 'sine', gain = 0.3, delay = 0, attack = 0.005 }: ToneOpts) {
  const a = audio()
  if (!a) return
  const t0 = a.ctx.currentTime + delay
  const osc = a.ctx.createOscillator()
  const g = a.ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(a.out)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

type BurstOpts = { dur: number; freq?: number; q?: number; gain?: number; delay?: number; type?: BiquadFilterType }

function burst({ dur, freq = 1200, q = 0.8, gain = 0.3, delay = 0, type = 'bandpass' }: BurstOpts) {
  const a = audio()
  if (!a) return
  const t0 = a.ctx.currentTime + delay
  const src = a.ctx.createBufferSource()
  src.buffer = noise(a.ctx)
  const filter = a.ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.value = freq
  filter.Q.value = q
  const g = a.ctx.createGain()
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filter).connect(g).connect(a.out)
  src.start(t0)
  src.stop(t0 + dur + 0.02)
}

export const sfx = {
  /** Arayüz tıklaması. */
  click() {
    tone({ freq: 620, to: 520, dur: 0.06, type: 'triangle', gain: 0.12 })
  },
  hover() {
    tone({ freq: 880, dur: 0.03, type: 'sine', gain: 0.04 })
  },
  cardPlay() {
    burst({ dur: 0.12, freq: 2400, q: 0.6, gain: 0.16 })
    tone({ freq: 330, to: 440, dur: 0.1, type: 'triangle', gain: 0.1 })
  },
  draw() {
    burst({ dur: 0.06, freq: 3200, q: 1.2, gain: 0.07 })
  },
  /** Düşmana vuruş — hasar büyüdükçe daha tok. */
  hit(amount: number) {
    const heavy = Math.min(1, amount / 25)
    burst({ dur: 0.14 + heavy * 0.12, freq: 900 - heavy * 500, q: 0.9, gain: 0.32 + heavy * 0.18, type: 'lowpass' })
    tone({ freq: 160 - heavy * 60, to: 60, dur: 0.18 + heavy * 0.1, type: 'sine', gain: 0.35 + heavy * 0.2 })
  },
  /** Blok kalkana çarptı / blok kazanıldı. */
  block() {
    tone({ freq: 740, to: 680, dur: 0.16, type: 'square', gain: 0.06 })
    tone({ freq: 1110, dur: 0.22, type: 'sine', gain: 0.06, delay: 0.01 })
  },
  playerHurt(amount: number) {
    const heavy = Math.min(1, amount / 20)
    burst({ dur: 0.2, freq: 500, q: 0.7, gain: 0.32 + heavy * 0.15, type: 'lowpass' })
    tone({ freq: 220, to: 90, dur: 0.25, type: 'sawtooth', gain: 0.08 + heavy * 0.06 })
  },
  enemyDeath() {
    tone({ freq: 300, to: 50, dur: 0.6, type: 'sawtooth', gain: 0.1 })
    burst({ dur: 0.5, freq: 400, q: 0.5, gain: 0.25, type: 'lowpass' })
  },
  buff() {
    ;[392, 523, 659].forEach((f, i) => tone({ freq: f, dur: 0.18, type: 'triangle', gain: 0.1, delay: i * 0.05 }))
  },
  debuff() {
    ;[440, 370, 311].forEach((f, i) => tone({ freq: f, dur: 0.18, type: 'triangle', gain: 0.08, delay: i * 0.05 }))
  },
  poison() {
    burst({ dur: 0.25, freq: 600, q: 4, gain: 0.12 })
    tone({ freq: 180, to: 140, dur: 0.25, type: 'sine', gain: 0.08 })
  },
  turnStart() {
    tone({ freq: 523, dur: 0.12, type: 'triangle', gain: 0.08 })
    tone({ freq: 784, dur: 0.18, type: 'triangle', gain: 0.07, delay: 0.07 })
  },
  enemyTurn() {
    tone({ freq: 196, to: 165, dur: 0.3, type: 'triangle', gain: 0.08 })
  },
  coin() {
    tone({ freq: 1318, dur: 0.08, type: 'square', gain: 0.05 })
    tone({ freq: 1760, dur: 0.18, type: 'square', gain: 0.05, delay: 0.06 })
  },
  upgrade() {
    ;[523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.22, type: 'triangle', gain: 0.09, delay: i * 0.06 }))
    burst({ dur: 0.3, freq: 5000, q: 0.5, gain: 0.05, delay: 0.18 })
  },
  heal() {
    ;[392, 494, 587].forEach((f, i) => tone({ freq: f, dur: 0.35, type: 'sine', gain: 0.1, delay: i * 0.08 }))
  },
  victory() {
    ;[392, 523, 659, 784].forEach((f, i) => tone({ freq: f, dur: 0.4, type: 'triangle', gain: 0.12, delay: i * 0.1 }))
  },
  defeat() {
    ;[330, 277, 233, 175].forEach((f, i) => tone({ freq: f, dur: 0.5, type: 'sawtooth', gain: 0.06, delay: i * 0.16 }))
  },
  relic() {
    ;[659, 880, 1175].forEach((f, i) => tone({ freq: f, dur: 0.5, type: 'sine', gain: 0.1, delay: i * 0.09 }))
  },
  denied() {
    tone({ freq: 160, dur: 0.12, type: 'square', gain: 0.06 })
    tone({ freq: 140, dur: 0.12, type: 'square', gain: 0.06, delay: 0.1 })
  },
}

/** Mobil titreşim geri bildirimi (destekleniyorsa ve açıksa). */
export function haptic(pattern: number | number[]) {
  if (!getSettings().haptics) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* desteklenmiyor */
  }
}

// ---------------------------------------------------------------------------
// Ambiyans müziği — karanlık bir drone + seyrek çan notaları (D minör pentatonik).
// ---------------------------------------------------------------------------

let music: { gain: GainNode; stop: () => void } | null = null

const BELL_NOTES = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33] // D4 F4 G4 A4 C5 D5

export function startMusic() {
  const c = ensureContext()
  if (!c || music) return
  const gain = c.createGain()
  gain.gain.value = 0
  gain.connect(c.destination)

  // Drone: iki hafif detune testere → alçak geçiren filtre (yavaş LFO ile nefes alır)
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 320
  filter.Q.value = 2
  filter.connect(gain)
  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.frequency.value = 0.05
  lfoGain.gain.value = 160
  lfo.connect(lfoGain).connect(filter.frequency)
  lfo.start()

  const drones = [73.42, 73.9, 110].map((f, i) => {
    const o = c.createOscillator()
    o.type = i === 2 ? 'triangle' : 'sawtooth'
    o.frequency.value = f
    const g = c.createGain()
    g.gain.value = i === 2 ? 0.05 : 0.07
    o.connect(g).connect(filter)
    o.start()
    return o
  })

  // Yankı: geri beslemeli gecikme
  const delay = c.createDelay(2)
  delay.delayTime.value = 0.7
  const feedback = c.createGain()
  feedback.gain.value = 0.45
  delay.connect(feedback).connect(delay)
  delay.connect(gain)

  let timer = 0
  const bell = () => {
    const t0 = c.currentTime
    const f = BELL_NOTES[Math.floor(Math.random() * BELL_NOTES.length)]!
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3)
    o.connect(g)
    g.connect(gain)
    g.connect(delay)
    o.start(t0)
    o.stop(t0 + 3.1)
    timer = window.setTimeout(bell, 3500 + Math.random() * 5000)
  }
  timer = window.setTimeout(bell, 2000)

  music = {
    gain,
    stop() {
      window.clearTimeout(timer)
      const t = c.currentTime
      gain.gain.cancelScheduledValues(t)
      gain.gain.setTargetAtTime(0, t, 0.4)
      window.setTimeout(() => {
        drones.forEach((o) => o.stop())
        lfo.stop()
        gain.disconnect()
      }, 2000)
    },
  }
  updateMusicVolume()
}

export function stopMusic() {
  music?.stop()
  music = null
}

export function updateMusicVolume() {
  if (!music || !ctx) return
  const s = getSettings()
  const target = s.music ? Math.max(0, Math.min(1, s.volume)) * 0.35 : 0
  music.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.8)
}
