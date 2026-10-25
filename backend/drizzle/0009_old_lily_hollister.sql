CREATE TABLE "booking_blockout" (
	"id" text PRIMARY KEY NOT NULL,
	"bookingDate" date NOT NULL,
	"reason" text,
	"note" text,
	"createdBy" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_blockout_reason_check" CHECK ("reason" is null or "reason" in ('unavailable', 'maintenance', 'other'))
);
--> statement-breakpoint
ALTER TABLE "booking_blockout" ADD CONSTRAINT "booking_blockout_createdBy_user_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_blockout_day_unique_idx" ON "booking_blockout" USING btree ("bookingDate");