/**
 * Two customer kinds, exactly one of which is required (the backend's
 * booking_owner_check enforces the same rule in the database).
 */
export type CustomerMode = 'user' | 'guest'
