import { keysOf, type Key } from './layout'

export type WordEntry = readonly [word: string, count: number]

export const LESSON_WORDS = 12
const FOCUS_SHARE = 0.5

/** The words made only of unlocked Keys, most frequent first. */
export function wordPool(words: readonly WordEntry[], unlocked: Iterable<Key>): WordEntry[] {
  const allowed = new Set(unlocked)
  return words.filter(([w]) => keysOf(w).every((k) => allowed.has(k)))
}

/** Picks a word with weight √count: common words dominate, rare ones (names, slang) stay rare. */
function pickWeighted(from: readonly WordEntry[], rng: () => number): string {
  const weights = from.map(([, c]) => Math.sqrt(c))
  let r = rng() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < from.length; i++) {
    r -= weights[i]
    if (r < 0) return from[i][0]
  }
  return from[from.length - 1][0]
}

/** About half of the words contain the Focus key; no word repeats back to back. */
export function generateLesson(pool: readonly WordEntry[], focus: Key, rng: () => number = Math.random): string {
  const withFocus = pool.filter(([w]) => keysOf(w).includes(focus))
  const words: string[] = []
  while (words.length < LESSON_WORDS) {
    const from = withFocus.length > 0 && rng() < FOCUS_SHARE ? withFocus : pool
    const w = pickWeighted(from, rng)
    if (pool.length > 1 && w === words.at(-1)) continue
    words.push(w)
  }
  return words.join(' ')
}
