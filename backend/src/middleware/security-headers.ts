import type { MiddlewareHandler } from 'hono'

/**
 * Baseline security headers applied to every response. These are deliberately
 * conservative and safe for the SPA + JSON API surface: they do not restrict
 * scripts/styles in a way that would break Vite's dev build or the production
 * bundle, while still closing the common clickjacking / MIME-sniffing /
 * referrer-leakage gaps.
 */
export function securityHeaders(): MiddlewareHandler {
  return async (c, next) => {
    await next()

    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Frame-Options', 'DENY')
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    // HSTS only makes sense over HTTPS; emitting it on http://localhost would
    // be noise (and would be ignored by browsers anyway).
    const proto = c.req.header('x-forwarded-proto') ?? new URL(c.req.url).protocol.replace(':', '')
    if (proto === 'https') {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
  }
}