import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  CalendarBlock01Icon,
  CalendarCheck01Icon,
  DashboardSquare01Icon,
  GridViewIcon,
  ListViewIcon,
  Logout01Icon,
  MusicNote01Icon,
  PlusSignIcon,
  UserGroupIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import BrandLogo from '../../components/BrandLogo'
import UserAvatar from '../../components/UserAvatar'
import NewReservationDialog from './NewReservationDialog'
import BlockedDaysDialog from './components/reservation/BlockedDaysDialog'
import MembershipDialog from './components/reservation/MembershipDialog'
import { fetchAdminBlockouts, fetchAdminBookings } from '../../lib/admin-api'
import {
  readMediaHubView,
  storeMediaHubView,
  type MediaHubView,
} from '../../lib/admin-media-view'
import { signOut, useSession } from '../../lib/auth-client'
import { markSessionExit } from '../../lib/session-exit'
import { readableError, unexpectedError } from '../../lib/auth-errors'

/**
 * Admin console shell: top bar, navigation and the shared new-reservation
 * dialog. Access control lives in `<RequireAdmin />` and the backend's
 * `requireAdmin`; nothing here checks roles.
 */

type AdminAction = 'blocked' | 'memberships' | 'newReservation' | 'newMedia' | 'backMedia' | 'mediaView'

type PageMeta = {
  title: string
  subtitle: string
  actions: AdminAction[]
}

function pageMeta(pathname: string): PageMeta {
  if (pathname === '/admin') {
    return {
      title: 'Admin Dashboard',
      subtitle: 'Studio control room',
      actions: ['blocked', 'memberships', 'newReservation'],
    }
  }

  if (pathname.startsWith('/admin/bookings')) {
    return {
      title: 'Reservations',
      subtitle: 'Every customer, every status',
      actions: ['blocked', 'memberships', 'newReservation'],
    }
  }

  if (pathname.startsWith('/admin/blocked-days')) {
    return {
      title: 'Blocked Days',
      subtitle: 'Studio closures and maintenance',
      actions: ['memberships', 'newReservation'],
    }
  }

  if (pathname.startsWith('/admin/memberships')) {
    return {
      title: 'Memberships',
      subtitle: 'Tiers, expiry and access',
      actions: ['blocked', 'newReservation'],
    }
  }

  if (pathname === '/admin/media/new') {
    return {
      title: 'New Media Item',
      subtitle: 'Publish to the studio hub',
      actions: ['backMedia'],
    }
  }

  if (/^\/admin\/media\/[^/]+$/.test(pathname)) {
    return {
      title: 'Edit Media Item',
      subtitle: 'Changes go live on the hub immediately',
      actions: ['backMedia'],
    }
  }

  if (pathname.startsWith('/admin/media')) {
    return {
      title: 'Media Hub',
      subtitle: 'Video songs, minus-one tracks and radio stations',
      actions: ['mediaView', 'newMedia'],
    }
  }

  return { title: 'Admin Console', subtitle: 'Control desk', actions: [] }
}

const NAV_SECTIONS: Array<{
  label: string
  links: Array<{
    to: string
    label: string
    icon: IconSvgElement
    end?: boolean
    badge?: 'pending' | 'blocked'
    modal?: 'blockedDays' | 'membership'
  }>
}> = [
  {
    label: 'Main Navigation',
    links: [
      { to: '/admin', label: 'Overview', icon: DashboardSquare01Icon, end: true },
      {
        to: '/admin/bookings',
        label: 'Reservations',
        icon: CalendarCheck01Icon,
        badge: 'pending',
      },
      // Keep Media Hub active while editing a row at /admin/media/:id.
      { to: '/admin/media', label: 'Media Hub', icon: MusicNote01Icon },
    ],
  },
  {
    label: 'Management',
    links: [
      {
        to: '/admin/blocked-days',
        label: 'Blocked Days',
        icon: CalendarBlock01Icon,
        badge: 'blocked',
        modal: 'blockedDays',
      },
      {
        to: '/admin/memberships',
        label: 'Membership',
        icon: UserGroupIcon,
        modal: 'membership',
      },
    ],
  },
]

const ALL_NAV_LINKS = NAV_SECTIONS.flatMap((section) => section.links)

export default function AdminShell() {
  const [newReservationOpen, setNewReservationOpen] = useState(false)
  const [blockedDaysOpen, setBlockedDaysOpen] = useState(false)
  const [membershipOpen, setMembershipOpen] = useState(false)
  // Incremented after a desk reservation is created so every page refetches.
  const [reservationsRevision, setReservationsRevision] = useState(0)
  // Media hub layout (grid cards or compact list), remembered across visits.
  const [mediaView, setMediaViewState] = useState<MediaHubView>(() => readMediaHubView())
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const [counts, setCounts] = useState({ pending: 0, blocked: 0 })
  const location = useLocation()
  const navigate = useNavigate()
  const { data } = useSession()

  function setMediaView(view: MediaHubView) {
    setMediaViewState(view)
    storeMediaHubView(view)
  }

  const user = data?.user
  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.name || 'Admin'
  const email = user?.email ?? 'Not signed in'
  const meta = pageMeta(location.pathname)

  // Sidebar badges: the pending queue and the closed-day count. Both are
  // best-effort — a failed probe just leaves the badge off.
  useEffect(() => {
    let alive = true

    async function loadCounts() {
      const [pending, blocked] = await Promise.all([
        fetchAdminBookings({ status: 'pending' }).catch(() => null),
        fetchAdminBlockouts().catch(() => null),
      ])
      if (!alive) return
      setCounts({
        // Count locally too: the endpoint honours `status`, but a snapshot is
        // one request and stays correct even when a mock returns everything.
        pending: pending?.bookings.filter((booking) => booking.status === 'pending').length ?? 0,
        blocked: blocked?.blockouts.length ?? 0,
      })
    }

    void loadCounts()
    return () => {
      alive = false
    }
  }, [location.pathname, reservationsRevision])

  // Same contract as the profile menu: clear the backend cookie first, then
  // leave the console. `markSessionExit` keeps RequireAdmin from racing us
  // toward /signin on the way out.
  async function handleSignOut() {
    if (signingOut) return
    setSignOutError('')
    setSigningOut(true)
    markSessionExit(true)
    try {
      const { error } = await signOut()
      if (error) {
        markSessionExit(false)
        setSignOutError(readableError(error))
        return
      }
    } catch (err) {
      markSessionExit(false)
      setSignOutError(unexpectedError('sign-out', err))
      return
    } finally {
      setSigningOut(false)
    }
    navigate('/')
  }

  function badgeFor(badge?: 'pending' | 'blocked') {
    if (!badge) return 0
    return badge === 'pending' ? counts.pending : counts.blocked
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-text-primary">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-5">
        <Link
          to="/admin"
          aria-label="Admin home"
          className="flex min-w-0 items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <BrandLogo className="size-9 shrink-0 rounded-lg" />
          <div className="hidden leading-tight lg:block">
            <p className="font-heading text-base font-bold tracking-wide">BTP ADMIN</p>
            <p className="text-[9px] font-bold tracking-[0.2em] text-text-muted uppercase">
              Control desk
            </p>
          </div>
        </Link>

        <span className="hidden h-9 w-px bg-border sm:block" />

        <div className="min-w-0">
          <h1 className="truncate font-heading text-lg font-bold tracking-wide uppercase sm:text-xl">
            {meta.title}
          </h1>
          <p className="hidden truncate text-[10px] font-semibold tracking-[0.16em] text-text-muted uppercase sm:block">
            {meta.subtitle}
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {meta.actions.includes('blocked') && (
            <button
              type="button"
              onClick={() => setBlockedDaysOpen(true)}
              aria-label="Blocked Days"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-2.5 text-xs font-semibold text-text-secondary transition hover:border-primary/50 hover:text-text-primary"
            >
              <HugeiconsIcon icon={CalendarBlock01Icon} size={14} />
              <span className="hidden xl:inline">Blocked Days</span>
            </button>
          )}
          {meta.actions.includes('memberships') && (
            <button
              type="button"
              onClick={() => setMembershipOpen(true)}
              aria-label="Membership"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-2.5 text-xs font-semibold text-text-secondary transition hover:border-primary/50 hover:text-text-primary"
            >
              <HugeiconsIcon icon={UserGroupIcon} size={14} />
              <span className="hidden xl:inline">Membership</span>
            </button>
          )}
          {meta.actions.includes('newReservation') && (
            <button
              type="button"
              onClick={() => setNewReservationOpen(true)}
              aria-label="+ New reservation"
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover sm:px-3.5"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={15} />
              <span className="hidden sm:inline">New reservation</span>
            </button>
          )}
          {meta.actions.includes('mediaView') && (
            <div
              role="group"
              aria-label="Media layout"
              className="flex h-9 items-center rounded-lg border border-border bg-surface-elevated p-1"
            >
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={mediaView === 'grid'}
                onClick={() => setMediaView('grid')}
                className={`flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs font-bold tracking-widest uppercase transition ${
                  mediaView === 'grid'
                    ? 'bg-primary text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <HugeiconsIcon icon={GridViewIcon} size={14} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={mediaView === 'list'}
                onClick={() => setMediaView('list')}
                className={`flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs font-bold tracking-widest uppercase transition ${
                  mediaView === 'list'
                    ? 'bg-primary text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <HugeiconsIcon icon={ListViewIcon} size={14} />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          )}
          {meta.actions.includes('newMedia') && (
            <Link
              to="/admin/media/new"
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold tracking-widest text-text-primary uppercase transition hover:bg-primary-hover"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={15} />
              New item
            </Link>
          )}
          {meta.actions.includes('backMedia') && (
            <Link
              to="/admin/media"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-2.5 text-xs font-bold tracking-widest text-text-secondary uppercase transition hover:border-primary/50 hover:text-text-primary"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              <span className="hidden sm:inline">Media Hub</span>
            </Link>
          )}
        </div>
      </header>

      {/* Below md the sidebar folds into a chip rail. */}
      <nav
        aria-label="Admin sections"
        className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto border-b border-border bg-surface px-3 py-2 md:hidden"
      >
        {ALL_NAV_LINKS.map((link) => {
          if (link.modal) {
            return (
              <button
                key={link.to}
                type="button"
                aria-label={link.label}
                onClick={() => {
                  if (link.modal === 'blockedDays') setBlockedDaysOpen(true)
                  else setMembershipOpen(true)
                }}
                className="shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition bg-surface-elevated text-text-secondary hover:text-text-primary"
              >
                {link.label}
              </button>
            )
          }
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition ${
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
                }`
              }
            >
              {link.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
          <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-5">
            {NAV_SECTIONS.map((section) => (
              <div key={section.label}>
                <p className="mb-2 px-3 text-[9px] font-bold tracking-[0.22em] text-text-muted uppercase">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.links.map((link) => {
                    const badge = badgeFor(link.badge)
                    if (link.modal) {
                      return (
                        <button
                          key={link.to}
                          type="button"
                          aria-label={link.label}
                          onClick={() => {
                            if (link.modal === 'blockedDays') setBlockedDaysOpen(true)
                            else setMembershipOpen(true)
                          }}
                          className={`relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold transition text-text-secondary hover:bg-surface-elevated hover:text-text-primary`}
                        >
                          <HugeiconsIcon icon={link.icon} size={14} />
                          <span className="truncate">{link.label}</span>
                          {badge > 0 && (
                            <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                              {badge}
                            </span>
                          )}
                        </button>
                      )
                    }
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.end}
                        className={({ isActive }) =>
                          `relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold transition ${
                            isActive
                              ? 'bg-primary-soft text-primary before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary'
                              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                          }`
                        }
                      >
                        <HugeiconsIcon icon={link.icon} size={14} />
                        <span className="truncate">{link.label}</span>
                        {badge > 0 && (
                          <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                            {badge}
                          </span>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="space-y-3 border-t border-border p-3">
            <div className="rounded-xl border border-border bg-surface-elevated px-3 py-2.5">
              <p className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <span className="size-1.5 rounded-full bg-success" />
                Studio Net
              </p>
              <p className="mt-0.5 pl-3.5 text-[10px] font-bold tracking-widest text-success uppercase">
                Active / Online
              </p>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-elevated p-2">
              <UserAvatar
                image={user?.image}
                icon={UserIcon}
                iconSize={15}
                className="size-8 shrink-0 rounded-full"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-text-primary">{name}</p>
                <p className="truncate text-[10px] text-text-muted">{email}</p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                aria-label="Log out"
                title="Log out"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted transition hover:bg-primary-soft hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HugeiconsIcon icon={Logout01Icon} size={15} />
              </button>
            </div>
            {signOutError && (
              <p role="alert" className="px-1 text-[11px] text-error">
                {signOutError}
              </p>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6">
            <Outlet
              context={{
                openNewReservation: () => setNewReservationOpen(true),
                reservationsRevision,
                mediaView,
                setMediaView,
              }}
            />
          </div>
        </main>
      </div>

      <NewReservationDialog
        open={newReservationOpen}
        onOpenChange={setNewReservationOpen}
        onCreated={() => setReservationsRevision((revision) => revision + 1)}
      />
      <BlockedDaysDialog open={blockedDaysOpen} onOpenChange={setBlockedDaysOpen} />
      <MembershipDialog open={membershipOpen} onOpenChange={setMembershipOpen} />
    </div>
  )
}
