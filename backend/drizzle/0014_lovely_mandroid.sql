ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "contact_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone_otp" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone_otp_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email_otp" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email_otp_expires_at" timestamp with time zone;
