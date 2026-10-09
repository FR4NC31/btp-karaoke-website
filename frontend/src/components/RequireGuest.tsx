import { Navigate, Outlet } from 'react-router'
import { useSession } from '../lib/auth-client'
import { SessionChecking } from './SessionStates'

/**
 * The mirror of `RequireAuth`: `/signin` and `/signup` are only for people
 * who aren't signed in. An old bookmark, a Back button after logging in, or
 * clicking a header link out of habit should all land in the studio instead
 * of a login form the user has no use for.
 *
 * Deliberately does *not* re-query the server. Both possible stale answers
 * are harmless here, which is the opposite of `RequireAuth`:
 *
 *   stale `data`   -> we send you to /studio, where RequireAuth asks the
 *                     server and, if there is no session after all, sends
 *                     you straight back. One hop, and it settles.
 *   stale `null`   -> we render the form, and signing in just works.
 *
 * So unlike the protected side, acting on the cache can never lock anyone
 * out or bounce a legitimate user; no extra round trip is worth paying for.
 */
export default function RequireGuest() {
  const { data, isPending } = useSession()

  // Wait for the first check so an authenticated user is redirected instead
  // of briefly being shown a form they shouldn't need.
  if (isPending) return <SessionChecking />
  if (data) return <Navigate to="/studio" replace />

  return <Outlet />
}
