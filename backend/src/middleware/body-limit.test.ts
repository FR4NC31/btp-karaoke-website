import assert from 'node:assert/strict'
import test from 'node:test'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'

test('bodyLimit rejects oversized bodies with 413', async () => {
  const app = new Hono()
  app.use('*', bodyLimit({ maxSize: 10 }))
  app.post('/x', async (c) => c.json({ ok: true }))

  const res = await app.request('/x', {
    method: 'POST',
    headers: { 'content-length': '100' },
    body: 'a'.repeat(100),
  })
  assert.equal(res.status, 413)
})