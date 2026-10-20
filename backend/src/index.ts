import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './auth.ts'
import { requireTrustedOrigin } from './origin-guard.ts'
import adminApi from './routes/admin/index.ts'
import bookingApi from './routes/bookings.ts'
import publicApi from './routes/public.ts'
import uploadApi from './routes/uploads.ts'

const app = new Hono()

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
