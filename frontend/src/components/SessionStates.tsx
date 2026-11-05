function Bar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-elevated motion-reduce:animate-none ${className}`}
    />
  )
}

/**
 * The signed-in app shell as placeholders — top bar, sidebar, content
 * grid. It doubles as the background for both session states, so the
 * guards never show a bare text page: the skeleton is what the real shell
 * (studio / admin layout) will replace a beat later.
 */
function ShellSkeleton() {
  return (
    <div aria-hidden="true" className="min-h-dvh bg-background">
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <Bar className="h-9 w-40" />
        <div className="ml-auto hidden gap-2 sm:flex">
          <Bar className="h-9 w-28" />
          <Bar className="h-9 w-28" />
          <Bar className="h-9 w-32" />
        </div>
      </div>
      <div className="flex">
        <div className="hidden w-60 shrink-0 space-y-4 border-r border-border p-4 md:block">
          <Bar className="h-4 w-32" />
          <Bar className="h-4 w-40" />
          <Bar className="h-4 w-36" />
          <Bar className="h-4 w-44" />
          <Bar className="h-4 w-32" />
        </div>
        <div className="flex-1 space-y-4 p-6">
          <Bar className="h-8 w-64 max-w-full" />
          <Bar className="h-4 w-96 max-w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Bar key={index} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Session check in flight — the shell pulses; no visible text. */
export function SessionChecking() {
  return (
    <div role="status">
      <span className="sr-only">Checking your session…</span>
      <ShellSkeleton />
    </div>
  )
}

/**
 * The session read failed (server unreachable): the same skeleton stays as
 * the background, dimmed behind a card that carries the alert and its
 * actions — reload to retry, or bail out to the landing page.
 */
export function SessionUnavailable() {
  return (
    <div className="relative min-h-dvh">
      <ShellSkeleton />
      <div className="absolute inset-0 grid place-items-center bg-background/80 px-4">
        <div
          role="alert"
          className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-2xl"
        >
          <p className="text-sm text-error">Could not reach the server to check your session.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold transition hover:border-primary/50 hover:text-primary"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition hover:text-text-primary"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
