import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Menu01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import BrandLogo from '../components/BrandLogo'
import AuthDialog from '../components/AuthDialog'
import SiteFooter from './SiteFooter'
import { useSession } from '../lib/auth-client'
import type { AuthMode } from '../lib/auth-dialog'

const navItems: { label: string; to?: string }[] = [
  { label: 'Home', to: '/' },
  { label: 'Songs' },
  { label: 'Rooms' },
  { label: 'Services', to: '/services' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export default function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { data: session, isPending } = useSession()
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)

  const [settledPath, setSettledPath] = useState(location.pathname)
  if (settledPath !== location.pathname) {
    setSettledPath(location.pathname)
    if (authMode !== null) setAuthMode(null)
  }

  const openAuth = (mode: AuthMode) => setAuthMode(mode)

  const onContentPage =
    location.pathname === '/about' || location.pathname === '/contact' || location.pathname === '/services'
  const showHeaderAuth = !isPending && session == null && onContentPage
  const headerAuthButtons = (onPick?: () => void) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          onPick?.()
          openAuth('signin')
        }}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:text-text-primary"
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => {
          onPick?.()
          openAuth('signup')
        }}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-text-primary transition hover:bg-primary-hover"
      >
        Sign Up
      </button>
    </div>
  )

  return (
    <div className="flex min-h-dvh flex-col bg-background text-text-primary">
      <header className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/" aria-label="BTP KARAOKE" className="flex shrink-0 items-center gap-2.5">
            <BrandLogo className="size-9" />
            <span className="hidden leading-tight sm:block">
              <span className="block font-heading text-lg font-bold tracking-wide">BTP KARAOKE</span>
              <span className="block text-[9px] font-semibold tracking-widest text-text-muted uppercase">
                Music Production
              </span>
            </span>
          </Link>

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
              {showHeaderAuth && headerAuthButtons()}
            </div>
          </nav>

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
            {showHeaderAuth && headerAuthButtons(() => setMenuOpen(false))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-6">
        <Outlet context={{ openAuth }} />
      </main>

      <AuthDialog
        mode={authMode}
        onClose={() => setAuthMode(null)}
        onSwitch={openAuth}
      />

      <SiteFooter />
    </div>
  )
}
