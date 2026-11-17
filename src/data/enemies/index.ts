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
const poison = (value: number): EnemyIntent => ({ kind: 'apply_player_poison', value })

// ── Sıradan ────────────────────────────────────────────────────────────────

export const louse: EnemyDefinition = {
  id: 'louse', name: 'Asalak', maxHp: 27, art: 'louse',
  blurb: 'Küçük ama sinsi; sürü hâlinde zayıflatır.',
  intentScript: script([], [atk(7), weak(1), atk(4, 2), atk(8), def(6)]),
}

export const bat: EnemyDefinition = {
  id: 'bat', name: 'Mağara Yarasası', maxHp: 19, art: 'bat', glyph: '🦇',
  blurb: 'Sürüyle saldırır; tek tek kırılgan.',
  intentScript: script([], [atk(3, 2), atk(6), vuln(1), atk(4, 2)]),
}

export const jawWorm: EnemyDefinition = {
  id: 'jaw_worm', name: 'Çene Kurdu', maxHp: 48, art: 'jaw-worm',
  blurb: 'Toprak altından gelir; ısırır, kabuğuna çekilir, büyür.',
  intentScript: script([atk(12)], [atkDef(8, 6), buff(3), atk(12), atkDef(8, 6), atk(13)]),
}

export const cultist: EnemyDefinition = {
  id: 'cultist', name: 'Tarikatçı', maxHp: 56, art: 'cultist',
  blurb: 'Ayin yaptıkça güçlenir — çabuk bitir.',
  intentScript: script([buff(4)], [atk(7), atk(7), buff(3)]),
}

export const skeleton: EnemyDefinition = {
  id: 'skeleton', name: 'İskelet Muhafız', maxHp: 52, art: 'skeleton', glyph: '💀',
  blurb: 'Kalkanıyla vurur; sabırlı ve dayanıklı.',
  intentScript: script([], [atkDef(9, 6), atk(15), weak(2), atkDef(9, 6), def(10)]),
}

// ── Elit ───────────────────────────────────────────────────────────────────

export const fungibeast: EnemyDefinition = {
  id: 'fungibeast', name: 'Mantar Canavarı', maxHp: 92, art: 'fungibeast',
  blurb: 'Yavaş ama amansız — blok biriktirir, sonra ezer.',
  intentScript: script([def(12)], [atk(14), vuln(2), atk(8, 2), buff(3), atk(18), def(12)]),
}

export const stoneGolem: EnemyDefinition = {
  id: 'stone_golem', name: 'Taş Golem', maxHp: 100, art: 'stone_golem', glyph: '🗿',
  blurb: 'Kayadan yontulmuş muhafız; her vuruşu bir çığ.',
  intentScript: script([def(12)], [atk(19), atkDef(10, 10), buff(2), atk(6, 3), def(12)]),
}

// ── Boss ───────────────────────────────────────────────────────────────────

export const shadowLord: EnemyDefinition = {
  id: 'shadow_lord', name: 'Gölge Efendisi', maxHp: 165, art: 'shadow_lord',
  blurb: 'Zindanın efendisi. Gölgeleri büyüdükçe darbeleri ağırlaşır.',
  intentScript: script(
    [buff(2)],
    [atk(16), atk(8, 2), vuln(2), atkDef(17, 12), atk(5, 4), weak(2), atk(27), def(18), buff(3)],
  ),
}

// ═══ Perde II — Kemik Mahzenleri ═══════════════════════════════════════════

export const spider: EnemyDefinition = {
  id: 'spider', name: 'Mahzen Örümceği', maxHp: 30, art: 'spider', glyph: '🕷',
  blurb: 'Ağını örer, zehrini akıtır; sürü hâlinde ölümcül.',
  intentScript: script([], [atk(6), poison(3), atk(4, 2), def(6), atk(7)]),
}

export const wraith: EnemyDefinition = {
  id: 'wraith', name: 'Hayalet', maxHp: 46, art: 'wraith', glyph: '👻',
  blurb: 'Soğuk dokunuşu güç emer; çabuk vurur, çabuk kaybolur.',
  intentScript: script([weak(2)], [atk(4, 3), vuln(1), atk(12), atk(4, 3), weak(1)]),
}

export const gargoyle: EnemyDefinition = {
  id: 'gargoyle', name: 'Taş Gargoyle', maxHp: 64, art: 'gargoyle', glyph: '🦇',
  blurb: 'Taş kanatlar ardında bekler, sonra iner.',
  intentScript: script([def(14)], [atk(17), atkDef(11, 9), buff(2), atk(17), def(12)]),
}

export const fallenKnight: EnemyDefinition = {
  id: 'fallen_knight', name: 'Düşmüş Şövalye', maxHp: 135, art: 'fallen_knight', glyph: '⚔',
  blurb: 'Yemini çoktan çürümüş; kalkanı hâlâ sağlam.',
  intentScript: script([def(20)], [atk(20), atkDef(12, 12), vuln(2), atk(7, 3), buff(2), def(16)]),
}

export const cryptWitch: EnemyDefinition = {
  id: 'crypt_witch', name: 'Mahzen Cadısı', maxHp: 120, art: 'witch', glyph: '🧙',
  blurb: 'Kazanında zehir kaynar; lanetleri iliklere işler.',
  intentScript: script([poison(4)], [atk(13), weak(2), atk(7, 2), buff(3), poison(5), def(16)]),
}

export const boneDragon: EnemyDefinition = {
  id: 'bone_dragon', name: 'Kemik Ejderi', maxHp: 260, art: 'bone_dragon', glyph: '🐉',
  blurb: 'Mahzenlerin dibinde uyuyan kadim felaket.',
  intentScript: script(
    [buff(3)],
    [atk(17), poison(4), atk(6, 3), atkDef(18, 16), vuln(2), atk(28), def(22), atk(4, 5), buff(2)],
  ),
}

export const allEnemiesList: readonly EnemyDefinition[] = [
  louse, bat, jawWorm, cultist, skeleton, fungibeast, stoneGolem, shadowLord,
  spider, wraith, gargoyle, fallenKnight, cryptWitch, boneDragon,
]

export const ENEMY_DEFINITIONS_MAP: EnemyDefinitionsMap = Object.fromEntries(allEnemiesList.map((e) => [e.id, e]))
