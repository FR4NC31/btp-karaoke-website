import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Shield01Icon } from '@hugeicons/core-free-icons'
import { MEDIA_SECTION_LABELS } from '../../lib/media-api'
import type { PreviewItem } from './types'

interface AdminFact {
  label: string
  value: ReactNode
}

function adminFacts(item: PreviewItem): AdminFact[] {
  const facts: AdminFact[] = [{ label: 'Catalog ID', value: item.id }]
  if (item.artist) facts.push({ label: 'Artist', value: item.artist })
  if (item.album) facts.push({ label: 'Album', value: item.album })
  if (item.subtitle) {
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

export default function AdminDetailsPanel({ item }: { item: PreviewItem }) {
  return (
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
  )
}
