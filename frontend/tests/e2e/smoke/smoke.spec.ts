import { test, expect } from '../fixtures'
import { ANONYMOUS, signIn } from '../helpers/auth'
import { BACKEND_URL } from '../helpers/env'
import { settlePlayerBar } from '../helpers/player'

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

      // Hero auth button opens the sign-in modal instead of routing.
      await page.getByRole('button', { name: 'Sign In', exact: true }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
      await expect(page).toHaveURL('/')

      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()

      // Header nav still routes normally.
      await page.getByRole('link', { name: 'Contact' }).first().click()
      await expect(page).toHaveURL('/contact')
      await expect(page.getByRole('heading', { level: 1, name: 'Direct Lines' })).toBeVisible()
    })
  })

  test('SMOKE-003: user can authenticate', { tag: '@p0' }, async ({ page }) => {
    await signIn(page)
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
  })

  test('SMOKE-004: user can discover the video song', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The Reason')
    await expect(page.getByRole('link', { name: 'Play The Reason' })).toBeVisible()
    // No Radio assertion here: sections render only while the admin-managed
    // catalog has published rows, and radio ships empty.
  })

  test('SMOKE-005: critical karaoke flow works', { tag: '@p0' }, async ({ page }) => {
    await signIn(page)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The Reason')

    // The bar drives the real lobby track on the hub — settle any autoplay
    // first, then the Play/Pause toggle runs deterministically.
    await settlePlayerBar(page)
    const playerBar = page.getByRole('contentinfo')
    await playerBar.getByRole('button', { name: 'Play' }).click()
    await expect(playerBar.getByRole('button', { name: 'Pause' })).toBeVisible()

    // The video song card hops into the player-queue console.
    await page.getByRole('link', { name: 'Play The Reason' }).click()
    await expect(page).toHaveURL('/studio/player-queue')
    await expect(page.getByRole('heading', { name: 'Karaoke & Studio Audio Console' })).toBeVisible()

    await page.getByRole('button', { name: 'Open profile menu' }).click()
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL('/')
  })

  test('SMOKE-006: backend health endpoint responds', { tag: '@p0' }, async ({ request }) => {
    const health = await request.get(`${BACKEND_URL}/health`)
    expect(health.ok()).toBeTruthy()
    expect(await health.json()).toEqual({ message: 'This is healthy', status: 200 })
  })
})
