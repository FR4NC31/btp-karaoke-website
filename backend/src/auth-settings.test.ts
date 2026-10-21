import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveAuthNetworkSettings } from './auth-settings.ts'

test('defaults to x-forwarded-for and the local frontend', () => {
  const settings = resolveAuthNetworkSettings({})

  assert.deepEqual(settings.ipAddressHeaders, ['x-forwarded-for'])
  assert.deepEqual(settings.trustedProxies, [])
  assert.equal(settings.frontendOrigin, 'http://localhost:5173')
  assert.equal(settings.errorURL, 'http://localhost:5173/auth/error')
})

test('reads platform headers and trusted proxy hops', () => {
  const settings = resolveAuthNetworkSettings({
    FRONTEND_ORIGIN: 'https://app.example.com/',
    AUTH_IP_ADDRESS_HEADERS: ' CF-Connecting-IP , x-forwarded-for ',
    AUTH_TRUSTED_PROXIES: '192.0.2.10, 10.0.0.0/24, 2001:db8::/32',
  })

  assert.deepEqual(settings.ipAddressHeaders, ['cf-connecting-ip', 'x-forwarded-for'])
  assert.deepEqual(settings.trustedProxies, [
    '192.0.2.10',
    '10.0.0.0/24',
    '2001:db8::/32',
  ])
  assert.equal(settings.frontendOrigin, 'https://app.example.com')
  assert.equal(settings.errorURL, 'https://app.example.com/auth/error')
})

test('empty header and proxy values keep the safe defaults', () => {
  const settings = resolveAuthNetworkSettings({
    AUTH_IP_ADDRESS_HEADERS: '  ,  ',
    AUTH_TRUSTED_PROXIES: ' , ',
  })

  assert.deepEqual(settings.ipAddressHeaders, ['x-forwarded-for'])
  assert.deepEqual(settings.trustedProxies, [])
})

test('rejects a malformed header name', () => {
  assert.throws(
    () => resolveAuthNetworkSettings({ AUTH_IP_ADDRESS_HEADERS: 'x forwarded for' }),
    /AUTH_IP_ADDRESS_HEADERS contains invalid entries/,
  )
})

test('rejects a malformed proxy entry', () => {
  assert.throws(
    () => resolveAuthNetworkSettings({ AUTH_TRUSTED_PROXIES: '10.0.0.0/99' }),
    /AUTH_TRUSTED_PROXIES contains invalid entries/,
  )
  assert.throws(
    () => resolveAuthNetworkSettings({ AUTH_TRUSTED_PROXIES: 'proxy.internal' }),
    /AUTH_TRUSTED_PROXIES contains invalid entries/,
  )
})

test('rejects a relative frontend origin', () => {
  assert.throws(
    () => resolveAuthNetworkSettings({ FRONTEND_ORIGIN: '/relative' }),
    /FRONTEND_ORIGIN must be an absolute http\(s\) URL/,
  )
})

test('rejects a non-http frontend origin', () => {
  assert.throws(
    () => resolveAuthNetworkSettings({ FRONTEND_ORIGIN: 'javascript:alert(1)' }),
    /FRONTEND_ORIGIN must use http or https/,
  )
})
