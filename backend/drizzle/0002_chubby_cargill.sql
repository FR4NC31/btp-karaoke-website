CREATE TABLE "media_item" (
	"id" text PRIMARY KEY NOT NULL,
	"section" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"tag" text,
	"duration" text,
	"plays" integer,
	"tempo" text,
	"songKey" text,
	"freq" text,
	"listeners" integer,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_item_section_check" CHECK ("section" in ('video', 'music', 'radio'))
);
