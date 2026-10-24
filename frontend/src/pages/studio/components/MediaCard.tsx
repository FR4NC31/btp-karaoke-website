import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  InformationCircleIcon,
  MoreHorizontalIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import { Popover, PopoverTrigger } from '../../../components/ui/popover'
import { cn } from '../../../lib/utils'
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
  meta: MediaCardMeta[]
  coverUrl?: string | null
  to?: string
  toState?: unknown
  titleAs?: 'h1'
  queue?: { mediaId?: string; len?: string | null; src?: string | null; kind?: 'video' | 'music' }
}

export default function MediaCard({
  tag,
  icon,
  title,
  subtitle,
  meta,
  coverUrl,
  to,
  toState,
  titleAs,
  queue,
}: MediaCardProps) {
  const TitleTag = titleAs === 'h1' ? 'h1' : 'p'
  const { add, items } = useLoungeQueue()
  const queueable = Boolean(queue && (queue.kind === 'video' || queue.src))
  const playlistable = queueable
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

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="relative">
        {coverUrl && failedCoverUrl !== coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailedCoverUrl(coverUrl)}
            className="aspect-[4/3] w-full bg-surface-elevated object-cover"
          />
        ) : (
          <div
            className="flex aspect-[4/3] w-full items-center justify-center bg-surface-elevated text-text-muted"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(244,244,242,0.035) 10px, rgba(244,244,242,0.035) 20px)',
            }}
          >
            <HugeiconsIcon icon={icon} size={28} />
          </div>
        )}
        <span className="absolute top-2 left-2 rounded-sm bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-text-primary uppercase">
          {tag}
        </span>
        {to ? (
          <Link
            to={to}
            state={toState}
            aria-label={`Play ${title}`}
            className="absolute inset-0 rounded-t-lg outline-primary/60 hover:outline-2 hover:-outline-offset-2 focus-visible:outline-2 focus-visible:-outline-offset-2"
          />
        ) : null}
      </div>

      <div className="px-3.5 pt-3 pb-2.5">
        <TitleTag className="line-clamp-2 font-heading text-base leading-tight font-bold tracking-wide uppercase">
          {title}
        </TitleTag>
        <p className="mt-0.5 truncate text-[10px] text-text-muted">{subtitle}</p>
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-border px-3.5 py-2 text-[10px] text-text-muted">
        {meta.map((item, index) => (
          <span key={index} className="flex min-w-0 items-center gap-1">
            <HugeiconsIcon icon={item.icon} size={12} className="shrink-0" />
            <span className="truncate">{item.text}</span>
          </span>
        ))}
        <Popover open={optionsOpen} onOpenChange={openOptions}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`More options for ${title}`}
              className="ml-auto grid size-6 place-items-center rounded transition hover:text-text-primary"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
            </button>
          </PopoverTrigger>

          <MediaCardMenu
            title={title}
            subtitle={subtitle}
            len={queue?.len}
            coverUrl={coverUrl}
            fallbackIcon={icon}
            queueable={queueable}
            queueKind={queue?.kind}
            playlistable={playlistable}
            added={added}
            queueCount={items.length}
            onAdd={addToQueue}
            onAddToPlaylist={openPlaylistDialog}
          />
        </Popover>
      </div>

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
                <p className="font-heading text-sm font-bold tracking-wide uppercase">
                  {playlistNotice.title}
                </p>
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
    </article>
  )
}
