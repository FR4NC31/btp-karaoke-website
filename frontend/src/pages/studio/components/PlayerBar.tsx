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
  RepeatOffIcon,
  RepeatOne01Icon,
  VolumeHighIcon,
  FullScreenIcon,
} from '@hugeicons/core-free-icons'
import Placeholder from '../../../components/Placeholder'
import type { KaraokeVideoApi } from '../../../lib/karaoke-player'

/** m:ss readout for the player bar. */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Studio player bar. The shell transport registers up to three sources — the
 * console's karaoke <video>, the floating PiP mini player (StudioPip) and
 * the lobby music <audio> (StudioBgm), in that priority. The bar drives
 * whichever source is active: play/pause, the full-width top-edge seek strip
 * (native slider with a thumb circle — slide it or click the track to scrub;
 * mouse, touch and arrow keys) and volume. Track metadata follows the
 * transport's on-air track (a catalog row's uploaded file, or the bundled
 * master / lobby default "The Reason" when nothing is on air).
 */
export default function PlayerBar({ player }: { player: KaraokeVideoApi }) {
  const [liked, setLiked] = useState(false)
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off')
  const [shuffled, setShuffled] = useState(false)

  const playing = player.playing
  const progress = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0
  const current = formatTime(player.currentTime)
  const duration = formatTime(player.duration)
  const canSeek = player.duration > 0

  const onAir = player.onAir
  const nowTitle = onAir?.title ?? 'The Reason'
  const nowSubtitle = onAir ? onAir.subtitle : 'Hoobastank'
  const nowFormat = onAir
    ? onAir.kind === 'music'
      ? 'Studio master · MP3'
      : 'Karaoke master · MP4'
    : '24-Bit · WAV · FLAC'

  // Repeat cycles off → all → one (RepeatOff / Repeat / RepeatOne01 icons);
  // off and the two repeat modes mirror onto the video's loop flag.
  const repeatLabel = repeat === 'one' ? 'Repeat one' : repeat === 'all' ? 'Repeat all' : 'Repeat off'
  const repeatIcon = repeat === 'one' ? RepeatOne01Icon : repeat === 'all' ? RepeatIcon : RepeatOffIcon

  const cycleRepeat = () => {
    const next = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off'
    setRepeat(next)
    player.setLoop(next !== 'off')
  }

  return (
    <footer className="relative flex h-20 shrink-0 items-center gap-3 bg-surface px-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-6 sm:px-4">
      {/* Seek strip — doubles as the bar's top border. Native range slider:
          drag the thumb circle, click the track or use arrow keys to scrub;
          the red fill mirrors the live transport position. */}
      <div className="absolute top-0 left-0 z-10 h-3 w-full">
        <div className="absolute top-1 left-0 h-1 w-full bg-border">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={canSeek ? player.duration : 0}
          step="any"
          value={canSeek ? player.currentTime : 0}
          onChange={(event) => player.seek(Number(event.target.value))}
          disabled={!canSeek}
          aria-label="Seek"
          aria-valuetext={`${current} / ${duration}`}
          className={`absolute inset-0 w-full appearance-none bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
            canSeek
              ? 'cursor-pointer [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary'
              : 'cursor-default [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:opacity-0 [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:opacity-0'
          }`}
        />
      </div>
      {/* Track info */}
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
        {onAir?.coverUrl ? (
          <img
            src={onAir.coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-12 shrink-0 rounded-md bg-surface-elevated object-cover"
          />
        ) : (
          <Placeholder icon={MusicNote01Icon} iconSize={16} className="size-12 shrink-0 rounded-md" />
        )}
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold uppercase">{nowTitle}</p>
          {nowSubtitle && <p className="truncate text-[11px] text-text-muted">{nowSubtitle}</p>}
          <p className="mt-0.5 hidden text-[9px] font-bold tracking-wider text-primary uppercase sm:block">
            {nowFormat}
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

      {/* Controls + time readout */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:w-[min(36rem,40vw)] sm:flex-none">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setShuffled((v) => !v)}
            aria-label="Shuffle"
            aria-pressed={shuffled}
            className={`hidden transition hover:text-text-primary sm:block ${
              shuffled ? 'text-warning' : 'text-text-muted'
            }`}
          >
            <HugeiconsIcon icon={ShuffleIcon} size={16} />
          </button>
          <button type="button" aria-label="Previous" className="text-text-secondary transition hover:text-text-primary">
            <HugeiconsIcon icon={SkipBackIcon} size={18} />
          </button>
          <button
            type="button"
            onClick={player.toggle}
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
            onClick={cycleRepeat}
            aria-label={repeatLabel}
            className={`hidden transition hover:text-text-primary sm:block ${
              repeat === 'off' ? 'text-text-muted' : 'text-primary'
            }`}
          >
            <HugeiconsIcon icon={repeatIcon} size={16} />
          </button>
        </div>
        <div className="flex w-full items-center justify-center gap-2 text-[10px] text-text-muted">
          <span className="tabular-nums">{current}</span>
          <span aria-hidden="true">/</span>
          <span className="tabular-nums">{duration}</span>
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
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={player.volume}
          onChange={(event) => player.changeVolume(Number(event.target.value))}
          aria-label="Volume"
          className="h-1.5 w-16 cursor-pointer accent-primary"
        />
        <button type="button" aria-label="Fullscreen" className="text-text-muted transition hover:text-text-primary">
          <HugeiconsIcon icon={FullScreenIcon} size={15} />
        </button>
      </div>
    </footer>
  )
}
