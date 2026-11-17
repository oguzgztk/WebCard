/**
 * Kart açıklamaları etkilerden üretilir — açıklama ile davranış asla ayrışmaz.
 * Savaş içinde `ctx` verilirse hasar/blok sayıları Güç, Zayıf, Savunmasız, Çeviklik ile
 * güncellenir ve arttıysa `up`, azaldıysa `down` tonuyla işaretlenir.
 */

import { calcDamage } from '@/game/engine/effectResolver'
import { STATUS_INFO } from '@/game/statuses'
import type { CardDefinition, Effect, Statuses, TargetType } from '@/game/types'

export type TextTone = 'up' | 'down'
export type TextPart = { text: string; tone?: TextTone; keyword?: boolean }

export type CardTextContext = Readonly<{
  /** Oyuncu durumları (Güç, Zayıf, Çeviklik). */
  player: Statuses
  /** Tek hedefli önizleme için hedef düşman durumları (Savunmasız). */
  target?: Statuses
  /** Oyuncunun güncel bloğu (Gövde Darbesi için). */
  block?: number
}>

function num(base: number, actual: number): TextPart {
  if (actual > base) return { text: String(actual), tone: 'up' }
  if (actual < base) return { text: String(actual), tone: 'down' }
  return { text: String(actual) }
}

function targetPhrase(target: TargetType): string {
  return target === 'allEnemies' ? 'Tüm düşmanlara ' : ''
}

function describeEffect(effect: Effect, ctx?: CardTextContext): TextPart[] {
  switch (effect.kind) {
    case 'damage': {
      const actual = ctx
        ? calcDamage(effect.amount, ctx.player, effect.target === 'enemy' ? ctx.target : undefined)
        : effect.amount
      const hits = effect.hits ?? 1
      const prefix = targetPhrase(effect.target)
      if (hits > 1) {
        return [{ text: `${prefix}${hits} kez ` }, num(effect.amount, actual), { text: ' hasar ver.' }]
      }
      return [{ text: prefix }, num(effect.amount, actual), { text: ' hasar ver.' }]
    }
    case 'damageFromBlock': {
      const parts: TextPart[] = [{ text: `${targetPhrase(effect.target)}Bloğun kadar hasar ver` }]
      if (ctx?.block !== undefined) {
        const actual = calcDamage(ctx.block, ctx.player, effect.target === 'enemy' ? ctx.target : undefined)
        parts.push({ text: ' (' }, num(ctx.block, actual), { text: ')' })
      }
      parts.push({ text: '.' })
      return parts
    }
    case 'block': {
      const actual = ctx ? Math.max(0, effect.amount + (ctx.player.dexterity ?? 0)) : effect.amount
      return [num(effect.amount, actual), { text: ' Blok kazan.' }]
    }
    case 'draw':
      return [{ text: `${effect.amount} kart çek.` }]
    case 'gainEnergy':
      return [{ text: `${effect.amount} Enerji kazan.` }]
    case 'applyStatus': {
      const label = STATUS_INFO[effect.status].label
      if (effect.target === 'self') {
        return [{ text: `${effect.amount} ` }, { text: label, keyword: true }, { text: ' kazan.' }]
      }
      return [
        { text: `${targetPhrase(effect.target)}${effect.amount} ` },
        { text: label, keyword: true },
        { text: ' uygula.' },
      ]
    }
    case 'multiplyStatus': {
      const label = STATUS_INFO[effect.status].label
      const word = effect.factor === 2 ? 'ikiye' : effect.factor === 3 ? 'üçe' : `${effect.factor} kata`
      const who = effect.target === 'allEnemies' ? 'Tüm düşmanların' : effect.target === 'self' ? 'Kendi' : 'Düşmanın'
      return [{ text: `${who} ` }, { text: label, keyword: true }, { text: ` yığınını ${word} katla.` }]
    }
  }
}

export function describeCard(def: CardDefinition, ctx?: CardTextContext): TextPart[] {
  const parts: TextPart[] = []
  const push = (more: TextPart[]) => {
    if (parts.length) parts.push({ text: ' ' })
    parts.push(...more)
  }
  for (const effect of def.effects) push(describeEffect(effect, ctx))
  if (def.innate) push([{ text: 'İçgüdü.', keyword: true }])
  if (def.ethereal) push([{ text: 'Geçici.', keyword: true }])
  if (def.exhaust) push([{ text: 'Tüket.', keyword: true }])
  return parts
}

export function describeCardPlain(def: CardDefinition): string {
  return describeCard(def)
    .map((p) => p.text)
    .join('')
}

/** Anahtar kelime sözlüğü — kart üstü ipuçları için. */
export const KEYWORD_HELP: Record<string, string> = {
  'İçgüdü.': 'Savaş başında her zaman elde başlar.',
  'Geçici.': 'Tur sonunda elde kalırsa tükenir.',
  'Tüket.': 'Oynanınca bu savaştan çıkar.',
  Güç: 'Güç kartı: oynanınca kalıcı etki verir ve savaştan çıkar.',
}
