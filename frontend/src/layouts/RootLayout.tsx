import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Menu01Icon, Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import BrandLogo from '../components/BrandLogo'
import SiteFooter from './SiteFooter'

// `to` set = routable link; missing = planned section without a page yet —
// shown, but honestly inert.
const navItems: { label: string; to?: string }[] = [
  { label: 'Home', to: '/' },
  { label: 'Songs' },
  { label: 'Rooms' },
  { label: 'Bookings' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export default function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* aria-label keeps the accessible name "BTP KARAOKE" even though
              the visible brand now has a logo and a second line of text. */}
          <Link to="/" aria-label="BTP KARAOKE" className="flex shrink-0 items-center gap-2.5">
            <BrandLogo className="size-9" />
            <span className="hidden leading-tight sm:block">
              <span className="block font-heading text-lg font-bold tracking-wide">BTP KARAOKE</span>
              <span className="block text-[9px] font-semibold tracking-widest text-text-muted uppercase">
                Music Production
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden flex-1 items-center justify-between sm:flex">
            <ul className="flex items-center gap-1">
              {navItems.map((item) =>
                item.to ? (
                  <li key={item.label}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        isActive
                          ? 'rounded-md bg-text-primary px-3 py-1.5 font-medium text-background'
                          : 'rounded-md px-3 py-1.5 text-text-secondary transition hover:text-text-primary'
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ) : (
                  <li key={item.label}>
                    <span aria-disabled="true" className="rounded-md px-3 py-1.5 text-text-muted">
                      {item.label}
                    </span>
                  </li>
                ),
              )}
            </ul>

            <div className="flex items-center gap-3">
              <div className="relative hidden lg:block">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={16}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="search"
                  aria-label="Search catalog"
                  placeholder="Search catalog, OPM…"
                  className="w-60 rounded-lg border border-border bg-background py-2 pr-12 pl-9 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <kbd className="absolute top-1/2 right-2 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
                  ⌘K
                </kbd>
              </div>

              <Link
                to="/signin"
                className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-surface"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-primary-hover"
              >
                Sign Up
              </Link>
            </div>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="ml-auto text-text-secondary hover:text-text-primary sm:hidden"
          >
            <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={24} />
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <nav id="mobile-nav" className="mt-4 space-y-4 sm:hidden" aria-label="Mobile navigation">
            <ul className="space-y-3">
              {navItems.map((item) =>
                item.to ? (
                  <li key={item.label}>
                    <NavLink
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ) : (
                  <li key={item.label}>
                    <span aria-disabled="true" className="text-text-muted">
                      {item.label}
                    </span>
                  </li>
                ),
              )}
            </ul>
            <div className="flex gap-5 border-t border-border pt-4">
              <Link to="/signin" onClick={() => setMenuOpen(false)} className="text-text-secondary hover:text-text-primary">
                Login
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="text-primary hover:text-primary-hover">
                Sign Up
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  )
}
