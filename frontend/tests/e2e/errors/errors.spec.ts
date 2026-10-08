import { test, expect } from '../fixtures'
import { BACKEND_URL } from '../helpers/env'

/** Key pages checked by the error-state health tests. */
const KEY_PAGES = ['/', '/signin', '/signup', '/studio', '/this-route-does-not-exist']

test.describe('error states and app health', () => {
  test('ERROR-001: unknown route renders the 404 page', { tag: '@p1' }, async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('404 - PAGE NOT FOUND')
  })

  test('ERROR-002: key pages load without console or page errors', { tag: '@p1' }, async ({ page, appEvidence }) => {
    for (const path of KEY_PAGES) {
      await page.goto(path)
      await expect(page.locator('#root')).not.toBeEmpty()
    }
    expect(appEvidence.consoleErrors, 'console errors while browsing key pages').toEqual([])
    expect(appEvidence.pageErrors, 'uncaught exceptions while browsing key pages').toEqual([])
  })

  test('ERROR-003: key pages load without failed or 4xx/5xx requests', { tag: '@p1' }, async ({ page, appEvidence }) => {
    for (const path of KEY_PAGES) {
      await page.goto(path)
      await expect(page.locator('#root')).not.toBeEmpty()
    }

    // SPA navigations legitimately abort in-flight requests (ERR_ABORTED).
    const realFailures = appEvidence.failedRequests.filter((line) => !line.includes('ERR_ABORTED'))
    expect(realFailures, 'failed network requests while browsing key pages').toEqual([])
    expect(appEvidence.badResponses, 'HTTP 4xx/5xx responses while browsing key pages').toEqual([])
  })

  test('ERROR-004: unknown backend route returns 404 (backend error handling)', { tag: '@p2' }, async ({ request }) => {
    // Backend error-handling probe; also confirms the QA layer can tell a
    // backend outage (BLOCKED) apart from an application bug.
    const res = await request.get(`${BACKEND_URL}/definitely-not-a-route`)
    expect(res.status(), 'unknown backend route should 404').toBe(404)
  })
})
