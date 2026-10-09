/**
 * The two full-screen states the route guards share.
 *
 * Extracted so `RequireAuth` and `RequireGuest` describe a session exactly the
 * same way — if they ever drift, a user could be told two different things
 * about why they are or aren't being let through.
 */
export function SessionChecking() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background text-text-primary">
      <p className="text-text-muted">Checking your session…</p>
    </div>
  )
}

export function SessionUnavailable() {
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
