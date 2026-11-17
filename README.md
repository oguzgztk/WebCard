# Web Card — Roguelike Deck-Builder

Tarayıcıda oynanan, minimalist bir **roguelike deste kurma / kart savaş** oyunu.
Vite + React + TypeScript + Zustand + Tailwind CSS + Framer Motion.

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
| `npm run test` | Vitest testleri |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

> Proje yolunda `#`, `%`, `?` gibi karakterler Vite'ın modül çözümlemesini bozabilir; boşluksuz bir klasör adı önerilir.

## Oynanış

- **Koşu (run):** 11 düğümlük harita — savaş, elit, olay, mola, mağaza ve boss.
- **İki karakter:** *Demirci* (güç & savunma) ve *Gölge* (hız & zehir); her birinin başlangıç destesi ve ödül havuzu ayrı.
- **Ödüller:** Savaş sonrası 3 karttan biri + altın; elit ve boss sonrası relic seçimi.
- **Mola:** İyileş veya bir kartı yükselt (`+`).
- **Mağaza:** Kart satın al, desteden kart çıkar.
- **Statüler:** Vulnerable, Weak, Strength, Poison.
- **Anahtar kelimeler:** Exhaust, Ethereal, Innate.
- **Kayıt:** Koşu ve süren savaş tarayıcıda (localStorage) otomatik kaydedilir; menüden "Devam et" ile sürer.
- **Hızlı savaş:** Lobiden koşu dışı tek savaş.

**Kısayollar:** `1`–`9` kart oyna · `E` turu bitir · `Esc` hedef seçimini iptal et

## Mimari

```
src/
  game/engine/   Saf, deterministik savaş motoru (deste, etkiler, niyetler)
  game/          Koşu motoru, relic'ler, kart yükseltmeleri, tipler
  game/store/    Zustand store'ları (savaş, koşu, kayıt)
  data/          Kart, düşman, karakter ve olay tanımları
  components/    Ekranlar ve savaş arayüzü
```

- Oyun mantığı UI'dan bağımsız saf fonksiyonlardır; store'lar yalnızca bunları çağırır.
- Yeni kart = `src/data/cards/` altına veri tanımı (etkiler bildirimsel); nadirlik `rarity.ts`, yükseltme `game/cardUpgrades.ts`.
- RNG: Park–Miller LCG ile seed tabanlı; aynı seed aynı haritayı ve karıştırma sırasını üretir.

Yol haritası için: [`docs/GAME_PLAN.md`](docs/GAME_PLAN.md)
