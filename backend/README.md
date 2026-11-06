# Backend

## Database seeding

- `npm run seed:e2e` — seed the shared Playwright user (`qa@example.com`) into a
  disposable database. Requires `E2E_DB_SETUP=1` and a localhost `DATABASE_URL`.
- `npm run seed:qa-admin` — seed the QA admin account (`qa-admin@example.com`)
  into a disposable database. Requires `E2E_DB_SETUP=1`, a localhost
  `DATABASE_URL`, and `TEST_ADMIN_PASSWORD` in the environment. Role changes on
  a real database must go through `npm run promote-admin` instead.
