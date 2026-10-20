export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith('/')) return null
  if (raw.startsWith('//') || raw.startsWith('/\\')) return null
  if (hasControlCharacter(raw)) return null
  if (raw.startsWith('/signin') || raw.startsWith('/signup')) return null
  if (!resolvesToOwnOrigin(raw)) return null
  return raw
}

function hasControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code <= 0x1f || code === 0x7f) return true
  }
  return false
}

const RESOLUTION_BASE = 'https://studio.invalid'

function resolvesToOwnOrigin(raw: string): boolean {
  try {
    return new URL(raw, RESOLUTION_BASE).origin === RESOLUTION_BASE
  } catch {
    return false
  }
}

export function landingPathFor(
  role: string | null | undefined,
  next?: string | null,
): string {
  return safeNextPath(next) ?? (role === 'admin' ? '/admin' : '/studio')
}
