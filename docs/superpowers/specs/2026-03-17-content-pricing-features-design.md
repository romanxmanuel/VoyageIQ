# VoyageIQ: Content Quality, Pricing Honesty & User Features
**Date:** 2026-03-17
**Status:** Approved
**Approach:** Option 3 — Hybrid (curated data for seeded destinations, Claude API for generic)

---

## Problem Statement

Live testing of VoyageIQ (Tokyo, 2 travelers, 7 nights, MCO origin) revealed three categories of issues that undermine user trust:

1. **Content:** Internal template strings appear as real UI content — "Open city highlights block in Tokyo", "Premium district", "Varies by route arrival". Every seeded destination is affected.
2. **Pricing:** Budget flights at $799/person MCO→Tokyo (real: $1,100–$1,400+), hotels at $45/night (real: $75–$110+), activities at $35/person total for 7 days (real: $80–$200+). Users who click through to Kayak immediately see a gap.
3. **Features:** "Save this strategy" is a dead button. No way to share a trip. No destination travel intel (visa, season, transit). No cabin class labels explaining why tier pricing gaps are so large.

---

## Approach: Hybrid Content + Pricing + Features

For **seeded destinations** (Tokyo, Paris, Honolulu, Philippines spots): curated named venue data added directly to seed files.
For **generic destinations** (Google Places lookups): Claude API generates named venue suggestions, dining spots, and travel intel at query time.
Pricing fixes and feature additions are universal across both paths.

---

## Section 1: Content Layer

### 1.1 Venue Data in Seed Files

Each seeded destination file gets a `venues` object:

```ts
venues: {
  activities: {
    lean:      [{ name, neighborhood, estimatedPerPerson, durationHours, description }],
    balanced:  [...],
    elevated:  [...],
    signature: [...]
  },
  dining: {
    casual:   [{ name, neighborhood, cuisine, estimatedPerPerson, description }],
    sitdown:  [...],
    premium:  [...]
  },
  neighborhoods: {
    lean:      "Asakusa",       // budget area
    balanced:  "Shinjuku",
    elevated:  "Shibuya",
    signature: "Ginza"
  },
  travelIntel: {
    bestMonths: "March–May (cherry blossoms) and Oct–Nov. Avoid June–July (rainy season).",
    visaNote:   "US citizens: no visa required for stays under 90 days.",
    currency:   "Japanese Yen (JPY). Tokyo is increasingly card-friendly but cash still needed at smaller spots.",
    transitTip: "Get a Suica IC card at the airport — reloadable, works on all trains/buses. JR Pass ($300–$500) worth it if traveling between cities.",
    arrivalNote: "Haneda (HND): 30 min by monorail (~$5). Narita (NRT): 60–90 min by Narita Express (~$30)."
  }
}
```

**Destinations to update:** Tokyo, Paris, Honolulu, Manila, Cebu, Boracay, El Nido, Bohol, Siargao, Davao, Sorsogon, Naga.

### 1.2 Venue Data Shape and Type Integration

The existing `DestinationSeed` type has top-level `dining: DiningSpot[]` and `activities: ActivityOption[]` (flat arrays, not tier-keyed). The new `venues` block is **additive and preferred** — it does not replace the existing fields.

```ts
// Extend DestinationSeed in types.ts:
venues?: {
  activities: Partial<Record<ScenarioTier, VenueActivity[]>>;
  dining: {
    casual:  VenueDining[];
    sitdown: VenueDining[];
    premium: VenueDining[];
  };
  neighborhoods: Partial<Record<ScenarioTier, string>>;
  travelIntel?: TravelIntel;
};
```

`VenueActivity` and `VenueDining` are new types — distinct from the existing `ActivityOption` and `DiningSpot` to avoid collision. The scenario builder uses a preference pattern: if `destination.venues?.activities[tier]` exists and has entries, use those. Otherwise fall back to the existing flat `destination.activities` array logic.

### 1.3 Scenario Builder Uses Venue Data

`buildTripScenarios` currently generates generic template strings for activities, dining, and neighborhoods. Updated behavior:

- Look up `venues.activities[tier]` for the destination — use named entries
- Look up `venues.neighborhoods[tier]` for hotel area label
- Look up `venues.dining` for restaurant suggestions matched to tier
- Fall through to the existing template strings only if venue data is absent

### 1.4 Claude API for Generic Destinations

When a destination resolves as `isGeneric: true` (Google Places result with no seed data):

1. After `hydrateGenericDestinationSeed`, call a new `enrichGenericDestinationContent(destination, input)` in `hydrate-generic-destination.ts`
2. Claude API call with destination name, country, travelers, and nights. Returns: named activities (3 per tier × 4 tiers), dining spots (3 per category), neighborhoods per tier, and a travelIntel block.
3. Result is merged into `destination.venues` — same shape as seeded venue data
4. **Caching:** Use `cache-service.ts` keyed by `destination.slug`. This is **in-request memoization only** — suitable for Vercel serverless where module-level memory is unreliable across invocations. The cache prevents duplicate calls within a single `buildPlannerViewModel` execution. No cross-request caching is expected; LLM calls for generic destinations are rare and acceptable per-request.
5. **Fallback:** Wrap the Claude API call in a `try/catch`. On failure (timeout, rate limit, API error), log the error and return the seed without venues enrichment — the scenario builder falls back to existing template strings. User experience degrades gracefully to current behavior, not to a broken page.
6. **Timeout:** Set a 6-second timeout on the Claude API call. If not resolved, fall back immediately.

**Prompt contract:** Structured JSON output schema defined in the adapter. Temperature 0. No pricing math delegated to Claude — only venue names, descriptions, neighborhoods, and travel intel text.

---

## Section 2: Pricing Honesty

### 2.1 Flight Floor Prices

Add `flightFloors` to each destination seed, **keyed by the same normalized origin strings used in `ORIGIN_BASELINES`** (lowercase, no spaces — `"orlando"` not `"MCO"`):

```ts
flightFloors: {
  orlando:      { economy: 1100, premiumEconomy: 2200, business: 4000 },  // per person
  "*":          { economy: 900,  premiumEconomy: 1800, business: 3500 }   // global fallback
}
```

Floor enforcement runs **inside `buildTripScenarios`**, before `calculateScenarioCost` is called — not after `enrichScenariosWithLiveData`. This ensures the cost breakdown totals reflect floored fares from the start. When live data later overrides a fare in `enrichScenariosWithLiveData`, the live fare is used as-is (it is already a real price, floors are irrelevant). Floors only gate seeded/estimated fares.

The normalized origin key is derived the same way as `ORIGIN_BASELINES`: `input.origin.toLowerCase().replace(/\s+/g, "")`. Lookup: `flightFloors[normalizedOrigin] ?? flightFloors["*"]`.

### 2.2 Hotel Nightly Rate Floors

Add `hotelFloors` to each destination seed:

```ts
hotelFloors: {
  lean:      75,   // minimum realistic double room / night
  balanced:  120,
  elevated:  220,
  signature: 350
}
```

The stay builder checks `Math.max(computedRate, hotelFloors[tier])` before assigning the nightly rate.

### 2.3 Activity Budget Corrections

Activity costs are corrected in the venue data introduced in Section 1 — named entries have realistic per-person costs. No separate multiplier fix needed; the fix is the data.

**Tokyo reference:**
- Lean: Senso-ji (free), Shibuya crossing (free), Ueno Park ($0–$5) → $20–$40/person
- Balanced: Meiji Shrine + Harajuku, Tsukiji market breakfast, Tokyo Skytree ($20) → $60–$100/person
- Elevated: teamLab Borderless ($25), sake tasting ($40), cooking class ($60) → $150–$200/person
- Signature: Robot Restaurant ($100), private sake experience ($80), Shinkansen day trip ($120) → $300–$500/person

### 2.4 Pricing Source Labels

Each flight card shows a small label indicating source and cabin class:
- `Economy · Estimated` (seeded floor or multiplier — `pricingSource: "seeded"`)
- `Economy · Live` (Travelpayouts — `pricingSource: "travelpayouts"`)
- `Economy · Live` (Amadeus economy — `pricingSource: "amadeus"`)
- `Business · Live` (Amadeus business fare — `pricingSource: "amadeus"`, `cabin: "BUSINESS"`)
- `Economy · Verified` (`pricingSource: "public-verifier"` — treat as estimated, not guaranteed live)
- `Business · Estimated` (multiplier-derived with no live data)

This makes the tier pricing gap legible — users currently can't tell why Treat yourself costs 5x Budget.

### 2.5 Arrival Transfer Line Item

Add `arrivalTransferCost` to destination seeds (round-trip total per group):

```ts
arrivalTransferCost: { low: 30, high: 100 }  // Tokyo: monorail vs Narita Express
```

**Do not fold this into `transitPerDay`** — that would inflate the per-day multiplied calculation. Instead, add a new `arrivalTransferTotal` field to `CostBreakdown` and a corresponding `arrivalTransferTotal` input to `calculateScenarioCost`:

```ts
// calculateScenarioCost input gets a new field:
arrivalTransferTotal: number  // one-time, not multiplied by days

// CostBreakdown gets a new field:
arrivalTransferTotal: number

// totalTripCost includes it as a lump sum:
const totalBeforeOverheads = airfareTotal + lodgingTotal + foodTotal + activitiesTotal + localTransitTotal + arrivalTransferTotal;
```

Shown in the UI as "Airport transfers" with a range note: *"$30–$100 depending on which airport and transport."* Use the `low` value for the calculation. The range note is for user awareness only.

### 2.6 Tokyo-Specific Travel Costs (Travel Intel)

JR Pass and pocket WiFi/SIM are shown as travel intel notes, **not** in the total (they're optional):
- *"JR Pass ($300–$500): worth it if you plan to travel outside Tokyo."*
- *"Pocket WiFi or SIM card: $8–$15/day. Reserve before you leave."*

---

## Section 3: User Features

### 3.1 Share via URL

The URL already encodes all planner params. Changes:
- Add `tier` param (values: `"lean" | "balanced" | "elevated" | "signature"`) to the URL when a tier is selected
- Update `parsePlannerSearchParams` in `features/search/planner-input.ts` to read and validate this param and include it in `PlannerInput`
- `buildPlannerViewModel` uses the requested tier to set `selectedScenarioIndex` when provided
- Replace dead "Save this strategy" button with "Copy link" — copies `window.location.href`
- No auth, no database, no new infra

### 3.2 Travel Intel Card

A collapsible card in the results panel (above the day-by-day plan) showing:
- Best months to visit (from `travelIntel.bestMonths`)
- Visa note (from `travelIntel.visaNote`)
- Currency + cash tips (from `travelIntel.currency`)
- Transit tip (from `travelIntel.transitTip`)
- Arrival note (from `travelIntel.arrivalNote`)

For generic destinations, content comes from the Claude API enrichment in Section 1.

### 3.3 Real Neighborhood Names in Itinerary

Day headings, arrival instructions, and hotel area labels use `venues.neighborhoods[tier]` — e.g., "Asakusa" instead of "City center", "Ginza" instead of "Premium district". Already covered by the scenario builder change in Section 1.3.

### 3.4 "Best Time to Go" Sentence

The current generic placeholder ("Check local weather because the best season depends on the region") is replaced with the `bestMonths` sentence from travel intel. For Tokyo in April: *"April is cherry blossom season — one of the best times to visit, but also the busiest. Book early."*

---

## Implementation Scope Note on Destination Data

Twelve destination seed files require `venues`, `flightFloors`, `hotelFloors`, and `arrivalTransferCost`. This is a substantial data-entry effort.

**Phase 1 (Day 1):** Tokyo, Paris, Honolulu — highest-traffic seeded destinations. Full venue data, full floor data.
**Phase 2:** All Philippines destinations (Manila, Cebu, Boracay, El Nido, Bohol, Siargao, Davao, Sorsogon, Naga) — add floor data and neighborhoods. Full venue data for Boracay and El Nido first (highest traffic).
**Generic destinations:** Claude API enrichment covers all others immediately after the adapter is built.

## What's Out of Scope

- PDF export
- Full auth + database-persisted saved trips
- Map view of itinerary
- Mobile app
- Non-Tokyo origin flight floors (global floor map can grow incrementally)

---

## Data Flow Summary

```
User submits form
  → resolveDestination()
      → seeded: load seed + venues data  →  buildTripScenarios(seed, venues)
      → generic: hydrateGenericSeed  →  enrichGenericContent(Claude API)  →  buildTripScenarios()
  → enrichScenariosWithLiveData() (flights + hotels, unchanged)
  → applyFlightFloors() + applyHotelFloors()  ← NEW
  → calculateScenarioCost()
  → attachScenarioSimilarity()
  → attachScenarioVerification()
  → buildPlannerViewModel()
      → includes travelIntel, realNeighborhoods, pricingSourceLabels  ← NEW
  → render ScenarioExplorer with named venues, real neighborhoods, travel intel card
```

---

## Files Affected

| File | Change |
|------|--------|
| `domain/trip/data/core-destinations.ts` | Add `venues`, `flightFloors`, `hotelFloors`, `arrivalTransferCost` to Tokyo, Paris, Honolulu |
| `domain/trip/data/philippines-*.ts` | Add floor data + neighborhoods to all; full venue data for Boracay, El Nido first |
| `domain/trip/types.ts` | Extend `DestinationSeed` with `venues?`, `flightFloors?`, `hotelFloors?`, `arrivalTransferCost?`; add `VenueActivity`, `VenueDining`, `TravelIntel` types; extend `CostBreakdown` with `arrivalTransferTotal` |
| `domain/scenarios/build-trip-scenarios.ts` | Prefer `venues` data over template strings; apply flight/hotel floors before `calculateScenarioCost` call |
| `domain/pricing/calculate-scenario-cost.ts` | Add `arrivalTransferTotal` as a lump-sum input; include in total without per-day multiplication |
| `server/services/hydrate-generic-destination.ts` | Add Claude API enrichment call with 6s timeout + graceful fallback |
| `server/services/build-planner-view-model.ts` | No floor enforcement changes here — floors handled in `buildTripScenarios` |
| `features/search/planner-input.ts` | Parse and validate `tier` URL param; include in `PlannerInput` |
| `components/results/scenario-explorer.tsx` | Add travel intel card, cabin class + source labels, copy link button |
| `lib/travel-links.ts` | Pass tier to URL builder for shareable links |
| `adapters/ai/claude-enrichment-adapter.ts` | New: Claude API call for generic destination content, structured JSON output |
