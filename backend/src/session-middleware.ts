import { createMiddleware } from 'hono/factory'
import { auth } from './auth.ts'

type AuthEnv = {
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

/** Same as above, but always continues — use when the session is optional. */
export const attachSession = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  c.set('session', session)
  await next()
})
