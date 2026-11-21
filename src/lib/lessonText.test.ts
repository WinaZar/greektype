import { describe, expect, it } from 'vitest'
import { TONOS, keysOf, type Key } from './layout'
import { LESSON_WORDS, generateLesson, wordPool, type WordEntry } from './lessonText'

const WORDS: WordEntry[] = [
  ['να', 100],
  ['το', 90],
  ['είναι', 80],
  ['τα', 70],
  ['ένα', 60],
  ['και', 50],
]

/** Deterministic rng (mulberry32). */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('wordPool', () => {
  it('keeps only words made of unlocked Keys', () => {
    expect(wordPool(WORDS, ['ν', 'α', 'τ', 'ο']).map(([w]) => w)).toEqual(['να', 'το', 'τα'])
    expect(wordPool(WORDS, ['ν', 'α', 'ε', TONOS]).map(([w]) => w)).toEqual(['να', 'ένα'])
  })
})

describe('generateLesson', () => {
  const unlocked: Key[] = ['ν', 'α', 'τ', 'ο', 'ε', 'ι', TONOS]
  const pool = wordPool(WORDS, unlocked)

  it('makes a lesson of pool words only', () => {
    const words = generateLesson(pool, 'ν', seeded(1)).split(' ')
    expect(words).toHaveLength(LESSON_WORDS)
    for (const w of words) expect(pool.map(([p]) => p)).toContain(w)
  })

  it('never repeats a word back to back', () => {
    for (let seed = 0; seed < 50; seed++) {
      const words = generateLesson(pool, 'ν', seeded(seed)).split(' ')
      words.slice(1).forEach((w, i) => expect(w).not.toBe(words[i]))
    }
  })

  it('features the Focus key more than chance', () => {
    let withFocus = 0
    for (let seed = 0; seed < 100; seed++) {
      withFocus += generateLesson(pool, TONOS, seeded(seed))
        .split(' ')
        .filter((w) => keysOf(w).includes(TONOS)).length
    }
    // 2 of 5 pool words carry a tonos (40% by chance); focus pushes it to ~70%.
    expect(withFocus / (100 * LESSON_WORDS)).toBeGreaterThan(0.6)
  })

  it('prefers frequent words', () => {
    const skewed: WordEntry[] = [
      ['να', 1_000_000],
      ['το', 1_000_000],
      ['τόνι', 100],
    ]
    let rare = 0
    for (let seed = 0; seed < 100; seed++) {
      rare += generateLesson(skewed, 'ν', seeded(seed))
        .split(' ')
        .filter((w) => w === 'τόνι').length
    }
    // √100 / (2·√1e6 + √100) ≈ 0.5% of picks.
    expect(rare / (100 * LESSON_WORDS)).toBeLessThan(0.03)
  })
})
