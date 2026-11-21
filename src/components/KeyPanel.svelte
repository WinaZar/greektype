<script lang="ts">
  import { heat } from '../lib/heat'
  import type { Key } from '../lib/layout'
  import { TARGET_WPM, keySpeed, type KeyStats } from '../lib/progression'

  let {
    unlocked,
    stats,
    focus,
    next,
  }: { unlocked: Key[]; stats: KeyStats; focus: Key; next: Key | null } = $props()
</script>

<div class="panel">
  {#each unlocked as k (k)}
    {@const wpm = keySpeed(stats, k)}
    <div class="key" class:focus={k === focus} title={k === focus ? 'Focus key' : undefined}>
      <span class="glyph">{k}</span>
      <span class="bar">
        <span style:width="{Math.min((wpm ?? 0) / TARGET_WPM, 1) * 100}%" style:background={heat(wpm)}></span>
      </span>
      <span class="wpm">{wpm === null ? '–' : Math.round(wpm)}</span>
    </div>
  {/each}
  {#if next}
    <div class="next">next <span class="glyph">{next}</span></div>
  {/if}
</div>

<style>
  .panel {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-end;
    gap: 6px;
  }

  .key {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    width: 30px;
    padding: 4px 0;
    border-radius: 6px;
  }

  .key.focus {
    background: var(--surface);
    box-shadow: inset 0 0 0 1.5px var(--accent);
  }

  .glyph {
    font-size: 18px;
    line-height: 1;
  }

  .bar {
    width: 20px;
    height: 4px;
    border-radius: 2px;
    background: var(--line);
    overflow: hidden;
  }

  .bar > span {
    display: block;
    height: 100%;
  }

  .wpm {
    font-size: 10px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .next {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: 10px;
    padding-bottom: 16px;
    font-size: 12px;
    color: var(--muted);
  }

  .next .glyph {
    opacity: 0.6;
  }
</style>
