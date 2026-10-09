import { HugeiconsIcon } from '@hugeicons/react'
import {
  MusicNote01Icon,
  MusicNote02Icon,
  HashtagIcon,
  PlayIcon,
  PlayListIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import Placeholder from '../../../components/Placeholder'

export default function FeaturedCollection() {
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="flex gap-6">
        <Placeholder icon={MusicNote01Icon} iconSize={40} className="hidden size-40 shrink-0 rounded-lg sm:block" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-[10px] font-bold tracking-widest text-primary uppercase">
              Master Vault Collection
            </span>
            <span className="flex items-center gap-1 text-[11px] text-success">
              <span className="size-1.5 rounded-full bg-success" />
              Playing Lossless
            </span>
          </div>

          <h1 className="mt-3 font-heading text-4xl leading-none font-bold tracking-wide uppercase lg:text-5xl">
            Oph Gold &amp; Contemporary
            <br />
            Minus-One Suite
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary">
            Digitally remastered direct from the BTP analogue archives. Includes pristine transfer vinyl rips,
            cabinet mic sessions and authentic handheld contemporary backing tracks, preserving all the warmth of
            our original barbershop production playlists.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={MusicNote02Icon} size={14} />
              52 Tracks
            </span>
            <span className="flex items-center gap-1.5">
              <HugeiconsIcon icon={HashtagIcon} size={14} />
              24 Lossless Stems
            </span>
            <span>NO-06 FLAC</span>
          </div>

          <p className="mt-3 text-[11px] tracking-widest text-text-muted uppercase">BTP Studio Vault</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition hover:bg-primary-hover"
            >
              <HugeiconsIcon icon={PlayIcon} size={16} />
              Play Master Collection
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-5 py-2.5 text-sm font-semibold text-text-secondary transition hover:text-text-primary"
            >
              <HugeiconsIcon icon={PlayListIcon} size={16} />
              Queue Studio Rotation
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary-soft px-5 py-2.5 text-sm font-semibold text-primary transition hover:border-primary"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              Legacy Mauve Harmony
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
