import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import { Popover, PopoverTrigger } from '../../../components/ui/popover'
import MediaCardMenu from './MediaCardMenu'
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
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const addedTimer = useRef<number | null>(null)
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null)

  useEffect(
    () => () => {
      if (addedTimer.current !== null) window.clearTimeout(addedTimer.current)
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
            added={added}
            queueCount={items.length}
            onAdd={addToQueue}
          />
        </Popover>
      </div>
    </article>
  )
}
