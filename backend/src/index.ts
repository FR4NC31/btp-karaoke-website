import { Hono } from 'hono'

const app = new Hono()

app.get('/health', (c) => {
  return c.json({
    message: 'This is healthy',
    status: 200
  })
})

export default app
