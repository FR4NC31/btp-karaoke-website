ALTER TABLE "booking" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "guestName" text;--> statement-breakpoint
-- NOTE (hand-edited): IF NOT EXISTS is deliberate. On an existing database
-- this is the statement that adds the column; on a FRESH one, `bun x auth
-- migrate` already creates it, because `role` is declared in
-- src/auth.ts (user.additionalFields) — without the guard this ALTER would
-- abort the fresh-database path documented in backend/README.md.
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_owner_check" CHECK ("userId" is not null or "guestName" is not null);
