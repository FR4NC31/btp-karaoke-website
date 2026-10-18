CREATE TABLE "booking" (
	"id" text PRIMARY KEY NOT NULL,
	"referenceCode" text NOT NULL,
	"userId" text NOT NULL,
	"serviceId" text NOT NULL,
	"bookingDate" date NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_referenceCode_unique" UNIQUE("referenceCode"),
	CONSTRAINT "booking_status_check" CHECK ("status" in ('pending', 'confirmed', 'rejected', 'cancelled', 'completed'))
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"wing" text NOT NULL,
	"description" text NOT NULL,
	"unit" text NOT NULL,
	"price_php" numeric(12, 2) NOT NULL,
	"duration_days" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_code_unique" UNIQUE("code")
);
--> statement-breakpoint
-- NOTE (hand-edited): drizzle-kit also emitted a CREATE TABLE "user" here,
-- because src/schema.ts declares `user` so booking.userId can carry a real
-- foreign key. Better Auth owns that table and creates it from
-- backend/better-auth_migrations/, so the CREATE was removed on purpose.
-- Consequence: on a fresh database run `better-auth migrate` BEFORE
-- `npm run migrate`. Do not re-run `drizzle-kit generate` over this file.
--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_serviceId_service_id_fk" FOREIGN KEY ("serviceId") REFERENCES "public"."service"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_userId_idx" ON "booking" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "booking_serviceId_idx" ON "booking" USING btree ("serviceId");--> statement-breakpoint
CREATE INDEX "booking_bookingDate_idx" ON "booking" USING btree ("bookingDate");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_active_unique_idx" ON "booking" USING btree ("userId","serviceId","bookingDate") WHERE "status" in ('pending', 'confirmed');