<script lang="ts">
  import type { Lesson } from '../lib/lesson'

  let { lesson, wrong }: { lesson: Lesson; wrong: boolean } = $props()

  const chars = $derived([...lesson.text])
  const current = $derived(lesson.charOf[lesson.pos] ?? chars.length)
  // The dead key of the current character is already pressed (ά after ;).
  const partial = $derived(lesson.pos > 0 && lesson.charOf[lesson.pos - 1] === current)
</script>

<p class="text" lang="el">
  {#each chars as ch, i}<span
      class:done={i < current}
      class:current={i === current}
      class:partial={i === current && partial}
      class:wrong={i === current && wrong}>{ch}</span
    >{/each}
</p>

<style>
  .text {
    margin: 0;
    font-size: 30px;
    line-height: 1.6;
    letter-spacing: 0.01em;
    white-space: pre-wrap;
    text-align: center;
  }

  span {
    border-radius: 3px 3px 0 0;
    transition: color 0.08s;
  }

  .done {
    color: var(--muted);
    opacity: 0.6;
  }

  .current {
    box-shadow: inset 0 -3px 0 var(--accent);
  }

  .partial {
    color: var(--accent);
  }

  .wrong {
    color: var(--bad);
    background: color-mix(in srgb, var(--bad) 15%, transparent);
    box-shadow: inset 0 -3px 0 var(--bad);
  }
</style>
