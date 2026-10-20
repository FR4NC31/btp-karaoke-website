import { HugeiconsIcon } from '@hugeicons/react'
import { Clock01Icon, Mic01Icon, Queue01Icon } from '@hugeicons/core-free-icons'

/**
 * Console status strip — room, clock/session readout, mic levels and the
 * queue counter (the only live value on it; the rest is mockup chrome).
 */
export default function ConsoleStatusStrip({ queueCount }: { queueCount: number }) {
  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <h1 className="flex items-center gap-2.5 font-heading text-sm font-bold tracking-[0.2em] uppercase">
        <span
          aria-hidden="true"
          className="grid size-5 shrink-0 place-items-center rounded-full border border-primary/60"
        >
          <span className="size-2 rounded-full bg-primary" />
        </span>
        Karaoke &amp; Studio Audio Console
      </h1>

      <div className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Lounge / room */}
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-success" />
          <span className="flex flex-col leading-tight">
            <span className="text-[11px] font-semibold">Solo 04+</span>
            <span className="text-[9px] font-semibold tracking-widest text-text-muted uppercase">
              Loops Lounge
            </span>
          </span>
        </span>

        {/* Tempo / clock readout */}
        <span className="flex flex-col leading-tight">
          <span className="text-[9px] font-semibold tracking-widest text-text-muted">Fn5</span>
          <span className="text-[11px] font-semibold tabular-nums">78:23</span>
        </span>

        {/* Session */}
        <span className="flex items-center gap-1.5">
          <HugeiconsIcon icon={Clock01Icon} size={14} className="text-text-muted" />
          <span className="text-[10px] font-semibold text-text-muted">Session Remaining:</span>
          <span className="text-[11px] font-bold tabular-nums">01:18:17</span>
        </span>

        {/* Mic levels + queue */}
        <span className="flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2 py-1 text-[10px] font-bold text-success">
          <HugeiconsIcon icon={Mic01Icon} size={12} />
          Mic 1: 85%
        </span>
        <span className="flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2 py-1 text-[10px] font-bold text-success">
          <HugeiconsIcon icon={Mic01Icon} size={12} />
          Mic 2: 50%
        </span>
        <span className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary-soft px-2 py-1 text-[10px] font-bold text-primary">
          <HugeiconsIcon icon={Queue01Icon} size={12} />
          Queue: {queueCount}
        </span>
      </div>
    </section>
  )
}
