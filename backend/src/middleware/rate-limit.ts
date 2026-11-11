import type { MiddlewareHandler } from 'hono'

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/**
 * Simple in-memory fixed-window rate limiter keyed by client IP.
 *
 * Intentionally lightweight: it does not need a shared store for this app's
 * single-instance deployment, and it is bypassed for loopback clients so local
 * development and the Playwright suite are not throttled.
 */
export function rateLimit(options: { windowMs: number; max: number }): MiddlewareHandler {
  const { windowMs, max } = options
  return async (c, next) => {
    const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    const ip = forwarded || c.req.header('x-real-ip') || 'unknown'

    // Loopback clients (local dev, CI runners, Playwright) are never limited.
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip === 'unknown') {
      await next()
      return
    }

    const now = Date.now()
    const bucket = buckets.get(ip)
    if (!bucket || now >= bucket.resetAt) {
      buckets.set(ip, { count: 1, resetAt: now + windowMs })
      await next()
      return
    }

    if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
      c.header('Retry-After', String(retryAfter))
      return c.json({ error: 'Too many requests. Please try again later.' }, 429)
    }

    bucket.count += 1
    await next()
  }
}

// Periodic cleanup to avoid unbounded memory growth.
setInterval(() => {
  const now = Date.now()
  for (const [ip, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(ip)
  }
}, 60_000).unref()