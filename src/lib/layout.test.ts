import { describe, expect, it } from 'vitest'
import { ALL_KEYS, DIALYTIKA, INVALID, TONOS, codeOf, keysOf, strokesOf, toPress } from './layout'

describe('toPress', () => {
  it('maps physical keys to the macOS Greek layout', () => {
    expect(toPress('KeyA', false)).toBe('α')
    expect(toPress('KeyW', false)).toBe('ς')
    expect(toPress('KeyU', false)).toBe('θ')
    expect(toPress('KeyJ', false)).toBe('ξ')
    expect(toPress('KeyC', false)).toBe('ψ')
    expect(toPress('KeyV', false)).toBe('ω')
    expect(toPress('Space', false)).toBe(' ')
  })

  it('puts the tonos key on ; and the dialytika key on Shift+;', () => {
    expect(toPress('Semicolon', false)).toBe(TONOS)
    expect(toPress('Semicolon', true)).toBe(DIALYTIKA)
  })

  it('treats other typing keys as invalid presses', () => {
    expect(toPress('KeyQ', false)).toBe(INVALID)
    expect(toPress('Digit1', false)).toBe(INVALID)
    expect(toPress('KeyA', true)).toBe(INVALID)
    expect(toPress('Comma', false)).toBe(INVALID)
  })

  it('ignores non-typing keys', () => {
    for (const code of ['Backspace', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ShiftLeft', 'MetaLeft']) {
      expect(toPress(code, false)).toBeNull()
    }
  })
})

describe('strokesOf / keysOf', () => {
  it('decomposes accented vowels into dead key + letter', () => {
    expect(strokesOf('ά')).toEqual([TONOS, 'α'])
    expect(strokesOf('ϋ')).toEqual([DIALYTIKA, 'υ'])
    expect([...'είναι'].flatMap(strokesOf)).toEqual(['ε', TONOS, 'ι', 'ν', 'α', 'ι'])
    expect(keysOf('προϊόν')).toEqual(['π', 'ρ', 'ο', DIALYTIKA, 'ι', TONOS, 'ο', 'ν'])
  })

  it('rejects characters outside the trained set', () => {
    expect(() => strokesOf('ΐ')).toThrow()
    expect(() => strokesOf('Α')).toThrow()
  })
})

describe('codeOf', () => {
  it('finds a physical key for every Key', () => {
    for (const k of ALL_KEYS) expect(codeOf(k).code).toBeTruthy()
    expect(codeOf(DIALYTIKA)).toEqual({ code: 'Semicolon', shift: true })
    expect(codeOf('ς')).toEqual({ code: 'KeyW', shift: false })
  })
})
