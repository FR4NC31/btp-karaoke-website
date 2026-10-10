# BTP Karaoke — QA Test Case Catalog

Source of truth for automated E2E cases. Every Playwright test title starts
with its case ID. Status values: **Automated** · **N/A** (feature not
implemented) · **Manual**.

Severity tags (`@p0`/`@p1`/`@p2`) in the test titles match the Priority
below. Run a single priority with `npx playwright test -g "@p1"`.

---

## Smoke (P0) — `frontend/tests/e2e/smoke/smoke.spec.ts`

### SMOKE-001

- **Title:** Website loads
- **Priority:** P0
- **Preconditions:** Frontend dev server available.
- **Steps:** 1. Open BTP Karaoke (`/`). 2. Observe the home page.
- **Expected:** Hero heading "Sing your heart out…" and the BTP KARAOKE logo
  are visible.
- **Automation:** Playwright — **Status: Automated**

### SMOKE-002

- **Title:** Main navigation works
- **Priority:** P0
- **Steps:** 1. Open `/`. 2. Click **Sign In** in the header.
- **Expected:** The sign-in page ("Welcome back") is displayed.
- **Automation:** Playwright — **Status: Automated**

### SMOKE-003

- **Title:** User can authenticate
- **Priority:** P0
- **Steps:** 1. Open `/signin`. 2. Enter controlled test credentials.
  3. Click **Sign In**.
- **Expected:** User lands on `/studio` ("BTP MUSIC PRODUCTION" visible).
- **Automation:** Playwright — **Status: Automated**

### SMOKE-004

- **Title:** User can discover a karaoke collection
- **Priority:** P0
- **Steps:** 1. Open `/studio`. 2. Click the **Rock** genre filter.
- **Expected:** Matching collection is shown and the counter reads
  "Viewing 1 of 6 sets".
- **Automation:** Playwright — **Status: Automated**

### SMOKE-005

- **Title:** Critical karaoke flow works
- **Priority:** P0
- **Steps:** 1. Sign in. 2. Filter by **Ballad**. 3. Start playback in the
  player bar. 4. Open the profile menu → **Log out**.
- **Expected:** Collection filters, playback toggles to Pause, logout
  returns to `/signin`.
- **Automation:** Playwright — **Status: Automated**

### SMOKE-006

- **Title:** Backend health endpoint responds
- **Priority:** P0
- **Steps:** 1. `GET BACKEND_URL/health`.
- **Expected:** HTTP 200 with `{"message":"This is healthy","status":200}`.
- **Automation:** Playwright — **Status: Automated**

---

## Authentication — `frontend/tests/e2e/auth/`

### AUTH-001

- **Title:** Valid login reaches the studio
- **Priority:** P0
- **Steps:** 1. Open `/signin`. 2. Fill email + password. 3. Submit.
- **Expected:** URL becomes `/studio`; studio header and profile button
  visible.
- **Automation:** Playwright — **Status: Automated**

### AUTH-002

- **Title:** Wrong password is rejected by the backend
- **Priority:** P1
- **Steps:** 1. Sign in with a valid email and an incorrect password.
- **Expected:** Inline error shown, URL stays `/signin`, no session issued.
- **Automation:** Playwright — **Status: Automated**

### AUTH-002b

- **Title:** Unknown account is rejected by the backend
- **Priority:** P1
- **Steps:** 1. Sign in with an email that has never registered.
- **Expected:** Inline error shown, URL stays `/signin`.
- **Automation:** Playwright — **Status: Automated**

### AUTH-003

- **Title:** Logout returns to sign in
- **Priority:** P0
- **Steps:** 1. Sign in. 2. Open profile menu. 3. Click **Log out**.
- **Expected:** URL `/signin`, "Welcome back" visible.
- **Automation:** Playwright — **Status: Automated**

### AUTH-004

- **Title:** `/studio` redirects to sign in without a session
- **Priority:** P1
- **Steps:** 1. Open `/studio` directly without logging in.
- **Expected:** Redirect to `/signin` with "Welcome back" visible. Reloading
  must not return to `/studio`.
- **Automation:** Playwright — **Status: Automated**

### AUTH-005

- **Title:** Empty required fields block submission
- **Priority:** P1
- **Steps:** 1. Open `/signin`. 2. Click **Sign In** with empty fields.
- **Expected:** Page stays on `/signin` (native `required` validation).
- **Automation:** Playwright — **Status: Automated**

### AUTH-006

- **Title:** Malformed email blocks submission
- **Priority:** P1
- **Steps:** 1. Enter `not-an-email` + valid password. 2. Submit.
- **Expected:** Page stays on `/signin` (HTML5 email validation).
- **Automation:** Playwright — **Status: Automated**

### AUTH-007

- **Title:** Password visibility can be toggled
- **Priority:** P1
- **Steps:** 1. Open `/signin`. 2. Click **Show password**, then
  **Hide password**.
- **Expected:** Input type flips `password → text → password`.
- **Automation:** Playwright — **Status: Automated**

### AUTH-008

- **Title:** Google sign-in is offered and hands off to Google
- **Priority:** P2
- **Steps:** 1. Open `/signin`. 2. Click **Continue with Google**.
- **Expected:** The button is enabled and no prototype disclosure remains.
  The browser is sent to Google's authorization endpoint carrying our
  `client_id`, a `state`, and a `redirect_uri` that ends
  `/api/auth/callback/google` — the exact URI that must be registered as an
  Authorized redirect URI in the Google Cloud console.
- **Notes:** Google's real login page is stubbed by a Playwright route, so the
  test proves the hand-off without touching Google or needing an account. The
  consent step itself is not automated — see the OAuth row in the coverage
  matrix.
- **Automation:** Playwright — **Status: Automated**

### AUTH-009

- **Title:** Session survives a page reload
- **Priority:** P1
- **Steps:** 1. Sign in. 2. Reload the page.
- **Expected:** Still on `/studio` with the studio rendered — the Better Auth
  cookie persists, so the guard resolves without re-authenticating.
- **Automation:** Playwright — **Status: Automated**

### AUTH-010

- **Title:** Valid registration reaches the studio
- **Priority:** P0
- **Steps:** 1. Open `/signup`. 2. Fill all fields (11-digit contact).
  3. Click **Register**.
- **Expected:** URL `/studio`, studio content visible.
- **Automation:** Playwright — **Status: Automated**

### AUTH-011

- **Title:** Contact number shorter than 11 digits is rejected
- **Priority:** P1
- **Steps:** 1. Register with a 10-digit contact.
- **Expected:** Alert "Contact number must be exactly 11 digits"; stays on
  `/signup`.
- **Automation:** Playwright — **Status: Automated**

### AUTH-012

- **Title:** Non-digit characters are stripped from contact field
- **Priority:** P1
- **Steps:** 1. Type `091712X3456` into Contact number.
- **Expected:** Field value becomes `0917123456` (digits only).
- **Automation:** Playwright — **Status: Automated**

### AUTH-013

- **Title:** Mismatched passwords are rejected
- **Priority:** P1
- **Steps:** 1. Register with different Password/Confirm password.
- **Expected:** Alert "Passwords do not match"; stays on `/signup`.
- **Automation:** Playwright — **Status: Automated**

### AUTH-014

- **Title:** Validation error clears after correcting contact number
- **Priority:** P2
- **Steps:** 1. Submit invalid short contact → error. 2. Fix contact.
  3. Submit again.
- **Expected:** Registration succeeds → `/studio`.
- **Automation:** Playwright — **Status: Automated**

### AUTH-015

- **Title:** Unreachable server shows an error instead of hanging
- **Priority:** P1
- **Steps:** 1. Block or stop the backend. 2. Submit the sign-in form.
- **Expected:** An inline error appears, the URL stays `/signin`, and the
  submit button returns to its ready state so the user can retry.
- **Regression guard:** the handler once awaited the request without a
  `try/catch`, so a rejection escaped and left the button spinning forever
  with no message.
- **Automation:** Playwright — **Status: Automated**

### AUTH-016

- **Title:** Sign-in works straight after logging out, without a reload
- **Priority:** P1
- **Steps:** 1. Sign in. 2. Log out. 3. Sign in again with correct
  credentials. 4. Repeat without reloading the page.
- **Expected:** Every attempt reaches `/studio`. None may bounce back to
  `/signin`.
- **Regression guard:** the sign-in form used to navigate immediately while
  Better Auth's session atom still held the post-logout `null`, and the guard
  read that stale value as "no session" and redirected back — the first
  attempt silently did nothing and only the second one got through, so the
  failure alternated. Must not use `page.goto()` after the first load, since a
  reload wipes the in-memory cache and hides it.
- **Automation:** Playwright — **Status: Automated**

### AUTH-017

- **Title:** Signed-in users are sent from the auth pages to the studio
- **Priority:** P1
- **Steps:** 1. Sign in. 2. Visit `/signin` directly. 3. Visit `/signup`
  directly.
- **Expected:** Both land on `/studio`; a login form is never shown to
  someone who already has a session.
- **Notes:** The mirror of AUTH-004, which keeps anonymous users out of
  `/studio`. Implemented by `RequireGuest`, a layout route wrapping both auth
  pages in `router.tsx`.
- **Automation:** Playwright — **Status: Automated**

### AUTH-018

- **Title:** An OAuth failure arriving as a query param is shown
- **Priority:** P2
- **Steps:** 1. Visit
  `/signin?error=access_denied&error_description=The+user+cancelled`.
- **Expected:** The sign-in page renders "Google sign-in was cancelled." in the
  alert slot and stays on `/signin`.
- **Notes:** Social sign-in never rejects a request — Better Auth 302s back to
  `errorCallbackURL` with a machine code in the query string. `SignIn.tsx`
  reads that in its state initializer (not an effect, which would trip
  `react-hooks/set-state-in-effect`), and `oauthError()` in
  `src/lib/auth-errors.ts` maps the codes. The query string is deliberately
  left in place so a refresh re-surfaces the message.
- **Automation:** Playwright — **Status: Automated**

---

## Navigation — `frontend/tests/e2e/navigation/navigation.spec.ts`

### NAV-001

- **Title:** Header links reach sign in and sign up
- **Priority:** P0
- **Steps:** 1. Open `/`. 2. Click header **Sign In**; back; click header
  **Sign Up**.
- **Expected:** Correct page headings on `/signin` and `/signup`.
- **Automation:** Playwright — **Status: Automated**

### NAV-002

- **Title:** Auth pages cross-link to each other
- **Priority:** P2
- **Steps:** 1. Open `/signup`. 2. Click "Sign in" link; then "Sign up" link.
- **Expected:** Toggles between `/signin` and `/signup`.
- **Automation:** Playwright — **Status: Automated**

### NAV-003

- **Title:** Hamburger menu opens, navigates and closes
- **Priority:** P1 (mobile viewport)
- **Steps:** 1. Open `/` at 390×844. 2. Tap hamburger. 3. Tap **Sign In**.
  4. Return, open menu, tap **Home**.
- **Expected:** Menu hidden initially, opens with correct aria state,
  navigates, closes after navigation.
- **Automation:** Playwright — **Status: Automated**

### NAV-004

- **Title:** Header contact link reaches the contact page
- **Priority:** P2
- **Steps:** 1. Open `/`. 2. Click header **Contact**.
- **Expected:** `/contact` loads with h1 "Direct Lines".
- **Automation:** Playwright — **Status: Automated**

---

## Karaoke discovery — `frontend/tests/e2e/karaoke/discovery.spec.ts`

### KARAOKE-001

- **Title:** Studio opens with master vault collections
- **Priority:** P0
- **Preconditions:** Collections exist in the shipped dataset (6 sets).
- **Steps:** 1. Open `/studio`.
- **Expected:** Studio header, featured collection heading, counter
  "Viewing 6 of 6 sets", 6 collection cards.
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-002

- **Title:** Genre filter narrows and restores collections
- **Priority:** P0
- **Steps:** 1. Open `/studio`. 2. Click **Rock**. 3. Click **All Genres**.
- **Expected:** Only the Rock card shows while filtered ("Viewing 1 of 6");
  all cards return on All Genres.
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-003

- **Title:** Telemetry listing shows track details
- **Priority:** P1
- **Steps:** 1. Open `/studio`. 2. Inspect the telemetry table.
- **Expected:** Header + 5 track rows; first row shows title, artist and
  format ("WAV 24-bit"); per-row Play action visible.
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-004

- **Title:** Sidebar session browsing highlights selection
- **Priority:** P2
- **Steps:** 1. Open `/studio`. 2. Click **Stem Multitracks (Vocals/Beds)**.
- **Expected:** Active styling moves to the clicked item (styling-only
  state; no `aria-pressed` yet).
- **Automation:** Playwright — **Status: Automated**

---

## Player — `frontend/tests/e2e/player/player.spec.ts`

### PLAYER-001

- **Title:** Player bar shows the current track
- **Priority:** P1
- **Steps:** 1. Open `/studio`. 2. Inspect the player bar.
- **Expected:** Track title "Die With A Smile (Cover)" and artist visible.
- **Automation:** Playwright — **Status: Automated**

### PLAYER-003

- **Title:** Playback starts
- **Priority:** P1
- **Steps:** 1. Open `/studio`. 2. Click **Play** in the player bar.
- **Expected:** The toggle becomes **Pause**.
- **Automation:** Playwright — **Status: Automated**

### PLAYER-004

- **Title:** Pause and resume work
- **Priority:** P1
- **Steps:** 1. Play → Pause → Play.
- **Expected:** Toggle cycles Pause → Play → Pause correctly.
- **Automation:** Playwright — **Status: Automated**

### PLAYER-006

- **Title:** Progress display shows current and total time
- **Priority:** P2
- **Steps:** 1. Open `/studio`.
- **Expected:** Times "1:24" / "4:11" are displayed (static in prototype;
  progress is not simulated).
- **Automation:** Playwright — **Status: Automated**

### PLAYER-008

- **Title:** Like toggles player state
- **Priority:** P2
- **Steps:** 1. Click the **Like** heart in the player bar.
- **Expected:** Active (primary-colored) styling toggles on/off.
- **Automation:** Playwright — **Status: Automated**

---

## Profile — `frontend/tests/e2e/profile/profile.spec.ts`

### PROFILE-001

- **Title:** Profile menu opens the account page
- **Priority:** P2
- **Steps:** 1. Open `/studio`. 2. Open the profile menu. 3. Click
  **Profile**.
- **Expected:** `/studio/profile` loads; h1 shows the session user's name,
  "Personal Details" section visible, email rendered from the session,
  Location/City shows the mockup placeholder.
- **Automation:** Playwright — **Status: Automated**

### PROFILE-002

- **Title:** Account and user profile tabs switch panels
- **Priority:** P2
- **Steps:** 1. Open `/studio/profile`. 2. Click **User Profile**.
  3. Click **My Account**.
- **Expected:** Panels swap (Personal Details ↔ Public Profile).
- **Automation:** Playwright — **Status: Automated**

---

## Error states & health — `frontend/tests/e2e/errors/errors.spec.ts`

### ERROR-001

- **Title:** Unknown route renders the 404 page
- **Priority:** P1
- **Steps:** 1. Open an unknown URL.
- **Expected:** "404 - PAGE NOT FOUND" heading.
- **Automation:** Playwright — **Status: Automated**

### ERROR-002

- **Title:** Key pages load without console or page errors
- **Priority:** P1
- **Steps:** 1. Visit `/`, `/signin`, `/signup`, `/studio`, unknown route.
- **Expected:** Zero console errors and zero uncaught exceptions.
- **Automation:** Playwright — **Status: Automated**

### ERROR-003

- **Title:** Key pages load without failed or 4xx/5xx requests
- **Priority:** P1
- **Steps:** 1. Visit the same key pages. 2. Collect network activity.
- **Expected:** No failed requests (except legitimate SPA aborts) and no
  HTTP ≥ 400 responses (broken assets are caught here).
- **Automation:** Playwright — **Status: Automated**

### ERROR-004

- **Title:** Unknown backend route returns 404
- **Priority:** P2
- **Steps:** 1. `GET BACKEND_URL/definitely-not-a-route`.
- **Expected:** HTTP 404 (backend error handling works).
- **Automation:** Playwright — **Status: Automated**

---

## Not implemented / N/A

Requested QA areas that **cannot be tested because the feature does not
exist yet**. Revisit when the feature ships — do not fake coverage.

| Area                                   | Status                | Notes                                                        |
| -------------------------------------- | --------------------- | ------------------------------------------------------------ |
| Valid search / no-results / search errors / search validation | N/A | Studio search input is decorative (no state, no handler).    |
| Invalid-credentials rejection (UI)               | Covered               | AUTH-002 / AUTH-002b: the form posts to the backend, which returns 401, and the error renders inline. |
| Session persistence (UI)                         | Covered               | AUTH-009: the Better Auth cookie survives a reload, so `/studio` still resolves. |
| Protected pages (UI) / 401 / 403 in the UI       | Covered               | `RequireAuth` guards `/studio` and redirects to `/signin` (AUTH-004). Backend `/api/me` returns 401 without a session. |
| API failure / 500 handling in UI       | N/A                   | Auth calls surface their error codes as inline form messages (`src/lib/auth-errors.ts`); no 500/retry handling exists yet. |
| Favorites / playlists round-trip       | N/A                   | Not implemented (like button is local state only).           |
| Database persistence after refresh     | Partial               | Sign-up/sign-in read and write Aiven (AUTH-010, AUTH-001) and the session persists (AUTH-009); favorites/playlists are still local state only. |
| Song detail / lyrics synchronization   | N/A                   | No detail page or lyrics implementation.                     |
| Real playback, progress movement, volume | N/A                 | No audio element/media; player is UI state only.             |
| Media loading failure / unavailable song | N/A                 | No media pipeline.                                           |
| OAuth login flow (Google)              | Partial               | The hand-off to Google is automated (AUTH-008) and OAuth errors surface in the UI (AUTH-018); the consent step needs a real Google account, so it stays manual. |
| Backend auth API tests                 | **Recommended next**  | `/api/auth/*` + `/api/me` exist (sign-up 200, sign-in 200, wrong password 401) with no automated coverage yet.        |
