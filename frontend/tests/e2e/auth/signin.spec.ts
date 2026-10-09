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

  test('AUTH-008: Google sign-in is disabled and labeled as prototype', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/signin')
    const googleButton = page.getByRole('button', { name: 'Continue with Google' })
    await expect(googleButton).toBeDisabled()
    await expect(googleButton).toContainText('Soon')
    await expect(page.getByText('Google sign-in is not available yet')).toBeVisible()
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
})
