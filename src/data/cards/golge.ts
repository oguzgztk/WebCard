/**
 * Gölge kartları — Hız & Zehir.
 * Kimlik: ucuz kartlar, bol kart çekme, zehir yığıp katlamak, Çeviklik ile ayakta kalmak.
 */

import type { CardBlueprint } from '@/game/types'

export const GOLGE_CARDS: CardBlueprint[] = [
  // ── Başlangıç ─────────────────────────────────────────────────────────────
  {
    id: 'dagger', name: 'Hançer', cost: 1, type: 'attack', rarity: 'starter', art: 'dagger',
    effects: [{ kind: 'damage', amount: 6, target: 'enemy' }],
    upgrade: { effects: [{ kind: 'damage', amount: 9, target: 'enemy' }] },
  },
  {
    id: 'deflect', name: 'Savuş', cost: 0, type: 'skill', rarity: 'starter', art: 'deflect',
    effects: [{ kind: 'block', amount: 3 }],
    upgrade: { effects: [{ kind: 'block', amount: 6 }] },
  },
  {
    id: 'shadow_step', name: 'Gölge Adımı', cost: 1, type: 'skill', rarity: 'starter', art: 'shadow_step',
    effects: [{ kind: 'block', amount: 6 }, { kind: 'draw', amount: 1 }],
    upgrade: { effects: [{ kind: 'block', amount: 9 }, { kind: 'draw', amount: 1 }] },
  },
  {
    id: 'envenom', name: 'Zehirle', cost: 1, type: 'skill', rarity: 'starter', art: 'envenom',
    effects: [{ kind: 'applyStatus', status: 'poison', amount: 3, target: 'enemy' }],
    upgrade: { effects: [{ kind: 'applyStatus', status: 'poison', amount: 5, target: 'enemy' }] },
  },

  // ── Yaygın ────────────────────────────────────────────────────────────────
  {
    id: 'neutralize', name: 'Etkisizleştir', cost: 0, type: 'attack', rarity: 'common', art: 'neutralize',
    effects: [
      { kind: 'damage', amount: 4, target: 'enemy' },
      { kind: 'applyStatus', status: 'weak', amount: 1, target: 'enemy' },
    ],
    upgrade: {
      effects: [
        { kind: 'damage', amount: 5, target: 'enemy' },
        { kind: 'applyStatus', status: 'weak', amount: 2, target: 'enemy' },
      ],
    },
  },
  {
    id: 'weakening_ray', name: 'Zayıflatma Işını', cost: 0, type: 'skill', rarity: 'common', art: 'decay',
    effects: [{ kind: 'applyStatus', status: 'weak', amount: 2, target: 'enemy' }],
    upgrade: { effects: [{ kind: 'applyStatus', status: 'weak', amount: 3, target: 'enemy' }] },
  },
  {
    id: 'venomous_strike', name: 'Zehirli Vuruş', cost: 1, type: 'attack', rarity: 'common', art: 'venomous_strike',
    effects: [
      { kind: 'damage', amount: 6, target: 'enemy' },
      { kind: 'applyStatus', status: 'poison', amount: 3, target: 'enemy' },
    ],
    upgrade: {
      effects: [
        { kind: 'damage', amount: 8, target: 'enemy' },
        { kind: 'applyStatus', status: 'poison', amount: 4, target: 'enemy' },
      ],
    },
  },
  {
    id: 'after_image', name: 'Artık İmge', cost: 1, type: 'skill', rarity: 'common', art: 'after_image',
    effects: [{ kind: 'block', amount: 9 }, { kind: 'draw', amount: 1 }], ethereal: true,
    upgrade: { effects: [{ kind: 'block', amount: 12 }, { kind: 'draw', amount: 1 }] },
  },
  {
    id: 'deadly_poison', name: 'Ölümcül Zehir', cost: 1, type: 'skill', rarity: 'common', art: 'deadly_poison', glyph: '☠',
    effects: [{ kind: 'applyStatus', status: 'poison', amount: 4, target: 'enemy' }],
    upgrade: { effects: [{ kind: 'applyStatus', status: 'poison', amount: 6, target: 'enemy' }] },
  },
  {
    id: 'blade_fan', name: 'Bıçak Yelpazesi', cost: 1, type: 'attack', rarity: 'common', art: 'blade_fan', glyph: '✣',
    effects: [{ kind: 'damage', amount: 4, target: 'allEnemies' }, { kind: 'draw', amount: 1 }],
    upgrade: { effects: [{ kind: 'damage', amount: 6, target: 'allEnemies' }, { kind: 'draw', amount: 1 }] },
  },

  {
    id: 'quick_slash', name: 'Çabuk Kesik', cost: 1, type: 'attack', rarity: 'common', art: 'quick_slash', glyph: '⚡',
    effects: [{ kind: 'damage', amount: 8, target: 'enemy' }, { kind: 'draw', amount: 1 }],
    upgrade: { effects: [{ kind: 'damage', amount: 11, target: 'enemy' }, { kind: 'draw', amount: 1 }] },
  },
  {
    id: 'escape_plan', name: 'Kaçış Planı', cost: 0, type: 'skill', rarity: 'common', art: 'escape_plan', glyph: '🗺',
    effects: [{ kind: 'draw', amount: 1 }, { kind: 'block', amount: 3 }],
    upgrade: { effects: [{ kind: 'draw', amount: 1 }, { kind: 'block', amount: 5 }] },
  },

  // ── Nadir ─────────────────────────────────────────────────────────────────
  {
    id: 'bouncing_flask', name: 'Seken Şişe', cost: 2, type: 'skill', rarity: 'uncommon', art: 'bouncing_flask', glyph: '🧪',
    effects: [{ kind: 'applyStatus', status: 'poison', amount: 3, target: 'randomEnemy', times: 3 }],
    upgrade: { effects: [{ kind: 'applyStatus', status: 'poison', amount: 3, target: 'randomEnemy', times: 4 }] },
  },
  {
    id: 'caltrops', name: 'Demir Dikenler', cost: 1, type: 'power', rarity: 'uncommon', art: 'caltrops', glyph: '✳',
    effects: [{ kind: 'applyStatus', status: 'thorns', amount: 3, target: 'self' }],
    upgrade: { effects: [{ kind: 'applyStatus', status: 'thorns', amount: 5, target: 'self' }] },
  },
  {
    id: 'poison_cloud', name: 'Zehir Bulutu', cost: 2, type: 'skill', rarity: 'uncommon', art: 'poison_cloud',
    effects: [{ kind: 'applyStatus', status: 'poison', amount: 4, target: 'allEnemies' }],
    upgrade: { effects: [{ kind: 'applyStatus', status: 'poison', amount: 6, target: 'allEnemies' }] },
  },
  {
    id: 'smoke_bomb', name: 'Duman Bombası', cost: 2, type: 'skill', rarity: 'uncommon', art: 'smoke_bomb',
    effects: [
      { kind: 'block', amount: 12 },
      { kind: 'applyStatus', status: 'weak', amount: 2, target: 'allEnemies' },
    ],
    upgrade: {
      effects: [
        { kind: 'block', amount: 16 },
        { kind: 'applyStatus', status: 'weak', amount: 3, target: 'allEnemies' },
      ],
    },
  },
  {
    id: 'shadow_flurry', name: 'Gölge Fırtınası', cost: 1, type: 'skill', rarity: 'uncommon', art: 'shadow_flurry',
    effects: [{ kind: 'draw', amount: 3 }],
    upgrade: { effects: [{ kind: 'draw', amount: 4 }] },
  },
  {
    id: 'crippling_venom', name: 'Kırıcı Zehir', cost: 1, type: 'skill', rarity: 'uncommon', art: 'crippling_venom',
    effects: [
      { kind: 'applyStatus', status: 'poison', amount: 3, target: 'enemy' },
      { kind: 'applyStatus', status: 'vulnerable', amount: 2, target: 'enemy' },
    ],
    upgrade: {
      effects: [
        { kind: 'applyStatus', status: 'poison', amount: 5, target: 'enemy' },
        { kind: 'applyStatus', status: 'vulnerable', amount: 3, target: 'enemy' },
      ],
    },
  },
  {
    id: 'catalyst', name: 'Katalizör', cost: 1, type: 'skill', rarity: 'uncommon', art: 'catalyst', glyph: '⚗',
    effects: [{ kind: 'multiplyStatus', status: 'poison', factor: 2, target: 'enemy' }], exhaust: true,
    upgrade: { effects: [{ kind: 'multiplyStatus', status: 'poison', factor: 3, target: 'enemy' }] },
  },
  {
    id: 'footwork', name: 'Ayak Oyunu', cost: 1, type: 'power', rarity: 'uncommon', art: 'footwork', glyph: '🌀',
    effects: [{ kind: 'applyStatus', status: 'dexterity', amount: 2, target: 'self' }],
    upgrade: { effects: [{ kind: 'applyStatus', status: 'dexterity', amount: 3, target: 'self' }] },
  },

  // ── Efsanevi ──────────────────────────────────────────────────────────────
  {
    id: 'assassinate', name: 'Suikast', cost: 3, type: 'attack', rarity: 'rare', art: 'assassinate',
    effects: [{ kind: 'damage', amount: 30, target: 'enemy' }], exhaust: true,
    upgrade: { cost: 2 },
  },
  {
    id: 'adrenaline', name: 'Adrenalin', cost: 0, type: 'skill', rarity: 'rare', art: 'adrenaline', glyph: '💉',
    effects: [{ kind: 'gainEnergy', amount: 1 }, { kind: 'draw', amount: 2 }], exhaust: true,
    upgrade: { effects: [{ kind: 'gainEnergy', amount: 2 }, { kind: 'draw', amount: 2 }] },
  },
  {
    id: 'poisoned_blades', name: 'Zehirli Bıçaklar', cost: 2, type: 'power', rarity: 'rare', art: 'poisoned_blades', glyph: '🗡',
    effects: [{ kind: 'applyStatus', status: 'venomBlades', amount: 1, target: 'self' }],
    upgrade: { cost: 1 },
  },
  {
    id: 'noxious_fumes', name: 'Zehirli Duman', cost: 1, type: 'power', rarity: 'rare', art: 'noxious_fumes', glyph: '☁',
    effects: [{ kind: 'applyStatus', status: 'noxious', amount: 2, target: 'self' }],
    upgrade: { effects: [{ kind: 'applyStatus', status: 'noxious', amount: 3, target: 'self' }] },
  },
]
