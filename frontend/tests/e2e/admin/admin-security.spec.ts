import { test, expect } from '../fixtures'
import { ANONYMOUS, TEST_USER } from '../helpers/auth'

/**
 * ADMIN API — the authorization boundary, pinned down.
 *
 * These are the regression tests for the whole reason the admin role is safe
 * to have: nothing below can be satisfied by UI state, only by the server's
 * own checks. Four distinct ways an account could have reached admin powers
 * are exercised against the live backend, and each must fail in its own
 * layer:
 *
 *   SEC-001  no session        -> 401 (requireAdmin, before any handler)
 *   SEC-002  session, role user -> 403, with no data in the body
 *   SEC-003  self-promotion    -> impossible through sign-up or update-user
 *   SEC-004/005  the /admin UI guard is UX only — these assert it still
 *            behaves, but the API tests above are the real boundary
 *   SEC-006/007  `?next=` is attacker-controllable, so the post-sign-in
 *            destination is pinned to our own origin
 *
 * If any of these fail, the console is not "locked to admins", full stop.
 * See backend/src/session-middleware.ts (requireAdmin) and
 * backend/src/auth.ts (role is `input: false`).
 */

/** Every admin endpoint shape, so a new route cannot ship untested. */
function adminCalls(request: import('@playwright/test').APIRequestContext) {
  return {
    listBookings: request.get('/api/admin/bookings'),
    listUsers: request.get('/api/admin/users?query=qa'),
    createBooking: request.post('/api/admin/bookings', {
      data: {
        guestName: 'SEC probe',
        serviceId: 'svc_does_not_matter',
        bookingDate: '2030-01-01',
      },
    }),
    mutateBooking: request.post('/api/admin/bookings/does-not-exist/confirm'),
  }
}

test.describe('admin API (signed out)', () => {
  test.use({ storageState: ANONYMOUS })

  test('SEC-001: every admin endpoint answers 401 without a session', { tag: '@p1' }, async ({ request }) => {
    const calls = adminCalls(request)

    for (const response of await Promise.all(Object.values(calls))) {
      expect(response.status()).toBe(401)
      // The rejection carries nothing else — no row data, no hints.
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    }
  })
})

test.describe('admin API (regular user)', () => {
  // No storageState override: the shared qa@example.com session, role 'user'.
  // This is the account every customer suite uses, so this test is also the
  // standing proof that making booking tests run does not make admin tests
  // run.

  test('SEC-002: a signed-in non-admin gets 403 and no data anywhere', { tag: '@p1' }, async ({ request }) => {
    const calls = adminCalls(request)

    for (const response of await Promise.all(Object.values(calls))) {
      expect(response.status()).toBe(403)
      expect(await response.json()).toEqual({ error: 'Forbidden' })
    }
  })
})

test.describe('privilege escalation attempts', () => {
  test.use({ storageState: ANONYMOUS })

  test('SEC-003: role cannot be set at sign-up or through update-user', { tag: '@p1' }, async ({ request, baseURL }) => {
    const email = `qa-role-probe-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`

    // Attempt 1 — smuggle the role into sign-up. Better Auth's `input: false`
    // field handling replaces whatever the client sends with the default.
    const signUp = await request.post('/api/auth/sign-up/email', {
      headers: { Origin: baseURL ?? '' },
      data: {
        email,
        password: 'Probe123!',
        name: 'Role Probe',
        first_name: 'Role',
        last_name: 'Probe',
        contact_num: '+639170000002',
        role: 'admin',
      },
    })
    expect(signUp.ok()).toBeTruthy()
    const created = await signUp.json()
    expect(created.user.role).toBe('user')

    // Attempt 2 — promote the now-live session via update-user. The Origin
    // header is required for authenticated POSTs (Better Auth's CSRF origin
    // check); without it this would 403 before ever reaching the field
    // validation, and the test would pass for the wrong reason.
    const update = await request.post('/api/auth/update-user', {
      headers: { Origin: baseURL ?? '' },
      data: { name: 'Role Probe II', role: 'admin' },
    })
    expect(update.status()).toBe(400)

    // Attempt 3 — read the truth back through the real session endpoint.
    const session = await request.get('/api/auth/get-session')
    const sessionBody = await session.json()
    expect(sessionBody.user.role).toBe('user')
  })
})

test.describe('admin console route guard (UI)', () => {
  // The UI guard is navigation UX; the API specs above are the boundary. These
  // two keep the UX honest.

  test('SEC-004: a signed-in non-admin is bounced back to the studio', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/admin')

    await expect(page).toHaveURL('/studio')

    // Wait for the studio chrome before asserting the absence — otherwise the
    // check would pass against a page that has not rendered yet. A regular
    // user must not even see that the console exists.
    const topBar = page.getByRole('banner')
    await expect(topBar.getByRole('link', { name: 'Bookings' })).toBeVisible()
    await expect(topBar.getByRole('link', { name: 'Admin Console' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Admin Dashboard', level: 1 })).toBeHidden()
  })

  test.describe('signed out', () => {
    test.use({ storageState: ANONYMOUS })

    test('SEC-005: a signed-out visitor is sent to sign-in, remembering /admin', { tag: '@p2' }, async ({ page }) => {
      await page.goto('/admin')

      // ?next= is what returns an admin to the console after signing in, and
      // it is validated client-side before ever being navigated to
      // (frontend/src/lib/redirects.ts).
      await expect(page).toHaveURL(/\/signin\?next=%2Fadmin/)
    })
  })
})

/**
 * `?next=` is attacker-controllable, so the destination it produces is pinned
 * to our own origin (frontend/src/lib/redirects.ts).
 *
 * What the bug actually is, because the obvious guess is wrong: React Router 8
 * already refuses external targets itself — `validateNavigationTarget`, called
 * by both `<Navigate>` and `useNavigate` — so this was *never* an open
 * redirect. It threw instead, and the throw lands in the route error boundary.
 * A link to `/signin?next=%2F%0A%2F%2Fevil.example` therefore left a visitor
 * looking at "Something went wrong / External navigation is not allowed"
 * immediately after a *successful* sign-in, on our own domain, with Reload as
 * the only way forward. A crash any URL can trigger is still a bug, and it is
 * the kind that reads as "the site is broken" to whoever hits it.
 *
 * The engine room, since none of the prefix tests can see it coming: browsers
 * strip ASCII tab/newline out of a URL *before* parsing it, so
 * `/<LF>//evil.example` normalises to `///evil.example`, whose run of slashes
 * the URL parser skips and then reads `evil.example` as an authority — i.e.
 * an `http(s)://evil.example/` origin. React Router percent-decodes `next`, so `%0A` arrives
 * as a real newline, and neither the `//` nor the `/\` test matches because
 * there is only one slash so far. `safeNextPath` is the layer that should
 * refuse it; leaving it to the router means depending on a version-specific
 * internal, and paying for it with a broken page rather than a safe landing.
 *
 * Both tests below assert observable behaviour — a successful navigation and
 * the absence of uncaught page errors — rather than React Router's error text,
 * so they keep their teeth if that message ever changes.
 *
 * Every target starts from a signed-out context and submits the real sign-in
 * form. Merely opening /signin with an inherited session would bounce straight
 * to /studio and never exercise the post-sign-in redirect at all.
 */
async function signInWithNext(page: import('@playwright/test').Page, next: string) {
  await page.context().clearCookies()
  await page.goto(`/signin?next=${next}`)
  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
}

test.describe('post-sign-in redirect target', () => {
  test.use({ storageState: ANONYMOUS })

  const craftedNextTargets: Array<[string, string]> = [
    ['%2F%0A%2F%2Fevil.example', 'the reported payload: "/" LF "//evil"'],
    ['%2F%0A%2Fevil.example', 'a single slash after the LF'],
    ['%2F%0D%2Fevil.example', 'CR instead of LF'],
    ['%2F%09%2Fevil.example', 'TAB instead of LF'],
    ['%2F%00%2Fevil.example', 'NUL'],
    ['%2F%2Fevil.example', 'plain protocol-relative'],
    ['%2F%5Cevil.example', 'backslash'],
  ]

  test('SEC-006: a crafted ?next= lands safely instead of breaking the page', { tag: '@p1' }, async ({ page }) => {
    // Pre-fix, every payload below threw "External navigation is not allowed"
    // into the route error boundary, so both assertions here failed.
    const pageErrors: string[] = []
    page.on('pageerror', (e) => pageErrors.push(e.message))

    for (const [payload, label] of craftedNextTargets) {
      pageErrors.length = 0
      await signInWithNext(page, payload)

      // toHaveURL resolves the expectation against baseURL, so this fails if we
      // ended up anywhere other than the studio.
      await expect(page, `${label}: did not land on the studio`).toHaveURL('/studio')
      expect(pageErrors, `${label}: the route threw instead of navigating`).toEqual([])
    }
  })

  test('SEC-007: a legitimate ?next= still lands where it asked', { tag: '@p2' }, async ({ page }) => {
    // Refusing the crafted targets must not break the feature the parameter
    // exists for.
    await signInWithNext(page, '%2Fstudio%2Fbookings')

    await expect(page).toHaveURL('/studio/bookings')
  })
})
