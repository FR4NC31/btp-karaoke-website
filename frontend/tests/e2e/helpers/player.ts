import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** Hands back the console player bar paused and showing Play. */
export async function settlePlayerBar(page: Page) {
  const playerBar = page.getByRole('contentinfo')
  await expect(playerBar).toBeVisible()

  const pause = playerBar.getByRole('button', { name: 'Pause' })
  if (await pause.isVisible()) await pause.click()

  await expect(playerBar.getByRole('button', { name: 'Play' })).toBeVisible()
}
