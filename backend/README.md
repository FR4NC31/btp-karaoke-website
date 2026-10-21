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

For a disposable test database, the checked-in Better Auth SQL can be applied
without the CLI: `E2E_DB_SETUP=1 npm run db:auth-migrate`. The PR E2E workflow
uses that command, then `npm run migrate`, `npm run seed`, and
`npm run seed:e2e` (which creates the shared `qa@example.com` Playwright user).
`db:auth-migrate` and `seed:e2e` require both `E2E_DB_SETUP=1` and a localhost
`DATABASE_URL`; `migrate` and `seed` remain normal commands that follow
`DATABASE_URL` wherever it points.

`user.role` (the admin flag) and the profile location columns (`province`,
`city_municipality`, `barangay`) are the deliberate exceptions to the ownership
table above. All four are declared in `src/schema.ts`; `role` is added by
`drizzle/0001_*.sql` and location by `drizzle/0007_*.sql`, while Better Auth
reads them through `user.additionalFields` in `src/auth.ts`. That is what makes
`role` unsettable from the client (`input: false`), and what lets the
`databaseHooks.user.update.before` guard reject partial or malformed location
writes (`src/location.ts`). The ALTERs are `IF NOT EXISTS` so the
fresh-database order above still works (Better Auth creates the columns
first). Promote and revoke admins with:

```bash
npm run promote-admin -- someone@example.com          # grant
npm run promote-admin -- someone@example.com --revoke # revoke
npm run promote-admin -- --list                       # who is an admin?
```

**Never run `drizzle-kit push` against this database.** It reconciles the whole
database against `src/schema.ts` and would drop the Better Auth tables it cannot
see. Add a column to `src/schema.ts`, generate, and apply instead.

## Uploaded media files

`/admin/media` can attach a real MP4/MP3 to a video song or a music track,
plus a cover image / thumbnail to any media row. The editor uploads files
through `POST /api/admin/media/upload` (admin-gated, raw body + `X-File-Name`
header, 200 MB default cap via `MEDIA_UPLOAD_MAX_MB`) and saves the returned
url on the row; files are served back at `GET /api/uploads/media/:name` with
byte-range support and a year-long immutable cache (names are content-unique),
so an uploaded video seeks in the console like the bundled master.

- Storage: local disk, `UPLOADS_DIR` (default `backend/uploads/`, gitignored).
  Files are named `<uuid>.<ext>`; the original filename is kept as the row's
  `sourceName` / `coverName` display copy only.
- Lifecycle: deleting a catalog row, or detaching/replacing its file or cover,
  deletes the stored upload (best-effort — a stray file never fails a request).
  The console asks for confirmation before a permanent delete.
- Accepted types: `.mp4`, `.mp3`, `.jpg`/`.jpeg`, `.png`, `.webp` — the
  content type must match the extension's family (`video/*` for mp4, `audio/*`
  for mp3, `image/*` for images). `sourceUrl` only takes media, `coverUrl` only
  images. Rows without a file play the bundled master (video) or nothing
  (music); rows without a cover show the default art.
- Metadata + covers are prepared in the browser, not the backend: the editor
  reads the file's own tags with `music-metadata` (ID3 on MP3, atoms on MP4)
  to pre-fill title/artist/album (blank boxes only) and reads the runtime off
  the picked file — video and audio alike, so there is no duration input —
  takes the embedded cover or grabs a video frame as the default thumbnail,
  and shrinks picked covers with `browser-image-compression` (WebP, ≤1000px)
  before upload.
- Schema: `media_item.sourceUrl` / `sourceName` (`drizzle/0003_*.sql`),
  `album` / `coverUrl` / `coverName` (`drizzle/0004_*.sql`), and `artist`
  (`drizzle/0005_*.sql` — video rows' old subtitle text was backfilled).
  Video rows fall back to `frontend/src/assets/video_local/the-reason.mp4`
  when no file is attached; radio stations carry no file (streams).
