import assert from 'node:assert/strict'
import test from 'node:test'
import { Hono } from 'hono'
import { rateLimit } from './rate-limit.ts'

test('rate limiter allows requests under the limit', async () => {
  const app = new Hono()
  app.use('*', rateLimit({ windowMs: 60_000, max: 2 }))
  app.get('/x', (c) => c.json({ ok: true }))

  const res1 = await app.request('/x', { headers: { 'x-forwarded-for': '1.2.3.4' } })
  const res2 = await app.request('/x', { headers: { 'x-forwarded-for': '1.2.3.4' } })
  assert.equal(res1.status, 200)
  assert.equal(res2.status, 200)
})

test('rate limiter rejects requests over the limit with 429', async () => {
  const app = new Hono()
  app.use('*', rateLimit({ windowMs: 60_000, max: 1 }))
  app.get('/x', (c) => c.json({ ok: true }))

  await app.request('/x', { headers: { 'x-forwarded-for': '5.6.7.8' } })
  const res = await app.request('/x', { headers: { 'x-forwarded-for': '5.6.7.8' } })
  assert.equal(res.status, 429)
  assert.ok(res.headers.get('retry-after'))
})