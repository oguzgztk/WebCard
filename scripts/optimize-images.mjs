/**
 * public/game-art altındaki PNG'leri boyutlandırılmış WebP'ye çevirir.
 * Kullanım: node scripts/optimize-images.mjs [--keep]   (--keep: PNG'leri silme)
 */
import { readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '../public/game-art')
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
const mb = (n) => (n / 1024 / 1024).toFixed(1)
console.log(`PNG ${mb(before)} MB → WebP ${mb(after)} MB`)
