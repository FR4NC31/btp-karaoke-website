import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Menu01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import BrandLogo from '../components/BrandLogo'
import AuthDialog from '../components/AuthDialog'
import SiteFooter from './SiteFooter'
import { useSession } from '../lib/auth-client'
import type { AuthMode } from '../lib/auth-dialog'

const navItems: { label: string; to?: string; hash?: string }[] = [
  { label: 'Home', to: '/', hash: '' },
  { label: 'Songs' },
  { label: 'Rooms' },
  { label: 'Services', to: '/#services', hash: '#services' },
  { label: 'About', to: '/#about', hash: '#about' },
  { label: 'Contact', to: '/#contact', hash: '#contact' },
]

export default function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { data: session, isPending } = useSession()
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [currentHash, setCurrentHash] = useState(window.location.hash)

  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('popstate', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('popstate', onHashChange)
    }
  }, [])

  const [settledPath, setSettledPath] = useState(location.pathname + currentHash)
  if (settledPath !== location.pathname + currentHash) {
    setSettledPath(location.pathname + currentHash)
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

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, to?: string, hash?: string) => {
    setMenuOpen(false)
    if (!to) return

    if (to === '/' && !hash) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      window.history.pushState(null, '', '/')
      setCurrentHash('')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
      return
    }

    if (hash) {
      e.preventDefault()
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        window.history.pushState(null, '', hash)
        setCurrentHash(hash)
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      }
    }
  }

  const isActiveLink = (to?: string, hash?: string) => {
    if (!to) return false
    if (to === '/') {
      return location.pathname === '/' && (!currentHash || currentHash === '#')
    }
    return currentHash === hash
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-text-primary">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/"
            onClick={(e) => handleNavClick(e, '/', '')}
            aria-label="BTP KARAOKE"
            className="flex shrink-0 items-center gap-2.5 cursor-pointer"
          >
            <BrandLogo className="size-9" />
            <span className="hidden leading-tight sm:block">
              <span className="block font-heading text-lg font-bold tracking-wide">BTP KARAOKE</span>
              <span className="block text-[9px] font-semibold tracking-widest text-text-muted uppercase">
                Music Production
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden flex-1 items-center justify-between sm:flex">
            <ul className="flex items-center gap-2">
              {navItems.map((item) =>
                item.to ? (
                  <li key={item.label}>
                    <a
                      href={item.to}
                      onClick={(e) => handleNavClick(e, item.to, item.hash)}
                      className={
                        isActiveLink(item.to, item.hash)
                          ? 'rounded-md px-3 py-1.5 font-bold text-primary transition cursor-pointer'
                          : 'rounded-md px-3 py-1.5 text-text-secondary transition hover:text-text-primary cursor-pointer'
                      }
                    >
                      {item.label}
                    </a>
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
                    <a
                      href={item.to}
                      onClick={(e) => handleNavClick(e, item.to, item.hash)}
                      className={
                        isActiveLink(item.to, item.hash)
                          ? 'block font-bold text-primary cursor-pointer'
                          : 'block text-text-secondary hover:text-text-primary cursor-pointer'
                      }
                    >
                      {item.label}
                    </a>
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
