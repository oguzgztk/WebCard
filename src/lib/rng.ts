/**
 * Park–Miller Lehmer küçük LGC — deterministic çekişler ve küçük tohum alanı için yeterli.
 */

const MODULUS = 2147483647

export function sanitizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) return 1337
  const n = seed | 0
  return Math.abs(n) % MODULUS || 48271 // 0’a düşmez
}

/** [birim arağaşım (0 ile 1 arası çıkılı), yeni tohum]. */
export function rngStep(seed: number): { value: number; nextSeed: number } {
  const s = sanitizeSeed(seed)
  const raw = Number((BigInt(s) * 16807n) % BigInt(MODULUS))
  const normalized = raw / MODULUS
  return {
    value: normalized,
    nextSeed: raw,
  }
}

export function rngFloat01(seed: number): { float: number; nextSeed: number } {
  const { value, nextSeed } = rngStep(seed)
  return {
    /** [0.000…, 1) */
    float: value,
    nextSeed,
  }
}
