import { HugeiconsIcon } from '@hugeicons/react'
import { MusicNote01Icon, PlayIcon, Clock01Icon, HashtagIcon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import Placeholder from '../../../components/Placeholder'
import type { Collection } from '../data'

export default function CollectionCard({ item }: { item: Collection }) {
  return (
    <article
      className="group overflow-hidden rounded-lg border border-border bg-surface transition hover:border-primary/50"
    >
      <div className="relative">
        <Placeholder icon={MusicNote01Icon} iconSize={28} className="aspect-[4/3] w-full" />
        <span className="absolute top-2 left-2 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-text-primary uppercase">
          {item.tag}
        </span>
        <span className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full bg-primary text-text-primary opacity-0 transition group-hover:opacity-100">
          <HugeiconsIcon icon={PlayIcon} size={14} />
        </span>
      </div>
      <div className="p-3">
        <h3 className="truncate font-heading text-base font-semibold tracking-wide uppercase">
          {item.title}
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-text-muted">{item.desc}</p>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px] text-text-secondary">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={Clock01Icon} size={12} />
            {item.bpm}
          </span>
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={HashtagIcon} size={12} />
            {item.key}
          </span>
          <HugeiconsIcon icon={MoreHorizontalIcon} size={12} className="text-text-muted" />
        </div>
      </div>
    </article>
  )
}
