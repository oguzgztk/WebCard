/**
 * public/game-art altındaki PNG'leri ve art-src/ altındaki SVG çizimleri boyutlandırılmış WebP'ye çevirir.
 * Kullanım: node scripts/optimize-images.mjs [--keep]   (--keep: PNG'leri silme; SVG kaynaklar hep korunur)
 */
import { readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '../public/game-art')
const SVG_ROOT = path.resolve(import.meta.dirname, '../art-src')
/** Klasör → en büyük genişlik (px). Kartlar ~200px gösterilir; 2x DPR için 640 yeterli. */
const MAX_WIDTH = { cards: 640, enemies: 1024, characters: 900 }
const keep = process.argv.includes('--keep')

let before = 0
let after = 0
for (const dir of Object.keys(MAX_WIDTH)) {
  const abs = path.join(ROOT, dir)
  for (const file of await readdir(abs)) {
    if (!file.endsWith('.png')) continue
    const src = path.join(abs, file)
    const dst = src.replace(/\.png$/, '.webp')
    await sharp(src)
      .resize({ width: MAX_WIDTH[dir], withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(dst)
    before += (await stat(src)).size
    after += (await stat(dst)).size
    if (!keep) await unlink(src)
  }
}
// SVG kaynak çizimler (yarasa, iskelet, 2. perde düşmanları, yeni kartlar)
let svgCount = 0
for (const dir of Object.keys(MAX_WIDTH)) {
  const abs = path.join(SVG_ROOT, dir)
  let files = []
  try {
    files = await readdir(abs)
  } catch {
    continue
  }
  for (const file of files) {
    if (!file.endsWith('.svg')) continue
    const dst = path.join(ROOT, dir, file.replace(/\.svg$/, '.webp'))
    await sharp(path.join(abs, file), { density: 192 })
      .resize({ width: MAX_WIDTH[dir], withoutEnlargement: false })
      .webp({ quality: 84, effort: 6 })
      .toFile(dst)
    after += (await stat(dst)).size
    svgCount++
  }
}
console.log(`${svgCount} SVG çizim WebP'ye çevrildi`)

const mb = (n) => (n / 1024 / 1024).toFixed(1)
console.log(`PNG ${mb(before)} MB → WebP ${mb(after)} MB`)
