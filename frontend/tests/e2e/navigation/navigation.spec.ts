import { test, expect } from '../fixtures'
import { ANONYMOUS } from '../helpers/auth'

test.describe('navigation', () => {
  // The landing auth buttons open modals, and the /signin + /signup
  // fallback routes still send a signed-in user to /studio (AUTH-017).
  // Asserting either requires starting signed out.
  test.use({ storageState: ANONYMOUS })

  test('NAV-001: landing auth buttons open sign-up and sign-in modals', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/')

    // Get Started → sign-up modal
    await page.getByRole('button', { name: 'Get Started' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Create account' })).toBeVisible()
    await expect(page).toHaveURL('/')

    // Modal cross-links switch modes in place — both directions
    await dialog.getByRole('button', { name: 'Sign in' }).click()
    await expect(dialog.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Sign up' }).click()
    await expect(dialog.getByRole('heading', { name: 'Create account' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    // Hero Sign In → sign-in modal
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page).toHaveURL('/')
  })

  test('NAV-002: auth pages cross-link to each other', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/signup')
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/signin')

    await page.getByRole('link', { name: 'Sign up' }).click()
    await expect(page).toHaveURL('/signup')
  })

  test('NAV-004: header contact link reaches the contact page', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'Contact' }).click()
    await expect(page).toHaveURL('/contact')
    await expect(page.getByRole('heading', { level: 1, name: 'Direct Lines' })).toBeVisible()
  })

  test.describe('mobile', () => {
    test.use({ viewport: { width: 390, height: 844 } })

    test('NAV-003: hamburger menu opens, navigates and closes', { tag: '@p1' }, async ({ page }) => {
      await page.goto('/')

      const hamburger = page.getByRole('button', { name: 'Open menu' })
      await expect(hamburger).toBeVisible()
      await expect(hamburger).toHaveAttribute('aria-expanded', 'false')
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeHidden()

      await hamburger.click()
      const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' })
      await expect(mobileNav).toBeVisible()
      await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true')

      await mobileNav.getByRole('link', { name: 'Contact' }).click()
      await expect(page).toHaveURL('/contact')

      await page.goto('/')
      await page.getByRole('button', { name: 'Open menu' }).click()
      await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Home' }).click()
      await expect(page).toHaveURL('/')
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeHidden()
      await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
    })
  })
})
