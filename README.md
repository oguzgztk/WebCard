# Web Card — Roguelike Deck-Builder

Tarayıcıda oynanan, karanlık-tunç temalı bir **roguelike deste kurma** oyunu.
Karakterini seç, dallanan zindan haritasında yolunu çiz, desteni büyüt; Zindan'ın sonunda Gölge Efendisi'ni, altındaki Kemik Mahzenleri'nde Kemik Ejderi'ni yen.

Vite + React + TypeScript + Zustand + Tailwind CSS + Framer Motion. Sunucu yok, kurulum yok — tamamen istemci tarafı.

## Kurulum

Gereksinim: Node.js **18+**

```bash
npm install
npm run dev
```

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Tip kontrolü + üretim derlemesi |
| `npm run preview` | Derlemeyi önizle |
| `npm run test` | Vitest testleri (motor + koşu) |
| `npm run lint` | ESLint |
| `npm run simulate [n] [karakter]` | Denge simülasyonu — bot `n` koşu oynar, kazanma oranı ve karşılaşma başına kayıp canı raporlar |
| `npm run playtest [url] [klasör] [g] [y]` | Sistem Chrome'u ile ilk savaşı oynatıp ekran görüntüsü alır |
| `npm run fullrun [url] [klasör] [karakter]` | İki perdelik tam koşuyu arayüz üzerinden oynar (akış testi) |
| `npm run screens [url] [klasör]` | Her koşu ekranına atlayıp görüntü alır (geliştirme sunucusunda) |
| `npm run optimize-images` | Görselleri WebP'ye çevirir: `art-src/painted/` (boyalı, öncelikli) → yoksa `art-src/*.svg` (vektör yedek) |

> `simulate` için Yükseliş seviyeleri `ASC=0,5,10 npm run simulate 300` şeklinde seçilir. `playtest`/`fullrun`/`screens` sistemde kurulu Google Chrome kullanır.

> Proje yolunda `#`, `%`, `?` gibi karakterler Vite'ın modül çözümlemesini bozabilir; boşluksuz bir klasör adı önerilir.

## Oynanış

- **İki karakter:** *Demirci* (Güç & Savunma — blok biriktir, Güç ile ölçeklen) ve *Gölge* (Hız & Zehir — ucuz kartlar, zehri yığ ve katla). Her birinin başlangıç destesi, yadigârı ve ödül havuzu ayrı.
- **İki perde:** *Zindan* (boss: Gölge Efendisi) ve *Kemik Mahzenleri* (boss: Kemik Ejderi); her biri 13 katlık dallanan harita — savaş, elit, olay, kamp ateşi, tüccar, hazine. Perde bossundan sonra bedelli ama güçlü bir **boss yadigârı** seçilir.
- **Savaş:** Düşman niyetleri gerçek hasarı gösterir; birden çok düşmanlı karşılaşmalar, hedef seçimi, adım adım oynanan düşman turu.
- **Kartlar:** 54 kart + yükseltilmiş sürümleri; 22 düşman türü (çoğu Türk folklorundan: Şahmeran, Tepegöz, Karakoncolos, Gulyabani, Albastı…), 11 olay.
- **Kart tasarımları:** nadirliğe göre çerçeve — demir (başlangıç), bronz + perçin (yaygın), gümüş kıvrımlar + mavi taş (nadir), içe kıvrılan altın dikenler + holografik folyo (efsanevi); güç kartlarında rün çerçevesi, yükseltilmişlerde yeşil parıltı. Kartlar imleci izleyerek 3D eğilir ve parlar. Lobide **Kart Koleksiyonu**. Açıklamalar etkilerden otomatik üretilir ve savaşta Güç/Zayıf/Savunmasız/Çeviklik'e göre canlı güncellenir.
- **Durumlar:** Güç, Çeviklik, Zırh Kaplama, Diken, Zehirli Duman, Savunmasız, Zayıf, Zehir. **Anahtar kelimeler:** Tüket, Geçici, İçgüdü; Güç kartları kalıcı etki bırakır.
- **Yadigârlar (22, 6'sı boss) ve iksirler (10):** Savaş başı/tur/kart oynama tetikleyicileri; 3 yuvalı iksir çantası.
- **Tüccar:** Kart (biri indirimli), yadigâr, iksir, kart çıkarma (ziyaret başına bir, fiyat artar).
- **Yükseliş 0–10:** her galibiyet bir sonraki seviyeyi açar; kurallar birikir (daha çok elit, güçlü düşmanlar, az iyileşme, az altın, 2 iksir yuvası…). **Günün Koşusu:** tarihten türeyen tohum — herkes aynı haritayı oynar.
- **Kayıt:** Koşu ve süren savaş otomatik kaydedilir; menüden "Devam Et".
- **His:** Sentezlenmiş ses efektleri ve ambiyans müziği, titreşim, ekran sarsıntısı, vuruş izleri, uçan sayılar. Ayarlar: ses, müzik, ses düzeyi, titreşim, hızlı mod. İşletim sisteminin "hareketi azalt" ayarına uyar.

**Kısayollar:** `1`–`9` kart · `E` turu bitir · `Esc` iptal · hedef seçerken `1`–`3` düşman · `D`/`A` çekme/atma destesi.
Kartlar düşmanın üzerine **sürüklenerek** de oynanabilir. Dokunmatik cihazlarda ilk dokunuş kartı kaldırır, ikinci dokunuş oynar.

## Mimari

```
src/
  data/            Kartlar (karakter başına, temel + yükseltme birlikte), düşmanlar,
                   karşılaşmalar, olaylar, iksirler, karakterler
  game/engine/     Saf, deterministik savaş motoru (deste, etkiler, niyetler, tur adımları)
  game/            Koşu motoru, harita üretimi, yadigârlar, kart metni üretici, durum tablosu
  game/store/      Zustand store'ları (savaş, koşu, ayarlar) + localStorage kalıcılığı
  components/      Ekranlar, savaş arayüzü, ortak UI (modal, deste görüntüleyici, iksir çubuğu)
  lib/             RNG, ses sentezi
scripts/           Denge simülasyonu, görsel/uçtan uca oyun testleri, görsel optimizasyonu
art-src/           Vektör çizim kaynakları (SVG) — optimize-images ile WebP'ye çevrilir
```

- Oyun mantığı UI'dan bağımsız saf fonksiyonlardır; store'lar yalnızca bunları çağırır, arayüz animasyonları durum farklarından türetilir.
- **Yeni kart:** `src/data/cards/<karakter>.ts` içine bir satır (`effects` + `upgrade`), karakterin `cardPoolIds` listesine ID. Açıklama otomatik.
- **Yeni düşman/perde:** `src/data/enemies` tanımı + `src/data/encounters.ts` içindeki perde havuzları; görsel için `art-src/enemies/<ad>.svg` (veya `public/game-art`) ve `art` anahtarı.
- **Yeni yadigâr:** `ALL_RELICS`'e tanım + ilgili hook'a (`onCombatStart`, `onTurnStart`, `onTurnEnd`, `onCardPlayed`, `onCombatEnd`, `onPickup`) bir `case`.
- **Denge:** değer değiştirdikten sonra `npm run simulate` ile etkisini ölç.
- **RNG:** Park–Miller LCG; aynı tohum aynı haritayı, karşılaşmaları ve karıştırma sırasını üretir.

Yol haritası: [`docs/GAME_PLAN.md`](docs/GAME_PLAN.md) · Boyalı görsel üretim promptları: [`docs/ART_PROMPTS.md`](docs/ART_PROMPTS.md)
