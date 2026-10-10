# Development Changelog

## Unreleased

Last updated: October 10, 2026

### Features

- feat: Implement real user profile image from database (5843a7c)
- feat(frontend): surface auth and route errors (acbeeea)
- feat(frontend): split studio into shell with routed profile page (dcebca4)
- feat(frontend): add About and Contact pages with shared site chrome (2e75735)
- feat(frontend): guard the auth routes in both directions (a783831)
- feat(frontend): guard /studio behind a session (a21478f)
- feat(frontend): wire sign-up and sign-in to Better Auth (b5be774)
- feat: mount Better Auth handler, session middleware, and dash plugin (f01b98c)
- feat: set up Better Auth with Aiven PostgreSQL user table (46a598b)
- feat: Implement Login/Sign up form with dashboard (9afb6f2)
- feat: automate dated changelog updates (5cbba18)

### Bug Fixes

- fix(frontend): settle the session before navigating to /studio (67b7abb)
- fix(frontend): handle rejected auth requests instead of hanging (fd17c80)
- fix: drop mobile nav placeholder comment (b2d95b8)
- fix: scope evidence attachment to recorded activity (eb8885b)
- fix: address PR review issues in tests, UI and docs (4b7030b)
- fix: add mobile nav, exact 11-digit contact check, and Google sign-in prototype state (c8c4de9)
- fix: resolve audit issues in UI components and pages (c0acb49)
- fix: validate backend port and frontend setup (25e5647)

### Chores

- chore: update Aiven CA cert after service rotation (63d0527)
- chore: exclude protected branches from changelog bot pushes (6fe9e6a)
- chore: show date only in changelog (fa81fde)
- chore: format development changelog (d79c6c6)

### Other Changes

- Merge pull request #7 from FR4NC31/feat/google-auth (cab4fd1)
- docs(auth): document account-linking policy (db53a46)
- ﻿feat(auth): wire Google sign-in via Better Auth (2b5bd5b)
- Merge pull request #6 from FR4NC31/feat/implement-features-and-connection (418335b)
- ci: build backend/.env from repo secrets in e2e workflow (859d182)
- Merge pull request #5 from FR4NC31/feature/auth-and-route-guards (bc8dede)
- Merge pull request #4 from FR4NC31/feat/setup-playright-with-documentation (7ffa23a)
- test: add Playwright QA suite, CI workflow, and testing docs (8284443)
- Merge pull request #3 from FR4NC31/feat/setup-login-method (11aff5c)
- Setup frontend and backend dependencies (c2599df)
- Add initial test description for Discord (1112f7d)
- Initial commit (3246887)
