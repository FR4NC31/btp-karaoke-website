This is the test for Discord

## Testing

BTP Karaoke QA runs on Playwright (browser E2E against frontend + backend):

```bash
cd frontend
npm run test:e2e          # full suite (35 tests)
npm run test:e2e:smoke    # fast P0 smoke suite
```

Documentation:

- [docs/testing/playwright.md](docs/testing/playwright.md) — architecture, running, debugging, CI
- [docs/testing/qa-strategy.md](docs/testing/qa-strategy.md) — priorities, severity, production checklist
- [docs/testing/test-cases.md](docs/testing/test-cases.md) — test case catalog
- [docs/testing/test-reports.md](docs/testing/test-reports.md) — PASS/FAIL/BLOCKED reporting
- [docs/testing/bug-reporting.md](docs/testing/bug-reporting.md) — GitHub bug workflow
