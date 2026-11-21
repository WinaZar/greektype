import { describe, expect, it } from 'vitest'
import type { Progress } from './progression'
import { load, save, type Saved } from './storage'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  }
}

const fresh = (): Progress => ({ unlocked: ['α', 'ο'], stats: {}, lessons: [] })

describe('storage', () => {
  it('starts fresh with the keyboard shown', () => {
    expect(load(memoryStorage(), fresh)).toEqual({ progress: fresh(), keyboardVisible: true })
  })

  it('round-trips saved state', () => {
    const s = memoryStorage()
    const saved: Saved = {
      progress: {
        unlocked: ['α', 'ο', 'ε'],
        stats: { α: { speedMs: 300, samples: 4, mistakes: 1 } },
        lessons: [{ at: 1, wpm: 20, accuracy: 0.9, unlocked: 'ε' }],
      },
      keyboardVisible: false,
    }
    save(s, saved)
    expect(load(s, fresh)).toEqual(saved)
  })

  it('starts fresh on corrupt data', () => {
    expect(load(memoryStorage({ 'greektype:v1': '{nope' }), fresh).progress).toEqual(fresh())
    expect(load(memoryStorage({ 'greektype:v1': '{"progress":{}}' }), fresh).progress).toEqual(fresh())
  })
})
