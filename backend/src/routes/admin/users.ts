import { Hono } from 'hono'
import { listUsersForTagging } from '../../modules/bookings/index.ts'

const adminUsers = new Hono()

// Registered accounts for the "tag a customer" picker.
adminUsers.get('/', async (c) => {
  const users = await listUsersForTagging(c.req.query('query'))
  return c.json({ users })
})

export default adminUsers

