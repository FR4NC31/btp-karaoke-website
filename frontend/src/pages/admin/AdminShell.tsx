import { Link, NavLink, Outlet } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CalendarAdd01Icon,
  CalendarCheck01Icon,
  DashboardSquare01Icon,
  MusicNote01Icon,
  Shield01Icon,
} from '@hugeicons/core-free-icons'
import BrandLogo from '../../components/BrandLogo'
import ProfileMenu from '../studio/components/ProfileMenu'

/**
 * Admin console shell: top bar, desk navigation, and the routed page through
 * <Outlet/>. Deliberately plain compared to StudioShell — no karaoke player,
 * no simulated loading skeleton; the console exists to work through
 * reservations, not to be browsed.
 *
 * The sidebar is `hidden md:flex`, so the same links also render as a
 * horizontal strip inside <main> below md — every destination stays reachable
 * at phone width.
 *
 * Access control lives in <RequireAdmin /> (the route branch) and, for real,
 * in the backend's `requireAdmin` — nothing in this shell checks roles.
 */

const navLinks = [
  { to: '/admin', label: 'Overview', icon: DashboardSquare01Icon, end: true },
  { to: '/admin/bookings', label: 'Reservations', icon: CalendarCheck01Icon, end: true },
  { to: '/admin/bookings/new', label: 'New reservation', icon: CalendarAdd01Icon, end: true },
  // No `end`: the Media Hub entry stays lit while adding or editing an item.
  { to: '/admin/media', label: 'Media Hub', icon: MusicNote01Icon, end: false },
]

export default function AdminShell() {
  return (
    <div className="flex h-dvh flex-col bg-background text-text-primary">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-4">
        <BrandLogo className="size-9 shrink-0 rounded-md" />
        <div className="hidden leading-tight sm:block">
          <div className="flex items-center gap-2">
            <p className="font-heading text-lg font-bold tracking-wide">BTP ADMIN</p>
            <span className="flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-text-primary uppercase">
              <HugeiconsIcon icon={Shield01Icon} size={10} />
              Console
            </span>
          </div>
          <p className="text-[10px] tracking-widest text-text-muted uppercase">
            Reservation control room
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            to="/studio"
            className="rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:text-text-primary"
          >
            Studio
          </Link>
          <Link
            to="/"
            className="hidden rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:text-text-primary sm:block"
          >
            View site
          </Link>
          <ProfileMenu />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface md:flex">
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <p className="mb-2 px-1 text-[10px] font-bold tracking-widest text-primary uppercase">
              Admin desk
            </p>
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition ${
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                  }`
                }
              >
                <HugeiconsIcon icon={link.icon} size={13} />
                <span className="truncate">{link.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-border px-3 py-2.5">
            <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
              Role-gated · server-enforced
            </p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <nav className="mb-5 flex flex-wrap gap-2 md:hidden">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-xs font-bold tracking-widest uppercase transition ${
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'bg-surface text-text-secondary hover:text-text-primary'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <Outlet />
        </main>
      </div>
    </div>
  )
}
