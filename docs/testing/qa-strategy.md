# BTP Karaoke — QA Strategy

How Playwright testing is prioritized for this project, how results are
classified, and what must be checked before a production release.

Companion docs: [playwright.md](playwright.md) (how to run) ·
[test-cases.md](test-cases.md) (case catalog) ·
[test-reports.md](test-reports.md) (report examples) ·
[bug-reporting.md](bug-reporting.md) (filing bugs).

## QA role & scope

Playwright is the **browser E2E / QA layer**: real user journeys through the
real frontend. The frontend currently makes no API calls, so backend checks
are **separate direct HTTP probes** (SMOKE-006, ERROR-004) — not
frontend-to-API integration coverage. It is not a unit, component, backend
or API-integration test suite. The repository is the source of truth — only
features that actually exist are tested; everything else is explicitly listed
as N/A in [test-cases.md](test-cases.md).

## Priorities (current application)

### P0 — Critical

Core journeys that must work or the site is unusable:

| Area                    | Test IDs                                    |
| ----------------------- | ------------------------------------------- |
| Application loads       | SMOKE-001                                   |
| Main navigation         | SMOKE-002, NAV-001                          |
| Authentication (login)  | SMOKE-003, AUTH-001                         |
| Logout                  | AUTH-003                                    |
| Karaoke discovery       | SMOKE-004, KARAOKE-001, KARAOKE-002         |
| Critical flow completion| SMOKE-005 (sign in → filter → play → logout)|
| Registration            | AUTH-010                                    |
| Backend availability    | SMOKE-006                                   |

### P1 — High

Important functionality; degraded experience but a workaround exists:

| Area                          | Test IDs                              |
| ----------------------------- | ------------------------------------- |
| Form/validation rules         | AUTH-005, AUTH-006, AUTH-011…013      |
| Known limitation: mock auth   | AUTH-002                              |
| Track listing (telemetry)     | KARAOKE-003                           |
| Player controls               | PLAYER-001, PLAYER-003, PLAYER-004    |
| Mobile navigation             | NAV-003                               |
| Password visibility           | AUTH-007                              |
| Error states & app health     | ERROR-001, ERROR-002, ERROR-003       |

### P2 — Medium

Secondary behavior, styling states and edge cases:

| Area                              | Test IDs                        |
| --------------------------------- | ------------------------------- |
| Prototype disclosures (Google)    | AUTH-008                        |
| Known-limitation pinning          | AUTH-004              |
| Auth cross-links, error recovery  | NAV-002, AUTH-014               |
| Sidebar/like styling states       | KARAOKE-004, PLAYER-008         |
| Progress display, backend 404     | PLAYER-006, ERROR-004           |

## Severity definitions

```text
P0 — Critical   Site unusable; login broken; playback core broken;
                critical data corruption; severe security problem.
P1 — High       Search broken; major player feature broken; important API
                flow broken; user cannot complete a major workflow.
P2 — Medium     Secondary feature broken; recoverable validation problem;
                non-critical workflow issue.
P3 — Low        Minor UI/copy issue; cosmetic inconsistency.
```

Severity describes **impact on the user**, not how easy the bug is to fix.

## PASS / FAIL / BLOCKED

| Result    | Meaning                                                                 |
| --------- | ----------------------------------------------------------------------- |
| **PASS**  | Expected behavior occurred.                                             |
| **FAIL**  | A reproducible **application defect** exists (product bug).             |
| **BLOCKED**| Testing cannot continue: environment outage, missing configuration, expired credentials, unavailable dependency, infra problem. **Not automatically a product bug.** |

Rules:

- Always investigate a red run before declaring FAIL: test bug? environment?
  flake? Only a confirmed application defect is a FAIL.
- Every FAIL must be documented with Expected vs Actual
  ([test-reports.md](test-reports.md), [bug-reporting.md](bug-reporting.md)).
- A BLOCKED test gets re-run once the environment recovers; it is never
  silently counted as passed.

## Test data strategy

- Controlled, predictable fake data only (`qa@example.com`, dummy 11-digit
  contact, `Secret123!`) — defined in `frontend/tests/e2e/helpers/`.
- Never: real users, production accounts, production database rows,
  production credentials, or anything committed to the repo that is a secret.
- The prototype has no persistence, so the suite is fully re-runnable.
- If backend persistence lands: create data through the UI/API in
  setup/teardown with unique per-run identifiers (e.g. `qa-<runid>@example.com`).

## Database & environment safety

- **Aiven PostgreSQL now exists** (used by Better Auth for users/sessions).
  The E2E suite never talks to it directly — UI tests only probe
  `/health`, and auth flows in tests still use the client-side mock.
- When UI flows start writing data: E2E must target a **dedicated test
  database** in the test/staging environment. Production is off-limits —
  the Playwright config already refuses non-local base URLs without an
  explicit `PLAYWRIGHT_ALLOW_EXTERNAL=1` flag.
- Destructive flows (delete/reset) may only ever run against test data that
  the suite itself created.
- The backend requires `backend/.env` (gitignored). Until it exists, E2E
  runs are **BLOCKED at startup** — an environment issue, not a product bug.

## Production QA checklist

Only mark what actually exists in the application.

### Application

- [x] Website loads (SMOKE-001)
- [x] Main navigation works (SMOKE-002, NAV-001, NAV-003)
- [x] Responsive behavior works (NAV-003 mobile menu)
- [x] Important pages load (ERROR-002: `/`, `/signin`, `/signup`, `/studio`, 404)

### Authentication

- [x] Login (AUTH-001)
- [x] Signup (AUTH-010 + validation AUTH-011…014)
- [x] Logout (AUTH-003)
- [ ] Protected routes — **not implemented** (AUTH-004 pins current behavior)
- [ ] Session handling — **not implemented** (N/A)

### Search

- [ ] Valid search — **input is decorative, not wired** (N/A)
- [ ] Empty results — N/A
- [ ] Search errors / loading state — N/A

### Karaoke

- [x] Song/collection discovery (KARAOKE-001, KARAOKE-002)
- [x] Song listing details (KARAOKE-003)
- [x] Player opens with track (PLAYER-001)
- [x] Playback start / pause / resume (PLAYER-003, PLAYER-004)
- [x] Like toggle (PLAYER-008)
- [ ] Song loads real media — **no media implemented** (N/A)
- [ ] Player error / media failure handling — N/A

### Backend

- [x] API availability (`GET /health` — SMOKE-006)
- [x] API error handling (unknown route → 404 — ERROR-004)
- [x] API authentication exists (Better Auth `/api/auth/*`, protected `/api/me`) — **no automated QA coverage yet**
- [ ] API authorization tests — pending (only `/api/me` exists as a protected route)
- [ ] Validation beyond auth endpoints — pending
- [x] Database exists (Aiven PostgreSQL via Better Auth) — E2E does not write to it

### UX

- [x] Genre filter narrows and restores collections (KARAOKE-002)
- [ ] Loading/empty filter states — not reachable with the shipped dataset (N/A)
- [x] Error states: 404 page (ERROR-001)
- [x] No console errors / failed requests on key pages (ERROR-002/003)
- [ ] Accessibility beyond basics — not audited (P3 gap)
- [ ] Cross-browser rendering — Chromium only (P3 gap)

## Recommended next tests (highest value first)

1. **Backend API suite** — Better Auth endpoints (`/api/auth/*`, `/api/me`)
   already exist: cover sign-up, sign-in, wrong-password 401, session and
   protected-route 401 at API level.
2. **Search E2E** (valid / empty / error / input validation) as soon as the
   Studio search input is wired to real filtering or an API.
3. **Session persistence & protected routes** when auth becomes real — invert
   AUTH-004, add storageState setup project.
4. **Playback with a controlled test asset** (local audio file, never an
   external media service) when the player gets real media.
5. **Persistence round-trip** (add favorite → reload → still present) when a
   database exists.
6. **Firefox/WebKit projects** for cross-browser confidence before release.
7. **Visual smoke (screenshot comparison)** for the Studio layout once the
   design stabilizes.
