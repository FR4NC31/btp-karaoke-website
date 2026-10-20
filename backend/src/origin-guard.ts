import type { MiddlewareHandler } from 'hono'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Defense-in-depth CSRF check for the cookie-authenticated mutation routes.
 *
 * The session cookie is SameSite=Lax and CORS already refuses cross-origin
 * reads, but neither is a complete CSRF control. Browsers attach `Origin` to
 * every non-GET request, so an origin that is present but not one of the
 * configured frontend origins is refused. Requests with no Origin header
 * (curl, server-to-server, Playwright's API client) still work — this guard
 * narrows browser-driven attacks without turning the API into a browser-only
 * surface.
 */
export function requireTrustedOrigin(allowedOrigins: string[]): MiddlewareHandler {
  const allowed = new Set(allowedOrigins)

  return async (c, next) => {
    if (SAFE_METHODS.has(c.req.method)) {
      await next()
      return
    }

    const origin = c.req.header('origin')
    if (origin && !allowed.has(origin)) {
      return c.json({ error: 'Origin not allowed.' }, 403)
    }

    await next()
  }
}
