import { test as setup } from '@playwright/test'
import { STORAGE_STATE, signIn } from '../helpers/auth'

setup('authenticate as the shared QA user', async ({ page }) => {
  await signIn(page)
  await page.context().storageState({ path: STORAGE_STATE })
})
