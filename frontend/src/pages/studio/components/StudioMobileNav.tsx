import { Link, useLocation } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '../../../lib/utils'
import { studioNavActive, studioNavGroups } from '../data'

/** Horizontal nav strip shown only below md, where the sidebar is hidden. */
export default function StudioMobileNav() {
  const location = useLocation()

  return (
    <nav
      aria-label="Studio navigation"
      className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-border bg-surface px-3 py-2 md:hidden"
    >
      {studioNavGroups.flatMap((group) => group.items).map((item) => {
        const active = studioNavActive(item, location)

        if (!item.to) {
          return (
            <span
              key={item.label}
              aria-disabled="true"
              title="Coming soon"
              className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-text-muted/60"
            >
              <HugeiconsIcon icon={item.icon} size={14} />
              {item.label}
            </span>
          )
        }

        return (
          <Link
            key={item.label}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition',
              active
                ? 'bg-primary-soft text-primary'
                : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
            )}
          >
            <HugeiconsIcon icon={item.icon} size={14} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
