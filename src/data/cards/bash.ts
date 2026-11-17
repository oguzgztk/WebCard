import type { CardDefinition } from '@/game/types'

export const bash: CardDefinition = {
  id: 'bash',
  name: 'Bash',
  cost: 2,
  type: 'attack',
  description: '10 hasar ver; zayıflatılmış hasar için 3 Tur savunması kırığı uygula.',
  effects: [
    { kind: 'damage', amount: 10, target: 'enemy' },
    { kind: 'applyStatus', status: 'vulnerable', amount: 3, target: 'enemy' },
  ],
}
