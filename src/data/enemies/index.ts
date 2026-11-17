/**
 * Düşman tanımları. Niyet dizileri deterministiktir; oyuncu niyeti okuyup plan yapar.
 * `cycle(i, [...])` diziyi döngüsel okur; ilk elemanlar "açılış" olarak `opening` ile ayrılabilir.
 */

import type { EnemyDefinition, EnemyDefinitionsMap, EnemyIntent } from '@/game/types'

/** Açılış niyetlerini bir kez oynatır, sonra `loop` dizisini döndürür. */
function script(opening: EnemyIntent[], loop: EnemyIntent[]) {
  return (i: number): EnemyIntent => (i < opening.length ? opening[i]! : loop[(i - opening.length) % loop.length]!)
}

const atk = (value: number, hits?: number): EnemyIntent => ({ kind: 'attack', value, hits })
const def = (value: number): EnemyIntent => ({ kind: 'defend', value })
const buff = (value: number): EnemyIntent => ({ kind: 'buff', value })
const atkDef = (value: number, block: number): EnemyIntent => ({ kind: 'attack_defend', value, block })
const weak = (value: number): EnemyIntent => ({ kind: 'apply_player_weak', value })
const vuln = (value: number): EnemyIntent => ({ kind: 'apply_player_vulnerable', value })

// ── Sıradan ────────────────────────────────────────────────────────────────

export const louse: EnemyDefinition = {
  id: 'louse', name: 'Asalak', maxHp: 24, art: 'louse',
  blurb: 'Küçük ama sinsi; sürü hâlinde zayıflatır.',
  intentScript: script([], [atk(6), weak(1), atk(4, 2), atk(7), def(6)]),
}

export const bat: EnemyDefinition = {
  id: 'bat', name: 'Mağara Yarasası', maxHp: 17, glyph: '🦇',
  blurb: 'Sürüyle saldırır; tek tek kırılgan.',
  intentScript: script([], [atk(3, 2), atk(5), vuln(1), atk(3, 2)]),
}

export const jawWorm: EnemyDefinition = {
  id: 'jaw_worm', name: 'Çene Kurdu', maxHp: 44, art: 'jaw-worm',
  blurb: 'Toprak altından gelir; ısırır, kabuğuna çekilir, büyür.',
  intentScript: script([atk(11)], [atkDef(7, 5), buff(3), atk(11), atkDef(7, 5), atk(11)]),
}

export const cultist: EnemyDefinition = {
  id: 'cultist', name: 'Tarikatçı', maxHp: 50, art: 'cultist',
  blurb: 'Ayin yaptıkça güçlenir — çabuk bitir.',
  intentScript: script([buff(3)], [atk(6), atk(6), buff(2)]),
}

export const skeleton: EnemyDefinition = {
  id: 'skeleton', name: 'İskelet Muhafız', maxHp: 46, glyph: '💀',
  blurb: 'Kalkanıyla vurur; sabırlı ve dayanıklı.',
  intentScript: script([], [atkDef(8, 6), atk(13), weak(2), atkDef(8, 6), def(10)]),
}

// ── Elit ───────────────────────────────────────────────────────────────────

export const fungibeast: EnemyDefinition = {
  id: 'fungibeast', name: 'Mantar Canavarı', maxHp: 92, art: 'fungibeast',
  blurb: 'Yavaş ama amansız — blok biriktirir, sonra ezer.',
  intentScript: script([def(12)], [atk(14), vuln(2), atk(8, 2), buff(3), atk(18), def(12)]),
}

export const stoneGolem: EnemyDefinition = {
  id: 'stone_golem', name: 'Taş Golem', maxHp: 118, glyph: '🗿',
  blurb: 'Kayadan yontulmuş muhafız; her vuruşu bir çığ.',
  intentScript: script([def(15)], [atk(22), atkDef(12, 10), buff(2), atk(7, 3), def(14)]),
}

// ── Boss ───────────────────────────────────────────────────────────────────

export const shadowLord: EnemyDefinition = {
  id: 'shadow_lord', name: 'Gölge Efendisi', maxHp: 230, art: 'shadow_lord',
  blurb: 'Zindanın efendisi. Gölgeleri büyüdükçe darbeleri ağırlaşır.',
  intentScript: script(
    [buff(2)],
    [atk(16), atk(8, 2), vuln(2), atkDef(18, 15), atk(6, 4), weak(2), atk(28), def(24), buff(2)],
  ),
}

export const allEnemiesList: readonly EnemyDefinition[] = [
  louse, bat, jawWorm, cultist, skeleton, fungibeast, stoneGolem, shadowLord,
]

export const ENEMY_DEFINITIONS_MAP: EnemyDefinitionsMap = Object.fromEntries(allEnemiesList.map((e) => [e.id, e]))
