import { Modal } from '@/components/ui/Modal'
import { STATUS_INFO, STATUS_KEYS } from '@/game/statuses'

type Props = Readonly<{ open: boolean; onClose: () => void }>

const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: 'Amaç',
    body: [
      'İki perdeyi aş: 13 katlık Zindan’ın sonunda Gölge Efendisi, altındaki Kemik Mahzenleri’nde Kemik Ejderi bekliyor.',
      'Haritada parlayan düğümlerden birini seçerek ilerle — her kat bir yol ayrımı.',
      'Perde bossunu yenince güçlü ama bedelli bir boss yadigârı seçersin ve derinlere inmeden önce iyileşirsin.',
      'Bir koşuyu kazanınca Yükseliş açılır: her seviye zindanı biraz daha acımasız yapar.',
    ],
  },
  {
    title: 'Savaş',
    body: [
      'Her tur 3 Enerji ve 5 kart alırsın. Kartın sol üstündeki sayı maliyetidir.',
      'Düşmanın üstündeki balon bir sonraki hamlesini gösterir: ⚔ saldırı, 🛡 blok, 💪 güçlenme.',
      'Blok yalnızca o tur için hasarı emer; senin turunun başında sıfırlanır.',
      'Kartın üzerindeki sayılar Güç, Zayıf ve Savunmasız etkilerine göre canlı güncellenir (yeşil: arttı, kırmızı: azaldı).',
    ],
  },
  {
    title: 'Koşu',
    body: [
      'Savaş sonrası kart ve altın kazanırsın; elitler ve boss yadigâr da verir.',
      'Kamp ateşinde ya dinlen ya da bir kartı kalıcı olarak yükselt.',
      'Tüccarda kart, yadigâr al ya da desteden zayıf bir kartı çıkar — ince deste daha tutarlıdır.',
      'Can savaşlar arasında taşınır. Koşu otomatik kaydedilir; menüden “Devam Et” ile sürdür.',
    ],
  },
  {
    title: 'Kısayollar',
    body: [
      '1–9: kart oyna · E: turu bitir · Esc: iptal',
      'Hedef seçerken 1–3: düşman · D/A: çekme/atma destesini gör',
      'Kartı düşmanın üzerine sürükleyerek de oynayabilirsin.',
    ],
  },
]

const KEYWORDS: Array<[string, string]> = [
  ['Tüket', 'Oynanınca bu savaştan çıkar.'],
  ['Geçici', 'Tur sonunda elde kalırsa tükenir.'],
  ['İçgüdü', 'Savaş başında her zaman elde başlar.'],
  ['Güç kartı', 'Oynanınca kalıcı bir etki bırakır ve savaştan çıkar.'],
]

export function HowToPlay({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Nasıl Oynanır" className="max-w-2xl">
      <div className="flex flex-col gap-5 text-[13.5px] leading-relaxed text-[#c4beb4]">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h3 className="mb-1.5 font-display text-[1.15rem] font-semibold text-[#e8c878]">{s.title}</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5 marker:text-[#6a5a3a]">
              {s.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}

        <section>
          <h3 className="mb-2 font-display text-[1.15rem] font-semibold text-[#e8c878]">Durumlar</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {STATUS_KEYS.map((k) => (
              <p key={k}>
                <span className="mr-1">{STATUS_INFO[k].icon}</span>
                <span className="font-semibold text-[#ede6d8]">{STATUS_INFO[k].label}:</span>{' '}
                {STATUS_INFO[k].tooltip.replace('{n}', 'N')}
              </p>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-display text-[1.15rem] font-semibold text-[#e8c878]">Anahtar kelimeler</h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {KEYWORDS.map(([k, v]) => (
              <p key={k}>
                <span className="font-semibold text-[#ede6d8]">{k}:</span> {v}
              </p>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  )
}
