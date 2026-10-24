import type { MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
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

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export default function PlayerBar({
  player,
  liked,
  onToggleLiked,
}: {
  player: KaraokeVideoApi
  liked: boolean
  onToggleLiked: () => void
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onQueue = pathname.startsWith('/studio/player-queue')
  const queueTarget = onQueue ? '/studio' : '/studio/player-queue'
  const queueAction = onQueue ? 'Minimize player queue' : 'Open player queue'
  const playing = player.playing
  const progress = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0
  const current = formatTime(player.currentTime)
  const duration = formatTime(player.duration)
  const canSeek = player.duration > 0

  const openQueue = (event: MouseEvent<HTMLElement>) => {
    const target = event.target
    if (
      target instanceof Element &&
      target.closest('button, a, input, select, textarea, [role="slider"]')
    ) {
      return
    }
    navigate(queueTarget)
  }

  const onAir = player.onAir
  const nowTitle = onAir?.title ?? 'The Reason'
  const nowSubtitle = onAir ? onAir.subtitle : 'Hoobastank'
  const nowFormat = onAir
    ? onAir.kind === 'music'
      ? 'Studio master · MP3'
      : 'Karaoke master · MP4'
    : '24-Bit · WAV · FLAC'

  const repeat = player.repeatMode
  const repeatLabel = repeat === 'one' ? 'Repeat one' : repeat === 'all' ? 'Repeat all' : 'Repeat off'
  const repeatIcon = repeat === 'one' ? RepeatOne01Icon : repeat === 'all' ? RepeatIcon : RepeatOffIcon

  const cycleRepeat = () => {
    player.setRepeatMode(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')
  }

  return (
    <footer
      onClick={openQueue}
      className="relative flex h-20 shrink-0 cursor-pointer items-center gap-3 bg-surface px-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-6 sm:px-4"
    >
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
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
        <Link
          to={queueTarget}
          aria-label={`${queueAction}: ${nowTitle}${nowSubtitle ? ` by ${nowSubtitle}` : ''}`}
          title={`${queueAction}: ${nowTitle}`}
          className="group flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
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
            <p className="truncate text-sm font-semibold uppercase transition-colors group-hover:text-primary">
              {nowTitle}
            </p>
            {nowSubtitle && <p className="truncate text-[11px] text-text-muted">{nowSubtitle}</p>}
            <p className="mt-0.5 hidden text-[9px] font-bold tracking-wider text-primary uppercase sm:block">
              {nowFormat}
            </p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onToggleLiked}
          aria-label="Like"
          aria-pressed={liked}
          title={liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
          className={`ml-1 shrink-0 transition ${liked ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}`}
        >
          <HugeiconsIcon icon={HeartIcon} size={16} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:w-[min(36rem,40vw)] sm:flex-none">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => player.setShuffle(!player.shuffle)}
            aria-label="Shuffle"
            aria-pressed={player.shuffle}
            className={`hidden transition hover:text-text-primary sm:block ${
              player.shuffle ? 'text-warning' : 'text-text-muted'
            }`}
          >
            <HugeiconsIcon icon={ShuffleIcon} size={16} />
          </button>
          <button
            type="button"
            aria-label="Previous"
            onClick={player.previous}
            className="text-text-secondary transition hover:text-text-primary"
          >
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
          <button
            type="button"
            aria-label="Next"
            onClick={player.next}
            className="text-text-secondary transition hover:text-text-primary"
          >
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
