import { test as base, expect } from '@playwright/test'

/**
 * Shared evidence fixture for BTP Karaoke QA.
 *
 * Silently records console errors, uncaught page errors and failed/bad
 * network activity for every test. When a test FAILS the recorded evidence
 * is attached to the Playwright report as `console-and-network.txt`, so a
 * failure always comes with console + network context (see docs/testing/bug-reporting.md).
 *
 * Passing tests keep no extra artifacts.
 */
export interface AppEvidence {
  consoleErrors: string[]
  pageErrors: string[]
  failedRequests: string[]
  badResponses: string[]
}

function formatEvidence(e: AppEvidence): string {
  const section = (title: string, items: string[]) =>
    items.length === 0 ? `## ${title}: (none)\n` : `## ${title} (${items.length})\n${items.map((i) => `- ${i}`).join('\n')}\n`
  return [
    '# Console and network evidence (captured during test)',
    section('Console errors', e.consoleErrors),
    section('Uncaught page errors', e.pageErrors),
    section('Failed requests', e.failedRequests),
    section('HTTP responses >= 400', e.badResponses),
  ].join('\n')
}

// `{ auto: true }` so every test is instrumented — evidence must not depend
// on a test opting in by requesting the fixture.
export const test = base.extend<{ appEvidence: AppEvidence }>({
  appEvidence: [
    async ({ page }, use, testInfo) => {
      const evidence: AppEvidence = {
        consoleErrors: [],
        pageErrors: [],
        failedRequests: [],
        badResponses: [],
      }

      page.on('console', (msg) => {
        if (msg.type() === 'error') evidence.consoleErrors.push(msg.text())
      })
      page.on('pageerror', (err) => evidence.pageErrors.push(String(err)))
      page.on('requestfailed', (req) => {
        evidence.failedRequests.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText ?? 'unknown'}`)
      })
      page.on('response', (res) => {
        if (res.status() >= 400) {
          evidence.badResponses.push(`${res.status()} ${res.request().method()} ${res.url()}`)
        }
      })

      await use(evidence)

      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('console-and-network.txt', {
          body: formatEvidence(evidence),
          contentType: 'text/plain',
        })
      }
    },
    { auto: true },
  ],
})

export { expect }
