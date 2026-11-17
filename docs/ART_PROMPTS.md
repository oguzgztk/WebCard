# Görsel Üretim Rehberi (Boyalı Sanat)

Oyundaki ilk görseller (Tarikatçı, Çene Kurdu, Asalak, Mantar Canavarı, Gölge Efendisi ve ilk 34 kart) **boyalı karanlık fantastik** tarzda.
Sonradan eklenen 17 düşman ve 20 kart şimdilik **vektör yedek çizimle** gösteriliyor. Bu dosyadaki promptlarla
bir görsel üretme aracında (Midjourney, ChatGPT/DALL·E, Leonardo, Gemini, Stable Diffusion…) boyalı sürümlerini üretip oyuna ekleyebilirsin.

## Nasıl eklenir

1. Promptu araca yapıştır, en beğendiğin sonucu indir.
2. Dosyayı **tablodaki adla** kaydet ve şu klasöre koy:
   - düşmanlar → `art-src/painted/enemies/<ad>.png`
   - kartlar → `art-src/painted/cards/<ad>.png`
   (`.jpg` / `.webp` da olur.)
3. Çalıştır: `npm run optimize-images`
   Boyalı görsel otomatik olarak vektörün yerine geçer (boyutlandırılır, WebP'ye çevrilir). Vektör kaynak yedek olarak kalır.

Önerilen boyut: **3:2 yatay** (ör. 1536×1024). Düşman portreleri ortalanmış tek figür, kenarlar karanlığa doğru sönmeli
(oyun kenarları zaten maskeyle eritir). Kart görsellerinde konu ortada, kenarlarda boşluk olsun (kart çerçevesi köşeleri biraz örter).

## Ortak stil (her promptun sonuna ekle)

```
dark fantasy oil painting, painterly brushstrokes, dramatic chiaroscuro lighting, warm ember and bronze palette,
deep black background fading into darkness, heavy vignette, highly detailed, moody, slay-the-spire-like card illustration,
centered composition, no text, no border, no frame, 3:2 aspect ratio
```

Midjourney için sona `--ar 3:2 --style raw` ekleyebilirsin.

---

## Düşmanlar → `art-src/painted/enemies/`

| Dosya | Düşman | Prompt |
|---|---|---|
| `bat.png` | Mağara Yarasası | A monstrous cave bat with tattered leathery wings spread wide, glowing red eyes, bared fangs, hanging in a dark cavern lit by a faint amber glow |
| `skeleton.png` | İskelet Muhafız | An undead skeleton guard in a cracked iron half-helmet, holding a battered wooden kite shield and a notched longsword, faint green light in its eye sockets, dungeon crypt background |
| `stone_golem.png` | Taş Golem | A massive blocky stone golem with glowing orange rune cracks running across its body, huge rock fists, molten light leaking from its eyes, ancient dungeon hall |
| `spider.png` | Mahzen Örümceği | A giant crypt spider with a bulbous purple-black abdomen, eight long spindly legs, clusters of glowing green eyes, venom dripping from its fangs, thick cobwebs behind |
| `wraith.png` | Hayalet | A hooded spectral wraith with a tattered translucent robe fading into mist, two piercing pale-cyan eyes in a black void hood, skeletal clawed hands reaching forward, cold blue light |
| `gargoyle.png` | Taş Gargoyle | A crouching stone gargoyle on a crumbling pedestal, bat-like stone wings, curved horns, fanged grin, faint violet glowing eyes, gothic crypt at night |
| `fallen_knight.png` | Düşmüş Şövalye | A fallen knight in dark battered plate armor with a torn crimson cape, a red glow behind the visor slit, both hands resting on a cracked greatsword planted in the ground |
| `witch.png` | Mahzen Cadısı | A hooded crypt witch with glowing green eyes stirring a bubbling cauldron of toxic green brew, gnarled wooden staff with a glowing orb, green fumes rising |
| `bone_dragon.png` | Kemik Ejderi (boss) | A colossal skeletal bone dragon with a horned skull, glowing violet eyes, ragged purple wing membranes stretched between bone fingers, exposed ribcage, looming over a crypt |
| `mushroom.png` | Sporlu Mantar | A sinister living toadstool creature with a red spotted cap and pale stalk body, small glowing yellow eyes and an eerie smile, clouds of glowing spores drifting around it |
| `bandit.png` | Yol Haydudu | A hooded dungeon bandit with a red cloth mask over the face, glinting eyes, a dagger in each hand, leather belt with a brass buckle, torchlit stone corridor |
| `karakoncolos.png` | Karakoncolos (elit) | Karakoncolos from Turkish folklore: a tall shaggy black-furred winter demon with small curved horns, long arms with icy claws, glowing pale-blue eyes, jagged teeth, falling snow at night |
| `sahmeran.png` | Şahmeran (boss) | Şahmeran from Anatolian folklore: a serene queen with a golden crown, human upper body and a long coiling green serpent tail, snakes in her hair, glowing green eyes, mystical underground cave |
| `gulyabani.png` | Gulyabani | Gulyabani from Turkish folklore: a gaunt hunched graveyard ghoul with grey leathery skin, long arms dragging clawed hands on the ground, rows of jagged teeth, glowing red eyes, misty cemetery |
| `albasti.png` | Albastı | Albastı from Turkish folklore: a pale ghostly woman with very long flowing blond hair, hollow black eyes with faint violet light, long thin fingers reaching out, nightmare atmosphere, dark bedroom shadows |
| `necromancer.png` | Ölü Çağıran | A hooded necromancer in dark purple robes decorated with bones, glowing green eyes, holding a staff topped with a skull emitting green soul light, ghostly wisps around |
| `tepegoz.png` | Tepegöz (elit) | Tepegöz from the Book of Dede Korkut: a hulking one-eyed cyclops giant with a single huge glowing amber eye, brutish face, leather belt, wielding a massive wooden club, rocky cave |

## Kartlar → `art-src/painted/cards/`

| Dosya | Kart | Prompt |
|---|---|---|
| `spiked_armor.png` | Dikenli Zırh | A bronze breastplate covered in sharp outward spikes, glowing faintly on a dark armor stand |
| `earthquake.png` | Deprem | The ground splitting apart with glowing lava fissures, boulders flying into the air, dust and debris |
| `forge_spirit.png` | Örs Ruhu | A blacksmith's anvil with a hammer, a living spirit of fire rising from the forge |
| `deadly_poison.png` | Ölümcül Zehir | A round glass vial of glowing green poison with a skull and crossbones label, toxic vapor |
| `blade_fan.png` | Bıçak Yelpazesi | Five throwing knives fanned out in an arc, motion blur, cold steel glint |
| `catalyst.png` | Katalizör | An alchemical flask violently reacting with green and purple liquids, bubbles and swirling smoke |
| `footwork.png` | Ayak Oyunu | A leather boot mid-step leaving swirling blue motion trails, agile shadow movement |
| `noxious_fumes.png` | Zehirli Duman | A rolling cloud of toxic green fumes with a faint skull shape inside, glowing particles |
| `cleave.png` | Biçme | A huge double-bladed battle axe sweeping in a wide arc, a glowing orange trail of the swing |
| `reckless_charge.png` | Pervasız Hücum | A raging horned warrior charging forward head first, dust and speed lines, berserk fury |
| `shield_wall.png` | Kalkan Duvarı | Three overlapping bronze kite shields forming a wall, warm golden light behind |
| `uppercut.png` | Sarsıcı Darbe | A gauntleted fist delivering a powerful uppercut, shockwave and sparks bursting upward |
| `bloodletting.png` | Kan Bedeli | A ritual dagger and a falling drop of blood, crackling energy around it, blood magic |
| `iron_will.png` | Demir İrade | An impregnable stone fortress gate with iron bars and a red banner on top, unbreakable |
| `quick_slash.png` | Çabuk Kesik | A thin blade cutting through the air leaving a sharp white-blue slash trail |
| `escape_plan.png` | Kaçış Planı | An old parchment map with a dotted escape route ending at a red X, by candlelight |
| `bouncing_flask.png` | Seken Şişe | A poison flask bouncing between targets, arcs of green splashes, glowing droplets |
| `caltrops.png` | Demir Dikenler | Iron caltrops scattered on a stone floor, sharp points glinting |
| `adrenaline.png` | Adrenalin | A glowing syringe of orange serum over a racing heartbeat line, intense energy |
| `poisoned_blades.png` | Zehirli Bıçaklar | Two crossed daggers dripping glowing green venom, toxic aura |

## İpuçları

- Tutarlılık için önce bir düşmanı üret; beğendiğin sonucu **stil referansı** olarak sonraki promptlara ekle
  (Midjourney: `--sref <görsel bağlantısı>`; ChatGPT: "aynı tarzda" deyip görseli ekle).
- Mevcut boyalı görsellerden birini (ör. `public/game-art/enemies/cultist.webp`) referans olarak yüklemek tarzı en iyi tutturur.
- Folklor figürlerinde (Şahmeran, Tepegöz, Karakoncolos, Gulyabani, Albastı) aracın Türk/Anadolu motiflerini anlaması için
  "from Turkish folklore" ifadesini korumak önemli.
