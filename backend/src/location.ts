/**
 * Structural guard for the profile location fields.
 *
 * The UI only offers PSGC names, but sign-up and `update-user` are public
 * endpoints: a crafted request could otherwise save one field at a time or
 * write an unbounded string. Keeping this independent from Better Auth lets
 * the rules be tested without a database connection.
 *
 * This guard enforces shape and length only: all three levels together,
 * trimmed, at most 120 characters, no control characters. PSGC membership and
 * the no-street-address rule stay in the client cascade; validating the whole
 * dataset on the auth path would make every profile save depend on an external
 * API.
 */
export const LOCATION_FIELDS = ['province', 'city_municipality', 'barangay'] as const

export type LocationField = (typeof LOCATION_FIELDS)[number]

export type LocationValues = Record<LocationField, string | null>

export type LocationValidation =
  | { kind: 'absent' }
  | { kind: 'invalid'; message: string }
  | { kind: 'valid'; data: LocationValues }

const MAX_LOCATION_LENGTH = 120
// C0 controls, DEL, and the C1 control block.
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F-\u009F]/

function isBlank(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0)
  )
}

export function validateLocationUpdate(input: Record<string, unknown>): LocationValidation {
  const present = LOCATION_FIELDS.filter((field) => Object.hasOwn(input, field))

  if (present.length === 0) return { kind: 'absent' }

  if (present.length !== LOCATION_FIELDS.length) {
    return {
      kind: 'invalid',
      message: 'Save the province, city or municipality, and barangay together.',
    }
  }

  // An explicit clear is allowed only when every level is cleared. The profile
  // editor does not expose this today, but it keeps the API contract coherent.
  if (LOCATION_FIELDS.every((field) => isBlank(input[field]))) {
    return {
      kind: 'valid',
      data: { province: null, city_municipality: null, barangay: null },
    }
  }

  const data: LocationValues = {
    province: null,
    city_municipality: null,
    barangay: null,
  }

  for (const field of LOCATION_FIELDS) {
    const value = input[field]
    if (typeof value !== 'string') {
      return { kind: 'invalid', message: 'Location fields must be text.' }
    }

    const trimmed = value.trim()
    if (!trimmed) {
      return {
        kind: 'invalid',
        message: 'Enter a province, city or municipality, and barangay before saving.',
      }
    }
    if (trimmed.length > MAX_LOCATION_LENGTH) {
      return {
        kind: 'invalid',
        message: `Location names must be ${MAX_LOCATION_LENGTH} characters or fewer.`,
      }
    }
    if (CONTROL_CHARACTERS.test(trimmed)) {
      return { kind: 'invalid', message: 'Location names cannot contain control characters.' }
    }

    data[field] = trimmed
  }

  return { kind: 'valid', data }
}
