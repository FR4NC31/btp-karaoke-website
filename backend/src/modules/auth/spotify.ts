// Spotify social sign-in: profile-to-user mapping and the /v1/me userinfo
// fetch that Better Auth's stock provider would run.
//
// Why this exists: Better Auth's built-in Spotify provider keys the account
// row on `profile.id`, but Spotify's OpenAPI spec (PrivateUserObject) marks
// `id` as changeable and names `account_id` as the immutable identifier to
// use for account linking. Overriding `getUserInfo` is the extension point
// ProviderOptions offers for that — but providing it bypasses the stock
// fetch entirely, including its mapProfileToUser call, so both the
// required-field mapping and the account_id subject fix live here.

/** Fields we consume from GET /v1/me (Spotify OpenAPI: PrivateUserObject). */
export type SpotifyMeProfile = {
  id: string
  /** Immutable account id; preferred over `id` for account linking. */
  account_id?: string
  /** Spec marks this nullable ("null if not available"). */
  display_name?: string | null
  /** Spec marks this deprecated and unverified. */
  email?: string | null
  images?: { url: string }[]
}

/**
 * Spotify exposes one `display_name`, not given/family names, and no phone
 * claim. Split on the first whitespace so "Juan Dela Cruz" becomes
 * first_name "Juan", last_name "Dela Cruz"; a mononym lands entirely in
 * first_name. The three keys must always be present: they are
 * required: true and NOT NULL below, and Better Auth validates them while
 * creating the user — before any hook runs — so a missing key kills
 * first-time sign-up with "first_name is required" (the same trap Google
 * had until its mapping was added).
 */
export function mapSpotifyProfileToUser(profile: SpotifyMeProfile) {
  const parts = (profile.display_name ?? '').trim().split(/\s+/).filter(Boolean)
  const [first = '', ...rest] = parts
  return {
    first_name: first,
    last_name: rest.join(' '),
    // The user-read-email scope exposes no phone number; blank beats
    // inventing one. ProfilePage renders "Not set".
    contact_num: '',
  }
}

type SpotifyTokens = { accessToken?: string | undefined }

/**
 * Replacement for the stock provider getUserInfo (see file header).
 *
 * Returns null on any failure — no token, non-2xx from /v1/me (401 bad
 * token, 403 not on the Spotify dashboard allowlist, 429 quota), or a
 * network/parse error — never throws, because the OAuth callback awaits
 * this unguarded and a throw would surface as a bare 500 instead of
 * Better Auth's `unable_to_get_user_info` redirect.
 */
export async function getSpotifyUserInfo(token: SpotifyTokens) {
  if (!token.accessToken) return null

  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    })

    if (!response.ok) {
      // Spotify's ErrorObject is { status, message }; the 429 body nests it
      // under `error`. Log it so a dev-mode 403 (user not allowlisted) is
      // distinguishable from a bad token or quota hit in the server log —
      // the OAuth redirect can only carry the generic error code.
      const body = (await response.json().catch(() => null)) as {
        message?: string
        error?: { message?: string }
      } | null
      console.error(
        `[auth] Spotify /v1/me ${response.status}:`,
        body?.message ?? body?.error?.message ?? response.statusText,
      )
      return null
    }

    const profile = (await response.json()) as SpotifyMeProfile

    return {
      user: {
        name: profile.display_name ?? '',
        email: profile.email,
        image: profile.images?.[0]?.url,
        // Spotify never proves email ownership (spec: "unverified"), and the
        // stock provider hardcodes false too. Combined with Better Auth's
        // default requireLocalEmailVerified, that is what keeps a Spotify
        // sign-in from ever merging into an existing password account.
        emailVerified: false,
        ...mapSpotifyProfileToUser(profile),
      },
      // accountSubject reads data.id, so publish the immutable account_id
      // here (falling back to id if the field is ever absent).
      data: {
        id: profile.account_id ?? profile.id,
        display_name: profile.display_name ?? '',
        email: profile.email ?? '',
        images: profile.images ?? [],
      },
    }
  } catch (err) {
    console.error('[auth] Spotify profile fetch failed:', err)
    return null
  }
}
