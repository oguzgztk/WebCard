import type { CardDefinition } from '@/game/types'

/** Savaş Avazı — her savaşın başında elde gelir, oynanınca yüklenir. */
export const warCry: CardDefinition = {
  id: 'war_cry',
  name: 'Savaş Avazı',
  cost: 0,
  type: 'skill',
  description: '1 kart çek. İçgüdü. Tüket.',
  effects: [{ kind: 'draw', amount: 1 }],
  innate: true,
  exhaust: true,
}
