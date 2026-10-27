CREATE TABLE "site_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "receipt_url" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "payment_deadline" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "booking_suspended_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "booking_failure_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_membership_tier_check') THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_membership_tier_check" CHECK ("membership_tier" in ('free', 'subscriber', 'vip'));
  END IF;
END $$;