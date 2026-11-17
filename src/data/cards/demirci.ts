/**
 * Demirci kartları — Güç & Savunma.
 * Kimlik: ağır vuruşlar, blok biriktirip ondan hasar üretme, Güç ile ölçeklenme.
 * Denge çıpası: 1 enerji ≈ 8 hasar ≈ 6–7 blok; 1 kart çekme ≈ ½ enerji.
 */

import type { CardBlueprint } from '@/game/types'

export const DEMIRCI_CARDS: CardBlueprint[] = [
  // ── Başlangıç ─────────────────────────────────────────────────────────────
  {
    id: 'strike', name: 'Darbe', cost: 1, type: 'attack', rarity: 'starter', art: 'swift',
    effects: [{ kind: 'damage', amount: 8, target: 'enemy' }],
    upgrade: { effects: [{ kind: 'damage', amount: 11, target: 'enemy' }] },
  },
  {
    id: 'defend', name: 'Savun', cost: 1, type: 'skill', rarity: 'starter', art: 'shield',
    effects: [{ kind: 'block', amount: 7 }],
    upgrade: { effects: [{ kind: 'block', amount: 10 }] },
  },
  {
    id: 'bash', name: 'Ezici Darbe', cost: 2, type: 'attack', rarity: 'starter', art: 'heavy',
    effects: [
      { kind: 'damage', amount: 10, target: 'enemy' },
      { kind: 'applyStatus', status: 'vulnerable', amount: 2, target: 'enemy' },
    ],
    upgrade: {
      effects: [
        { kind: 'damage', amount: 13, target: 'enemy' },
        { kind: 'applyStatus', status: 'vulnerable', amount: 3, target: 'enemy' },
      ],
    },
  },

  // ── Yaygın ────────────────────────────────────────────────────────────────
  {
    id: 'pommel_strike', name: 'Kabza Vuruşu', cost: 1, type: 'attack', rarity: 'common', art: 'pommel_strike',
    effects: [{ kind: 'damage', amount: 7, target: 'enemy' }, { kind: 'draw', amount: 1 }],
    upgrade: { effects: [{ kind: 'damage', amount: 10, target: 'enemy' }, { kind: 'draw', amount: 2 }] },
  },
  {
    id: 'twin_strike', name: 'İkiz Darbe', cost: 1, type: 'attack', rarity: 'common', art: 'twin_strike',
    effects: [{ kind: 'damage', amount: 5, hits: 2, target: 'enemy' }],
    upgrade: { effects: [{ kind: 'damage', amount: 7, hits: 2, target: 'enemy' }] },
  },
  {
    id: 'thunderclap', name: 'Gök Gürültüsü', cost: 1, type: 'attack', rarity: 'common', art: 'thunderclap',
    effects: [
      { kind: 'damage', amount: 4, target: 'allEnemies' },
      { kind: 'applyStatus', status: 'vulnerable', amount: 1, target: 'allEnemies' },
    ],
    upgrade: {
      effects: [
        { kind: 'damage', amount: 7, target: 'allEnemies' },
        { kind: 'applyStatus', status: 'vulnerable', amount: 1, target: 'allEnemies' },
      ],
    },
  },
  {
    id: 'iron_wave', name: 'Demir Dalga', cost: 1, type: 'attack', rarity: 'common', art: 'wedge',
    effects: [{ kind: 'damage', amount: 6, target: 'enemy' }, { kind: 'block', amount: 6 }],
    upgrade: { effects: [{ kind: 'damage', amount: 8, target: 'enemy' }, { kind: 'block', amount: 8 }] },
  },
  {
    id: 'shrug_it_off', name: 'Silkelen', cost: 1, type: 'skill', rarity: 'common', art: 'shrug_it_off',
    effects: [{ kind: 'block', amount: 8 }, { kind: 'draw', amount: 1 }],
    upgrade: { effects: [{ kind: 'block', amount: 11 }, { kind: 'draw', amount: 1 }] },
  },
  {
    id: 'war_cry', name: 'Savaş Avazı', cost: 0, type: 'skill', rarity: 'common', art: 'war_cry',
    effects: [{ kind: 'draw', amount: 1 }], innate: true, exhaust: true,
    upgrade: { effects: [{ kind: 'draw', amount: 2 }] },
  },
  {
    id: 'ghost_blade', name: 'Hayalet Kılıcı', cost: 1, type: 'attack', rarity: 'common', art: 'ghost_blade',
    effects: [{ kind: 'damage', amount: 11, target: 'enemy' }], ethereal: true,
    upgrade: { effects: [{ kind: 'damage', amount: 15, target: 'enemy' }] },
  },

  // ── Nadir ─────────────────────────────────────────────────────────────────
  {
    id: 'blade_dance', name: 'Kılıç Dansı', cost: 1, type: 'attack', rarity: 'uncommon', art: 'duel',
    effects: [{ kind: 'damage', amount: 3, hits: 3, target: 'enemy' }],
    upgrade: { effects: [{ kind: 'damage', amount: 4, hits: 3, target: 'enemy' }] },
  },
  {
    id: 'backflip', name: 'Geri Takla', cost: 1, type: 'skill', rarity: 'uncommon', art: 'backflip',
    effects: [{ kind: 'block', amount: 5 }, { kind: 'draw', amount: 2 }],
    upgrade: { effects: [{ kind: 'block', amount: 8 }, { kind: 'draw', amount: 2 }] },
  },
  {
    id: 'heavy_blade', name: 'Ağır Kılıç', cost: 2, type: 'attack', rarity: 'uncommon', art: 'heavy_blade',
    effects: [{ kind: 'damage', amount: 18, target: 'enemy' }],
    upgrade: { effects: [{ kind: 'damage', amount: 24, target: 'enemy' }] },
  },
  {
    id: 'whirlwind', name: 'Kasırga', cost: 2, type: 'attack', rarity: 'uncommon', art: 'flame',
    effects: [{ kind: 'damage', amount: 5, hits: 2, target: 'allEnemies' }],
    upgrade: { effects: [{ kind: 'damage', amount: 7, hits: 2, target: 'allEnemies' }] },
  },
  {
    id: 'seeing_red', name: 'Kızıl Göz', cost: 1, type: 'skill', rarity: 'uncommon', art: 'surge',
    effects: [{ kind: 'gainEnergy', amount: 2 }], exhaust: true,
    upgrade: { cost: 0 },
  },
  {
    id: 'battle_cry', name: 'Savaş Nidası', cost: 1, type: 'skill', rarity: 'uncommon', art: 'battle_cry',
    effects: [{ kind: 'draw', amount: 3 }],
    upgrade: { effects: [{ kind: 'draw', amount: 4 }] },
  },
  {
    id: 'body_slam', name: 'Gövde Darbesi', cost: 1, type: 'attack', rarity: 'uncommon', art: 'slam',
    effects: [{ kind: 'damageFromBlock', target: 'enemy' }],
    upgrade: { cost: 0 },
  },
  {
    id: 'mirror_image', name: 'Ayna İmgesi', cost: 1, type: 'skill', rarity: 'uncommon', art: 'mirror_image',
    effects: [{ kind: 'block', amount: 14 }], ethereal: true,
    upgrade: { effects: [{ kind: 'block', amount: 19 }] },
  },
  {
    id: 'cloth_armor', name: 'Zırh Kaplama', cost: 1, type: 'power', rarity: 'uncommon', art: 'plating',
    effects: [{ kind: 'applyStatus', status: 'metallicize', amount: 3, target: 'self' }],
    upgrade: { effects: [{ kind: 'applyStatus', status: 'metallicize', amount: 4, target: 'self' }] },
  },
  {
    id: 'rage_burst', name: 'Öfke Patlaması', cost: 1, type: 'power', rarity: 'common', art: 'rage_burst',
    effects: [{ kind: 'applyStatus', status: 'strength', amount: 2, target: 'self' }],
    upgrade: { effects: [{ kind: 'applyStatus', status: 'strength', amount: 3, target: 'self' }] },
  },
  {
    id: 'spiked_armor', name: 'Dikenli Zırh', cost: 1, type: 'power', rarity: 'uncommon', art: 'spiked_armor', glyph: '🌵',
    effects: [{ kind: 'applyStatus', status: 'thorns', amount: 3, target: 'self' }],
    upgrade: { effects: [{ kind: 'applyStatus', status: 'thorns', amount: 5, target: 'self' }] },
  },

  // ── Efsanevi ──────────────────────────────────────────────────────────────
  {
    id: 'carnage', name: 'Katliam', cost: 2, type: 'attack', rarity: 'rare', art: 'carnage',
    effects: [{ kind: 'damage', amount: 22, target: 'enemy' }], ethereal: true,
    upgrade: { effects: [{ kind: 'damage', amount: 30, target: 'enemy' }] },
  },
  {
    id: 'earthquake', name: 'Deprem', cost: 3, type: 'attack', rarity: 'rare', art: 'earthquake', glyph: '⛰',
    effects: [
      { kind: 'damage', amount: 14, target: 'allEnemies' },
      { kind: 'applyStatus', status: 'vulnerable', amount: 2, target: 'allEnemies' },
    ],
    upgrade: {
      effects: [
        { kind: 'damage', amount: 19, target: 'allEnemies' },
        { kind: 'applyStatus', status: 'vulnerable', amount: 2, target: 'allEnemies' },
      ],
    },
  },
  {
    id: 'forge_spirit', name: 'Örs Ruhu', cost: 2, type: 'power', rarity: 'rare', art: 'forge_spirit', glyph: '⚒',
    effects: [
      { kind: 'applyStatus', status: 'strength', amount: 2, target: 'self' },
      { kind: 'applyStatus', status: 'metallicize', amount: 2, target: 'self' },
    ],
    upgrade: { cost: 1 },
  },
]
