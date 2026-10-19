import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { MoreHorizontalIcon, PlusSignIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog'
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
  /** Cover image for the artwork; without one the striped default art shows. */
  coverUrl?: string | null
  /** When set, the artwork becomes a play link (video songs → player-queue). */
  to?: string
  /** Router state carried by the play link (e.g. `{ autoplay: true }`). */
  toState?: unknown
  /** Render the title as the page h1 (the first video card carries it). */
  titleAs?: 'h1'
  /**
   * What the queued row keeps: the catalog row it came from (so the console
   * can resolve the exact file, even after edits), plus the runtime, uploaded
   * file and stage mode the bar's skip and auto-advance play.
   */
  queue?: { mediaId?: string; len?: string | null; src?: string | null; kind?: 'video' | 'music' }
}

/**
 * Shared media tile for the studio hub (video songs + Music Player sets +
 * Radio stations): tag chip over the row's cover art — or the striped
 * placeholder when it has none — then title / subtitle / meta footer.
 * Artwork images load lazily so a long hub never blocks the first paint.
 * `to` turns the artwork into a play link; the ellipsis menu opens the
 * dialog that adds the row to the lounge queue (the console's up-next list).
 */
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
  const { add } = useLoungeQueue()
  // What the queue can actually play: catalog video songs fall back to the
  // bundled master, music rows need an uploaded file, and radio has no console
  // stage at all — offering it would only seed a row the console skips.
  const queueable = Boolean(queue && (queue.kind === 'video' || queue.src))
  const [optionsOpen, setOptionsOpen] = useState(false)
  // "Added to queue" confirmation — flips back so a song can be queued twice.
  const [added, setAdded] = useState(false)
  const addedTimer = useRef<number | null>(null)

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
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
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
        {meta.map((item) => (
          <span key={item.text} className="flex min-w-0 items-center gap-1">
            <HugeiconsIcon icon={item.icon} size={12} className="shrink-0" />
            <span className="truncate">{item.text}</span>
          </span>
        ))}
        <Dialog open={optionsOpen} onOpenChange={openOptions}>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label={`More options for ${title}`}
              className="ml-auto grid size-6 place-items-center rounded transition hover:text-text-primary"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
            </button>
          </DialogTrigger>

          <DialogContent className="border border-border bg-surface p-5 text-text-primary sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="pr-8 font-heading text-lg leading-tight font-bold tracking-wide uppercase">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-text-muted">
                {subtitle}
                {queue?.len ? ` · ${queue.len}` : ''}
              </DialogDescription>
            </DialogHeader>

            {queueable ? (
              <>
                <div className="rounded-lg border border-border bg-surface-elevated/40 px-3 py-3">
                  <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
                    Lounge queue
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                    Add this to the Upcoming Lounge Queue — the player console picks it up for its
                    next-up list.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={addToQueue}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-bold text-text-primary transition hover:bg-primary-hover"
                  >
                    <HugeiconsIcon icon={added ? Tick02Icon : PlusSignIcon} size={13} />
                    {added ? 'Added to queue' : 'Add to queue'}
                  </button>
                  <Link
                    to="/studio/player-queue"
                    className="text-[11px] font-semibold text-text-muted transition hover:text-text-primary"
                  >
                    Open lounge queue
                  </Link>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border px-3 py-3">
                <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
                  Not available for the queue
                </p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {queue?.kind === 'music'
                    ? 'This music row has no uploaded file yet, so the console would have nothing to play.'
                    : 'Radio stations play live in their own player and cannot join the lounge queue.'}
                </p>
                <Link
                  to="/studio/player-queue"
                  className="mt-2 inline-block text-[11px] font-semibold text-text-muted transition hover:text-text-primary"
                >
                  Open lounge queue
                </Link>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </article>
  )
}
