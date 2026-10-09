import { test, expect } from '../fixtures'
import { ANONYMOUS, signIn } from '../helpers/auth'
import { BACKEND_URL } from '../helpers/env'

/**
 * SMOKE — "Can a user actually use the BTP Karaoke website?"
 * Fast P0 subset of the critical journeys (docs/testing/test-cases.md).
 */
test.describe('smoke', () => {
  test('SMOKE-001: website loads', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sing your heart out')
    await expect(page.getByRole('link', { name: 'BTP KARAOKE' })).toBeVisible()
  })

  test.describe('as a guest', () => {
    // /signin is guest-only, so the shared session would redirect this to
    // /studio and the link would no longer reach the sign-in page.
    test.use({ storageState: ANONYMOUS })

    test('SMOKE-002: main navigation works', { tag: '@p0' }, async ({ page }) => {
      await page.goto('/')
      await page.getByRole('link', { name: 'Sign In' }).first().click()
      await expect(page).toHaveURL('/signin')
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    })
  })

  test('SMOKE-003: user can authenticate', { tag: '@p0' }, async ({ page }) => {
    await signIn(page)
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
  })

  test('SMOKE-004: user can discover a karaoke collection', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/studio')
    await page.getByRole('button', { name: 'Rock', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Pivot Rhythm Anthems Vol.' })).toBeVisible()
    await expect(page.getByText('Viewing 1 of 6 sets')).toBeVisible()
  })

  test('SMOKE-005: critical karaoke flow works', { tag: '@p0' }, async ({ page }) => {
    await signIn(page)

    await page.getByRole('button', { name: 'Ballad', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Midnight Serenade' })).toBeVisible()

    const playerBar = page.getByRole('contentinfo')
    await playerBar.getByRole('button', { name: 'Play' }).click()
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()

    await page.getByRole('button', { name: 'Open profile menu' }).click()
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL('/signin')
  })

  test('SMOKE-006: backend health endpoint responds', { tag: '@p0' }, async ({ request }) => {
    const health = await request.get(`${BACKEND_URL}/health`)
    expect(health.ok()).toBeTruthy()
    expect(await health.json()).toEqual({ message: 'This is healthy', status: 200 })
  })
})
