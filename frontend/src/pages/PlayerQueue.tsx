import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  GripVerticalIcon,
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
  Shield01Icon,
  PlayIcon,
  PauseIcon,
  PictureInPictureIcon,
} from '@hugeicons/core-free-icons'
import placeholderVideo from '../assets/placeholder-video.svg'
import placeholderAlbum from '../assets/placeholder-album.svg'
import localVideo from '../assets/video_local/the-reason.mp4'
import { useSession } from '../lib/auth-client'
import { useKaraokeVideoControls } from '../lib/karaoke-player'
import { resolveQueueSource, useLoungeQueue } from '../lib/lounge-queue'
import {
  fetchMediaCatalog,
  MEDIA_SECTION_LABELS,
  type AdminMediaItem,
  type MediaItem,
} from '../lib/media-api'

/**
 * /studio/player-queue: "Karaoke & Studio Audio Console" — karaoke video
 * stage with play/pause badge, Lounge DSP & Sound FX quick pads, and the
 * Upcoming Lounge Queue rail on the right (the player takes the wide side).
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
 * uploaded MP3 (the console is a media stage: the bar reads "Studio master"),
 * and from the Media Hub's Play buttons (the same preview for staff).
 *
 * The stage plays the catalog row that sent the user here: card clicks carry
 * the row in history state, so an uploaded file really plays — a video song
 * with no upload falls back to the bundled master, and entering via the mini
 * player's expand keeps whatever the PiP session was playing. The track is
 * announced to the transport (`setOnAir`), which is what renames the bar and
 * points the mini at the same source.
 *
 * The lounge queue doubles as the playlist: the bar's Previous/Next and the
 * auto-advance at the end of a song step through its rows, and every row is
 * resolved to the exact file it must play (lib/lounge-queue's
 * `resolveQueueSource` — the catalog row captured at queue time, or the live
 * catalog row its id/title points at). Rows with no real media behind them
 * are stepped over, so the bundled master never stands in for another song.
 * The bar's repeat cycle and shuffle ride on top: repeat all wraps the
 * playlist at either end, and shuffle presents the queue itself in a random
 * order — the rail reorders to it, each Next/auto-advance draws a random
 * song the round hasn't played yet (never repeating until a full round is
 * done), and Previous walks the played songs back. Drag-reorder pauses while
 * shuffle is on; the singer's own arrangement comes back when it is off.
 *
 * Signed-in admins get a staff-only "Admin details" panel under the stage:
 * the catalog row behind the song — artist/album/tempo, file and cover
 * references, visibility, timestamps, lyrics — reading whatever the entry
 * point carried (a Media Hub Play click hands over the full admin row; a hub
 * card carries the public fields). Regular users never render it.
 *
 * The lounge queue is shared studio state (lib/lounge-queue → the shell's
 * outlet context): card menus on the hub add rows, this page adds a custom
 * track from the empty state or the header, removes a row, clears all, and
 * drag-reorders with the grip handle — all persisted to localStorage. The
 * bar's Previous/Next skip through that list and a finished song advances to
 * the next queued row on its own, autoplaying it (a row plays its uploaded
 * file when it has one, the bundled master otherwise); the row on air is
 * highlighted in the rail. DSP pads are visual-only.
 */

const soundFx = [
  { icon: PartyPopperIcon, label: 'Cheer & Clap' },
  { icon: Megaphone01Icon, label: 'Airhorn' },
  { icon: DrumIcon, label: 'Drum Roll' },
  { icon: WhistleIcon, label: 'Whistle' },
]

/**
 * The catalog row the console is playing: the hub fields every entry point
 * carries, plus the admin bookkeeping the Media Hub's Play button adds
 * (`sourceName`, `coverName`, `isActive`, timestamps).
 */
type PreviewItem = MediaItem & Partial<AdminMediaItem>

interface AdminFact {
  label: string
  value: ReactNode
}

/**
 * The staff-only facts about the on-air row — the catalog fields the public
 * hub never shows (file and cover references, timestamps, the section's own
 * numbers). Only what the entry point carried renders: a row opened from the
 * hub has no bookkeeping, so those lines simply stay away.
 */
function adminFacts(item: PreviewItem): AdminFact[] {
  const facts: AdminFact[] = [{ label: 'Catalog ID', value: item.id }]
  if (item.artist) facts.push({ label: 'Artist', value: item.artist })
  if (item.album) facts.push({ label: 'Album', value: item.album })
  if (item.subtitle) {
    // The shared "subtitle" column wears a section name everywhere else too.
    facts.push({
      label: item.section === 'radio' ? 'Genre' : item.section === 'music' ? 'Description' : 'Subtitle',
      value: item.subtitle,
    })
  }
  if (item.tag) facts.push({ label: 'Tag', value: item.tag })

  if (item.section === 'video') {
    if (item.duration) facts.push({ label: 'Runtime', value: item.duration })
    if (item.plays !== null) facts.push({ label: 'Plays', value: item.plays.toLocaleString() })
  } else if (item.section === 'music') {
    if (item.duration) facts.push({ label: 'Runtime', value: item.duration })
    if (item.tempo) facts.push({ label: 'Tempo', value: item.tempo })
    if (item.songKey) facts.push({ label: 'Key', value: item.songKey })
  } else {
    if (item.freq) facts.push({ label: 'Frequency', value: item.freq })
    if (item.listeners !== null) {
      facts.push({ label: 'Listeners', value: item.listeners.toLocaleString() })
    }
  }

  facts.push({
    label: 'Source file',
    value: item.sourceUrl ? (
      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 transition hover:text-text-primary"
      >
        {item.sourceName ?? 'Open the uploaded file'}
      </a>
    ) : item.section === 'music' ? (
      'None — the hub card stays visual-only'
    ) : item.section === 'radio' ? (
      'None — radio rows carry no file'
    ) : (
      'None — the stage falls back to the bundled master'
    ),
  })
  facts.push({
    label: 'Cover',
    value: item.coverUrl ? (
      <a
        href={item.coverUrl}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 transition hover:text-text-primary"
      >
        {item.coverName ?? 'Open the uploaded image'}
      </a>
    ) : (
      'Default art'
    ),
  })
  if (item.createdAt) {
    facts.push({ label: 'Added', value: new Date(item.createdAt).toLocaleString() })
  }
  if (item.updatedAt) {
    facts.push({ label: 'Updated', value: new Date(item.updatedAt).toLocaleString() })
  }

  return facts
}

function AdminFactItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-bold tracking-widest text-text-muted uppercase">{label}</dt>
      <dd className="mt-0.5 break-words text-text-secondary">{children}</dd>
    </div>
  )
}

/**
 * Fisher–Yates copy of the row ids, seeded by the transport's shuffle seed:
 * the console derives its shuffled queue from (ids, seed) while rendering, so
 * the order is random yet pure — the same seed always yields the same
 * permutation, and a fresh seed (every time shuffle switches on) reshuffles.
 */
function seededShuffle(ids: string[], seed: number): string[] {
  // mulberry32 — a tiny seeded PRNG.
  let state = Math.floor(seed * 0x1_0000_0000) >>> 0 || 1
  const random = () => {
    state = (state + 0x6d2b_79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 0x1_0000_0000
  }
  const next = [...ids]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const swap = next[i]
    next[i] = next[j]
    next[j] = swap
  }
  return next
}

export default function PlayerQueue() {
  const {
    attachVideo,
    attachPlaylist,
    enterPip,
    toggle,
    playing,
    onAir,
    setOnAir,
    repeatMode,
    shuffle,
    shuffleSeed,
  } = useKaraokeVideoControls()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: session } = useSession()
  // Staff-only surface: the Admin details panel renders for admins only.
  const isAdmin = session?.user.role === 'admin'
  const videoRef = useRef<HTMLVideoElement | null>(null)
  // Video-card clicks arrive with `state.autoplay` and the catalog row in
  // `state.item` (see VideoSongSection / MusicPlayerSection; the Media Hub's
  // Play buttons pass the full admin row): start the song on arrival, and
  // play the row's uploaded file when it has one.
  const routeState = location.state as { autoplay?: boolean; item?: PreviewItem } | null
  const item = routeState?.item
  const autoplay = Boolean(routeState?.autoplay)

  // Lounge queue — shared studio state (lib/lounge-queue via the shell's
  // outlet context): the hub's card menus add to the same list, and every
  // edit here (add / remove / clear / drag-reorder) persists to localStorage.
  const {
    items: queueRows,
    add: addQueueItem,
    remove: removeRow,
    clear: clearQueue,
    move: moveRow,
  } = useLoungeQueue()
  const [addingTrack, setAddingTrack] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftArtist, setDraftArtist] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  // The queue row the console is playing — set by the bar's Previous/Next and
  // by the auto-advance when a song ends. Kept by id, so deleting or
  // reordering rows never switches the song under the singer.
  const [queueTrackId, setQueueTrackId] = useState<string | null>(null)
  // Bumped on every skip / auto-advance: the stage effect below then starts
  // playback (a fresh source, or the same master rewound to 0 when the row
  // carries no upload of its own).
  const [playToken, setPlayToken] = useState(0)
  // Shuffle's played songs, most recent last: the draw below never picks one
  // of them until a full round has played, and Previous pops them back.
  const shuffleHistoryRef = useRef<string[]>([])
  const queued = queueRows.find((row) => row.id === queueTrackId) ?? null

  // The catalog resolves every queue row to the exact file it must play (see
  // resolveQueueSource) — the id/file captured when queued, or the live row
  // its title points at. A failed fetch leaves captured sources in charge.
  const [catalog, setCatalog] = useState<MediaItem[]>([])
  useEffect(() => {
    let alive = true
    fetchMediaCatalog()
      .then((result) => {
        if (alive) setCatalog(result.items)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // The queued row's exact song, resolved against the catalog. Null = nothing
  // real behind the row (mock seeds, hand-typed entries, rows whose upload is
  // gone): the stage then falls back to the entry point rather than faking a
  // song, and the next skip resumes from that row's position in the list.
  const queuedPlay = useMemo(() => {
    if (!queued) return null
    const resolved = resolveQueueSource(queued, catalog)
    return resolved ? { row: queued, source: resolved } : null
  }, [queued, catalog])

  // The rail's order — which is the playlist's order too: the stored queue,
  // or, while the bar's Shuffle is on, the same rows in the random order its
  // seed derives (collated back to row objects, so nothing can get lost). The
  // stored arrangement is never touched, so turning shuffle off brings the
  // singer's own order back.
  const rowsInOrder = useMemo(() => {
    if (!shuffle) return queueRows
    const byId = new Map(queueRows.map((row) => [row.id, row]))
    return seededShuffle(
      queueRows.map((row) => row.id),
      shuffleSeed,
    ).flatMap((id) => {
      const row = byId.get(id)
      return row ? [row] : []
    })
  }, [queueRows, shuffle, shuffleSeed])

  // Playable rows in that order — the playlist the skips and the
  // auto-advance walk. Rows with nothing real behind them never enter it.
  const playableIds = useMemo(
    () => rowsInOrder.flatMap((row) => (resolveQueueSource(row, catalog) ? [row.id] : [])),
    [rowsInOrder, catalog],
  )

  // What the stage is playing: the skipped-to queue row's exact file (the
  // bundled master only for catalog video songs without an upload), else the
  // clicked row's upload, else the carried PiP session when expanding from
  // the mini (no card state), else the bundled master on a deep link.
  const source = queuedPlay
    ? (queuedPlay.source.src ?? localVideo)
    : (item?.sourceUrl ?? onAir?.src ?? localVideo)
  const audioMode = queuedPlay
    ? queuedPlay.source.kind === 'music'
    : (item?.section ?? onAir?.kind) === 'music'
  const trackTitle = queuedPlay ? queuedPlay.row.title : (item?.title ?? onAir?.title ?? 'The Reason')
  const trackSubtitle = queuedPlay
    ? queuedPlay.row.artist || null
    : item
      ? (item.artist ?? item.subtitle)
      : onAir
        ? onAir.subtitle || null
        : 'Hoobastank'
  // Poster: the row's cover / generated thumbnail before the bundled
  // placeholder art — the stage shows a real image while the file loads.
  const coverSrc = queuedPlay ? queuedPlay.row.coverUrl : (item?.coverUrl ?? onAir?.coverUrl ?? null)
  // Which queue row reads as "now playing": the explicitly skipped one, or
  // the row whose title matches the entry point's song (a card click that is
  // also queued). Never guessed for the bundled default.
  const playingRowId =
    queuedPlay?.row.id ??
    queueRows.find((row) => row.title.toLowerCase() === trackTitle.toLowerCase())?.id ??
    null

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

  /**
   * Skip through the playlist — the bar's Previous/Next and the auto-advance
   * at the end of a song share this. In order (the bar's Shuffle off) it
   * steps through the queue's real songs: the stored order, an off-playlist
   * song (a card click, the bundled master) starting from its own row when
   * the queue has one, repeat all wrapping around either end and repeat off
   * stopping at the end. With Shuffle on it draws instead: every skip and
   * every finished song plays a random song the round has not played yet —
   * nothing repeats until a full round is done, when a fresh round starts —
   * and Previous walks the round's played songs back. With nothing playable
   * both are no-ops.
   */
  const advance = useCallback(
    (step: 1 | -1) => {
      if (playableIds.length === 0) return

      const currentId =
        queued?.id ??
        queueRows.find((row) => row.title.toLowerCase() === trackTitle.toLowerCase())?.id ??
        null

      if (shuffle) {
        const history = shuffleHistoryRef.current

        if (step === -1) {
          // Previous walks back through the round's played songs (rows that
          // are gone by now are dropped); with nothing played yet a skip back
          // simply draws like a forward one — a shuffled round has no order.
          while (history.length > 0) {
            const previous = history.pop()
            if (previous !== undefined && playableIds.includes(previous)) {
              setQueueTrackId(previous)
              setPlayToken((token) => token + 1)
              return
            }
          }
        }

        // The draw: a random song the round has not used yet and that is not
        // the current one — so a round never repeats until it has played them
        // all. Then a fresh round starts, still avoiding the song just heard.
        const played = new Set(history)
        let pool = playableIds.filter((id) => id !== currentId && !played.has(id))
        if (pool.length === 0) {
          shuffleHistoryRef.current = []
          pool = playableIds.filter((id) => id !== currentId)
          if (pool.length === 0) pool = playableIds
        }
        const pick = pool[Math.floor(Math.random() * pool.length)]
        if (currentId !== null) shuffleHistoryRef.current.push(currentId)
        setQueueTrackId(pick)
        setPlayToken((token) => token + 1)
        return
      }

      const currentIndex = currentId === null ? -1 : playableIds.indexOf(currentId)
      let index = currentIndex === -1 ? (step === 1 ? 0 : -1) : currentIndex + step
      if (index < 0 || index >= playableIds.length) {
        // Repeat all wraps the queue around; repeat off stops at either end.
        if (repeatMode !== 'all') return
        index = step === 1 ? 0 : playableIds.length - 1
      }
      setQueueTrackId(playableIds[index])
      setPlayToken((token) => token + 1)
    },
    [playableIds, queueRows, queued, trackTitle, shuffle, repeatMode],
  )

  // The bar's Previous/Next call through the transport; the console
  // re-registers whenever the queue or the playing row changes.
  useEffect(() => {
    return attachPlaylist({ previous: () => advance(-1), next: () => advance(1) })
  }, [attachPlaylist, advance])

  // Skip / auto-advance playback: a different source has to load (start on
  // canplay) while a same-source skip (the bundled master) only rewinds —
  // starter rejections are swallowed, so ERROR-002 stays clean.
  useEffect(() => {
    if (playToken === 0) return
    const el = videoRef.current
    if (!el) return
    el.currentTime = 0
    if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      void el.play().catch(() => {})
      return
    }
    const start = () => void el.play().catch(() => {})
    el.addEventListener('canplay', start, { once: true })
    return () => el.removeEventListener('canplay', start)
  }, [playToken])

  const addTrack = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = draftTitle.trim()
    if (!title) return
    addQueueItem({ title, artist: draftArtist.trim() })
    setDraftTitle('')
    setDraftArtist('')
    setAddingTrack(false)
  }

  // Announce the on-air track to the shell transport: the bar shows its
  // metadata and the floating mini mirrors its source — the entry-point row
  // first, then whatever Previous/Next or the auto-advance puts on stage. A
  // deep link (no card state) leaves the transport's session alone — that is
  // the expand-from-PiP path, where the mini already carries the right track.
  useEffect(() => {
    if (queuedPlay) {
      setOnAir({
        title: queuedPlay.row.title,
        subtitle: queuedPlay.row.artist,
        src: queuedPlay.source.src ?? localVideo,
        coverUrl: queuedPlay.row.coverUrl,
        kind: queuedPlay.source.kind,
      })
      return
    }
    if (!item) return
    setOnAir({
      title: item.title,
      subtitle: item.artist ?? item.subtitle ?? '',
      src: item.sourceUrl ?? localVideo,
      coverUrl: item.coverUrl,
      kind: item.section === 'music' ? 'music' : 'video',
    })
  }, [item, queuedPlay, setOnAir])

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
            Queue: {queueRows.length}/24
          </span>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Stage column — the player takes the wide left side. */}
        <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-1">
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
                onEnded={() => {
                  handleStop()
                  // Song over → roll onto the next queued row and start it.
                  advance(1)
                }}
                onError={() => {
                  // A queued song whose file is gone from the server hands over
                  // to the next playable row instead of parking on a dead stage.
                  if (queuedPlay) advance(1)
                }}
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

          {/* Staff-only: the catalog row behind the stage. Fed by the entry
              point's history state — a Media Hub Play click carries the full
              admin row, a hub card the public fields; regular users never
              render this. */}
          {isAdmin && item && (
            <section
              aria-label="Admin details"
              className="rounded-2xl border border-primary/30 bg-surface px-4 py-4"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="flex items-center gap-2 font-heading text-base font-bold tracking-wide uppercase">
                  <HugeiconsIcon icon={Shield01Icon} size={15} className="text-primary" />
                  Admin details
                </h2>
                <span className="rounded border border-primary/40 bg-primary-soft/40 px-2 py-0.5 text-[9px] font-bold tracking-widest text-primary uppercase">
                  Staff only
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">
                  {MEDIA_SECTION_LABELS[item.section]}
                  {item.isActive !== undefined
                    ? item.isActive
                      ? ' · Live on the hub'
                      : ' · Hidden from the hub'
                    : ''}
                </span>
                <Link
                  to={`/admin/media/${item.id}`}
                  className="ml-auto text-[10px] font-bold tracking-widest text-primary uppercase transition hover:text-primary-hover"
                >
                  Edit item
                </Link>
              </div>

              <dl className="mt-4 grid gap-x-6 gap-y-3 text-[11px] sm:grid-cols-2 xl:grid-cols-3">
                {adminFacts(item).map((fact) => (
                  <AdminFactItem key={fact.label} label={fact.label}>
                    {fact.value}
                  </AdminFactItem>
                ))}
              </dl>

              {item.lyrics && (
                <details className="mt-4 rounded-lg border border-border bg-background">
                  <summary className="cursor-pointer px-3.5 py-2.5 text-[10px] font-bold tracking-widest text-text-secondary uppercase">
                    Lyrics — {item.lyrics.split('\n').length} lines
                  </summary>
                  <p className="max-h-72 overflow-auto border-t border-border px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap text-text-secondary">
                    {item.lyrics}
                  </p>
                </details>
              )}
            </section>
          )}

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

          {/* Upcoming Lounge Queue moved to the right rail — see the section
              below the stage column. */}
        </div>

        {/* Upcoming Lounge Queue — right rail. Local mockup state: add a
            custom track (header or empty state), remove a row, clear all, or
            drag the grip handle to reorder — paused while the bar's Shuffle
            shows a random order. */}
        <section className="min-w-0 rounded-2xl border border-border bg-surface px-3.5 py-3.5 lg:col-start-2 lg:row-start-1 lg:self-start">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h2 className="flex items-center gap-2 font-heading text-base font-bold tracking-wide uppercase">
              <HugeiconsIcon icon={Queue01Icon} size={15} className="text-primary" />
              Upcoming Lounge Queue
            </h2>
            <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-text-primary">
              {queueRows.length > 0 ? `+${queueRows.length} waiting` : 'Empty'}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              aria-expanded={addingTrack || queueRows.length === 0}
              onClick={() => setAddingTrack((open) => !open)}
              disabled={queueRows.length === 0}
              className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-text-secondary uppercase transition hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={13} />
              Add Custom Track
            </button>
            <button
              type="button"
              onClick={clearQueue}
              disabled={queueRows.length === 0}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-text-muted transition hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={13} />
              Clear All
            </button>
          </div>

          {(queueRows.length === 0 || addingTrack) && (
            <div className="mt-3 rounded-lg border border-dashed border-border px-3 py-3">
              {queueRows.length === 0 && (
                <div className="text-center">
                  <HugeiconsIcon icon={Queue01Icon} size={20} className="mx-auto text-text-muted" />
                  <p className="mt-2 text-xs font-semibold">The lounge queue is empty</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-text-muted">
                    Add the first song and keep the night moving.
                  </p>
                </div>
              )}
              <form
                onSubmit={addTrack}
                aria-label="Add a track to the queue"
                className={`space-y-2 ${queueRows.length === 0 ? 'mt-3' : ''}`}
              >
                <label className="block">
                  <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase">Song title</span>
                  <input
                    required
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    placeholder="e.g. Beautiful Things"
                    className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-[9px] font-bold tracking-widest text-text-muted uppercase">
                    Artist (optional)
                  </span>
                  <input
                    value={draftArtist}
                    onChange={(event) => setDraftArtist(event.target.value)}
                    placeholder="e.g. Benson Boone"
                    className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[10px] font-bold text-text-primary transition hover:bg-primary-hover"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={12} />
                    Add to queue
                  </button>
                  {addingTrack && queueRows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingTrack(false)
                        setDraftTitle('')
                        setDraftArtist('')
                      }}
                      className="text-[10px] font-semibold text-text-muted transition hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {queueRows.length > 0 && (
            <ul className="mt-3 space-y-2">
              {rowsInOrder.map((row, index) => {
                const meta = [row.artist, row.genre].filter(Boolean).join(' · ')
                return (
                  <li
                    key={row.id}
                    onDragOver={(event) => {
                      event.preventDefault()
                      // Reordering edits the stored arrangement, so it is
                      // paused while shuffle shows a derived order.
                      if (shuffle || dragIndex === null) return
                      event.dataTransfer.dropEffect = 'move'
                      if (dragIndex !== index) {
                        moveRow(dragIndex, index)
                        setDragIndex(index)
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      setDragIndex(null)
                    }}
                    onDragEnd={() => setDragIndex(null)}
                    className={`flex items-center gap-2 rounded-lg border px-2 py-2 transition ${
                      row.id === playingRowId
                        ? 'border-primary/60 bg-primary-soft/15'
                        : 'border-border/60 bg-surface-elevated/40'
                    } ${dragIndex === index ? 'opacity-60' : ''}`}
                  >
                    <button
                      type="button"
                      draggable={!shuffle}
                      aria-label={`Reorder ${row.title}`}
                      aria-disabled={shuffle || undefined}
                      title={shuffle ? 'Shuffle is on — turn it off to reorder' : 'Drag to reorder'}
                      onDragStart={
                        shuffle
                          ? undefined
                          : (event) => {
                              setDragIndex(index)
                              event.dataTransfer.effectAllowed = 'move'
                              event.dataTransfer.setData('text/plain', row.id)
                            }
                      }
                      className={`grid size-6 shrink-0 place-items-center rounded-md text-text-muted transition ${
                        shuffle
                          ? 'cursor-not-allowed opacity-40'
                          : 'cursor-grab hover:bg-surface-elevated hover:text-text-primary active:cursor-grabbing'
                      }`}
                    >
                      <HugeiconsIcon icon={GripVerticalIcon} size={13} />
                    </button>
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary-soft text-[9px] font-bold text-primary tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <img src={row.coverUrl ?? placeholderAlbum} alt="" className="size-9 shrink-0 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{row.title}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {meta && (
                          <p className="truncate text-[9px] text-text-muted">
                            {meta}
                            {row.len ? ` (${row.len})` : ''}
                          </p>
                        )}
                        {row.tags.map((tag) => (
                          <span
                            key={tag.label}
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] tracking-wide uppercase ${
                              tag.solid
                                ? 'bg-primary font-bold text-text-primary'
                                : 'border border-border font-semibold text-text-secondary'
                            }`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        aria-label={`Lyrics for ${row.title}`}
                        className="grid size-6 place-items-center rounded-md text-text-muted transition hover:bg-surface-elevated hover:text-text-primary"
                      >
                        <HugeiconsIcon icon={TextIcon} size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        aria-label={`Remove ${row.title}`}
                        className="grid size-6 place-items-center rounded-md text-text-muted transition hover:bg-surface-elevated hover:text-error"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={13} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
