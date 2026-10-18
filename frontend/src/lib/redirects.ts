/**
 * Where to send someone after they authenticate, and what to do with the
 * `?next=` parameter the route guards attach to /signin.
 *
 * `next` is attacker-controllable (it rides in a URL), so it is validated
 * before it is ever navigated to. The `//` case matters most: browsers treat
 * `//evil.example` as a protocol-relative absolute URL, so a bare
 * `startsWith('/')` check would hand an open redirect to anyone who can get a
 * victim to click a crafted sign-in link. Better Auth itself shipped that
 * exact bug (GHSA-hjpm-7mrm-26w8), which is why this helper exists rather
 * than a one-line startsWith at the call site.
 *
 * Auth pages are also refused as targets — bouncing out of sign-in and
 * straight back into it is a loop, not a destination.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//') || raw.startsWith('/\\')) return null
  if (raw.startsWith('/signin') || raw.startsWith('/signup')) return null
  return raw
}

/**
 * The page a session should land on: an explicit, validated `next` wins;
 * otherwise admins go to the console and everyone else to the studio.
 */
export function landingPathFor(
  role: string | null | undefined,
  next?: string | null,
): string {
  return safeNextPath(next) ?? (role === 'admin' ? '/admin' : '/studio')
}
