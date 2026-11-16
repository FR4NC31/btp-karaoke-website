import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import type { Location } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, Shield01Icon } from '@hugeicons/core-free-icons'
import BrandLogo from '../../../components/BrandLogo'
import { useSession } from '../../../lib/auth-client'
import { cn } from '../../../lib/utils'
import { studioNavActive, studioNavGroups, type StudioNavItem } from '../data'

const STORAGE_KEY = 'btp.sidebar.collapsed'

function rowClass(active: boolean, disabled = false): string {
  return cn(
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs font-medium transition',
    active
      ? // bg-primary-soft is pinned by KARAOKE-004; the gradient paints over it
        // so the active row matches the screenshot's red pill.
        'bg-primary-soft bg-gradient-to-r from-primary to-primary-hover text-text-primary'
      : disabled
        ? 'cursor-not-allowed text-text-muted/60'
        : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
  )
}

function StudioNavRow({
  item,
  location,
  collapsed,
}: {
  item: StudioNavItem
  location: Location
  collapsed: boolean
}) {
  const active = studioNavActive(item, location)
  const collapsedClass = collapsed ? 'justify-center px-0' : undefined

  if (!item.to) {
    return (
      <span
        aria-disabled="true"
        title={collapsed ? item.label : 'Coming soon'}
        className={cn(rowClass(false, true), collapsedClass)}
      >
        <HugeiconsIcon icon={item.icon} size={16} className="shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </span>
    )
  }

  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(rowClass(active), collapsedClass)}
    >
      <HugeiconsIcon icon={item.icon} size={16} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

export default function StudioSidebar() {
  const location = useLocation()
  const { data } = useSession()
  const isAdmin = data?.user.role === 'admin'
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      // Ignore storage failures — collapse just won't persist.
    }
  }, [collapsed])

  return (
    <aside
      className={cn(
        'relative hidden shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-300 ease-in-out md:flex',
        collapsed ? 'w-[76px]' : 'w-64',
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute top-1/2 right-0 z-30 grid size-6 -translate-y-1/2 translate-x-1/2 place-items-center rounded-full border border-border bg-surface-elevated text-text-secondary shadow-lg shadow-black/40 transition hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <HugeiconsIcon icon={collapsed ? ArrowRight01Icon : ArrowLeft01Icon} size={13} />
      </button>

      {/* Studio home: KARAOKE-022 pins this logo link returning to the hub. */}
      <Link
        to="/studio"
        aria-label="Studio home"
        title="Studio home"
        className={cn(
          'flex items-center gap-2.5 border-b border-border px-4 py-3 transition hover:bg-surface-elevated/40',
          collapsed && 'justify-center px-0',
        )}
      >
        <BrandLogo className="size-9 shrink-0 rounded-md" />
        {!collapsed && (
          /* Deliberately adjacent with no whitespace text node between them:
             the e2e suite pins the exact 'BTP MUSIC' heading text. */
          <div className="min-w-0 leading-tight">
            <h2 className="font-heading text-base font-bold tracking-wide uppercase">BTP MUSIC</h2>
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
              Production &amp; KTV
            </p>
          </div>
        )}
      </Link>

      <nav aria-label="Studio" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {studioNavGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-1 text-[10px] font-bold tracking-widest text-text-muted uppercase">
                {group.label}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.label}>
                  <StudioNavRow item={item} location={location} collapsed={collapsed} />
                </li>
              ))}
              {isAdmin && group.label === 'Your Library' && (
                <li>
                  <Link
                    to="/admin"
                    title={collapsed ? 'Admin Console' : undefined}
                    className={cn(
                      rowClass(location.pathname.startsWith('/admin')),
                      collapsed && 'justify-center px-0',
                    )}
                  >
                    <HugeiconsIcon icon={Shield01Icon} size={16} className="shrink-0" />
                    {!collapsed && <span className="truncate">Admin Console</span>}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
