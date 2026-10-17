/**
 * Set while a deliberate sign-out is clearing the server session.
 *
 * The profile menu performs the sign-out and then lands on the landing page,
 * but the session atom also turns null the moment `signOut()` resolves —
 * which makes RequireAuth decide "no session" and bounce to /signin at the
 * same instant. The two navigations race, and whenever the auth roundtrip is
 * slow enough the guard's bounce lands last (reproducible with parallel E2E
 * workers: AUTH-003 / SMOKE-005 received /signin instead of /).
 *
 * While this flag is on, the guard resolves "no session" to the same landing
 * page the sign-out handler targets, so either navigation order ends where
 * the visitor meant to go. Not React state on purpose: it is written and
 * read across two unrelated components, and it must already be visible when
 * the atom turns null, in the very first render after the sign-out.
 *
 * Reset when a session exists again (RequireAuth sees `data`), or when the
 * sign-out fails (the person stays put, still signed in).
 */
let sessionExit = false

export function markSessionExit(value: boolean) {
  sessionExit = value
}

export function isSessionExitInProgress() {
  return sessionExit
}
