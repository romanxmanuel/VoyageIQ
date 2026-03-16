# VoyageIQ UX + Live Data Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade VoyageIQ from a 9-destination seeded demo to a real travel planning tool with live Amadeus flight/hotel prices, any-city search via Google Places, 9 Philippines destinations with full data, plain-language copy throughout, and a family/elderly travel mode.

**Architecture:** New Amadeus adapters fetch real flight and hotel data on form submit and cache results for 2 hours in Turso. Google Places autocomplete handles destination input and resolves to IATA codes via a static map + Amadeus Airport Search fallback. All new fields thread from Zod schema → domain types → scenario scoring → UI.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Zod v4, Drizzle ORM + libSQL, Vitest (new), Amadeus Node SDK, Google Places API (REST via fetch)

---

## Chunk 1: Test Setup + Types + Schema + Cache Service

### Task 1: Install and configure Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Install Vitest and related packages**

```bash
cd "C:\Users\lily7\Claude Code Projects\VoyageIQ"
npm install --save-dev vitest @vitest/coverage-v8 vite-tsconfig-paths
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

- [ ] **Step 3: Create test setup file**

Create `tests/setup.ts`:
```typescript
// Global test setup — extend here as needed
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify Vitest runs**

```bash
npx vitest run --reporter=verbose
```
Expected: "No test files found" — that's fine, it means config works.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/setup.ts package.json package-lock.json
git commit -m "chore: add vitest test framework"
```

---

### Task 2: Update domain types

**Files:**
- Modify: `domain/trip/types.ts`

- [ ] **Step 1: Write failing type test**

Create `tests/domain/types.test.ts`:
```typescript
import { describe, it, expectTypeOf } from 'vitest'
import type {
  TripConstraint,
  PlannerInput,
  DestinationMatch,
  DestinationSeed,
} from '@/domain/trip/types'

describe('TripConstraint', () => {
  it('accepts travelPreferences', () => {
    const c: TripConstraint = {
      destinationQuery: 'Manila',
      origin: 'Orlando',
      travelers: 2,
      nights: 7,
      travelPreferences: {
        preferDirectFlights: true,
        preferLocalFood: true,
        lowWalkingIntensity: false,
      },
      budgetCap: 5000,
    }
    expectTypeOf(c.travelPreferences).toMatchTypeOf<{
      preferDirectFlights: boolean
      preferLocalFood: boolean
      lowWalkingIntensity: boolean
    } | undefined>()
  })
})

describe('DestinationSeed', () => {
  it('has cityCode and coordinates', () => {
    expectTypeOf<DestinationSeed['cityCode']>().toBeString()
    expectTypeOf<DestinationSeed['coordinates']>().toMatchTypeOf<{ lat: number; lng: number }>()
  })
})

describe('DestinationMatch', () => {
  it('has iataCode, cityCode, coordinates', () => {
    expectTypeOf<DestinationMatch['iataCode']>().toBeString()
    expectTypeOf<DestinationMatch['cityCode']>().toBeString()
    expectTypeOf<DestinationMatch['coordinates']>().toMatchTypeOf<{ lat: number; lng: number }>()
  })
})
```

- [ ] **Step 2: Run test — expect type errors (fails to compile)**

```bash
npx vitest run tests/domain/types.test.ts
```
Expected: type errors on missing fields.

- [ ] **Step 3: Update `domain/trip/types.ts`**

Add to `TripConstraint` interface (after `nights`):
```typescript
travelPreferences?: {
  preferDirectFlights: boolean
  preferLocalFood: boolean
  lowWalkingIntensity: boolean
}
budgetCap?: number
```

Add to `DestinationSeed` interface (after `airportCode`):
```typescript
cityCode: string
coordinates: { lat: number; lng: number }
```

Add to `DestinationMatch` interface (after `helperText`):
```typescript
iataCode: string
cityCode: string
coordinates: { lat: number; lng: number }
```

Remove the duplicate `PlannerInput` interface from `domain/trip/types.ts` entirely — the canonical definition lives in `features/search/planner-input.ts` as the Zod-inferred type. Both `server/services/build-planner-view-model.ts` and `app/api/plan/route.ts` already import `PlannerInput` from `@/domain/trip/types` — update both to `import type { PlannerInput } from '@/features/search/planner-input'`.

Also update `getDefaultPlannerInput()` in `features/search/planner-input.ts` to return all fields including new ones:
```typescript
export function getDefaultPlannerInput(): PlannerInput {
  return {
    destinationQuery: '',
    destination: '',
    origin: 'Orlando',
    travelers: 2,
    nights: 6,
    budgetCap: undefined,
    preferDirectFlights: false,
    preferLocalFood: false,
    lowWalkingIntensity: false,
  }
}
```

- [ ] **Step 4: Run type test — expect pass**

```bash
npx vitest run tests/domain/types.test.ts
```
Expected: PASS

- [ ] **Step 5: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: 0 errors. Fix any import path errors for `PlannerInput` if they arise.

- [ ] **Step 6: Commit**

```bash
git add domain/trip/types.ts tests/domain/types.test.ts
git commit -m "feat: extend TripConstraint, DestinationSeed, DestinationMatch with live API fields"
```

---

### Task 3: Update Zod planner-input schema

**Files:**
- Modify: `features/search/planner-input.ts`

- [ ] **Step 1: Write failing test**

Create `tests/features/planner-input.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { parsePlannerSearchParams } from '@/features/search/planner-input'

describe('parsePlannerSearchParams', () => {
  it('parses budgetCap when present', () => {
    const result = parsePlannerSearchParams({
      destination: 'Manila',
      origin: 'Orlando',
      travelers: '2',
      nights: '7',
      budgetCap: '4000',
    })
    expect(result?.budgetCap).toBe(4000)
  })

  it('parses travelPreferences flags', () => {
    const result = parsePlannerSearchParams({
      destination: 'Manila',
      origin: 'Orlando',
      travelers: '2',
      nights: '7',
      preferDirectFlights: 'true',
      preferLocalFood: 'true',
      lowWalkingIntensity: 'false',
    })
    expect(result?.preferDirectFlights).toBe(true)
    expect(result?.preferLocalFood).toBe(true)
    expect(result?.lowWalkingIntensity).toBe(false)
  })

  it('defaults travelPreferences to false when absent', () => {
    const result = parsePlannerSearchParams({
      destination: 'Manila',
      origin: 'Orlando',
      travelers: '2',
      nights: '7',
    })
    expect(result?.preferDirectFlights).toBe(false)
    expect(result?.preferLocalFood).toBe(false)
    expect(result?.lowWalkingIntensity).toBe(false)
  })
})
```

- [ ] **Step 2: Run test — expect failures**

```bash
npx vitest run tests/features/planner-input.test.ts
```
Expected: FAIL — `budgetCap` and preference fields not recognized.

- [ ] **Step 3: Update `features/search/planner-input.ts`**

Replace the schema definition with:
```typescript
import { z } from "zod";

const plannerSearchSchema = z.object({
  destination: z.string().trim().min(1).optional(),
  origin: z.string().trim().min(2).default("Orlando"),
  travelers: z.coerce.number().int().min(1).max(12).default(2),
  nights: z.coerce.number().int().min(3).max(14).default(6),
  budgetCap: z.coerce.number().positive().optional(),
  preferDirectFlights: z.coerce.boolean().default(false),
  preferLocalFood: z.coerce.boolean().default(false),
  lowWalkingIntensity: z.coerce.boolean().default(false),
})

export type PlannerInput = z.infer<typeof plannerSearchSchema> & {
  destinationQuery: string
}
```

Update `parsePlannerSearchParams` to pass through the new fields and map `destination` → `destinationQuery`:
```typescript
export function parsePlannerSearchParams(searchParams: RawSearchParams): PlannerInput | null {
  const parsed = plannerSearchSchema.safeParse({
    destination: Array.isArray(searchParams.destination) ? searchParams.destination[0] : searchParams.destination,
    origin: Array.isArray(searchParams.origin) ? searchParams.origin[0] : searchParams.origin,
    travelers: Array.isArray(searchParams.travelers) ? searchParams.travelers[0] : searchParams.travelers,
    nights: Array.isArray(searchParams.nights) ? searchParams.nights[0] : searchParams.nights,
    budgetCap: Array.isArray(searchParams.budgetCap) ? searchParams.budgetCap[0] : searchParams.budgetCap,
    preferDirectFlights: Array.isArray(searchParams.preferDirectFlights) ? searchParams.preferDirectFlights[0] : searchParams.preferDirectFlights,
    preferLocalFood: Array.isArray(searchParams.preferLocalFood) ? searchParams.preferLocalFood[0] : searchParams.preferLocalFood,
    lowWalkingIntensity: Array.isArray(searchParams.lowWalkingIntensity) ? searchParams.lowWalkingIntensity[0] : searchParams.lowWalkingIntensity,
  })

  if (!parsed.success || !parsed.data.destination) return null

  return {
    ...parsed.data,
    destinationQuery: parsed.data.destination,
  }
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx vitest run tests/features/planner-input.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add features/search/planner-input.ts tests/features/planner-input.test.ts
git commit -m "feat: add budgetCap and travelPreferences to planner input schema"
```

---

### Task 4: Add api_cache table to Drizzle schema and generate migration

**Files:**
- Modify: `drizzle/schema.ts`
- Create: `drizzle/migrations/0001_add_api_cache.sql` (generated)

- [ ] **Step 1: Add `apiCache` table to `drizzle/schema.ts`**

```typescript
export const apiCache = sqliteTable('api_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cacheKey: text('cache_key').notNull().unique(),
  payload: text('payload').notNull(),
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull(),
  ttlHours: integer('ttl_hours').notNull().default(2),
})

export type ApiCacheRecord = typeof apiCache.$inferSelect
export type NewApiCacheRecord = typeof apiCache.$inferInsert
```

- [ ] **Step 2: Generate migration**

```bash
npm run db:generate
```
Expected: creates `drizzle/migrations/0001_add_api_cache.sql` with a `CREATE TABLE api_cache` statement.

- [ ] **Step 3: Push migration to local DB**

```bash
npm run db:push
```
Expected: "Changes applied"

- [ ] **Step 4: Commit**

```bash
git add drizzle/schema.ts drizzle/migrations/
git commit -m "feat: add api_cache table for Amadeus response caching"
```

---

### Task 5: Build cache service

**Files:**
- Create: `server/services/cache-service.ts`
- Create: `tests/server/cache-service.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/server/cache-service.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { CacheService } from '@/server/services/cache-service'

// Use an in-memory SQLite DB for tests
// We test the contract only — actual DB is handled by integration

describe('CacheService', () => {
  it('exports get, set, invalidate functions', () => {
    expect(typeof CacheService.get).toBe('function')
    expect(typeof CacheService.set).toBe('function')
    expect(typeof CacheService.invalidate).toBe('function')
  })

  it('buildCacheKey formats keys correctly', () => {
    const { buildFlightCacheKey, buildHotelListCacheKey, buildHotelOffersCacheKey } = CacheService
    expect(buildFlightCacheKey('MCO', 'MNL', '2026-06-01', '2026-06-08', 2, false))
      .toBe('flights:MCO:MNL:2026-06-01:2026-06-08:2:false')
    expect(buildHotelListCacheKey('MNL'))
      .toBe('hotel-list:MNL')
    expect(buildHotelOffersCacheKey('MNL', '2026-06-01', '2026-06-08', 1))
      .toBe('hotel-offers:MNL:2026-06-01:2026-06-08:1')
  })
})
```

- [ ] **Step 2: Run test — expect failures**

```bash
npx vitest run tests/server/cache-service.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create `server/services/cache-service.ts`**

Note: `db` from `@/lib/db/client` is nullable — all functions guard against this.

```typescript
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
```

- [ ] **Step 4: Note — `db` can be null (no DB connection in some envs)**

The actual db client is at `lib/db/client.ts` and `db` is typed as `ReturnType<typeof drizzle> | null`. The cache-service import and null-guard are already written correctly in Step 3 above — the `if (!db)` check handles the null case.

- [ ] **Step 5: Run test — expect pass**

```bash
npx vitest run tests/server/cache-service.test.ts
```
Expected: PASS (2 tests)

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add server/services/cache-service.ts tests/server/cache-service.test.ts
git commit -m "feat: add cache service with TTL-aware get/set/invalidate"
```

---

## Chunk 2: IATA Map + Philippines Seeds + Update Existing Seeds

### Task 6: Static IATA city map

**Files:**
- Create: `domain/trip/data/iata-city-map.ts`
- Create: `tests/domain/iata-city-map.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/domain/iata-city-map.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { resolveIataCode } from '@/domain/trip/data/iata-city-map'

describe('resolveIataCode', () => {
  it('resolves Manila to MNL', () => expect(resolveIataCode('Manila')).toBe('MNL'))
  it('resolves Cebu to CEB', () => expect(resolveIataCode('Cebu')).toBe('CEB'))
  it('resolves Davao to DVO', () => expect(resolveIataCode('Davao')).toBe('DVO'))
  it('resolves Sorsogon to LGP', () => expect(resolveIataCode('Sorsogon')).toBe('LGP'))
  it('resolves Naga to WNP', () => expect(resolveIataCode('Naga')).toBe('WNP'))
  it('resolves Tokyo to HND', () => expect(resolveIataCode('Tokyo')).toBe('HND'))
  it('resolves Paris to CDG', () => expect(resolveIataCode('Paris')).toBe('CDG'))
  it('resolves Bangkok to BKK', () => expect(resolveIataCode('Bangkok')).toBe('BKK'))
  it('resolves Bali to DPS', () => expect(resolveIataCode('Bali')).toBe('DPS'))
  it('is case-insensitive', () => expect(resolveIataCode('manila')).toBe('MNL'))
  it('returns null for unknown city', () => expect(resolveIataCode('Nonexistentcity')).toBeNull())
})
```

- [ ] **Step 2: Run test — expect failures**

```bash
npx vitest run tests/domain/iata-city-map.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create `domain/trip/data/iata-city-map.ts`**

```typescript
// Static city-name → IATA airport code mapping
// Covers seeded destinations + common global destinations
// For cities not found here, fall back to Amadeus Airport Search API

const CITY_TO_IATA: Record<string, string> = {
  // Philippines
  'manila': 'MNL',
  'metro manila': 'MNL',
  'boracay': 'MPH',
  'el nido': 'ENI',
  'palawan': 'PPS',
  'puerto princesa': 'PPS',
  'bohol': 'TAG',
  'tagbilaran': 'TAG',
  'siargao': 'IAO',
  'cebu': 'CEB',
  'mactan': 'CEB',
  'davao': 'DVO',
  'sorsogon': 'LGP',
  'legazpi': 'LGP',
  'naga': 'WNP',
  'naga city': 'WNP',
  'iloilo': 'ILO',
  'bacolod': 'BCD',
  'cagayan de oro': 'CGY',
  'zamboanga': 'ZAM',
  'clark': 'CRK',
  'angeles': 'CRK',
  // Japan
  'tokyo': 'HND',
  'osaka': 'KIX',
  'kyoto': 'ITM',
  'sapporo': 'CTS',
  'fukuoka': 'FUK',
  'nagoya': 'NGO',
  // USA
  'orlando': 'MCO',
  'new york': 'JFK',
  'nyc': 'JFK',
  'los angeles': 'LAX',
  'san francisco': 'SFO',
  'chicago': 'ORD',
  'miami': 'MIA',
  'las vegas': 'LAS',
  'honolulu': 'HNL',
  'waikiki': 'HNL',
  'seattle': 'SEA',
  'boston': 'BOS',
  'atlanta': 'ATL',
  // Europe
  'paris': 'CDG',
  'london': 'LHR',
  'barcelona': 'BCN',
  'madrid': 'MAD',
  'rome': 'FCO',
  'milan': 'MXP',
  'amsterdam': 'AMS',
  'berlin': 'BER',
  'lisbon': 'LIS',
  'porto': 'OPO',
  'athens': 'ATH',
  'zurich': 'ZRH',
  'vienna': 'VIE',
  'prague': 'PRG',
  'budapest': 'BUD',
  'istanbul': 'IST',
  'dubrovnik': 'DBV',
  // Southeast Asia
  'bangkok': 'BKK',
  'bali': 'DPS',
  'denpasar': 'DPS',
  'singapore': 'SIN',
  'kuala lumpur': 'KUL',
  'kl': 'KUL',
  'ho chi minh': 'SGN',
  'saigon': 'SGN',
  'hanoi': 'HAN',
  'da nang': 'DAD',
  'phuket': 'HKT',
  'chiang mai': 'CNX',
  'siem reap': 'REP',
  'phnom penh': 'PNH',
  'yangon': 'RGN',
  'jakarta': 'CGK',
  'lombok': 'LOP',
  'flores': 'ENE',
  // East Asia
  'hong kong': 'HKG',
  'taipei': 'TPE',
  'seoul': 'ICN',
  'busan': 'PUS',
  'shanghai': 'PVG',
  'beijing': 'PEK',
  // South Asia
  'dubai': 'DXB',
  'abu dhabi': 'AUH',
  'delhi': 'DEL',
  'new delhi': 'DEL',
  'mumbai': 'BOM',
  'colombo': 'CMB',
  'maldives': 'MLE',
  'male': 'MLE',
  'kathmandu': 'KTM',
  // Americas
  'cancun': 'CUN',
  'mexico city': 'MEX',
  'bogota': 'BOG',
  'lima': 'LIM',
  'buenos aires': 'EZE',
  'rio de janeiro': 'GIG',
  'rio': 'GIG',
  'sao paulo': 'GRU',
  'toronto': 'YYZ',
  'vancouver': 'YVR',
  'montreal': 'YUL',
  // Africa & Oceania
  'sydney': 'SYD',
  'melbourne': 'MEL',
  'auckland': 'AKL',
  'johannesburg': 'JNB',
  'cape town': 'CPT',
  'nairobi': 'NBO',
  'cairo': 'CAI',
  'casablanca': 'CMN',
}

export function resolveIataCode(cityName: string): string | null {
  return CITY_TO_IATA[cityName.toLowerCase().trim()] ?? null
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx vitest run tests/domain/iata-city-map.test.ts
```
Expected: PASS (11 tests)

- [ ] **Step 5: Commit**

```bash
git add domain/trip/data/iata-city-map.ts tests/domain/iata-city-map.test.ts
git commit -m "feat: add static IATA city map for destination resolution"
```

---

### Task 7: Update existing seeds with cityCode + coordinates

**Files:**
- Modify: `domain/trip/data/core-destinations.ts`
- Modify: `domain/trip/data/philippines-destinations.ts`
- Modify: `domain/trip/data/philippines-destinations-part-one.ts`
- Modify: `domain/trip/data/philippines-destinations-part-two.ts`

- [ ] **Step 1: Read each file first, then add `cityCode` and `coordinates` to every seed object found**

Run before editing:
```bash
cat "/c/Users/lily7/Claude Code Projects/VoyageIQ/domain/trip/data/core-destinations.ts" | grep "slug:"
cat "/c/Users/lily7/Claude Code Projects/VoyageIQ/domain/trip/data/philippines-destinations.ts" | grep "slug:"
```
This confirms exactly which seed objects exist before adding fields.

For core destinations, add after `airportCode`:
```typescript
// Tokyo
cityCode: 'TYO',
coordinates: { lat: 35.6762, lng: 139.6503 },

// Paris
cityCode: 'PAR',
coordinates: { lat: 48.8566, lng: 2.3522 },

// Barcelona
cityCode: 'BCN',
coordinates: { lat: 41.3851, lng: 2.1734 },

// London
cityCode: 'LON',
coordinates: { lat: 51.5074, lng: -0.1278 },

// NYC
cityCode: 'NYC',
coordinates: { lat: 40.7128, lng: -74.0060 },
```

For Philippines destinations (Boracay, El Nido, Bohol, Siargao), add:
```typescript
// Boracay
cityCode: 'MPH',
coordinates: { lat: 11.9674, lng: 121.9248 },

// El Nido
cityCode: 'ENI',
coordinates: { lat: 11.1784, lng: 119.4053 },

// Bohol
cityCode: 'TAG',
coordinates: { lat: 9.6500, lng: 123.8538 },

// Siargao
cityCode: 'IAO',
coordinates: { lat: 9.8485, lng: 126.0458 },
```

- [ ] **Step 2: Run typecheck — expect 0 errors**

```bash
npx tsc --noEmit
```
Expected: 0 errors. If seeds have duplicate declarations across the part-one/part-two files, apply the same additions there.

- [ ] **Step 3: Commit**

```bash
git add domain/trip/data/
git commit -m "feat: add cityCode and coordinates to all existing destination seeds"
```

---

### Task 8: Add 5 new Philippines destination seeds

**Files:**
- Create: `domain/trip/data/philippines-manila.ts`
- Create: `domain/trip/data/philippines-sorsogon.ts`
- Create: `domain/trip/data/philippines-naga.ts`
- Create: `domain/trip/data/philippines-cebu.ts`
- Create: `domain/trip/data/philippines-davao.ts`
- Modify: `domain/trip/destination-catalog.ts`

- [ ] **Step 1: Create `domain/trip/data/philippines-manila.ts`**

```typescript
import { DestinationSeed } from '@/domain/trip/types'

export const manilaDestination: DestinationSeed = {
  slug: 'manila',
  name: 'Manila',
  country: 'Philippines',
  regionLabel: 'Intramuros to BGC',
  airportCode: 'MNL',
  cityCode: 'MNL',
  coordinates: { lat: 14.5995, lng: 120.9842 },
  heroTitle: 'Historic capital with layered neighborhoods, world-class lechon, and Binondo street food',
  summary: 'Manila works when you want a trip that balances Filipino heritage, urban energy, and one of Asia\'s best food cities without leaving the main island.',
  recommendedWindow: 'November to February (dry season)',
  aliases: ['manila', 'metro manila', 'ncr', 'makati', 'bgc', 'intramuros', 'binondo', 'malate', 'ermita'],
  averageTransitPerDay: 12,
  mapNote: 'Primary movement is Grab (ride-hailing) between Makati, BGC, Intramuros, and Binondo. MRT useful for north-south trips.',
  flights: {
    lean: {
      airline: 'Korean Air + Philippine Airlines',
      departWindow: 'Monday evening',
      arriveWindow: 'Wednesday afternoon',
      durationHours: 22,
      stops: 1,
      layover: 'Seoul (ICN)',
      cabin: 'Economy',
      bookingTip: 'Book 6–8 weeks out. Korean Air via Seoul is consistently the best value routing from Orlando to Manila.',
      baseFarePerTraveler: 980,
    },
    balanced: {
      airline: 'Japan Airlines + Philippine Airlines',
      departWindow: 'Tuesday morning',
      arriveWindow: 'Wednesday evening',
      durationHours: 20,
      stops: 1,
      layover: 'Tokyo (NRT)',
      cabin: 'Economy Plus',
      bookingTip: 'NRT layover under 4 hours keeps the trip manageable. JAL has reliable luggage handling.',
      baseFarePerTraveler: 1180,
    },
    elevated: {
      airline: 'Cathay Pacific',
      departWindow: 'Wednesday afternoon',
      arriveWindow: 'Friday morning',
      durationHours: 19,
      stops: 1,
      layover: 'Hong Kong (HKG)',
      cabin: 'Premium economy',
      bookingTip: 'Cathay premium economy is notably better than US carriers. HKG layover has excellent airport facilities.',
      baseFarePerTraveler: 1560,
    },
    signature: {
      airline: 'Singapore Airlines',
      departWindow: 'Thursday morning',
      arriveWindow: 'Saturday afternoon',
      durationHours: 21,
      stops: 1,
      layover: 'Singapore (SIN)',
      cabin: 'Business',
      bookingTip: 'Singapore Airlines business class sets the standard for this route. SIN Changi layover is itself worth experiencing.',
      baseFarePerTraveler: 3200,
    },
  },
  stays: {
    lean: {
      name: 'Pension Natividad',
      style: 'Family pension house',
      address: '1690 M. Adriatico St, Malate, Manila 1004',
      nightlyRate: 38,
      neighborhood: 'Malate',
      whyItWorks: 'Clean, family-run, walking distance to Rizal Park and Manila Bay. Best value in the city.',
    },
    balanced: {
      name: 'Go Hotel Ortigas',
      style: 'Budget business hotel',
      address: 'Pioneer St, Mandaluyong, 1550 Metro Manila',
      nightlyRate: 68,
      neighborhood: 'Ortigas Center',
      whyItWorks: 'Reliable chain with MRT access, clean rooms, and proximity to Megamall and shopping.',
    },
    elevated: {
      name: 'Ascott BGC',
      style: 'Serviced apartment',
      address: '5th Ave cor 28th St, Bonifacio Global City, Taguig',
      nightlyRate: 145,
      neighborhood: 'BGC',
      whyItWorks: 'Full-service apartment living in Manila\'s cleanest and safest district. Kitchen included.',
    },
    signature: {
      name: 'The Peninsula Manila',
      style: 'Landmark luxury hotel',
      address: 'Cor Ayala & Makati Ave, Makati, 1226 Metro Manila',
      nightlyRate: 320,
      neighborhood: 'Makati CBD',
      whyItWorks: 'Iconic Manila institution with impeccable service. Lobby afternoon tea is itself an experience.',
    },
  },
  dining: [
    {
      name: 'Aristocrat Restaurant',
      cuisine: 'Classic Filipino',
      address: '432 San Andres St, Malate, Manila',
      estimatedPerPerson: 8,
      signatureOrder: 'Barbecue chicken, java rice, kare-kare',
      fit: ['lean', 'balanced'],
    },
    {
      name: 'Binondo Food Walk (self-guided)',
      cuisine: 'Filipino-Chinese street food',
      address: 'Ongpin St, Binondo, Manila',
      estimatedPerPerson: 6,
      signatureOrder: 'Siopao, hopia, pancit, tikoy, taho',
      fit: ['lean', 'balanced'],
    },
    {
      name: 'Max\'s Restaurant',
      cuisine: 'Classic Filipino',
      address: 'Multiple locations across Metro Manila',
      estimatedPerPerson: 10,
      signatureOrder: 'Fried chicken, sinigang, pancit bihon',
      fit: ['lean', 'balanced', 'elevated'],
    },
    {
      name: 'Milky Way Cafe',
      cuisine: 'Heritage Filipino',
      address: '900 Arnaiz Ave, Makati',
      estimatedPerPerson: 18,
      signatureOrder: 'Lechon kawali, crispy pata, bibingka',
      fit: ['balanced', 'elevated'],
    },
    {
      name: 'Antonio\'s (BGC)',
      cuisine: 'Modern Filipino fine dining',
      address: '6th Ave cor 26th St, BGC, Taguig',
      estimatedPerPerson: 45,
      signatureOrder: 'Wagyu beef kare-kare, tasting menu',
      fit: ['elevated', 'signature'],
    },
  ],
  activities: [
    {
      name: 'Intramuros Walking Tour',
      address: 'General Luna St, Intramuros, Manila',
      estimatedPerPerson: 8,
      durationHours: 3,
      travelMinutesFromCenter: 20,
      summary: 'Walled city tour covering Fort Santiago, Manila Cathedral, and Baluarte de San Diego. Best with a local guide.',
      fit: ['lean', 'balanced', 'elevated', 'signature'],
    },
    {
      name: 'Binondo Chinatown Food Walk',
      address: 'Plaza Santa Cruz, Binondo, Manila',
      estimatedPerPerson: 15,
      durationHours: 2.5,
      travelMinutesFromCenter: 15,
      summary: 'World\'s oldest Chinatown. Walk Ongpin St eating siopao, hopia, and fresh lumpia from hole-in-the-wall stalls.',
      fit: ['lean', 'balanced', 'elevated'],
    },
    {
      name: 'Manila Bay Sunset',
      address: 'Roxas Blvd, Ermita, Manila',
      estimatedPerPerson: 0,
      durationHours: 1.5,
      travelMinutesFromCenter: 10,
      summary: 'Free. One of Southeast Asia\'s most famous sunsets. Walk the baywalk from the Sofitel to SM Mall of Asia.',
      fit: ['lean', 'balanced', 'elevated', 'signature'],
    },
    {
      name: 'Rizal Park & National Museum',
      address: 'Roxas Blvd, Ermita, Manila',
      estimatedPerPerson: 2,
      durationHours: 2.5,
      travelMinutesFromCenter: 10,
      summary: 'Philippines\' national park + free national museum complex. Filipino history from pre-colonial to present.',
      fit: ['lean', 'balanced', 'elevated'],
    },
    {
      name: 'BGC Street Art Walk',
      address: 'Bonifacio Global City, Taguig',
      estimatedPerPerson: 0,
      durationHours: 1.5,
      travelMinutesFromCenter: 35,
      summary: 'World-class outdoor murals across BGC\'s blocks. Combine with dinner at one of BGC\'s Filipino restaurants.',
      fit: ['balanced', 'elevated', 'signature'],
    },
  ],
}
```

- [ ] **Step 2: Create `domain/trip/data/philippines-sorsogon.ts`**

```typescript
import { DestinationSeed } from '@/domain/trip/types'

export const sorsogonDestination: DestinationSeed = {
  slug: 'sorsogon',
  name: 'Sorsogon',
  country: 'Philippines',
  regionLabel: 'Bicol Peninsula',
  airportCode: 'LGP',
  cityCode: 'LGP',
  coordinates: { lat: 12.9742, lng: 124.0058 },
  heroTitle: 'Slow-paced Bicol province with whale sharks, Bicol Express, and fresh coastal seafood',
  summary: 'Sorsogon works when you want the real Philippines — no tourist crowds, Bicol food at its source, and whale shark encounters in Donsol without the resort markup.',
  recommendedWindow: 'November to June (whale shark season November–May)',
  aliases: ['sorsogon', 'donsol', 'bulusan', 'bicol', 'sorsogon city'],
  averageTransitPerDay: 8,
  mapNote: 'Van terminal in Sorsogon City connects to Donsol (1hr) and Bulusan (1.5hr). Tricycles for in-town. Rent a habal-habal for coastal roads.',
  flights: {
    lean: {
      airline: 'Cebu Pacific to Manila + van transfer',
      departWindow: 'Tuesday morning',
      arriveWindow: 'Wednesday evening',
      durationHours: 26,
      stops: 2,
      layover: 'Manila (MNL) + ground transfer via Legazpi',
      cabin: 'Economy',
      bookingTip: 'Fly to Legazpi (LGP) if available — otherwise fly Manila and take the 9-hour bus to Sorsogon. Bus is comfortable and cheap.',
      baseFarePerTraveler: 850,
    },
    balanced: {
      airline: 'Philippine Airlines to Legazpi',
      departWindow: 'Wednesday morning',
      arriveWindow: 'Thursday afternoon',
      durationHours: 22,
      stops: 1,
      layover: 'Manila (MNL)',
      cabin: 'Economy',
      bookingTip: 'Fly MNL → LGP (Legazpi) directly with PAL or Cebu Pacific. 45-min flight. Then 1hr van to Sorsogon.',
      baseFarePerTraveler: 940,
    },
    elevated: {
      airline: 'Philippine Airlines to Legazpi',
      departWindow: 'Thursday morning',
      arriveWindow: 'Friday afternoon',
      durationHours: 20,
      stops: 1,
      layover: 'Seoul or Tokyo',
      cabin: 'Economy Plus',
      bookingTip: 'Book international to Manila, then same-day domestic to Legazpi. PAL connects well within 3–4 hours.',
      baseFarePerTraveler: 1150,
    },
    signature: {
      airline: 'Singapore Airlines + PAL',
      departWindow: 'Thursday morning',
      arriveWindow: 'Friday evening',
      durationHours: 22,
      stops: 2,
      layover: 'Singapore (SIN) + Manila',
      cabin: 'Business to Manila, Economy domestic',
      bookingTip: 'Fly business class international, use the Mabuhay Lounge in NAIA for the Manila connection.',
      baseFarePerTraveler: 2800,
    },
  },
  stays: {
    lean: {
      name: 'Fernandos Hotel',
      style: 'Provincial inn',
      address: 'Penaranda St, Sorsogon City',
      nightlyRate: 22,
      neighborhood: 'Sorsogon City Center',
      whyItWorks: 'Clean, friendly, local. Central location with easy access to van terminals.',
    },
    balanced: {
      name: 'Villa Kasanggayahan Guesthouse',
      style: 'Family guesthouse',
      address: 'Donsol, Sorsogon',
      nightlyRate: 45,
      neighborhood: 'Donsol',
      whyItWorks: 'Stay close to whale shark country. Home-cooked Bicol breakfast included.',
    },
    elevated: {
      name: 'Vitton Beach Resort',
      style: 'Beachfront resort',
      address: 'Subic Beach, Matnog, Sorsogon',
      nightlyRate: 85,
      neighborhood: 'Matnog',
      whyItWorks: 'Pacific-facing beach resort. Remote, peaceful, exceptional seafood from the boat to your plate.',
    },
    signature: {
      name: 'Hacienda Escudero (Quezon) or Ticao Island Boutique Lodge',
      style: 'Boutique nature lodge',
      address: 'Ticao Island, Masbate (accessible from Sorsogon)',
      nightlyRate: 160,
      neighborhood: 'Ticao Island',
      whyItWorks: 'Exclusive island lodge. Manta ray snorkeling in adjacent Manta Bowl. Fully private experience.',
    },
  },
  dining: [
    {
      name: 'Bicol Express (any karinderya)',
      cuisine: 'Bicol street food',
      address: 'Public Market, Sorsogon City',
      estimatedPerPerson: 3,
      signatureOrder: 'Bicol express, laing, pinangat, rice',
      fit: ['lean', 'balanced'],
    },
    {
      name: 'Kagayhaan Grill',
      cuisine: 'Fresh grilled seafood',
      address: 'Rizal St, Sorsogon City',
      estimatedPerPerson: 7,
      signatureOrder: 'Grilled squid, fresh tuna, inihaw na liempo',
      fit: ['lean', 'balanced', 'elevated'],
    },
    {
      name: 'Donsol Bay Floating Restaurant',
      cuisine: 'Filipino seafood',
      address: 'Donsol River, Donsol',
      estimatedPerPerson: 10,
      signatureOrder: 'Sizzling bangus, ginataang hipon, fresh coconut',
      fit: ['balanced', 'elevated'],
    },
    {
      name: 'Subic Bay Catch of the Day',
      cuisine: 'Fresh catch — boat to table',
      address: 'Subic Beach, Matnog',
      estimatedPerPerson: 12,
      signatureOrder: 'Whatever the fishermen brought in. Grilled or sinigang.',
      fit: ['elevated', 'signature'],
    },
  ],
  activities: [
    {
      name: 'Donsol Whale Shark Snorkeling',
      address: 'Donsol, Sorsogon',
      estimatedPerPerson: 40,
      durationHours: 4,
      travelMinutesFromCenter: 60,
      summary: 'Philippines\' most ethical whale shark encounter — no touching, no riding, strict guide rules. Best November to May.',
      fit: ['lean', 'balanced', 'elevated', 'signature'],
    },
    {
      name: 'Bulusan Volcano National Park',
      address: 'Bulusan, Sorsogon',
      estimatedPerPerson: 5,
      durationHours: 4,
      travelMinutesFromCenter: 90,
      summary: 'Crater lake hike through lush rainforest. Active volcano — check advisory before visiting.',
      fit: ['lean', 'balanced', 'elevated'],
    },
    {
      name: 'Rizal Beach and Sunset',
      address: 'Gubat, Sorsogon',
      estimatedPerPerson: 0,
      durationHours: 2,
      travelMinutesFromCenter: 30,
      summary: 'Long Pacific-facing beach. Empty most of the year. Best surfing in the region during monsoon season.',
      fit: ['lean', 'balanced', 'elevated', 'signature'],
    },
    {
      name: 'Casiguran Caves',
      address: 'Casiguran, Sorsogon',
      estimatedPerPerson: 8,
      durationHours: 3,
      travelMinutesFromCenter: 45,
      summary: 'Cathedral cave with natural light shafts. Local guide required — arrange through municipal tourism office.',
      fit: ['balanced', 'elevated'],
    },
  ],
}
```

- [ ] **Step 3: Create `domain/trip/data/philippines-naga.ts`**

```typescript
import { DestinationSeed } from '@/domain/trip/types'

export const nagaDestination: DestinationSeed = {
  slug: 'naga',
  name: 'Naga City',
  country: 'Philippines',
  regionLabel: 'Camarines Sur, Bicol',
  airportCode: 'WNP',
  cityCode: 'WNP',
  coordinates: { lat: 13.6192, lng: 123.1814 },
  heroTitle: 'University city with Bicol\'s best restaurant scene, Peñafrancia devotion, and island daytrips',
  summary: 'Naga works when you want a real Philippine city experience — not a resort, not a capital — with serious Bicol food, religious heritage, and Caramoan Islands an hour away.',
  recommendedWindow: 'October to May (festival season in September)',
  aliases: ['naga', 'naga city', 'camarines sur', 'cam sur', 'peñafrancia', 'caramoan'],
  averageTransitPerDay: 10,
  mapNote: 'Tricycles and Grab cover the city. Buses and vans to Caramoan from Naga terminal (2.5hrs). Airport WNP 15 minutes from city.',
  flights: {
    lean: {
      airline: 'Cebu Pacific MNL → WNP',
      departWindow: 'Tuesday morning',
      arriveWindow: 'Wednesday afternoon',
      durationHours: 20,
      stops: 1,
      layover: 'Manila (MNL)',
      cabin: 'Economy',
      bookingTip: 'Fly to Manila first, then 45-min domestic flight to Naga (WNP). Book together for baggage convenience.',
      baseFarePerTraveler: 860,
    },
    balanced: {
      airline: 'Philippine Airlines to Naga',
      departWindow: 'Wednesday morning',
      arriveWindow: 'Thursday afternoon',
      durationHours: 20,
      stops: 1,
      layover: 'Manila (MNL)',
      cabin: 'Economy',
      bookingTip: 'PAL domestic leg to Naga is short and reliable. Book 6 weeks out.',
      baseFarePerTraveler: 960,
    },
    elevated: {
      airline: 'Cathay Pacific + Cebu Pacific domestic',
      departWindow: 'Wednesday afternoon',
      arriveWindow: 'Thursday evening',
      durationHours: 20,
      stops: 2,
      layover: 'Hong Kong + Manila',
      cabin: 'Economy Plus to HKG, Economy domestic',
      bookingTip: 'Comfortable international leg, easy Manila connection to Naga.',
      baseFarePerTraveler: 1200,
    },
    signature: {
      airline: 'Singapore Airlines + PAL',
      departWindow: 'Thursday morning',
      arriveWindow: 'Friday afternoon',
      durationHours: 21,
      stops: 2,
      layover: 'Singapore + Manila',
      cabin: 'Business to Manila, Economy domestic',
      bookingTip: 'Mabuhay Lounge in Manila for the connection. Naga is 45 minutes from NAIA.',
      baseFarePerTraveler: 2850,
    },
  },
  stays: {
    lean: {
      name: 'Abella Pension House',
      style: 'Family pension',
      address: 'J. Miranda Ave, Naga City',
      nightlyRate: 20,
      neighborhood: 'City Center',
      whyItWorks: 'Walking distance to Peñafrancia Shrine, public market, and Waway\'s restaurant.',
    },
    balanced: {
      name: 'Hotel Leonor Naga',
      style: 'City hotel',
      address: 'Elias Angeles St, Naga City',
      nightlyRate: 52,
      neighborhood: 'Naga City Center',
      whyItWorks: 'Clean mid-range option with breakfast. Close to dining, transport terminals, and downtown.',
    },
    elevated: {
      name: 'Crown Regency Hotel Naga',
      style: 'Mid-range hotel',
      address: 'Magsaysay Ave, Naga City',
      nightlyRate: 95,
      neighborhood: 'Naga City',
      whyItWorks: 'Best amenities in the city. Pool, restaurant, and airport shuttle service.',
    },
    signature: {
      name: 'Casa Simeon Boutique Hotel',
      style: 'Heritage boutique hotel',
      address: 'Liwanag Subdivision, Naga City',
      nightlyRate: 140,
      neighborhood: 'Residential Naga',
      whyItWorks: 'Heritage home converted to boutique hotel. Curated interior, excellent breakfast, feels like a private residence.',
    },
  },
  dining: [
    {
      name: 'Waway\'s Restaurant',
      cuisine: 'Bicol home cooking',
      address: 'Panganiban Drive, Naga City',
      estimatedPerPerson: 7,
      signatureOrder: 'Bicol express, laing, pinangat sa gata, sinigang',
      fit: ['lean', 'balanced'],
    },
    {
      name: 'Naga City Public Market (karinderya row)',
      cuisine: 'Street food & karinderya',
      address: 'Central Market, Naga City',
      estimatedPerPerson: 3,
      signatureOrder: 'Arroz caldo, goto, pili nuts, bibingka',
      fit: ['lean', 'balanced'],
    },
    {
      name: 'Josefina\'s Bicol Kitchen',
      cuisine: 'Regional Bicol',
      address: 'Peñafrancia Ave, Naga City',
      estimatedPerPerson: 9,
      signatureOrder: 'Kandingga, sinantolan, Bicol express',
      fit: ['balanced', 'elevated'],
    },
    {
      name: 'Bob\'s Place',
      cuisine: 'Filipino comfort food',
      address: 'Magsaysay Ave, Naga City',
      estimatedPerPerson: 11,
      signatureOrder: 'Crispy pata, chicken inasal, halo-halo',
      fit: ['balanced', 'elevated', 'signature'],
    },
  ],
  activities: [
    {
      name: 'Peñafrancia Shrine & Basilica',
      address: 'Peñafrancia Ave, Naga City',
      estimatedPerPerson: 0,
      durationHours: 1.5,
      travelMinutesFromCenter: 5,
      summary: 'National shrine and Marian devotion center. Grandest festival in the Philippines every September. Beautiful architecture year-round.',
      fit: ['lean', 'balanced', 'elevated', 'signature'],
    },
    {
      name: 'Caramoan Islands Daytrip',
      address: 'Caramoan, Camarines Sur (from Naga)',
      estimatedPerPerson: 45,
      durationHours: 10,
      travelMinutesFromCenter: 150,
      summary: 'Survivor Philippines filming location. Island-hop between limestone karsts and white beaches. Full day trip from Naga.',
      fit: ['lean', 'balanced', 'elevated', 'signature'],
    },
    {
      name: 'Mt. Isarog National Park',
      address: 'Pili, Camarines Sur (near Naga)',
      estimatedPerPerson: 15,
      durationHours: 6,
      travelMinutesFromCenter: 30,
      summary: 'Active volcano trekking through primary forest. Short peak at 1966m. Local guide required.',
      fit: ['balanced', 'elevated'],
    },
    {
      name: 'Naga City Food Walk (self-guided)',
      address: 'City Center, Naga',
      estimatedPerPerson: 12,
      durationHours: 2.5,
      travelMinutesFromCenter: 0,
      summary: 'Walk from the public market to Waway\'s to pili nut stalls to a karinderya. Bicol has the most complex regional cuisine in the Philippines.',
      fit: ['lean', 'balanced', 'elevated'],
    },
  ],
}
```

- [ ] **Step 4: Create `domain/trip/data/philippines-cebu.ts`**

```typescript
import { DestinationSeed } from '@/domain/trip/types'

export const cebuDestination: DestinationSeed = {
  slug: 'cebu',
  name: 'Cebu',
  country: 'Philippines',
  regionLabel: 'Visayas',
  airportCode: 'CEB',
  cityCode: 'CEB',
  coordinates: { lat: 10.3157, lng: 123.8854 },
  heroTitle: 'Philippines\' lechon capital with whale sharks, canyoneering, and Magellan\'s Cross',
  summary: 'Cebu works when you want a trip that mixes urban Philippine life, serious food culture, and easy beach/adventure access — all from one central base.',
  recommendedWindow: 'November to May (dry season)',
  aliases: ['cebu', 'cebu city', 'mactan', 'visayas', 'oslob', 'moalboal', 'kawasan'],
  averageTransitPerDay: 14,
  mapNote: 'Grab covers Cebu City and Mactan. Rental car or van hire for south Cebu (Oslob, Kawasan). Cebu South Bus Terminal for budget transport.',
  flights: {
    lean: {
      airline: 'Korean Air or Cebu Pacific via Manila',
      departWindow: 'Tuesday morning',
      arriveWindow: 'Wednesday afternoon',
      durationHours: 22,
      stops: 1,
      layover: 'Seoul (ICN) or Manila (MNL)',
      cabin: 'Economy',
      bookingTip: 'Cebu Pacific has direct Manila–Cebu flights every hour. Book the full trip through one airline for simpler baggage.',
      baseFarePerTraveler: 920,
    },
    balanced: {
      airline: 'Japan Airlines + Cebu Pacific',
      departWindow: 'Wednesday morning',
      arriveWindow: 'Thursday afternoon',
      durationHours: 20,
      stops: 1,
      layover: 'Tokyo (NRT)',
      cabin: 'Economy Plus',
      bookingTip: 'Some routings fly direct into Mactan-Cebu from Tokyo or Seoul — check before booking a Manila connection.',
      baseFarePerTraveler: 1100,
    },
    elevated: {
      airline: 'Cathay Pacific direct to Cebu',
      departWindow: 'Thursday afternoon',
      arriveWindow: 'Saturday morning',
      durationHours: 18,
      stops: 1,
      layover: 'Hong Kong (HKG)',
      cabin: 'Premium economy',
      bookingTip: 'HKG → CEB is a short and comfortable leg. Premium economy worth it for the transpacific portion.',
      baseFarePerTraveler: 1480,
    },
    signature: {
      airline: 'Singapore Airlines to Cebu',
      departWindow: 'Thursday morning',
      arriveWindow: 'Friday afternoon',
      durationHours: 20,
      stops: 1,
      layover: 'Singapore (SIN)',
      cabin: 'Business',
      bookingTip: 'Singapore Airlines has direct SIN–CEB flights. Business class seats + Changi lounge justify the premium.',
      baseFarePerTraveler: 3100,
    },
  },
  stays: {
    lean: {
      name: 'Z Hostel Cebu',
      style: 'Social hostel',
      address: 'Gaisano Country Mall area, Banawa, Cebu City',
      nightlyRate: 18,
      neighborhood: 'Cebu City',
      whyItWorks: 'Rooftop pool, social atmosphere, walkable to IT Park and food spots.',
    },
    balanced: {
      name: 'Cebu Parklane International Hotel',
      style: 'City hotel',
      address: 'N. Escario St, Camputhaw, Cebu City',
      nightlyRate: 65,
      neighborhood: 'Cebu City Center',
      whyItWorks: 'Solid city hotel with pool. Walking distance to Colon St, Fuente Osmeña, and food strip.',
    },
    elevated: {
      name: 'Radisson Blu Cebu',
      style: 'International hotel',
      address: 'Sergio Osmeña Blvd, Cebu City',
      nightlyRate: 130,
      neighborhood: 'Cebu City South',
      whyItWorks: 'Reliable international standard. Excellent breakfast buffet with Filipino options.',
    },
    signature: {
      name: 'Shangri-La Mactan Resort & Spa',
      style: 'Beach resort',
      address: 'Punta Engaño Rd, Lapu-Lapu City, Mactan',
      nightlyRate: 340,
      neighborhood: 'Mactan Island',
      whyItWorks: 'Private beach, marine sanctuary, multiple restaurants. The benchmark luxury resort in Cebu.',
    },
  },
  dining: [
    {
      name: 'Rico\'s Lechon',
      cuisine: 'Filipino — lechon specialist',
      address: 'F. Llamas St, Mabolo, Cebu City',
      estimatedPerPerson: 12,
      signatureOrder: 'Original lechon, spicy lechon, rice',
      fit: ['lean', 'balanced', 'elevated'],
    },
    {
      name: 'CNT Lechon',
      cuisine: 'Classic Cebu lechon',
      address: 'Tres de Abril St, Pasil, Cebu City',
      estimatedPerPerson: 9,
      signatureOrder: 'Whole roasted lechon — locals\' first choice',
      fit: ['lean', 'balanced'],
    },
    {
      name: 'Larsian BBQ (Fuente)',
      cuisine: 'Street BBQ',
      address: 'Fuente Osmeña, Cebu City',
      estimatedPerPerson: 5,
      signatureOrder: 'Inihaw na liempo, chicken inasal, puso',
      fit: ['lean', 'balanced'],
    },
    {
      name: 'Anzani Restaurant',
      cuisine: 'Mediterranean-Filipino fusion',
      address: 'Nivel Hills, Lahug, Cebu City',
      estimatedPerPerson: 38,
      signatureOrder: 'Grilled swordfish, lamb chops, local wine',
      fit: ['elevated', 'signature'],
    },
  ],
  activities: [
    {
      name: 'Oslob Whale Shark Snorkeling',
      address: 'Tan-awan, Oslob, Cebu',
      estimatedPerPerson: 25,
      durationHours: 5,
      travelMinutesFromCenter: 120,
      summary: 'Early morning whale shark encounter. Leave Cebu City by 4am for the best experience before crowds arrive.',
      fit: ['lean', 'balanced', 'elevated', 'signature'],
    },
    {
      name: 'Kawasan Falls Canyoneering',
      address: 'Badian, Cebu',
      estimatedPerPerson: 35,
      durationHours: 6,
      travelMinutesFromCenter: 150,
      summary: 'Full-day canyoneering ending in turquoise Kawasan Falls. One of the Philippines\' best adventure activities. Moderate fitness required.',
      fit: ['balanced', 'elevated'],
    },
    {
      name: 'Magellan\'s Cross & Basilica del Santo Niño',
      address: 'Magallanes St, Cebu City',
      estimatedPerPerson: 0,
      durationHours: 1.5,
      travelMinutesFromCenter: 10,
      summary: 'Oldest Christian landmark in the Philippines. Adjacent basilica houses the oldest religious icon. Free entry, significant heritage.',
      fit: ['lean', 'balanced', 'elevated', 'signature'],
    },
    {
      name: 'Moalboal Sardine Run + Diving',
      address: 'Panagsama Beach, Moalboal, Cebu',
      estimatedPerPerson: 45,
      durationHours: 5,
      travelMinutesFromCenter: 90,
      summary: 'Millions of sardines in a dense bait ball just offshore. World-class snorkeling. Combine with turtle spotting on same day.',
      fit: ['balanced', 'elevated', 'signature'],
    },
  ],
}
```

- [ ] **Step 5: Create `domain/trip/data/philippines-davao.ts`**

```typescript
import { DestinationSeed } from '@/domain/trip/types'

export const davaoDestination: DestinationSeed = {
  slug: 'davao',
  name: 'Davao',
  country: 'Philippines',
  regionLabel: 'Mindanao',
  airportCode: 'DVO',
  cityCode: 'DVO',
  coordinates: { lat: 7.1907, lng: 125.4553 },
  heroTitle: 'Philippines\' safest city — durian capital, Philippine Eagle, and Mt. Apo gateway',
  summary: 'Davao works when you want a Philippine city that feels calm, organized, and uniquely Mindanaoan — with excellent food, the Philippine Eagle sanctuary, and serious mountain trekking.',
  recommendedWindow: 'March to October (relatively dry — Davao is outside the typhoon belt)',
  aliases: ['davao', 'davao city', 'mindanao', 'mt apo', 'samal island'],
  averageTransitPerDay: 10,
  mapNote: 'Grab and taxi cover the city. FastCat ferry to Samal Island (20min). Day tours for Eagle Center and Eden by van hire.',
  flights: {
    lean: {
      airline: 'Cebu Pacific or AirAsia via Manila',
      departWindow: 'Tuesday morning',
      arriveWindow: 'Wednesday afternoon',
      durationHours: 22,
      stops: 1,
      layover: 'Manila (MNL)',
      cabin: 'Economy',
      bookingTip: 'Davao has good direct connections from Manila, Cebu, and Singapore. Book early — DVO routes fill up.',
      baseFarePerTraveler: 930,
    },
    balanced: {
      airline: 'Philippine Airlines via Manila',
      departWindow: 'Wednesday morning',
      arriveWindow: 'Thursday afternoon',
      durationHours: 20,
      stops: 1,
      layover: 'Manila (MNL)',
      cabin: 'Economy',
      bookingTip: 'PAL flies daily Manila–Davao in under 2 hours. Clean aircraft, reliable schedule.',
      baseFarePerTraveler: 1050,
    },
    elevated: {
      airline: 'SilkAir/Singapore Airlines direct to Davao',
      departWindow: 'Thursday afternoon',
      arriveWindow: 'Friday evening',
      durationHours: 18,
      stops: 1,
      layover: 'Singapore (SIN)',
      cabin: 'Economy Plus',
      bookingTip: 'Singapore has a direct flight to Davao — avoids Manila entirely. Great option.',
      baseFarePerTraveler: 1280,
    },
    signature: {
      airline: 'Singapore Airlines to Davao',
      departWindow: 'Thursday morning',
      arriveWindow: 'Friday afternoon',
      durationHours: 19,
      stops: 1,
      layover: 'Singapore (SIN)',
      cabin: 'Business',
      bookingTip: 'Direct SIN–DVO in business is a comfortable short haul following the transpacific leg.',
      baseFarePerTraveler: 2900,
    },
  },
  stays: {
    lean: {
      name: 'Residencia Dos Amigos',
      style: 'Budget inn',
      address: 'CM Recto St, Davao City',
      nightlyRate: 20,
      neighborhood: 'City Center',
      whyItWorks: 'Walking distance to Aldevinco market and food strip. Secure and clean.',
    },
    balanced: {
      name: 'Acacia Hotel Davao',
      style: 'Modern city hotel',
      address: 'Quimpo Blvd, Davao City',
      nightlyRate: 72,
      neighborhood: 'Ecoland',
      whyItWorks: 'Best mid-range hotel in the city. Strong breakfast buffet, reliable wifi, easy Grab access.',
    },
    elevated: {
      name: 'Seda Abreeza Davao',
      style: 'Business hotel',
      address: 'J.P. Laurel Ave, Bajada, Davao City',
      nightlyRate: 115,
      neighborhood: 'Bajada',
      whyItWorks: 'Connected to Abreeza Mall. Excellent rooms, rooftop pool, walkable to restaurants.',
    },
    signature: {
      name: 'Marco Polo Davao',
      style: 'Landmark luxury hotel',
      address: 'CM Recto St, Davao City',
      nightlyRate: 210,
      neighborhood: 'City Center',
      whyItWorks: 'The premier hotel in Davao. Consistent 5-star experience, excellent concierge for Mt. Apo and island trips.',
    },
  },
  dining: [
    {
      name: 'Aling Foping\'s Ihaw-Ihaw',
      cuisine: 'Davao street BBQ',
      address: 'Bangkal, Davao City',
      estimatedPerPerson: 5,
      signatureOrder: 'Chicken inasal, grilled pork, rice, soup',
      fit: ['lean', 'balanced'],
    },
    {
      name: 'Claude\'s Cafe by the Bay',
      cuisine: 'Filipino seafood',
      address: 'Lanang, Davao City',
      estimatedPerPerson: 14,
      signatureOrder: 'Kinilaw, grilled tuna belly, seafood kare-kare',
      fit: ['balanced', 'elevated'],
    },
    {
      name: 'Durian fruit stalls (Jack\'s Ridge)',
      cuisine: 'Filipino tropical fruit',
      address: 'Jack\'s Ridge, Matina Hills, Davao',
      estimatedPerPerson: 4,
      signatureOrder: 'Puyat durian, pomelo, marang, lanzones',
      fit: ['lean', 'balanced', 'elevated', 'signature'],
    },
    {
      name: 'Tuna Kainan sa Bangketa',
      cuisine: 'Fresh tuna specialty',
      address: 'Magsaysay Park, Davao City',
      estimatedPerPerson: 8,
      signatureOrder: 'Grilled yellowfin tuna, tuna kinilaw, tuna sisig',
      fit: ['lean', 'balanced', 'elevated'],
    },
  ],
  activities: [
    {
      name: 'Philippine Eagle Center',
      address: 'Calinan District, Davao City',
      estimatedPerPerson: 8,
      durationHours: 2.5,
      travelMinutesFromCenter: 35,
      summary: 'World\'s largest eagle — critically endangered and only found in Mindanao. The center rehabilitates and breeds them. Essential visit.',
      fit: ['lean', 'balanced', 'elevated', 'signature'],
    },
    {
      name: 'Eden Nature Park',
      address: 'Toril District, Davao City',
      estimatedPerPerson: 12,
      durationHours: 4,
      travelMinutesFromCenter: 40,
      summary: 'High-altitude mountain park with ziplines, forest walks, and panoramic views over Davao Gulf. Great for families.',
      fit: ['lean', 'balanced', 'elevated', 'signature'],
    },
    {
      name: 'Samal Island Daytrip',
      address: 'Island Garden City of Samal (ferry from Santa Ana Wharf)',
      estimatedPerPerson: 20,
      durationHours: 6,
      travelMinutesFromCenter: 20,
      summary: 'Island escape with coral reefs, Hagimit Falls, and beaches. FastCat ferry takes 20 minutes from central Davao.',
      fit: ['balanced', 'elevated', 'signature'],
    },
    {
      name: 'People\'s Park & Magsaysay Park',
      address: 'Davao City Center',
      estimatedPerPerson: 0,
      durationHours: 2,
      travelMinutesFromCenter: 5,
      summary: 'Durian-shaped dome, native plant collections, and bayfront park. Free, central, good for slow morning walks.',
      fit: ['lean', 'balanced', 'elevated', 'signature'],
    },
  ],
}
```

- [ ] **Step 6: Register new seeds in `domain/trip/destination-catalog.ts`**

Add imports at the top:
```typescript
import { manilaDestination } from '@/domain/trip/data/philippines-manila'
import { sorsogonDestination } from '@/domain/trip/data/philippines-sorsogon'
import { nagaDestination } from '@/domain/trip/data/philippines-naga'
import { cebuDestination } from '@/domain/trip/data/philippines-cebu'
import { davaoDestination } from '@/domain/trip/data/philippines-davao'
```

Update the `DESTINATIONS` array to include all five:
```typescript
const DESTINATIONS: DestinationSeed[] = [
  ...philippinesDestinations,
  manilaDestination,
  sorsogonDestination,
  nagaDestination,
  cebuDestination,
  davaoDestination,
  ...coreDestinations,
]
```

Also update `getPhilippinesSpotlights()` to include the new cities:
```typescript
export function getPhilippinesSpotlights() {
  const newPhilippines = [manilaDestination, sorsogonDestination, nagaDestination, cebuDestination, davaoDestination]
  return [...philippinesDestinations, ...newPhilippines].map((d) => ({
    slug: d.slug,
    name: d.name,
    country: d.country,
    summary: d.summary,
    tourismUrl: d.tourismUrl,
    airportCode: d.airportCode,
  }))
}
```

Update `resolveDestination()` to return `iataCode`, `cityCode`, and `coordinates` from the matched seed:
```typescript
// In the return statements of resolveDestination, add:
iataCode: destination.airportCode,
cityCode: destination.cityCode,
coordinates: destination.coordinates,
```

- [ ] **Step 7: Write a test for new seed resolution**

Add to a new file `tests/domain/destination-catalog.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { resolveDestination } from '@/domain/trip/destination-catalog'

describe('resolveDestination', () => {
  it('resolves Manila', () => {
    const match = resolveDestination('Manila')
    expect(match.destination.slug).toBe('manila')
    expect(match.iataCode).toBe('MNL')
    expect(match.cityCode).toBe('MNL')
  })
  it('resolves Sorsogon', () => {
    const match = resolveDestination('Sorsogon')
    expect(match.destination.slug).toBe('sorsogon')
    expect(match.iataCode).toBe('LGP')
  })
  it('resolves Naga', () => {
    const match = resolveDestination('Naga')
    expect(match.destination.slug).toBe('naga')
    expect(match.iataCode).toBe('WNP')
  })
  it('resolves Cebu', () => {
    const match = resolveDestination('Cebu')
    expect(match.destination.slug).toBe('cebu')
    expect(match.iataCode).toBe('CEB')
  })
  it('resolves Davao', () => {
    const match = resolveDestination('Davao')
    expect(match.destination.slug).toBe('davao')
    expect(match.iataCode).toBe('DVO')
  })
  it('exposes coordinates on match', () => {
    const match = resolveDestination('Tokyo')
    expect(match.coordinates.lat).toBeTypeOf('number')
    expect(match.coordinates.lng).toBeTypeOf('number')
  })
})
```

- [ ] **Step 8: Run tests and typecheck**

```bash
npx vitest run tests/domain/destination-catalog.test.ts
npx tsc --noEmit
```
Expected: all tests PASS, 0 type errors.

- [ ] **Step 9: Commit**

```bash
git add domain/trip/data/ domain/trip/destination-catalog.ts tests/domain/destination-catalog.test.ts
git commit -m "feat: add Manila, Sorsogon, Naga, Cebu, Davao full destination seeds"
```

---

## Chunk 3: Amadeus Adapters

### Task 9: Amadeus authentication client

**Files:**
- Create: `adapters/flights/amadeus-client.ts`

- [ ] **Step 1: Install Amadeus SDK**

```bash
npm install amadeus
npm install --save-dev @types/amadeus
```

If `@types/amadeus` is not found (SDK ships its own types), skip the types install.

- [ ] **Step 2: Create `adapters/flights/amadeus-client.ts`**

```typescript
import Amadeus from 'amadeus'

let _client: Amadeus | null = null

export function getAmadeusClient(): Amadeus {
  if (_client) return _client

  const clientId = process.env.AMADEUS_CLIENT_ID
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      'AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET must be set in environment variables'
    )
  }

  _client = new Amadeus({ clientId, clientSecret })
  return _client
}
```

- [ ] **Step 3: Add env vars to `.env.example`**

Open `.env.example` (create if missing) and add:
```
# Amadeus API — get credentials at https://developers.amadeus.com
AMADEUS_CLIENT_ID=your_client_id_here
AMADEUS_CLIENT_SECRET=your_client_secret_here

# Google Places API — get key at https://console.cloud.google.com
GOOGLE_PLACES_API_KEY=your_key_here

# Turso DB (already configured)
TURSO_DATABASE_URL=your_turso_url_here
TURSO_AUTH_TOKEN=your_turso_token_here
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add adapters/flights/amadeus-client.ts .env.example package.json package-lock.json
git commit -m "feat: add Amadeus client singleton with env var validation"
```

---

### Task 10: Amadeus flight offers adapter

**Files:**
- Create: `adapters/flights/amadeus-flight-adapter.ts`
- Create: `tests/adapters/amadeus-flight-adapter.test.ts`

- [ ] **Step 1: Define normalized output types in `adapters/flights/types.ts`**

Create `adapters/flights/types.ts`:
```typescript
export interface LiveFlightOffer {
  id: string
  airline: string
  airlineCode: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  stops: number
  cabinClass: string
  pricePerTraveler: number
  totalPrice: number
  deepLinkUrl: string
}
```

- [ ] **Step 2: Write failing test**

Create `tests/adapters/amadeus-flight-adapter.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { normalizeFlightOffer, pickTierOffer } from '@/adapters/flights/amadeus-flight-adapter'

const mockRawOffer = {
  id: 'offer-1',
  validatingAirlineCodes: ['AA'],
  itineraries: [{
    duration: 'PT18H30M',
    segments: [{
      departure: { iataCode: 'MCO', at: '2026-06-01T08:00:00' },
      arrival: { iataCode: 'MNL', at: '2026-06-02T14:30:00' },
      carrierCode: 'AA',
      operating: { carrierCode: 'AA' },
      numberOfStops: 1,
    }]
  }],
  travelerPricings: [{
    fareDetailsBySegment: [{ cabin: 'ECONOMY' }],
  }],
  price: { grandTotal: '1960.00', currency: 'USD' },
}

describe('normalizeFlightOffer', () => {
  it('maps duration correctly', () => {
    const result = normalizeFlightOffer(mockRawOffer, 2)
    expect(result.durationMinutes).toBe(1110) // 18h30m
    expect(result.totalPrice).toBe(1960)
    expect(result.pricePerTraveler).toBe(980)
    expect(result.stops).toBe(1)
  })
})

describe('pickTierOffer', () => {
  it('returns null for empty array', () => {
    expect(pickTierOffer([], 'lean')).toBeNull()
  })
  it('picks cheapest offer for lean tier', () => {
    const offers = [
      { ...mockRawOffer, id: '1', price: { grandTotal: '2000.00', currency: 'USD' } },
      { ...mockRawOffer, id: '2', price: { grandTotal: '1800.00', currency: 'USD' } },
    ]
    const result = pickTierOffer(offers, 'lean')
    expect(result?.id).toBe('2')
  })
})
```

- [ ] **Step 3: Run test — expect failures**

```bash
npx vitest run tests/adapters/amadeus-flight-adapter.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 4: Create `adapters/flights/amadeus-flight-adapter.ts`**

```typescript
import { getAmadeusClient } from './amadeus-client'
import { CacheService } from '@/server/services/cache-service'
import type { ScenarioTier } from '@/domain/trip/types'
import type { LiveFlightOffer } from './types'

// Parse ISO 8601 duration string PT18H30M → minutes
export function parseDurationMinutes(iso: string): number {
  const hoursMatch = iso.match(/(\d+)H/)
  const minsMatch = iso.match(/(\d+)M/)
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0
  const mins = minsMatch ? parseInt(minsMatch[1]) : 0
  return hours * 60 + mins
}

export function normalizeFlightOffer(raw: any, travelers: number): LiveFlightOffer {
  const itinerary = raw.itineraries?.[0]
  const firstSegment = itinerary?.segments?.[0]
  const lastSegment = itinerary?.segments?.[itinerary.segments.length - 1]
  const cabin = raw.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ?? 'ECONOMY'
  const totalPrice = parseFloat(raw.price?.grandTotal ?? '0')
  const stops = itinerary?.segments?.length - 1 ?? 0

  return {
    id: raw.id,
    airline: raw.validatingAirlineCodes?.[0] ?? 'Unknown',
    airlineCode: raw.validatingAirlineCodes?.[0] ?? '??',
    departureTime: firstSegment?.departure?.at ?? '',
    arrivalTime: lastSegment?.arrival?.at ?? '',
    durationMinutes: parseDurationMinutes(itinerary?.duration ?? 'PT0M'),
    stops,
    cabinClass: cabin,
    pricePerTraveler: Math.round(totalPrice / travelers),
    totalPrice,
    deepLinkUrl: `https://www.google.com/flights?q=flights+from+${firstSegment?.departure?.iataCode}+to+${lastSegment?.arrival?.iataCode}`,
  }
}

// Pick the best offer for a given tier: lean=cheapest, balanced=2nd, elevated=3rd, signature=most expensive
export function pickTierOffer(rawOffers: any[], tier: ScenarioTier): any | null {
  if (rawOffers.length === 0) return null
  const sorted = [...rawOffers].sort(
    (a, b) => parseFloat(a.price?.grandTotal ?? '0') - parseFloat(b.price?.grandTotal ?? '0')
  )
  const tierIndex: Record<ScenarioTier, number> = {
    lean: 0,
    balanced: Math.floor(sorted.length * 0.33),
    elevated: Math.floor(sorted.length * 0.66),
    signature: sorted.length - 1,
  }
  return sorted[Math.min(tierIndex[tier], sorted.length - 1)]
}

// Fetches and caches RAW Amadeus offer objects (not normalized).
// pickTierOffer sorts by price.grandTotal on raw objects.
// Callers normalize after tier selection via normalizeFlightOffer().
export async function fetchRawFlightOffers(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  adults: number,
  preferDirectFlights: boolean
): Promise<any[]> {
  const cacheKey = CacheService.buildFlightCacheKey(
    origin, destination, departureDate, returnDate, adults, preferDirectFlights
  )
  const cached = await CacheService.get(cacheKey)
  if (cached) return cached as any[]

  const client = getAmadeusClient()
  const params: Record<string, string | number> = {
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate,
    returnDate,
    adults,
    max: 15,
    currencyCode: 'USD',
  }
  if (preferDirectFlights) params.nonStop = 'true'

  const response = await client.shopping.flightOffersSearch.get(params)
  const raw: any[] = response.data ?? []

  await CacheService.set(cacheKey, raw, 2)
  return raw
}
```

- [ ] **Step 5: Run test — expect pass**

```bash
npx vitest run tests/adapters/amadeus-flight-adapter.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add adapters/flights/ tests/adapters/amadeus-flight-adapter.test.ts
git commit -m "feat: add Amadeus flight offers adapter with caching and tier selection"
```

---

### Task 11: Amadeus hotels adapter

**Files:**
- Create: `adapters/lodging/amadeus-hotels-client.ts`
- Create: `adapters/lodging/types.ts`
- Create: `tests/adapters/amadeus-hotels-adapter.test.ts`

- [ ] **Step 1: Create `adapters/lodging/types.ts`**

```typescript
export interface LiveHotelOffer {
  hotelId: string
  hotelName: string
  address: string
  stars: number
  checkIn: string
  checkOut: string
  roomType: string
  pricePerNight: number
  totalPrice: number
  deepLinkUrl: string
}
```

- [ ] **Step 2: Write failing tests**

Create `tests/adapters/amadeus-hotels-adapter.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { normalizeHotelOffer, pickTierHotel } from '@/adapters/lodging/amadeus-hotels-client'

const mockOffer = {
  hotel: { hotelId: 'HTMANCBD', name: 'Test Hotel', address: { lines: ['1 Main St'], cityName: 'Manila' }, rating: '4' },
  offers: [{
    checkInDate: '2026-06-01',
    checkOutDate: '2026-06-08',
    room: { typeEstimated: { category: 'STANDARD_ROOM' } },
    price: { total: '490.00', currency: 'USD' },
  }],
}

describe('normalizeHotelOffer', () => {
  it('calculates pricePerNight correctly', () => {
    const result = normalizeHotelOffer(mockOffer, 7)
    expect(result.pricePerNight).toBe(70)
    expect(result.totalPrice).toBe(490)
    expect(result.hotelName).toBe('Test Hotel')
  })
})

describe('pickTierHotel', () => {
  it('returns null for empty array', () => {
    expect(pickTierHotel([], 'lean', 7)).toBeNull()
  })
})
```

- [ ] **Step 3: Run test — expect failures**

```bash
npx vitest run tests/adapters/amadeus-hotels-adapter.test.ts
```

- [ ] **Step 4: Create `adapters/lodging/amadeus-hotels-client.ts`**

```typescript
import { getAmadeusClient } from '@/adapters/flights/amadeus-client'
import { CacheService } from '@/server/services/cache-service'
import type { ScenarioTier } from '@/domain/trip/types'
import type { LiveHotelOffer } from './types'

export function normalizeHotelOffer(raw: any, nights: number): LiveHotelOffer {
  const hotel = raw.hotel ?? {}
  const offer = raw.offers?.[0] ?? {}
  const totalPrice = parseFloat(offer.price?.total ?? '0')
  const address = [hotel.address?.lines?.[0], hotel.address?.cityName].filter(Boolean).join(', ')

  return {
    hotelId: hotel.hotelId ?? '',
    hotelName: hotel.name ?? 'Unknown Hotel',
    address,
    stars: parseInt(hotel.rating ?? '3'),
    checkIn: offer.checkInDate ?? '',
    checkOut: offer.checkOutDate ?? '',
    roomType: offer.room?.typeEstimated?.category ?? 'STANDARD_ROOM',
    pricePerNight: nights > 0 ? Math.round(totalPrice / nights) : totalPrice,
    totalPrice,
    deepLinkUrl: `https://www.booking.com/search.html?ss=${encodeURIComponent(hotel.name ?? '')}`,
  }
}

export function pickTierHotel(rawOffers: any[], tier: ScenarioTier, nights: number): LiveHotelOffer | null {
  if (rawOffers.length === 0) return null
  const sorted = [...rawOffers].sort(
    (a, b) => parseFloat(a.offers?.[0]?.price?.total ?? '0') - parseFloat(b.offers?.[0]?.price?.total ?? '0')
  )
  const tierIndex: Record<ScenarioTier, number> = {
    lean: 0,
    balanced: Math.floor(sorted.length * 0.25),
    elevated: Math.floor(sorted.length * 0.60),
    signature: sorted.length - 1,
  }
  const pick = sorted[Math.min(tierIndex[tier], sorted.length - 1)]
  return normalizeHotelOffer(pick, nights)
}

export async function fetchHotelOffers(
  cityCode: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  nights: number
): Promise<LiveHotelOffer[]> {
  const client = getAmadeusClient()

  // Step 1: Get hotel IDs for city (cached 24h)
  const listKey = CacheService.buildHotelListCacheKey(cityCode)
  let hotelIds: string[] = (await CacheService.get(listKey)) as string[] | null ?? []

  if (hotelIds.length === 0) {
    const listResponse = await client.referenceData.locations.hotels.byCity.get({ cityCode })
    hotelIds = (listResponse.data ?? []).slice(0, 20).map((h: any) => h.hotelId)
    await CacheService.set(listKey, hotelIds, 24)
  }

  if (hotelIds.length === 0) return []

  // Step 2: Get offers for those hotel IDs (cached 2h)
  const rooms = Math.ceil(adults / 2)
  const offersKey = CacheService.buildHotelOffersCacheKey(cityCode, checkIn, checkOut, rooms)
  const cachedOffers = await CacheService.get(offersKey)
  if (cachedOffers) return cachedOffers as LiveHotelOffer[]

  const offersResponse = await client.shopping.hotelOffersSearch.get({
    hotelIds: hotelIds.join(','),
    checkInDate: checkIn,
    checkOutDate: checkOut,
    adults: String(adults),
    roomQuantity: String(rooms),
    currencyCode: 'USD',
    bestRateOnly: 'true',
  })

  const normalized = (offersResponse.data ?? []).map((o: any) => normalizeHotelOffer(o, nights))
  await CacheService.set(offersKey, normalized, 2)
  return normalized
}
```

- [ ] **Step 5: Run test — expect pass**

```bash
npx vitest run tests/adapters/amadeus-hotels-adapter.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add adapters/lodging/ tests/adapters/amadeus-hotels-adapter.test.ts
git commit -m "feat: add Amadeus hotels adapter with two-step search and caching"
```

---

## Chunk 4: Google Places Hook + API Route + Scoring

### Task 12: Google Places destination search hook

**Files:**
- Create: `features/search/use-destination-search.ts`
- Create: `app/api/places/route.ts`

- [ ] **Step 1: Create the API proxy route (keeps API key server-side)**

Create `app/api/places/route.ts`:
```typescript
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('input')

  if (!input || input.length < 2) {
    return NextResponse.json({ predictions: [] })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Places API not configured' }, { status: 500 })
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
  url.searchParams.set('input', input)
  url.searchParams.set('types', '(cities)')
  url.searchParams.set('key', apiKey)

  const response = await fetch(url.toString())
  const data = await response.json()

  const predictions = (data.predictions ?? []).map((p: any) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? '',
  }))

  return NextResponse.json({ predictions })
}
```

- [ ] **Step 2: Create `features/search/use-destination-search.ts`**

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { resolveIataCode } from '@/domain/trip/data/iata-city-map'

export interface DestinationPrediction {
  placeId: string
  description: string
  mainText: string
  secondaryText: string
  iataCode: string | null  // resolved from static map, null if unknown
}

export function useDestinationSearch(query: string, debounceMs = 300) {
  const [predictions, setPredictions] = useState<DestinationPrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (query.length < 2) {
      setPredictions([])
      return
    }

    timerRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/places?input=${encodeURIComponent(query)}`)
        const data = await res.json()
        const enriched: DestinationPrediction[] = (data.predictions ?? []).map((p: any) => ({
          ...p,
          iataCode: resolveIataCode(p.mainText),
        }))
        setPredictions(enriched)
      } catch {
        setPredictions([])
      } finally {
        setIsLoading(false)
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, debounceMs])

  return { predictions, isLoading }
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/api/places/route.ts features/search/use-destination-search.ts
git commit -m "feat: add Google Places autocomplete hook and API proxy route"
```

---

### Task 13: Update API route and scoring to use live data + preferences

**Files:**
- Modify: `app/api/plan/route.ts`
- Modify: `server/services/build-planner-view-model.ts`
- Modify: `domain/scenarios/scenario-similarity.ts` (add preference scoring)

- [ ] **Step 1: Update `app/api/plan/route.ts` to accept new fields**

Replace the `requestSchema` with:
```typescript
const requestSchema = z.object({
  destinationQuery: z.string().min(1),
  origin: z.string().min(2).default('Orlando'),
  travelers: z.number().int().min(1).max(12).default(2),
  nights: z.number().int().min(3).max(14).default(6),
  budgetCap: z.number().positive().optional(),
  preferDirectFlights: z.boolean().default(false),
  preferLocalFood: z.boolean().default(false),
  lowWalkingIntensity: z.boolean().default(false),
})
```

- [ ] **Step 2: Update `server/services/build-planner-view-model.ts` to fetch live data**

After resolving the destination match, add live data enrichment:
```typescript
// Add these imports at the top of the existing file (alongside existing imports):
import { fetchRawFlightOffers, pickTierOffer, normalizeFlightOffer } from '@/adapters/flights/amadeus-flight-adapter'
import { fetchHotelOffers, pickTierHotel } from '@/adapters/lodging/amadeus-hotels-client'
import { resolveIataCode } from '@/domain/trip/data/iata-city-map'
import type { TripScenario } from '@/domain/trip/types'

// Replace the existing buildPlannerViewModel function body with:
export async function buildPlannerViewModel(input: PlannerInput): Promise<PlannerViewModel> {
  const match = resolveDestination(input.destinationQuery)
  const ruleBasedScenarios = buildTripScenarios(input, match)
  const scoredScenarios = attachScenarioSimilarity(ruleBasedScenarios, input)
  const scenarios = await attachScenarioVerification(scoredScenarios, input, match)

  const today = new Date()
  const departDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const returnDate = new Date(departDate.getTime() + input.nights * 24 * 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const originIata = resolveIataCode(input.origin) ?? 'MCO'

  try {
    // Fetch RAW offers — pickTierOffer sorts by raw price.grandTotal field
    const [rawFlights, liveHotels] = await Promise.all([
      fetchRawFlightOffers(
        originIata,
        match.iataCode,
        fmt(departDate),
        fmt(returnDate),
        input.travelers,
        input.preferDirectFlights ?? false
      ),
      fetchHotelOffers(
        match.cityCode,
        fmt(departDate),
        fmt(returnDate),
        input.travelers,
        input.nights
      ),
    ])

    for (const scenario of scenarios) {
      const rawFlight = pickTierOffer(rawFlights, scenario.tier)
      const tierHotel = pickTierHotel(liveHotels, scenario.tier, input.nights)

      if (rawFlight) {
        const normalized = normalizeFlightOffer(rawFlight, input.travelers)
        scenario.flight = {
          ...scenario.flight,
          baseFarePerTraveler: normalized.pricePerTraveler,
          airline: normalized.airline,
          durationHours: Math.round((normalized.durationMinutes / 60) * 10) / 10,
          stops: normalized.stops,
        }
      }
      if (tierHotel) {
        scenario.stay = {
          ...scenario.stay,
          name: tierHotel.hotelName,
          address: tierHotel.address,
          nightlyRate: tierHotel.pricePerNight,
        }
      }
    }
  } catch (err) {
    console.error('Live data fetch failed, using seeded estimates:', err)
  }

  const reorderedScenarios = applyPreferenceScoring(scenarios, input)

  const selectedScenarioIndex = reorderedScenarios.reduce((bestIndex, scenario, index, all) => {
    return scenario.ruleScore > all[bestIndex].ruleScore ? index : bestIndex
  }, Math.min(1, reorderedScenarios.length - 1))

  return {
    constraints: deriveTripConstraints(input),
    travelerProfile: deriveTravelerProfile(input),
    input,
    match,
    scenarios: reorderedScenarios,
    selectedScenarioIndex,
  }
}

function applyPreferenceScoring(scenarios: TripScenario[], input: PlannerInput): TripScenario[] {
  if (!input.preferDirectFlights && !input.preferLocalFood && !input.lowWalkingIntensity) {
    return scenarios
  }
  return scenarios.map((s) => {
    let bonus = 0
    if (input.preferDirectFlights && s.flight.stops === 0) bonus += 20
    if (input.preferLocalFood) {
      const hasLocalFood = s.diningPlan.highlights.some((d) =>
        !d.cuisine.toLowerCase().includes('tourist') && d.estimatedPerPerson < 20
      )
      if (hasLocalFood) bonus += 15
    }
    if (input.lowWalkingIntensity) {
      const walkingActivities = s.activities.filter((a) => a.travelMinutesFromCenter < 10)
      if (walkingActivities.length < 2) bonus += 10
    }
    if (input.budgetCap && s.cost.totalTripCost > input.budgetCap) bonus -= 50
    return { ...s, ruleScore: s.ruleScore + bonus }
  })
}
```

- [ ] **Step 3: Typecheck and run all tests**

```bash
npx tsc --noEmit && npx vitest run
```
Expected: 0 type errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/api/plan/route.ts server/services/build-planner-view-model.ts
git commit -m "feat: wire live Amadeus data and preference scoring into planner view model"
```

---

## Chunk 5: Form Overhaul + Results Copy

### Task 14: Rewrite trip intake form

**Files:**
- Modify: `components/planner/trip-intake-form.tsx`

- [ ] **Step 1: Read the current file fully before editing**

```bash
cat "/c/Users/lily7/Claude Code Projects/VoyageIQ/components/planner/trip-intake-form.tsx"
```

- [ ] **Step 2: Update all form field labels and placeholders**

Replace labels and placeholders:
- `"Destination or landmark"` → `"Where do you want to go?"`
- `placeholder="Tokyo, Eiffel Tower, Waikiki..."` → `placeholder="Any city, beach, or country..."`
- `"Departing from"` → `"Flying from"`
- `placeholder="Orlando"` → `placeholder="City or airport (e.g. Orlando, MCO)"`
- `"Travelers"` → `"Travelers"` (keep, it's fine)
- `"Nights"` → `"Trip length (days)"`
- CTA button → `"Find real trips with live prices →"`

- [ ] **Step 3: Add Google Places autocomplete to destination field**

Import and wire the hook:
```typescript
import { useDestinationSearch } from '@/features/search/use-destination-search'
```

Replace the static destination `<input>` with a controlled input + dropdown:
```tsx
const [destinationInput, setDestinationInput] = useState(form.destinationQuery ?? '')
const { predictions, isLoading } = useDestinationSearch(destinationInput)
const [showSuggestions, setShowSuggestions] = useState(false)

// In JSX, replace destination input:
<div className="relative">
  <input
    type="text"
    value={destinationInput}
    onChange={(e) => { setDestinationInput(e.target.value); setShowSuggestions(true) }}
    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
    placeholder="Any city, beach, or country..."
    className="..."
  />
  {showSuggestions && predictions.length > 0 && (
    <ul className="absolute z-10 w-full bg-black border border-white/10 rounded-lg mt-1 max-h-48 overflow-y-auto">
      {predictions.map((p) => (
        <li
          key={p.placeId}
          className="px-4 py-2 hover:bg-white/5 cursor-pointer text-sm"
          onMouseDown={() => {
            setDestinationInput(p.mainText)
            setShowSuggestions(false)
          }}
        >
          <span className="font-medium">{p.mainText}</span>
          <span className="text-white/40 ml-2 text-xs">{p.secondaryText}</span>
        </li>
      ))}
    </ul>
  )}
</div>
```

- [ ] **Step 4: Add budget field**

After the nights/days field, add:
```tsx
<div>
  <label className="...">Your total budget (optional)</label>
  <input
    type="number"
    name="budgetCap"
    min={500}
    step={100}
    placeholder="e.g. 4000"
    className="..."
  />
  <span className="text-xs text-white/40">Total USD for the whole trip</span>
</div>
```

- [ ] **Step 5: Add "Planning for older travelers?" collapsible panel**

```tsx
const [showFamilyMode, setShowFamilyMode] = useState(false)

// In JSX:
<div className="border border-white/10 rounded-lg p-4">
  <button
    type="button"
    onClick={() => setShowFamilyMode(!showFamilyMode)}
    className="w-full text-left text-sm font-medium flex justify-between items-center"
  >
    <span>👴 Planning for older or less-mobile travelers?</span>
    <span>{showFamilyMode ? '−' : '+'}</span>
  </button>
  {showFamilyMode && (
    <div className="mt-3 space-y-2">
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" name="preferDirectFlights" value="true" />
        Prefer direct or single-connection flights
      </label>
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" name="preferLocalFood" value="true" />
        Prioritize authentic local food, not tourist restaurants
      </label>
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" name="lowWalkingIntensity" value="true" />
        Avoid long walking days (max 3km/day)
      </label>
    </div>
  )}
</div>
```

- [ ] **Step 6: Expand Philippines quick-pick to include all 9 regions**

Replace the existing quick-pick list:
```tsx
const philippinesRegions = [
  { slug: 'manila', name: 'Manila' },
  { slug: 'boracay', name: 'Boracay' },
  { slug: 'el-nido', name: 'El Nido' },
  { slug: 'bohol', name: 'Bohol' },
  { slug: 'siargao', name: 'Siargao' },
  { slug: 'cebu', name: 'Cebu' },
  { slug: 'sorsogon', name: 'Sorsogon' },
  { slug: 'naga', name: 'Naga' },
  { slug: 'davao', name: 'Davao' },
]
```

- [ ] **Step 7: Remove "Live intake read" / "Match confidence" sidebar widget entirely**

Delete the `<div>` containing "Live intake read", "Match confidence", and "Seeded spotlight" — this is internal jargon that should not be user-facing.

- [ ] **Step 8: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 9: Commit**

```bash
git add components/planner/trip-intake-form.tsx
git commit -m "feat: overhaul intake form with Places autocomplete, budget field, family mode, plain labels"
```

---

### Task 15: Results copy overhaul

**Files:**
- Modify: `components/results/scenario-explorer.tsx`
- Modify: `components/results/cost-breakdown.tsx`
- Modify: `components/results/itinerary-timeline.tsx`

- [ ] **Step 1: Read all three files fully, then apply changes**

```bash
cat "/c/Users/lily7/Claude Code Projects/VoyageIQ/components/results/scenario-explorer.tsx"
cat "/c/Users/lily7/Claude Code Projects/VoyageIQ/components/results/cost-breakdown.tsx"
cat "/c/Users/lily7/Claude Code Projects/VoyageIQ/components/results/itinerary-timeline.tsx"
```

- [ ] **Step 2: In `scenario-explorer.tsx` — replace all tier display names**

Add a display name map near the top of the component:
```typescript
const TIER_DISPLAY_NAMES: Record<string, string> = {
  lean: 'Budget',
  balanced: 'Best Value',
  elevated: 'Comfortable',
  signature: 'Splurge',
}
```

Replace all hardcoded tier name strings (e.g., `scenario.label` if it uses the old name) with `TIER_DISPLAY_NAMES[scenario.tier] ?? scenario.label`.

- [ ] **Step 3: In `scenario-explorer.tsx` — replace jargon copy**

Find and replace:
- `"You gain"` → `"What you get"`
- `"You lose"` → `"What you give up"`
- `"Family total"` → `"Trip total"`
- `"Booking stack"` → `"How to book this trip"`
- `"Arrival plan"` → `"Your first day"`
- `"Flight shape"` → `"Flights"`
- `"Food budget"` → `"Food"`
- Remove any remaining "seeded", "spotlight", "match confidence", "feature vector" text

- [ ] **Step 4: In `cost-breakdown.tsx` — rename cost line-item headers**

Replace:
- `"airfareTotal"` display → `"Flights"`
- `"lodgingTotal"` display → `"Hotels"`
- `"foodTotal"` display → `"Food"`
- `"activitiesTotal"` display → `"Activities"`
- `"localTransitTotal"` display → `"Local transport"`
- `"taxesAndFees"` display → `"Taxes & fees"`
- `"contingencyBuffer"` display → `"Contingency buffer"`
- `"totalTripCost"` display → `"Total trip cost"`

Add a note below the total: `"Prices are live and may change at time of booking."`

- [ ] **Step 5: In `itinerary-timeline.tsx` — rename section headers**

Replace any "Arrival plan" heading → "Your first day"

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add components/results/
git commit -m "feat: overhaul results copy — plain language, renamed tiers, removed jargon"
```

---

## Chunk 6: Integration Testing + .env.example + Final Checks

### Task 16: Integration smoke test

**Files:**
- Create: `tests/integration/planner-flow.test.ts`

- [ ] **Step 1: Write integration test for the full planner flow (mocked Amadeus)**

Create `tests/integration/planner-flow.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { resolveDestination } from '@/domain/trip/destination-catalog'
import { buildTripScenarios } from '@/domain/scenarios/build-trip-scenarios'

// Mock Amadeus so integration test doesn't need real credentials
vi.mock('@/adapters/flights/amadeus-client', () => ({
  getAmadeusClient: () => ({ shopping: { flightOffersSearch: { get: async () => ({ data: [] }) } } }),
}))

describe('Planner flow — seeded path', () => {
  it('resolves Manila and generates 4 scenarios', () => {
    const match = resolveDestination('Manila')
    expect(match.destination.slug).toBe('manila')
    expect(match.iataCode).toBe('MNL')

    const input = {
      destinationQuery: 'Manila',
      origin: 'Orlando',
      travelers: 2,
      nights: 7,
      preferDirectFlights: false,
      preferLocalFood: true,
      lowWalkingIntensity: false,
      destination: 'Manila',
    }
    const scenarios = buildTripScenarios(input, match)
    expect(scenarios).toHaveLength(4)
    expect(scenarios.map((s) => s.tier)).toEqual(['lean', 'balanced', 'elevated', 'signature'])
  })

  it('resolves Davao and generates 4 scenarios', () => {
    const match = resolveDestination('Davao')
    expect(match.destination.slug).toBe('davao')
    const input = {
      destinationQuery: 'Davao',
      origin: 'Orlando',
      travelers: 2,
      nights: 7,
      preferDirectFlights: false,
      preferLocalFood: false,
      lowWalkingIntensity: false,
      destination: 'Davao',
    }
    const scenarios = buildTripScenarios(input, match)
    expect(scenarios).toHaveLength(4)
  })
})
```

- [ ] **Step 2: Run integration tests**

```bash
npx vitest run tests/integration/planner-flow.test.ts
```
Expected: PASS (2 tests)

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```
Expected: All tests pass. Note the total count.

- [ ] **Step 4: Run full typecheck**

```bash
npx tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 5: Run lint**

```bash
npm run lint
```
Expected: 0 errors. Fix any lint warnings.

- [ ] **Step 6: Final commit**

```bash
git add tests/integration/
git commit -m "test: add integration smoke tests for full planner flow"
```

---

### Task 17: Update CLAUDE.md for new env vars and dev setup

**Files:**
- Modify: `CLAUDE.md` (project CLAUDE.md)

- [ ] **Step 1: Add environment variable documentation to `CLAUDE.md`**

Add a section:
```markdown
## Environment Variables

Required for full functionality:
- `AMADEUS_CLIENT_ID` — Amadeus API client ID (https://developers.amadeus.com)
- `AMADEUS_CLIENT_SECRET` — Amadeus API client secret
- `GOOGLE_PLACES_API_KEY` — Google Places Autocomplete API key
- `TURSO_DATABASE_URL` — Turso database URL
- `TURSO_AUTH_TOKEN` — Turso auth token

For local development, copy `.env.example` to `.env.local` and fill in real values.

The app degrades gracefully — if Amadeus credentials are missing, seeded price estimates are used. If Google Places key is missing, the autocomplete suggestions won't appear but free-text input still works.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document required environment variables in CLAUDE.md"
```

---

## Done

All tasks complete. To verify end-to-end:

1. Copy `.env.example` to `.env.local` and fill in Amadeus + Google Places credentials
2. Run `npm run db:push` to apply migrations
3. Run `npm run dev` and navigate to `http://localhost:3000`
4. Type "Manila" in the destination field — autocomplete should appear
5. Submit the form — real Amadeus flight prices should appear in scenarios
6. Check the "Planning for older travelers?" panel and resubmit — lean/budget scenarios should score higher when `preferLocalFood` is checked
7. Verify all tier names show "Budget / Best Value / Comfortable / Splurge"
8. Verify no internal jargon is visible anywhere in the UI
