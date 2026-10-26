import { isIP } from 'node:net'

/**
 * Network-facing Better Auth settings resolved from the environment.
 *
 * Kept separate from auth.ts so the parsing and validation can be tested
 * without opening the database pool or building a Better Auth instance.
 */
export type AuthNetworkSettings = {
  frontendOrigin: string
  ipAddressHeaders: string[]
  trustedProxies: string[]
  errorURL: string
}

const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:5173'
const DEFAULT_IP_ADDRESS_HEADERS = ['x-forwarded-for']

// RFC 9110 field-name characters. Header values come from deployment config,
// but a typo such as "x forwarded for" would otherwise throw inside every
// Better Auth request instead of failing at startup.
const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function isIPOrCIDR(value: string): boolean {
  const [address, prefix, ...extra] = value.split('/')
  if (!address || extra.length > 0) return false

  const family = isIP(address)
  if (family === 0) return false
  if (prefix === undefined) return true
  if (!/^\d+$/.test(prefix)) return false

  return Number(prefix) <= (family === 4 ? 32 : 128)
}

function assertValidEntries(
  name: string,
  entries: string[],
  isValid: (entry: string) => boolean,
): void {
  const invalid = entries.filter((entry) => !isValid(entry))
  if (invalid.length > 0) {
    throw new Error(`${name} contains invalid entries: ${invalid.join(', ')}`)
  }
}

/**
 * Resolve the values that decide how Better Auth sees the outside world.
 *
 * `AUTH_IP_ADDRESS_HEADERS` must name headers that the reverse proxy or CDN
 * overwrites with the real client address. Listing a header that clients can
 * set themselves would let them choose their own rate-limit bucket. When a
 * forwarded header carries a comma-separated chain, `AUTH_TRUSTED_PROXIES`
 * must name the proxy hops (IPs or CIDRs) so Better Auth can walk the chain
 * right-to-left instead of falling back to one shared bucket.
 */
export function resolveAuthNetworkSettings(
  env: NodeJS.ProcessEnv = process.env,
): AuthNetworkSettings {
  const configuredOrigin = (env.FRONTEND_ORIGIN ?? DEFAULT_FRONTEND_ORIGIN).trim()

  let frontendURL: URL
  try {
    frontendURL = new URL(configuredOrigin)
  } catch {
    throw new Error(
      'FRONTEND_ORIGIN must be an absolute http(s) URL, e.g. https://app.example.com.',
    )
  }
  if (frontendURL.protocol !== 'http:' && frontendURL.protocol !== 'https:') {
    throw new Error('FRONTEND_ORIGIN must use http or https.')
  }

  const configuredHeaders = parseList(env.AUTH_IP_ADDRESS_HEADERS).map((header) =>
    header.toLowerCase(),
  )
  assertValidEntries('AUTH_IP_ADDRESS_HEADERS', configuredHeaders, (header) =>
    HEADER_NAME_PATTERN.test(header),
  )

  const trustedProxies = parseList(env.AUTH_TRUSTED_PROXIES)
  assertValidEntries('AUTH_TRUSTED_PROXIES', trustedProxies, isIPOrCIDR)

  return {
    frontendOrigin: frontendURL.origin,
    ipAddressHeaders:
      configuredHeaders.length > 0 ? configuredHeaders : [...DEFAULT_IP_ADDRESS_HEADERS],
    trustedProxies,
    // Absolute on purpose: the API and SPA can be different origins. A
    // root-relative "/auth/error" would be resolved by the browser against the
    // API origin and miss the React route entirely.
    errorURL: new URL('/auth/error', frontendURL.origin).toString(),
  }
}
