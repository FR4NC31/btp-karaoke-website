import { expect, request as rawRequest } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { TEST_ADMIN } from './auth'

/**
 * Direct admin-API helpers for the media hub catalog (/api/admin/media).
 *
 * The karaoke suite uses these to prove /studio renders published catalog
 * rows: music and radio sections have no seeded copy by design (only the one
 * real local master, "The Reason", ships with the database), so a test
 * creates exactly the row under assertion and deletes it afterwards.
 *
 * Same contract as admin.spec.ts's API helpers — a throwaway context that
 * signs in as the promoted QA admin. The Origin header mirrors a browser:
 * Better Auth's CSRF middleware requires it on credentialed POSTs made by
 * clients that send sec-fetch-mode (Playwright's request contexts do).
 */

export interface MediaSeedInput {
  section: 'video' | 'music' | 'radio'
  title: string
  subtitle?: string
  /** Performer under the title (video and music rows). */
  artist?: string
  tag?: string
  duration?: string
  plays?: number
  tempo?: string
  songKey?: string
  freq?: string
  listeners?: number
  /** Upload reference from uploadMediaFileAsAdmin (music/video rows). */
  sourceUrl?: string
  sourceName?: string
  /** Album/collection as shown on the hub and in the editor. */
  album?: string
  /** Cover-image reference from uploadMediaFileAsAdmin (image upload). */
  coverUrl?: string
  coverName?: string
}

async function withAdminApi<T>(
  baseURL: string | undefined,
  run: (api: APIRequestContext) => Promise<T>,
): Promise<T> {
  const api = await rawRequest.newContext({ baseURL })
  try {
    const signIn = await api.post('/api/auth/sign-in/email', {
      headers: { Origin: baseURL ?? '' },
      data: { email: TEST_ADMIN.email, password: TEST_ADMIN.password },
    })
    expect(
      signIn.ok(),
      'the QA admin should sign in — is it still promoted? (see setup/admin.setup.ts)',
    ).toBeTruthy()
    return await run(api)
  } finally {
    await api.dispose()
  }
}

/** Creates one catalog row — live on the hub immediately. Returns its id. */
export async function createMediaItemAsAdmin(
  baseURL: string | undefined,
  input: MediaSeedInput,
): Promise<{ id: string }> {
  return withAdminApi(baseURL, async (api) => {
    const response = await api.post('/api/admin/media', { data: input })
    expect(response.ok(), `media create should succeed (got ${response.status()})`).toBeTruthy()
    const body = await response.json()
    return { id: body.item.id as string }
  })
}

/** Cleanup twin. Idempotent: an already-deleted row (404) is fine. */
export async function deleteMediaItemAsAdmin(
  baseURL: string | undefined,
  id: string,
): Promise<void> {
  await withAdminApi(baseURL, async (api) => {
    const response = await api.post(`/api/admin/media/${encodeURIComponent(id)}/delete`)
    if (!response.ok() && response.status() !== 404) {
      throw new Error(`media delete failed (${response.status()}): ${await response.text()}`)
    }
  })
}

/** What the uploader answers: the stored file, or the rejection message. */
export interface UploadResult {
  status: number
  body: {
    file?: { url: string; name: string; size: number }
    error?: string
  }
}

/**
 * Posts one raw upload as the QA admin — the same raw-body contract the
 * editor uses (`data` as the body, X-File-Name for the display copy). Also
 * the negative-path probe: bad extensions and type mismatches answer 4xx
 * without a session ever being needed to clean up.
 */
export async function uploadMediaFileAsAdmin(
  baseURL: string | undefined,
  file: { name: string; mimeType: string; data: Buffer | string },
): Promise<UploadResult> {
  return withAdminApi(baseURL, async (api) => {
    const response = await api.post('/api/admin/media/upload', {
      headers: {
        Origin: baseURL ?? '',
        'Content-Type': file.mimeType,
        'X-File-Name': file.name,
      },
      data: file.data,
    })
    const body = (await response.json().catch(() => ({}))) as UploadResult['body']
    return { status: response.status(), body }
  })
}
