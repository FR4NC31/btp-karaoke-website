import { Hono } from 'hono'
import { requireAdmin } from '../../middleware/session.ts'
import adminBlockouts from './blockouts.ts'
import adminBookings from './bookings.ts'
import adminMedia from './media.ts'
import adminUsers from './users.ts'

/**
 * Admin sub-app with `requireAdmin` registered ONCE on its root: every route
 * below inherits the 401/403 gate by construction, so a route added here later
 * cannot ship unguarded. Handlers trust nothing from the client beyond shape
 * (ids, names, days) — the role was already verified against the database.
 */
const adminApi = new Hono()

adminApi.use('*', requireAdmin)
adminApi.route('/bookings', adminBookings)
adminApi.route('/blockouts', adminBlockouts)
adminApi.route('/users', adminUsers)
adminApi.route('/media', adminMedia)

export default adminApi

