import { Link, useSearchParams } from 'react-router'
import { oauthError } from '../../lib/auth-errors'

/**
 * Fallback landing page for auth failures that Better Auth cannot tie back to
 * a single OAuth flow (for example a malformed callback or expired state).
 *
 * Per-flow failures are still sent to the sign-in form's `errorCallbackURL`,
 * where the message appears inline. This route is the app-wide safety net
 * configured through `onAPIError.errorURL` in backend/src/auth.ts.
 */
export default function AuthError() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('error')
  const description = searchParams.get('error_description')
  const message = code
    ? oauthError(code, description)
    : 'Sign-in could not be completed. Please try again.'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <p className="text-xs font-semibold tracking-widest text-error uppercase">
          Authentication error
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-text-primary">Sign-in error</h1>
        <p role="alert" className="mt-4 text-sm text-text-secondary">
          {message}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/signin"
            className="rounded-lg bg-primary px-4 py-2.5 text-center font-medium text-text-primary transition hover:bg-primary-hover"
          >
            Try signing in again
          </Link>
          <Link
            to="/"
            className="rounded-lg border border-border px-4 py-2.5 text-center font-medium text-text-primary transition hover:bg-surface-elevated"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
