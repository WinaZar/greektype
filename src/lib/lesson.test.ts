import { describe, expect, it } from 'vitest'
import { INVALID, TONOS, type Press } from './layout'
import { isDone, newLesson, press, resultOf, type Lesson } from './lesson'

const type = (l: Lesson, presses: [Press, number][]) => presses.reduce((acc, [p, t]) => press(acc, p, t), l)

describe('lesson', () => {
  it('expands characters into strokes', () => {
    const l = newLesson('τα ένα')
    expect(l.strokes).toEqual(['τ', 'α', ' ', TONOS, 'ε', 'ν', 'α'])
    expect(l.charOf).toEqual([0, 1, 2, 3, 3, 4, 5])
  })

  it('advances on the expected stroke', () => {
    const l = type(newLesson('να'), [['ν', 0]])
    expect(l.pos).toBe(1)
  })

  it('blocks on a Mistake and charges the expected Key', () => {
    const l = type(newLesson('να'), [
      ['ν', 0],
      ['ο', 100],
      [INVALID, 200],
    ])
    expect(l.pos).toBe(1)
    expect(l.mistakes).toEqual(['α', 'α'])
    expect(l.presses).toBe(3)
  })

  it('needs the tonos key before the vowel', () => {
    let l = type(newLesson('ό'), [['ο', 0]])
    expect(l.pos).toBe(0)
    expect(l.mistakes).toEqual([TONOS])
    l = type(l, [
      [TONOS, 100],
      ['ο', 200],
    ])
    expect(isDone(l)).toBe(true)
  })

  it('samples the time since the previous advancing press, including mistakes', () => {
    const l = type(newLesson('το να'), [
      ['τ', 1000],
      ['ο', 1200],
      [' ', 1300],
      ['α', 1500], // mistake
      ['ν', 1700],
      ['α', 1800],
    ])
    expect(l.samples).toEqual([
      ['ο', 200],
      ['ν', 400],
      ['α', 100],
    ])
  })

  it('does not charge space as a Key', () => {
    const l = type(newLesson('α α'), [
      ['α', 0],
      ['β', 100],
    ])
    expect(l.mistakes).toEqual([])
    expect(l.presses).toBe(2)
  })

  it('computes WPM over characters and accuracy over presses', () => {
    // 10 characters in 6 seconds = 2 words in 0.1 min = 20 WPM.
    const text = 'να το να τ'
    let l = newLesson(text)
    l = press(l, 'λ', 0) // mistake starts the clock
    l.strokes.forEach((s, i) => (l = press(l, s, ((i + 1) * 6000) / l.strokes.length)))
    const r = resultOf(l)
    expect(r.wpm).toBeCloseTo(20)
    expect(r.accuracy).toBeCloseTo(10 / 11)
  })
})
