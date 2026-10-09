import { Navigate, Outlet } from 'react-router'
import { useSession } from '../lib/auth-client'

/**
 * Guards every route nested underneath it — no session, no access.
 *
 * The pending state must resolve before we decide anything. Redirecting
 * while the session request is still in flight would bounce a logged-in
 * user to /signin on every hard refresh of /studio, which looks like a
 * bug even though it isn't one.
 */
export default function RequireAuth() {
  const { data, isPending } = useSession()

  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-text-primary">
        <p className="text-text-muted">Checking your session…</p>
      </div>
    )
  }

  if (!data) {
    // `replace` so Back doesn't return straight to the guarded page.
    return <Navigate to="/signin" replace />
  }

  return <Outlet />
}
