ALTER TABLE "media_item" ADD COLUMN "artist" text;--> statement-breakpoint
-- Backfill: video rows carried the performer in `subtitle` (the editor's
-- "Artist" box) — the dedicated column takes over, so the old copy follows.
UPDATE "media_item" SET "artist" = "subtitle", "subtitle" = NULL WHERE "section" = 'video' AND "subtitle" IS NOT NULL;
