<script lang="ts">
  import { heat } from '../lib/heat'
  import { DIALYTIKA, KEYBOARD_ROWS, TONOS, codeOf, type Key, type KeyCap, type Stroke } from '../lib/layout'
  import { keySpeed, type KeyStats } from '../lib/progression'

  let { unlocked, stats, next }: { unlocked: Key[]; stats: KeyStats; next: Stroke | undefined } = $props()

  const target = $derived(next === undefined ? null : codeOf(next))
  const isKey = (c: KeyCap): c is KeyCap & { stroke: Key } => c.stroke !== undefined && c.stroke !== ' '

  function isNext(c: KeyCap) {
    if (!target) return false
    // Shift+; for dialytika: the left hand holds Shift.
    return c.code === target.code || (target.shift && c.code === 'ShiftLeft')
  }
</script>

<div class="keyboard" aria-hidden="true">
  {#each KEYBOARD_ROWS as row}
    <div class="row">
      {#each row as c (c.code)}
        {@const key = isKey(c) ? c.stroke : null}
        {@const open = key !== null && unlocked.includes(key)}
        <div
          class="cap {c.finger}"
          class:letter={key !== null}
          class:locked={key !== null && !open}
          class:inert={key === null && c.code !== 'Space'}
          class:next={isNext(c)}
          class:space={c.code === 'Space'}
          style:--w={c.width ?? 1}
          style:background={open ? heat(keySpeed(stats, key!)) : undefined}
        >
          {#if c.code === 'Semicolon'}
            <span class="alt" class:locked={!unlocked.includes(DIALYTIKA)}>{DIALYTIKA}</span>
            <span class="label">{TONOS}</span>
          {:else}
            <span class="label">{c.label}</span>
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .keyboard {
    --u: 40px;
    --gap: 5px;
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    align-items: flex-start;
  }

  .row {
    display: flex;
    gap: var(--gap);
  }

  .cap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--w) * var(--u) + (var(--w) - 1) * var(--gap));
    height: var(--u);
    border-radius: 6px;
    background: var(--surface);
    border-bottom: 3px solid var(--finger);
    font-size: 11px;
    color: var(--muted);
  }

  .space {
    margin-left: calc(4.375 * var(--u) + 4 * var(--gap));
  }

  .letter {
    font-size: 19px;
    color: var(--text);
  }

  .locked {
    opacity: 0.35;
  }

  .inert {
    border-bottom-color: transparent;
    opacity: 0.6;
  }

  .next {
    opacity: 1;
    box-shadow:
      0 0 0 2px var(--bg),
      0 0 0 4px var(--accent);
    z-index: 1;
  }

  .alt {
    position: absolute;
    top: 3px;
    left: 6px;
    font-size: 13px;
  }

  .lp { --finger: var(--f-lp); }
  .lr { --finger: var(--f-lr); }
  .lm { --finger: var(--f-lm); }
  .li { --finger: var(--f-li); }
  .ri { --finger: var(--f-ri); }
  .rm { --finger: var(--f-rm); }
  .rr { --finger: var(--f-rr); }
  .rp { --finger: var(--f-rp); }
  .th { --finger: var(--f-th); }
</style>
