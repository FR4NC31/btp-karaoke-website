/**
 * Where to send someone after they authenticate, and what to do with the
 * `?next=` parameter the route guards attach to /signin.
 *
 * `next` is attacker-controllable (it rides in a URL), so it is validated
 * before it is ever navigated to. There are two distinct ways a prefix check
 * alone gets this wrong:
 *
 *  1. `//evil.example` is protocol-relative — the browser resolves it against
 *     the scheme, not the host — so a bare `startsWith('/')` hands away an open
 *     redirect. Better Auth itself shipped that exact bug
 *     (GHSA-hjpm-7mrm-26w8), which is why this helper exists rather than a
 *     one-line startsWith at the call site.
 *
 *  2. Browsers strip ASCII tab/newline (U+0009/000A/000D) out of a URL *before*
 *     parsing it. So `/<LF>//evil.example` passes `startsWith('/')` and misses
 *     both the `//` and the `/\` tests (there is only one slash so far), then
 *     normalises to `///evil.example` — whose run of slashes the URL parser
 *     skips before reading `evil.example` as the authority, i.e.
 *     http://evil.example/. Reachable because React Router percent-decodes
 *     `?next=`, so `%2F%0A%2F%2Fevil.example` arrives here as a real newline
 *     rather than as the literal `%0A`.
 *
 * React Router 8 refuses external targets on its own (`validateNavigationTarget`,
 * called by both `<Navigate>` and `useNavigate`), so today (2) surfaces as a
 * thrown error in the route error boundary — a *successful* sign-in ends on
 * "Something went wrong / External navigation is not allowed" — rather than as
 * an open redirect. Both are bugs, and refusing the value here fixes the crash
 * while keeping this helper's promise ("validated before it is ever navigated
 * to") from resting on a version-specific router internal.
 *
 * The control-character test rejects (2) by name; the origin comparison below
 * is the general guard, closing the whole class — including normalisations
 * neither of us has thought of — by resolving the candidate exactly the way the
 * browser will and refusing anything that lands off-origin.
 *
 * Auth pages are also refused as targets — bouncing out of sign-in and
 * straight back into it is a loop, not a destination.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//') || raw.startsWith('/\\')) return null
  // C0 controls and DEL. Stripping these is what turns `/<LF>/evil.example`
  // into the protocol-relative `//evil.example`, so none of them may reach a
  // navigation.
  if (hasControlCharacter(raw)) return null
  if (raw.startsWith('/signin') || raw.startsWith('/signup')) return null
  if (!resolvesToOwnOrigin(raw)) return null
  return raw
}

/** C0 controls and DEL, by code point (see the note above). */
function hasControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code <= 0x1f || code === 0x7f) return true
  }
  return false
}

/**
 * A literal base for the origin comparison. `next` is always path-absolute by
 * the time it reaches here, so only the base's *origin* takes part in
 * resolution — the host itself is irrelevant. Keeping it a constant (rather
 * than reading `window.location`) leaves this helper pure, so it stays callable
 * from tests and any future non-browser context.
 */
const RESOLUTION_BASE = 'https://studio.invalid'

/**
 * True when `raw`, resolved the way a browser would resolve it, stays on our
 * own origin. This is the check that cannot drift: it asks the same URL parser
 * the browser uses instead of trying to enumerate what "looks absolute".
 */
function resolvesToOwnOrigin(raw: string): boolean {
  try {
    return new URL(raw, RESOLUTION_BASE).origin === RESOLUTION_BASE
  } catch {
    // Unparseable is not a destination.
    return false
  }
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
