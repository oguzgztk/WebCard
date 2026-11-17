/** Durum (status) meta verisi — motor ve arayüz aynı tablodan okur. */

import type { StatusKey, Statuses } from '@/game/types'

export const STATUS_KEYS: readonly StatusKey[] = [
  'strength',
  'dexterity',
  'metallicize',
  'thorns',
  'noxious',
  'barricade',
  'venomBlades',
  'vulnerable',
  'weak',
  'poison',
]

export interface StatusInfo {
  label: string
  /** Kısa açıklama; `{n}` yığın sayısıyla değiştirilir. */
  tooltip: string
  /** Olumlu mu (sahibi için)? Renk ve önizleme tonu buna göre. */
  positive: boolean
  icon: string
}

export const STATUS_INFO: Record<StatusKey, StatusInfo> = {
  strength: { label: 'Güç', tooltip: 'Her saldırı vuruşuna +{n} hasar.', positive: true, icon: '💪' },
  dexterity: { label: 'Çeviklik', tooltip: 'Kazanılan her bloka +{n}.', positive: true, icon: '🌀' },
  metallicize: { label: 'Zırh Kaplama', tooltip: 'Tur sonunda {n} Blok kazanır.', positive: true, icon: '🛡' },
  thorns: { label: 'Diken', tooltip: 'Saldırana her vuruşta {n} hasar verir.', positive: true, icon: '🌵' },
  noxious: { label: 'Zehirli Duman', tooltip: 'Tur başında tüm düşmanlara {n} Zehir.', positive: true, icon: '☁' },
  barricade: { label: 'Demir İrade', tooltip: 'Blok tur başında sıfırlanmaz.', positive: true, icon: '🏰' },
  venomBlades: { label: 'Zehirli Bıçaklar', tooltip: 'Saldırıların her vuruşta {n} Zehir uygular.', positive: true, icon: '🗡' },
  vulnerable: { label: 'Savunmasız', tooltip: 'Alınan saldırı hasarı %50 artar. {n} tur.', positive: false, icon: '💔' },
  weak: { label: 'Zayıf', tooltip: 'Verilen saldırı hasarı %25 azalır. {n} tur.', positive: false, icon: '🥀' },
  poison: { label: 'Zehir', tooltip: 'Tur başında {n} hasar alır, sonra 1 azalır.', positive: false, icon: '☠' },
}

export function emptyStatuses(): Statuses {
  return {
    vulnerable: 0,
    weak: 0,
    strength: 0,
    poison: 0,
    dexterity: 0,
    metallicize: 0,
    thorns: 0,
    noxious: 0,
    barricade: 0,
    venomBlades: 0,
  }
}

/** Eski kayıtlarda eksik anahtarlar olabilir — eksikleri 0 ile tamamlar. */
export function normalizeStatuses(partial: Partial<Statuses> | undefined): Statuses {
  return { ...emptyStatuses(), ...partial }
}

export function statusTooltip(key: StatusKey, n: number) {
  return STATUS_INFO[key].tooltip.replace('{n}', String(n))
}
