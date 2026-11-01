ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email_otp" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email_otp_expires_at" timestamp with time zone;
