import { serve } from '@hono/node-server'
import app from './src/index.ts'

const configuredPort = Number(process.env.PORT)
const port = Number.isInteger(configuredPort) && configuredPort >= 1 && configuredPort <= 65535
  ? configuredPort
  : 3000

serve({
  fetch: app.fetch,
  port
})