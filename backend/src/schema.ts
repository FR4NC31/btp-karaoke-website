import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/**
 * Drizzle schema — the tables THIS APPLICATION owns.
 *
 * Ownership split, so nobody clobbers anyone:
 *   - Better Auth owns "user" / "session" / "account" / "verification". Those
 *     are created and re-created by `bun x auth@latest migrate` from
 *     backend/better-auth_migrations/, NOT from here.
 *   - Drizzle owns "service", "booking" and "media_item" (backend/drizzle/
 *     migrations).
 *
 * `user` is declared below only so `booking.userId` can carry a real database
 * foreign key. Its CREATE is deliberately stripped out of the generated
 * migration — see backend/drizzle/0000_*.sql. On a fresh database, run
 * `bun x auth@latest migrate` BEFORE `npm run migrate`, or the booking FK has
 * nothing to point at.
 *
 * Never run `drizzle-kit push` against this database: it reconciles the whole
 * database against this file and would happily drop the Better Auth tables it
 * cannot see.
 */

export const BOOKING_STATUSES = ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

/**
 * Reference target for booking.userId — NOT owned by Drizzle.
 * Columns mirror better-auth_migrations/2026-10-08T10-52-54.722Z.sql plus the
 * additionalFields in src/auth.ts, so the snapshot stays honest.
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  contactNum: text('contact_num').notNull(),
  /**
   * Authorization flag: 'user' (default) or 'admin'. Mirrored here so the
   * column can ride the normal Drizzle migration path (drizzle/0001_*.sql);
   * Better Auth reads it through `user.additionalFields.role` in src/auth.ts,
   * which is also what keeps it out of client input — nobody can set their own
   * role through sign-up or /api/auth/update-user. Promote an account with
   * `npm run promote-admin -- email@example.com` (scripts/promote-admin.ts).
   */
  role: text('role').notNull().default('user'),
})

/**
 * Bookable catalog. Eight rows mirror the service wings on /services.
 * A service never references a user — the booking row is that join.
 */
export const service = pgTable('service', {
  id: text('id').primaryKey(),
  /** Stable human-readable key, e.g. "STUDIO-TRACKING". Seed upserts on this. */
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  /** Service wing: create | promote | learn | protect */
  wing: text('wing').notNull(),
  description: text('description').notNull(),
  /** Billing unit as shown on /services, e.g. "Per Composition". */
  unit: text('unit').notNull(),
  /**
   * Sample PHP price. numeric keeps money exact; node-postgres hands numerics
   * back as strings, so the API layer converts once (src/bookings.ts).
   */
  pricePhp: numeric('price_php', { precision: 12, scale: 2 }).notNull(),
  /** Turnaround metadata for the future time-block work — not a day claim. */
  durationDays: integer('duration_days').notNull().default(1),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * The media hub catalog behind /studio: one row per card, across three
 * sections. Admin-managed from /admin/media; the public hub reads the active
 * rows only. Section-specific display columns (duration/plays, tempo/key,
 * freq/listeners) are nullable — a row fills only its section's pair.
 */
export const mediaItem = pgTable(
  'media_item',
  {
    id: text('id').primaryKey(),
    /** Hub section: video | music | radio. */
    section: text('section').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    /**
     * Performer — read from the file's own artist tag or typed by the admin.
     * Video and music cards show it under the title; radio rows leave it null
     * (their subtitle carries the genre).
     */
    artist: text('artist'),
    /** Chip label on the card ("KTV", "MIX", "On Air"…). */
    tag: text('tag'),
    /**
     * Video/music: runtime as shown, e.g. "3:54". The editor reads it off
     * the uploaded file (MP4 or MP3) — it is never typed by hand.
     */
    duration: text('duration'),
    /** Video: display-only play count. */
    plays: integer('plays'),
    /** Music: tempo as shown, e.g. "118 BPM". */
    tempo: text('tempo'),
    /** Music: musical key as shown, e.g. "Fmaj". */
    songKey: text('songKey'),
    /** Radio: dial position as shown, e.g. "FM 91.5". */
    freq: text('freq'),
    /** Radio: display-only listener count. */
    listeners: integer('listeners'),
    /**
     * The uploaded MP4/MP3 this row actually plays, as returned by the media
     * uploader (`/api/uploads/media/<uuid>.<ext>`). NULL means video rows fall
     * back to the bundled local master and music rows have no audio yet.
     */
    sourceUrl: text('sourceUrl'),
    /** Original filename of the upload, shown in the console editor only. */
    sourceName: text('sourceName'),
    /**
     * Album / collection, read from the file's tags or typed by the admin.
     * Music cards show it in the meta strip.
     */
    album: text('album'),
    /**
     * Cover art / thumbnail behind the hub card, the console stage poster
     * and the player bar — an uploaded image (`/api/uploads/media/<uuid>.<ext>`
     * returned by the media uploader). NULL = the default art.
     */
    coverUrl: text('coverUrl'),
    /** Original filename of the cover upload, console display only. */
    coverName: text('coverName'),
    /** Display order within the section; ties fall back to title. */
    sortOrder: integer('sortOrder').notNull().default(0),
    /** false hides the row from /api/media without deleting it. */
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('media_item_section_check', sql`"section" in ('video', 'music', 'radio')`),
  ],
)

/**
 * One service, one customer, one day. The customer is either a registered
 * user (`userId`) or, for reservations the admin takes by phone or walk-in,
 * a free-text `guestName`. Day-only: there is no time slot or time block
 * column yet — that arrives as its own migration.
 */
export const booking = pgTable(
  'booking',
  {
    id: text('id').primaryKey(),
    /** Customer-facing code ("BTP-7K2F9A"); safe to read out over the phone. */
    referenceCode: text('referenceCode').notNull().unique(),
    /**
     * The customer, when the booking belongs to a registered account.
     * NULL for a reservation the admin took for a walk-in / phone caller —
     * those carry `guestName` instead. The check constraint below enforces
     * that every booking has at least one of the two.
     */
    userId: text('userId').references(() => user.id, { onDelete: 'cascade' }),
    /** Guest (non-account) customer name, admin-created reservations only. */
    guestName: text('guestName'),
    // onDelete restrict: a service with bookings cannot vanish from under
    // them — deactivate it with isActive = false instead.
    serviceId: text('serviceId')
      .notNull()
      .references(() => service.id, { onDelete: 'restrict' }),
    /** Whole day, ISO `YYYY-MM-DD`. No time component yet. */
    bookingDate: date('bookingDate', { mode: 'string' }).notNull(),
    /**
     * pending is what an admin later acts on: confirmed | rejected.
     * cancelled is the customer withdrawing; completed follows the session.
     */
    status: text('status').$type<BookingStatus>().notNull().default('pending'),
    notes: text('notes'),
    createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('booking_userId_idx').on(t.userId),
    index('booking_serviceId_idx').on(t.serviceId),
    index('booking_bookingDate_idx').on(t.bookingDate),
    check(
      'booking_status_check',
      sql`"status" in ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')`,
    ),
    // Every booking needs an owner: a registered user or a guest name.
    check('booking_owner_check', sql`"userId" is not null or "guestName" is not null`),
    // One live booking per user, per service, per day. Partial, so a cancelled
    // or rejected row drops out and the customer can withdraw and rebook.
    // This is what the API turns into a 409. Guest rows (userId NULL) do not
    // participate — Postgres unique indexes ignore NULLs — so the admin's own
    // judgement is the duplicate guard for walk-ins.
    uniqueIndex('booking_active_unique_idx')
      .on(t.userId, t.serviceId, t.bookingDate)
      .where(sql`"status" in ('pending', 'confirmed')`),
  ],
)
