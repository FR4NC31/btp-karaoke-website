import { expect, request as rawRequest } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { TEST_ADMIN } from './auth'


interface MediaSeedInput {
  section: 'video' | 'music' | 'radio'
  title: string
  subtitle?: string
  artist?: string
  tag?: string
  duration?: string
  plays?: number
  tempo?: string
  songKey?: string
  freq?: string
  listeners?: number
  sourceUrl?: string
  sourceName?: string
  album?: string
  lyrics?: string
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

/**
 * Best-effort cleanup for tests that create a row through the UI. The row id is
 * not returned by that flow, so recover it by its unique title instead of
 * depending on a second lookup that can fail before `finally` runs.
 */
export async function deleteMediaItemsByTitleAsAdmin(
  baseURL: string | undefined,
  title: string,
): Promise<void> {
  await withAdminApi(baseURL, async (api) => {
    const response = await api.get('/api/admin/media')
    if (!response.ok()) return
    const body = (await response.json()) as { items: Array<{ id: string; title: string }> }
    const matches = body.items.filter((item) => item.title === title)
    for (const item of matches) {
      await api.post(`/api/admin/media/${encodeURIComponent(item.id)}/delete`)
    }
  })
}

export async function getMediaItemAsAdmin(
  baseURL: string | undefined,
  id: string,
): Promise<Record<string, unknown>> {
  return withAdminApi(baseURL, async (api) => {
    const response = await api.get('/api/admin/media')
    expect(
      response.ok(),
      `media read should succeed (got ${response.status()})`,
    ).toBeTruthy()
    const body = (await response.json()) as { items: Array<Record<string, unknown>> }
    const item = body.items.find((row) => row.id === id)
    expect(item, 'the created row should be in the admin catalog').toBeTruthy()
    return item ?? {}
  })
}

export interface UploadResult {
  status: number
  body: {
    file?: { url: string; name: string; size: number }
    error?: string
  }
}

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
