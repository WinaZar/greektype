import { strokesOf, type Key, type Press, type Stroke } from './layout'

/** A Lesson being typed. Immutable: press() returns a new value. */
export type Lesson = {
  text: string
  strokes: Stroke[]
  /** Index into `text` of the character each stroke belongs to. */
  charOf: number[]
  /** Index of the next expected stroke. */
  pos: number
  presses: number
  mistakes: Key[]
  /** [key, ms since the previous advancing press] for each correct Key press. */
  samples: [Key, number][]
  startedAt: number | null
  lastAt: number | null
}

export type LessonResult = {
  wpm: number
  accuracy: number
  samples: [Key, number][]
  mistakes: Key[]
}

export function newLesson(text: string): Lesson {
  const strokes: Stroke[] = []
  const charOf: number[] = []
  ;[...text].forEach((ch, i) => {
    for (const s of strokesOf(ch)) {
      strokes.push(s)
      charOf.push(i)
    }
  })
  return { text, strokes, charOf, pos: 0, presses: 0, mistakes: [], samples: [], startedAt: null, lastAt: null }
}

export const isDone = (l: Lesson) => l.pos === l.strokes.length

/** Applies one press at time t (ms). A wrong press is a Mistake: the cursor stays. */
export function press(l: Lesson, p: Press, t: number): Lesson {
  if (isDone(l)) return l
  const expected = l.strokes[l.pos]
  const base = { ...l, presses: l.presses + 1, startedAt: l.startedAt ?? t }
  if (p !== expected) {
    return expected === ' ' ? base : { ...base, mistakes: [...l.mistakes, expected] }
  }
  const sample: [Key, number][] = expected !== ' ' && l.lastAt !== null ? [[expected, t - l.lastAt]] : []
  return { ...base, pos: l.pos + 1, lastAt: t, samples: [...l.samples, ...sample] }
}

export function resultOf(l: Lesson): LessonResult {
  const minutes = ((l.lastAt ?? 0) - (l.startedAt ?? 0)) / 60_000
  const chars = [...l.text].length
  return {
    wpm: minutes > 0 ? chars / 5 / minutes : 0,
    accuracy: l.presses > 0 ? l.strokes.length / l.presses : 1,
    samples: l.samples,
    mistakes: l.mistakes,
  }
}
