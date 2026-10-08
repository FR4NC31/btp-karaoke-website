import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Controlled test credentials for the prototype (client-side mock) auth.
 * These are fake values used by automated tests only — not real accounts.
 * Sign-in accepts any non-empty credentials until backend auth exists
 * (documented in docs/testing/test-cases.md, AUTH-002).
 */
export const TEST_USER = {
  email: 'qa@example.com',
  password: 'Secret123!',
}

/**
 * Signs in through the real UI form and waits for the studio.
 *
 * Used only by tests that must exercise the sign-in flow itself
 * (AUTH-001, AUTH-003, SMOKE-003/005). Other suites navigate to /studio
 * directly because the prototype has no auth guard or session to reuse —
 * see docs/testing/qa-strategy.md.
 */
export async function signIn(page: Page, credentials: { email: string; password: string } = TEST_USER) {
  await page.goto('/signin')
  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL('/studio')
}
