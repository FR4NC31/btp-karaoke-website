/**
 * Tiny in-memory cache with stale-while-revalidate semantics.
 *
 * Used for read-heavy, rarely-changing catalogs (services, media, studio
 * closures) so navigating between pages does not re-fetch and re-render the
 * same data on every visit. Entries expire after `ttlMs`; an expired entry is
 * still served immediately while a fresh copy is fetched in the background.
 *
 * Mutations call `invalidate()` / `invalidatePrefix()` to drop stale entries.
 */

type Entry<T> = {
  value: T
  expires: number
  refreshing: boolean
}

const store = new Map<string, Entry<unknown>>()

export function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now()
  const entry = store.get(key) as Entry<T> | undefined

  if (entry && entry.expires > now) {
    return Promise.resolve(entry.value)
  }

  if (entry) {
    // Stale: serve immediately, refresh in the background (once).
    if (!entry.refreshing) {
      entry.refreshing = true
      fetcher()
        .then((value) => {
          store.set(key, { value, expires: Date.now() + ttlMs, refreshing: false })
        })
        .catch(() => {
          const current = store.get(key) as Entry<T> | undefined
          if (current) current.refreshing = false
        })
    }
    return Promise.resolve(entry.value)
  }

  // Cold: fetch, store, and return.
  return fetcher().then((value) => {
    store.set(key, { value, expires: Date.now() + ttlMs, refreshing: false })
    return value
  })
}

export function invalidate(key: string): void {
  store.delete(key)
}

export function invalidatePrefix(prefix: string): void {
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
