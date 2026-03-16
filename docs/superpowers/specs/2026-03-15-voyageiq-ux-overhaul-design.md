# VoyageIQ UX + Data Overhaul — Design Spec
**Date:** 2026-03-15
**Status:** Approved by user

---

## 1. Problem Statement

VoyageIQ currently works for 9 hardcoded destinations only, shows estimated prices that can't be acted on, and uses developer-language that real travelers don't understand. The immediate use case is helping Roman's father plan a Philippines trip — he wants authentic local food, cost-conscious options, and real booking-ready links.

---

## 2. Goals

1. **Any destination on earth** — user can type any city and get a real plan
2. **Real prices only** — live flight and hotel data, always, cached for 1–2 hours to control API cost
3. **Philippines expanded** — Manila, Sorsogon, Naga, Cebu, Davao get full seeded treatment (alongside existing Boracay, El Nido, Bohol, Siargao)
4. **Plain language** — no jargon anywhere; labels, tier names, and copy rewritten for regular travelers
5. **Family/elderly travel mode** — surface direct flights, authentic local food, low-walking-intensity options

---

## 3. Scope

### 3.1 Intake Form Overhaul

**Field changes:**

| Old label | New label | Change |
|-----------|-----------|--------|
| "Destination or landmark" | "Where do you want to go?" | Google Places autocomplete — any city on earth |
| "Departing from" | "Flying from" | Airport autocomplete (IATA code detection) |
| "Travelers" | "Travelers" | Single adult count only (children distinction deferred — no scoring logic defined yet) |
| "Nights" | "Trip length (days)" | Eliminates off-by-one confusion |
| *(missing)* | "Your total budget (optional)" | Plain dollar amount, used to filter scenarios |

**New: "Planning for older or less-mobile travelers?" section**

Optional collapsible panel with three checkboxes. These are NOT cosmetic — they feed into `travelPreferences` on `TripRequest` and affect scenario scoring:
- `preferDirectFlights: boolean` — filters Amadeus results to max 1 stop
- `preferLocalFood: boolean` — scores seeded dining toward non-tourist restaurants; surfaces food cost notes
- `lowWalkingIntensity: boolean` — deprioritizes walking-heavy activities in scenario assembly

**Philippines quick-pick expanded:**
Manila, Boracay, El Nido, Bohol, Siargao, Cebu, Sorsogon, Naga, Davao

**CTA button:** "Find real trips with live prices →"

### 3.2 Scenario Tier Rename (display only — internal slugs unchanged)

| Old display name | New display name | Internal slug (unchanged) |
|----------|----------|----------|
| Lean Explorer | Budget | `lean` |
| Balanced Core | Best Value | `balanced` |
| Elevated Flow | Comfortable | `elevated` |
| Signature Memory | Splurge | `signature` |

### 3.3 Results Copy Overhaul

- Remove all internal terms: "seeded spotlight", "awaiting query", "match confidence", "feature vector", "Live intake read"
- Replace tradeoff language: "You gain / You lose" → "What you get / What you give up"
- Cost breakdown headers: plain English ("Flights", "Hotels", "Food", "Activities", "Taxes & Fees")
- Booking section: "How to book this trip" instead of "Booking stack"
- Arrival plan: "Your first day" instead of "Arrival plan"
- Scenario summary: "Trip total" instead of "Family total" (not all travelers are families)

### 3.4 Domain Type Changes

**`TripConstraint` additions** (`domain/trip/types.ts`) — this is the correct existing type:
```typescript
travelPreferences?: {
  preferDirectFlights: boolean
  preferLocalFood: boolean
  lowWalkingIntensity: boolean
}
budgetCap?: number  // total USD, optional
```

**`PlannerInput` in `features/search/planner-input.ts`** (Zod schema + inferred type):
```typescript
budgetCap: z.number().positive().optional()
preferDirectFlights: z.boolean().optional().default(false)
preferLocalFood: z.boolean().optional().default(false)
lowWalkingIntensity: z.boolean().optional().default(false)
```
The `PlannerInput` interface in `domain/trip/types.ts` must also be updated to match, or removed in favor of the Zod-inferred type to eliminate duplication.

**`DestinationMatch` additions** (`domain/trip/types.ts`) — this is the correct existing type:
```typescript
iataCode: string       // airport code for flight search (e.g. "MNL")
cityCode: string       // Amadeus city code for hotel search (matches IATA for most cities)
coordinates: { lat: number; lng: number }  // from Places API or seed data
```

**`DestinationSeed` additions** (`domain/trip/types.ts`):
```typescript
cityCode: string       // Amadeus city code — often same as airportCode but not always
coordinates: { lat: number; lng: number }
```
All existing seeds must be updated to include these two fields.

### 3.5 Live API Integrations

**IATA Resolution — Static mapping + Amadeus Airport Search**

Google Places does NOT return IATA codes. Resolution strategy:
1. First: check `domain/trip/data/iata-city-map.ts` — a static map of common city names → IATA codes (covers ~200 major cities and all seeded destinations)
2. Fallback: call Amadeus Airport & City Search API with city name if not in static map
3. Cache static map in memory (no TTL needed)
4. IATA resolution runs after Places autocomplete selection, before form submit

**Flights — Amadeus Flight Offers Search API**
- Credentials: `AMADEUS_CLIENT_ID` + `AMADEUS_CLIENT_SECRET` (env vars)
- Endpoint: `GET /v2/shopping/flight-offers`
- Trigger: on form submit only
- Input: originLocationCode (IATA), destinationLocationCode (IATA), departureDate, returnDate, adults
- Filter: if `preferDirectFlights=true`, add `max=1` stops filter
- Output: normalized to `FlightOption[]` — top result per tier bucket (cheapest=lean, mid=balanced, etc.)
- Cache key: `flights:{origin}:{dest}:{depart}:{return}:{adults}:{directOnly}`
- TTL check: SQL `WHERE fetched_at > datetime('now', '-2 hours')` — done in repository layer, not application code
- Fallback: seeded flight cost labeled "Estimated — verify on Google Flights"

**Hotels — Amadeus Hotel Search (two-step)**
- Step 1: `GET /v1/reference-data/locations/hotels/by-city?cityCode={IATA}` → list of hotel IDs
- Step 2: `GET /v3/shopping/hotel-offers?hotelIds={ids}&checkInDate=...&checkOutDate=...&adults=...` → offers
- Cache step 1 separately with 24h TTL (hotel list for a city rarely changes)
- Cache step 2 with 2h TTL
- Cache key step 1: `hotel-list:{cityCode}`
- Cache key step 2: `hotel-offers:{cityCode}:{checkin}:{checkout}:{adults}`
- Output: normalized to `StayOption[]` — 1 per tier (cheapest→lean, sorted by price)
- Fallback: seeded hotel with deep-link to Booking.com search for that city/date

**Destination search — Google Places Autocomplete API**
- Credentials: `GOOGLE_PLACES_API_KEY` (env var)
- Trigger: debounced 300ms on keystroke via `useDestinationSearch` hook
- Returns: city name, country, `place_id`, coordinates
- Hook lives in `features/search/use-destination-search.ts`
- IATA resolution triggered on selection (not on every keystroke)

### 3.6 Caching Architecture

**New Drizzle table** (`drizzle/schema.ts` addition — this is where the schema actually lives):
```typescript
export const apiCache = sqliteTable('api_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cacheKey: text('cache_key').notNull().unique(),
  payload: text('payload').notNull(),  // JSON stringified
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull(),
  ttlHours: integer('ttl_hours').notNull().default(2),
})
```

**Migration:** `drizzle/migrations/0001_add_api_cache.sql` — generated via `drizzle-kit generate`

**Cache service** (`server/services/cache-service.ts`):
```typescript
get(key: string): Promise<unknown | null>   // returns null if missing or expired
set(key: string, payload: unknown, ttlHours: number): Promise<void>
invalidate(key: string): Promise<void>
```

TTL check is done in the SQL query:
```sql
SELECT payload FROM api_cache
WHERE cache_key = ? AND fetched_at > strftime('%s', 'now') - (ttl_hours * 3600)
```

### 3.7 Philippines Destination Seeds (New — full treatment)

All five seeds follow the existing `DestinationSeed` interface exactly. Files:
- `domain/trip/data/philippines-manila.ts`
- `domain/trip/data/philippines-sorsogon.ts`
- `domain/trip/data/philippines-naga.ts`
- `domain/trip/data/philippines-cebu.ts`
- `domain/trip/data/philippines-davao.ts`

**Manila** (IATA: MNL, cityCode: MNL)
- Zones: Intramuros, BGC, Makati, Binondo (Chinatown)
- Food: lechon, kare-kare, sisig, Binondo street food, Max's Restaurant, Aristocrat
- Activities: Intramuros walking tour, Binondo food walk, Manila Bay sunset, Rizal Park, SM Mall of Asia
- Lodging tiers: budget guesthouse (Malate) → BGC serviced apartment → Makati business hotel → The Peninsula Manila

**Sorsogon** (IATA: LGP — nearest, 1hr transfer, cityCode: LGP)
- Food: Bicol express, laing, pinangat, fresh grilled seafood, taba ng talangka
- Activities: Donsol whale shark snorkeling, Bulusan Volcano National Park, Palobo Beach, Rizal Beach
- Lodging tiers: budget inn → family guesthouse → eco-resort → boutique nature lodge

**Naga City** (IATA: WNP primary / LGP fallback, cityCode: WNP)
- Food: Bicol cuisine hub — Waway's, Josefina's, laing, Naga Public Market, pili nut sweets
- Activities: Peñafrancia Shrine, Caramoan Islands daytrip, Mt. Isarog National Park, Naga City Museum
- Lodging tiers: pension house → city hotel → Crown Regency Naga → Casa Simeon boutique

**Cebu** (IATA: CEB, cityCode: CEB)
- Food: lechon (Rico's, CNT), puso hanging rice, Larsian BBQ, dried mango, dried fish market
- Activities: Oslob whale shark, Kawasan Falls, Magellan's Cross, Moalboal sardine run, Tops Lookout
- Lodging tiers: budget hostel → Cebu City mid-hotel → Mactan resort-adjacent → Shangri-La Mactan

**Davao** (IATA: DVO, cityCode: DVO)
- Food: durian fresh, kinilaw, grilled tuna, pomelo, Aling Foping's, Claude's Cafe
- Activities: Philippine Eagle Center, Eden Nature Park, Samal Island, People's Park, Crocodile Park
- Lodging tiers: budget inn → city center hotel → Acacia Hotel Davao → Marco Polo Davao

---

## 4. Architecture & File Map

```
adapters/
  flights/
    amadeus-client.ts         (NEW — Amadeus auth + flight offers search)
  lodging/
    amadeus-hotels-client.ts  (NEW — hotel list + hotel offers two-step)

domain/
  trip/
    types.ts                  (EDIT — add travelPreferences, budgetCap, iataCode, coordinates)
    data/
      iata-city-map.ts        (NEW — static city→IATA lookup ~200 entries)
      philippines-manila.ts   (NEW)
      philippines-sorsogon.ts (NEW)
      philippines-naga.ts     (NEW)
      philippines-cebu.ts     (NEW)
      philippines-davao.ts    (NEW)

features/
  search/
    planner-input.ts          (EDIT — add budgetCap, travelPreferences fields to Zod schema)
    use-destination-search.ts (NEW — Google Places hook)

drizzle/
  schema.ts                   (EDIT — add apiCache table, add cityCode+coordinates to DestinationSeed shape)

server/
  services/
    cache-service.ts          (NEW — get/set/invalidate with SQL TTL check)

drizzle/
  migrations/
    0001_add_api_cache.sql    (NEW — generated via drizzle-kit)

components/
  planner/
    trip-intake-form.tsx      (EDIT — new labels, Places autocomplete, budget field, family toggle)
  results/
    scenario-explorer.tsx     (EDIT — tier display names, copy overhaul)
    cost-breakdown.tsx        (EDIT — rename headers to plain English)
    itinerary-timeline.tsx    (EDIT — "Your first day" header)
```

---

## 5. Phasing

**Phase 1 (this sprint):**
- Domain type changes
- DB schema + migration
- Cache service
- 5 new Philippines seeds + iata-city-map
- Form copy + label overhaul
- Tier rename (display only)
- Results copy overhaul
- Google Places hook + IATA resolution
- Amadeus flights adapter + integration
- Amadeus hotels adapter + integration
- Family mode preferences wired into scoring

**Phase 2 (next sprint, deferred):**
- Activity booking API (Viator/TripAdvisor)
- Saved trip history UI
- Children count with scoring delta
- Mobile layout optimization

---

## 6. Out of Scope

- Restaurant reservation APIs
- Activity booking APIs (Viator — Phase 2)
- User accounts / saved trip history UI
- Children count (no scoring logic defined yet)
- Mobile-specific redesign

---

## 7. Environment Variables Required

```
AMADEUS_CLIENT_ID=
AMADEUS_CLIENT_SECRET=
GOOGLE_PLACES_API_KEY=
```

These must be added to `.env.example` with placeholder values and to Vercel project settings before deploy.

---

## 8. Success Criteria

- User types "Sorsogon" → autocomplete resolves it → full 4-scenario plan with real Amadeus flight prices
- User types "Bangkok" → same flow, real prices, no silent Tokyo fallback
- "Planning for older travelers" panel checked → scenarios reorder to direct flights + local food first
- All tier names, labels, and copy use plain English — zero internal jargon visible
- Submitting the same search twice within 2 hours → second request hits cache, no Amadeus call
- Fallback activates gracefully when Amadeus is unavailable — labeled "Estimated"
- `.env.example` documents all 3 required API keys
