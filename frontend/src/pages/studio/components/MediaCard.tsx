import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons'

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
}

/**
 * Shared media tile for the studio hub (video songs + Music Player sets +
 * Radio stations): tag chip over the row's cover art — or the striped
 * placeholder when it has none — then title / subtitle / meta footer.
 * Artwork images load lazily so a long hub never blocks the first paint.
 * `to` turns the artwork into a play link; the ellipsis menu stays
 * visual-only.
 */
export default function MediaCard({ tag, icon, title, subtitle, meta, coverUrl, to, toState, titleAs }: MediaCardProps) {
  const TitleTag = titleAs === 'h1' ? 'h1' : 'p'
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
        <button
          type="button"
          aria-label={`More options for ${title}`}
          className="ml-auto grid size-6 place-items-center rounded transition hover:text-text-primary"
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
        </button>
      </div>
    </article>
  )
}
