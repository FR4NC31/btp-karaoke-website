import { test as setup } from '@playwright/test'
import { STORAGE_STATE, signIn } from '../helpers/auth'

/**
 * Shared-session setup (see qa-strategy.md, "Session persistence & protected
 * routes").
 *
 * /studio is guarded by RequireAuth, so every suite that opens it needs a
 * live session. Rather than paying for a UI sign-in inside each of those
 * tests, we sign in exactly once here and hand the resulting cookie to the
 * `chromium` project via `storageState`.
 *
 * Runs automatically as a dependency of the chromium project — you never
 * invoke it directly. Suites that must start signed out opt out with
 * `test.use({ storageState: ANONYMOUS })`.
 *
 * `signIn()` ends by asserting we reached /studio, which is only possible
 * when the backend issued a session cookie — so a failure here means
 * credentials or the backend broke, not the tests downstream.
 */
setup('authenticate as the shared QA user', async ({ page }) => {
  await signIn(page)
  await page.context().storageState({ path: STORAGE_STATE })
})
