import { test, expect } from '../fixtures'
import { ANONYMOUS, signIn, TEST_USER } from '../helpers/auth'

test.describe('authentication', () => {
  test.use({ storageState: ANONYMOUS })

  test('AUTH-001: valid login reaches the studio', { tag: '@p0' }, async ({ page }) => {
    await signIn(page)
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open profile menu' })).toBeVisible()
  })

  test('AUTH-002: wrong password is rejected by the backend', { tag: '@p1' }, async ({ page }) => {
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

  test('AUTH-003: logout returns to the landing page', { tag: '@p0' }, async ({ page }) => {
    await signIn(page)
    await page.getByRole('button', { name: 'Open profile menu' }).click()
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { level: 1, name: /Sing your heart out/i })).toBeVisible()
  })

  test('AUTH-004: /studio redirects to sign in without a session', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page).toHaveURL('/signin')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

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
    await expect(page.getByText('Google sign-in is not available yet')).toHaveCount(0)

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
    await page.goto('/signin?error=access_denied&error_description=The+user+cancelled')

    await expect(page.getByRole('alert')).toHaveText('Google sign-in was cancelled.')
    expect(new URL(page.url()).pathname).toBe('/signin')
  })

  test('AUTH-019: a refused Google link points at the password account', {
    tag: '@p2',
  }, async ({ page }) => {
    await page.goto('/signin?error=account_not_linked')

    await expect(page.getByRole('alert')).toContainText(
      'Sign in with your email and password instead',
    )
    expect(new URL(page.url()).pathname).toBe('/signin')
  })

  test('AUTH-020: a failed logout is reported, not silently bounced', { tag: '@p1' }, async ({ page }) => {
    test.setTimeout(60_000)
    await signIn(page)
    await page.route('**/api/auth/sign-out', (route) => route.abort('failed'))

    await page.getByRole('button', { name: 'Open profile menu' }).click()
    await page.getByRole('button', { name: 'Log out' }).click()

    await expect(page.getByRole('alert')).toContainText('Could not reach the server')
    await expect(page).toHaveURL('/studio')
    await expect(page.getByRole('button', { name: 'Log out' })).toBeEnabled()
  })

  test('AUTH-009: session survives a page reload', { tag: '@p1' }, async ({ page }) => {
    await signIn(page)
    await page.reload()
    await expect(page).toHaveURL('/studio')
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
  })

  test('AUTH-015: unreachable server shows an error instead of hanging', { tag: '@p1' }, async ({ page }) => {
    await page.route('**/api/auth/sign-in/email', (route) => route.abort('failed'))

    await page.goto('/signin')
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByRole('alert')).toContainText('Could not reach the server')
    await expect(page).toHaveURL('/signin')

    await expect(page.getByRole('button', { name: 'Sign In' })).toBeEnabled()
  })

  test('AUTH-016: sign-in works straight after logging out, without a reload', { tag: '@p1' }, async ({ page }) => {
    test.setTimeout(60_000)

    await page.goto('/signin')

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt === 0) {
        await page.getByLabel('Email').fill(TEST_USER.email)
        await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password)
        await page.getByRole('button', { name: 'Sign In' }).click()
      } else {
        await page.getByRole('button', { name: 'Sign In', exact: true }).click()
        const dialog = page.getByRole('dialog')
        await dialog.getByLabel('Email').fill(TEST_USER.email)
        await dialog.getByLabel('Password', { exact: true }).fill(TEST_USER.password)
        await dialog.getByRole('button', { name: 'Sign In' }).click()
      }

      await expect(page).toHaveURL('/studio')
      await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()

      await page.getByRole('button', { name: 'Open profile menu' }).click()
      await page.getByRole('button', { name: 'Log out' }).click()
      await expect(page).toHaveURL('/')
    }
  })
})

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
