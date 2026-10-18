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
| **Drizzle ORM**  | `service`, `booking`                            | `drizzle/`                |

The split is deliberate: `better-auth migrate` can regenerate its own folder,
so application tables must never live there or they would be clobbered.

```bash
cd backend
npm run db:generate   # src/schema.ts -> a new drizzle/*.sql file (offline)
npm run migrate       # apply pending migrations
npm run seed          # (re)load the sample service catalog
npm run migrate -- --status   # what has been applied
```

- `npm run db:generate` only writes SQL — it never connects to a database, so it
  cannot mutate anything by accident.
- `npm run migrate` applies through the shared pool, which carries the Aiven CA
  and `sslmode` handling. That is why applying is **not** `drizzle-kit migrate`.
- `npm run seed` upserts on `service.code`, so it is safe to re-run: it inserts
  the eight catalog rows on a fresh database and refreshes them on an existing
  one without touching `booking`.

**Fresh database:** run `better-auth migrate` *before* `npm run migrate`.
`booking.userId` references Better Auth's `user` table, so the FK has nothing to
point at until that table exists. `drizzle/0000_*.sql` has the `CREATE TABLE
"user"` statement deliberately removed for the same reason.

**Never run `drizzle-kit push` against this database.** It reconciles the whole
database against `src/schema.ts` and would drop the Better Auth tables it cannot
see. Add a column to `src/schema.ts`, generate, and apply instead.
