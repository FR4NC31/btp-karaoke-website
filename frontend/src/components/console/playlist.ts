/**
 * Fisher–Yates copy of the row ids, seeded by the transport's shuffle seed:
 * the console derives its shuffled queue from (ids, seed) while rendering, so
 * the order is random yet pure — the same seed always yields the same
 * permutation, and a fresh seed (every time shuffle switches on) reshuffles.
 */
export function seededShuffle(ids: string[], seed: number): string[] {
  // mulberry32 — a tiny seeded PRNG.
  let state = Math.floor(seed * 0x1_0000_0000) >>> 0 || 1
  const random = () => {
    state = (state + 0x6d2b_79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 0x1_0000_0000
  }
  const next = [...ids]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const swap = next[i]
    next[i] = next[j]
    next[j] = swap
  }
  return next
}
