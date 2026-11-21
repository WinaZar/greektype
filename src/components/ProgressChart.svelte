<script lang="ts">
  import type { LessonRecord } from '../lib/progression'

  let { lessons }: { lessons: LessonRecord[] } = $props()

  const MA_WINDOW = 10
  const PAD = { left: 40, right: 56, top: 26, bottom: 8 }
  const WPM_H = 230
  const GAP = 34
  const ACC_H = 110
  const AXIS_H = 24

  let width = $state(760)
  let hover = $state<number | null>(null)

  const n = $derived(lessons.length)
  const plotW = $derived(Math.max(width - PAD.left - PAD.right, 10))

  const movingAvg = (values: number[]) =>
    values.map((_, i) => {
      const from = Math.max(0, i - MA_WINDOW + 1)
      const slice = values.slice(from, i + 1)
      return slice.reduce((a, b) => a + b, 0) / slice.length
    })

  const wpm = $derived(lessons.map((l) => l.wpm))
  const acc = $derived(lessons.map((l) => l.accuracy * 100))
  const wpmAvg = $derived(movingAvg(wpm))
  const accAvg = $derived(movingAvg(acc))

  const niceStep = (span: number, ticks: number) => {
    const raw = span / ticks
    const mag = 10 ** Math.floor(Math.log10(raw))
    return [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)!
  }

  const wpmMax = $derived(Math.max(10, Math.ceil(Math.max(...wpm, 0) / 10) * 10))
  const accMin = $derived(Math.min(90, Math.floor(Math.min(...acc, 100) / 5) * 5))

  const x = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const yWpm = (v: number) => PAD.top + WPM_H - (v / wpmMax) * WPM_H
  const accTop = PAD.top + WPM_H + GAP
  const yAcc = (v: number) => accTop + ACC_H - ((v - accMin) / (100 - accMin)) * ACC_H
  const height = accTop + ACC_H + AXIS_H + PAD.bottom

  const path = (values: number[], y: (v: number) => number) =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')

  const wpmTicks = $derived.by(() => {
    const step = niceStep(wpmMax, 4)
    return Array.from({ length: Math.floor(wpmMax / step) + 1 }, (_, i) => i * step)
  })
  const accTicks = $derived([accMin, (accMin + 100) / 2, 100])
  const lessonTicks = $derived.by(() => {
    if (n <= 1) return [0]
    const step = niceStep(n - 1, Math.max(2, Math.floor(plotW / 90)))
    const ticks = []
    for (let i = 0; i < n; i += step) ticks.push(i)
    return ticks
  })

  // Unlock markers; a label is skipped when it would collide with the previous one.
  const unlocks = $derived.by(() => {
    let lastLabelX = -Infinity
    return lessons.flatMap((l, i) => {
      if (!l.unlocked) return []
      const px = x(i)
      const labeled = px - lastLabelX >= 16
      if (labeled) lastLabelX = px
      return [{ i, px, key: l.unlocked, labeled }]
    })
  })

  function onMove(e: PointerEvent) {
    if (n === 0) return
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
    const i = n <= 1 ? 0 : Math.round(((e.clientX - rect.left - PAD.left) / plotW) * (n - 1))
    hover = Math.max(0, Math.min(n - 1, i))
  }

  const fmtDate = (at: number) =>
    new Date(at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  const tipLeft = $derived(hover === null ? 0 : Math.min(Math.max(x(hover) + 12, 0), width - 190))
</script>

<div class="chart" bind:clientWidth={width}>
  <svg {width} {height} role="img" aria-label="Lesson WPM and accuracy over time" onpointermove={onMove} onpointerleave={() => (hover = null)}>
    <!-- WPM panel -->
    <text class="title" x={PAD.left} y={PAD.top - 12}>WPM · {MA_WINDOW}-lesson average</text>
    {#each wpmTicks as t}
      <line class="grid" x1={PAD.left} x2={PAD.left + plotW} y1={yWpm(t)} y2={yWpm(t)} />
      <text class="tick" x={PAD.left - 8} y={yWpm(t)} text-anchor="end" dominant-baseline="middle">{t}</text>
    {/each}

    <!-- Accuracy panel -->
    <text class="title" x={PAD.left} y={accTop - 12}>Accuracy · {MA_WINDOW}-lesson average</text>
    {#each accTicks as t}
      <line class="grid" x1={PAD.left} x2={PAD.left + plotW} y1={yAcc(t)} y2={yAcc(t)} />
      <text class="tick" x={PAD.left - 8} y={yAcc(t)} text-anchor="end" dominant-baseline="middle">{t}%</text>
    {/each}

    <!-- Unlock markers span both panels -->
    {#each unlocks as u (u.i)}
      <line class="unlock" x1={u.px} x2={u.px} y1={PAD.top} y2={accTop + ACC_H} />
      {#if u.labeled}
        <text class="unlock-label" x={u.px} y={PAD.top + 12} text-anchor="middle">{u.key}</text>
      {/if}
    {/each}

    <!-- Lesson axis -->
    {#each lessonTicks as i}
      <text class="tick" x={x(i)} y={accTop + ACC_H + 16} text-anchor="middle">{i + 1}</text>
    {/each}

    <!-- Data: raw lessons as faint dots, moving average as the line -->
    {#each wpm as v, i}
      <circle class="raw" cx={x(i)} cy={yWpm(v)} r="2" />
    {/each}
    {#each acc as v, i}
      <circle class="raw" cx={x(i)} cy={yAcc(v)} r="2" />
    {/each}
    <path class="avg" d={path(wpmAvg, yWpm)} />
    <path class="avg" d={path(accAvg, yAcc)} />

    <!-- Latest average, labeled at the end -->
    {#if n > 0}
      <circle class="end" cx={x(n - 1)} cy={yWpm(wpmAvg[n - 1])} r="4" />
      <text class="end-label" x={x(n - 1) + 9} y={yWpm(wpmAvg[n - 1])} dominant-baseline="middle">{Math.round(wpmAvg[n - 1])}</text>
      <circle class="end" cx={x(n - 1)} cy={yAcc(accAvg[n - 1])} r="4" />
      <text class="end-label" x={x(n - 1) + 9} y={yAcc(accAvg[n - 1])} dominant-baseline="middle">{Math.round(accAvg[n - 1])}%</text>
    {/if}

    <!-- Hover layer -->
    {#if hover !== null}
      <line class="crosshair" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={accTop + ACC_H} />
      <circle class="end" cx={x(hover)} cy={yWpm(wpm[hover])} r="4" />
      <circle class="end" cx={x(hover)} cy={yAcc(acc[hover])} r="4" />
    {/if}
    <rect class="hit" x={PAD.left - 10} y={PAD.top} width={plotW + 20} height={accTop + ACC_H - PAD.top} />
  </svg>

  {#if hover !== null}
    {@const l = lessons[hover]}
    <div class="tip" style:left="{tipLeft}px" style:top="{PAD.top}px">
      <div class="tip-head">Lesson {hover + 1} · {fmtDate(l.at)}</div>
      <div><b>{Math.round(l.wpm)}</b> WPM <span class="muted">(avg {Math.round(wpmAvg[hover])})</span></div>
      <div><b>{Math.round(acc[hover])}%</b> accuracy <span class="muted">(avg {Math.round(accAvg[hover])}%)</span></div>
      {#if l.unlocked}<div>Unlocked <b>{l.unlocked}</b></div>{/if}
    </div>
  {/if}
</div>

<style>
  .chart {
    position: relative;
    width: 100%;
  }

  svg {
    display: block;
    overflow: visible;
  }

  .title {
    font-size: 12px;
    fill: var(--text);
  }

  .tick {
    font-size: 11px;
    fill: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .grid {
    stroke: var(--line);
    stroke-width: 1;
  }

  .unlock {
    stroke: var(--line);
    stroke-width: 1;
  }

  .unlock-label {
    font-size: 13px;
    fill: var(--muted);
  }

  .raw {
    fill: var(--accent);
    opacity: 0.3;
  }

  .avg {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  .end {
    fill: var(--accent);
    stroke: var(--bg);
    stroke-width: 2;
  }

  .end-label {
    font-size: 12px;
    fill: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .crosshair {
    stroke: var(--muted);
    stroke-width: 1;
  }

  .hit {
    fill: transparent;
  }

  .tip {
    position: absolute;
    width: 178px;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--surface);
    box-shadow: 0 2px 10px rgb(0 0 0 / 0.12);
    font-size: 12px;
    line-height: 1.5;
    pointer-events: none;
    font-variant-numeric: tabular-nums;
  }

  .tip-head {
    color: var(--muted);
  }

  .muted {
    color: var(--muted);
  }
</style>
