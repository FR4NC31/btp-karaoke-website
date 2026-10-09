import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

/**
 * Client for the Hono + Better Auth backend.
 *
 * Requests go to `/api/auth/*` on the same origin, which Vite proxies to the
 * backend (see vite.config.ts). Same-origin is what lets the Better Auth
 * session cookie work without CORS or cross-site cookie headaches.
 *
 * `inferAdditionalFields` teaches the client about the custom user columns so
 * they're typed on `signUp.email()` and on `useSession()`. Keep this schema in
 * sync with `user.additionalFields` in backend/src/auth.ts.
 */
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        first_name: { type: 'string', required: true },
        last_name: { type: 'string', required: true },
        contact_num: { type: 'string', required: true },
      },
    }),
  ],
})

export const { signIn, signUp, signOut, useSession } = authClient
