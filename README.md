This is the test for Discord

## Testing

BTP Karaoke QA runs on Playwright (browser E2E against frontend + backend):

```bash
cd frontend
npm run test:e2e          # full suite
npm run test:e2e:smoke    # fast P0 smoke suite
```

> Media master (`frontend/src/assets/video_local/the-reason.mp4`) is Git LFS-tracked — run `git lfs pull` after cloning.

Documentation:

- [docs/testing/playwright.md](docs/testing/playwright.md) — architecture, running, debugging, CI
- [docs/testing/qa-strategy.md](docs/testing/qa-strategy.md) — priorities, severity, production checklist
- [docs/testing/test-cases.md](docs/testing/test-cases.md) — test case catalog
- [docs/testing/test-reports.md](docs/testing/test-reports.md) — PASS/FAIL/BLOCKED reporting
- [docs/testing/bug-reporting.md](docs/testing/bug-reporting.md) — GitHub bug workflow
- [docs/auth/proxy-and-oauth-errors.md](docs/auth/proxy-and-oauth-errors.md) — client-IP/rate-limit and OAuth-error deployment guide
