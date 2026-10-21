# Better Auth performance and upgrades

This guide covers two related maintenance changes in `backend/src/auth.ts`:

1. enabling Better Auth's native database joins for related reads, and
2. keeping `better-auth` on the latest reviewed patch release.

The two changes are independent. Either one can be reverted without the other.

## 1. Native database joins

### What changed

`backend/src/auth.ts` now enables joins alongside the existing IP-address
settings:

```ts
advanced: {
  database: {
    joins: true,
  },
  ipAddress: {
    ipAddressHeaders,
    ...(trustedProxies.length > 0 ? { trustedProxies } : {}),
  },
},
```

No database migration is required. The flag changes how Better Auth reads
related rows; it does not change the auth tables or the API response shape.

### Why the Drizzle relations instruction does not apply here

The generic Better Auth documentation says Drizzle users must define
`relations()` and pass the schema to `drizzleAdapter`. That is correct for a
Drizzle adapter, but this backend does not use one for auth:

- `backend/src/auth.ts` passes `database: pool`, a raw `pg.Pool`.
- Better Auth therefore uses its built-in Kysely adapter. The installed
  `kysely` PostgreSQL dialect supports joins out of the box.
- `backend/src/db.ts` creates a Drizzle instance for the application's
  `service`, `booking`, and `media_item` tables. That instance is not passed to
  Better Auth.
- `backend/src/schema.ts` contains a `user` table only so `booking.userId` can
  have a real foreign key. Better Auth owns `user`, `session`, `account`, and
  `verification` and manages them through `backend/better-auth_migrations/`.

Adding Drizzle `relations()` for the auth tables would not affect Better Auth
while the Kysely adapter is in use. It would only matter if the project moved
to `drizzleAdapter`, which is a separate migration with its own schema and
migration risks. Do not mix that migration into a performance-only change.

### Expected effect

Better Auth supports joins on over 50 endpoints. Endpoints such as
`/get-session` can fetch the session and its related user/account data in one
round trip instead of issuing one query per relation. Better Auth documents
upwards of 2x-3x improvement depending on database latency.

The gain is largest when the database is remote, as it is with Aiven. On a
local database with sub-millisecond latency the difference may be small. The
change does not reduce the number of queries made by application code outside
Better Auth.

### Best practices

- **Measure before and after.** Capture p50/p95 latency and query counts for
  `/api/auth/get-session` under a realistic session. Do not infer a production
  win from a local run.
- **Keep the change isolated.** Enable joins separately from adapter or schema
  changes so a regression has an obvious cause.
- **Watch the query plan.** Use `EXPLAIN (ANALYZE, BUFFERS)` on the session
  read if latency regresses. Confirm the join uses the auth tables' primary
  keys and foreign-key indexes.
- **Keep Better Auth migrations current.** Joins assume the relations that the
  auth schema already declares. Run the auth migration command as part of
  deployment, before application migrations, as described in
  `backend/src/schema.ts`.
- **Exercise a real session.** An anonymous `get-session` returns quickly
  without loading relations. Test sign-in followed by a session read or page
  reload.
- **Leave the flag on by default.** If it causes a problem, revert it
  explicitly rather than adding an environment toggle unless there is a
  measured need for per-environment behavior.

### Risks and limitations

- **Adapter support.** Joins are a no-op or fall back to separate queries for
  adapters that do not support them. The current Kysely/PostgreSQL path does
  support them, but a future adapter change requires re-checking this flag.
- **Regression in related-read behavior.** A malformed relation or a schema
  drift can turn a working session read into an error. The auth schema
  validation and session E2E coverage are the safety net.
- **Larger individual queries.** One join can be slower than several small
  indexed lookups for unusual data shapes. Monitor latency rather than assuming
  fewer round trips always means less database work.
- **No application-query benefit.** Drizzle booking/media queries are outside
  this setting and can still have N+1 patterns of their own.
- **Not a substitute for caching.** Joins reduce round trips, not the cost of
  every auth request. Session caching or a shared rate-limit store remain
  separate scaling decisions.

### Rollback

Remove the `database.joins` block from `advanced` in
`backend/src/auth.ts`, redeploy, and verify sign-in plus session reload. No
database rollback is needed because no schema was changed.

### Verification checklist

- [ ] `backend/src/auth.ts` contains `advanced.database.joins: true`.
- [ ] `npm run typecheck` passes in `backend/`.
- [ ] `npm test` passes in `backend/`.
- [ ] Sign-in and session reload pass (AUTH-001 and AUTH-009).
- [ ] An authenticated `GET /api/auth/get-session` returns the expected user.
- [ ] p95 latency and query count are recorded for the before/after comparison.
- [ ] No new auth errors appear in the backend logs.

## 2. Better Auth 1.7.12 upgrade

### What changed

- `backend/package.json` now declares `better-auth: ^1.7.12`.
- `frontend/package.json` now declares `better-auth: ^1.7.12` as well, so the
  React client and the server use the same patch release.
- `backend/package-lock.json`, `backend/bun.lock`, and
  `frontend/package-lock.json` resolve `better-auth@1.7.12` and the matching
  `@better-auth/*` packages.
- `better-auth` now resolves `better-call@1.4.4`; the `@better-auth/infra`
  package keeps its own `better-call@1.4.2` dependency.

CI installs both packages with `npm ci`, so the two `package-lock.json` files
are authoritative for GitHub Actions. `backend/bun.lock` is kept in sync for
local Bun workflows. If multiple lockfiles are present, do not run the upgrade
CLI blindly: confirm which package manager it selects and update the others
too.

### Relevant 1.7.12 fixes

The patch is small and does not require an auth schema migration. The fixes
most relevant to this app are:

- `auth.api.getSession()` keeps the original database error as `error.cause`
  when the session lookup fails, which improves server-side diagnostics.
- OAuth callbacks completed through the OAuth proxy now run the same issuer and
  ID-token nonce checks as the standard callback.
- `mapProfileToUser` now typechecks under `exactOptionalPropertyTypes` when it
  returns `undefined` for `name`, `email`, or `image`. This app maps Google
  profile fields but does not pass those three fields through.
- ID token sign-in now rejects a provider with no `clientId`, because the
  audience cannot be checked. This app configures a Google `clientId`, so the
  release's action-required note does not apply.

The JWT-plugin fix also ships in 1.7.12, but this app does not use the JWT
plugin.

### Upgrade procedure

1. Create a branch and confirm the current full E2E result is green.
2. Update both the server and client packages:

   ```bash
   cd backend
   npm install better-auth@1.7.12
   cd ../frontend
   npm install better-auth@1.7.12
   ```

   The Better Auth CLI equivalent is `npx auth@latest upgrade`; it upgrades to
   the CLI's version. Use it only when you have reviewed that version's release
   notes and know which lockfile it will update.
3. Sync the backend Bun lockfile if Bun is part of the local workflow:

   ```bash
   cd ../backend
   bun install
   ```

4. Reinstall from the CI lockfiles and review the resolved tree in both
   packages:

   ```bash
   cd ../backend
   npm ci
   npm ls better-auth @better-auth/kysely-adapter
   cd ../frontend
   npm ci
   npm ls better-auth
   ```

5. Run the backend checks:

   ```bash
   cd ../backend
   npm run typecheck
   npm test
   ```

6. Run the frontend checks:

   ```bash
   cd ../frontend
   npm run lint
   npm run build
   ```

7. Run the focused auth E2E suite, then the full suite with the same database
   and environment used for the release.
8. Open the PR and require the trusted full E2E job to pass before merging.

### Risks

- **Patch-level behavior changes.** Even a patch release can tighten OAuth
  validation. The Google hand-off is automated (AUTH-008), but the consent
  callback needs a real Google account. Perform one manual Google sign-in after
  deploying to catch issuer, nonce, or redirect changes that the stubbed test
  cannot cover.
- **Mixed client/server versions.** Upgrade `backend` and `frontend` in the
  same change. Leaving the React client on an older patch while the server
  moves forward is an avoidable compatibility risk, especially around session
  and OAuth response handling.
- **Two dependency trees.** `@better-auth/infra` declares a peer on
  `@better-auth/core` and npm may keep a separate older peer copy alongside
  `better-auth`'s exact copy. That was already true before this upgrade and is
  allowed by the peer range. If the Dash plugin starts behaving oddly, inspect
  `npm ls @better-auth/core` before changing auth logic.
- **Lockfile drift.** Updating only `package.json` or only one lockfile can
  produce a different tree in CI than locally. Always finish with `npm ci`.
- **Dev-only audit findings.** The backend audit currently reports moderate
  findings through `drizzle-kit` -> `esbuild`. They are dev-tooling
  dependencies, predate this upgrade, and are not addressed by changing Better
  Auth. Do not run `npm audit fix --force` as part of an auth upgrade.
- **Rollback is version-only.** Revert the dependency and lockfile changes,
  run `npm ci`, and redeploy. Keep the joins revert separate if both changes
  need to be backed out.

## References

- [Better Auth database joins](https://better-auth.com/docs/concepts/database#joins)
- [Better Auth PostgreSQL adapter: joins](https://better-auth.com/docs/adapters/postgresql#joins)
- [Better Auth Drizzle adapter: joins](https://better-auth.com/docs/adapters/drizzle#joins)
- [Better Auth 1.7.12 release](https://github.com/better-auth/better-auth/releases/tag/v1.7.12)
- [Better Auth documentation index](https://better-auth.com/docs/llms.txt)
