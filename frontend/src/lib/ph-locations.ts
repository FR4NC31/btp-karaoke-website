export type PhLocationOption = {
  code: string
  name: string
}

/**
 * Free, static PSGC dataset for Philippine locations.
 *
 * Why this host instead of buonzz's ph-locations-api: the buonzz endpoint was
 * unreachable when this was wired up, and psgc.cloud returns mojibake names
 * (e.g. "DasmariÃ±as") plus a wrong province on NCR rows. psgc.gitlab.io serves
 * the same PSGC data as plain JSON with `Access-Control-Allow-Origin: *`, so
 * the browser can call it directly.
 *
 * Codes are the 9-digit PSGC codes used by these endpoints; names are what we
 * store on the user profile.
 */
const API_ROOT = 'https://psgc.gitlab.io/api'

/**
 * NCR has no province in PSGC — cities and Pateros sit directly under the
 * region. The profile still asks for a province, so NCR is offered as one
 * pseudo-province and resolved through the region endpoint below.
 */
export const METRO_MANILA: PhLocationOption = {
  code: '130000000',
  name: 'Metro Manila (NCR)',
}

type RawLocation = {
  code: string
  name: string
}

const cache = new Map<string, Promise<PhLocationOption[]>>()

// A stalled PSGC request must not sit in the cache forever. The catch below
// evicts it, so the editor's Retry button can start a fresh request.
const REQUEST_TIMEOUT_MS = 8_000

function cached(key: string, load: () => Promise<PhLocationOption[]>) {
  const existing = cache.get(key)
  if (existing) return existing

  const promise = load().catch((err: unknown) => {
    // A failed request must not poison the cache: the Retry button can try
    // again without a reload.
    cache.delete(key)
    throw err
  })
  cache.set(key, promise)
  return promise
}

async function fetchLocations(path: string): Promise<PhLocationOption[]> {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`Location API returned ${response.status}`)
  }

  const data: unknown = await response.json()
  if (!Array.isArray(data)) {
    throw new Error('Location API returned an unexpected payload')
  }

  return (data as RawLocation[])
    .filter((row) => typeof row?.code === 'string' && typeof row?.name === 'string')
    .map((row) => ({ code: row.code, name: row.name.trim() }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
}

export function getProvinces() {
  return cached('provinces', async () => {
    const provinces = await fetchLocations('/provinces/')
    // NCR is not a province, so the dataset should not carry it — but dedupe
    // by code anyway, otherwise a future dataset update would create duplicate
    // React keys in the province select.
    const withoutMetro = provinces.filter((province) => province.code !== METRO_MANILA.code)
    return [...withoutMetro, METRO_MANILA].sort((a, b) => a.name.localeCompare(b.name, 'en'))
  })
}

export function getCitiesMunicipalities(provinceCode: string) {
  const path =
    provinceCode === METRO_MANILA.code
      ? `/regions/${provinceCode}/cities-municipalities/`
      : `/provinces/${provinceCode}/cities-municipalities/`

  return cached(`cities:${provinceCode}`, () => fetchLocations(path))
}

export function getBarangays(cityCode: string) {
  return cached(`barangays:${cityCode}`, () =>
    fetchLocations(`/cities-municipalities/${cityCode}/barangays/`),
  )
}
