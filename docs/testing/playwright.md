# Playwright E2E Testing — BTP Karaoke

Playwright is BTP Karaoke's **automated QA / end-to-end testing layer**. It
drives a real browser against the actual website (frontend + backend) from a
user's perspective. It does **not** replace unit, component, backend or API
integration tests.

```text
                 Playwright
                     │
                Web Browser
                     │
                 Frontend (Vite/React, :5173)
                     │  API calls
                 Backend (Hono, :3000)
                     │
                  Database   ← none exists yet (see qa-strategy.md)
```

All test code lives in `frontend/tests/e2e/`, configured by
`frontend/playwright.config.ts`.

## Contents

- [Architecture](#architecture)
- [Installation](#installation)
- [Running tests](#running-tests)
- [Test structure](#test-structure)
- [Authentication in tests](#authentication-in-tests)
- [Test data](#test-data)
- [Karaoke / player testing](#karaoke--player-testing)
- [API integration](#api-integration)
- [Evidence & reports](#evidence--reports)
- [Debugging failures](#debugging-failures)
- [Environment variables](#environment-variables)
- [CI](#ci)
- [Known limitations](#known-limitations)

Related docs: [qa-strategy.md](qa-strategy.md) ·
[test-cases.md](test-cases.md) · [test-reports.md](test-reports.md) ·
[bug-reporting.md](bug-reporting.md)

## Architecture

| Piece            | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| Frontend         | Vite + React 19 + React Router, dev server `:5173`       |
| Backend          | Hono + `@hono/node-server`, dev server `:3000`           |
| Package manager  | npm (frontend), npm or bun (backend)                     |
| Frontend command | `npm run dev`                                            |
| Backend command  | `npm run dev` (`node --env-file=.env --watch serve.ts`)  |
| API              | `GET /health`, Better Auth under `/api/auth/*`, protected `GET /api/me` |
| Auth             | Frontend calls Better Auth through `better-auth/react` (email/password; Google disabled pending OAuth credentials). Sessions are cookies |
| Database         | Aiven PostgreSQL (used by Better Auth; E2E sign-in/sign-up write real rows, so test accounts accumulate) |
| Browser          | Chromium (only browser installed)                        |

`playwright.config.ts` starts **both** dev servers automatically before the
run (and reuses already-running local servers), then stops them afterwards.

## Installation

Already set up in this repo. On a new machine:

```bash
cd frontend
npm ci
npx playwright install chromium

cd ../backend
npm install
cp .env.example .env   # fill in values — required, `npm run dev` refuses to start without it
```

## Running tests

All commands from `frontend/`:

| Command                    | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `npm run test:e2e`         | Full suite (35 tests)                    |
| `npm run test:e2e:smoke`   | Smoke suite only (fast P0 checks)        |
| `npm run test:e2e:headed`  | Visible browser                          |
| `npm run test:e2e:ui`      | Interactive UI mode (pick/debug tests)   |
| `npm run test:e2e:report`  | Open HTML report of the last run         |

Useful filters:

```bash
npx playwright test -g "@p0"                 # by severity tag
npx playwright test tests/e2e/player         # by area folder
npx playwright test -g "PLAYER"              # by test-ID prefix
npx playwright test --last-failed            # re-run failures only
```

## Test structure

```text
frontend/tests/e2e/
├── fixtures.ts                  shared evidence fixture (console/network)
├── helpers/
│   ├── auth.ts                  signIn() + controlled TEST_USER
│   └── env.ts                   BACKEND_URL (no hard-coded hosts)
├── smoke/smoke.spec.ts          SMOKE-001…006   P0 "can a user use the site?"
├── auth/signin.spec.ts          AUTH-001…008    login, logout, validation, Google
├── auth/signup.spec.ts          AUTH-010…014    registration + contact rules
├── navigation/navigation.spec.ts NAV-001…004    header, cross-links, mobile menu
├── karaoke/discovery.spec.ts    KARAOKE-001…004 collections, genre filter, telemetry
├── player/player.spec.ts        PLAYER-001,003,004,006,008 player bar controls
├── profile/profile.spec.ts      PROFILE-001…002 profile menu → account page, tabs
└── errors/errors.spec.ts        ERROR-001…004   404, console/network health
```

Conventions:

- Every test title starts with its **test-case ID** (`SMOKE-001: …`) and
  carries a severity tag (`@p0` / `@p1` / `@p2`) — see [test-cases.md](test-cases.md).
- Locators are semantic: `getByRole`, `getByLabel`, `getByText`,
  `getByPlaceholder`. `data-testid` only as a last resort.
- No `waitForTimeout()` anywhere — assertions auto-wait instead.
- Each test is independent and starts from a fresh page.

## Authentication in tests

Sign-in/sign-up call the **real backend** through Better Auth. The form sets
a session cookie, and `/studio` is guarded by `RequireAuth`.

- `setup/auth.setup.ts` is a Playwright **setup project**. It signs in once
  and writes the cookie to `playwright/.auth/user.json` (git-ignored).
- The `chromium` project declares `dependencies: ['setup']` and reads that
  file as its `storageState`, so feature suites inherit a live session and
  can open `/studio` directly.
- `helpers/auth.ts` → `signIn(page)` still drives the real login form. It is
  used by the setup project and by the auth suites that must exercise the
  form itself (AUTH-001/003/009, SMOKE-003/005).
- Suites that must start signed out — everything in `auth/` — opt out with
  `test.use({ storageState: ANONYMOUS })`. Without this they would inherit a
  session and pass for the wrong reason.

If the whole feature suite suddenly redirects to `/signin`, the saved state
is stale: re-run once (the setup project recreates it) or check that
`qa@example.com` still exists in the database.

No production OAuth/accounts are used. The Google button is disabled in the
product and asserted as such (AUTH-008).

## Test data

- Controlled fake data only: `qa@example.com`, `juan@example.com`,
  `09171234567` (11-digit dummy), `Secret123!` — defined in
  `helpers/auth.ts` / `signup.spec.ts`.
- No real users, no production accounts, no production data, no secrets.
- There is no backend persistence, so tests are inherently re-runnable.
  If a test database is added later, use a dedicated **test** database —
  never production (see [qa-strategy.md](qa-strategy.md#database--environment-safety)).

## Karaoke / player testing

What the product actually implements today (test coverage is limited to this):

| Feature                          | Status                | Tests                     |
| -------------------------------- | --------------------- | ------------------------- |
| Collections + genre filter       | Working (client-side) | KARAOKE-001/002, SMOKE-004 |
| Telemetry track listing          | Working (static data) | KARAOKE-003               |
| Sidebar session selection        | Working (styling)     | KARAOKE-004               |
| Player play/pause/like toggles   | Working (UI state)    | PLAYER-001/003/004/008    |
| Progress display                 | Static values only    | PLAYER-006                |
| Search input (top bar)           | **Not wired** (decorative) | — (N/A, test-cases.md) |
| Song detail / lyrics page        | Does not exist        | —                         |
| Real audio / media               | Does not exist        | —                         |
| Previous/Next/Shuffle/Repeat     | Buttons without handlers | — (asserted only where visible) |

## API integration

- Backend probes: `SMOKE-006` (`GET BACKEND_URL/health`) and `ERROR-004`
  (unknown route → 404).
- The backend exposes **Better Auth** endpoints (`/api/auth/*` —
  sign-up, sign-in, session, sign-out — plus protected `GET /api/me`).
- The frontend calls them through **`better-auth/react`**: sign-up and
  sign-in run against the real database, the session is a cookie, and
  `RequireAuth` gates `/studio`. Covered end-to-end by the auth suite
  (AUTH-001…014) plus SMOKE-003/005.
- **Not yet covered**: direct API-level tests of `/api/auth/*` and `/api/me`
  (wrong-password 401, protected-route 401) — still the top recommended next
  suite (see [qa-strategy.md](qa-strategy.md)). Search, favorites and
  profile flows remain client-side only.

## Evidence & reports

On failure, every test automatically produces:

| Evidence                     | Where                                     |
| ---------------------------- | ----------------------------------------- |
| Full trace                   | `test-results/<test>/trace.zip`           |
| Screenshot                   | `test-results/<test>/test-failed-1.png`   |
| Video                        | `test-results/<test>/video.webm`          |
| Console + network dump       | report attachment `console-and-network.txt` |
| DOM snapshot / error context | `test-results/<test>/error-context.md`    |
| HTML report                  | `frontend/playwright-report/`             |

- Captured console errors, uncaught exceptions, failed requests and
  HTTP ≥ 400 responses are attached by `fixtures.ts` **only when a test
  fails** — passing tests leave no large artifacts.
- In CI the `github` reporter also annotates the PR, and the report is
  uploaded as a workflow artifact (14-day retention).

## Debugging failures

```bash
npm run test:e2e:report                  # HTML report
npx playwright show-trace <trace.zip>    # time-travel trace of a failure
npx playwright test -g "KARAOKE-002" --headed --debug   # step through
npm run test:e2e:ui                       # pick tests, watch, time-travel
```

Read the attached `console-and-network.txt` first — it usually tells you
whether the problem is app code (console error), the network/API, or the
test itself. Classify before reporting: [bug-reporting.md](bug-reporting.md).

## Environment variables

| Variable                   | Default                 | Notes                                                    |
| -------------------------- | ----------------------- | -------------------------------------------------------- |
| `PLAYWRIGHT_BASE_URL`      | `http://localhost:5173` | Non-local origins require `PLAYWRIGHT_ALLOW_EXTERNAL=1`.  |
| `PLAYWRIGHT_ALLOW_EXTERNAL`| unset                   | Safety flag; only for known-safe test environments.      |
| `BACKEND_BASE_URL`         | `http://localhost:3000` | Backend origin used by API probes.                       |

The config **refuses to start** against a non-local base URL without the
explicit flag — tests can never silently hit production. No secrets belong
in Playwright config, tests or CI.

## CI

`.github/workflows/e2e.yml` (the existing `changelog.yml` is untouched):

- **Pull Request** → lint → typecheck (frontend + backend) → build →
  Playwright **smoke** suite (fast feedback).
- **Push to `main`/`develop` or manual dispatch** → **full** regression
  suite (release confidence).
- Reports/traces upload as artifacts on failure; `github` reporter
  annotates PRs. Failures retry once (`retries: 1` in CI).

High-risk PRs: run the full suite locally (`npm run test:e2e`) before merge.

## Known limitations

- **Backend `.env` required**: `backend/.env` (copied from `.env.example`)
  must exist or the backend web server cannot start — E2E runs are then
  **BLOCKED** at startup (environment issue, not a product bug).
- **Search**: the Studio search input is decorative (no handler/results) —
  no search tests exist because the feature does not work yet.
- **Real playback / media errors**: no audio element or media files yet.
- **Cross-browser**: Chromium only; Firefox/WebKit projects are commented in
  the config until installed.
- Full list of N/A cases: [test-cases.md](test-cases.md#not-implemented--n/a).
