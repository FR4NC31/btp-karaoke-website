import { Link } from 'react-router'

function Bar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-elevated motion-reduce:animate-none ${className}`}
    />
  )
}

/**
 * The signed-in studio shell as placeholders — sidebar, top bar with search,
 * video-card grid. It doubles as the background for both session states, so
 * the guards never show a bare text page: the skeleton is what the real shell
 * (studio / admin layout) will replace a beat later.
 */
function ShellSkeleton() {
  return (
    <div aria-hidden="true" className="flex h-dvh bg-background">
      <div className="hidden w-64 shrink-0 flex-col gap-5 border-r border-border px-4 py-4 md:flex">
        <Bar className="h-9 w-40 rounded-lg" />
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Bar key={index} className="h-9 w-full" />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
          <Bar className="h-9 w-full max-w-lg rounded-lg" />
          <div className="ml-auto flex items-center gap-2">
            <Bar className="h-9 w-28 rounded-lg" />
            <Bar className="h-9 w-24 rounded-lg" />
            <Bar className="size-9 rounded-full" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-6">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <div className="flex items-start gap-2.5">
              <Bar className="size-9 shrink-0 rounded-lg" />
              <div className="space-y-2">
                <Bar className="h-6 w-44" />
                <Bar className="h-3 w-80 max-w-full" />
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {Array.from({ length: 5 }, (_, index) => (
                <Bar key={index} className="h-7 w-16 rounded-full" />
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(16rem,27rem))]">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-border bg-surface"
              >
                <Bar className="aspect-[16/10] w-full rounded-none" />
                <div className="space-y-2 px-3.5 pt-2.5 pb-3">
                  <Bar className="h-4 w-3/4" />
                  <Bar className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Neutral loading chrome for public (guest) routes — no studio shell. */
function GuestSkeleton() {
  return (
    <div aria-hidden="true" className="grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Bar className="size-10 rounded-full" />
        <Bar className="h-3 w-32" />
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

/** Neutral session check for public auth pages. */
export function SessionCheckingGuest() {
  return (
    <div role="status">
      <span className="sr-only">Checking your session…</span>
      <GuestSkeleton />
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
        <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-2xl">
          <p role="alert" className="text-sm text-error">
            Could not reach the server to check your session.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-border bg-surface-elevated px-4 py-2 text-sm font-semibold transition hover:border-primary/50 hover:text-primary"
            >
              Try again
            </button>
            <Link
              to="/"
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary transition hover:text-text-primary"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
