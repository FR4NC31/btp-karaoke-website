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

- **Title:** User can discover the video song
- **Priority:** P0
- **Steps:** 1. Open `/studio`.
- **Expected:** Video Song section shows h1 "The Reason", the "Play The
  Reason" link, and the Radio section heading.
- **Automation:** Playwright — **Status: Automated**

### SMOKE-005

- **Title:** Critical karaoke flow works
- **Priority:** P0
- **Steps:** 1. Sign in. 2. Toggle playback in the player bar. 3. Open the
  video song card (**Play The Reason**). 4. Open the profile menu →
  **Log out**.
- **Expected:** Hub loads with h1 "The Reason", playback toggles to Pause,
  the `/studio/player-queue` console opens, logout returns to `/`.
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

- **Title:** Logout returns to the landing page
- **Priority:** P0
- **Steps:** 1. Sign in. 2. Open profile menu. 3. Click **Log out**.
- **Expected:** URL `/`, landing h1 "Sing your heart out…" visible.
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
  reload wipes the in-memory cache and hides it. Logout lands on `/`, so
  retries after the first cycle open the sign-in modal via the hero button
  instead of routing.
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

- **Title:** Studio hub opens with video song, music player and radio
- **Priority:** P0
- **Preconditions:** Media hub sections shipped (video song, music player,
  radio); telemetry table retired.
- **Steps:** 1. Open `/studio`.
- **Expected:** Studio header, h1 "The Reason", the three section headings
  (Video Song / Music Player / Radio), 13 media cards (4 video + 5 music +
  4 radio); the old telemetry heading is absent.
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-002

- **Title:** Video song opens the console and auto-plays
- **Priority:** P0
- **Steps:** 1. Open `/studio`. 2. Click **Play The Reason**.
- **Expected:** `/studio/player-queue` loads with h1 "Karaoke & Studio
  Audio Console"; the video auto-plays (player bar shows **Pause**,
  `paused === false`).
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-003

- **Title:** Music player lists the minus-one sets
- **Priority:** P1
- **Steps:** 1. Open `/studio`. 2. Inspect the Music Player section.
- **Expected:** "Viewing 5 of 5 tracks"; the Afternoon Drive card shows
  subtitle "Mastered by Frankie Dev", meta "118 BPM" / "Fmaj" and its own
  more-options action.
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-004

- **Title:** Sidebar session browsing highlights selection
- **Priority:** P2
- **Steps:** 1. Open `/studio`. 2. Click **Stem Multitracks (Vocals/Beds)**.
- **Expected:** Active styling moves to the clicked item (styling-only
  state; no `aria-pressed` yet).
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-005

- **Title:** Radio section shows on-air stations
- **Priority:** P2
- **Steps:** 1. Open `/studio`. 2. Inspect the Radio section.
- **Expected:** "Viewing 4 of 4 stations"; 4 station cards each with an
  "On Air" tag; the BTP Lounge Radio card shows genre, frequency and its
  own more-options action.
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-006

- **Title:** Shell player bar plays the local video on the console
- **Priority:** P2
- **Steps:** 1. Open `/studio/player-queue`. 2. Click **Play** in the player
  bar.
- **Expected:** Toggle becomes **Pause** and the `<video>` element is
  actually playing (`paused === false`).
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-007

- **Title:** Clicking the stage toggles playback with the bar icon
- **Priority:** P2
- **Steps:** 1. Open `/studio/player-queue`. 2. Click the video stage, then
  click it again.
- **Expected:** First click plays (bar toggles to **Pause**), second click
  pauses (bar back to **Play**) — the icon mirrors the video state.
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-008

- **Title:** Seek bar scrubs with click and drag
- **Priority:** P2
- **Steps:** 1. Open `/studio/player-queue`. 2. Click the top seek strip at
  ~75%, then drag from ~25% to ~50%.
- **Expected:** The thumb circle marks the current position; the click jumps
  to ~75% and the drag scrubs continuously to ~50% (`currentTime / duration`
  follows both).
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-009

- **Title:** Console back button returns to the studio hub
- **Priority:** P2
- **Steps:** 1. Open `/studio` (no back link on the hub). 2. Open the video
  song console. 3. Click the top bar's **Back** link.
- **Expected:** You land back on the hub with the 'The Reason' heading
  visible.
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-010

- **Title:** Leaving the console hands the song to the hub, synced
- **Priority:** P2
- **Steps:** 1. Open `/studio`. 2. Open the console and let the video play
  past ~1.5 s. 3. Click the top bar's **Back** link.
- **Expected:** On the hub the lobby audio continues the same song from the
  video's position (bar shows **Pause** and the synced m:ss).
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-011

- **Title:** Picture in picture floats across studio pages
- **Priority:** P2
- **Steps:** 1. Open the console and let the video pass ~1.5 s. 2. Click
  **Picture in picture**. 3. Hover the floating **Mini player** and pause,
  then play. 4. Click **Expand**.
- **Expected:** The hub shows the mini player in the corner, still playing
  the same song from the console position; the overlay button pauses and
  resumes it. Expand returns to `/studio/player-queue` with the video
  playing from the carried-over position, and the mini hides.
- **Automation:** Playwright — **Status: Automated**

---

## Player — `frontend/tests/e2e/player/player.spec.ts`

### PLAYER-001

- **Title:** Player bar shows the current track
- **Priority:** P1
- **Steps:** 1. Open `/studio`. 2. Inspect the player bar.
- **Expected:** Track title "The Reason" and artist "Hoobastank" visible — the bar mirrors the real transport (every source plays the one local master).
- **Automation:** Playwright — **Status: Automated**

### PLAYER-003

- **Title:** Playback starts
- **Priority:** P1
- **Steps:** 1. Open `/studio`. 2. Click **Play** in the player bar.
- **Expected:** The toggle becomes **Pause** (the spec settles the lobby
  track to paused first — the test browser allows autoplay).
- **Automation:** Playwright — **Status: Automated**

### PLAYER-004

- **Title:** Pause and resume work
- **Priority:** P1
- **Steps:** 1. Play → Pause → Play.
- **Expected:** Toggle cycles Pause → Play → Pause correctly (same settle
  step as PLAYER-003).
- **Automation:** Playwright — **Status: Automated**

### PLAYER-006

- **Title:** Progress display shows current and total time
- **Priority:** P2
- **Steps:** 1. Open `/studio`.
- **Expected:** The bar mirrors the real lobby music transport — total time
  "3:54" (placeholder lobby track) and a live m:ss current time (0:00 until
  playback starts); the console shows the video's own m:ss.
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

## Booking desk — `frontend/tests/e2e/booking/booking.spec.ts`

Day-only prototype: a booking claims one whole calendar day of one service.
There are no time slots or time blocks yet, so no case here may assert on a
time of day. Every booking created is cancelled again by the same test — the
database allows only one *live* booking per service per day, and all suites
share one account, so a leaked `pending` row would break the next run. Days are
randomised 400–699 days out so parallel workers cannot collide either.

### BOOKING-001

- **Title:** The top bar opens the desk and the catalog renders
- **Priority:** P1
- **Steps:** 1. Open `/studio`. 2. Click **Bookings** in the top bar.
- **Expected:** `/studio/bookings` loads with h1 "Booking Desk"; eight service
  cards render from `/api/services`; the Karaoke MV card prices at 55,000.00;
  the "My bookings" panel is present.
- **Automation:** Playwright — **Status: Automated**

### BOOKING-002

- **Title:** The sidebar opens the desk on desktop
- **Priority:** P2
- **Steps:** 1. Open `/studio` at desktop width. 2. Click **Bookings** in the
  catalog sidebar.
- **Expected:** `/studio/bookings` loads with h1 "Booking Desk".
- **Notes:** The sidebar is `hidden md:flex`, so this case only applies at
  ≥768 px — BOOKING-006 covers the width where it is gone.
- **Automation:** Playwright — **Status: Automated**

### BOOKING-003

- **Title:** The wing filter narrows the catalog
- **Priority:** P2
- **Steps:** 1. Open `/studio/bookings`. 2. Click **Protect**. 3. Click
  **All services**.
- **Expected:** 8 cards → 2 cards (the FILSCAP pair) → 8 cards, with
  `aria-pressed="true"` on the selected wing.
- **Automation:** Playwright — **Status: Automated**

### BOOKING-004

- **Title:** A day booking is created, listed as pending, then cancelled
- **Priority:** P1
- **Steps:** 1. Open the desk. 2. On the Karaoke MV card click **Book this
  service**. 3. Confirm the pre-filled day equals the picker's `min`
  boundary. 4. Choose a day ~1–2 years out, add notes, **Confirm booking**.
  5. Cancel the new row.
- **Expected:** A confirmation flash carries a `BTP-XXXXXX` reference; the row
  appears in "My bookings" as **pending** with the notes text; cancelling flips
  it to **cancelled** and removes the cancel action.
- **Notes:** The booking day is rendered human-readable, so the exact day is
  asserted at the API level rather than here. Cancelling is also the test's
  own cleanup.
- **Automation:** Playwright — **Status: Automated**

### BOOKING-005

- **Title:** The same service on the same day cannot be booked twice
- **Priority:** P2
- **Steps:** 1. Book a service ~1–2 years out. 2. Re-open the same service on
  the same day and submit again. 3. Cancel the live booking.
- **Expected:** The form shows an alert containing "already have a booking"
  instead of silently doing nothing — the partial unique index is surfaced as a
  plain-language conflict, not a raw database error.
- **Automation:** Playwright — **Status: Automated**

### BOOKING-006

- **Title:** The top bar still reaches the desk when the sidebar is hidden
- **Priority:** P2 (mobile viewport 390×844)
- **Steps:** 1. Open `/studio/bookings` at 390×844.
- **Expected:** The catalog sidebar is not rendered, the top-bar **Bookings**
  link is still visible and named, and all 8 cards render.
- **Regression guard:** the desk is reachable from two places precisely so
  that hiding the sidebar below `md` cannot strand it; removing either entry
  point fails this case.
- **Automation:** Playwright — **Status: Automated**

### BOOKING-007

- **Title:** A signed-out visitor is bounced to sign-in
- **Priority:** P2
- **Steps:** 1. Without a session, open `/studio/bookings` directly.
- **Expected:** Redirect to `/signin`; no "Booking Desk" content is ever shown.
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
| Online payment for a booking           | N/A                   | The prototype takes no payment. Every booking is created `pending` and the studio confirms it offline. |
| Booking accept/reject by an admin      | N/A                   | `booking.status` already carries pending / confirmed / rejected / cancelled / completed, so accepting a booking needs no schema change — only an admin role and UI, which do not exist yet. |
| Time-slot / time-block booking         | N/A                   | Day-only by design for now: a booking claims a whole calendar day. |
| Backend booking API (`/api/services`, `/api/bookings`) | Partial | Exercised end-to-end through the UI by BOOKING-001…007; the 401 / 400 / 404 / 409 branches are covered by a direct API probe rather than by Playwright. |
| Backend auth API tests                 | **Recommended next**  | `/api/auth/*` + `/api/me` exist (sign-up 200, sign-in 200, wrong password 401) with no automated coverage yet.        |
