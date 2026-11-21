// The macOS "Greek" layout, emulated from physical keys (docs/adr/0001).
// Verified with UCKeyTranslate against com.apple.keylayout.Greek.

export const TONOS = '΄'
export const DIALYTIKA = '¨'

export const LETTERS = [...'αβγδεζηθικλμνξοπρστυφχψως'] as const
export type Letter = (typeof LETTERS)[number]
export type Key = Letter | typeof TONOS | typeof DIALYTIKA
export const ALL_KEYS: readonly Key[] = [...LETTERS, TONOS, DIALYTIKA]

/** One expected press of a lesson: a Key or the space bar. */
export type Stroke = Key | ' '

/** A press of a typing key that produces no Stroke (Q, digits, Shift+letter…). */
export const INVALID = 'invalid'
export type Press = Stroke | typeof INVALID

export type Finger = 'lp' | 'lr' | 'lm' | 'li' | 'ri' | 'rm' | 'rr' | 'rp' | 'th'

export type KeyCap = {
  code: string
  /** What the key shows on the on-screen keyboard. */
  label: string
  /** The unshifted Stroke this key produces, if any. */
  stroke?: Stroke
  finger: Finger
  /** Width in key units (1 = a letter key). */
  width?: number
}

const cap = (code: string, label: string, finger: Finger, stroke?: Stroke, width?: number): KeyCap => ({
  code,
  label,
  finger,
  stroke,
  width,
})
const letter = (code: string, l: Letter, finger: Finger) => cap(code, l, finger, l)

/** ANSI geometry, letter rows and space bar only. */
export const KEYBOARD_ROWS: readonly (readonly KeyCap[])[] = [
  [
    cap('Tab', 'tab', 'lp', undefined, 1.5),
    cap('KeyQ', ';', 'lp'),
    letter('KeyW', 'ς', 'lr'),
    letter('KeyE', 'ε', 'lm'),
    letter('KeyR', 'ρ', 'li'),
    letter('KeyT', 'τ', 'li'),
    letter('KeyY', 'υ', 'ri'),
    letter('KeyU', 'θ', 'ri'),
    letter('KeyI', 'ι', 'rm'),
    letter('KeyO', 'ο', 'rr'),
    letter('KeyP', 'π', 'rp'),
    cap('BracketLeft', '[', 'rp'),
    cap('BracketRight', ']', 'rp'),
    cap('Backslash', '\\', 'rp', undefined, 1.5),
  ],
  [
    cap('CapsLock', 'caps', 'lp', undefined, 1.75),
    letter('KeyA', 'α', 'lp'),
    letter('KeyS', 'σ', 'lr'),
    letter('KeyD', 'δ', 'lm'),
    letter('KeyF', 'φ', 'li'),
    letter('KeyG', 'γ', 'li'),
    letter('KeyH', 'η', 'ri'),
    letter('KeyJ', 'ξ', 'ri'),
    letter('KeyK', 'κ', 'rm'),
    letter('KeyL', 'λ', 'rr'),
    cap('Semicolon', TONOS, 'rp', TONOS),
    cap('Quote', "'", 'rp'),
    cap('Enter', 'return', 'rp', undefined, 2.25),
  ],
  [
    cap('ShiftLeft', 'shift', 'lp', undefined, 2.25),
    letter('KeyZ', 'ζ', 'lp'),
    letter('KeyX', 'χ', 'lr'),
    letter('KeyC', 'ψ', 'lm'),
    letter('KeyV', 'ω', 'li'),
    letter('KeyB', 'β', 'li'),
    letter('KeyN', 'ν', 'ri'),
    letter('KeyM', 'μ', 'ri'),
    cap('Comma', ',', 'rm'),
    cap('Period', '.', 'rr'),
    cap('Slash', '/', 'rp'),
    cap('ShiftRight', 'shift', 'rp', undefined, 2.75),
  ],
  [cap('Space', '', 'th', ' ', 6.25)],
]

const STROKE_BY_CODE = new Map<string, Stroke>(
  KEYBOARD_ROWS.flat().flatMap((k) => (k.stroke ? [[k.code, k.stroke] as const] : [])),
)

// Keys whose presses count as typing; everything else (Tab, Enter, arrows…) is ignored.
const TYPING_CODES = new Set([
  ...KEYBOARD_ROWS.flat()
    .filter((k) => !['Tab', 'CapsLock', 'Enter', 'ShiftLeft', 'ShiftRight'].includes(k.code))
    .map((k) => k.code),
  'Backquote',
  'Minus',
  'Equal',
  ...[...'0123456789'].map((d) => `Digit${d}`),
])

/** Physical key of a Key, as the on-screen keyboard needs it. */
export function codeOf(stroke: Stroke): { code: string; shift: boolean } {
  if (stroke === DIALYTIKA) return { code: 'Semicolon', shift: true }
  const k = KEYBOARD_ROWS.flat().find((c) => c.stroke === stroke)
  if (!k) throw new Error(`no key for ${stroke}`)
  return { code: k.code, shift: false }
}

/** What a physical press means; null when it is not a typing key at all. */
export function toPress(code: string, shift: boolean): Press | null {
  if (!TYPING_CODES.has(code)) return null
  if (shift) return code === 'Semicolon' ? DIALYTIKA : INVALID
  return STROKE_BY_CODE.get(code) ?? INVALID
}

const WITH_TONOS: Record<string, Letter> = { ά: 'α', έ: 'ε', ή: 'η', ί: 'ι', ό: 'ο', ύ: 'υ', ώ: 'ω' }
const WITH_DIALYTIKA: Record<string, Letter> = { ϊ: 'ι', ϋ: 'υ' }
const IS_LETTER = new Set<string>(LETTERS)

/** The Strokes that type a character: ά → ΄ α, ϊ → ¨ ι. */
export function strokesOf(char: string): Stroke[] {
  if (char === ' ') return [' ']
  if (IS_LETTER.has(char)) return [char as Letter]
  if (char in WITH_TONOS) return [TONOS, WITH_TONOS[char]]
  if (char in WITH_DIALYTIKA) return [DIALYTIKA, WITH_DIALYTIKA[char]]
  throw new Error(`cannot type ${JSON.stringify(char)}`)
}

export function keysOf(word: string): Key[] {
  return [...word].flatMap(strokesOf).filter((s): s is Key => s !== ' ')
}
