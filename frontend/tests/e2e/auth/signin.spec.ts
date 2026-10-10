import { test, expect } from '../fixtures'
import { ANONYMOUS, signIn, TEST_USER } from '../helpers/auth'

test.describe('authentication', () => {
  // These tests exercise the sign-in form itself. Inheriting the shared
  // session would let them pass while proving nothing, so each one starts
  // signed out (AUTH-004 in particular asserts the redirect).
  test.use({ storageState: ANONYMOUS })

  test('AUTH-001: valid login reaches the studio', { tag: '@p0' }, async ({ page }) => {
    await signIn(page)
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open profile menu' })).toBeVisible()
  })

  test('AUTH-002: wrong password is rejected by the backend', { tag: '@p1' }, async ({ page }) => {
    // Real backend auth landed. The prototype accepted any credentials;
    // now an unknown password must fail with a visible error and stay put.
    await page.goto('/signin')
    await page.getByLabel('Email').fill('qa@example.com')
    await page.getByLabel('Password', { exact: true }).fill('wrong-password-on-purpose')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL('/signin')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('AUTH-002b: unknown account is rejected by the backend', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/signin')
    await page.getByLabel('Email').fill('definitely-not-a-real-user@example.com')
    await page.getByLabel('Password', { exact: true }).fill('whatever-it-is')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL('/signin')
  })

  test('AUTH-003: logout returns to sign in', { tag: '@p0' }, async ({ page }) => {
    await signIn(page)
    await page.getByRole('button', { name: 'Open profile menu' }).click()
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL('/signin')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('AUTH-004: /studio redirects to sign in without a session', { tag: '@p1' }, async ({ page }) => {
    // Route guard landed (RequireAuth). Unauthenticated access must bounce
    // to /signin rather than rendering the studio, and `replace` means Back
    // must not return to the guarded URL.
    await page.goto('/studio')
    await expect(page).toHaveURL('/signin')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

    // Signed out must not leave a usable session behind.
    await page.reload()
    await expect(page).toHaveURL('/signin')
  })

  test('AUTH-005: empty required fields block submission', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/signin')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/signin')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('AUTH-006: malformed email blocks submission', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/signin')
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Sign In' }).click()
    // Native HTML5 email validation must prevent the submit.
    await expect(page).toHaveURL('/signin')
  })

  test('AUTH-007: password visibility can be toggled', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/signin')
    const passwordInput = page.getByLabel('Password', { exact: true })

    await expect(passwordInput).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Show password' }).click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    await page.getByRole('button', { name: 'Hide password' }).click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('AUTH-008: Google sign-in is offered and hands off to Google', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/signin')

    const googleButton = page.getByRole('button', { name: 'Continue with Google' })
    await expect(googleButton).toBeEnabled()
    // The prototype disclosure only existed while the button was a stub.
    await expect(page.getByText('Google sign-in is not available yet')).toHaveCount(0)

    // Serve a stub so the test never depends on Google's real login page: we
    // only need to prove we were *sent* there, carrying the callback path the
    // backend will have registered in the Google console.
    await page.route('https://accounts.google.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Google stub</title>',
      }),
    )

    await googleButton.click()
    await page.waitForURL(/https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/)

    const params = new URL(page.url()).searchParams
    expect(params.get('client_id')).toBeTruthy()
    expect(params.get('state')).toBeTruthy()
    expect(params.get('redirect_uri')).toMatch(/\/api\/auth\/callback\/google$/)
  })

  test('AUTH-018: an OAuth failure arriving as a query param is shown', { tag: '@p2' }, async ({ page }) => {
    // Social sign-in never rejects a request — Better Auth 302s back to
    // errorCallbackURL with a machine code in the query string. Ignoring
    // `?error=` would leave the user staring at a silently blank form.
    await page.goto('/signin?error=access_denied&error_description=The+user+cancelled')

    await expect(page.getByRole('alert')).toHaveText('Google sign-in was cancelled.')
    // Still on the sign-in page — the error must not bounce us to /studio.
    // The query string it arrived with deliberately stays put, so a refresh
    // re-surfaces the same message instead of dropping it silently.
    expect(new URL(page.url()).pathname).toBe('/signin')
  })

  test('AUTH-009: session survives a page reload', { tag: '@p1' }, async ({ page }) => {
    // The session cookie is the whole point of the guard — if a refresh
    // bounced the user back to /signin, signing in would be pointless.
    await signIn(page)
    await page.reload()
    await expect(page).toHaveURL('/studio')
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
  })

  test('AUTH-015: unreachable server shows an error instead of hanging', { tag: '@p1' }, async ({ page }) => {
    // Regression guard. handleSubmit used to await signIn.email() without a
    // try/catch, so when the request failed the rejection escaped the async
    // handler: setSubmitting(false) never ran, no message was set, and the
    // form just sat on /signin with the button spinning forever.
    await page.route('**/api/auth/sign-in/email', (route) => route.abort('failed'))

    await page.goto('/signin')
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Something must be reported — and specifically our fallback, which is
    // only reachable through the catch branch.
    await expect(page.getByRole('alert')).toContainText('Could not reach the server')
    await expect(page).toHaveURL('/signin')

    // ...and the form must be usable again, not stuck on "Signing in…".
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeEnabled()
  })

  test('AUTH-016: sign-in works straight after logging out, without a reload', { tag: '@p1' }, async ({ page }) => {
    // Three full sign-in/out round-trips against the remote database. Under
    // parallel load each cycle can take several seconds, so the suite-wide
    // 30 s budget flakes; double it.
    test.setTimeout(60_000)

    // Regression guard for the "first sign-in does nothing" bug.
    //
    // Better Auth's session atom keeps whatever the last check produced, so
    // after a sign-out it reads `data: null, isPending: false`. The sign-in
    // form then navigated to /studio while that value was still current, the
    // guard read it as "no session" and redirected straight back to /signin.
    // It alternated — the failed attempt let the atom revalidate in the
    // background, so only every other one got through.
    //
    // Two details make this test catch it:
    //   * it never calls page.goto() after the first load, because a reload
    //     wipes the in-memory cache and hides the stale value;
    //   * it loops, because a single attempt can land on the working side.
    await page.goto('/signin')

    for (let attempt = 0; attempt < 3; attempt++) {
      await page.getByLabel('Email').fill(TEST_USER.email)
      await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password)
      await page.getByRole('button', { name: 'Sign In' }).click()

      // The bounce showed up as an immediate return to /signin.
      await expect(page).toHaveURL('/studio')
      await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()

      // Sign out through the UI so the atom is left holding the post-logout
      // null that the next attempt has to contend with.
      await page.getByRole('button', { name: 'Open profile menu' }).click()
      await page.getByRole('button', { name: 'Log out' }).click()
      await expect(page).toHaveURL('/signin')
    }
  })
})

// The other direction of the guard. AUTH-004 keeps anonymous users out of
// /studio; this keeps signed-in users off the pages meant for anonymous
// visitors. It keeps the shared authenticated session on purpose — that
// session is the whole subject of the test.
test.describe('guest-only routes', () => {
  test('AUTH-017: signed-in users are sent from the auth pages to the studio', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/signin')
    await expect(page).toHaveURL('/studio')
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()

    await page.goto('/signup')
    await expect(page).toHaveURL('/studio')
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
  })
})
