import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowUp01Icon,
  PauseIcon,
  PictureInPictureIcon,
  PlayIcon,
} from '@hugeicons/core-free-icons'
import placeholderVideo from '../../assets/placeholder-video.svg'
import placeholderAlbum from '../../assets/placeholder-album.svg'
import type { PlayerViewMode } from '../../lib/karaoke-player'

type StageSectionProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  source: string
  coverSrc: string | null
  audioMode: boolean
  trackTitle: string
  trackSubtitle: string | null
  playing: boolean
  mode?: PlayerViewMode
  onToggle: () => void
  onEnded: () => void
  onMediaError: () => void
  onMediaLoaded: () => void
  onEnterPip: () => void
  onExpand?: () => void
}

export default function StageSection({
  videoRef,
  source,
  coverSrc,
  audioMode,
  trackTitle,
  trackSubtitle,
  playing,
  mode = 'expanded',
  onToggle,
  onEnded,
  onMediaError,
  onMediaLoaded,
  onEnterPip,
  onExpand,
}: StageSectionProps) {
  const [hovered, setHovered] = useState(false)
  const [badgeTimedOut, setBadgeTimedOut] = useState(false)
  const badgeTimerRef = useRef<number | null>(null)
  const isExpanded = mode === 'expanded'
  const isMini = mode === 'mini'
  const isHidden = mode === 'hidden'
  const badgeVisible = !playing || hovered || !badgeTimedOut

  useEffect(
    () => () => {
      if (badgeTimerRef.current !== null) window.clearTimeout(badgeTimerRef.current)
    },
    [],
  )

  function handlePlay() {
    setBadgeTimedOut(false)
    if (badgeTimerRef.current !== null) window.clearTimeout(badgeTimerRef.current)
    badgeTimerRef.current = window.setTimeout(() => setBadgeTimedOut(true), 2000)
  }

  function handleStop() {
    if (badgeTimerRef.current !== null) {
      window.clearTimeout(badgeTimerRef.current)
      badgeTimerRef.current = null
    }
    setBadgeTimedOut(false)
  }

  return (
    <section
      className={
        isMini
          ? 'group relative overflow-hidden rounded-xl border border-border bg-black shadow-2xl'
          : 'overflow-hidden rounded-2xl border border-border bg-surface'
      }
    >
      {isExpanded && (
        <div className="flex items-start justify-between gap-3 px-4 pt-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-primary/60 bg-primary-soft/40 px-2 py-0.5 text-[9px] font-bold tracking-widest text-primary uppercase">
                {audioMode ? 'Studio Audio Mode' : 'Karaoke Video Mode'}
              </span>
              <span className="rounded border border-border px-2 py-0.5 text-[9px] font-bold tracking-widest text-text-muted uppercase">
                {audioMode ? 'Backing Track' : 'Live Voice'}
              </span>
            </div>
            <h2 className="mt-2 truncate font-heading text-xl font-bold tracking-wide">
              <span className="text-primary">{trackTitle}</span>
              {trackSubtitle && <span className="text-text-primary"> — {trackSubtitle}</span>}
            </h2>
          </div>
          <span className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-[10px] font-bold text-text-primary">
            Huddle Master 640p
          </span>
        </div>
      )}

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={
          isMini
            ? 'relative aspect-video bg-black'
            : isHidden
              ? 'relative aspect-video bg-background'
              : `relative mt-3 bg-background ${
                  audioMode
                    ? 'mx-auto aspect-square w-full max-w-[31rem]'
                    : 'aspect-[16/9] sm:aspect-[21/9]'
                }`
        }
      >
        {audioMode && (
          <img
            src={coverSrc ?? placeholderAlbum}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
        )}
        <video
          ref={videoRef}
          src={source}
          poster={coverSrc ?? (audioMode ? placeholderAlbum : placeholderVideo)}
          playsInline
          preload={isHidden ? 'none' : 'metadata'}
          onClick={onToggle}
          onPlay={handlePlay}
          onPause={handleStop}
          onEnded={() => {
            handleStop()
            onEnded()
          }}
          onError={onMediaError}
          onLoadedData={onMediaLoaded}
          className={`absolute inset-0 h-full w-full cursor-pointer ${
            audioMode ? 'opacity-0' : isMini ? 'object-cover' : 'object-contain'
          }`}
        />
        {!isHidden && (
          <div
            className={`pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-300 ${
              isMini
                ? playing
                  ? 'opacity-0 group-hover:opacity-100'
                  : 'opacity-100'
                : badgeVisible
                  ? ''
                  : 'opacity-0'
            }`}
          >
            {isMini ? (
              <button
                type="button"
                aria-label={playing ? 'Pause' : 'Play'}
                onClick={onToggle}
                className="pointer-events-auto grid size-10 place-items-center rounded-full bg-black/60 text-text-primary backdrop-blur transition hover:bg-primary"
              >
                <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={18} />
              </button>
            ) : (
              <span
                className={`grid size-14 place-items-center rounded-full bg-primary text-text-primary shadow-lg ${
                  playing ? 'opacity-60' : 'opacity-100'
                }`}
              >
                <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={22} />
              </span>
            )}
          </div>
        )}
        {isExpanded && !audioMode && (
          <button
            type="button"
            aria-label="Picture in picture"
            onClick={onEnterPip}
            className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-lg bg-black/50 text-text-primary backdrop-blur transition hover:bg-primary"
          >
            <HugeiconsIcon icon={PictureInPictureIcon} size={16} />
          </button>
        )}
        {isMini && onExpand && (
          <button
            type="button"
            aria-label="Expand"
            onClick={onExpand}
            className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-md bg-black/60 text-text-primary backdrop-blur transition hover:bg-primary"
          >
            <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
          </button>
        )}
      </div>
    </section>
  )
}
