import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

/**
 * Rendered for any error thrown while rendering a route.
 *
 * Without this, a crash inside a page component falls through to React
 * Router's stock boundary: the app's own chrome disappears and the cause is
 * only visible in the console. Route errors also do *not* bubble to a React
 * error boundary wrapped around `<RouterProvider>` — React Router catches
 * them first and hands them to `errorElement` — so the router is the only
 * place this can be handled.
 *
 * The technical detail is shown rather than hidden: a white screen with a
 * console entry is precisely the failure mode we're removing, and QA needs
 * the cause on screen to file it.
 */
export default function RouteError() {
  const error = useRouteError()

  const detail = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : String(error)

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 text-text-primary">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p role="alert" className="mt-3 text-sm text-error">
          {detail || 'The page could not be displayed.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface"
          >
            Reload
          </button>
          <Link
            to="/"
            className="rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
