import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useSession } from '../lib/auth-client'
import { isSessionExitInProgress, markSessionExit } from '../lib/session-exit'
import { SessionChecking, SessionUnavailable } from './SessionStates'

/**
 * Guards every route nested underneath it — no session, no access.
 *
 * The rule this component exists to enforce: **only redirect once we have
 * heard from the server.** The session value below is a cache, and Better
 * Auth's atom keeps whatever the last check produced, so it can lag reality:
 *
 *  - it survives a sign-out, so `data: null` may be stale by a few ms;
 *  - its on-mount revalidation is deferred and is skipped outright whenever
 *    it considers the value fresh (`Date.now() < freshUntil`).
 *
 * Reading that cache alone is what caused the "first sign-in does nothing"
 * bug: the guard saw the post-logout null, concluded "no session" and bounced
 * a user who had just signed in. Waiting on `isPending` does not help either,
 * because `isPending` is false whenever the cache holds a value — even a
 * stale one.
 *
 * Today this is belt-and-braces: `RequireGuest` sits on the auth pages with
 * the atom mounted, so sign-in usually refreshes it before we get here. That
 * is an accident of composition, not a guarantee — remove the guest guard, add
 * an OAuth callback, or land a flow that establishes a session without first
 * rendering a page that holds the atom, and the stale read comes straight
 * back. Revalidating here keeps the guarantee in the one checkpoint every
 * protected page nests under, instead of in each flow that signs someone in.
 *
 * A session we already hold is trusted: failing to revalidate it (server
 * hiccup) must not lock a signed-in user out of their own page.
 */
export default function RequireAuth() {
  const { data, error, isPending, refetch } = useSession()
  const navigate = useNavigate()
  const asked = useRef(false)
  // Whether THIS guard ever held a live session. The exit redirect below is
  // only for a session it watched drop; a visitor who mounts after an earlier
  // sign-out gets the normal /signin bounce instead (see session-exit.ts).
  const sawSession = useRef(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Logged rather than thrown: this is a render path, and the visible
    // message below is what the user acts on.
    if (error) console.error('[auth] session check failed:', error)
  }, [error])

  useEffect(() => {
    // A live session means any earlier sign-out is over; future "no session"
    // answers are genuine bounces again, not an exit in progress.
    if (data) {
      sawSession.current = true
      markSessionExit(false)
    }
  }, [data])

  useEffect(() => {
    // `asked` makes this fire at most once per mount, so an empty answer
    // settles the decision instead of asking again forever.
    if (data || isPending || asked.current) return
    asked.current = true
    // refetch() always resolves — failures are written into the atom, where
    // the branches below pick them up.
    void refetch().finally(() => setChecked(true))
  }, [data, isPending, refetch])

  // The genuine "no session" bounce. Declared as an effect (not a <Navigate>
  // render) because the decision reads `sawSession` — a ref, and refs are
  // off-limits during render. A deliberate sign-out is not an unauthorized
  // bounce: while one is in flight, aim at the landing page the sign-out
  // handler targets so the two navigations can never disagree (see
  // lib/session-exit.ts). Only a guard that watched the session drop honors
  // it — a visitor mounting after an earlier exit (flag still set) still
  // gets the normal /signin bounce.
  const willBounce = !isPending && !data && !error && checked
  useEffect(() => {
    if (!willBounce) return
    const exitInProgress = sawSession.current && isSessionExitInProgress()
    // `replace` so Back doesn't return straight to the guarded page.
    navigate(exitInProgress ? '/' : '/signin', { replace: true })
  }, [willBounce, navigate])

  if (isPending) return <SessionChecking />
  if (data) return <Outlet />
  if (error) return <SessionUnavailable />
  // Either we have just asked and are waiting, or the answer was a genuine
  // "no session" — only the latter may redirect; the effect above does it.
  if (!checked) return <SessionChecking />
  // Bounce in flight.
  return null
}
