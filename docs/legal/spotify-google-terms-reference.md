# Legal reference: Spotify and Google platform terms

> **Audience: AI agents and developers working in this repository.** Any change
> that touches OAuth login, provider user data, provider badges, metadata or
> playlist display, or platform brand assets **must** follow the rules here.
> Rules are written as **NEVER** (hard prohibition), **MUST** (affirmative
> obligation), or **SHOULD** (recommended practice). Every rule cites its
> source. Platform terms change over time: if a rule looks stale, or a feature
> would go beyond what this document describes, re-read the source documents in
> §1 **before** writing code.

This document records the legal basis for the two third-party integrations in
this project:

- **Spotify login** (better-auth `socialProviders.spotify`) and the Spotify
  user badge.
- **Google login** (better-auth `socialProviders.google`).

Sections: [1 Governing documents](#1-governing-documents) ·
[2 Integration baseline](#2-what-our-integration-does-baseline) ·
[3 Spotify rules](#3-spotify-rules) ·
[4 Google rules](#4-google-rules) ·
[5 Shared obligations](#5-shared-obligations-and-open-gaps) ·
[6 Pre-merge checklist](#6-pre-merge-checklist-for-ai-agents) ·
[7 Verification log](#7-source-verification-log)

---

## 1. Governing documents

The Spotify documents form **one binding agreement**: the Developer Terms
incorporate the Developer Policy, the Data Protection Appendix, and the
Branding Guidelines by reference. Acceptance happens by using the platform.
The Google documents are two parallel bindings (the APIs ToS plus the User Data
Policy), with the Sign-In Branding Guidelines required for app verification.

| # | Document | URL | Version / date |
|---|----------|-----|----------------|
| S1 | Spotify Developer Terms (incl. Data Protection Appendix) | https://developer.spotify.com/terms | eff. 15 May 2025 |
| S2 | Spotify Developer Policy (incorporated into S1) | https://developer.spotify.com/policy | eff. 15 May 2025 |
| S3 | Spotify Design & Branding Guidelines | https://developer.spotify.com/documentation/design | current as verified |
| S4 | Spotify Web API overview | https://developer.spotify.com/documentation/web-api | current as verified |
| S5 | Spotify Web Playback SDK (**not used by this project**) | https://developer.spotify.com/documentation/web-playback-sdk | current as verified |
| G1 | Google APIs Terms of Service | https://developers.google.com/terms | last modified 9 Nov 2021 |
| G2 | Google API Services User Data Policy | https://developers.google.com/terms/api-services-user-data-policy | last updated 15 Feb 2024 |
| G3 | Google Sign-In Branding Guidelines (required for app verification) | https://developers.google.com/identity/branding-guidelines | current as verified |
| G4 | Google Controller-Controller Data Protection Terms (incorporated via G1 §2.i) | linked from G1 | — |

**Why Google Login is governed here.** Using Google Sign-In means requesting
access to Google user data through Google API Services. G1 (master contract)
and G2 (how user data may be used) both apply from day one, even for the basic
`openid email profile` sign-in scopes.

---

## 2. What our integration does (baseline)

These rules apply to the following concrete behavior. Changing any of it
requires re-checking the cited rules.

**Spotify**

- Login via better-auth `socialProviders.spotify`
  (`backend/src/modules/auth/auth.ts`), Authorization Code + PKCE.
- Scope: `user-read-email` only — the stock better-auth default, kept
  deliberately as the minimum for the fields read (comment at the `spotify`
  provider entry).
- One `GET https://api.spotify.com/v1/me` call per login, implemented in
  `backend/src/modules/auth/spotify.ts` (`getSpotifyUserInfo`). It never
  throws: missing token / non-2xx / network failure returns `null` and logs
  the `ErrorObject.message` server-side only.
- Subject choice: `account_id` (immutable) over `id`, per Spotify's linking
  guidance; `emailVerified: false` always — Spotify's `email` claim is
  deprecated/unverified, so `'spotify'` must **never** be added to
  `trustedProviders` without local email verification (policy comment in
  `auth.ts`).
- Stored server-side in Postgres (better-auth tables): identity fields
  (email, name, image, `first_name`/`last_name` split from `display_name`,
  `contact_num: ''`) plus OAuth access/refresh tokens on the account row.
  Token fields never leave the server — better-auth's `/list-accounts`
  response strips them (`parseAccountOutput`).
- UI: Spotify sign-in button and a Spotify icon badge next to the user's name
  (`frontend/src/assets/icons/spotifyIcon.svg` — standard icon, official
  green `#1DB954`).
- Class: **Non-Streaming SDA** — no playback of Spotify audio anywhere, no
  Web Playback SDK (S5 explicitly not used).

**Google**

- Login via better-auth `socialProviders.google`, default OIDC scopes
  `openid email profile` (basic account info; no sensitive/restricted scopes).
- `mapProfileToUser` fills the schema-required `first_name`/`last_name`/
  `contact_num` fields; no Google scopes are requested for phone data.
- Same storage posture as Spotify: identity + tokens server-side only.
- UI: custom button labeled **"Continue with Google"** with
  `frontend/src/assets/icons/googleIcon.svg` — the standard four-color
  Google "G" (`#4285F4 #34A853 #FBBC05 #EB4335`), unmodified.

**Cross-cutting**

- Secrets (`SPOTIFY_CLIENT_*`, `GOOGLE_CLIENT_*`, `BETTER_AUTH_SECRET`) live
  in backend environment variables only — never in the frontend bundle, never
  in git, never in CI (e2e uses dummy values such as
  `e2e-dummy-spotify-client-id`).
- CI never performs a real Spotify or Google login.

---

## 3. Spotify rules

### 3.1 NEVER (hard prohibitions)

| # | Rule | Source |
|---|------|--------|
| SN1 | **Never** train ML/AI models on Spotify content or user data. | S1 §IV.2; S2 §III |
| SN2 | **Never** store, copy, or compile Spotify content (tracks, playlists, artwork, metadata) beyond the immediate operation of the feature that uses it; **no long-lived caches**, no DB persistence of playlist/track data. | S1 §IV.3; S1 §V.7 |
| SN3 | **Never** sell or transfer Spotify user data to ad networks, data brokers, or information resellers — *even with user consent*. | S1 §IV.5; S2 §I |
| SN4 | **Never** synchronize Spotify sound recordings with any visual media. **Karaoke = lyrics on screen synced to a recording, so karaoke audio must never come from Spotify.** Also never mix/segue/re-mix/overlap Spotify content with other audio. Karaoke audio must come from the project's own licensed source. | S2 §III (prohibited applications) |
| SN5 | **Never** scrape Spotify or make excessive service calls; **never** retry a `429` immediately — honor `Retry-After` and use exponential backoff. | S1 §IV.4; S1 §VI (quotas) |
| SN6 | **Never** put "Spotify" or any name beginning with "Spot" in the application name (dashboard or site), and **never** imply partnership, sponsorship, or endorsement by Spotify. | S2 §VI; S1 §IX (publicity) |
| SN7 | **Never** modify, distort, rotate, recolor, or crop the Spotify logo/icon; **never** render the icon smaller than 21px digitally; green logo only on black/white backgrounds. | S3 |
| SN8 | **Never** request scopes beyond what the current feature needs — no "future-proofing" with scopes. | S1 §V.3 |
| SN9 | **Never** expose the Spotify client secret anywhere but backend env vars; **never** commit it or log it. | S1 §VI (Security Codes) |
| SN10 | **Never** treat the Spotify `email` claim as verified for account auto-linking — `'spotify'` stays out of `trustedProviders` unless email is verified locally first. | S2 §I (respect users and data) |
| SN11 | **Never** use `localhost` as a redirect URI; registered redirect URIs are exact-match (`https` required except `http://127.0.0.1`). Registered URI = `BETTER_AUTH_URL` + `/api/auth/callback/spotify`. | S4 / Spotify dashboard rules |
| SN12 | **Never** use the Web Playback SDK without Spotify's prior written approval for commercial projects — and this project does not use it at all. | S5 |

### 3.2 MUST (affirmative obligations)

| # | Rule | Source |
|---|------|--------|
| SM1 | Keep the login scope minimal (`user-read-email`) and one identity call (`/v1/me`) per login. | S1 §V.3 |
| SM2 | Display a **privacy policy before signup** covering data collected, use, sharing, contact point, cookies, and cookie controls. | S1 §V.12; S2 §I |
| SM3 | Display an enforceable **end-user agreement** with the required Spotify-protective terms (Spotify as third-party beneficiary, no warranties on Spotify's behalf, no reverse engineering, your responsibility for your product). | S1 §V.11 |
| SM4 | Provide an easily accessible **disconnect mechanism** for the linked Spotify account and **delete that user's Spotify personal data within 5 days** of disconnect; honor erasure requests. | S1 §V.8–V.9; Data Protection Appendix §5 |
| SM5 | Keep security posture industry-standard (TLS in transit, protected storage at rest); if an EU/UK personal-data breach occurs, notify `security@spotify.com` within 24 hours. | Data Protection Appendix §6, §9 |
| SM6 | When displaying Spotify metadata/artwork (Phase 2 playlists): show the **Spotify logo attribution** and **link back to Spotify** for the content; artwork unmodified with 4px rounded corners (8px large screens), no overlays/crops; a full dedicated row, never seated next to other services' content; ≤20 items per set. | S3; S2 §II |
| SM7 | Fetch Spotify content **fresh at display time** — do not persist playlists/tracks in the database (see SN2). | S1 §IV.3 |
| SM8 | Handle OAuth/API errors gracefully and non-leaking: provider errors map to friendly messages, raw provider error bodies stay server-side. | S2 §I (be truthful/transparent); general security posture |
| SM9 | Treat Spotify as an independent **data controller** relationship: we process Spotify personal data under our own privacy policy, per the Data Protection Appendix (SCC terms apply for EU/UK transfers). | Data Protection Appendix |

### 3.3 Operational setup rules (manual, non-code)

- Dashboard app name: e.g. **"BTP Karaoke"** — no "Spot…" prefix, no
  "Spotify" anywhere in the name (SN6).
- Register **both** exact redirect URIs used locally:
  `https://<ngrok-domain>/api/auth/callback/spotify` and
  `http://127.0.0.1:3000/api/auth/callback/spotify` — never `localhost`.
- Development mode: ≤5 allowlisted emails (403 at `/v1/me` otherwise), app
  owner needs a Premium account, team uses Premium for API calls (S4 requires
  Premium for Web API use).
- Real credentials never enter GitHub — CI uses dummies only.

---

## 4. Google rules

### 4.1 NEVER (hard prohibitions)

| # | Rule | Source |
|---|------|--------|
| GN1 | **Never** request scopes you do not need for a shipped feature — no "future-proofing" access. Incremental authorization only when a feature actually needs more. | G2 (minimum relevant permissions); G3 (other guidelines) |
| GN2 | **Never** embed Google developer credentials (client secret) in frontend code, public repos, or open source. | G1 §4.b; G2 (keep credentials confidential) |
| GN3 | **Never** sell, share, or transmit Google user data to advertising platforms, data brokers, or resellers; **never** use it for retargeting, personalized/interest-based ads, or credit/lending decisions. (Adopt the Limited Use posture regardless of scope class — see §4.3.) | G2 (Limited Use requirements) |
| GN4 | **Never** claim partnership, sponsorship, or endorsement by Google in any statement about the app. | G1 §6.c |
| GN5 | **Never** reverse-engineer undocumented Google APIs or access data by any means other than the documented flow. | G1 §4.a; G2 |
| GN6 | **Never** expose a user's non-public Google content to other users or third parties without that user's explicit opt-in. | G1 §5.c |
| GN7 | **Never** build permanent copies of content returned by Google APIs or keep cached copies beyond permitted cache headers (applies if Google APIs beyond login are ever added). | G1 §5.e |
| GN8 | **Never** remove, obscure, or alter Google's terms of service, links, or notices in the product. | G1 §4.a |
| GN9 | **Never** use Google Sign-In in a child-directed (under-13) application. | G2 (child-directed apps) |
| GN10 | **Never** use a monochrome or self-drawn "G", never use the "G" alone without button boundary and text, never use the bare word "Google" as the action label. | G3 (custom button do/don't) |
| GN11 | **Never** misrepresent who requests the data, what is requested, why it is requested, or the app's operating environment on consent screens. | G2 (accurate representation; deceptive use) |

### 4.2 MUST (affirmative obligations)

| # | Rule | Source |
|---|------|--------|
| GM1 | Publish a **privacy policy** that fully documents how the app handles user data, and list its URL in the OAuth client configuration; update it and re-prompt consent before any change in data use. | G2 (transparency); G1 §3.d |
| GM2 | Provide a privacy policy for the API client that clearly and accurately describes what user information is collected and how it is used and shared. | G1 §3.d |
| GM3 | Protect user data with **commercially reasonable security**; keep data secure in transit and at rest; report unauthorized access to users as required by applicable law. | G1 §3.b; G2 (secure operating environment) |
| GM4 | Follow the **Sign-In Branding Guidelines** (required for app verification): recommended Google-rendered button (Google Identity Services SDK); custom buttons must use approved call-to-action text — **"Sign in with Google", "Sign up with Google", or "Continue with Google"** (ours uses the approved "Continue with Google") — the standard-color gradient "G" (never recolored/monochrome), preserved aspect ratio, Google Sans Medium text, light/dark/neutral themes, and the button at least as prominent as other third-party sign-in options. | G3 |
| GM5 | Keep scopes at `openid email profile` for sign-in; any additional scope requires a documented feature need first (and may trigger Google app verification / security assessment). | G2; G3 |
| GM6 | Enable users to **export their data** (data portability) while it is stored. | G1 §5.d |
| GM7 | Require end users to comply with applicable law and these terms; comply with privacy laws and the Google Controller-Controller Data Protection Terms for GDPR contexts. | G1 §2.a, §2.i |
| GM8 | Bind employees, agents, and contractors to these same data-use restrictions. | G2 (Limited Use) |

### 4.3 Scope classes — the tripwire

The **Limited Use** and **Secure Data Handling** clauses in G2 attach to
Google's *Sensitive and Restricted Scopes* (Gmail, Drive, YouTube, Contacts,
Calendar, etc.). Our current sign-in scopes are **not** in that class, so
today's surface is the general obligations above (minimum scopes, privacy
policy, security, branding).

**If a change proposes any scope beyond `openid email profile`: STOP.**
It likely means sensitive/restricted scopes, which trigger Google app
verification, a possible annual third-party security assessment, and a much
larger compliance surface. Re-read G2 and G3 first, then revisit this document.

---

## 5. Shared obligations and open gaps

### 5.1 Rules that apply to both platforms

- **Server-side secrets only** — OAuth client secrets live in backend env
  vars; never in the frontend bundle, git history, CI logs, or client-visible
  API responses.
- **Token hygiene** — access/refresh tokens stay in the server database and
  are stripped from every API response (better-auth's `parseAccountOutput`).
  Never log token values.
- **No ad-tech on provider data** — neither platform's user data may feed
  advertising, resale, or analytics that expose it to third parties.
- **No ML/AI training** on either platform's user data or content.
- **Scope minimization** — the login scopes stay at
  `user-read-email` (Spotify) and `openid email profile` (Google).
- **Error handling** — `429` responses honor `Retry-After` with exponential
  backoff; other documented HTTP errors surface as friendly, provider-aware
  messages; raw error bodies stay server-side.

### 5.2 Open compliance gaps (as of 2026-11-14)

These are **site-level artifacts**, not integration code, but both platforms'
terms require them before real users sign up (dev-mode testing with allowlisted
users is unaffected):

1. **Privacy policy page** — the footer currently shows inert placeholder
   text (`frontend/src/layouts/SiteFooter.tsx`, "Privacy Policy" span).
   Required by S1 §V.12 and G2/GM1.
2. **End-user agreement / Terms of Use page** — same placeholder ("Terms of
   Use" span). Required by S1 §V.11 with the Spotify third-party-beneficiary
   clauses.
3. **Disconnect + delete mechanism** — no unlink UI exists for the linked
   Spotify account; required by S1 §V.8 and the Data Protection Appendix
   (delete within 5 days of disconnect).

Until these land, this document's status is **"compliant for development,
not launch-ready."**

### 5.3 Strategic line (both platforms)

Spotify and Google data may be **displayed and linked, but never turned into
advertising, training data, or synchronized playback**. For this project the
bright line is: Spotify is identity + (Phase 2) playlist *display*; karaoke
audio comes only from the project's own licensed source (SN4).

---

## 6. Pre-merge checklist for AI agents

Run this whenever a change touches auth, OAuth, badges, provider data, brand
assets, or would add an API call to either platform:

1. [ ] Scopes unchanged or reduced — never increased without a documented
       feature need and a re-read of §4.3 (Google) / SN8 (Spotify).
2. [ ] No provider content (tracks, playlists, artwork, messages) persisted
       to the database or files beyond identity fields.
3. [ ] No token fields or client secrets in API responses, client bundles,
       logs, tests, or CI.
4. [ ] No ad-tech, resale, data-broker transfer, or ML/AI training on any
       provider data.
5. [ ] Brand assets: official, unmodified, correct minimum sizes, approved
       button wording, no endorsement/partnership claims (SN6, SN7, GM4).
6. [ ] `429` handling honors `Retry-After` with backoff; other provider errors
       are handled gracefully without leaking raw responses.
7. [ ] If displaying Spotify content: attribution + link-back + artwork rules
       + dedicated row + fresh fetch, no persistence (SM6, SM7).
8. [ ] Karaoke/audio features never source sound from Spotify (SN4).
9. [ ] Redirect URIs remain exact-match; no `localhost`; secrets stay out of
       the repo (SN11, GN2).
10. [ ] If the change claims "compliant" — verify §5.2 gaps are actually
        closed first.

---

## 7. Source verification log

- **2026-11-14** — All documents in §1 read in full for this repository:
  Spotify Developer Terms (incl. Data Protection Appendix), Spotify Developer
  Policy, Spotify Design & Branding Guidelines, Spotify Web API and Web
  Playback SDK overviews; Google APIs Terms of Service, Google API Services
  User Data Policy, Google Sign-In Branding Guidelines. Rules and citations in
  this document reflect those versions. Re-verify against the §1 URLs if a
  version date there no longer matches this log.
