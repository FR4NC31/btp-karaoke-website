import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Controlled test credentials backed by a real account in Aiven.
 *
 * This user is seeded once into the database and reused across runs, so
 * sign-in tests exercise the actual backend credential check. If sign-in
 * starts failing with "Incorrect email or password", re-seed the account:
 *
 *   POST /api/auth/sign-up/email  with the values below plus
 *   first_name/last_name/contact_num (all required by the user table).
 */
export const TEST_USER = {
  email: 'qa@example.com',
  password: 'Secret123!',
}

/**
 * Signs in through the real UI form and waits for the studio.
 *
 * This now goes through the backend: the form posts to Better Auth, which
 * sets a session cookie. Used by tests that must exercise the sign-in flow
 * itself (AUTH-001, AUTH-003). Other suites still navigate to /studio
 * directly because there is no route guard yet — see docs/testing/qa-strategy.md.
 */
export async function signIn(page: Page, credentials: { email: string; password: string } = TEST_USER) {
  await page.goto('/signin')
  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL('/studio')
}
