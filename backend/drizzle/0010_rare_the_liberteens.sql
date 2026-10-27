ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "discount_percent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "amount_due_php" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "membership_tier" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "membership_expires_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_membership_tier_check') THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_membership_tier_check" CHECK ("membership_tier" in ('free', 'subscriber', 'vip'));
  END IF;
END $$;