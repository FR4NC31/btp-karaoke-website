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
- **Expected:** The published catalog renders: the Video Song section shows
  h1 "The Reason" and the "Play The Reason" link. Sections render only while
  the admin-managed catalog has published rows, so no empty section is
  asserted.
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

- **Title:** Studio hub opens with the published video song
- **Priority:** P0
- **Preconditions:** The seeded catalog holds the one real local master
  ("The Reason"); the telemetry table is retired.
- **Steps:** 1. Open `/studio`.
- **Expected:** Studio header, h1 "The Reason" (the first video row), the
  Video Song section heading, and the "Play The Reason" link; the old
  telemetry heading is absent. Music and radio render only while published
  rows exist, so they are not asserted here.
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

- **Title:** Music player renders published catalog tracks
- **Priority:** P1
- **Preconditions:** Creates its own music row through the admin API
  (`helpers/media.ts`) and deletes it afterwards — the seeded catalog has
  none.
- **Steps:** 1. Create a music row (title, description, tag, "118 BPM",
  "Fmaj"). 2. Open `/studio`. 3. Inspect the Music Player section.
- **Expected:** The section heading and "Viewing N of N tracks" render; the
  card for the created title shows the description, "118 BPM" / "Fmaj" and
  its own more-options action.
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-004

- **Title:** Sidebar session browsing highlights selection
- **Priority:** P2
- **Steps:** 1. Open `/studio`. 2. Click **Stem Multitracks (Vocals/Beds)**.
- **Expected:** Active styling moves to the clicked item (styling-only
  state; no `aria-pressed` yet).
- **Automation:** Playwright — **Status: Automated**

### KARAOKE-005

- **Title:** Radio section renders published stations
- **Priority:** P2
- **Preconditions:** Creates its own station row through the admin API and
  deletes it afterwards.
- **Steps:** 1. Create a station (genre, "FM 88.3", 1234 listeners).
  2. Open `/studio`. 3. Inspect the Radio section.
- **Expected:** The section heading and "Viewing N of N stations" render; the
  card shows the genre, the frequency, the compact listener count ("1.2K")
  and the default "On Air" tag; the more-options action is present.
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

### KARAOKE-012

- **Title:** An uploaded minus-one really plays from the hub
- **Priority:** P1
- **Preconditions:** Uploads a real (silent) MP3 through the admin API
  (`helpers/media.ts`) and attaches it to a fresh music row; the row is
  deleted in `finally` and the stored file is asserted gone with it.
- **Steps:** 1. Open `/studio` and find the card. 2. Click its play link.
- **Expected:** The console stage plays **that uploaded file** (`src` is the
  stored `/api/uploads/media/...` url — not the bundled master), the bar
  shows the track's title, the stage reads **Studio Audio Mode**, the PiP
  button is absent (audio-only), and the stored file answers byte ranges
  (206). Deleting the row removes the stored file (404).
- **Automation:** Playwright — **Status: Automated**

---

## Player — `frontend/tests/e2e/player/player.spec.ts`

### PLAYER-001

- **Title:** Player bar shows the current track
- **Priority:** P1
- **Steps:** 1. Open `/studio`. 2. Inspect the player bar.
- **Expected:** Track title "The Reason" and artist "Hoobastank" visible — the bar mirrors the real transport (the lobby/master default when nothing else is on air; the console's on-air track renames it — see KARAOKE-012).
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

## Admin console & role security — `frontend/tests/e2e/admin/`

Admins are ordinary accounts with `user.role = 'admin'` — one login, no second
credential store. The console lives at `/admin` behind `RequireAdmin` (UI only);
the real boundary is `requireAdmin` on `/api/admin/*`. There is deliberately no
HTTP route that can grant the role: promotion is
`npm run promote-admin -- email` against the database (backend/README.md).
Admin-taken reservations (tagged customer or guest name) are created
**confirmed** — the admin is the approval step. Cleanup mirrors the booking
desk: every test-created reservation is driven to a terminal state
(`completed`/`cancelled`) so it leaves the "one live booking per day" index.

### SEC-001

- **Title:** Every admin endpoint answers 401 without a session
- **Priority:** P1
- **Steps:** 1. Signed out, call `GET /api/admin/bookings`, `GET /api/admin/users`, `POST /api/admin/bookings`, `POST /api/admin/bookings/:id/confirm`.
- **Expected:** Every call is HTTP 401 with body `{"error":"Unauthorized"}` — no data of any kind.
- **Automation:** Playwright — **Status: Automated**

### SEC-002

- **Title:** A signed-in non-admin gets 403 and no data anywhere
- **Priority:** P1
- **Steps:** 1. Signed in as `qa@example.com` (role `user`), call the same four endpoint shapes.
- **Expected:** Every call is HTTP 403 with body `{"error":"Forbidden"}` — the same shape as the customer's own desk gets does not leak anything about other users.
- **Automation:** Playwright — **Status: Automated**

### SEC-003

- **Title:** Role cannot be set at sign-up or through update-user
- **Priority:** P1
- **Steps:** 1. Sign up with `"role": "admin"` in the body. 2. Read the created user. 3. Call `POST /api/auth/update-user` with `"role": "admin"` (Origin header set, as a browser would). 4. Read the session again.
- **Expected:** The created user's role is `user`; `update-user` rejects with 400 (field not allowed); the session's role is still `user`. The only way to become an admin is the CLI promotion script.
- **Automation:** Playwright — **Status: Automated**

### SEC-004

- **Title:** A signed-in non-admin is bounced out of the console UI
- **Priority:** P2
- **Steps:** 1. As `qa@example.com`, open `/admin` directly. 2. Inspect the studio chrome.
- **Expected:** Redirect to `/studio`; the top bar offers no console link, and no console heading is ever shown.
- **Automation:** Playwright — **Status: Automated**

### SEC-005

- **Title:** A signed-out visitor is sent to sign-in, remembering `/admin`
- **Priority:** P2
- **Steps:** 1. Without a session, open `/admin`.
- **Expected:** Redirect to `/signin?next=%2Fadmin` — the `next` value is what returns an admin to the console after signing in, and it is validated before use (frontend/src/lib/redirects.ts).
- **Automation:** Playwright — **Status: Automated**

### ADMIN-001

- **Title:** Signing in lands an admin on the console
- **Priority:** P1
- **Steps:** 1. Sign out. 2. Sign in as `qa-admin@example.com` through the real form.
- **Expected:** The form's role-aware redirect lands on `/admin` (not `/studio`); the Overview page renders with the Pending approvals and Today at the studio panels.
- **Automation:** Playwright — **Status: Automated**

### ADMIN-002

- **Title:** A pending reservation is confirmed from the queue, then completed
- **Priority:** P1
- **Steps:** 1. Create a `pending` reservation as the customer (API, `qa@example.com`). 2. Open `/admin`; find the row in the Pending approvals queue. 3. Click **Confirm**. 4. Open Reservations, search the reference, click **Mark completed**.
- **Expected:** Confirm produces a flash naming the reference and status and the row leaves the queue; the reservations list shows **confirmed**, then **completed** after the second action. Completing is also the cleanup.
- **Automation:** Playwright — **Status: Automated**

### ADMIN-003

- **Title:** A pending reservation is rejected from the queue
- **Priority:** P1
- **Steps:** 1. Create a second `pending` reservation as the customer. 2. Open `/admin`, find it, click **Reject**. 3. Search it in Reservations.
- **Expected:** A rejection flash names the reference; the row leaves the queue and shows **rejected** on the reservations list. `rejected` is terminal and already outside the unique index, so no cleanup is needed.
- **Automation:** Playwright — **Status: Automated**

### ADMIN-004

- **Title:** The admin books a day for a guest name
- **Priority:** P1
- **Steps:** 1. Open `/admin/bookings/new`, switch to **Guest name**. 2. Type a name, pick a service and a day ~1–2 years out, save. 3. Search the reference in Reservations, then cancel it.
- **Expected:** The flash carries the reference, the guest name and **confirmed** — no approval step for a reservation the admin just took. The list row shows the Guest marker and the name. Cancelling is cleanup.
- **Automation:** Playwright — **Status: Automated**

### ADMIN-005

- **Title:** The admin tags a registered customer instead of a guest
- **Priority:** P1
- **Steps:** 1. Open `/admin/bookings/new` (default mode: **Registered customer**). 2. Type `qa@example.com`, tag the result. 3. Pick a service and day, save. 4. Search the reference in Reservations, then mark it completed.
- **Expected:** The flash carries the reference and **confirmed**; the list row shows the customer's email and no Guest marker. Marking completed is cleanup (it releases the day in the unique index).
- **Automation:** Playwright — **Status: Automated**

### ADMIN-006

- **Title:** The studio chrome exposes the console link, and it works
- **Priority:** P2
- **Steps:** 1. As the admin, open `/studio`. 2. Click the **Admin Console** link in the top bar.
- **Expected:** The link is visible in the studio chrome (the top bar entry is the mobile-width path, since the console link in the sidebar is `hidden md:flex`), and it navigates to `/admin`.
- **Automation:** Playwright — **Status: Automated**

### ADMIN-007

- **Title:** The admin adds a music track and it reaches the hub
- **Priority:** P1
- **Steps:** 1. Open `/admin/media/new`, pick **Music track**. 2. Fill title, description, tempo "120 BPM", key "Am"; save. 3. Check `/admin/media`, then `/studio`. 4. Delete the row from the console — the delete asks for confirmation; cancel once, then confirm.
- **Expected:** The editor's fields switch per type (music asks tempo/key); the flash says the item is live on the hub; the console lists it as a Live row with its meta; the studio hub renders the card; **Delete** first turns into a "Delete permanently?" Confirm/Cancel pair — Cancel keeps the Live row, Confirm removes it (cleanup).
- **Automation:** Playwright — **Status: Automated**

### ADMIN-008

- **Title:** Media rows can be hidden, reordered, and edited
- **Priority:** P2
- **Preconditions:** Creates two video rows through the admin API; both are deleted in `finally`.
- **Steps:** 1. Hide one in the console, then check `/studio`. 2. Show it again. 3. Move it up. 4. Open its editor, retitle it, save.
- **Expected:** Hidden rows keep a Hidden chip in the console but vanish from `/studio`; Show restores them; Move swaps one slot earlier; the editor pre-fills and saving shows the Saved flash and the new title in the list. API cleanup runs even if the UI half fails.
- **Automation:** Playwright — **Status: Automated**

### ADMIN-009

- **Title:** The admin uploads an MP4 and the hub really plays it
- **Priority:** P1
- **Steps:** 1. Open `/admin/media/new`. 2. Fill title/artist, pick the repo's real MP4 master in **Video file (MP4)**; save. 3. Check `/admin/media` (MP4 file badge), then click the hub card. 4. Delete the row via the confirm flow.
- **Expected:** The picker shows "Ready to upload" and "Runtime: 3:54 — read from the file." (the duration is read off the file — the editor has no manual duration box); the flash says the item is live; the console row carries the **MP4 file** badge; the hub card shows the artist under the title and the runtime in its meta strip, and opens the console playing the stored `/api/uploads/media/...` file (not the bundled master), with the bar showing the row's title and artist; the stored file answers byte ranges (206). Confirmed delete removes the row **and** the stored file (404 on the url).
- **Automation:** Playwright — **Status: Automated**

### ADMIN-010

- **Title:** The uploader rejects files that are not real media or cover images
- **Priority:** P2
- **Steps:** 1. POST a `.txt` through the admin upload endpoint. 2. POST `track.mp3` with a `video/mp4` content type. 3. POST `cover.png` with a `video/mp4` content type. 4. Create a row whose `sourceUrl` names an image, and one whose `coverUrl` names an MP4. 5. POST anonymously.
- **Expected:** 400 "Only MP4 video, MP3 audio or JPG/PNG/WebP image files can be uploaded."; 400 with a "does not match" message for both type/extension mismatches; 400 for the column cross-checks (a cover in `sourceUrl`, media in `coverUrl` — either would dodge the delete/replace cleanup); 401 for the anonymous caller (`requireAdmin` on the sub-app). Nothing is written to disk and no row is created for any of them.
- **Automation:** Playwright — **Status: Automated**

### ADMIN-011

- **Title:** A signed-in admin is never dropped into the user dashboard
- **Priority:** P1
- **Steps:** 1. As a signed-in admin, open `/signin` and `/signup`. 2. On the landing page, click **Sign In** (the auth dialog) while already authenticated.
- **Expected:** Every path lands on `/admin` — the guest-only pages bounce by role (`landingPathFor`), and the landing auth dialog routes the same way instead of hardcoding `/studio`. The dialog never opens a sign-in form for an authenticated user. (Regression: the dialog and the Google OAuth callback used to send any session — admins included — to `/studio`.)
- **Automation:** Playwright — **Status: Automated**

### ADMIN-012

- **Title:** MP3 tags fill the editor and the embedded cover reaches the hub
- **Priority:** P1
- **Steps:** 1. Open `/admin/media/new` as **Music track**. 2. Pick `tests/e2e/assets/silence.mp3` (real ID3 tags + embedded JPEG art) with every box empty, then retitle the row uniquely. 3. Save, check the console row and the hub card, then delete the row.
- **Expected:** Title/**Artist**/album fill from the file's own tags (via `music-metadata`) — the artist tag lands in Artist, not the description — and the runtime reads off the MP3 ("Runtime: 0:01 — read from the file."); typed copy is never clobbered. The editor shows "Found in the file's own tags" with a blob-URL cover preview; saving uploads the art **optimized to WebP** and the row gains MP3 + Cover chips. The hub card shows the stored cover (`image/webp` from `/api/uploads/media/…`), the artist under the title, and the runtime + album in its meta strip. Deleting the row 404s both stored files.
- **Automation:** Playwright — **Status: Automated**

### ADMIN-013

- **Title:** A video thumbnail is grabbed, overridden, removed, and defaulted
- **Priority:** P1
- **Steps:** 1. Open `/admin/media/new` as **Video song**. 2. Pick a tagless MP4 (`the-reason.mp4`) → the editor grabs a frame. 3. Pick `tests/e2e/assets/cover.png` over it, save, check the hub card. 4. Edit the row → **Remove cover** → save. 5. Delete the row.
- **Expected:** The tagless video gets "Grabbed from the video" as its default thumbnail (no striped placeholder); an explicitly picked image overrides it and lands on the card as optimized WebP. After removal the card falls back to the default art and the replaced cover file is 404. Deleting the row takes the stored MP4 with it (404).
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
| Real playback, progress movement, volume | Covered               | Real media elements and a shared transport: play/pause, seek and volume are pinned by KARAOKE-006…008; the console plays the row's uploaded file when one is attached (ADMIN-009, KARAOKE-012) and the bundled master otherwise. |
| Media loading failure / unavailable song | Partial               | Uploads are validated at write time (ADMIN-010) and rows can only reference files this backend stores, so a day-one broken source is rejected; a file deleted outside the app would surface as a stalled media element (no UI error state yet). |
| OAuth login flow (Google)              | Partial               | The hand-off to Google is automated (AUTH-008) and OAuth errors surface in the UI (AUTH-018); the consent step needs a real Google account, so it stays manual. |
| Online payment for a booking           | N/A                   | The prototype takes no payment. Every booking is created `pending` and the studio confirms it offline. |
| Booking accept/reject by an admin      | Covered               | Shipped: the `/admin` queue confirms/rejects pending reservations (ADMIN-002/003). Every admin endpoint is gated by `requireAdmin` (SEC-001/002), role self-promotion is closed (SEC-003), and admins can also take reservations for a tagged customer or a guest (ADMIN-004/005). |
| Media hub catalog management           | Covered               | The hub renders the `media_item` catalog, curated from `/admin/media`: add/edit (ADMIN-007 — reaches `/studio`), hide/show + reorder (ADMIN-008), real MP4/MP3 uploads with delete confirmation (ADMIN-009/010 — stored files serve byte ranges and play from the hub, KARAOKE-012), and tag metadata + cover art / thumbnails (ADMIN-012/013 — tags pre-fill the blank boxes (artist included), the runtime reads off the picked file, embedded art, grabbed frames, picked images, all stored as optimized WebP; without one, default art). KARAOKE-003/005 create their rows via the admin API and delete them. |
| Time-slot / time-block booking         | N/A                   | Day-only by design for now: a booking claims a whole calendar day. |
| Backend booking API (`/api/services`, `/api/bookings`) | Partial | Exercised end-to-end through the UI by BOOKING-001…007; the 401 / 400 / 404 / 409 branches are covered by a direct API probe rather than by Playwright. |
| Backend auth API tests                 | Partial               | SEC-003 calls sign-up / update-user / get-session directly to prove the role cannot be escalated. Broader direct API coverage (wrong-password 401, `/api/me` branches) is still the recommended next suite.        |
