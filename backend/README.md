# backend

To install dependencies:

```bash
bun install
```

To run with Node.js (v22.18+):

```bash
node serve.ts
```

For development with automatic restarts:

```bash
node --watch serve.ts
```

Bun is used only to install dependencies.

`.env` is required — `node --env-file=.env serve.ts` (what `npm run dev` and
`npm start` use) reads it. Copy `.env.example` and fill in the values.

## Database & migrations

PostgreSQL on Aiven. Two libraries share one connection pool (`src/db.ts`):

| Owner            | Tables                                          | Migrations live in        |
| ---------------- | ----------------------------------------------- | ------------------------- |
| **Better Auth**  | `user`, `session`, `account`, `verification`     | `better-auth_migrations/` |
| **Drizzle ORM**  | `service`, `booking`, `media_item`              | `drizzle/`                |

The split is deliberate: `bun x auth@latest migrate` can regenerate its own folder,
so application tables must never live there or they would be clobbered.

```bash
cd backend
npm run db:generate   # src/schema.ts -> a new drizzle/*.sql file (offline)
npm run migrate       # apply pending migrations
npm run seed          # (re)load the service catalog + the one real media row
npm run migrate -- --status   # what has been applied
```

- `npm run db:generate` only writes SQL — it never connects to a database, so it
  cannot mutate anything by accident.
- `npm run migrate` applies through the shared pool, which carries the Aiven CA
  and `sslmode` handling. That is why applying is **not** `drizzle-kit migrate`.
- `npm run seed` upserts on `service.code`, so it is safe to re-run: it inserts
  the eight catalog rows on a fresh database and refreshes them on an existing
  one without touching `booking`. It also upserts the single media row backed by
  a real file (`med_reason_01` — the karaoke master the frontend ships); only
  its copy refreshes, so admin visibility and ordering survive re-runs. Every
  other `media_item` row is managed from `/admin/media`.

**Fresh database:** run `bun x auth@latest migrate` *before* `npm run migrate`.
`booking.userId` references Better Auth's `user` table, so the FK has nothing to
point at until that table exists. `drizzle/0000_*.sql` has the `CREATE TABLE
"user"` statement deliberately removed for the same reason.

`user.role` (the admin flag) is the one deliberate exception to the ownership
table above: the column is declared in `src/schema.ts` and added by
`drizzle/0001_*.sql`, while Better Auth reads it through
`user.additionalFields.role` in `src/auth.ts` — that is what makes it
unsettable from the client. The ALTER is `IF NOT EXISTS` so the fresh-database
order above still works (Better Auth creates the column first). Promote and
revoke admins with:

```bash
npm run promote-admin -- someone@example.com          # grant
npm run promote-admin -- someone@example.com --revoke # revoke
npm run promote-admin -- --list                       # who is an admin?
```

**Never run `drizzle-kit push` against this database.** It reconciles the whole
database against `src/schema.ts` and would drop the Better Auth tables it cannot
see. Add a column to `src/schema.ts`, generate, and apply instead.
