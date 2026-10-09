import { test, expect } from '../fixtures'

/**
 * KARAOKE — song discovery on the Studio page (collections, genre filter,
 * telemetry listing). The prototype has no working search input and no
 * song-detail/lyrics page — see docs/testing/test-cases.md (N/A section).
 *
 * /studio is opened directly: it is guarded by RequireAuth, but the
 * `chromium` project injects the shared session saved by setup/auth.setup.ts,
 * so a UI sign-in here would only add time. The full sign-in → discovery
 * journey is covered by SMOKE-005.
 */
test.describe('karaoke discovery', () => {
  test('KARAOKE-001: studio opens with master vault collections', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page.getByText('BTP MUSIC PRODUCTION')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Oph Gold & Contemporary')
    await expect(page.getByText('Viewing 6 of 6 sets')).toBeVisible()
    await expect(page.locator('main article')).toHaveCount(6)
  })

  test('KARAOKE-002: genre filter narrows and restores collections', { tag: '@p0' }, async ({ page }) => {
    await page.goto('/studio')

    await page.getByRole('button', { name: 'Rock', exact: true }).click()
    await expect(page.getByText('Viewing 1 of 6 sets')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pivot Rhythm Anthems Vol.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Afternoon Drive' })).toBeHidden()

    await page.getByRole('button', { name: 'All Genres' }).click()
    await expect(page.getByText('Viewing 6 of 6 sets')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Afternoon Drive' })).toBeVisible()
  })

  test('KARAOKE-003: telemetry listing shows track details', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/studio')

    const table = page.getByRole('table')
    await expect(table).toBeVisible()
    await expect(table.getByRole('row')).toHaveCount(6) // header + 5 tracks

    const firstTrack = table.getByRole('row').filter({ hasText: 'Die With A Smile (Cover)' })
    await expect(firstTrack).toContainText('Lady Gaga & Bruno Mars')
    await expect(firstTrack).toContainText('WAV 24-bit')
    await expect(firstTrack.getByRole('button', { name: 'Play' })).toBeVisible()

    // Every track row exposes its own Play action (header row has none).
    await expect(table.getByRole('button', { name: 'Play' })).toHaveCount(5)
  })

  test('KARAOKE-004: sidebar session browsing highlights selection', { tag: '@p2' }, async ({ page }) => {
    await page.goto('/studio')
    await expect(page.getByRole('heading', { name: 'Mixing Studio' })).toBeVisible()

    const defaultItem = page.getByRole('button', { name: /Master Collections Vault/ })
    const otherItem = page.getByRole('button', { name: /Recording Studio Vault/ })

    // Active state is currently styling-only (no aria-pressed yet).
    await expect(defaultItem).toHaveClass(/bg-primary-soft/)
    await otherItem.click()
    await expect(otherItem).toHaveClass(/bg-primary-soft/)
    await expect(defaultItem).not.toHaveClass(/bg-primary-soft/)
  })
})
