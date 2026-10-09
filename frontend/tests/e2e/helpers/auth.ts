import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Where the shared authenticated session is written by setup/auth.setup.ts
 * and read back by the `chromium` project (see playwright.config.ts).
 *
 * Gitignored — it is a per-run artifact holding a live session cookie.
 */
export const STORAGE_STATE = 'playwright/.auth/user.json'

/**
 * `test.use({ storageState: ANONYMOUS })` opts a suite out of the shared
 * session above. Required for anything that drives the sign-in or sign-up
 * form itself: starting those tests already authenticated would make them
 * pass for the wrong reason.
 */
export const ANONYMOUS = { cookies: [], origins: [] }

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
 * Clears the context's cookies first. `/signin` is a guest-only route now, so
 * an inherited session would bounce the page straight to /studio and the form
 * would never appear — starting from a signed-out state is part of this
 * helper's contract, which also means suites can call it without first having
 * to reason about their own `storageState`.
 *
 * Used by the auth suites and by `setup/auth.setup.ts`, which snapshots the
 * resulting cookie into STORAGE_STATE. Other suites never call this — they
 * inherit the shared session from the `chromium` project, so they can open
 * /studio directly even though the route is now guarded.
 */
export async function signIn(page: Page, credentials: { email: string; password: string } = TEST_USER) {
  await page.context().clearCookies()
  await page.goto('/signin')
  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password', { exact: true }).fill(credentials.password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL('/studio')
}
