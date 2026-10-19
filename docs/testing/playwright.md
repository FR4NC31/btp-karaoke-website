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
                  Database   ← Aiven PostgreSQL
                               (Better Auth tables + service/booking)
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
| API              | `GET /health`, Better Auth under `/api/auth/*`, protected `GET /api/me`, public `GET /api/services`, session-scoped `GET/POST /api/bookings` + `POST /api/bookings/:id/cancel` |
| Auth             | Frontend calls Better Auth through `better-auth/react` (email/password; Google disabled pending OAuth credentials). Sessions are cookies |
| Database         | Aiven PostgreSQL — Better Auth owns `user`/`session`/`account`/`verification`; Drizzle owns `service`/`booking`. E2E sign-in/sign-up write real rows, so test accounts accumulate |
| Browser          | Chromium (only browser installed)                        |

`playwright.config.ts` starts **both** dev servers automatically before the
run (and reuses already-running local servers), then stops them afterwards.

## Installation

Already set up in this repo. On a new machine:

```bash
git lfs install            # media master (the-reason.mp4) is Git LFS-tracked
git lfs pull               # fetch the actual video/audio file, not its pointer
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
| `npm run test:e2e`         | Full suite                    |
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
│   ├── media.ts                 admin API helpers: create/delete one catalog row (KARAOKE-003/005 create their own)
│   └── env.ts                   BACKEND_URL (no hard-coded hosts)
├── smoke/smoke.spec.ts          SMOKE-001…006   P0 "can a user use the site?"
├── auth/signin.spec.ts          AUTH-001…008    login, logout, validation, Google
├── auth/signup.spec.ts          AUTH-010…014    registration + contact rules
├── navigation/navigation.spec.ts NAV-001…004    header, cross-links, mobile menu
├── karaoke/discovery.spec.ts    KARAOKE-001…015 media hub (DB-backed catalog), console, player bar, PiP, queue playback
├── player/player.spec.ts        PLAYER-001,003,004,006,008,009 player bar controls, no-autoplay entry
├── booking/booking.spec.ts      BOOKING-001…007  booking desk (day-only), nav, filters
├── admin/admin.spec.ts          ADMIN-001…014    console: queue, reservations, booking for others, media catalog
├── admin/admin-security.spec.ts SEC-001…005      role boundary: 401/403, no self-promotion
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
- `setup/admin.setup.ts` is the admin twin: it ensures
  `qa-admin@example.com` exists, promotes it if needed
  (`npm run promote-admin` — promotion is CLI-only, by design),
  then writes the session to `playwright/.auth/admin.json`. Admin suites opt
  in with `test.use({ storageState: ADMIN_STORAGE_STATE })`.

If the whole feature suite suddenly redirects to `/signin`, the saved state
is stale: re-run once (the setup project recreates it) or check that
`qa@example.com` still exists in the database.

No production OAuth/accounts are used. The Google button is wired to the real
Better Auth hand-off, but Playwright stubs Google's page, so the test asserts
the outgoing authorization URL rather than completing a consent (AUTH-008);
OAuth failures redirected back as query params are covered by AUTH-018.

## Test data

- Controlled fake data only: `qa@example.com`, `juan@example.com`,
  `09171234567` (11-digit dummy), `Secret123!` — defined in
  `helpers/auth.ts` / `signup.spec.ts`. The admin suites use the same
  contract with `qa-admin@example.com` / `AdminSecret123!` (promoted once;
  `TEST_ADMIN` in `helpers/auth.ts`).
- No real users, no production accounts, no production data, no secrets.
- The backend **does** persist: sign-up/sign-in write rows, and a booking is a
  real row too. Tests stay re-runnable because they clean up what they create,
  not because the database is stateless. The booking suite cancels every
  booking it makes — the schema allows only one *live* booking per service per
  day, so a leaked `pending` row would break the next run.
- All suites share one account (`qa@example.com`), so booking assertions are
  pinned to the reference code the test itself just created, never to the size
  of the list, which sibling tests are mutating in parallel. Booking days are
  randomised 400–699 days out so workers cannot collide on the unique index.
- If a dedicated test database is added later, use a separate **test** database
  — never production (see [qa-strategy.md](qa-strategy.md#database--environment-safety)).

## Karaoke / player testing

What the product actually implements today (test coverage is limited to this):

| Feature                          | Status                | Tests                     |
| -------------------------------- | --------------------- | ------------------------- |
| Media hub sections (video/music/radio) | Working — DB-backed catalog curated from `/admin/media`; empty sections render nothing | KARAOKE-001/003/005, SMOKE-004 |
| Video song → console hop          | Working (link)        | KARAOKE-002, SMOKE-005    |
| Local video via shell player bar  | Working (real `<video>`) | KARAOKE-006            |
| Sidebar session selection        | Working (styling)     | KARAOKE-004               |
| Player play/pause/like toggles   | Working (real lobby track on the hub; the console's on-air track renames the bar) | PLAYER-001/003/004/008 |
| Lobby autoplay on studio entry   | **None by design** — silence until the user plays (bar's Play) or a console session hands back on exit (KARAOKE-010); reintroducing autoplay is a regression | PLAYER-009 |
| Progress display                 | Live m:ss on every studio page (video on console, lobby music elsewhere) | PLAYER-006 |
| Search input (top bar)           | **Not wired** (decorative) | — (N/A, test-cases.md) |
| Song detail / lyrics page        | Does not exist        | —                         |
| Music Player / Radio actions     | Visual only (buttons) | —                         |
| Previous/Next/Shuffle/Repeat     | Working on the console queue: repeat cycles off → all → one (all wraps the queue — and loops the floating PiP mini, which has no queue of its own; one loops the element; off stops at the end); Previous/Next walk the playable rows; Shuffle draws unplayed songs, Previous walks the round back, and a following Next does not replay the song just left behind. No playlist on other studio pages, so the skips are inert there. | KARAOKE-014/015 |

## Booking desk testing

`/studio/bookings` is built on **application-owned tables** (`service` +
`booking`), like the media hub catalog behind `/studio` (`media_item`).
Day-only by design: a booking claims one whole calendar day of one service —
there is no time slot or time block yet, and no payment.

| Feature                                 | Status                                    | Tests               |
| --------------------------------------- | ----------------------------------------- | ------------------- |
| Service catalog (8 seeded services)     | Working — real rows from `/api/services`  | BOOKING-001/003     |
| Wing filter                             | Working (client-side filter)              | BOOKING-003         |
| Create a day booking                    | Working (writes a row, `pending`)         | BOOKING-004         |
| Cancel a pending booking                | Working (row kept as `cancelled` for audit) | BOOKING-004       |
| One live booking per service per day    | Working (partial unique index → 409)      | BOOKING-005         |
| Entry points (top bar + sidebar)        | Working — both are load-bearing, one is the mobile route | BOOKING-001/002/006 |
| Signed-out access                       | Blocked by `RequireAuth`                  | BOOKING-007         |
| Admin confirm / reject                  | Working — the `/admin` queue answers pending reservations | ADMIN-002/003 |
| Time slots / time blocks                | Not implemented                           | —                   |
| Payment                                 | Not implemented (no online payment)       | —                   |

## Admin console testing

`/admin` is a separate route tree for sessions with `role = 'admin'`. There is
one login: the sign-in form routes admins to `/admin`, everyone else to
`/studio`. The UI guard (`RequireAdmin`) is navigation UX; the real boundary is
`requireAdmin` on `/api/admin/*`, which answers 401 signed out and 403 for a
signed-in non-admin — `admin-security.spec.ts` pins that down, including the
two role self-promotion routes (sign-up, `update-user`), which Better Auth's
`input: false` closes server-side. Promotion itself is CLI-only
(`npm run promote-admin` against the database; `SEC-003` is why no HTTP route
may ever exist for it).

Admin-taken reservations are born **confirmed** — the admin IS the approval
step — and belong to either a tagged registered customer or a free-text guest
name (`booking.guestName`; the `booking_owner_check` constraint enforces that
every reservation has one of the two).

The console also curates the **media hub catalog** (`/admin/media`): the
`media_item` rows that `/studio` renders (video songs, minus-one tracks, radio
stations). New rows append to their section and go live immediately; hide/show
pulls a row from the public feed without deleting it, move reorders within a
section, and delete is permanent — the console asks for confirmation first.
Video songs and music tracks can also carry a real MP4/MP3: the editor
uploads it (raw-body `POST /api/admin/media/upload`, 200 MB cap) and the
stored file is served back with byte ranges and a year-long immutable cache,
so the hub plays the actual upload — no file means the video card falls back
to the bundled master and a music card stays visual-only. The editor also
reads each picked file's own metadata (`music-metadata`: ID3 tags on MP3,
atoms on MP4) to pre-fill the blank title/artist/album boxes and to read the
runtime off the file itself (no duration box — video and audio alike), and
every media row can carry a cover image: embedded art is applied
automatically, a tagless video gets a real frame grabbed off it, the admin
can pick an image instead,
and covers are shrunk to display size (`browser-image-compression`, WebP)
before upload. Without one, cards show the default art. Only the one real
local master ("The Reason") ships seeded — music and radio start empty, so
their tests create the rows they assert and delete them afterwards.

| Feature                                | Status                                   | Tests        |
| -------------------------------------- | ---------------------------------------- | ------------ |
| Admin sign-in lands on `/admin`        | Working (role-aware redirect)            | ADMIN-001    |
| Pending queue confirm / reject         | Working — the console answers the queue  | ADMIN-002/003 |
| Reservation for a tagged customer      | Working — modal on the desk (search an account, tag it) | ADMIN-005    |
| Reservation for a guest / walk-in      | Working — modal on the desk (free-text name, no account) | ADMIN-004    |
| confirmed → completed / cancelled      | Working (`ADMIN_ACTIONS` transitions)    | ADMIN-002/004/005 |
| Console entry from the studio chrome   | Working — shown to admins only; the top bar link is the mobile path | ADMIN-006 / SEC-004 |
| `/api/admin/*` 401/403 boundary        | Working — fail-closed sub-app mount      | SEC-001/002  |
| Role self-promotion                    | Closed — `input: false`; promotion is CLI-only | SEC-003 |
| Media catalog add / edit               | Working — rows drive `/studio` immediately | ADMIN-007    |
| Media visibility + ordering            | Working — hide/show, move up/down        | ADMIN-008    |
| Media file upload (MP4/MP3)            | Working — stored with byte ranges + immutable cache; the hub plays the upload | ADMIN-009/010, KARAOKE-012 |
| Tag metadata fill + covers/thumbnails  | Working — tags pre-fill the blank boxes (Artist/album); the runtime is read off the picked file; embedded art, grabbed video frames and picked images become optimized WebP covers | ADMIN-012/013 |
| Staff preview on the console           | Working — **Play** on a card opens `/studio/player-queue` on that row; admins get the staff-only **Admin details** panel (KARAOKE-002 pins users out of it) | ADMIN-014    |
| Delete confirmation on media rows      | Working — Delete → Confirm/Cancel pair   | ADMIN-007/009 |
| User management (list/ban/set-role)    | Not implemented (deliberately out of v1) | —            |

## API integration

- Backend probes: `SMOKE-006` (`GET BACKEND_URL/health`) and `ERROR-004`
  (unknown route → 404).
- The backend exposes **Better Auth** endpoints (`/api/auth/*` —
  sign-up, sign-in, session, sign-out — plus protected `GET /api/me`).
- The frontend calls them through **`better-auth/react`**: sign-up and
  sign-in run against the real database, the session is a cookie, and
  `RequireAuth` gates `/studio`. Covered end-to-end by the auth suite
  (AUTH-001…014) plus SMOKE-003/005.
- The **booking API** (`GET /api/services`, `GET/POST /api/bookings`,
  `POST /api/bookings/:id/cancel`) is exercised end-to-end through the UI by
  BOOKING-001…007. Its error branches — 401 anonymous, 400 for a past or
  malformed day, 404 unknown service, 409 duplicate and double-cancel — are
  verified by a direct API probe rather than by Playwright: the form's own
  `min` on the date picker means the browser blocks a past day before the
  request is ever sent, so those branches are unreachable from the UI.
- The **admin API** (`GET/POST /api/admin/bookings`,
  `POST /api/admin/bookings/:id/{confirm,reject,complete,cancel}`,
  `GET /api/admin/users`, plus the media catalog: `GET/POST /api/admin/media`,
  `POST /api/admin/media/upload`, `POST /api/admin/media/:id`,
  `POST /api/admin/media/:id/{visibility,move,delete}`)
  is driven end-to-end by ADMIN-001…014, and its boundary is pinned by direct
  calls: SEC-001 (401 anonymous) and SEC-002 (403 for a signed-in non-admin,
  on every route shape). SEC-003 calls the auth API directly to prove `role`
  cannot be set at sign-up or through `update-user`.
- The **media uploader** (`POST /api/admin/media/upload`, raw body +
  `X-File-Name`) is exercised twice over: ADMIN-009 drives the real editor
  and the hub playback of the stored file (including byte-range serving at
  `GET /api/uploads/media/:name`), KARAOKE-012 uploads a committed silent MP3
  fixture (`tests/e2e/assets/silence.mp3`) through the API helper and proves
  the hub plays it; ADMIN-010 pins the rejection paths (bad extension, type
  mismatch, cover-in-source / media-in-cover column cross-checks, anonymous
  401). ADMIN-012/013 cover the editor's metadata and art pipeline: tag
  pre-fill and embedded covers from a real tagged MP3, frame-grabbed video
  thumbnails, explicit image picks, and the Remove-cover → default-art path —
  all asserted through the stored WebP files the hub serves.
- The **public media API** (`GET /api/media`) serves the active catalog to the
  hub. KARAOKE-003/005 exercise it by creating rows through the admin API
  (`helpers/media.ts`), asserting the cards render them, then deleting them —
  the hub's sections exist only while rows are published.
- **Not yet covered**: broad direct API-level tests of `/api/auth/*` and
  `/api/me` (wrong-password 401, protected-route 401) — SEC-003 covers the
  role-escalation paths only; the rest is still the top recommended next
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
- **Media files / Git LFS**: the karaoke master (`frontend/src/assets/video_local/the-reason.mp4`) is Git LFS-tracked — without `git lfs pull` the file is just a pointer and the karaoke/player specs fail (environment issue, not a product bug).
- **Cross-browser**: Chromium only; Firefox/WebKit projects are commented in
  the config until installed.
- Full list of N/A cases: [test-cases.md](test-cases.md#not-implemented--n/a).
