import { createMiddleware } from 'hono/factory'
import { auth } from '../modules/auth/auth.ts'

export type AuthEnv = {
  Variables: {
    session: typeof auth.$Infer.Session | null
  }
}

/**
 * Attaches the Better Auth session to the Hono context.
 * `session` is null when no one is signed in — check it yourself
 * rather than assuming a 401, so public routes keep working.
 */
export const requireSession = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('session', session)
  await next()
})

/**
 * The authorization boundary for every /api/admin/* route.
 *
 * 401 for no session, 403 for a signed-in non-admin — the two are kept apart
 * so the frontend can send a stale session to /signin and a regular user back
 * to /studio. The role is read from the user row on the server (Better Auth
 * loads it fresh on every getSession); nothing here trusts client input, and
 * `role` is `input: false` in src/auth.ts so no request can set it either.
 *
 * Registered ONCE against the admin sub-app in src/index.ts, so a route
 * added under /api/admin later cannot forget it.
 */
export const requireAdmin = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  if (session.user.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  c.set('session', session)
  await next()
})


