// Builds src/lib/words.json: the most frequent clean Greek words with their counts.
// Source: hermitdave/FrequencyWords (OpenSubtitles 2018), content under CC-BY-SA 4.0.
// Run once with `npm run words`; the output is committed.

import { writeFileSync } from 'node:fs'

const SOURCE =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/el/el_50k.txt'
const OUT = new URL('../src/lib/words.json', import.meta.url)
const LIMIT = 10_000

// Lowercase letters, accented vowels, ϊ ϋ. No ΐ ΰ (out of scope).
const ALLOWED = /^[α-ωάέήίόύώϊϋ]+$/
const TONOS = /[άέήίόύώ]/g
const STRIP = { ά: 'α', έ: 'ε', ή: 'η', ί: 'ι', ό: 'ο', ύ: 'υ', ώ: 'ω' }
const SINGLE_LETTER_WORDS = new Set(['ο', 'η', 'ή'])

const base = (w) => w.replace(TONOS, (c) => STRIP[c])
const tonosCount = (w) => (w.match(TONOS) ?? []).length

// Vowel units: digraphs first, then single vowels. An unaccented i-sound right
// before another vowel is a glide (ποιος, μια, γεια) and is not a syllable;
// an accented one is a full vowel (μία, δύο, θεία).
const VOWEL_UNIT = /ο[υύ]|α[ιί]|ε[ιί]|ο[ιί]|υ[ιί]|α[υύ]|ε[υύ]|[αεηιουωάέήίόύώϊϋ]/g
const GLIDES = new Set(['ι', 'υ', 'ει', 'οι', 'υι'])
// The only monosyllables that carry a tonos in monotonic spelling.
const ACCENTED_MONOSYLLABLES = new Set(['ή', 'πού', 'πώς'])

function syllables(w) {
  const units = [...w.matchAll(VOWEL_UNIT)]
  return units.filter((m, i) => {
    const next = units[i + 1]
    const beforeVowel = next && next.index === m.index + m[0].length
    return !(GLIDES.has(m[0]) && beforeVowel)
  }).length
}

function isWellFormed(w) {
  if (!ALLOWED.test(w)) return false
  if (w.length < 2 && !SINGLE_LETTER_WORDS.has(w)) return false
  if (/ς./.test(w) || w.endsWith('σ')) return false
  // Monotonic spelling puts exactly one tonos on every word of two or more
  // syllables and none on monosyllables. Anything else is a fragment or a
  // misspelling from the subtitles (πρεπε, 'κουσα, τί, ναί).
  const t = tonosCount(w)
  const s = syllables(w)
  if (t === 0) return s === 1
  return t === 1 && (s >= 2 || ACCENTED_MONOSYLLABLES.has(w))
}

const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`${SOURCE}: HTTP ${res.status}`)
const entries = (await res.text())
  .split('\n')
  .map((line) => line.trim().split(' '))
  .filter((parts) => parts.length === 2)
  .map(([w, c]) => [w.normalize('NFC'), Number(c)])
  .filter(([w]) => isWellFormed(w))

// Drop a word without tonos when an accented spelling of it is more frequent
// (ειναι → είναι), but keep pairs like που/πού where the plain one wins.
const bestAccented = new Map()
for (const [w, c] of entries) {
  if (tonosCount(w) === 0) continue
  const b = base(w)
  bestAccented.set(b, Math.max(bestAccented.get(b) ?? 0, c))
}
const words = entries
  .filter(([w, c]) => tonosCount(w) > 0 || (bestAccented.get(w) ?? 0) <= c)
  .slice(0, LIMIT)

writeFileSync(OUT, JSON.stringify(words) + '\n')
console.log(`wrote ${words.length} words to ${OUT.pathname}`)
