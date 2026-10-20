import { HugeiconsIcon } from '@hugeicons/react'
import {
  DrumIcon,
  Megaphone01Icon,
  MusicNote01Icon,
  PartyPopperIcon,
  WhistleIcon,
} from '@hugeicons/core-free-icons'

const soundFx = [
  { icon: PartyPopperIcon, label: 'Cheer & Clap' },
  { icon: Megaphone01Icon, label: 'Airhorn' },
  { icon: DrumIcon, label: 'Drum Roll' },
  { icon: WhistleIcon, label: 'Whistle' },
]

/** Lounge DSP & Sound FX strip — visual-only pads, reverb/echo readouts. */
export default function DspSection() {
  return (
    <section className="rounded-2xl border border-border bg-surface px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold tracking-wide uppercase">
          <HugeiconsIcon icon={MusicNote01Icon} size={15} className="text-primary" />
          Lounge DSP &amp; Sound FX:
        </h2>
        {soundFx.map((fx) => (
          <button
            key={fx.label}
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-[11px] font-semibold text-text-secondary transition hover:border-primary/50 hover:text-text-primary"
          >
            <HugeiconsIcon icon={fx.icon} size={13} className="text-primary" />
            {fx.label}
          </button>
        ))}
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <span className="flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[10px]">
            <span className="text-text-muted">Reverb:</span>
            <span className="font-bold text-text-secondary">Dark 51%</span>
          </span>
          <span className="flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[10px]">
            <span className="text-text-muted">Echo:</span>
            <span className="font-bold text-text-secondary">Pop 42%</span>
          </span>
        </div>
      </div>
    </section>
  )
}
