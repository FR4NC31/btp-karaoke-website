import assert from 'node:assert/strict'
import test from 'node:test'
import { validateLocationUpdate } from './location.ts'

test('ignores updates that do not touch the location fields', () => {
  assert.deepEqual(validateLocationUpdate({ name: 'Franc Ramos' }), { kind: 'absent' })
})

test('accepts all three PSGC names and trims them', () => {
  const result = validateLocationUpdate({
    province: '  Cavite ',
    city_municipality: ' City of Bacoor',
    barangay: 'Molino I ',
  })

  assert.equal(result.kind, 'valid')
  assert.deepEqual(result.kind === 'valid' ? result.data : null, {
    province: 'Cavite',
    city_municipality: 'City of Bacoor',
    barangay: 'Molino I',
  })
})

test('rejects partial location updates', () => {
  const result = validateLocationUpdate({ province: 'Cavite' })

  assert.equal(result.kind, 'invalid')
})

test('rejects one blank field even when the others are set', () => {
  const result = validateLocationUpdate({
    province: 'Cavite',
    city_municipality: 'City of Bacoor',
    barangay: '   ',
  })

  assert.equal(result.kind, 'invalid')
})

test('allows clearing every location field together', () => {
  const result = validateLocationUpdate({
    province: null,
    city_municipality: '',
    barangay: null,
  })

  assert.deepEqual(result, {
    kind: 'valid',
    data: { province: null, city_municipality: null, barangay: null },
  })
})

test('rejects non-string, oversized, and control-character values', () => {
  assert.equal(
    validateLocationUpdate({
      province: 'Cavite',
      city_municipality: 'City of Bacoor',
      barangay: 42,
    }).kind,
    'invalid',
  )

  assert.equal(
    validateLocationUpdate({
      province: 'Cavite',
      city_municipality: 'City of Bacoor',
      barangay: 'x'.repeat(121),
    }).kind,
    'invalid',
  )

  assert.equal(
    validateLocationUpdate({
      province: 'Cavite',
      city_municipality: 'City of Bacoor',
      barangay: 'Molino\nI',
    }).kind,
    'invalid',
  )
})
