import { ALL_KEYS } from './layout'
import type { Progress } from './progression'

const STORAGE_KEY = 'greektype:v1'

export type Saved = { progress: Progress; keyboardVisible: boolean }

function isSaved(v: unknown): v is Saved {
  const s = v as Saved
  return (
    typeof s === 'object' &&
    s !== null &&
    typeof s.keyboardVisible === 'boolean' &&
    Array.isArray(s.progress?.unlocked) &&
    s.progress.unlocked.length > 0 &&
    s.progress.unlocked.every((k) => ALL_KEYS.includes(k)) &&
    typeof s.progress.stats === 'object' &&
    Array.isArray(s.progress.lessons)
  )
}

/** The saved state, or a fresh one when nothing (valid) is stored. */
export function load(storage: Storage, fresh: () => Progress): Saved {
  try {
    const v: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null')
    if (isSaved(v)) return v
  } catch {
    // Corrupt JSON: start over.
  }
  return { progress: fresh(), keyboardVisible: true }
}

export function save(storage: Storage, s: Saved): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(s))
}
