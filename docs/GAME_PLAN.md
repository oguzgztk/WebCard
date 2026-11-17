# Web Card — Oyun Geliştirme Planı

Bu dosya Web Card için uzun vadeli geliştirme yol haritasını özetler. Hedef: tek savaş döngüsünden **kısa bir koşu (run)** yapısına evrilerek Slay the Spire tarzı bir deckbuilder çekirdeği oluşturmak; görsel kimlik (tunç / kâğıt / sıcak palet) korunur.

---

## Vizyon

**Başlangıç:** Lobi → tek savaş → sonuç → menü.

**Hedef (ulaşıldı):** Lobi → **koşu** (harita / düğümler) → ardışık savaşlar → ödüller (kart, altın, relic) → boss → zafer/yenilgi → (opsiyonel) meta ilerleme.

---

## Durum (Kasım 2026)

Orijinal planın 8 fazı ve ilk öneri turunun tamamı yapıldı. Ayrıntı için README.

| Alan | Durum |
|------|--------|
| Koşu yapısı; iki perde, perde başına dallanan 13 kat | ✅ |
| Kart ödülü, altın, tüccar (kart/yadigâr/iksir/kart çıkarma) | ✅ |
| Kamp ateşi (dinlen / yükselt) | ✅ |
| Yükseltmeler, yeni statüler, anahtar kelimeler, güç kartları | ✅ |
| İki karakter, başlangıç yadigârları | ✅ |
| 22 yadigâr (6 boss yadigârı), 10 iksir | ✅ |
| 11 olay, çoklu etkili seçimler | ✅ |
| Kayıt, meta istatistikler, Yükseliş 0–10, Günün Koşusu | ✅ |
| Ses (sentez), müzik, titreşim, animasyonlar, sürükle-bırak, klavye, mobil, rehber | ✅ |
| Tüm kartlar ve düşmanlar görselli (boyalı + vektör) | ✅ |
| Denge simülatörü, uçtan uca tarayıcı testi | ✅ |

## Sıradaki Fikirler

1. **Üçüncü perde** ve gizli final boss (Yükseliş'te açılır).
2. **Üçüncü karakter** (ör. büyü/enerji odaklı) — kart havuzu + başlangıç yadigârı.
3. **Lanetler / durum kartları** (olaylardan ve bazı düşmanlardan gelen, desteyi kirleten kartlar).
4. **Açılabilir içerik:** galibiyetlerle yeni kart/yadigâr havuzuna ekleme.
5. **Vektör çizimlerin boyalı görsellerle değiştirilmesi** (aynı dosya adlarıyla `public/game-art`'a koymak yeterli).
6. **Kart oynarken hedef oku** ve düşman ölüm/patlama efektleri.
7. **PWA:** çevrimdışı oynanabilir kurulum.

---

## Tarihçe: Orijinal Plan

## Faz 1 — Koşu (Run) Yapısı

Temel yapı taşı; diğer özellikler buna bağlanır.

### 1.1 — `RunState` ve store

- `GameState` tek savaşı temsil etmeye devam eder.
- Üst katmanda **`RunState`**:
  - Güncel deste (savaşlar arası taşınır)
  - Can (run boyunca süreklilik)
  - (İleride) max enerji, altın, relic listesi
  - Konum: kaçıncı düğüm / hangi düğüm ID

### 1.2 — Harita / yol sistemi

Basit başlangıç: **doğrusal 8–10 düğüm** (dallanma sonra eklenebilir).

Örnek düğüm tipleri:

- `combat` — normal savaş
- `elite` — güçlü düşman, iyi ödül
- `rest` — mola (iyileşme / yükseltme)
- `event` — metin seçimi
- `boss` — koşu sonu

Akış: **Lobi → “Yeni koşu” → harita → savaş → harita** (galibiyet sonrası).

### 1.3 — Mola düğümü (`RestSite`)

İki seçenek (ilk sürümde yalnızca biri de yeter):

- Canın belirli bir yüzdesini iyileştir **veya**
- (Faz 3 sonrası) bir kartı yükselt

---

## Faz 2 — Ödül Sistemi

### 2.1 — Savaş sonu kart ödülü

- Galibiyette **3 kart** sun; birini seç veya atla.
- Seçilen kart desteye eklenir.
- Kart havuzu: rarity ağırlığı (ör. `common 60% / uncommon 35% / rare 5%`); ileride sınıf bazlı havuzlar.

### 2.2 — Altın

- Düşman/düğüm başına tutarlı altın; boss daha fazla.
- Mağaza ve event’lerle bağlanır.

### 2.3 — Mağaza düğümü

- Altınla kart satın alma.
- (Opsiyonel) **desteden bir kart çıkarma** — run başına sınırlı hak.

---

## Faz 3 — Kart Derinliği

### 3.1 — Kart yükseltme (`+`)

- Her kart için **upgrade** varyantı (ör. daha fazla hasar/blok/draw).
- Mola düğümünde uygulanır.
- UI: isimde `+` rozeti veya ayrı görsel ipucu.

### 3.2 — Yeni statüler

`StatusKey` ve `effectResolver` genişletilebilir; örnekler:

| Statü | Kısa fikir |
|-------|------------|
| `strength` | Verilen hasara bonus |
| `dexterity` | Kazanılan bloka bonus |
| `poison` | Tur başı hasar, sonra yığın azalır |

### 3.3 — Anahtar kelimeler

Kart tanımına opsiyonel alanlar:

- **Ethereal** — tur sonu elde kaldıysa yok olur
- **Exhaust** — oynanınca deste dışına çıkar
- **Innate** — savaş başı elde başlar

---

## Faz 4 — Karakter Sınıfları

- İlk sınıf: mevcut başlangıç destesi (**ör. “Demirci”**).
- İkinci sınıf: farklı başlangıç destesi + farklı ödül havuzu.
- Lobi: **Yeni koşu → karakter seçimi**.

---

## Faz 5 — Relic (Yadigâr)

Pasif güçler; minimal başlangıç örnekleri:

- Savaş başı +blok
- Belirli kart ailelerine hasar bonusu
- Periyodik +1 enerji

Uygulama: `RunState.relics` + motor üzerinde **hook** noktaları (`onTurnStart`, `onCardPlayed`, vb.).

---

## Faz 6 — Olay (Event) Düğümleri

Metin + seçim:

- Küçük risörlü ödül / altın / curse kartı
- Başlangıç için 5–10 event metni yeterli

---

## Faz 7 — Kalıcı Meta (Uzun Vadeli)

- **Ascension** — zorluk katmanları (HP çarpanı, hasar vb.)
- **Açılabilir içerik** — kartlar / relicler
- **Kayıt**: localStorage ile koşu devamı

---

## Faz 8 — UX ve Cila

Paralel yürütülebilir:

- Ses ve müzik
- Kart oynama / hasar mikro animasyonları
- Klavye kısayolları (ör. `1–5` el, `E` tur bitir)
- Mobil düzen kontrolleri
- Kısa öğretici (ilk koşu ipuçları)

---

## Önerilen Uygulama Sırası

| Sıra | İçerik | Kabaca boyut |
|------|--------|----------------|
| 1 | Faz 1.1 + 1.2 (`RunState`, doğrusal harita, koşu döngüsü) | Büyük |
| 2 | Faz 2.1 (kart ödülü ekranı) | Orta |
| 3 | Faz 2.2 (altın) | Küçük |
| 4 | Faz 1.3 (mola — önce sadece iyileşme) | Küçük |
| 5 | Faz 3.1 (yükseltme + molaya bağlama) | Orta |
| 6 | Faz 3.2 (strength / poison vb.) | Orta |
| 7 | Faz 2.3 (mağaza) | Orta |
| 8 | Faz 5 (temel relic seti) | Büyük |
| 9 | Faz 3.3 (Exhaust / Ethereal) | Orta |
| 10 | Faz 4 (ikinci karakter) | Büyük |
| 11 | Faz 6 (event’ler) | Orta |
| 12 | Faz 7 (ascension / kalıcı kayıt) | Büyük |

**Önerilen ilk adım:** Faz **1.1 + 1.2** — koşu durumu ve harita ↔ savaş döngüsü kurulunca ödül, mola ve relic doğrudan “düğüm tipi” veya run aksiyonu olarak eklenir.

---

## Dosya Konumu

Bu plan: `docs/GAME_PLAN.md`
