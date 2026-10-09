import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  MusicNote01Icon,
  HeartIcon,
  ShuffleIcon,
  SkipBackIcon,
  PlayIcon,
  PauseIcon,
  SkipForwardIcon,
  RepeatIcon,
  ListIcon,
  VolumeHighIcon,
  FullScreenIcon,
} from '@hugeicons/core-free-icons'
import Placeholder from '../../../components/Placeholder'

export default function PlayerBar() {
  const [playing, setPlaying] = useState(false)
  const [liked, setLiked] = useState(false)

  return (
    <footer className="flex h-20 shrink-0 items-center gap-3 border-t border-border bg-surface px-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-6 sm:px-4">
      {/* Track info */}
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
        <Placeholder icon={MusicNote01Icon} iconSize={16} className="size-12 shrink-0 rounded-md" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold uppercase">Die With A Smile (Cover)</p>
          <p className="truncate text-[11px] text-text-muted">Lady Gaga &amp; Bruno Mars</p>
          <p className="mt-0.5 hidden text-[9px] font-bold tracking-wider text-primary uppercase sm:block">
            24-Bit · WAV · FLAC
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          aria-label="Like"
          className={`ml-1 shrink-0 transition ${liked ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}`}
        >
          <HugeiconsIcon icon={HeartIcon} size={16} />
        </button>
      </div>

      {/* Controls + progress */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:w-[min(36rem,40vw)] sm:flex-none">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            aria-label="Shuffle"
            className="hidden text-text-muted transition hover:text-text-primary sm:block"
          >
            <HugeiconsIcon icon={ShuffleIcon} size={16} />
          </button>
          <button type="button" aria-label="Previous" className="text-text-secondary transition hover:text-text-primary">
            <HugeiconsIcon icon={SkipBackIcon} size={18} />
          </button>
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? 'Pause' : 'Play'}
            className="grid size-9 place-items-center rounded-full bg-primary text-text-primary transition hover:bg-primary-hover"
          >
            <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={16} />
          </button>
          <button type="button" aria-label="Next" className="text-text-secondary transition hover:text-text-primary">
            <HugeiconsIcon icon={SkipForwardIcon} size={18} />
          </button>
          <button
            type="button"
            aria-label="Repeat"
            className="hidden text-text-muted transition hover:text-text-primary sm:block"
          >
            <HugeiconsIcon icon={RepeatIcon} size={16} />
          </button>
          <button
            type="button"
            aria-label="Queue"
            className="hidden text-text-muted transition hover:text-text-primary sm:block"
          >
            <HugeiconsIcon icon={ListIcon} size={16} />
          </button>
        </div>
        <div className="group flex w-full items-center gap-3 text-[10px] text-text-muted">
          <span className="w-8 shrink-0 text-right tabular-nums">1:24</span>
          <div className="h-1.5 flex-1 cursor-pointer rounded-full bg-border transition group-hover:h-2">
            <div className="h-full w-1/3 rounded-full bg-primary" />
          </div>
          <span className="w-8 shrink-0 tabular-nums">4:11</span>
        </div>
      </div>

      {/* Extra player controls */}
      <div className="hidden shrink-0 items-center justify-end gap-2 sm:flex">
        <span className="rounded border border-border px-2 py-1 text-[10px] font-bold text-text-secondary">A-B</span>
        <span className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] font-semibold text-text-secondary">
          PITCH <span className="text-text-muted">−</span> Oct <span className="text-text-muted">+</span>
        </span>
        <span className="rounded bg-primary-soft px-2 py-1 text-[10px] font-bold text-primary">STEMS MIX</span>
        <HugeiconsIcon icon={VolumeHighIcon} size={15} className="text-text-muted" />
        <div className="h-1 w-14 rounded-full bg-border">
          <div className="h-full w-2/3 rounded-full bg-primary" />
        </div>
        <button type="button" aria-label="Fullscreen" className="text-text-muted transition hover:text-text-primary">
          <HugeiconsIcon icon={FullScreenIcon} size={15} />
        </button>
      </div>
    </footer>
  )
}
