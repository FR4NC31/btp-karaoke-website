import { Link, NavLink, Outlet } from 'react-router'

export default function RootLayout() {
  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-5">
          <Link to="/" className="font-heading text-2xl font-bold text-text-primary">
            BTP KARAOKE
          </Link>
          <span className="my-1 h-6 w-0.5 bg-text-muted" />
          <div className="flex flex-1 items-center justify-between">
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
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
