import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useSession } from '../lib/auth-client'
import { isSessionExitInProgress, markSessionExit } from '../lib/session-exit'
import { SessionChecking, SessionUnavailable } from './SessionStates'

/**
 * Guards the /admin route tree: a live session AND `role === 'admin'`.
 *
 * The session-checking half is RequireAuth's logic verbatim — the same
 * stale-cache trap applies here (see RequireAuth for the full story): the
 * session value is a cache that can lag reality, so we revalidate once on
 * mount and only bounce after hearing from the server. A session we already
 * hold is trusted; a server hiccup must not lock an admin out.
 *
 * The role check is UX only — it decides who gets to look at the console.
 * Whatever the console calls is separately enforced server-side by
 * `requireAdmin` (backend/src/session-middleware.ts), which re-reads the role
 * from the database on every request.
 *
 * Bounces:
 *  - no session        -> /signin?next=<this path>, so signing in returns here;
 *  - session, not admin -> /studio. Regular users should not be told the
 *    console exists; the studio is the natural place for them anyway.
 */
export default function RequireAdmin() {
  const { data, error, isPending, refetch } = useSession()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const asked = useRef(false)
  // See RequireAuth: only an exit THIS guard watched may redirect to the
  // landing page; a visitor mounting after an earlier sign-out gets /signin.
  const sawSession = useRef(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Logged rather than thrown: this is a render path, and the visible
    // message below is what the user acts on.
    if (error) console.error('[auth] session check failed:', error)
  }, [error])

  useEffect(() => {
    if (data) {
      sawSession.current = true
      markSessionExit(false)
    }
  }, [data])

  useEffect(() => {
    // `asked` makes this fire at most once per mount, so an empty answer
    // settles the decision instead of asking again forever.
    if (data || isPending || asked.current) return
    asked.current = true
    void refetch().finally(() => setChecked(true))
  }, [data, isPending, refetch])

  const willBounce = !isPending && !data && !error && checked
  useEffect(() => {
    if (!willBounce) return
    const exitInProgress = sawSession.current && isSessionExitInProgress()
    // `replace` so Back doesn't return straight to the guarded page. `next`
    // is re-validated on the way out (lib/redirects.ts) before ever being
    // navigated to.
    navigate(
      exitInProgress ? '/' : `/signin?next=${encodeURIComponent(pathname)}`,
      { replace: true },
    )
  }, [willBounce, navigate, pathname])

  const isAdmin = data?.user.role === 'admin'
  const notAdmin = !isPending && data && !isAdmin
  useEffect(() => {
    if (notAdmin) navigate('/studio', { replace: true })
  }, [notAdmin, navigate])

  if (isPending) return <SessionChecking />
  if (data) return isAdmin ? <Outlet /> : null // non-admin: bounce in flight
  if (error) return <SessionUnavailable />
  // Either we have just asked and are waiting, or the answer was a genuine
  // "no session" — only the latter may redirect; the effect above does it.
  if (!checked) return <SessionChecking />
  // Bounce in flight.
  return null
}
