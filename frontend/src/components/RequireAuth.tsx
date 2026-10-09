import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useSession } from '../lib/auth-client'

/**
 * Guards every route nested underneath it — no session, no access.
 *
 * Three distinct states must be told apart, because collapsing them makes
 * failures invisible:
 *
 *   pending  -> still checking; deciding now would bounce a signed-in user
 *               to /signin on every hard refresh of /studio.
 *   error    -> the check itself failed (backend down, proxy error). That is
 *               NOT the same as "signed out", so we must not redirect as if
 *               the user were anonymous — show it instead.
 *   no data  -> genuinely no session: redirect.
 *
 * Note that `data: null, isPending: false` is *not* a reliable "signed out"
 * signal on its own: Better Auth's session atom keeps the value the last
 * check produced, so straight after a sign-out it reads as "no session" even
 * though a sign-in may have just happened. The sign-in forms therefore
 * `await refetch()` before navigating here, so this component always sees a
 * settled value rather than one stale by a few milliseconds.
 */
export default function RequireAuth() {
  const { data, error, isPending } = useSession()

  useEffect(() => {
    // Logged rather than thrown: this is a render path, and the visible
    // message below is what the user acts on.
    if (error) console.error('[auth] session check failed:', error)
  }, [error])

  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-text-primary">
        <p className="text-text-muted">Checking your session…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-4 text-text-primary">
        <div className="max-w-md text-center">
          <p role="alert" className="text-sm text-error">
            Could not reach the server to check your session.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    // `replace` so Back doesn't return straight to the guarded page.
    return <Navigate to="/signin" replace />
  }

  return <Outlet />
}
