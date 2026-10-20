import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import localVideo from '../assets/video_local/the-reason.mp4'
import AdminDetailsPanel from '../components/console/AdminDetailsPanel'
import ConsoleStatusStrip from '../components/console/ConsoleStatusStrip'
import DspSection from '../components/console/DspSection'
import LoungeQueueRail from '../components/console/LoungeQueueRail'
import StageSection from '../components/console/StageSection'
import { seededShuffle } from '../components/console/playlist'
import type { PreviewItem } from '../components/console/types'
import { fetchAdminMedia } from '../lib/admin-api'
import { useSession } from '../lib/auth-client'
import { useKaraokeVideoControls } from '../lib/karaoke-player'
import { resolveQueueSource, useLoungeQueue, type QueueItem } from '../lib/lounge-queue'
import { fetchMediaCatalog, type AdminMediaItem, type MediaItem } from '../lib/media-api'

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
 * the catalog row behind the current song — artist/album/tempo, file and cover
 * references, visibility, timestamps, lyrics. It follows the stage: the row
 * behind a skipped song is resolved from the admin catalog (fetched once for
 * staff), falling back to the entry point's public fields. Regular users never
 * render it.
 *
 * The lounge queue is shared studio state (lib/lounge-queue → the shell's
 * queue context): card menus on the hub add rows, this page adds a custom
 * track from the empty state or the header, removes a row, clears all, and
 * drag-reorders with the grip handle — all persisted to localStorage. The
 * bar's Previous/Next skip through that list and a finished song advances to
 * the next queued row on its own, autoplaying it (a row plays its uploaded
 * file when it has one, the bundled master otherwise); the row on air is
 * highlighted in the rail. DSP pads are visual-only.
 *
 * The presentational blocks live in components/console: status strip, stage
 * (with its badge timer), admin panel, DSP strip and the queue rail. This
 * page stays the state owner: the transport wiring, playlist resolution,
 * shuffle round and drag/add/clear handlers.
 */

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
  // queue context): the hub's card menus add to the same list, and every
  // edit here (add / remove / clear / drag-reorder) persists to localStorage.
  const {
    items: queueRows,
    add: addQueueItem,
    remove: removeRow,
    clear: clearQueue,
    move: moveRow,
  } = useLoungeQueue()
  // The queue row the console is playing — set by the bar's Previous/Next and
  // by the auto-advance when a song ends. Kept by id, so deleting or
  // reordering rows never switches the song under the singer.
  const [queueTrackId, setQueueTrackId] = useState<string | null>(null)
  // Bumped on every skip / auto-advance: the stage effect below then starts
  // playback (a fresh source, or the same master rewound to 0 when the row
  // carries no upload of its own).
  const [playToken, setPlayToken] = useState(0)
  // Shuffle's played songs, most recent last: Previous walks them back.
  const shuffleHistoryRef = useRef<string[]>([])
  // Every song the current shuffle round has played, including the one
  // Previous left behind — the forward draw must not replay it until the
  // round is exhausted (clear the set below) and a fresh one starts.
  const shufflePlayedRef = useRef<Set<string>>(new Set())
  // Turning Shuffle on starts a fresh round: a half-played round from an
  // earlier shuffle session must not leak into the new one.
  useEffect(() => {
    shuffleHistoryRef.current = []
    shufflePlayedRef.current.clear()
  }, [shuffle])
  // Queue rows whose file failed to load this session: the console steps over
  // them, and stops when every remaining row has failed too, instead of
  // ping-ponging on the same dead files under repeat all.
  const failedRowsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    failedRowsRef.current.clear()
  }, [queueRows])

  const queued = queueRows.find((row) => row.id === queueTrackId) ?? null
  // The row last sent to the stage, kept as a snapshot: removing the on-air
  // row (or clearing the queue) must not swap the song out from under the
  // singer, so the stage keeps resolving it until a skip picks another one.
  const [lastQueuedRow, setLastQueuedRow] = useState<QueueItem | null>(null)
  const activeRow = queued ?? (queueTrackId !== null ? lastQueuedRow : null)

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

  // Staff panel data: the admin catalog carries the bookkeeping + lyrics the
  // public payload omits. Fetched once per admin session; a failure simply
  // leaves the panel on the entry point's public fields.
  const [adminCatalog, setAdminCatalog] = useState<AdminMediaItem[]>([])
  useEffect(() => {
    if (!isAdmin) return
    let alive = true
    fetchAdminMedia()
      .then((result) => {
        if (alive) setAdminCatalog(result.items)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [isAdmin])

  // The queued row's exact song, resolved against the catalog. Null = nothing
  // real behind the row (mock seeds, hand-typed entries, rows whose upload is
  // gone): the stage then falls back to the entry point rather than faking a
  // song, and the next skip resumes from that row's position in the list.
  const queuedPlay = useMemo(() => {
    if (!activeRow) return null
    const resolved = resolveQueueSource(activeRow, catalog)
    return resolved ? { row: activeRow, source: resolved } : null
  }, [activeRow, catalog])

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

  // The catalog row the staff panel describes: the admin row behind whatever
  // is on stage (by id, then title), the entry point's row when nothing is
  // playing, or null when the row has no live catalog match — never another
  // song's details after a skip.
  const panelItem = useMemo<PreviewItem | null>(() => {
    if (!queuedPlay) {
      if (!item) return null
      return adminCatalog.find((candidate) => candidate.id === item.id) ?? item
    }
    const row = queuedPlay.row
    const title = row.title.trim().toLowerCase()
    const fromAdmin =
      (row.mediaId !== null
        ? adminCatalog.find((candidate) => candidate.id === row.mediaId)
        : undefined) ??
      adminCatalog.find(
        (candidate) => candidate.section !== 'radio' && candidate.title.trim().toLowerCase() === title,
      )
    if (fromAdmin) return fromAdmin
    return (
      (row.mediaId !== null ? catalog.find((candidate) => candidate.id === row.mediaId) : undefined) ??
      catalog.find(
        (candidate) => candidate.section !== 'radio' && candidate.title.trim().toLowerCase() === title,
      ) ??
      null
    )
  }, [queuedPlay, item, adminCatalog, catalog])

  // Where the on-air row sat when it left the queue: the next skip (or the
  // end-of-song auto-advance) resumes from that slot instead of restarting
  // the list from the top. Built from the current playable order; rows that
  // disappear later are stepped over. The next skip or a queue edit clears it.
  const removedSlotRef = useRef<{ forward: string[]; backward: string[] } | null>(null)
  const rememberRemovedSlot = useCallback(
    (id: string) => {
      const index = playableIds.indexOf(id)
      if (index === -1) return
      removedSlotRef.current = {
        forward: playableIds.slice(index + 1),
        backward: playableIds.slice(0, index),
      }
    },
    [playableIds],
  )

  /** Remove a row; when it is the on-air one, remember its queue slot. */
  const handleRemoveRow = useCallback(
    (id: string) => {
      if (id === activeRow?.id) rememberRemovedSlot(id)
      removeRow(id)
    },
    [activeRow?.id, rememberRemovedSlot, removeRow],
  )

  /** Clear the queue; the on-air song keeps playing from its remembered slot. */
  const handleClearQueue = useCallback(() => {
    if (queued) rememberRemovedSlot(queued.id)
    clearQueue()
  }, [queued, rememberRemovedSlot, clearQueue])

  /** Reordering invalidates the remembered slot (the order it was built on). */
  const handleMoveRow = useCallback(
    (from: number, to: number) => {
      removedSlotRef.current = null
      moveRow(from, to)
    },
    [moveRow],
  )

  /**
   * Sends one queue row to the stage. The snapshot travels with the id: the
   * live row can disappear from the queue, the song on stage cannot.
   */
  const goToRow = useCallback(
    (id: string) => {
      setQueueTrackId(id)
      setLastQueuedRow(queueRows.find((row) => row.id === id) ?? null)
      setPlayToken((token) => token + 1)
      removedSlotRef.current = null
    },
    [queueRows],
  )

  /**
   * Skip through the playlist — the bar's Previous/Next and the auto-advance
   * at the end of a song share this. In order (the bar's Shuffle off) it
   * steps through the queue's real songs: the stored order, an off-playlist
   * song (a card click, the bundled master) starting from its own row when
   * the queue has one, repeat all wrapping around either end and repeat off
   * stopping at the end. A row that left the queue while on air keeps playing,
   * and the next skip resumes from the slot it occupied. With Shuffle on it draws instead: every skip and
   * every finished song plays a random song the round has not played yet —
   * nothing repeats until a full round is done, when a fresh round starts —
   * and Previous walks the round's played songs back. With nothing playable
   * both are no-ops.
   */
  const advance = useCallback(
    (step: 1 | -1) => {
      if (playableIds.length === 0) return

      const currentId =
        activeRow?.id ??
        queueRows.find((row) => row.title.toLowerCase() === trackTitle.toLowerCase())?.id ??
        null

      if (shuffle) {
        const history = shuffleHistoryRef.current
        const played = shufflePlayedRef.current

        if (step === -1) {
          // Previous walks back through the round's played songs (rows that
          // are gone by now are dropped); with nothing played yet a skip back
          // simply draws like a forward one — a shuffled round has no order.
          while (history.length > 0) {
            const previous = history.pop()
            if (previous !== undefined && playableIds.includes(previous)) {
              // The song being left behind stays in this round's played set,
              // so a following Next draws a new song instead of replaying it.
              if (currentId !== null) played.add(currentId)
              goToRow(previous)
              return
            }
          }
        }

        // The draw: a random song the round has not used yet and that is not
        // the current one — so a round never repeats until it has played them
        // all. Then a fresh round starts, still avoiding the song just heard.
        let pool = playableIds.filter((id) => id !== currentId && !played.has(id))
        if (pool.length === 0) {
          // The round is exhausted; keep the Previous history so the skips
          // can still walk back, but every song is drawable again.
          played.clear()
          pool = playableIds.filter((id) => id !== currentId)
          if (pool.length === 0) pool = playableIds
        }
        const pick = pool[Math.floor(Math.random() * pool.length)]
        if (currentId !== null) {
          history.push(currentId)
          played.add(currentId)
        }
        if (pick !== undefined) goToRow(pick)
        return
      }

      const currentIndex = currentId === null ? -1 : playableIds.indexOf(currentId)

      // The on-air row left the queue after it was sent to the stage: resume
      // from the slot it occupied instead of restarting from the top. Rows
      // removed since are stepped over.
      if (currentIndex === -1 && removedSlotRef.current) {
        const slot = removedSlotRef.current
        const resumeId = (step === 1 ? slot.forward : slot.backward).find((id) =>
          playableIds.includes(id),
        )
        if (resumeId !== undefined) {
          goToRow(resumeId)
          return
        }
        // Nothing left on that side of the slot: repeat all wraps, repeat off
        // stops there (the snapshot keeps playing).
        if (repeatMode !== 'all') return
        const wrapped = step === 1 ? playableIds[0] : playableIds[playableIds.length - 1]
        if (wrapped !== undefined) goToRow(wrapped)
        return
      }

      let index = currentIndex === -1 ? (step === 1 ? 0 : -1) : currentIndex + step
      if (index < 0 || index >= playableIds.length) {
        // Repeat all wraps the queue around; repeat off stops at either end.
        if (repeatMode !== 'all') return
        index = step === 1 ? 0 : playableIds.length - 1
      }
      const next = playableIds[index]
      if (next !== undefined) goToRow(next)
    },
    [playableIds, queueRows, activeRow, trackTitle, shuffle, repeatMode, goToRow],
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

  /** Rail's add form — a new row invalidates the remembered removal slot. */
  const handleAddTrack = useCallback(
    (title: string, artist: string) => {
      removedSlotRef.current = null
      addQueueItem({ title, artist })
    },
    [addQueueItem],
  )

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
    }
  }, [attachVideo, autoplay])

  // A queued song whose file is gone from the server hands over to the next
  // playable row instead of parking on a dead stage. When every remaining row
  // has failed too, it stops rather than looping through the same broken files.
  const handleMediaError = useCallback(() => {
    if (!queuedPlay) return
    failedRowsRef.current.add(queuedPlay.row.id)
    const remaining = playableIds.filter((id) => !failedRowsRef.current.has(id))
    if (remaining.length === 0) return
    advance(1)
  }, [queuedPlay, playableIds, advance])

  // A row that really loaded is healthy again — later rounds may retry it.
  const handleMediaLoaded = useCallback(() => {
    if (queuedPlay) failedRowsRef.current.delete(queuedPlay.row.id)
  }, [queuedPlay])

  // PiP hand-off: arm the shell's mini player and drop back to the hub.
  const handleEnterPip = useCallback(() => {
    enterPip()
    navigate('/studio')
  }, [enterPip, navigate])

  return (
    <div>
      <ConsoleStatusStrip queueCount={queueRows.length} />

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Stage column — the player takes the wide left side. */}
        <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-1">
          <StageSection
            videoRef={videoRef}
            source={source}
            coverSrc={coverSrc}
            audioMode={audioMode}
            trackTitle={trackTitle}
            trackSubtitle={trackSubtitle}
            playing={playing}
            onToggle={toggle}
            onEnded={() => advance(1)}
            onMediaError={handleMediaError}
            onMediaLoaded={handleMediaLoaded}
            onEnterPip={handleEnterPip}
          />

          {/* Staff-only: the catalog row behind the stage. The entry point's
              history state seeds it (a Media Hub Play click carries the full
              admin row, a hub card the public fields); after a skip the admin
              catalog resolves the row on stage. Regular users never render
              this. */}
          {isAdmin && panelItem && <AdminDetailsPanel item={panelItem} />}

          <DspSection />
        </div>

        <LoungeQueueRail
          rows={rowsInOrder}
          totalCount={queueRows.length}
          playingRowId={playingRowId}
          shuffle={shuffle}
          onAdd={handleAddTrack}
          onRemove={handleRemoveRow}
          onClear={handleClearQueue}
          onMove={handleMoveRow}
        />
      </div>
    </div>
  )
}
