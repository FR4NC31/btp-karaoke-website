ALTER TABLE "booking" ADD COLUMN "discount_percent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "amount_due_php" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "membership_tier" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "membership_expires_at" timestamp with time zone;