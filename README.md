# Web Card — Roguelike Deck-Builder

Tarayıcıda oynanan, karanlık-tunç temalı bir **roguelike deste kurma** oyunu.
Karakterini seç, dallanan zindan haritasında yolunu çiz, desteni büyüt ve 13. kattaki Gölge Efendisi'ni yen.

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
| `npm run playtest [url] [klasör] [g] [y]` | Sistem Chrome'u ile oyunu baştan oynatıp ekran görüntüsü alır |
| `npm run optimize-images` | `public/game-art` PNG'lerini boyutlandırılmış WebP'ye çevirir |

> Proje yolunda `#`, `%`, `?` gibi karakterler Vite'ın modül çözümlemesini bozabilir; boşluksuz bir klasör adı önerilir.

## Oynanış

- **İki karakter:** *Demirci* (Güç & Savunma — blok biriktir, Güç ile ölçeklen) ve *Gölge* (Hız & Zehir — ucuz kartlar, zehri yığ ve katla). Her birinin başlangıç destesi, yadigârı ve ödül havuzu ayrı.
- **Dallanan harita:** 13 kat; savaş, elit, olay, kamp ateşi, tüccar, hazine ve boss. Orta katta hazine, boss öncesi kamp ateşi.
- **Savaş:** Düşman niyetleri gerçek hasarı gösterir; birden çok düşmanlı karşılaşmalar, hedef seçimi, adım adım oynanan düşman turu.
- **Kartlar:** 42 kart + yükseltilmiş sürümleri; 8 düşman türü, 11 olay. Açıklamalar etkilerden otomatik üretilir ve savaşta Güç/Zayıf/Savunmasız/Çeviklik'e göre canlı güncellenir.
- **Durumlar:** Güç, Çeviklik, Zırh Kaplama, Diken, Zehirli Duman, Savunmasız, Zayıf, Zehir. **Anahtar kelimeler:** Tüket, Geçici, İçgüdü; Güç kartları kalıcı etki bırakır.
- **Yadigârlar (17) ve iksirler (10):** Savaş başı/tur/kart oynama tetikleyicileri; 3 yuvalı iksir çantası.
- **Tüccar:** Kart (biri indirimli), yadigâr, iksir, kart çıkarma (ziyaret başına bir, fiyat artar).
- **Zorluk:** Normal ve Zor (+%12 düşman canı, +1 Güç). **Günün Koşusu:** tarihten türeyen tohum — herkes aynı haritayı oynar.
- **Kayıt:** Koşu ve süren savaş otomatik kaydedilir; menüden "Devam Et".
- **His:** Sentezlenmiş ses efektleri ve ambiyans müziği, titreşim, ekran sarsıntısı, vuruş izleri, uçan sayılar. Ayarlar: ses, müzik, ses düzeyi, titreşim, hızlı mod. İşletim sisteminin "hareketi azalt" ayarına uyar.

**Kısayollar:** `1`–`9` kart · `E` turu bitir · `Esc` iptal · hedef seçerken `1`–`3` düşman · `D`/`A` çekme/atma destesi.
Dokunmatik cihazlarda ilk dokunuş kartı kaldırır, ikinci dokunuş oynar.

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
scripts/           Denge simülasyonu, görsel oyun testi, görsel optimizasyonu
```

- Oyun mantığı UI'dan bağımsız saf fonksiyonlardır; store'lar yalnızca bunları çağırır, arayüz animasyonları durum farklarından türetilir.
- **Yeni kart:** `src/data/cards/<karakter>.ts` içine bir satır (`effects` + `upgrade`), karakterin `cardPoolIds` listesine ID. Açıklama otomatik.
- **Yeni yadigâr:** `ALL_RELICS`'e tanım + ilgili hook'a (`onCombatStart`, `onTurnStart`, `onTurnEnd`, `onCardPlayed`, `onCombatEnd`, `onPickup`) bir `case`.
- **Denge:** değer değiştirdikten sonra `npm run simulate` ile etkisini ölç.
- **RNG:** Park–Miller LCG; aynı tohum aynı haritayı, karşılaşmaları ve karıştırma sırasını üretir.

Yol haritası: [`docs/GAME_PLAN.md`](docs/GAME_PLAN.md)
