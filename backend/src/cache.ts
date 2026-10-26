import Redis from 'ioredis'

/**
 * Backend cache with Redis when REDIS_URL is set, otherwise an in-process
 * Map. Used for read-heavy catalogs (services, media, studio closures) so
 * repeated requests do not hit PostgreSQL on every call.
 */

const REDIS_URL = process.env.REDIS_URL?.trim() || ''

let redis: any = null
if (REDIS_URL) {
  try {
    const RedisCtor = Redis as any
    redis = new RedisCtor(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
    })
    redis.connect().catch(() => {
      redis = null
    })
    redis.on('error', () => {
      redis = null
    })
  } catch {
    redis = null
  }
}

type MemoryEntry = { value: string; expires: number }
const memory = new Map<string, MemoryEntry>()

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  if (redis) {
    try {
      const raw = await redis.get(key)
      if (raw) return JSON.parse(raw) as T
    } catch {
      // Fall through to memory.
    }
  }

  const entry = memory.get(key)
  if (!entry) return undefined
  if (entry.expires <= Date.now()) {
    memory.delete(key)
    return undefined
  }
  try {
    return JSON.parse(entry.value) as T
  } catch {
    return undefined
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const raw = JSON.stringify(value)
  if (redis) {
    try {
      await redis.set(key, raw, 'EX', ttlSeconds)
      return
    } catch {
      // Fall through to memory.
    }
  }
  memory.set(key, { value: raw, expires: Date.now() + ttlSeconds * 1000 })
}

export async function cacheDel(key: string): Promise<void> {
  if (redis) {
    try {
      await redis.del(key)
    } catch {
      // Ignore.
    }
  }
  memory.delete(key)
}

export async function cacheDelPrefix(prefix: string): Promise<void> {
  if (redis) {
    try {
      let cursor = '0'
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100)
        cursor = next
        if (keys.length > 0) await redis.del(...keys)
      } while (cursor !== '0')
    } catch {
      // Ignore.
    }
  }
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) memory.delete(key)
  }
}
