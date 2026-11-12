 import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'
import { bodyLimit } from 'hono/body-limit'
import { auth } from './modules/auth/auth.ts'
import { requireTrustedOrigin } from './middleware/origin-guard.ts'
import { securityHeaders } from './middleware/security-headers.ts'
import { rateLimit } from './middleware/rate-limit.ts'
import adminApi from './routes/admin/index.ts'
import bookingApi from './routes/bookings.ts'
import publicApi from './routes/public.ts'
import uploadApi from './routes/uploads.ts'

const app = new Hono()

app.use('*', securityHeaders())
app.use('/api/*', rateLimit({ windowMs: 60_000, max: 60 }))

// Origins allowed to call the API endpoints with credentials.
// Must never be `*` when credentials are enabled.
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  ...(process.env.EXTRA_TRUSTED_ORIGINS?.split(',').map((o) => o.trim()) ?? []),
]

app.get('/health', (c) => {
  return c.json({
    message: 'This is healthy',
    status: 200
  })
})

// One CORS policy for the whole API surface — auth endpoints plus the booking
// and media routes below. Registered before them so nothing is left un-CORSed.
app.use(
  '/api/*',
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
)

// Cookie-authenticated mutations get a second CSRF check on top of CORS and
// SameSite: a browser-supplied Origin outside the allowlist is refused.
// Better Auth already enforces its own origin rules, so this covers the app's
// own booking and admin endpoints.
const trustedOrigin = requireTrustedOrigin(allowedOrigins)
app.use('/api/bookings', trustedOrigin)
app.use('/api/bookings/*', trustedOrigin)
app.use('/api/admin', trustedOrigin)
app.use('/api/admin/*', trustedOrigin)

// Reject oversized request bodies early (1 MB) on the JSON mutation surfaces.
// Uploads are exempt: /api/admin/media/upload streams a raw MP4/MP3 body of
// up to 200 MB and enforces its own ceiling in storage.ts.
const oneMb = 1024 * 1024
const jsonBodyLimit = (exempt: RegExp): MiddlewareHandler => {
  const limit = bodyLimit({ maxSize: oneMb })
  return async (c, next) => {
    if (exempt.test(c.req.path)) return next()
    return limit(c, next)
  }
}
app.use('/api/auth/*', jsonBodyLimit(/$^/))
app.use('/api/bookings', jsonBodyLimit(/$^/))
app.use('/api/bookings/*', jsonBodyLimit(/$^/))
app.use('/api/admin', jsonBodyLimit(/$^/))
app.use('/api/admin/*', jsonBodyLimit(/\/media\/upload$/))

// Better Auth handles everything under /api/auth/* (sign-in, sign-up,
// Google OAuth callback, session, sign-out...). Register before any
// catch-all so it isn't shadowed.
app.all('/api/auth/*', (c) => auth.handler(c.req.raw))

// Public catalog + session probe.
app.route('/api', publicApi)

// Uploaded media files, served with byte-range support.
app.route('/api/uploads', uploadApi)

// The signed-in customer's own reservations.
app.route('/api/bookings', bookingApi)

// Everything under /api/admin is guarded once, inside the sub-app.
app.route('/api/admin', adminApi)

export default app

