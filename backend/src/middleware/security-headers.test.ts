import assert from 'node:assert/strict'
import test from 'node:test'
import { Hono } from 'hono'
import { securityHeaders } from './security-headers.ts'

test('security headers are present on responses', async () => {
  const app = new Hono()
  app.use('*', securityHeaders())
  app.get('/health', (c) => c.json({ ok: true }))

  const res = await app.request('/health')
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(res.headers.get('x-frame-options'), 'DENY')
  assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin')
  assert.equal(res.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()')
})