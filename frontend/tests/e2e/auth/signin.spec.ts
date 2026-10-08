import { test, expect } from '../fixtures'
import { signIn, TEST_USER } from '../helpers/auth'

test.describe('authentication', () => {
  test('AUTH-001: valid login reaches the studio', { tag: '@p0' }, async ({ page }) => {
    await signIn(page)
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open profile menu' })).toBeVisible()
  })

  test('AUTH-002: any credentials are accepted (prototype mock auth)', { tag: '@p1' }, async ({ page }) => {
    // Known limitation: auth is client-side only — there is no backend
    // credential check yet. This pins the current prototype behavior and
    // will intentionally FAIL when real backend auth lands, forcing a QA
    // review (see docs/testing/test-cases.md).
    await page.goto('/signin')
    await page.getByLabel('Email').fill('definitely-not-a-real-user@example.com')
    await page.getByLabel('Password', { exact: true }).fill('wrong-password-on-purpose')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/studio')
  })

  test('AUTH-003: logout returns to sign in', { tag: '@p0' }, async ({ page }) => {
    await signIn(page)
    await page.getByRole('button', { name: 'Open profile menu' }).click()
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL('/signin')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('AUTH-004: /studio loads without a session (no auth guard — known limitation)', { tag: '@p2' }, async ({ page }) => {
    // Known limitation: the prototype has no route guard. This documents
    // current behavior; when protected routes are implemented this test
    // must be inverted to assert a redirect to /signin.
    await page.goto('/studio')
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
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
    await expect(googleButton).toHaveAttribute('title', /not implemented/i)
    await expect(googleButton).toContainText('Soon')
    await expect(page.getByText('Google sign-in is not available yet')).toBeVisible()
  })
})
