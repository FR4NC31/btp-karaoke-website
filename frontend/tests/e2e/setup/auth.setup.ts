import { test as setup, expect } from '@playwright/test'
import { STORAGE_STATE, signIn } from '../helpers/auth'

setup('authenticate as the shared QA user', async ({ page }) => {
  await signIn(page)
  
  // If the required profile modal appears, complete the profile so tests can proceed
  const modal = page.locator('text=Required Profile Details')
  // The modal mounts only after the async session fetch resolves, so a bare
  // `isVisible()` (which returns immediately) can miss it and leave the profile
  // incomplete in the saved storage state. Wait for it instead.
  const modalAppeared = await modal
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false)
  if (modalAppeared) {
    await page.getByLabel('First Name').fill('QA')
    await page.getByLabel('Last Name').fill('User')
    await page.getByLabel('Mobile Number').fill('09171234567')

    const provinceSelect = page.locator('#required-province')
    await provinceSelect.selectOption({ index: 1 })

    const citySelect = page.locator('#required-city')
    await page.waitForFunction(() => (document.querySelector('#required-city') as HTMLSelectElement)?.options.length > 1)
    await citySelect.selectOption({ index: 1 })

    const barangaySelect = page.locator('#required-barangay')
    await page.waitForFunction(() => (document.querySelector('#required-barangay') as HTMLSelectElement)?.options.length > 1)
    await barangaySelect.selectOption({ index: 1 })

    await page.getByRole('button', { name: 'Save & Continue' }).click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })
  }

  await page.context().storageState({ path: STORAGE_STATE })
})
