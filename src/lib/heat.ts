import { TARGET_WPM } from './progression'

/** CSS background for a Key speed: one green ramp, fuller = closer to Target speed. */
export function heat(wpm: number | null): string | undefined {
  if (wpm === null) return undefined
  const fast = Math.round(15 + Math.min(wpm / TARGET_WPM, 1) * 85)
  return `color-mix(in oklch, var(--fast) ${fast}%, var(--surface))`
}
