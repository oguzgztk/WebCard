/**
 * Yükseliş (Ascension) — birikimli zorluk kademeleri. Seviye N, 1..N arasındaki tüm kuralları içerir.
 * Bir seviyede kazanınca bir sonraki açılır (meta kayıt).
 */

export const MAX_ASCENSION = 10

/** İndeks = seviye. 0 = Normal. */
export const ASCENSION_RULES: readonly string[] = [
  'Normal zindan.',
  'Elit düşmanlar haritada daha sık çıkar.',
  'Sıradan düşmanların canı %10 artar.',
  'Elitler +1 Güç ile başlar.',
  'Bossların canı %10 artar.',
  'Kamp ateşi daha az iyileştirir; perde arası tam iyileşme yok.',
  'Koşuya canının %90’ıyla başlarsın.',
  'Sıradan düşmanlar +1 Güç ile başlar.',
  'Savaşlardan %25 daha az altın.',
  'İksir çantan 2 yuvalı.',
  'Bosslar +2 Güç ile başlar.',
]

/** Seviye `level` kuralı bu koşuda etkin mi? */
export const asc = (ascension: number, level: number) => ascension >= level

export function ascensionLabel(level: number) {
  return level === 0 ? 'Normal' : `Yükseliş ${level}`
}
