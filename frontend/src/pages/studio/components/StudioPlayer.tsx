import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import localVideo from '../../../assets/video_local/the-reason.mp4'
import AdminDetailsPanel from '../../../components/console/AdminDetailsPanel'
import ConsoleStatusStrip from '../../../components/console/ConsoleStatusStrip'
import DspSection from '../../../components/console/DspSection'
import LoungeQueueRail from '../../../components/console/LoungeQueueRail'
import StageSection from '../../../components/console/StageSection'
import { seededShuffle } from '../../../components/console/playlist'
import type { PreviewItem } from '../../../components/console/types'
import { fetchAdminMedia } from '../../../lib/admin-api'
import { useSession } from '../../../lib/auth-client'
import type { KaraokeVideoApi, PlayerViewMode } from '../../../lib/karaoke-player'
import { usePageTitle } from '../../../lib/page-title'
import { resolveQueueSource, useLoungeQueue, type QueueItem } from '../../../lib/lounge-queue'
import { fetchMediaCatalog, type AdminMediaItem, type MediaItem } from '../../../lib/media-api'

export default function StudioPlayer({ player }: { player: KaraokeVideoApi }) {
  const {
    attachVideo,
    attachPlaylist,
    enterPip,
    exitPip,
    pip,
    toggle,
    playing,
    onAir,
    setOnAir,
    repeatMode,
    shuffle,
    shuffleSeed,
  } = player
  const location = useLocation()
  const navigate = useNavigate()
  const { data: session } = useSession()
  const isAdmin = session?.user.role === 'admin'
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const routeState = location.state as { autoplay?: boolean; item?: PreviewItem } | null
  const item = routeState?.item
  const autoplay = Boolean(routeState?.autoplay)
  const onConsole = location.pathname.startsWith('/studio/player-queue')
  const mode: PlayerViewMode = onConsole ? 'expanded' : pip ? 'mini' : 'hidden'
  const expanded = mode === 'expanded'

  const {
    items: queueRows,
    remove: removeRow,
    clear: clearQueue,
    move: moveRow,
  } = useLoungeQueue()

  // A card navigation is a new history entry. Queue selections are tied to the
  // item navigation they were made from, so clicking another card starts that
  // card instead of leaving the old queue row on air. The state update is
  // guarded and happens during render so the old source never wins a frame.
  const itemLocationKey = item ? location.key : null
  const [lastItemLocationKey, setLastItemLocationKey] = useState<string | null>(null)
  if (itemLocationKey !== null && itemLocationKey !== lastItemLocationKey) {
    setLastItemLocationKey(itemLocationKey)
  }
  const itemSessionKey = itemLocationKey ?? lastItemLocationKey
  const [queueSelection, setQueueSelection] = useState<{
    id: string
    itemSessionKey: string | null
  } | null>(null)
  const queueTrackId =
    queueSelection && queueSelection.itemSessionKey === itemSessionKey ? queueSelection.id : null
  const [playToken, setPlayToken] = useState(0)
  const shuffleHistoryRef = useRef<string[]>([])
  const shufflePlayedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    shuffleHistoryRef.current = []
    shufflePlayedRef.current.clear()
  }, [shuffle])
  const failedRowsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    failedRowsRef.current.clear()
  }, [queueRows])

  const queued = queueRows.find((row) => row.id === queueTrackId) ?? null
  const [lastQueuedRow, setLastQueuedRow] = useState<QueueItem | null>(null)
  const activeRow = queued ?? (queueTrackId !== null ? lastQueuedRow : null)

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

  const queuedPlay = useMemo(() => {
    if (!activeRow) return null
    const resolved = resolveQueueSource(activeRow, catalog)
    return resolved ? { row: activeRow, source: resolved } : null
  }, [activeRow, catalog])

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

  const playableIds = useMemo(
    () => rowsInOrder.flatMap((row) => (resolveQueueSource(row, catalog) ? [row.id] : [])),
    [rowsInOrder, catalog],
  )

  const source = queuedPlay
    ? (queuedPlay.source.src ?? localVideo)
    : (item?.sourceUrl ?? onAir?.src ?? localVideo)
  const audioMode = queuedPlay
    ? queuedPlay.source.kind === 'music'
    : (item?.section ?? onAir?.kind) === 'music'
  const trackTitle = queuedPlay ? queuedPlay.row.title : (item?.title ?? onAir?.title ?? 'The Reason')
  usePageTitle(expanded ? trackTitle.trim() || null : null)
  const trackSubtitle = queuedPlay
    ? queuedPlay.row.artist || null
    : item
      ? (item.artist ?? item.subtitle)
      : onAir
        ? onAir.subtitle || null
        : 'Hoobastank'
  const coverSrc = queuedPlay ? queuedPlay.row.coverUrl : (item?.coverUrl ?? onAir?.coverUrl ?? null)
  const playingRowId =
    queuedPlay?.row.id ??
    queueRows.find((row) => row.title.toLowerCase() === trackTitle.toLowerCase())?.id ??
    null

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

  const handleRemoveRow = useCallback(
    (id: string) => {
      if (id === activeRow?.id) rememberRemovedSlot(id)
      removeRow(id)
    },
    [activeRow?.id, rememberRemovedSlot, removeRow],
  )

  const handleClearQueue = useCallback(() => {
    if (queued) rememberRemovedSlot(queued.id)
    clearQueue()
  }, [queued, rememberRemovedSlot, clearQueue])

  const handleMoveRow = useCallback(
    (from: number, to: number) => {
      removedSlotRef.current = null
      moveRow(from, to)
    },
    [moveRow],
  )

  const goToRow = useCallback(
    (id: string) => {
      setQueueSelection({ id, itemSessionKey })
      setLastQueuedRow(queueRows.find((row) => row.id === id) ?? null)
      setPlayToken((token) => token + 1)
      removedSlotRef.current = null
    },
    [itemSessionKey, queueRows],
  )

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
          while (history.length > 0) {
            const previous = history.pop()
            if (previous !== undefined && playableIds.includes(previous)) {
              if (currentId !== null) played.add(currentId)
              goToRow(previous)
              return
            }
          }
        }

        let pool = playableIds.filter((id) => id !== currentId && !played.has(id))
        if (pool.length === 0) {
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

      if (currentIndex === -1 && removedSlotRef.current) {
        const slot = removedSlotRef.current
        const resumeId = (step === 1 ? slot.forward : slot.backward).find((id) =>
          playableIds.includes(id),
        )
        if (resumeId !== undefined) {
          goToRow(resumeId)
          return
        }
        if (repeatMode !== 'all') return
        const wrapped = step === 1 ? playableIds[0] : playableIds[playableIds.length - 1]
        if (wrapped !== undefined) goToRow(wrapped)
        return
      }

      let index = currentIndex === -1 ? (step === 1 ? 0 : -1) : currentIndex + step
      if (index < 0 || index >= playableIds.length) {
        if (repeatMode !== 'all') return
        index = step === 1 ? 0 : playableIds.length - 1
      }
      const next = playableIds[index]
      if (next !== undefined) goToRow(next)
    },
    [playableIds, queueRows, activeRow, trackTitle, shuffle, repeatMode, goToRow],
  )

  useEffect(() => {
    return attachPlaylist({ previous: () => advance(-1), next: () => advance(1) })
  }, [attachPlaylist, advance])

  useEffect(() => {
    if (playToken === 0) return
    const el = videoRef.current
    if (!el) return
    el.currentTime = 0
    // play() starts the resource load itself. Waiting for canplay first would
    // deadlock when the hidden surface uses preload="none" on a new source.
    void el.play().catch(() => {})
  }, [playToken])

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

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    return attachVideo(el)
  }, [attachVideo])

  useEffect(() => {
    if (!autoplay || queueTrackId !== null) return
    const el = videoRef.current
    if (!el) return
    void el.play().catch(() => {})
  }, [autoplay, item?.id, queueTrackId])

  const handleMediaError = useCallback(() => {
    if (!queuedPlay) return
    failedRowsRef.current.add(queuedPlay.row.id)
    const remaining = playableIds.filter((id) => !failedRowsRef.current.has(id))
    if (remaining.length === 0) return
    advance(1)
  }, [queuedPlay, playableIds, advance])

  const handleMediaLoaded = useCallback(() => {
    if (queuedPlay) failedRowsRef.current.delete(queuedPlay.row.id)
  }, [queuedPlay])

  const handleEnterPip = useCallback(() => {
    enterPip()
    navigate('/studio')
  }, [enterPip, navigate])

  const handleExpand = useCallback(() => {
    navigate('/studio/player-queue')
  }, [navigate])

  const handleCloseMini = useCallback(() => {
    exitPip()
  }, [exitPip])

  const rootClass =
    mode === 'expanded'
      ? 'absolute inset-0 z-30 overflow-y-auto overscroll-contain bg-background p-4 sm:p-6'
      : mode === 'mini'
        ? 'fixed right-3 bottom-24 z-40 w-56 sm:right-4 sm:w-72'
        : 'invisible pointer-events-none fixed top-0 left-0 h-px w-px overflow-hidden'

  return (
    <div
      data-player-mode={mode}
      role={mode === 'mini' ? 'complementary' : undefined}
      aria-label={mode === 'mini' ? 'Mini player' : undefined}
      aria-hidden={mode === 'hidden' ? true : undefined}
      inert={mode === 'hidden' ? true : undefined}
      className={rootClass}
    >
      {expanded && <ConsoleStatusStrip queueCount={queueRows.length} />}

      <div
        className={
          expanded ? 'mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]' : undefined
        }
      >
        <div
          className={
            expanded ? 'min-w-0 space-y-5 lg:col-start-1 lg:row-start-1' : undefined
          }
        >
          <StageSection
            videoRef={videoRef}
            source={source}
            coverSrc={coverSrc}
            audioMode={audioMode}
            trackTitle={trackTitle}
            trackSubtitle={trackSubtitle}
            playing={playing}
            mode={mode}
            onToggle={toggle}
            onEnded={() => advance(1)}
            onMediaError={handleMediaError}
            onMediaLoaded={handleMediaLoaded}
            onEnterPip={handleEnterPip}
            onExpand={handleExpand}
          />

          {expanded && isAdmin && panelItem && <AdminDetailsPanel item={panelItem} />}

          {expanded && <DspSection />}
        </div>

        {expanded && (
          <LoungeQueueRail
            rows={rowsInOrder}
            totalCount={queueRows.length}
            playingRowId={playingRowId}
            shuffle={shuffle}
            onRemove={handleRemoveRow}
            onClear={handleClearQueue}
            onMove={handleMoveRow}
          />
        )}
      </div>

      {mode === 'mini' && (
        <button
          type="button"
          aria-label="Close mini player"
          onClick={handleCloseMini}
          className="absolute top-1.5 left-1.5 z-10 grid size-7 place-items-center rounded-md bg-black/60 text-base leading-none text-text-primary backdrop-blur transition hover:bg-primary"
        >
          ×
        </button>
      )}
    </div>
  )
}
