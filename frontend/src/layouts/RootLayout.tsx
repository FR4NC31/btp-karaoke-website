import { NavLink, Outlet } from 'react-router'
import { Link } from 'react-router'

export default function RootLayout() {
  return (
    <div className="min-h-dvh bg-background text-text-primary">
      <header className="border-b border-border bg-surface px-6 py-4">
        <NavLink to="/" className="font-heading text-2xl  text-text-primary flex gap-5">
            <h1>BTP KARAOKE</h1>
            <span className="h-6 w-0.5 my-1 bg-text-muted"/>
            <div className="flex-1 flex items-center justify-between">
                <ul className="flex gap-10">
                    <li>
                        <a>Home</a>
                    </li>
                    <li>
                        <a>Songs</a>
                    </li>
                    <li>
                        <a>About</a>
                    </li>
                    <li>
                        <a >Contacts</a>
                    </li>
                </ul>
                <div className="flex gap-5">
                    <Link to="/signin">
                        Sign In
                    </Link>
                    <Link to="/signup">
                        Sign Up
                    </Link>
                </div>
            </div>
        </NavLink>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  )
}
