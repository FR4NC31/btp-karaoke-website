import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import {
  blockoutMessage,
  cancellationCountsAsFailure,
  isHourlyUnit,
  isTimeBasedUnit,
  SERVICE_WINGS,
  studioToday,
  validateBlockoutReason,
  validateBookingTime,
  validateServiceDescription,
  validateServiceName,
  validateServicePrice,
  validateServiceUnit,
  validateServiceWing,
} from './validation.ts'

/** A day far enough ahead that "already passed today" never applies. */
function farFutureDay(): string {
  const day = new Date()
  day.setUTCDate(day.getUTCDate() + 400)
  return day.toISOString().slice(0, 10)
}

test('classifies billing units by the words the catalog uses', () => {
  assert.equal(isTimeBasedUnit('Per Hour'), true)
  assert.equal(isTimeBasedUnit('Per 60-Minute Broadcast'), true)
  assert.equal(isTimeBasedUnit('Per Song (Starting Rate)'), false)
  assert.equal(isHourlyUnit('Per Hour'), true)
  assert.equal(isHourlyUnit('Per 60-Minute Broadcast'), false)
})

test('hourly services only accept an on-the-hour start', () => {
  const day = farFutureDay()

  assert.equal(validateBookingTime('14:00', day, 'Per Hour'), '14:00')
  assert.throws(
    () => validateBookingTime('14:30', day, 'Per Hour'),
    /Hourly services start on the hour/,
  )
  assert.throws(
    () => validateBookingTime('14:15', day, 'Per Hour'),
    /Hourly services start on the hour/,
  )
})

test('minute-based services keep any valid minute', () => {
  assert.equal(
    validateBookingTime('14:30', farFutureDay(), 'Per 60-Minute Broadcast'),
    '14:30',
  )
})

test('time-based services require a slot', () => {
  assert.throws(
    () => validateBookingTime(undefined, farFutureDay(), 'Per Hour'),
    /needs a start time/,
  )
  assert.throws(
    () => validateBookingTime('  ', farFutureDay(), 'Per Hour'),
    /needs a start time/,
  )
})

test('day-based services reject a time slot and default to null', () => {
  const day = farFutureDay()

  assert.equal(validateBookingTime(undefined, day, 'Per Song (Starting Rate)'), null)
  assert.throws(
    () => validateBookingTime('14:00', day, 'Per Song (Starting Rate)'),
    /booked by the day/,
  )
})

test('rejects malformed times before the unit rules', () => {
  assert.throws(
    () => validateBookingTime('2pm', farFutureDay(), 'Per Hour'),
    /HH:MM/,
  )
  assert.throws(
    () => validateBookingTime('24:00', farFutureDay(), 'Per 60-Minute Broadcast'),
    /HH:MM/,
  )
})

test('rejects a same-day slot that has already started', () => {
  // 00:00 has always started by the time this test runs (studio timezone).
  assert.throws(
    () => validateBookingTime('00:00', studioToday(), 'Per Hour'),
    /already passed/,
  )
})

test('blockout reasons are optional but constrained to the known vocabulary', () => {
  assert.equal(validateBlockoutReason(undefined), null)
  assert.equal(validateBlockoutReason(null), null)
  assert.equal(validateBlockoutReason('   '), null)
  assert.equal(validateBlockoutReason('unavailable'), 'unavailable')
  assert.equal(validateBlockoutReason('maintenance'), 'maintenance')
  assert.equal(validateBlockoutReason('other'), 'other')
  assert.throws(() => validateBlockoutReason('holiday party'), /valid reason/)
})

test('the customer-facing closure message carries the reason label', () => {
  assert.match(blockoutMessage('2026-12-24', 'maintenance'), /\(Maintenance\)/)
  assert.match(blockoutMessage('2026-12-24', 'unavailable'), /\(Unavailable\)/)
  assert.doesNotMatch(blockoutMessage('2026-12-24', null), /\(/)
})

test('service fields are trimmed and the price accepts form strings', () => {
  assert.equal(validateServiceName('  Vocal Coaching  '), 'Vocal Coaching')
  assert.equal(validateServiceUnit('  Per Hour '), 'Per Hour')
  assert.equal(validateServiceDescription('  One-on-one session.  '), 'One-on-one session.')
  assert.equal(validateServicePrice('1500.555'), 1500.56)
  assert.equal(validateServicePrice(0), 0)
  for (const wing of SERVICE_WINGS) assert.equal(validateServiceWing(wing), wing)
})

test('a blank or unknown service field is rejected with a 400', () => {
  assert.throws(() => validateServiceName('   '), /name is required/)
  assert.throws(() => validateServiceUnit(''), /Billing unit is required/)
  assert.throws(() => validateServiceDescription('  '), /description is required/)
  assert.throws(() => validateServiceWing('party'), /valid wing/)
  assert.throws(() => validateServicePrice('-1'), /valid price/)
  assert.throws(() => validateServicePrice('not a number'), /valid price/)
  assert.throws(() => validateServicePrice(10_000_001), /too high/)
})

test('cancelling within 3 minutes is free; later cancellations count as a failure', () => {
  const created = new Date('2026-01-01T00:00:00.000Z')
  const at = (seconds: number) => new Date(created.getTime() + seconds * 1000)
  const iso = created.toISOString()

  assert.equal(cancellationCountsAsFailure(iso, at(0)), false)
  assert.equal(cancellationCountsAsFailure(iso, at(179)), false)
  // Exactly 3 minutes is still inside the free window; the penalty starts after it.
  assert.equal(cancellationCountsAsFailure(iso, at(180)), false)
  assert.equal(cancellationCountsAsFailure(iso, at(181)), true)
  assert.equal(cancellationCountsAsFailure('not-a-date', at(600)), false)
})

test('the cross-customer slot lock is a database unique index', () => {
  const dir = new URL('../../../drizzle/', import.meta.url)
  const sql = readdirSync(dir)
    .filter((file) => file.endsWith('.sql'))
    .map((file) => readFileSync(new URL(file, dir), 'utf8'))
    .join('\n')

  const index = sql
    .split('\n')
    .find((line) => line.includes('CREATE UNIQUE INDEX') && line.includes('booking_slot_unique_idx'))
  assert.ok(index, 'booking_slot_unique_idx is missing from the migrations')
  assert.match(index, /UNIQUE INDEX/)
  assert.match(index, /"serviceId","bookingDate","bookingTime"/)
  assert.match(index, /"status" in \('pending', 'confirmed'\)/)
})

test('the failure counter increments in one atomic statement', () => {
  const source = readFileSync(new URL('./payment-holds.ts', import.meta.url), 'utf8')
  assert.match(source, /"booking_failure_count" = "booking_failure_count" \+ 1/)
  assert.match(source, /returning "booking_suspended_until"/)
})

