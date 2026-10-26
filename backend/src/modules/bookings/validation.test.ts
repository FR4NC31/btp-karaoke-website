import assert from 'node:assert/strict'
import test from 'node:test'
import {
  blockoutMessage,
  isHourlyUnit,
  isTimeBasedUnit,
  studioToday,
  validateBlockoutReason,
  validateBookingTime,
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

