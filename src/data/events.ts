/**
 * Olay (Event) tanımları — metin tabanlı seçim olayları.
 * Her olay ID'si, başlık, lore metni ve 2-3 seçenek içerir.
 * Seçenek sonuçları RunState üzerinde etki uygular.
 */

/** Tek bir seçimin RunState üzerindeki atomik etkisi. Bir seçim birden çok etki içerebilir. */
export type EventEffect =
  | { kind: 'gainGold'; amount: number }
  | { kind: 'loseGold'; amount: number }
  | { kind: 'gainHp'; amount: number }
  | { kind: 'loseHp'; amount: number }
  | { kind: 'gainCard'; cardId: string }

export interface EventOutcome {
  /** Sırayla uygulanır; boş dizi = hiçbir şey olmaz. */
  effects: EventEffect[]
  /** Oyuncuya gösterilen sonuç metni */
  resultText: string
}

export interface EventChoice {
  label: string
  description: string
  outcome: EventOutcome
}

export interface EventDefinition {
  id: string
  title: string
  /** Olay atmosfer metni */
  lore: string
  choices: EventChoice[]
}

export const ALL_EVENTS: EventDefinition[] = [
  {
    id: 'ancient_shrine',
    title: 'Kadim Tapınak',
    lore:
      'Zifiri karanlıkta bir taş sunak yükseliyor. Üzerinde taze kan izleri var. Burada bir şey teklif edilmiş, bir şey alınmış.',
    choices: [
      {
        label: 'Kan sun',
        description: '7 can kaybet, 50 altın kazan.',
        outcome: { effects: [{ kind: 'loseHp', amount: 7 }, { kind: 'gainGold', amount: 50 }], resultText: 'Sunaktan bir avuç altın döküldü. Acı buna değdi.' },
      },
      {
        label: 'Dua et',
        description: '20 can kazan.',
        outcome: { effects: [{ kind: 'gainHp', amount: 20 }], resultText: 'Ruhun arındı; yaralar kapandı.' },
      },
      {
        label: 'Geç git',
        description: 'Hiçbir şey olmaz.',
        outcome: { effects: [], resultText: 'Tapınağa sırt döndün ve yürümeye devam ettin.' },
      },
    ],
  },
  {
    id: 'wandering_merchant',
    title: 'Gezgin Tüccar',
    lore:
      'Yolun ortasında seyyar bir tezgah. Tüccar gülümsüyor: "Bugünlük indirim var, ama yalnızca cesur yolcular için."',
    choices: [
      {
        label: '30 altına iksir al',
        description: '30 altın harca, 25 can kazan.',
        outcome: { effects: [{ kind: 'loseGold', amount: 30 }, { kind: 'gainHp', amount: 25 }], resultText: 'İksiri içtin; eski yaralar kapandı.' },
      },
      {
        label: 'Çantasını çal',
        description: '40 altın kazan ama 12 can kaybet.',
        outcome: { effects: [{ kind: 'gainGold', amount: 40 }, { kind: 'loseHp', amount: 12 }], resultText: 'Tüccar bağırdı. Kaçtın ama bir bıçak sırtına saplandı.' },
      },
      {
        label: 'İlgilenme',
        description: 'Hiçbir şey olmaz.',
        outcome: { effects: [], resultText: 'Tezgahın önünden sessizce geçtin.' },
      },
    ],
  },
  {
    id: 'cursed_well',
    title: 'Lanetli Kuyu',
    lore:
      'Taşları kararmış derin bir kuyu. Dibinden tuhaf bir ışık yükseliyor. Kuyunun kenarına yazılmış: "Al ya da bırak."',
    choices: [
      {
        label: 'Kuyuya bak',
        description: '10 can kay­bet; 60 altın kazan.',
        outcome: { effects: [{ kind: 'loseHp', amount: 10 }, { kind: 'gainGold', amount: 60 }], resultText: 'Bir his canını yaktı ama altınlar avucuna döküldü.' },
      },
      {
        label: 'Su iç',
        description: '30 can kazan.',
        outcome: { effects: [{ kind: 'gainHp', amount: 30 }], resultText: 'Su tatlı ve soğuktu; gücün yerine geldi.' },
      },
      {
        label: 'Devam et',
        description: 'Hiçbir şey olmaz.',
        outcome: { effects: [], resultText: 'Kuyuya sırt döndün.' },
      },
    ],
  },
  {
    id: 'old_soldier',
    title: 'Yaşlı Asker',
    lore:
      'Bir ağacın gölgesinde dinlenen yaşlı bir savaşçı. Yıpranmış zırhı ve sönmüş gözleriyle sana bakıyor. "Bir şeyler öğreteyim mi?"',
    choices: [
      {
        label: 'Eğitim al',
        description: '15 can kaybet; yeni bir kart kazan (Savaş Avazı).',
        outcome: { effects: [{ kind: 'loseHp', amount: 15 }, { kind: 'gainCard', cardId: 'war_cry' }], resultText: 'Pişmanlık duymadan antrenman yaptın. Yeni bir hamle öğrendin.' },
      },
      {
        label: 'Altın ver',
        description: '25 altın harca, 20 can kazan.',
        outcome: { effects: [{ kind: 'loseGold', amount: 25 }, { kind: 'gainHp', amount: 20 }], resultText: 'Asker gülümsedi ve yaranı sardı.' },
      },
      {
        label: 'Geç',
        description: 'Hiçbir şey olmaz.',
        outcome: { effects: [], resultText: 'Saygıyla başını eğdin ve yürüdün.' },
      },
    ],
  },
  {
    id: 'haunted_campfire',
    title: 'Perili Ateş',
    lore:
      'Ortada yanmaya devam eden bir ateş var; ancak etrafında kimse yok. Ateşin üzerinde bir tencere kaynıyor. Hazır bir yemek mi bu?',
    choices: [
      {
        label: 'Ye',
        description: '30 can kazan.',
        outcome: { effects: [{ kind: 'gainHp', amount: 30 }], resultText: 'Yemek lezzetliydi. Güçlendin.' },
      },
      {
        label: 'Ateşi söndür',
        description: '30 altın kazan.',
        outcome: { effects: [{ kind: 'gainGold', amount: 30 }], resultText: 'Külün altında altın sikkeleri buldun.' },
      },
      {
        label: 'Uzak dur',
        description: 'Hiçbir şey olmaz.',
        outcome: { effects: [], resultText: 'Temkinli davrandın ve geçtin.' },
      },
    ],
  },
  {
    id: 'tome_of_power',
    title: 'Güç Kitabı',
    lore:
      'Bir kitaplığın kalıntıları arasında yarı yanmış bir kitap. Sayfaları hâlâ ışıl ışıl parlıyor. Açsan ne olur?',
    choices: [
      {
        label: 'Oku',
        description: '20 can kaybet; 80 altın kazan.',
        outcome: { effects: [{ kind: 'loseHp', amount: 20 }, { kind: 'gainGold', amount: 80 }], resultText: 'Bilgi bedavaya gelmez. Kafan zonkladı ama cüzdan doldu.' },
      },
      {
        label: 'Sat',
        description: '50 altın kazan.',
        outcome: { effects: [{ kind: 'gainGold', amount: 50 }], resultText: 'Yakınlardaki bir büyücüye iyi fiyata sattın.' },
      },
      {
        label: 'Yak',
        description: 'Hiçbir şey olmaz.',
        outcome: { effects: [], resultText: 'Ateşe attın. Bir duman tüttü ve yok oldu.' },
      },
    ],
  },
  {
    id: 'wounded_traveler',
    title: 'Yaralı Yolcu',
    lore:
      'Yolun kenarında kıvrılmış bir yolcu. Zırhı yırtılmış, sesi titriyor: "Lütfen yardım et…"',
    choices: [
      {
        label: 'Yardım et',
        description: '20 can kaybet; 60 altın kazan.',
        outcome: { effects: [{ kind: 'loseHp', amount: 20 }, { kind: 'gainGold', amount: 60 }], resultText: 'Kendi yaranı sarmadan önce onu iyileştirdin. Minnettar olarak cüzdanını uzattı.' },
      },
      {
        label: 'Soy',
        description: '40 altın kazan, 8 can kaybet.',
        outcome: { effects: [{ kind: 'gainGold', amount: 40 }, { kind: 'loseHp', amount: 8 }], resultText: 'Lanetini üstüne aldın ama para işe yarıyor.' },
      },
      {
        label: 'Geç',
        description: 'Hiçbir şey olmaz.',
        outcome: { effects: [], resultText: 'Vicdanını bir kenara bırakıp yürüdün.' },
      },
    ],
  },
  {
    id: 'mysterious_altar',
    title: 'Gizemli Sunak',
    lore:
      'Altın kaplama bir sunak önünde duruyorsun. Üzerinde üç farklı sembol oyulmuş: kalkan, kılıç ve göz. Hangisine el sürersin?',
    choices: [
      {
        label: 'Kalkan sembolüne dokun',
        description: '25 can kazan.',
        outcome: { effects: [{ kind: 'gainHp', amount: 25 }], resultText: 'Bir ışık sardı seni; vücut sertleşti.' },
      },
      {
        label: 'Kılıç sembolüne dokun',
        description: '30 altın kazan.',
        outcome: { effects: [{ kind: 'gainGold', amount: 30 }], resultText: 'Bir vızıltı duyuldu ve altınlar materyalize oldu.' },
      },
      {
        label: 'Göz sembolüne dokun',
        description: '10 can kaybet ve 50 altın kazan.',
        outcome: { effects: [{ kind: 'loseHp', amount: 10 }, { kind: 'gainGold', amount: 50 }], resultText: 'Kısa bir vizyon gördün; çok ağır geldi. Ama değerdi.' },
      },
    ],
  },
]

export const EVENT_MAP: Record<string, EventDefinition> = Object.fromEntries(
  ALL_EVENTS.map((e) => [e.id, e]),
)
