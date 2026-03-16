import { db } from '@/lib/db/client'
import { apiCache } from '@/drizzle/schema'
import { eq, sql } from 'drizzle-orm'

async function get(key: string): Promise<unknown | null> {
  if (!db) return null
  const rows = await db
    .select({ payload: apiCache.payload })
    .from(apiCache)
    .where(
      sql`${apiCache.cacheKey} = ${key} AND ${apiCache.fetchedAt} > strftime('%s', 'now') - (${apiCache.ttlHours} * 3600)`
    )
    .limit(1)

  if (rows.length === 0) return null
  try {
    return JSON.parse(rows[0].payload)
  } catch {
    return null
  }
}

async function set(key: string, payload: unknown, ttlHours = 2): Promise<void> {
  if (!db) return
  const serialized = JSON.stringify(payload)
  await db
    .insert(apiCache)
    .values({ cacheKey: key, payload: serialized, fetchedAt: new Date(), ttlHours })
    .onConflictDoUpdate({
      target: apiCache.cacheKey,
      set: { payload: serialized, fetchedAt: new Date(), ttlHours },
    })
}

async function invalidate(key: string): Promise<void> {
  if (!db) return
  await db.delete(apiCache).where(eq(apiCache.cacheKey, key))
}

function buildFlightCacheKey(
  origin: string,
  dest: string,
  depart: string,
  returnDate: string,
  adults: number,
  directOnly: boolean
): string {
  return `flights:${origin}:${dest}:${depart}:${returnDate}:${adults}:${directOnly}`
}

function buildHotelListCacheKey(cityCode: string): string {
  return `hotel-list:${cityCode}`
}

function buildHotelOffersCacheKey(
  cityCode: string,
  checkin: string,
  checkout: string,
  rooms: number
): string {
  return `hotel-offers:${cityCode}:${checkin}:${checkout}:${rooms}`
}

export const CacheService = {
  get,
  set,
  invalidate,
  buildFlightCacheKey,
  buildHotelListCacheKey,
  buildHotelOffersCacheKey,
}
