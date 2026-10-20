import { useEffect } from 'react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

export default function RouteError() {
  const error = useRouteError()

  useEffect(() => {
    document.title = 'Something went wrong | BTP Karaoke'
  }, [])

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
