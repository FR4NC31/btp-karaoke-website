import { inArray, sql } from 'drizzle-orm'
import { db, pool } from '../src/db/client.ts'
import { mediaItem, service } from '../src/db/schema.ts'

/**
 * Service catalog for the booking desk and the /services page.
 *
 * Rates mirror the published BTP service sheet, including the "starting at"
 * markers on per-song, per-video, per-day and per-event work. Amounts are exact
 * PHP values; a service whose price can vary with scope is seeded at its
 * published starting rate.
 *
 *   cd backend && npm run seed
 *
 * Idempotent AND refreshing: the upsert targets `code`, so re-running updates
 * the copy and price of an existing service instead of duplicating it. Delete
 * a row by hand and it comes back; set is_active = false to retire one without
 * losing it (retired services keep their bookings — the FK is ON DELETE
 * restrict). Codes replaced by the current service sheet are retired in the
 * same run, so the desk never shows the old catalog alongside the new one.
 *
 * It also seeds the ONE media row that maps to a real local file: the karaoke
 * video master this repo ships (frontend/src/assets/video_local/the-reason.mp4).
 * The rest of the media hub catalog is administered from /admin/media —
 * deliberately no mockup rows. Re-running refreshes that row's copy and its
 * `section` (it is definitionally the video master) but never touches isActive
 * or sortOrder: admin curation wins.
 *
 * Safe to run against a database that already has bookings: existing rows keep
 * their ids, and nothing here touches the booking table.
 */

const catalog = [
  {
    id: 'svc_tracking_01',
    code: 'STUDIO-TRACKING',
    name: 'Music and Vocal Recording',
    wing: 'create',
    description:
      'Professional recording sessions for vocals and instruments in a treated studio environment, with engineer assistance, microphone selection and signal chain configuration.',
    unit: 'Per Hour',
    pricePhp: '500.00',
    durationDays: 1,
    sortOrder: 1,
  },
  {
    id: 'svc_arranging_02',
    code: 'SONG-ARRANGING',
    name: 'Musical Arranging',
    wing: 'create',
    description:
      'Custom arrangement for original compositions: instrumentation planning, chord voicing, melodic counterpoint and rhythm section mapping.',
    unit: 'Per Song (Starting Rate)',
    pricePhp: '2500.00',
    durationDays: 10,
    sortOrder: 3,
  },
  {
    id: 'svc_mastering_03',
    code: 'CUT-MASTERING',
    name: 'Music, Vocal Audio Editing and Mastering',
    wing: 'create',
    description:
      'Post-production including vocal tuning, timing correction, noise reduction, mixing and final mastering prepared for streaming platforms.',
    unit: 'Per Hour',
    pricePhp: '1200.00',
    durationDays: 1,
    sortOrder: 2,
  },
  {
    id: 'svc_karaoke_mv_05',
    code: 'KARAOKE-MV',
    name: 'Karaoke Music Video Production',
    wing: 'create',
    description:
      'Karaoke music video production from your original track, including lyric synchronization, visual design and video editing for YouTube, videoke machines and social media.',
    unit: 'Per Video (Starting Rate)',
    pricePhp: '1000.00',
    durationDays: 5,
    sortOrder: 4,
  },
  {
    id: 'svc_vocal_coaching_09',
    code: 'VOCAL-COACHING',
    name: 'Vocal Coaching',
    wing: 'learn',
    description:
      'One-on-one vocal technique, breath control, pitch accuracy and performance coaching for singers and recording artists.',
    unit: 'Per Hour',
    pricePhp: '500.00',
    durationDays: 1,
    sortOrder: 5,
  },
  {
    id: 'svc_keyboard_tutorial_10',
    code: 'KEYBOARD-TUTORIAL',
    name: 'Keyboard Tutorials',
    wing: 'learn',
    description:
      'Keyboard lessons from beginner to intermediate, focused on practical song application and studio-ready musicianship.',
    unit: 'Per Hour',
    pricePhp: '500.00',
    durationDays: 1,
    sortOrder: 6,
  },
  {
    id: 'svc_vocalist_hire_11',
    code: 'VOCALIST-HIRE',
    name: 'Vocalist for Hire (Recording Sessions)',
    wing: 'promote',
    description:
      'Session vocalist services for recording projects, matched to the style and range of the song.',
    unit: 'Per Song (Starting Rate)',
    pricePhp: '3000.00',
    durationDays: 1,
    sortOrder: 7,
  },
  {
    id: 'svc_artist_booking_12',
    code: 'ARTIST-BOOKING',
    name: 'Artist Booking, Guest Appearances & Concerts',
    wing: 'promote',
    description:
      'Artist booking and guest appearances for events and concerts. Final rate depends on the event, location, duration and technical requirements.',
    unit: 'Per Day (Starting Rate)',
    pricePhp: '5000.00',
    durationDays: 1,
    sortOrder: 8,
  },
  {
    id: 'svc_sound_system_13',
    code: 'SOUND-SYSTEM',
    name: 'Sound System Rental',
    wing: 'promote',
    description:
      'Sound system rental for events. Final rate depends on the venue, location, duration and technical requirements.',
    unit: 'Per Event (Starting Rate)',
    pricePhp: '2500.00',
    durationDays: 1,
    sortOrder: 9,
  },
  {
    id: 'svc_filscap_portal_07',
    code: 'FILSCAP-PORTAL',
    name: 'FILSCAP Membership & Musical Works Assistance',
    wing: 'protect',
    description:
      'Guidance on FILSCAP membership applications, musical work declarations, document preparation and portal/database submission support.',
    unit: 'Per Application (Starting Rate)',
    pricePhp: '2500.00',
    durationDays: 4,
    sortOrder: 10,
  },
]

/**
 * Catalog codes replaced by the current service sheet. Retired, not deleted:
 * their bookings still reference them. FILSCAP-PORTAL is reused for the
 * combined membership + works assistance service.
 */
const retiredCodes = ['RADIO-ONLINE', 'KEYS-VOCAL-TUTORIAL', 'FILSCAP-MEMBERSHIP']

/**
 * The one media row backed by an actual file in this repo. Everything the hub
 * shows beyond this was added through /admin/media.
 */
const mediaCatalog = [
  {
    id: 'med_reason_01',
    section: 'video',
    title: 'The Reason',
    artist: 'Hoobastank',
    tag: 'KTV',
    duration: '3:54',
    sortOrder: 1,
  },
]

try {
  // One statement, upsert on the stable `code`: inserts the eight on a fresh
  // database, refreshes them on an existing one.
  await db
    .insert(service)
    .values(catalog)
    .onConflictDoUpdate({
      target: service.code,
      set: {
        // `excluded` is the row Postgres tried to insert — i.e. the new copy.
        name: sql`excluded."name"`,
        wing: sql`excluded."wing"`,
        description: sql`excluded."description"`,
        unit: sql`excluded."unit"`,
        pricePhp: sql`excluded."price_php"`,
        durationDays: sql`excluded."duration_days"`,
        sortOrder: sql`excluded."sort_order"`,
        updatedAt: new Date(),
      },
    })

  const rows = await db.select({ code: service.code, price: service.pricePhp }).from(service)
  console.log(`Seeded ${rows.length} service(s):`)
  for (const row of rows) {
    console.log(`  ${row.code.padEnd(24)} ${row.price} PHP`)
  }

  await db
    .update(service)
    .set({ isActive: false, updatedAt: new Date() })
    .where(inArray(service.code, retiredCodes))

  const retired = await db
    .select({ code: service.code })
    .from(service)
    .where(inArray(service.code, retiredCodes))
  console.log(`Retired ${retired.length} replaced service(s): ${retired.map((row) => row.code).join(', ')}`)

  // Upsert on the stable id. Only the copy fields refresh: `section`,
  // `isActive` and `sortOrder` are admin curation once the row exists. Forcing
  // `section` back to video would leave a music row (which may now carry an
  // admin-attached MP3) claiming to be a video master.
  await db
    .insert(mediaItem)
    .values(mediaCatalog)
    .onConflictDoUpdate({
      target: mediaItem.id,
      set: {
        title: sql`excluded."title"`,
        subtitle: sql`excluded."subtitle"`,
        artist: sql`excluded."artist"`,
        tag: sql`excluded."tag"`,
        duration: sql`excluded."duration"`,
        updatedAt: new Date(),
      },
    })

  const mediaRows = await db
    .select({ section: mediaItem.section, title: mediaItem.title, isActive: mediaItem.isActive })
    .from(mediaItem)
  console.log(`Media catalog: ${mediaRows.length} row(s)`)
  for (const row of mediaRows) {
    console.log(`  [${row.section}] ${row.title}${row.isActive ? '' : ' (hidden)'}`)
  }
} catch (err) {
  console.error('\nSeed failed:', err instanceof Error ? err.message : err)
  process.exitCode = 1
} finally {
  await pool.end()
}

