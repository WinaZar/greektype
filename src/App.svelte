<script lang="ts">
  import Keyboard from './components/Keyboard.svelte'
  import KeyPanel from './components/KeyPanel.svelte'
  import LessonText from './components/LessonText.svelte'
  import ProgressChart from './components/ProgressChart.svelte'
  import { ALL_KEYS, toPress, type Key } from './lib/layout'
  import { isDone, newLesson, press, resultOf, type Lesson } from './lib/lesson'
  import { generateLesson, wordPool, type WordEntry } from './lib/lessonText'
  import { finishLesson, focusKey, initialProgress, nextUnlock, unlockOrder, type Progress } from './lib/progression'
  import { load, save } from './lib/storage'
  import WORDS from './lib/words.json'

  const words = WORDS as unknown as WordEntry[]
  const order = unlockOrder(words)
  const saved = load(localStorage, () => initialProgress(order, words))

  let progress = $state<Progress>(saved.progress)
  let keyboardVisible = $state(saved.keyboardVisible)
  let view = $state<'practice' | 'progress'>('practice')
  let lesson = $state<Lesson>(makeLesson(saved.progress))
  let wrong = $state(false)
  let last = $state<{ wpm: number; accuracy: number; unlocked?: Key } | null>(null)

  const focus = $derived(focusKey(progress.unlocked, progress.stats))
  const upcoming = $derived(order.find((k) => !progress.unlocked.includes(k)) ?? null)

  function makeLesson(p: Progress): Lesson {
    const pool = wordPool(words, p.unlocked)
    return newLesson(generateLesson(pool, focusKey(p.unlocked, p.stats)))
  }

  function persist() {
    save(localStorage, { progress, keyboardVisible })
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.metaKey) {
      const hotkeys: Record<string, () => void> = {
        Digit1: () => (view = 'practice'),
        Digit2: () => (view = 'progress'),
        KeyK: () => {
          keyboardVisible = !keyboardVisible
          persist()
        },
      }
      const action = hotkeys[e.code]
      if (action) {
        e.preventDefault()
        action()
      }
      return
    }
    if (e.ctrlKey || e.altKey || e.repeat || view !== 'practice') return
    const p = toPress(e.code, e.shiftKey)
    if (p === null) return
    e.preventDefault()

    const before = lesson.pos
    lesson = press(lesson, p, e.timeStamp)
    wrong = lesson.pos === before
    if (!isDone(lesson)) return

    const r = resultOf(lesson)
    progress = finishLesson(progress, r, order, Date.now())
    last = { wpm: r.wpm, accuracy: r.accuracy, unlocked: progress.lessons.at(-1)?.unlocked }
    persist()
    lesson = makeLesson(progress)
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="titlebar" data-tauri-drag-region>
  <nav>
    <button class:selected={view === 'practice'} onclick={() => (view = 'practice')} title="⌘1">Practice</button>
    <button class:selected={view === 'progress'} onclick={() => (view = 'progress')} title="⌘2">Progress</button>
  </nav>
</div>

{#if view === 'practice'}
  <main class="practice">
    <KeyPanel unlocked={progress.unlocked} stats={progress.stats} {focus} next={upcoming} />

    <section class="lesson">
      <LessonText {lesson} {wrong} />
    </section>

    <p class="last">
      {#if last}
        Last lesson: {Math.round(last.wpm)} WPM · {Math.round(last.accuracy * 100)}%
        {#if last.unlocked}<span class="unlocked">· unlocked <b>{last.unlocked}</b></span>{/if}
      {:else if progress.lessons.length === 0}
        Start typing. The Greek layout is built in; no need to switch the input source.
      {/if}
    </p>

    {#if keyboardVisible}
      <Keyboard unlocked={progress.unlocked} stats={progress.stats} next={lesson.strokes[lesson.pos]} />
    {/if}
    <p class="hint">⌘K {keyboardVisible ? 'hide' : 'show'} keyboard</p>
  </main>
{:else}
  <main class="progress">
    <p class="summary">
      {progress.lessons.length} lessons · {progress.unlocked.length} of {ALL_KEYS.length} keys unlocked
      {#if nextUnlock(progress.unlocked, order, progress.stats) === null && upcoming}
        · <b>{focus}</b> is the slowest key
      {/if}
    </p>
    {#if progress.lessons.length > 0}
      <ProgressChart lessons={progress.lessons} />
    {:else}
      <p class="empty">Finish a lesson to see your progress.</p>
    {/if}
  </main>
{/if}

<style>
  .titlebar {
    position: fixed;
    inset: 0 0 auto 0;
    height: 32px;
    z-index: 2;
  }

  nav {
    position: absolute;
    top: 8px;
    right: 18px;
    display: flex;
    gap: 14px;
    font-size: 13px;
  }

  button {
    appearance: none;
    border: 0;
    padding: 0;
    background: none;
    font: inherit;
    color: var(--muted);
    cursor: default;
  }

  button:hover,
  button.selected {
    color: var(--text);
  }

  main {
    height: 100%;
    padding: 52px 32px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .practice {
    gap: 18px;
  }

  .lesson {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: min(100%, 760px);
    min-height: 120px;
  }

  .last {
    min-height: 1.4em;
    margin: 0;
    font-size: 14px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .unlocked b {
    color: var(--text);
    font-size: 16px;
  }

  .hint {
    margin: 0;
    font-size: 11px;
    color: var(--muted);
    opacity: 0.7;
  }

  .progress {
    gap: 20px;
    align-items: stretch;
    max-width: 860px;
    margin: 0 auto;
  }

  .summary {
    margin: 0;
    font-size: 14px;
    color: var(--muted);
  }

  .summary b {
    color: var(--text);
  }

  .empty {
    color: var(--muted);
  }
</style>
