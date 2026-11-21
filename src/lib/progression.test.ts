import { describe, expect, it } from 'vitest'
import { ALL_KEYS, DIALYTIKA, TONOS, keysOf, type Key } from './layout'
import type { LessonResult } from './lesson'
import { wordPool } from './lessonText'
import {
  TARGET_WPM,
  applyLesson,
  finishLesson,
  focusKey,
  initialProgress,
  keySpeed,
  nextUnlock,
  startSet,
  unlockOrder,
  type KeyStats,
} from './progression'
import WORDS from './words.json'

const words = WORDS as [string, number][]
const wpmMs = (wpm: number) => 12_000 / wpm
const result = (samples: [Key, number][], mistakes: Key[] = []): LessonResult => ({
  wpm: 30,
  accuracy: 1,
  samples,
  mistakes,
})

describe('unlockOrder (real word list)', () => {
  const order = unlockOrder(words)

  it('covers every Key once', () => {
    expect([...order].sort()).toEqual([...ALL_KEYS].sort())
  })

  it('puts the tonos key among the first and dialytika last', () => {
    expect(order.indexOf(TONOS)).toBeLessThan(8)
    expect(order.at(-1)).toBe(DIALYTIKA)
  })

  it('starts with a set that gives at least 50 words', () => {
    const start = startSet(order, words)
    expect(wordPool(words, start).length).toBeGreaterThanOrEqual(50)
    expect(wordPool(words, start.slice(0, -1)).length).toBeLessThan(50)
  })

  it('always has words for a just-unlocked Key', () => {
    const start = startSet(order, words).length
    for (let n = start + 1; n <= order.length; n++) {
      const key = order[n - 1]
      const pool = wordPool(words, order.slice(0, n))
      expect(pool.some(([w]) => keysOf(w).includes(key)), `no words for ${key}`).toBe(true)
    }
  })
})

describe('applyLesson', () => {
  it('starts a Key speed at its first sample, then smooths', () => {
    let stats = applyLesson({}, result([['α', 400]]))
    expect(stats.α).toEqual({ speedMs: 400, samples: 1, mistakes: 0 })
    stats = applyLesson(stats, result([['α', 200]], ['α']))
    expect(stats.α).toEqual({ speedMs: 380, samples: 2, mistakes: 1 })
  })
})

describe('focusKey', () => {
  it('prefers the just-unlocked (unmeasured) Key', () => {
    const stats: KeyStats = { α: { speedMs: 900, samples: 9, mistakes: 0 } }
    expect(focusKey(['α', 'ο'], stats)).toBe('ο')
  })

  it('otherwise picks the slowest Key', () => {
    const stats: KeyStats = {
      α: { speedMs: 300, samples: 9, mistakes: 0 },
      ο: { speedMs: 500, samples: 9, mistakes: 0 },
      ε: { speedMs: 200, samples: 9, mistakes: 0 },
    }
    expect(focusKey(['α', 'ο', 'ε'], stats)).toBe('ο')
  })
})

describe('nextUnlock', () => {
  const order: Key[] = ['α', 'ο', 'ε', 'ν']
  const at = (wpm: number) => ({ speedMs: wpmMs(wpm), samples: 9, mistakes: 0 })

  it('unlocks the next Key when every unlocked Key is at Target speed', () => {
    expect(nextUnlock(['α', 'ο'], order, { α: at(TARGET_WPM), ο: at(50) })).toBe('ε')
  })

  it('waits while any Key is slower or unmeasured', () => {
    expect(nextUnlock(['α', 'ο'], order, { α: at(TARGET_WPM - 1), ο: at(50) })).toBeNull()
    expect(nextUnlock(['α', 'ο'], order, { α: at(50) })).toBeNull()
  })

  it('returns null when everything is unlocked', () => {
    expect(nextUnlock(order, order, { α: at(50), ο: at(50), ε: at(50), ν: at(50) })).toBeNull()
  })
})

describe('finishLesson', () => {
  const order = unlockOrder(words)

  it('records the lesson and unlocks one Key at most', () => {
    const p = initialProgress(order, words)
    const fast: [Key, number][] = p.unlocked.map((k) => [k, wpmMs(60)])
    const next = finishLesson(p, result(fast), order, 123)
    expect(next.unlocked).toEqual([...p.unlocked, order[p.unlocked.length]])
    expect(next.lessons).toEqual([{ at: 123, wpm: 30, accuracy: 1, unlocked: order[p.unlocked.length] }])
    expect(keySpeed(next.stats, p.unlocked[0])).toBeCloseTo(60)
  })

  it('does not unlock while a Key is slow', () => {
    const p = initialProgress(order, words)
    const next = finishLesson(p, result([[p.unlocked[0], wpmMs(10)]]), order, 1)
    expect(next.unlocked).toEqual(p.unlocked)
    expect(next.lessons[0].unlocked).toBeUndefined()
  })
})
