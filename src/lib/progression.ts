import { ALL_KEYS, keysOf, type Key } from './layout'
import type { LessonResult } from './lesson'
import { wordPool, type WordEntry } from './lessonText'

export const TARGET_WPM = 35
const MIN_START_WORDS = 50
const EMA_ALPHA = 0.1

export type KeyStat = { speedMs: number | null; samples: number; mistakes: number }
export type KeyStats = Partial<Record<Key, KeyStat>>

export type LessonRecord = { at: number; wpm: number; accuracy: number; unlocked?: Key }

export type Progress = {
  unlocked: Key[]
  stats: KeyStats
  lessons: LessonRecord[]
}

/** One keystroke per ms interval, at 5 characters per word. */
export const msToWpm = (ms: number) => 12_000 / ms

const EMPTY: KeyStat = { speedMs: null, samples: 0, mistakes: 0 }
export const statOf = (stats: KeyStats, k: Key): KeyStat => stats[k] ?? EMPTY

export const keySpeed = (stats: KeyStats, k: Key): number | null => {
  const ms = statOf(stats, k).speedMs
  return ms === null ? null : msToWpm(ms)
}

/** Keys by how often you press them in the word list, weighted by word frequency. */
export function unlockOrder(words: readonly WordEntry[]): Key[] {
  const freq = new Map<Key, number>()
  for (const [w, c] of words) for (const k of keysOf(w)) freq.set(k, (freq.get(k) ?? 0) + c)
  return [...ALL_KEYS].sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0))
}

/** The shortest prefix of the order whose Word pool has enough words. */
export function startSet(order: readonly Key[], words: readonly WordEntry[]): Key[] {
  for (let n = 1; n <= order.length; n++) {
    const keys = order.slice(0, n)
    if (wordPool(words, keys).length >= MIN_START_WORDS) return keys
  }
  return [...order]
}

export function initialProgress(order: readonly Key[], words: readonly WordEntry[]): Progress {
  return { unlocked: startSet(order, words), stats: {}, lessons: [] }
}

export function applyLesson(stats: KeyStats, r: LessonResult): KeyStats {
  const next: KeyStats = { ...stats }
  for (const [k, ms] of r.samples) {
    const s = statOf(next, k)
    const speedMs = s.speedMs === null ? ms : s.speedMs + EMA_ALPHA * (ms - s.speedMs)
    next[k] = { ...s, speedMs, samples: s.samples + 1 }
  }
  for (const k of r.mistakes) {
    const s = statOf(next, k)
    next[k] = { ...s, mistakes: s.mistakes + 1 }
  }
  return next
}

/** The slowest unlocked Key; an unmeasured (just-unlocked) Key counts as slowest. */
export function focusKey(unlocked: readonly Key[], stats: KeyStats): Key {
  const unmeasured = unlocked.filter((k) => statOf(stats, k).speedMs === null)
  if (unmeasured.length > 0) return unmeasured.at(-1)!
  return unlocked.reduce((slowest, k) =>
    statOf(stats, k).speedMs! > statOf(stats, slowest).speedMs! ? k : slowest,
  )
}

/** The next Key to unlock once every unlocked Key is at Target speed, else null. */
export function nextUnlock(unlocked: readonly Key[], order: readonly Key[], stats: KeyStats): Key | null {
  const allFast = unlocked.every((k) => (keySpeed(stats, k) ?? 0) >= TARGET_WPM)
  if (!allFast) return null
  return order.find((k) => !unlocked.includes(k)) ?? null
}

export function finishLesson(p: Progress, r: LessonResult, order: readonly Key[], at: number): Progress {
  const stats = applyLesson(p.stats, r)
  const next = nextUnlock(p.unlocked, order, stats)
  const record: LessonRecord = { at, wpm: r.wpm, accuracy: r.accuracy, ...(next && { unlocked: next }) }
  return {
    unlocked: next ? [...p.unlocked, next] : p.unlocked,
    stats,
    lessons: [...p.lessons, record],
  }
}
