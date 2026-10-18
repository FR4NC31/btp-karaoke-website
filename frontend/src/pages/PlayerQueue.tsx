import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Mic01Icon,
  Clock01Icon,
  Queue01Icon,
  PartyPopperIcon,
  Megaphone01Icon,
  DrumIcon,
  WhistleIcon,
  MusicNote01Icon,
  PlusSignIcon,
  Cancel01Icon,
  TextIcon,
  Delete02Icon,
  Search01Icon,
  PlayIcon,
  PauseIcon,
  PictureInPictureIcon,
} from '@hugeicons/core-free-icons'
import placeholderVideo from '../assets/placeholder-video.svg'
import placeholderAlbum from '../assets/placeholder-album.svg'
import localVideo from '../assets/video_local/the-reason.mp4'
import { useKaraokeVideoControls } from '../lib/karaoke-player'
import type { MediaItem } from '../lib/media-api'

/**
 * /studio/player-queue: "Karaoke & Studio Audio Console" — karaoke video
 * stage with play/pause badge, Lounge DSP & Sound FX quick pads, Upcoming
 * Lounge Queue list, and a catalog quick-search sidebar.
 *
 * Rendered inside StudioShell, so the top bar, sidebar and bottom PlayerBar
 * chrome all come from the shell. This page owns the console <video> and
 * registers it via the outlet context, so the shared PlayerBar drives it:
 * play/pause, the top-edge seek bar (click/drag to scrub) and volume. The svg
 * placeholder doubles as the poster frame; a centered play/pause badge
 * mirrors the transport state (auto-hides 2s after playback starts and
 * returns on stage hover; the hardcoded lyric overlay was retired).
 * The PiP button hands the song to the shell's floating mini player
 * (StudioPip) and drops back to the hub — "expand" there returns here.
 * Reached from the video-song cards, and from music cards that carry an
 * uploaded MP3 (the console is a media stage: the bar reads "Studio master").
 *
 * The stage plays the catalog row that sent the user here: card clicks carry
 * the row in history state, so an uploaded file really plays — a video song
 * with no upload falls back to the bundled master, and entering via the mini
 * player's expand keeps whatever the PiP session was playing. The track is
 * announced to the transport (`setOnAir`), which is what renames the bar and
 * points the mini at the same source.
 *
 * Everything else is still a static mockup (no handlers): DSP pads, queue
 * rows, quick search, sidebar recommendations. Cover art stays placeholder.
 */

interface QueueTag {
  label: string
  solid?: boolean
}

interface QueueRow {
  rank: string
  title: string
  artist: string
  genre: string
  len: string
  tags: QueueTag[]
}

const soundFx = [
  { icon: PartyPopperIcon, label: 'Cheer & Clap' },
  { icon: Megaphone01Icon, label: 'Airhorn' },
  { icon: DrumIcon, label: 'Drum Roll' },
  { icon: WhistleIcon, label: 'Whistle' },
]

const quickGenres = ['All Genres', 'Pop', 'OPM', 'Rock', 'K-Pop']

const queue: QueueRow[] = [
  {
    rank: '01',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    genre: 'Pop',
    len: '4:11',
    tags: [{ label: 'playing', solid: true }],
  },
  {
    rank: '02',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    genre: 'Solo',
    len: '2:55',
    tags: [{ label: 'Next', solid: true }],
  },
  {
    rank: '03',
    title: 'Beautiful Things',
    artist: 'Benson Boone',
    genre: 'Solo',
    len: '3:00',
    tags: [{ label: 'Rock' }, { label: 'Ballad' }],
  },
  {
    rank: '04',
    title: 'Lovely',
    artist: 'Billie Eilish & Khalid',
    genre: 'Duet',
    len: '3:20',
    tags: [{ label: 'Duet' }],
  },
]

const recommended = [
  { title: 'Take Me To Church', artist: 'Hozier', genre: 'Solo', len: '4:12' },
  { title: "Can't Help Falling", artist: 'Elvis Presley', genre: 'Classic', len: '3:00' },
  { title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Synthpop', len: '3:20' },
]

export default function PlayerQueue() {
  const { attachVideo, enterPip, toggle, playing, onAir, setOnAir } = useKaraokeVideoControls()
  const location = useLocation()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  // Video-card clicks arrive with `state.autoplay` and the catalog row in
  // `state.item` (see VideoSongSection / MusicPlayerSection): start the song
  // on arrival, and play the row's uploaded file when it has one.
  const routeState = location.state as { autoplay?: boolean; item?: MediaItem } | null
  const item = routeState?.item
  const autoplay = Boolean(routeState?.autoplay)

  // What the stage is playing: the clicked row's upload, or the carried PiP
  // session when expanding from the mini (no card state), or the bundled
  // master on a deep link.
  const source = item?.sourceUrl ?? onAir?.src ?? localVideo
  const audioMode = (item?.section ?? onAir?.kind) === 'music'
  const trackTitle = item?.title ?? onAir?.title ?? 'The Reason'
  const trackSubtitle = item ? item.subtitle : onAir ? onAir.subtitle || null : 'Hoobastank'
  // Poster: the row's cover / generated thumbnail before the bundled
  // placeholder art — the stage shows a real image while the file loads.
  const coverSrc = item?.coverUrl ?? onAir?.coverUrl ?? null

  // Stage badge visibility: while playing it auto-hides after 2s (the timer
  // restarts on every play event) and returns on stage hover; while paused it
  // stays (it is the play affordance).
  const [hovered, setHovered] = useState(false)
  const [badgeTimedOut, setBadgeTimedOut] = useState(false)
  const badgeTimerRef = useRef<number | null>(null)
  const badgeVisible = !playing || hovered || !badgeTimedOut

  const handlePlay = () => {
    setBadgeTimedOut(false)
    if (badgeTimerRef.current !== null) window.clearTimeout(badgeTimerRef.current)
    badgeTimerRef.current = window.setTimeout(() => setBadgeTimedOut(true), 2000)
  }

  const handleStop = () => {
    if (badgeTimerRef.current !== null) {
      window.clearTimeout(badgeTimerRef.current)
      badgeTimerRef.current = null
    }
    setBadgeTimedOut(false)
  }

  // Announce the on-air track to the shell transport: the bar shows its
  // metadata and the floating mini mirrors its source. A deep link (no card
  // state) leaves the transport's session alone — that is the expand-from-PiP
  // path, where the mini already carries the right track.
  useEffect(() => {
    if (!item) return
    setOnAir({
      title: item.title,
      subtitle: item.subtitle ?? '',
      src: item.sourceUrl ?? localVideo,
      coverUrl: item.coverUrl,
      kind: item.section === 'music' ? 'music' : 'video',
    })
  }, [item, setOnAir])

  // Hand the element to the shell transport (the shared PlayerBar drives it).
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const detach = attachVideo(el)
    if (autoplay) void el.play().catch(() => {})
    return () => {
      detach()
      if (badgeTimerRef.current !== null) window.clearTimeout(badgeTimerRef.current)
    }
  }, [attachVideo, autoplay])

  return (
    <div>
      {/* Console status strip */}
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
            Queue: 9/24
          </span>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Main column */}
        <div className="min-w-0 space-y-5">
          {/* Video stage */}
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
              <button
                type="button"
                className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-[10px] font-bold text-text-primary transition hover:bg-primary-hover"
              >
                Huddle Master 640p
              </button>
            </div>

            <div
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              className="relative mt-3 aspect-[16/9] bg-background sm:aspect-[21/9]"
            >
              {/* Console stage — the shared bottom PlayerBar is its
                  transport (play/pause, seek, volume); clicking the stage
                  toggles play/pause like a regular player. */}
              <video
                ref={videoRef}
                src={source}
                poster={coverSrc ?? (audioMode ? placeholderAlbum : placeholderVideo)}
                playsInline
                preload="metadata"
                onClick={() => toggle()}
                onPlay={handlePlay}
                onPause={handleStop}
                onEnded={handleStop}
                className="absolute inset-0 h-full w-full cursor-pointer object-contain"
              />
              {/* Play/pause badge — mirrors the video state. While playing it
                  auto-hides after 2s (back on stage hover); while paused it
                  stays. The stage click (video element) is the control, the
                  bar has the accessible button. */}
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
              {/* In-app PiP: arm the shell's floating mini player and drop
                  back to the hub — the song keeps playing in the corner
                  (KARAOKE-011); the mini's up-arrow expands back here.
                  Audio-only tracks skip it: a floating black square is not
                  a player. */}
              {!audioMode && (
                <button
                  type="button"
                  aria-label="Picture in picture"
                  onClick={() => {
                    enterPip()
                    navigate('/studio')
                  }}
                  className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-lg bg-black/50 text-text-primary backdrop-blur transition hover:bg-primary"
                >
                  <HugeiconsIcon icon={PictureInPictureIcon} size={16} />
                </button>
              )}
            </div>
          </section>

          {/* Lounge DSP & Sound FX */}
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

          {/* Upcoming Lounge Queue */}
          <section className="rounded-2xl border border-border bg-surface px-4 py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="flex items-center gap-2 font-heading text-base font-bold tracking-wide uppercase">
                <HugeiconsIcon icon={Queue01Icon} size={15} className="text-primary" />
                Upcoming Lounge Queue
              </h2>
              <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-text-primary">
                +4 waiting
              </span>
              <div className="flex flex-wrap items-center gap-4 sm:ml-auto">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-text-secondary uppercase transition hover:text-text-primary"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={13} />
                  Add Custom Track
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-[10px] font-semibold text-text-muted transition hover:text-error"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={13} />
                  Clear All
                </button>
              </div>
            </div>

            <ul className="mt-3 space-y-2">
              {queue.map((row) => (
                <li
                  key={row.rank}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface-elevated/40 px-3 py-2"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary-soft text-[10px] font-bold text-primary tabular-nums">
                    {row.rank}
                  </span>
                  <img src={placeholderAlbum} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold">{row.title}</p>
                      {row.tags.map((tag) => (
                        <span
                          key={tag.label}
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] tracking-wide uppercase ${
                            tag.solid
                              ? 'bg-primary font-bold text-text-primary'
                              : 'border border-border font-semibold text-text-secondary'
                          }`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                    <p className="truncate text-[10px] text-text-muted">
                      {row.artist} · {row.genre} ({row.len})
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      aria-label={`Lyrics for ${row.title}`}
                      className="grid size-7 place-items-center rounded-md text-text-muted transition hover:bg-surface-elevated hover:text-text-primary"
                    >
                      <HugeiconsIcon icon={TextIcon} size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${row.title}`}
                      className="grid size-7 place-items-center rounded-md text-text-muted transition hover:bg-surface-elevated hover:text-error"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="min-w-0 space-y-5">
          {/* Catalog Quick Search */}
          <section className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-heading text-base leading-tight font-bold tracking-wide uppercase">
                Catalog Quick Search
              </h2>
              <span className="shrink-0 pt-0.5 text-[10px] font-semibold text-text-muted">
                31,248 Master Tracks
              </span>
            </div>
            <div className="relative mt-3">
              <HugeiconsIcon
                icon={Search01Icon}
                size={15}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
              />
              <input
                type="search"
                aria-label="Search catalog"
                placeholder="Search song, title, artist, or number..."
                className="w-full rounded-lg border border-border bg-background py-2.5 pr-3 pl-9 text-xs placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {quickGenres.map((genre, index) => (
                <button
                  key={genre}
                  type="button"
                  className={`rounded-md px-2 py-1 text-[9px] font-bold tracking-wide uppercase transition ${
                    index === 0
                      ? 'bg-primary text-text-primary'
                      : 'border border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </section>

          {/* Recommended Master Tracks */}
          <section className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-heading text-base leading-tight font-bold tracking-wide uppercase">
                Recommended Master Tracks
              </h2>
              <span className="shrink-0 pt-0.5 text-[9px] font-bold tracking-widest text-text-muted uppercase">
                Quick Add
              </span>
            </div>
            <ul className="mt-2 space-y-0.5">
              {recommended.map((track) => (
                <li
                  key={track.title}
                  className="flex items-center gap-3 rounded-lg px-1.5 py-2 transition hover:bg-surface-elevated/60"
                >
                  <img src={placeholderAlbum} alt="" className="size-9 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{track.title}</p>
                    <p className="truncate text-[10px] text-text-muted">
                      {track.artist} · {track.genre} ({track.len})
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Quick add ${track.title}`}
                    className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-text-primary transition hover:bg-primary-hover"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
