/**
 * Oyun görsellerini boyutlandırılmış WebP'ye çevirir (public/game-art/<klasör>/<ad>.webp).
 *
 * Kaynak önceliği (aynı ad için):
 *   1. art-src/painted/<klasör>/<ad>.(png|jpg|jpeg|webp)  — boyalı/AI görseller, kalıcı kaynak
 *   2. art-src/<klasör>/<ad>.svg                          — vektör yedek çizimler
 * Ayrıca public/game-art altına doğrudan bırakılan PNG'ler de çevrilir (sonra silinir).
 *
 * Kullanım: node scripts/optimize-images.mjs [--keep]   (--keep: public altındaki PNG'leri silme)
 */
import { readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '../public/game-art')
const ART_SRC = path.resolve(import.meta.dirname, '../art-src')
const PAINTED = path.join(ART_SRC, 'painted')
/** Klasör → en büyük genişlik (px). Kartlar ~200px gösterilir; 2x DPR için 640 yeterli. */
const MAX_WIDTH = { cards: 640, enemies: 1024, characters: 900 }
const RASTER = /\.(png|jpe?g|webp)$/i
const keep = process.argv.includes('--keep')

async function list(dir) {
  try {
    return await readdir(dir)
  } catch {
    return []
  }
}

const toWebp = (input, dir, dst, opts = {}) =>
  sharp(input, opts)
    .resize({ width: MAX_WIDTH[dir], withoutEnlargement: !opts.density })
    .webp({ quality: 84, effort: 6 })
    .toFile(dst)

let png = 0
let painted = 0
let vector = 0
const done = new Set()

for (const dir of Object.keys(MAX_WIDTH)) {
  // 1) Boyalı kaynaklar (kalıcı)
  for (const file of await list(path.join(PAINTED, dir))) {
    if (!RASTER.test(file)) continue
    const name = file.replace(RASTER, '')
    await toWebp(path.join(PAINTED, dir, file), dir, path.join(ROOT, dir, `${name}.webp`))
    done.add(`${dir}/${name}`)
    painted++
  }

  // 2) public altına doğrudan bırakılmış PNG'ler (eski akış)
  for (const file of await list(path.join(ROOT, dir))) {
    if (!file.endsWith('.png')) continue
    const name = file.replace(/\.png$/, '')
    const src = path.join(ROOT, dir, file)
    await toWebp(src, dir, path.join(ROOT, dir, `${name}.webp`))
    if (!keep) await unlink(src)
    done.add(`${dir}/${name}`)
    png++
  }

  // 3) Vektör yedekler — yalnızca boyalı sürümü olmayanlar
  for (const file of await list(path.join(ART_SRC, dir))) {
    if (!file.endsWith('.svg')) continue
    const name = file.replace(/\.svg$/, '')
    if (done.has(`${dir}/${name}`)) continue
    await toWebp(path.join(ART_SRC, dir, file), dir, path.join(ROOT, dir, `${name}.webp`), { density: 192 })
    vector++
  }
}

const total = (await Promise.all(Object.keys(MAX_WIDTH).map(async (d) => {
  let sum = 0
  for (const f of await list(path.join(ROOT, d))) if (f.endsWith('.webp')) sum += (await stat(path.join(ROOT, d, f))).size
  return sum
}))).reduce((a, b) => a + b, 0)

console.log(`Boyalı: ${painted} · PNG: ${png} · Vektör: ${vector} → toplam WebP ${(total / 1024 / 1024).toFixed(1)} MB`)
