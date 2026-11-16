import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useOutletContext } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  HeartIcon,
  InformationCircleIcon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  Queue01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { Popover, PopoverTrigger } from '../../../components/ui/popover'
import { cn } from '../../../lib/utils'
import { usePlaylistLibrary } from '../../../lib/playlist-library'
import { isActivePlayback } from '../../../lib/play-history'
import type { KaraokeVideoApi } from '../../../lib/karaoke-player'
import MediaCardMenu from './MediaCardMenu'
import AddToPlaylistDialog, {
  type PlaylistAddedNotice,
} from './playlists/AddToPlaylistDialog'
import { useLoungeQueue } from '../../../lib/lounge-queue'

interface MediaCardMeta {
  icon: IconSvgElement
  text: string
}

export type { MediaCardMeta }

interface MediaCardProps {
  tag: string
  icon: IconSvgElement
  title: string
  subtitle: string
  /** Second footer line for cards, e.g. the song's genre (real Album value). */
  genre?: string | null
  meta?: MediaCardMeta[]
  coverUrl?: string | null
  to?: string
  toState?: unknown
  queue?: { mediaId?: string; len?: string | null; src?: string | null; kind?: 'video' | 'music' }
  /** 'card' = artwork card (video songs), 'row' = list row (music/radio). */
  layout?: 'card' | 'row'
  duration?: string | null
}

const STRIPES = {
  backgroundImage:
    'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(244,244,242,0.035) 10px, rgba(244,244,242,0.035) 20px)',
}

export default function MediaCard({
  tag,
  icon,
  title,
  subtitle,
  genre = null,
  meta = [],
  coverUrl,
  to,
  toState,
  queue,
  layout = 'card',
  duration = null,
}: MediaCardProps) {
  const { add } = useLoungeQueue()
  const library = usePlaylistLibrary()
  const player = useOutletContext<KaraokeVideoApi>()
  const liked = library.isLiked({ title, artist: subtitle, mediaId: queue?.mediaId ?? null })
  const queueable = Boolean(queue && (queue.kind === 'video' || queue.src))
  const playlistable = queueable
  // The on-air track carries the screenshot's red outline on its card/row.
  const active = isActivePlayback(player.onAir, {
    mediaId: queue?.mediaId ?? null,
    title,
    kind: queue?.kind ?? 'video',
  })
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [playlistOpen, setPlaylistOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const addedTimer = useRef<number | null>(null)
  const [playlistNotice, setPlaylistNotice] = useState<PlaylistAddedNotice | null>(null)
  const [noticeVisible, setNoticeVisible] = useState(false)
  const noticeHideTimer = useRef<number | null>(null)
  const noticeRemoveTimer = useRef<number | null>(null)
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (addedTimer.current !== null) window.clearTimeout(addedTimer.current)
      if (noticeHideTimer.current !== null) window.clearTimeout(noticeHideTimer.current)
      if (noticeRemoveTimer.current !== null) window.clearTimeout(noticeRemoveTimer.current)
    },
    [],
  )

  const openOptions = (open: boolean) => {
    setOptionsOpen(open)
    if (!open) setAdded(false)
  }

  const addToQueue = () => {
    add({
      title,
      artist: subtitle,
      len: queue?.len ?? undefined,
      coverUrl: coverUrl ?? null,
      src: queue?.src ?? null,
      kind: queue?.kind,
      mediaId: queue?.mediaId ?? null,
    })
    setAdded(true)
    if (addedTimer.current !== null) window.clearTimeout(addedTimer.current)
    addedTimer.current = window.setTimeout(() => setAdded(false), 2000)
  }

  const openPlaylistDialog = () => {
    openOptions(false)
    setPlaylistOpen(true)
  }

  const showPlaylistNotice = (notice: PlaylistAddedNotice) => {
    if (noticeHideTimer.current !== null) window.clearTimeout(noticeHideTimer.current)
    if (noticeRemoveTimer.current !== null) window.clearTimeout(noticeRemoveTimer.current)
    setPlaylistNotice(notice)
    setNoticeVisible(true)
    noticeHideTimer.current = window.setTimeout(() => setNoticeVisible(false), 2000)
    noticeRemoveTimer.current = window.setTimeout(() => setPlaylistNotice(null), 2200)
  }

  const iconButton =
    'grid size-7 place-items-center rounded transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'

  const likeButton = (
    <button
      type="button"
      onClick={() =>
        library.toggleLiked({
          title,
          artist: subtitle,
          duration: queue?.len ?? undefined,
          coverUrl: coverUrl ?? null,
          sourceUrl: queue?.src ?? null,
          mediaId: queue?.mediaId ?? null,
          kind: queue?.kind,
        })
      }
      aria-label={`Like ${title}`}
      aria-pressed={liked}
      title={liked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
      className={cn(
        iconButton,
        liked ? 'text-primary' : 'text-text-muted hover:text-text-primary',
      )}
    >
      <HugeiconsIcon icon={HeartIcon} size={15} className={liked ? 'fill-current' : undefined} />
    </button>
  )

  const queueButton = queueable ? (
    <button
      type="button"
      onClick={addToQueue}
      aria-label={`Add ${title} to queue`}
      title={added ? 'Added to queue' : 'Add to queue'}
      className={cn(
        iconButton,
        added ? 'text-primary' : 'text-text-muted hover:text-text-primary',
      )}
    >
      <HugeiconsIcon icon={added ? Tick02Icon : Queue01Icon} size={15} />
    </button>
  ) : null

  const moreButton = (dotIcon: IconSvgElement) => (
    <Popover open={optionsOpen} onOpenChange={openOptions}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`More options for ${title}`}
          className={cn(iconButton, 'text-text-muted hover:text-text-primary')}
        >
          <HugeiconsIcon icon={dotIcon} size={15} />
        </button>
      </PopoverTrigger>

      <MediaCardMenu
        title={title}
        queueable={queueable}
        playlistable={playlistable}
        added={added}
        onAdd={addToQueue}
        onAddToPlaylist={openPlaylistDialog}
      />
    </Popover>
  )

  const dialogLayer = (
    <>
      <AddToPlaylistDialog
        open={playlistOpen}
        onOpenChange={setPlaylistOpen}
        onAdded={showPlaylistNotice}
        song={{
          title,
          artist: subtitle,
          duration: queue?.len ?? '',
          coverUrl: coverUrl ?? null,
          sourceUrl: queue?.src ?? null,
          mediaId: queue?.mediaId ?? null,
          kind: queue?.kind ?? 'video',
        }}
      />

      {playlistNotice
        ? createPortal(
            <div
              role="status"
              aria-live="polite"
              className={cn(
                'fixed right-4 bottom-24 left-4 z-[80] mx-auto flex max-w-sm items-start gap-3 rounded-xl border bg-surface/95 px-3.5 py-3 shadow-2xl backdrop-blur transition-all duration-200 ease-out sm:right-6 sm:left-auto sm:mx-0',
                noticeVisible
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-2 opacity-0',
                playlistNotice.tone === 'warning' ? 'border-warning/40' : 'border-success/40',
              )}
            >
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full',
                  playlistNotice.tone === 'warning'
                    ? 'bg-warning/15 text-warning'
                    : 'bg-success/15 text-success',
                )}
              >
                <HugeiconsIcon
                  icon={
                    playlistNotice.tone === 'warning' ? InformationCircleIcon : Tick02Icon
                  }
                  size={16}
                />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold">{playlistNotice.title}</p>
                {playlistNotice.description ? (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-text-secondary">
                    {playlistNotice.description}
                  </p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )

  if (layout === 'row') {
    return (
      <article
        className={cn(
          'relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition',
          active
            ? 'border-primary ring-1 ring-primary'
            : 'border-border bg-surface hover:border-primary/40',
        )}
      >
        {to ? (
          <Link
            to={to}
            state={toState}
            aria-label={`Play ${title}`}
            className="absolute inset-0 rounded-xl outline-primary/60 hover:outline-2 hover:-outline-offset-2 focus-visible:outline-2 focus-visible:-outline-offset-2"
          />
        ) : null}

        <span className="pointer-events-none relative z-[1] grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-elevated text-text-muted">
          {coverUrl && failedCoverUrl !== coverUrl ? (
            <img
              src={coverUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setFailedCoverUrl(coverUrl)}
              className="size-full object-cover"
            />
          ) : (
            <HugeiconsIcon icon={icon} size={18} />
          )}
        </span>

        <div className="relative z-[1] min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-text-primary">{title}</p>
            <span
              className={cn(
                'shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase',
                tag.toLowerCase().includes('on air')
                  ? 'bg-primary text-text-primary'
                  : 'border border-border bg-surface-elevated text-text-secondary',
              )}
            >
              {tag}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-text-muted">
            {[subtitle, ...meta.map((entry) => entry.text)].filter(Boolean).join(' • ')}
          </p>
        </div>

        <div className="relative z-[1] flex shrink-0 items-center gap-0.5">
          {duration ? (
            <span className="mr-1.5 text-[11px] text-text-muted">{duration}</span>
          ) : null}
          {likeButton}
          {queueButton}
          {moreButton(MoreHorizontalIcon)}
        </div>

        {dialogLayer}
      </article>
    )
  }

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border transition',
        active
          ? 'border-primary ring-1 ring-primary'
          : 'border-border bg-surface hover:-translate-y-0.5 hover:border-primary/50',
      )}
    >
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-surface-elevated">
        {coverUrl && failedCoverUrl !== coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailedCoverUrl(coverUrl)}
            className="size-full object-cover"
          />
        ) : (
          <div
            className="grid size-full place-items-center text-text-muted"
            style={STRIPES}
          >
            <HugeiconsIcon icon={icon} size={28} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/30" />

        <span className="absolute top-2 left-2 rounded-sm bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-text-primary uppercase">
          {tag}
        </span>
        {duration ? (
          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-text-primary">
            {duration}
          </span>
        ) : null}

        {to ? (
          <Link
            to={to}
            state={toState}
            aria-label={`Play ${title}`}
            className="absolute inset-0 rounded-t-xl outline-primary/60 hover:outline-2 hover:-outline-offset-2 focus-visible:outline-2 focus-visible:-outline-offset-2"
          />
        ) : null}
      </div>

      <div className="px-3.5 pt-2.5 pb-2.5">
        <div className="flex items-center gap-2">
          <p className="line-clamp-1 min-w-0 flex-1 text-sm font-semibold text-text-primary">
            {title}
          </p>
          <span className="flex shrink-0 items-center gap-0.5">
            {likeButton}
            {moreButton(MoreVerticalIcon)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-text-muted">
          {[subtitle, genre].filter(Boolean).join(' • ')}
        </p>
      </div>

      {dialogLayer}
    </article>
  )
}
