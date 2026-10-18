import { sql } from 'drizzle-orm'
import { db, pool } from '../src/db.ts'
import { service } from '../src/schema.ts'

/**
 * Sample service catalog for the booking prototype.
 *
 * The eight rows mirror the service wings rendered on /services, priced with
 * placeholders that sit inside the "24–97K PHP" band the marketing rate strip
 * advertises. Paid rates replace these whenever finance signs off.
 *
 *   cd backend && npm run seed
 *
 * Idempotent AND refreshing: the upsert targets `code`, so re-running updates
 * the copy and price of an existing service instead of duplicating it. Delete
 * a row by hand and it comes back; set is_active = false to retire one without
 * losing it (retired services keep their bookings — the FK is ON DELETE
 * restrict).
 *
 * Safe to run against a database that already has bookings: existing rows keep
 * their ids, and nothing here touches the booking table.
 */

const catalog = [
  {
    id: 'svc_tracking_01',
    code: 'STUDIO-TRACKING',
    name: 'Music Studio Recording (Vocal and Instrumental)',
    wing: 'create',
    description:
      'Professional recording sessions for vocals and instruments in a treated studio environment, with engineer assistance, microphone selection and signal chain configuration.',
    unit: 'Hourly / Half-Day Block',
    pricePhp: '24000.00',
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
    unit: 'Per Composition',
    pricePhp: '35000.00',
    durationDays: 10,
    sortOrder: 2,
  },
  {
    id: 'svc_mastering_03',
    code: 'CUT-MASTERING',
    name: 'Music Cutting and Mastering',
    wing: 'create',
    description:
      'Post-production including vocal tuning, timing correction, noise reduction, mixing and final mastering prepared for streaming platforms.',
    unit: 'Per Track / Stem Pack',
    pricePhp: '28500.00',
    durationDays: 5,
    sortOrder: 3,
  },
  {
    id: 'svc_radio_04',
    code: 'RADIO-ONLINE',
    name: 'Studio Radio Online (Hour / Slot)',
    wing: 'promote',
    description:
      'A dedicated hour or time slot on the online station to perform live, premiere a song, host a listening session or conduct an interview. Recording of the broadcast included.',
    unit: 'Per 60-Minute Broadcast',
    pricePhp: '42000.00',
    durationDays: 1,
    sortOrder: 4,
  },
  {
    id: 'svc_karaoke_mv_05',
    code: 'KARAOKE-MV',
    name: 'Karaoke Music Video Making / Editing',
    wing: 'promote',
    description:
      'Karaoke music video production from your original track, including lyric synchronization, visual design and video editing for YouTube, videoke machines and social media.',
    unit: 'Per Karaoke Title',
    pricePhp: '55000.00',
    durationDays: 5,
    sortOrder: 5,
  },
  {
    id: 'svc_keys_vocal_06',
    code: 'KEYS-VOCAL-TUTORIAL',
    name: 'Keyboard and Vocal Tutorial',
    wing: 'learn',
    description:
      'One-on-one or group lessons in keyboard playing and vocal technique, from beginner to intermediate, focused on practical studio-ready application.',
    unit: 'Modular 4 or 8 Session Bundles',
    pricePhp: '12000.00',
    durationDays: 28,
    sortOrder: 6,
  },
  {
    id: 'svc_filscap_portal_07',
    code: 'FILSCAP-PORTAL',
    name: 'Assisting Artists to Put Their Songs on the FILSCAP Portal Database',
    wing: 'protect',
    description:
      'Hands-on guidance registering original compositions with the FILSCAP online portal so works are documented and eligible for royalty collection.',
    unit: 'Per Single / Album Catalog',
    pricePhp: '6500.00',
    durationDays: 4,
    sortOrder: 7,
  },
  {
    id: 'svc_filscap_member_08',
    code: 'FILSCAP-MEMBERSHIP',
    name: 'Assisting Artists to Become a Member of FILSCAP',
    wing: 'protect',
    description:
      'End-to-end support through the FILSCAP membership application: requirements checklist, dossier compiling, submission guidance and royalty orientation.',
    unit: 'Full Liaison Assistance',
    pricePhp: '9000.00',
    durationDays: 30,
    sortOrder: 8,
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
} catch (err) {
  console.error('\nSeed failed:', err instanceof Error ? err.message : err)
  process.exitCode = 1
} finally {
  await pool.end()
}
