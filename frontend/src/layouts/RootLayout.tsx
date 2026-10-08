import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Menu01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'

export default function RootLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <header className="border-b border-border bg-surface px-4 py-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Link to="/" className="font-heading text-2xl font-bold text-text-primary">
            BTP KARAOKE
          </Link>
          <span className="my-1 hidden h-6 w-0.5 bg-text-muted sm:block" />

          {/* Desktop nav */}
          <div className="hidden flex-1 items-center justify-between sm:flex">
            <ul className="flex gap-10">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                  }
                >
                  Home
                </NavLink>
              </li>
              <li>
                <span className="cursor-pointer text-text-secondary hover:text-text-primary">Songs</span>
              </li>
              <li>
                <span className="cursor-pointer text-text-secondary hover:text-text-primary">About</span>
              </li>
              <li>
                <span className="cursor-pointer text-text-secondary hover:text-text-primary">Contacts</span>
              </li>
            </ul>
            <div className="flex gap-5">
              <Link to="/signin" className="text-text-secondary hover:text-text-primary">
                Sign In
              </Link>
              <Link to="/signup" className="text-primary hover:text-primary-hover">
                Sign Up
              </Link>
            </div>
          </div>

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
              <li>
                <NavLink
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                  }
                >
                  Home
                </NavLink>
              </li>
            </ul>
            <div className="flex gap-5 border-t border-border pt-4">
              <Link to="/signin" onClick={() => setMenuOpen(false)} className="text-text-secondary hover:text-text-primary">
                Sign In
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
    </div>
  )
}
