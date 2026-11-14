import assert from 'node:assert/strict'
import test from 'node:test'
import { getSpotifyUserInfo, mapSpotifyProfileToUser } from './spotify.ts'

function spotifyProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'spotify-user-id',
    account_id: 'immutable-account-id',
    display_name: 'Juan Dela Cruz',
    email: 'juan@example.com',
    images: [{ url: 'https://i.scdn.co/image/abc' }],
    ...overrides,
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

test('splits display_name on the first whitespace run', () => {
  assert.deepEqual(mapSpotifyProfileToUser(spotifyProfile()), {
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    contact_num: '',
  })
})

test('keeps a single-word display_name in first_name', () => {
  assert.deepEqual(
    mapSpotifyProfileToUser(spotifyProfile({ display_name: 'Prince' })),
    { first_name: 'Prince', last_name: '', contact_num: '' },
  )
})

test('treats a missing or blank display_name as blank fields', () => {
  for (const display_name of [null, undefined, '   Jane   Doe  ']) {
    const mapped = mapSpotifyProfileToUser(
      spotifyProfile({ display_name }) as Parameters<
        typeof mapSpotifyProfileToUser
      >[0],
    )
    if (display_name === '   Jane   Doe  ') {
      assert.deepEqual(mapped, {
        first_name: 'Jane',
        last_name: 'Doe',
        contact_num: '',
      })
    } else {
      assert.deepEqual(mapped, {
        first_name: '',
        last_name: '',
        contact_num: '',
      })
    }
  }
})

test('never invents a contact number', () => {
  assert.equal(
    mapSpotifyProfileToUser(spotifyProfile()).contact_num,
    '',
  )
})

test('keys the account on account_id and maps the user shape', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => jsonResponse(spotifyProfile()))

  const result = await getSpotifyUserInfo({ accessToken: 'tok' })

  assert.ok(result)
  // accountSubject reads data.id — the immutable account_id must win so a
  // renamed Spotify profile can never orphan the account row.
  assert.equal(result.data.id, 'immutable-account-id')
  assert.deepEqual(
    {
      name: result.user.name,
      email: result.user.email,
      image: result.user.image,
      emailVerified: result.user.emailVerified,
      first_name: result.user.first_name,
      last_name: result.user.last_name,
      contact_num: result.user.contact_num,
    },
    {
      name: 'Juan Dela Cruz',
      email: 'juan@example.com',
      image: 'https://i.scdn.co/image/abc',
      emailVerified: false,
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      contact_num: '',
    },
  )
  // OAuth2UserInfo declares id?: never — provider identity belongs in data.
  assert.equal('id' in result.user, false)
})

test('falls back to profile.id when account_id is absent', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      jsonResponse({
        id: 'spotify-user-id',
        display_name: 'Jane Doe',
        email: 'jane@example.com',
        images: [],
      }),
  )

  const result = await getSpotifyUserInfo({ accessToken: 'tok' })

  assert.ok(result)
  assert.equal(result.data.id, 'spotify-user-id')
  assert.equal(result.user.image, undefined)
  assert.deepEqual(
    { first_name: result.user.first_name, last_name: result.user.last_name },
    { first_name: 'Jane', last_name: 'Doe' },
  )
})

test('returns null when Spotify refuses the token (403 dev-mode)', async (t) => {
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      jsonResponse({ status: 403, message: 'User not allowlisted' }, 403),
  )

  assert.equal(await getSpotifyUserInfo({ accessToken: 'tok' }), null)
})

test('returns null without an access token and never calls the API', async (t) => {
  const fetchMock = t.mock.method(
    globalThis,
    'fetch',
    async () => jsonResponse(spotifyProfile()),
  )

  assert.equal(await getSpotifyUserInfo({}), null)
  assert.equal(fetchMock.mock.callCount(), 0)
})

test('returns null when the profile request fails', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('network down')
  })

  assert.equal(await getSpotifyUserInfo({ accessToken: 'tok' }), null)
})
