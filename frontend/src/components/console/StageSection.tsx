import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PauseIcon, PictureInPictureIcon, PlayIcon } from '@hugeicons/core-free-icons'
import placeholderVideo from '../../assets/placeholder-video.svg'
import placeholderAlbum from '../../assets/placeholder-album.svg'

type StageSectionProps = {
  /** The console's <video>; the page attaches it to the shell transport. */
  videoRef: RefObject<HTMLVideoElement | null>
  source: string
  coverSrc: string | null
  audioMode: boolean
  trackTitle: string
  trackSubtitle: string | null
  playing: boolean
  /** Stage click — the shared transport's play/pause. */
  onToggle: () => void
  /** Song finished — the page rolls onto the next queued row. */
  onEnded: () => void
  onMediaError: () => void
  onMediaLoaded: () => void
  /** Arm the shell's floating mini player and leave for the hub. */
  onEnterPip: () => void
}

/**
 * Console video stage: mode chips + on-air title, the stage itself (click
 * toggles via the transport), the play/pause badge and the PiP hand-off.
 *
 * The badge mirrors the video state: while playing it auto-hides after 2s
 * (back on stage hover); while paused it stays — it is the play affordance.
 * The stage click is the control; the bottom PlayerBar has the accessible
 * button.
 */
export default function StageSection({
  videoRef,
  source,
  coverSrc,
  audioMode,
  trackTitle,
  trackSubtitle,
  playing,
  onToggle,
  onEnded,
  onMediaError,
  onMediaLoaded,
  onEnterPip,
}: StageSectionProps) {
  const [hovered, setHovered] = useState(false)
  const [badgeTimedOut, setBadgeTimedOut] = useState(false)
  const badgeTimerRef = useRef<number | null>(null)
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
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
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

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative mt-3 aspect-[16/9] bg-background sm:aspect-[21/9]"
      >
        {/* Console stage — the shared bottom PlayerBar is its transport
            (play/pause, seek, volume); clicking the stage toggles
            play/pause like a regular player. */}
        <video
          ref={videoRef}
          src={source}
          poster={coverSrc ?? (audioMode ? placeholderAlbum : placeholderVideo)}
          playsInline
          preload="metadata"
          onClick={onToggle}
          onPlay={handlePlay}
          onPause={handleStop}
          onEnded={() => {
            handleStop()
            onEnded()
          }}
          onError={onMediaError}
          onLoadedData={onMediaLoaded}
          className="absolute inset-0 h-full w-full cursor-pointer object-contain"
        />
        {/* Play/pause badge — mirrors the video state. The stage click (video
            element) is the control, the bar has the accessible button. */}
        <div
          className={`pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-300 ${
            badgeVisible ? '' : 'opacity-0'
          }`}
        >
          <span
            className={`grid size-14 place-items-center rounded-full bg-primary text-text-primary shadow-lg ${
              playing ? 'opacity-60' : 'opacity-100'
            }`}
          >
            <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={22} />
          </span>
        </div>
        {/* In-app PiP: arm the shell's floating mini player and drop back to
            the hub — the song keeps playing in the corner (KARAOKE-011); the
            mini's up-arrow expands back here. Audio-only tracks skip it: a
            floating black square is not a player. */}
        {!audioMode && (
          <button
            type="button"
            aria-label="Picture in picture"
            onClick={onEnterPip}
            className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-lg bg-black/50 text-text-primary backdrop-blur transition hover:bg-primary"
          >
            <HugeiconsIcon icon={PictureInPictureIcon} size={16} />
          </button>
        )}
      </div>
    </section>
  )
}
