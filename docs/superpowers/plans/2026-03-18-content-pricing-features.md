# VoyageIQ: Content Quality, Pricing Honesty & User Features — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add named venue data, real pricing floors, arrival transfer costs, and user features (share URL, travel intel card, pricing labels) so VoyageIQ shows credible prices and useful destination content instead of template strings.

**Architecture:** Three-layer change — types/pricing math first, seed data second (Tokyo → Paris → Honolulu), then UI/features. Seeded destinations get curated `venues` data added to `domain/trip/data/core-destinations.ts`. Generic destinations get Claude API enrichment in `adapters/ai/claude-enrichment-adapter.ts`. Flight/hotel floors are enforced inside `buildTripScenarios` before `calculateScenarioCost` is called. Arrival transfer cost is a new lump sum, not multiplied by nights.

**Tech Stack:** TypeScript strict, Next.js 15, Vitest, Zod, Anthropic SDK (claude-haiku-4-5-20251001 for enrichment), Tailwind CSS, Framer Motion, lucide-react

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `domain/trip/types.ts` | Modify | Add `VenueActivity`, `VenueDining`, `TravelIntel` types; extend `DestinationSeed` and `CostBreakdown` |
| `domain/pricing/calculate-scenario-cost.ts` | Modify | Add `arrivalTransferTotal` as optional lump-sum input |
| `domain/scenarios/build-trip-scenarios.ts` | Modify | Apply flight/hotel floors; use `venues.neighborhoods`; pass `arrivalTransferTotal` |
| `domain/trip/data/core-destinations.ts` | Modify | Add `venues`, `flightFloors`, `hotelFloors`, `arrivalTransferCost` to Tokyo, Paris, Honolulu |
| `adapters/ai/claude-enrichment-adapter.ts` | Create | Call LLM enrichment API with 6s timeout; return structured venue data or null |
| `server/services/hydrate-generic-destination.ts` | Modify | Call enrichment adapter after Google Places hydration |
| `server/services/build-planner-view-model.ts` | Modify | Pass `arrivalTransferTotal` in live-enrichment `calculateScenarioCost` call; use `input.tier` for `selectedScenarioIndex` |
| `features/search/planner-input.ts` | Modify | Add `tier` URL param to schema |
| `components/results/scenario-explorer.tsx` | Modify | Add travel intel card, copy link button, pricing source labels, tier→URL sync |
| `tests/domain/pricing/calculate-scenario-cost.test.ts` | Create | Unit tests for `arrivalTransferTotal` behavior |
| `tests/domain/scenarios/build-trip-scenarios.test.ts` | Create | Unit tests for floor enforcement and venue neighborhood usage |
| `tests/domain/trip/data/core-destinations.test.ts` | Create | Shape-validation tests for Tokyo/Paris/Honolulu venue data |
| `tests/adapters/ai/claude-enrichment-adapter.test.ts` | Create | Unit tests for enrichment adapter with mocked SDK |
| `tests/features/search/planner-input.test.ts` | Create | Unit tests for `tier` param parsing |
| `domain/trip/data/philippines-*.ts` | Phase 2 | Add `flightFloors`, `hotelFloors`, `arrivalTransferCost`, and `venues.neighborhoods` to all Philippines destinations; full venue data for Boracay and El Nido first (see Phase 2 section below) |
| `lib/travel-links.ts` | No change needed | The copy-link feature copies `window.location.href` directly — the `?tier=` param is already in the URL from the tier-select handler. No changes to URL builder functions required. |

---

## Chunk 1: Foundation — Types and Pricing Math

**Files:**
- Modify: `domain/trip/types.ts`
- Modify: `domain/pricing/calculate-scenario-cost.ts`
- Create: `tests/domain/pricing/calculate-scenario-cost.test.ts`

### Task 1: Add new types and extend DestinationSeed + CostBreakdown

- [ ] **Step 1: Add VenueActivity, VenueDining, TravelIntel interfaces**

In `domain/trip/types.ts`, insert after the `ActivityOption` interface (line 70):

```ts
export interface VenueActivity {
  name: string;
  neighborhood: string;
  estimatedPerPerson: number;
  durationHours: number;
  description: string;
}

export interface VenueDining {
  name: string;
  neighborhood: string;
  cuisine: string;
  estimatedPerPerson: number;
  description: string;
}

export interface TravelIntel {
  bestMonths: string;
  visaNote: string;
  currency: string;
  transitTip: string;
  arrivalNote: string;
}
```

- [ ] **Step 2: Extend DestinationSeed with optional fields**

In `domain/trip/types.ts`, add to the end of `DestinationSeed` (after `activities: ActivityOption[]`):

```ts
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
  flightFloors?: Record<string, { economy: number; premiumEconomy: number; business: number }>;
  hotelFloors?: Partial<Record<ScenarioTier, number>>;
  arrivalTransferCost?: { low: number; high: number };
```

- [ ] **Step 3: Add arrivalTransferTotal to CostBreakdown**

In `domain/trip/types.ts`, update `CostBreakdown`:

```ts
export interface CostBreakdown {
  airfareTotal: number;
  lodgingTotal: number;
  foodTotal: number;
  activitiesTotal: number;
  localTransitTotal: number;
  arrivalTransferTotal: number;   // ← new: one-time, not per-day
  taxesAndFees: number;
  contingencyBuffer: number;
  totalTripCost: number;
  costPerTraveler: number;
  costPerDay: number;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add domain/trip/types.ts
git commit -m "feat: add VenueActivity, VenueDining, TravelIntel types and extend DestinationSeed"
```

---

### Task 2: Update calculateScenarioCost with arrivalTransferTotal

- [ ] **Step 1: Write failing test**

Create `tests/domain/pricing/calculate-scenario-cost.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { calculateScenarioCost } from "@/domain/pricing/calculate-scenario-cost";

describe("calculateScenarioCost", () => {
  const baseInput = {
    travelers: 2,
    nights: 7,
    airfareTotal: 2200,
    lodgingTotal: 1050,
    dailyFoodPerTraveler: 60,
    activitiesTotal: 400,
    transitPerDay: 36,
    arrivalTransferTotal: 60,
  };

  it("includes arrivalTransferTotal as a lump sum in totalTripCost", () => {
    const result = calculateScenarioCost(baseInput);
    expect(result.arrivalTransferTotal).toBe(60);
    const foodTotal = 60 * 2 * 7;           // 840
    const transitTotal = 36 * 7;            // 252
    const subtotal = 2200 + 1050 + 840 + 400 + 252 + 60;
    const taxes = Math.round(subtotal * 0.11);
    const buffer = Math.round(subtotal * 0.06);
    expect(result.totalTripCost).toBe(subtotal + taxes + buffer);
  });

  it("defaults arrivalTransferTotal to 0 when omitted", () => {
    const result = calculateScenarioCost({ ...baseInput, arrivalTransferTotal: 0 });
    expect(result.arrivalTransferTotal).toBe(0);
  });

  it("does not multiply arrivalTransferTotal by nights", () => {
    const result7  = calculateScenarioCost({ ...baseInput, nights: 7 });
    const result14 = calculateScenarioCost({ ...baseInput, nights: 14 });
    expect(result7.arrivalTransferTotal).toBe(result14.arrivalTransferTotal);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npx vitest run tests/domain/pricing/calculate-scenario-cost.test.ts`
Expected: FAIL — `arrivalTransferTotal` missing from return value

- [ ] **Step 3: Rewrite calculate-scenario-cost.ts**

Replace `domain/pricing/calculate-scenario-cost.ts` entirely:

```ts
import { CostBreakdown } from "@/domain/trip/types";

interface CostInput {
  travelers: number;
  nights: number;
  airfareTotal: number;
  lodgingTotal: number;
  dailyFoodPerTraveler: number;
  activitiesTotal: number;
  transitPerDay: number;
  arrivalTransferTotal?: number;
}

export function calculateScenarioCost(input: CostInput): CostBreakdown {
  const days = Math.max(input.nights, 1);
  const arrivalTransferTotal = input.arrivalTransferTotal ?? 0;
  const foodTotal = Math.round(input.dailyFoodPerTraveler * input.travelers * days);
  const localTransitTotal = Math.round(input.transitPerDay * days);
  const subtotal =
    input.airfareTotal +
    input.lodgingTotal +
    foodTotal +
    input.activitiesTotal +
    localTransitTotal +
    arrivalTransferTotal;
  const taxesAndFees = Math.round(subtotal * 0.11);
  const contingencyBuffer = Math.round(subtotal * 0.06);
  const totalTripCost = subtotal + taxesAndFees + contingencyBuffer;

  return {
    airfareTotal: input.airfareTotal,
    lodgingTotal: input.lodgingTotal,
    foodTotal,
    activitiesTotal: input.activitiesTotal,
    localTransitTotal,
    arrivalTransferTotal,
    taxesAndFees,
    contingencyBuffer,
    totalTripCost,
    costPerTraveler: Math.round(totalTripCost / input.travelers),
    costPerDay: Math.round(totalTripCost / days),
  };
}
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `npx vitest run tests/domain/pricing/calculate-scenario-cost.test.ts`
Expected: PASS

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: no regressions

- [ ] **Step 6: Commit**

```bash
git add domain/pricing/calculate-scenario-cost.ts tests/domain/pricing/calculate-scenario-cost.test.ts
git commit -m "feat: add arrivalTransferTotal lump sum to calculateScenarioCost"
```

---

## Chunk 2: Scenario Builder — Floor Enforcement and Venue Preference

**Files:**
- Modify: `domain/scenarios/build-trip-scenarios.ts`
- Modify: `server/services/build-planner-view-model.ts`
- Create: `tests/domain/scenarios/build-trip-scenarios.test.ts`

### Task 3: Apply floors and venue neighborhood in buildTripScenarios

- [ ] **Step 1: Write failing tests**

Create `tests/domain/scenarios/build-trip-scenarios.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildTripScenarios } from "@/domain/scenarios/build-trip-scenarios";
import type { DestinationMatch, DestinationSeed } from "@/domain/trip/types";

const minimalSeed: DestinationSeed = {
  slug: "test-dest",
  name: "Test City",
  country: "Testland",
  regionLabel: "Central",
  airportCode: "TST",
  heroTitle: "Test",
  summary: "Test summary",
  recommendedWindow: "Any time",
  aliases: ["test"],
  averageTransitPerDay: 15,
  mapNote: "Walk",
  flights: {
    lean:      { airline: "Air", departWindow: "Mon", arriveWindow: "Tue", durationHours: 8, stops: 1, layover: "NYC", cabin: "Economy",       bookingTip: "Early", baseFarePerTraveler: 200 },
    balanced:  { airline: "Air", departWindow: "Mon", arriveWindow: "Tue", durationHours: 8, stops: 1, layover: "NYC", cabin: "Economy",       bookingTip: "Early", baseFarePerTraveler: 300 },
    elevated:  { airline: "Air", departWindow: "Mon", arriveWindow: "Tue", durationHours: 8, stops: 1, layover: "NYC", cabin: "Premium",       bookingTip: "Early", baseFarePerTraveler: 500 },
    signature: { airline: "Air", departWindow: "Mon", arriveWindow: "Tue", durationHours: 8, stops: 1, layover: "NYC", cabin: "Business",      bookingTip: "Early", baseFarePerTraveler: 800 },
  },
  stays: {
    lean:      { name: "Budget Inn",    style: "Hostel",   address: "1 St", nightlyRate: 30,  neighborhood: "Downtown", whyItWorks: "Cheap" },
    balanced:  { name: "Mid Hotel",     style: "Hotel",    address: "2 St", nightlyRate: 80,  neighborhood: "Center",   whyItWorks: "Good"  },
    elevated:  { name: "Nice Hotel",    style: "Boutique", address: "3 St", nightlyRate: 150, neighborhood: "Uptown",   whyItWorks: "Nice"  },
    signature: { name: "Luxury Hotel",  style: "Luxury",   address: "4 St", nightlyRate: 350, neighborhood: "Premium",  whyItWorks: "Best"  },
  },
  dining: [],
  activities: [],
};

function buildMatch(seed: DestinationSeed): DestinationMatch {
  return {
    destination: seed,
    originalQuery: "test",
    normalizedQuery: "test",
    matchedAlias: "test",
    isFallback: false,
    isVerified: true,
    isGeneric: false,
    helperText: "",
    iataCode: "TST",
    cityCode: "TST",
    coordinates: { lat: 0, lng: 0 },
  };
}

const baseInput = {
  destinationQuery: "test",
  origin: "Orlando",
  travelers: 2,
  nights: 7,
  preferDirectFlights: false,
  preferLocalFood: false,
  lowWalkingIntensity: false,
};

describe("buildTripScenarios — floor enforcement", () => {
  it("enforces economy flight floor when seeded fare is too low", () => {
    const seed: DestinationSeed = {
      ...minimalSeed,
      flightFloors: {
        orlando: { economy: 600, premiumEconomy: 1200, business: 3000 },
        "*":     { economy: 500, premiumEconomy: 1000, business: 2500 },
      },
    };
    const scenarios = buildTripScenarios(baseInput, buildMatch(seed));
    const lean = scenarios.find(s => s.tier === "lean")!;
    // seeded 200, floor 600 → should floor at 600
    expect(lean.flight.baseFarePerTraveler).toBeGreaterThanOrEqual(600);
  });

  it("does not reduce fare below seeded price if seeded price already exceeds floor", () => {
    const seed: DestinationSeed = {
      ...minimalSeed,
      flightFloors: {
        orlando: { economy: 100, premiumEconomy: 200, business: 400 },
        "*":     { economy: 100, premiumEconomy: 200, business: 400 },
      },
    };
    const scenarios = buildTripScenarios(baseInput, buildMatch(seed));
    const lean = scenarios.find(s => s.tier === "lean")!;
    // seeded is 200, floor is 100 → stays near seeded
    expect(lean.flight.baseFarePerTraveler).toBeGreaterThanOrEqual(180); // allow multiplier
  });

  it("enforces hotel floor when nightly rate is below the floor", () => {
    const seed: DestinationSeed = {
      ...minimalSeed,
      hotelFloors: { lean: 75, balanced: 120, elevated: 220, signature: 350 },
    };
    const scenarios = buildTripScenarios(baseInput, buildMatch(seed));
    expect(scenarios.find(s => s.tier === "lean")!.stay.nightlyRate).toBeGreaterThanOrEqual(75);
    expect(scenarios.find(s => s.tier === "balanced")!.stay.nightlyRate).toBeGreaterThanOrEqual(120);
  });

  it("includes arrivalTransferCost.low in cost breakdown as lump sum", () => {
    const seed: DestinationSeed = {
      ...minimalSeed,
      arrivalTransferCost: { low: 60, high: 120 },
    };
    const scenarios = buildTripScenarios(baseInput, buildMatch(seed));
    for (const scenario of scenarios) {
      expect(scenario.cost.arrivalTransferTotal).toBe(60);
    }
  });

  it("uses venues.neighborhoods[tier] for stay neighborhood when present", () => {
    const seed: DestinationSeed = {
      ...minimalSeed,
      venues: {
        activities: {},
        dining: { casual: [], sitdown: [], premium: [] },
        neighborhoods: { lean: "Asakusa", balanced: "Shinjuku", elevated: "Shibuya", signature: "Ginza" },
      },
    };
    const scenarios = buildTripScenarios(baseInput, buildMatch(seed));
    expect(scenarios.find(s => s.tier === "lean")!.stay.neighborhood).toBe("Asakusa");
    expect(scenarios.find(s => s.tier === "balanced")!.stay.neighborhood).toBe("Shinjuku");
    expect(scenarios.find(s => s.tier === "signature")!.stay.neighborhood).toBe("Ginza");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npx vitest run tests/domain/scenarios/build-trip-scenarios.test.ts`
Expected: FAIL — floor logic and venue neighborhood not implemented

- [ ] **Step 3: Add helper function for tier-aware flight floor lookup**

In `domain/scenarios/build-trip-scenarios.ts`, add this function near the other helpers (before `buildTripScenarios`):

```ts
function getFlightFloor(
  floors: Record<string, { economy: number; premiumEconomy: number; business: number }> | undefined,
  normalizedOrigin: string,
  tier: ScenarioTier,
  cabinLabel: string
): number {
  if (!floors) return 0;
  const floorSet = floors[normalizedOrigin] ?? floors["*"];
  if (!floorSet) return 0;
  const cabin = cabinLabel.toLowerCase();
  if (tier === "signature" || cabin.includes("business")) return floorSet.business;
  if (tier === "elevated" || cabin.includes("premium")) return floorSet.premiumEconomy;
  return floorSet.economy;
}
```

- [ ] **Step 4: Apply floor enforcement and venue preference inside buildTripScenarios**

In `buildTripScenarios`, inside the `(Object.keys(SCENARIO_META) as ScenarioTier[]).map((tier) => {` block, make the following targeted changes:

**A. Flight floor:** After computing `airfarePerTraveler`, add:

```ts
const normalizedOrigin = normalize(input.origin);
const flightFloorAmount = getFlightFloor(destination.flightFloors, normalizedOrigin, tier, flightTemplate.cabin);
const flooredFarePerTraveler = Math.max(airfarePerTraveler, flightFloorAmount);
const airfareTotal = flooredFarePerTraveler * input.travelers;
```

Replace the old `const airfareTotal = airfarePerTraveler * input.travelers;` line.

**B. Hotel floor:** After computing `const lodgingTotal = stay.nightlyRate * input.nights;`, replace with:

```ts
const hotelFloor = destination.hotelFloors?.[tier] ?? 0;
const flooredNightlyRate = Math.max(stay.nightlyRate, hotelFloor);
const lodgingTotal = flooredNightlyRate * input.nights;
```

**C. Neighborhood from venues:** After extracting `const stay = destination.stays[tier];`, add:

```ts
const stayNeighborhood = destination.venues?.neighborhoods?.[tier] ?? stay.neighborhood;
```

Use `stayNeighborhood` everywhere `stay.neighborhood` is used in this scope (itinerary build, arrivalPlan).

**D. Arrival transfer:** In the `calculateScenarioCost` call, add:

```ts
arrivalTransferTotal: destination.arrivalTransferCost?.low ?? 0,
```

**E. Update FlightPlan to use floored fare:**

```ts
const flight: FlightPlan = {
  ...flightTemplate,
  baseFarePerTraveler: flooredFarePerTraveler,   // ← was: airfarePerTraveler
  totalCost: airfareTotal,
  pricingSource: "seeded",
  isLivePrice: false,
};
```

- [ ] **Step 5: Run tests to confirm they pass**

Run: `npx vitest run tests/domain/scenarios/build-trip-scenarios.test.ts`
Expected: PASS

- [ ] **Step 6: Fix enrichScenariosWithLiveData to include arrivalTransferTotal**

In `server/services/build-planner-view-model.ts`, find the `calculateScenarioCost` call inside `enrichScenariosWithLiveData` (around line 150). Add `arrivalTransferTotal`:

```ts
const arrivalTransferTotal = match.destination.arrivalTransferCost?.low ?? 0;
scenario.cost = calculateScenarioCost({
  travelers: input.travelers,
  nights: input.nights,
  airfareTotal: scenario.flight.totalCost,
  lodgingTotal: scenario.stay.nightlyRate * input.nights,
  dailyFoodPerTraveler: scenario.diningPlan.dailyBudgetPerTraveler,
  activitiesTotal,
  transitPerDay,
  arrivalTransferTotal,
});
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 8: Run all tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add domain/scenarios/build-trip-scenarios.ts server/services/build-planner-view-model.ts tests/domain/scenarios/build-trip-scenarios.test.ts
git commit -m "feat: enforce flight/hotel price floors and add arrival transfer to scenario cost"
```

---

## Chunk 3: Tokyo Venue Data

**Files:**
- Modify: `domain/trip/data/core-destinations.ts`
- Create: `tests/domain/trip/data/core-destinations.test.ts`

### Task 4: Add venues, floors, and transfer cost to Tokyo

- [ ] **Step 1: Write shape-validation test**

Create `tests/domain/trip/data/core-destinations.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { coreDestinations } from "@/domain/trip/data/core-destinations";

describe("Tokyo seed data", () => {
  const tokyo = coreDestinations.find(d => d.slug === "tokyo")!;

  it("exists", () => { expect(tokyo).toBeDefined(); });

  it("has flightFloors.orlando.economy >= 1100", () => {
    expect(tokyo.flightFloors?.["orlando"]?.economy).toBeGreaterThanOrEqual(1100);
  });

  it("has hotelFloors for all tiers", () => {
    expect(tokyo.hotelFloors?.lean).toBeGreaterThanOrEqual(75);
    expect(tokyo.hotelFloors?.balanced).toBeGreaterThanOrEqual(120);
    expect(tokyo.hotelFloors?.elevated).toBeGreaterThanOrEqual(220);
    expect(tokyo.hotelFloors?.signature).toBeGreaterThanOrEqual(350);
  });

  it("has arrivalTransferCost", () => {
    expect(tokyo.arrivalTransferCost?.low).toBeGreaterThan(0);
    expect(tokyo.arrivalTransferCost?.high).toBeGreaterThan(tokyo.arrivalTransferCost!.low);
  });

  it("has venues.travelIntel with all required fields", () => {
    expect(tokyo.venues?.travelIntel?.bestMonths).toBeTruthy();
    expect(tokyo.venues?.travelIntel?.visaNote).toBeTruthy();
    expect(tokyo.venues?.travelIntel?.currency).toBeTruthy();
    expect(tokyo.venues?.travelIntel?.transitTip).toBeTruthy();
    expect(tokyo.venues?.travelIntel?.arrivalNote).toBeTruthy();
  });

  it("has venues.neighborhoods for all tiers", () => {
    expect(tokyo.venues?.neighborhoods?.lean).toBeTruthy();
    expect(tokyo.venues?.neighborhoods?.balanced).toBeTruthy();
    expect(tokyo.venues?.neighborhoods?.elevated).toBeTruthy();
    expect(tokyo.venues?.neighborhoods?.signature).toBeTruthy();
  });

  it("has at least 2 lean activities and 2 signature activities in venues", () => {
    expect((tokyo.venues?.activities?.lean?.length ?? 0)).toBeGreaterThanOrEqual(2);
    expect((tokyo.venues?.activities?.signature?.length ?? 0)).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npx vitest run tests/domain/trip/data/core-destinations.test.ts`
Expected: FAIL — venue data not yet added

- [ ] **Step 3: Add venue data to Tokyo in core-destinations.ts**

Find the Tokyo object in `domain/trip/data/core-destinations.ts` (slug: "tokyo") and add the following after the closing bracket of `activities: [...]`:

```ts
    flightFloors: {
      orlando:    { economy: 1100, premiumEconomy: 2000, business: 3800 },
      miami:      { economy: 1100, premiumEconomy: 2000, business: 3800 },
      newyork:    { economy: 950,  premiumEconomy: 1800, business: 3500 },
      losangeles: { economy: 850,  premiumEconomy: 1600, business: 3200 },
      "*":        { economy: 950,  premiumEconomy: 1800, business: 3500 },
    },
    hotelFloors: {
      lean:      75,
      balanced:  120,
      elevated:  220,
      signature: 350,
    },
    arrivalTransferCost: { low: 30, high: 60 },
    venues: {
      neighborhoods: {
        lean:      "Asakusa",
        balanced:  "Shinjuku",
        elevated:  "Shibuya",
        signature: "Ginza",
      },
      activities: {
        lean: [
          { name: "Senso-ji Temple and Nakamise Walk", neighborhood: "Asakusa", estimatedPerPerson: 0, durationHours: 2.5, description: "Tokyo's most iconic temple with a covered market street. Free to enter and worth a full morning." },
          { name: "Ueno Park and Museums", neighborhood: "Ueno", estimatedPerPerson: 5, durationHours: 3, description: "Large public park with several affordable museums, a zoo, and the city's best cherry blossom corridor." },
          { name: "Shibuya Crossing and Takeshita Street", neighborhood: "Shibuya", estimatedPerPerson: 0, durationHours: 2, description: "The world's busiest pedestrian crossing plus Harajuku's street food and fashion alley. Free." },
        ],
        balanced: [
          { name: "Tokyo Skytree Observation Deck", neighborhood: "Sumida", estimatedPerPerson: 22, durationHours: 2, description: "Best city overview from Japan's tallest structure. Tembo Deck at 350m is the right ticket — book online to skip the queue." },
          { name: "Tsukiji Outer Market Breakfast", neighborhood: "Tsukiji", estimatedPerPerson: 20, durationHours: 1.5, description: "Rows of vendors with fresh sushi, tamagoyaki, and oysters from early morning. Arrive before 10am." },
          { name: "Meiji Shrine and Yoyogi Park", neighborhood: "Harajuku", estimatedPerPerson: 0, durationHours: 2, description: "Serene forested shrine inside the city center. One of the few places in Tokyo that genuinely feels quiet." },
        ],
        elevated: [
          { name: "teamLab Borderless at Azabudai Hills", neighborhood: "Azabudai", estimatedPerPerson: 32, durationHours: 2.5, description: "Fully immersive digital art museum. Reopened in 2024 inside the new Azabudai Hills complex. Book in advance." },
          { name: "Sake Tasting at Kurand Sake Market", neighborhood: "Ikebukuro", estimatedPerPerson: 45, durationHours: 2, description: "All-you-can-taste sake bar with 100+ labels from across Japan. Good for a 90-minute evening slot." },
          { name: "Shinjuku Gyoen National Garden", neighborhood: "Shinjuku", estimatedPerPerson: 5, durationHours: 2, description: "One of the best public gardens in Asia. Cherry blossom crowds in spring; calm and green the rest of the year." },
        ],
        signature: [
          { name: "Private Evening Food Crawl in Ebisu", neighborhood: "Ebisu", estimatedPerPerson: 120, durationHours: 3, description: "Guide-led 4-stop izakaya and ramen walk through one of Tokyo's best eating districts. No planning required." },
          { name: "Day Trip to Nikko by Limited Express", neighborhood: "Nikko", estimatedPerPerson: 130, durationHours: 8, description: "UNESCO shrine complex 90 minutes from Shinjuku. Lavishly decorated temples and cedar forest. Quieter on weekdays." },
          { name: "Robot Restaurant Show and Shinjuku Night", neighborhood: "Shinjuku", estimatedPerPerson: 100, durationHours: 3, description: "Loud, maximalist entertainment show in Kabukicho. Intentionally over the top. Best experienced once." },
        ],
      },
      dining: {
        casual: [
          { name: "Ichiran Shibuya", neighborhood: "Shibuya", cuisine: "Ramen", estimatedPerPerson: 18, description: "Solo-booth tonkotsu ramen chain. Consistent, no-rush, and one of the best first-night spots for new arrivals." },
          { name: "Yoshinoya Gyudon", neighborhood: "Shinjuku", cuisine: "Gyudon", estimatedPerPerson: 8, description: "Classic Japanese beef rice bowl. Quick, filling, and dirt cheap. A practical daily option for lean budgets." },
          { name: "Tsukiji Outer Market stalls", neighborhood: "Tsukiji", cuisine: "Seafood", estimatedPerPerson: 22, description: "Morning market stalls with fresh sushi, tamagoyaki, and tuna skewers. Best before 10am." },
        ],
        sitdown: [
          { name: "Gonpachi Nishi-Azabu", neighborhood: "Nishi-Azabu", cuisine: "Izakaya", estimatedPerPerson: 54, description: "Multi-floor yakitori and soba in a stunning timber hall. The Kill Bill restaurant — worth it for the atmosphere alone." },
          { name: "Uobei Shibuya Dogenzaka", neighborhood: "Shibuya", cuisine: "Conveyor sushi", estimatedPerPerson: 24, description: "High-speed conveyor sushi sent to your seat by touch-screen order. Fast, fun, and consistently good." },
          { name: "Yakitori Alley under Yurakucho Tracks", neighborhood: "Yurakucho", cuisine: "Yakitori", estimatedPerPerson: 35, description: "Tiny smoke-filled stalls under elevated rail tracks grilling skewers since the 1950s. Cash only, outdoor seating." },
        ],
        premium: [
          { name: "Sushi Daiwa at Toyosu Market", neighborhood: "Toyosu", cuisine: "Omakase sushi", estimatedPerPerson: 95, description: "Morning omakase counter. A fraction of the price of high-end Ginza sushi with comparable quality." },
          { name: "New York Grill at Park Hyatt Shinjuku", neighborhood: "Shinjuku", cuisine: "Modern American", estimatedPerPerson: 110, description: "The Lost in Translation bar-restaurant on the 52nd floor. Best at sunset or late evening for the full effect." },
          { name: "Ginza Kyubey", neighborhood: "Ginza", cuisine: "Omakase sushi", estimatedPerPerson: 180, description: "Legendary Ginza sushi counter open since 1936. Lunch counter sets are more affordable than the dinner omakase." },
        ],
      },
      travelIntel: {
        bestMonths: "Late March to May for cherry blossoms and mild weather. October to November for autumn foliage and cooler temps. Avoid June–July rainy season and August heat and humidity.",
        visaNote: "US citizens: no visa required for stays under 90 days. Passport must be valid for the full duration of your stay. Register your arrival on the Visit Japan Web app before flying.",
        currency: "Japanese Yen (JPY). Tokyo is increasingly card-friendly but cash is still needed at smaller restaurants, shrines, and vending machines. 7-Eleven and Japan Post ATMs accept most foreign cards reliably.",
        transitTip: "Get a Suica IC card at the airport — rechargeable, works on all trains, buses, and convenience stores. JR Pass ($300–$500) is only worth buying if you plan to travel between cities during the trip.",
        arrivalNote: "Haneda (HND): 30 min to central Tokyo via Tokyo Monorail (~$5). Narita (NRT): 60–90 min via Narita Express N'EX (~$30) or 90 min via Limousine Bus (~$25). Taxis from either airport are $80–$150.",
      },
    },
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `npx vitest run tests/domain/trip/data/core-destinations.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add domain/trip/data/core-destinations.ts tests/domain/trip/data/core-destinations.test.ts
git commit -m "feat: add Tokyo venue data, flight/hotel floors, and travel intel"
```

---

## Chunk 4: Paris + Honolulu Venue Data

**Files:**
- Modify: `domain/trip/data/core-destinations.ts`
- Modify: `tests/domain/trip/data/core-destinations.test.ts`

### Task 5: Add venues, floors, and transfer cost to Paris

- [ ] **Step 1: Expand test file to cover Paris**

Add to `tests/domain/trip/data/core-destinations.test.ts`:

```ts
describe("Paris seed data", () => {
  const paris = coreDestinations.find(d => d.slug === "paris")!;

  it("exists", () => { expect(paris).toBeDefined(); });

  it("has flightFloors.orlando.economy >= 600", () => {
    expect(paris.flightFloors?.["orlando"]?.economy).toBeGreaterThanOrEqual(600);
  });

  it("has hotelFloors.lean >= 90", () => {
    expect(paris.hotelFloors?.lean).toBeGreaterThanOrEqual(90);
  });

  it("has arrivalTransferCost", () => {
    expect(paris.arrivalTransferCost?.low).toBeGreaterThan(0);
  });

  it("has venues.travelIntel with visa and currency", () => {
    expect(paris.venues?.travelIntel?.visaNote).toBeTruthy();
    expect(paris.venues?.travelIntel?.currency).toBeTruthy();
  });

  it("has venues.neighborhoods for all tiers", () => {
    expect(paris.venues?.neighborhoods?.lean).toBeTruthy();
    expect(paris.venues?.neighborhoods?.signature).toBeTruthy();
  });

  it("has at least 2 lean activities in venues", () => {
    expect((paris.venues?.activities?.lean?.length ?? 0)).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to confirm Paris tests fail**

Run: `npx vitest run tests/domain/trip/data/core-destinations.test.ts`
Expected: FAIL on Paris describe block

- [ ] **Step 3: Add venue data to Paris in core-destinations.ts**

Find the Paris entry (slug: "paris") and add after its `activities: [...]` array:

```ts
    flightFloors: {
      orlando:  { economy: 650, premiumEconomy: 1300, business: 3000 },
      miami:    { economy: 650, premiumEconomy: 1300, business: 3000 },
      newyork:  { economy: 480, premiumEconomy: 950,  business: 2400 },
      "*":      { economy: 580, premiumEconomy: 1150, business: 2700 },
    },
    hotelFloors: {
      lean:      90,
      balanced:  150,
      elevated:  280,
      signature: 450,
    },
    arrivalTransferCost: { low: 18, high: 55 },
    venues: {
      neighborhoods: {
        lean:      "Montmartre",
        balanced:  "Le Marais",
        elevated:  "Saint-Germain-des-Prés",
        signature: "8th arrondissement",
      },
      activities: {
        lean: [
          { name: "Sacré-Cœur and Montmartre Walk", neighborhood: "Montmartre", estimatedPerPerson: 0, durationHours: 3, description: "The hilltop basilica and artists' quarter. Steep streets with a panoramic view. Free to enter." },
          { name: "Notre-Dame Cathedral", neighborhood: "Île de la Cité", estimatedPerPerson: 0, durationHours: 1.5, description: "Reopened December 2024 after the 2019 fire. Exterior and interior viewing with ticket." },
          { name: "Père Lachaise Cemetery", neighborhood: "20th arrondissement", estimatedPerPerson: 0, durationHours: 2, description: "Famous cemetery with Oscar Wilde, Jim Morrison, and Édith Piaf. Peaceful, photogenic, and free." },
        ],
        balanced: [
          { name: "Louvre Museum (Timed Entry)", neighborhood: "1st arrondissement", estimatedPerPerson: 22, durationHours: 3.5, description: "Book timed-entry online to skip the line. Focus on one wing — the Denon wing for the Mona Lisa and Venus de Milo." },
          { name: "Musée d'Orsay", neighborhood: "7th arrondissement", estimatedPerPerson: 16, durationHours: 2.5, description: "Impressionist masterworks in a converted train station. Van Gogh, Monet, Renoir — one of the best museums in Europe." },
          { name: "Eiffel Tower Stairs Ticket", neighborhood: "7th arrondissement", estimatedPerPerson: 15, durationHours: 2, description: "Climbing the stairs is cheaper than the elevator and less crowded. Book online. Views from the second floor are plenty." },
        ],
        elevated: [
          { name: "Palace of Versailles Day Trip", neighborhood: "Versailles", estimatedPerPerson: 27, durationHours: 5, description: "40 min from central Paris by RER C. Hall of Mirrors, formal gardens, and Marie Antoinette's hamlet. Go on a weekday." },
          { name: "Marais Food and Art Walk", neighborhood: "Le Marais", estimatedPerPerson: 45, durationHours: 3, description: "Guided walk through the historic Jewish quarter with falafel stops, patisseries, and contemporary galleries." },
          { name: "Seine River Dinner Cruise", neighborhood: "Pont de l'Alma", estimatedPerPerson: 85, durationHours: 2, description: "90-minute cruise past Notre-Dame and the Eiffel Tower at night. Bateaux Parisiens is the reliable choice — book ahead." },
        ],
        signature: [
          { name: "Champagne Bar at Galeries Lafayette Rooftop", neighborhood: "9th arrondissement", estimatedPerPerson: 60, durationHours: 1.5, description: "Free rooftop panorama of Paris with optional champagne. Best at golden hour." },
          { name: "Private Cooking Class in Le Marais", neighborhood: "Le Marais", estimatedPerPerson: 130, durationHours: 3, description: "Market visit, croissant demo, and 3-course French cooking class. One of the top Paris experiences for food travelers." },
          { name: "Day Trip to Champagne Region (Reims)", neighborhood: "Reims", estimatedPerPerson: 150, durationHours: 9, description: "90-min train to Reims for a cellar tour and tasting at Taittinger or Veuve Clicquot. Book tastings ahead." },
        ],
      },
      dining: {
        casual: [
          { name: "L'As du Fallafel", neighborhood: "Le Marais", cuisine: "Falafel", estimatedPerPerson: 10, description: "Legendary falafel counter in the Jewish quarter. Short line, eat on the street." },
          { name: "Café de Flore", neighborhood: "Saint-Germain", cuisine: "French café", estimatedPerPerson: 20, description: "Iconic Left Bank café. Croque monsieur and café au lait — the atmosphere costs something but it's worth it once." },
          { name: "Rue Mouffetard Market Stalls", neighborhood: "5th arrondissement", cuisine: "Market", estimatedPerPerson: 15, description: "Outdoor market street with cheese, crepes, bread, and fruit. Best Saturday morning." },
        ],
        sitdown: [
          { name: "Bouillon Chartier", neighborhood: "9th arrondissement", cuisine: "Traditional French", estimatedPerPerson: 22, description: "100-year-old brasserie with classic French food at accessible prices. Long waits but fast service once seated." },
          { name: "Septime", neighborhood: "11th arrondissement", cuisine: "Modern French", estimatedPerPerson: 65, description: "One of Paris's best bistros. Seasonal tasting menu — book 2–3 weeks ahead on their website." },
          { name: "Au Passage", neighborhood: "11th arrondissement", cuisine: "Small plates", estimatedPerPerson: 40, description: "Natural wine bar with seasonal small plates. No reservations, low-key, perfect for late dinner." },
        ],
        premium: [
          { name: "Le Grand Véfour", neighborhood: "1st arrondissement", cuisine: "Haute cuisine", estimatedPerPerson: 200, description: "Two-Michelin-star restaurant in the Palais Royal arcades, operating since 1784." },
          { name: "Taillevent", neighborhood: "8th arrondissement", cuisine: "Classic French", estimatedPerPerson: 180, description: "Institution of French haute cuisine near the Champs-Élysées. More approachable than some three-star options." },
          { name: "Le Cinq at Four Seasons George V", neighborhood: "8th arrondissement", cuisine: "Michelin", estimatedPerPerson: 280, description: "Three-star dining room — one of the most elegant in Paris. Full service dinner takes 3 hours." },
        ],
      },
      travelIntel: {
        bestMonths: "April to June for mild weather, outdoor terrasses, and bloom season. September to October for fewer crowds. July–August is peak tourist season — expect long lines and higher prices.",
        visaNote: "US citizens: no visa required for stays under 90 days (Schengen zone). Passport must be valid at least 3 months beyond your return date.",
        currency: "Euro (EUR). Paris is fully card-friendly; contactless accepted almost everywhere. Keep €20–€50 cash for smaller markets, tips, and the occasional cash-only café.",
        transitTip: "Paris Metro is efficient and cheap (~€2/ride). Buy a rechargeable Navigo Easy card at any Metro station. Avoid taxis from CDG — overpriced. RER B train is €12 and takes 25–35 min to central Paris.",
        arrivalNote: "Charles de Gaulle (CDG): RER B train €12, 25–35 min to Châtelet. Orly (ORY): Orlyval + RER B, €14, 35–45 min. Taxis to central Paris: €50–€65 flat rate.",
      },
    },
```

- [ ] **Step 4: Run tests to confirm Paris tests pass**

Run: `npx vitest run tests/domain/trip/data/core-destinations.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add domain/trip/data/core-destinations.ts tests/domain/trip/data/core-destinations.test.ts
git commit -m "feat: add Paris venue data, flight/hotel floors, and travel intel"
```

---

### Task 6: Add venues, floors, and transfer cost to Honolulu

- [ ] **Step 1: Expand test file to cover Honolulu**

Add to `tests/domain/trip/data/core-destinations.test.ts`:

```ts
describe("Honolulu seed data", () => {
  const honolulu = coreDestinations.find(d => d.slug === "honolulu")!;

  it("exists", () => { expect(honolulu).toBeDefined(); });

  it("has flightFloors.orlando.economy >= 500", () => {
    expect(honolulu.flightFloors?.["orlando"]?.economy).toBeGreaterThanOrEqual(500);
  });

  it("has hotelFloors.lean >= 120", () => {
    expect(honolulu.hotelFloors?.lean).toBeGreaterThanOrEqual(120);
  });

  it("has arrivalTransferCost", () => {
    expect(honolulu.arrivalTransferCost?.low).toBeGreaterThan(0);
  });

  it("has venues.travelIntel with bestMonths and arrivalNote", () => {
    expect(honolulu.venues?.travelIntel?.bestMonths).toBeTruthy();
    expect(honolulu.venues?.travelIntel?.arrivalNote).toBeTruthy();
  });

  it("has at least 2 activities per tier in venues", () => {
    expect((honolulu.venues?.activities?.lean?.length ?? 0)).toBeGreaterThanOrEqual(2);
    expect((honolulu.venues?.activities?.signature?.length ?? 0)).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to confirm Honolulu tests fail**

Run: `npx vitest run tests/domain/trip/data/core-destinations.test.ts`
Expected: FAIL on Honolulu describe block

- [ ] **Step 3: Add venue data to Honolulu in core-destinations.ts**

Find the Honolulu entry (slug: "honolulu") and add after its `activities: [...]` array:

```ts
    flightFloors: {
      orlando:    { economy: 550, premiumEconomy: 1100, business: 2500 },
      miami:      { economy: 550, premiumEconomy: 1100, business: 2500 },
      newyork:    { economy: 480, premiumEconomy: 960,  business: 2200 },
      losangeles: { economy: 280, premiumEconomy: 600,  business: 1600 },
      "*":        { economy: 480, premiumEconomy: 960,  business: 2200 },
    },
    hotelFloors: {
      lean:      120,
      balanced:  200,
      elevated:  320,
      signature: 550,
    },
    arrivalTransferCost: { low: 15, high: 40 },
    venues: {
      neighborhoods: {
        lean:      "Waikiki East",
        balanced:  "Waikiki Central",
        elevated:  "Waikiki / Diamond Head",
        signature: "Kahala",
      },
      activities: {
        lean: [
          { name: "Diamond Head Crater Hike", neighborhood: "Diamond Head", estimatedPerPerson: 5, durationHours: 2.5, description: "State monument hike to the volcanic rim. 30-minute climb with panoramic Oahu views. Reserve the parking and entry permit online." },
          { name: "Hanauma Bay Snorkeling", neighborhood: "Hanauma Bay", estimatedPerPerson: 25, durationHours: 4, description: "Best snorkeling beach on Oahu. Turtles and tropical fish in a protected bay. Reserve entry online — it sells out by 7am." },
          { name: "Waimea Valley Hike and Waterfall", neighborhood: "North Shore", estimatedPerPerson: 20, durationHours: 3, description: "Botanical garden walk to a 45-foot waterfall at the valley floor. Peaceful and very swimmable." },
        ],
        balanced: [
          { name: "Polynesian Cultural Center", neighborhood: "Laie", estimatedPerPerson: 90, durationHours: 5, description: "Living village museum with six Polynesian islands. Canoe pageant, fire knife show, and a buffet luau." },
          { name: "Pearl Harbor and USS Arizona Memorial", neighborhood: "Pearl Harbor", estimatedPerPerson: 0, durationHours: 3.5, description: "Free to enter. The boat tour to the Arizona Memorial is free but timed tickets run out — book same-day online by 7am." },
          { name: "North Shore Day Trip (Haleiwa + Shrimp Trucks)", neighborhood: "North Shore", estimatedPerPerson: 30, durationHours: 5, description: "Surf town with garlic shrimp trucks, Waimea Bay, and Haleiwa's historic main street. Best November–February for big wave season." },
        ],
        elevated: [
          { name: "Sunset Catamaran Sail from Waikiki", neighborhood: "Waikiki Beach", estimatedPerPerson: 95, durationHours: 2, description: "2-hour catamaran with open bar and live music, watching Diamond Head turn orange at sunset." },
          { name: "Kualoa Ranch ATV and Movie Sites Tour", neighborhood: "Kualoa", estimatedPerPerson: 110, durationHours: 3.5, description: "The valley from Jurassic Park, Kong: Skull Island, and Lost. ATV and horseback combo across the ridgeline." },
          { name: "Makapu'u Lighthouse Trail", neighborhood: "East Oahu", estimatedPerPerson: 0, durationHours: 2.5, description: "Easy 2-mile coastal trail with whale-watching views December–April and tidepool exploring below. Free." },
        ],
        signature: [
          { name: "Doors-Off Helicopter Tour of Oahu", neighborhood: "Honolulu Airport", estimatedPerPerson: 230, durationHours: 1.5, description: "Doors-off helicopter over the Nuuanu Pali cliffs, North Shore surf, and the Ko'olau volcanic ridgeline. Blue Hawaiian is the top operator." },
          { name: "Private Boat Charter to Moku Nui Island", neighborhood: "Kailua Bay", estimatedPerPerson: 180, durationHours: 4, description: "Small-group charter to the offshore islets for snorkeling, paddling, and sea turtle encounters without crowds." },
        ],
      },
      dining: {
        casual: [
          { name: "Giovanni's Shrimp Truck (Haleiwa)", neighborhood: "North Shore", cuisine: "Shrimp plates", estimatedPerPerson: 15, description: "The original North Shore shrimp truck. Garlic butter over rice, eaten at a picnic table. Cash only." },
          { name: "Leonard's Bakery", neighborhood: "Kapahulu", cuisine: "Malasadas", estimatedPerPerson: 8, description: "Honolulu institution since 1952. Hot Portuguese donuts fresh from the fryer, filled or plain. Go in the morning." },
          { name: "Rainbow Drive-In", neighborhood: "Kapahulu", cuisine: "Plate lunch", estimatedPerPerson: 12, description: "Classic Hawaiian plate lunch — two scoops of rice, mac salad, and a protein. The local daily routine." },
        ],
        sitdown: [
          { name: "Duke's Waikiki", neighborhood: "Waikiki", cuisine: "Hawaiian seafood", estimatedPerPerson: 45, description: "Beachfront restaurant on the Outrigger Canoe Club beach. Named after Duke Kahanamoku. Strong drinks, solid fish." },
          { name: "Helena's Hawaiian Food", neighborhood: "Kalihi", cuisine: "Traditional Hawaiian", estimatedPerPerson: 22, description: "James Beard award–winning family spot serving poi, lomi lomi salmon, and kalua pig. Cash only, off the tourist track." },
          { name: "Marukame Udon", neighborhood: "Waikiki", cuisine: "Udon", estimatedPerPerson: 10, description: "Cafeteria-style Japanese udon in the middle of Waikiki. Noodles made fresh, cheap, and always busy." },
        ],
        premium: [
          { name: "MW Restaurant", neighborhood: "Honolulu Downtown", cuisine: "Hawaii regional cuisine", estimatedPerPerson: 85, description: "Tasting menu celebrating local Hawaiian ingredients with Japanese technique by chefs Michelle Karr-Ueoka and Wade Ueoka." },
          { name: "Azure Restaurant at Royal Hawaiian", neighborhood: "Waikiki", cuisine: "Pacific seafood", estimatedPerPerson: 100, description: "Beachside fine dining at the Pink Palace. Lobster poke, fresh catch, and a front-row Diamond Head view." },
          { name: "Nobu Honolulu at Nobu Hotel", neighborhood: "Waikiki", cuisine: "Japanese-Peruvian", estimatedPerPerson: 110, description: "Nobu Matsuhisa's flagship Pacific outpost. Black cod miso and yellowtail jalapeño as reliable anchors." },
        ],
      },
      travelIntel: {
        bestMonths: "April to June and September to November for smaller crowds, lower prices, and warm weather without peak-summer pressure. December to March is whale season and peak North Shore surf. Summer (Jun–Aug) is busiest and most expensive.",
        visaNote: "Honolulu is in Hawaii, USA — no passport or visa required for US citizens. International visitors: standard US visa or ESTA rules apply.",
        currency: "US Dollar (USD). Cards accepted everywhere. No currency exchange needed. ATMs widely available throughout Waikiki.",
        transitTip: "Renting a car unlocks the whole island — a day rental for a North Shore trip costs $60–$90. Waikiki is walkable without a car. The Skyline rail is extending toward the airport but not yet fully operational as of 2025.",
        arrivalNote: "Daniel K. Inouye International Airport (HNL) is 10 minutes from Waikiki by car. Shared shuttle: $15–$20/person. Rideshare: $20–$35. Taxis: $35–$45 flat. The TheBus route 20 takes about 60 min for $3.",
      },
    },
```

- [ ] **Step 4: Run all seed tests**

Run: `npx vitest run tests/domain/trip/data/core-destinations.test.ts`
Expected: PASS all — Tokyo, Paris, Honolulu

- [ ] **Step 5: Commit**

```bash
git add domain/trip/data/core-destinations.ts tests/domain/trip/data/core-destinations.test.ts
git commit -m "feat: add Honolulu venue data, flight/hotel floors, and travel intel"
```

---

## Chunk 5: Claude Enrichment Adapter for Generic Destinations

**Files:**
- Create: `adapters/ai/claude-enrichment-adapter.ts`
- Modify: `server/services/hydrate-generic-destination.ts`
- Create: `tests/adapters/ai/claude-enrichment-adapter.test.ts`

### Task 7: Build Claude enrichment adapter

- [ ] **Step 1: Install @anthropic-ai/sdk**

Run: `npm install @anthropic-ai/sdk@^0.36.0`

This version is required — it's the minimum that supports `AbortSignal` via the `signal` field in request options. Earlier versions ignore the signal and the 6s timeout won't work.

```bash
git add package.json package-lock.json
git commit -m "feat: add anthropic sdk dependency for destination enrichment"
```

- [ ] **Step 2: Write failing test**

Create `tests/adapters/ai/claude-enrichment-adapter.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

const MOCK_VENUES = {
  activities: {
    lean:      [{ name: "City Park", neighborhood: "Downtown", estimatedPerPerson: 0, durationHours: 2, description: "A park." }],
    balanced:  [{ name: "History Museum", neighborhood: "Center", estimatedPerPerson: 15, durationHours: 2.5, description: "Local history." }],
    elevated:  [{ name: "Harbor Cruise", neighborhood: "Harbor", estimatedPerPerson: 60, durationHours: 2, description: "Cruise." }],
    signature: [{ name: "Private Day Tour", neighborhood: "Old City", estimatedPerPerson: 200, durationHours: 6, description: "Private guide." }],
  },
  dining: {
    casual:  [{ name: "Street Market", neighborhood: "Market", cuisine: "Local", estimatedPerPerson: 10, description: "Best local." }],
    sitdown: [{ name: "Café Central", neighborhood: "Plaza", cuisine: "European", estimatedPerPerson: 30, description: "Reliable." }],
    premium: [{ name: "Fine Dining", neighborhood: "Old City", cuisine: "Tasting menu", estimatedPerPerson: 120, description: "Special occasion." }],
  },
  neighborhoods: { lean: "Old Quarter", balanced: "City Center", elevated: "Waterfront", signature: "Old City" },
  travelIntel: {
    bestMonths: "March to May",
    visaNote: "Check embassy for requirements",
    currency: "Local currency",
    transitTip: "Use public transit",
    arrivalNote: "Airport 20 min from center",
  },
};

describe("enrichGenericDestinationContent", () => {
  beforeEach(() => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(MOCK_VENUES) }],
    });
  });

  it("returns a venues object with all required fields", async () => {
    const { enrichGenericDestinationContent } = await import("@/adapters/ai/claude-enrichment-adapter");
    const result = await enrichGenericDestinationContent("Lisbon", "Portugal", 2, 6);
    expect(result).not.toBeNull();
    expect(result!.activities.lean?.length).toBeGreaterThanOrEqual(1);
    expect(result!.dining.casual.length).toBeGreaterThanOrEqual(1);
    expect(result!.neighborhoods.lean).toBeTruthy();
    expect(result!.travelIntel?.bestMonths).toBeTruthy();
  });

  it("returns null when the API call throws", async () => {
    mockCreate.mockRejectedValueOnce(new Error("API timeout"));
    const { enrichGenericDestinationContent } = await import("@/adapters/ai/claude-enrichment-adapter");
    const result = await enrichGenericDestinationContent("Nowhere", "NoCountry", 1, 5);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to confirm it fails**

Run: `npx vitest run tests/adapters/ai/claude-enrichment-adapter.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Create adapters/ai/claude-enrichment-adapter.ts**

Create `adapters/ai/claude-enrichment-adapter.ts`:

```ts
import Anthropic from "@anthropic-ai/sdk";
import type { TravelIntel, VenueActivity, VenueDining, ScenarioTier } from "@/domain/trip/types";

export interface EnrichedVenues {
  activities: Partial<Record<ScenarioTier, VenueActivity[]>>;
  dining: {
    casual:  VenueDining[];
    sitdown: VenueDining[];
    premium: VenueDining[];
  };
  neighborhoods: Partial<Record<ScenarioTier, string>>;
  travelIntel?: TravelIntel;
}

function buildPrompt(destination: string, country: string, travelers: number, nights: number): string {
  return `You are a travel data generator. Return ONLY valid JSON with no extra text, markdown, or explanation.

Generate travel venue data for a trip to ${destination}, ${country} (${travelers} travelers, ${nights} nights).

Return this exact JSON structure:
{
  "activities": {
    "lean":      [{ "name": string, "neighborhood": string, "estimatedPerPerson": number, "durationHours": number, "description": string }],
    "balanced":  [same shape, 3 items],
    "elevated":  [same shape, 3 items],
    "signature": [same shape, 3 items]
  },
  "dining": {
    "casual":  [{ "name": string, "neighborhood": string, "cuisine": string, "estimatedPerPerson": number, "description": string }, 3 items],
    "sitdown": [same shape, 3 items],
    "premium": [same shape, 3 items]
  },
  "neighborhoods": {
    "lean": string,
    "balanced": string,
    "elevated": string,
    "signature": string
  },
  "travelIntel": {
    "bestMonths": string,
    "visaNote": string (for US citizens),
    "currency": string,
    "transitTip": string,
    "arrivalNote": string
  }
}

Rules:
- Use real named venues when you know them, plausible names otherwise
- estimatedPerPerson in USD
- lean activities: $0–$25, signature: $80+
- casual dining: under $20, premium: $60+
- neighborhoods must be real district names for ${destination}`;
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function enrichGenericDestinationContent(
  destinationName: string,
  country: string,
  travelers: number,
  nights: number
): Promise<EnrichedVenues | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await getClient().messages.create(
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        temperature: 0,
        messages: [
          { role: "user", content: buildPrompt(destinationName, country, travelers, nights) },
        ],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const text = response.content.find(block => block.type === "text")?.text;
    if (!text) return null;

    return JSON.parse(text) as EnrichedVenues;
  } catch (error) {
    console.error("[claude-enrichment-adapter] failed:", error);
    return null;
  }
}
```

- [ ] **Step 5: Run tests to confirm they pass**

Run: `npx vitest run tests/adapters/ai/claude-enrichment-adapter.test.ts`
Expected: PASS

- [ ] **Step 6: Update hydrate-generic-destination.ts to call enrichment**

In `server/services/hydrate-generic-destination.ts`, add after existing imports:

```ts
import { enrichGenericDestinationContent } from "@/adapters/ai/claude-enrichment-adapter";
```

The `hydrateGenericDestinationSeed` function currently has signature `(seed: DestinationSeed)`. Update it to accept optional trip context:

```ts
export async function hydrateGenericDestinationSeed(
  seed: DestinationSeed,
  travelers = 2,
  nights = 7
)
```

The caller in `build-planner-view-model.ts` passes `match.destination` — update it to also pass `normalizedInput.travelers` and `normalizedInput.nights`:

```ts
destination: await hydrateGenericDestinationSeed(match.destination, normalizedInput.travelers, normalizedInput.nights)
```

At the end of `hydrateGenericDestinationSeed`, before `return nextSeed`, add:

```ts
  const enrichedVenues = await enrichGenericDestinationContent(
    seed.name,
    seed.country,
    travelers,
    nights
  );

  if (enrichedVenues) {
    nextSeed.venues = enrichedVenues;
  }
```

Ensure `return nextSeed;` is the last statement.

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add adapters/ai/claude-enrichment-adapter.ts server/services/hydrate-generic-destination.ts tests/adapters/ai/claude-enrichment-adapter.test.ts
git commit -m "feat: add enrichment adapter for generic destination venue content"
```

---

## Chunk 6: URL Tier Param + UI Features

**Files:**
- Modify: `features/search/planner-input.ts`
- Modify: `server/services/build-planner-view-model.ts`
- Modify: `components/results/scenario-explorer.tsx`
- Create: `tests/features/search/planner-input.test.ts`

### Task 8: Add tier URL param to planner-input.ts

- [ ] **Step 1: Write failing test**

Create `tests/features/search/planner-input.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parsePlannerSearchParams } from "@/features/search/planner-input";

const base = { destination: "Tokyo", origin: "Orlando", travelers: "2", nights: "7" };

describe("parsePlannerSearchParams — tier param", () => {
  it("parses a valid tier param", () => {
    expect(parsePlannerSearchParams({ ...base, tier: "balanced" })?.tier).toBe("balanced");
  });

  it("accepts all four valid tier values", () => {
    for (const tier of ["lean", "balanced", "elevated", "signature"] as const) {
      expect(parsePlannerSearchParams({ ...base, tier })?.tier).toBe(tier);
    }
  });

  it("returns undefined tier when param is absent", () => {
    expect(parsePlannerSearchParams(base)?.tier).toBeUndefined();
  });

  it("returns undefined tier for an invalid tier value (does not fail parse)", () => {
    const result = parsePlannerSearchParams({ ...base, tier: "premium-plus" });
    expect(result).not.toBeNull();
    expect(result?.tier).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npx vitest run tests/features/search/planner-input.test.ts`
Expected: FAIL — `tier` not in schema

- [ ] **Step 3: Add tier to plannerSearchSchema and parsers**

In `features/search/planner-input.ts`:

Add to `plannerSearchSchema`:
```ts
  tier: z.enum(["lean", "balanced", "elevated", "signature"]).optional().catch(undefined),
```

The `.catch(undefined)` is required: without it, an invalid tier value like `"premium-plus"` causes a Zod parse error rather than silently falling back to `undefined`. With `.catch(undefined)`, invalid values coerce to `undefined` and the rest of the parse succeeds.

In `parsePlannerSearchParams`, add to the `safeParse` input object:
```ts
    tier: pickFirst(searchParams.tier),
```

In `getDefaultPlannerInput`, add:
```ts
    tier: undefined,
```

The `PlannerInput` type is inferred from the schema, so it automatically picks up the new field.

- [ ] **Step 4: Run test to confirm it passes**

Run: `npx vitest run tests/features/search/planner-input.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add features/search/planner-input.ts tests/features/search/planner-input.test.ts
git commit -m "feat: add tier URL param to planner input schema"
```

---

### Task 9: Use requested tier in buildPlannerViewModel

- [ ] **Step 1: Read selectedScenarioIndex logic in build-planner-view-model.ts**

Find the `selectedScenarioIndex` assignment (around line 201). It currently reads:

```ts
const selectedScenarioIndex = reorderedScenarios.reduce((bestIndex, scenario, index, all) => {
  return scenario.ruleScore > all[bestIndex].ruleScore ? index : bestIndex;
}, Math.min(1, reorderedScenarios.length - 1));
```

Replace with:

```ts
function resolveSelectedIndex(scenarios: TripScenario[], requestedTier?: string): number {
  if (requestedTier) {
    const idx = scenarios.findIndex(s => s.tier === requestedTier);
    if (idx !== -1) return idx;
  }
  return scenarios.reduce((best, scenario, index, all) => {
    return scenario.ruleScore > all[best].ruleScore ? index : best;
  }, Math.min(1, scenarios.length - 1));
}

const selectedScenarioIndex = resolveSelectedIndex(reorderedScenarios, input.tier);
```

Add `TripScenario` to the existing imports if not already imported.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add server/services/build-planner-view-model.ts
git commit -m "feat: use requested tier from URL to set selectedScenarioIndex"
```

---

### Task 10: Add travel intel card, copy link button, and pricing labels to scenario-explorer.tsx

- [ ] **Step 1: Add TravelIntel to imports**

In `components/results/scenario-explorer.tsx`, add `TravelIntel` to the import from `@/domain/trip/types`.

- [ ] **Step 2: Add CopyLinkButton component**

Add this component inside the file (before the main `ScenarioExplorer` function):

```tsx
function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-slate-600/40 bg-slate-800/40 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
    >
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
```

Find where `<SavePlanButton ... />` is rendered and replace it with `<CopyLinkButton />`.

- [ ] **Step 3: Add PricingSourceLabel component**

Add this component to the file:

```tsx
function PricingSourceLabel({ source, cabin }: { source?: string; cabin: string }) {
  const isLive = source === "travelpayouts" || source === "amadeus";
  const isVerified = source === "public-verifier";
  const tag = isLive ? "Live" : isVerified ? "Verified" : "Estimated";
  const color = isLive ? "text-emerald-400" : isVerified ? "text-amber-400" : "text-slate-500";

  return (
    <span className={`text-xs ${color}`}>
      {cabin} · {tag}
    </span>
  );
}
```

Find the section in the scenario detail that shows flight info (airline, cabin, departure window). Add below the cabin/airline display:

```tsx
<PricingSourceLabel source={scenario.flight.pricingSource} cabin={scenario.flight.cabin} />
```

- [ ] **Step 4: Add TravelIntelCard component**

Add this component to the file:

```tsx
function TravelIntelCard({ intel }: { intel: TravelIntel }) {
  const [open, setOpen] = useState(false);

  const rows: { label: string; value: string }[] = [
    { label: "Best time",       value: intel.bestMonths },
    { label: "Visa",            value: intel.visaNote },
    { label: "Currency",        value: intel.currency },
    { label: "Transit",         value: intel.transitTip },
    { label: "Airport arrival", value: intel.arrivalNote },
  ];

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/30 transition-colors"
      >
        <span className="font-medium text-slate-200">Travel intel</span>
        <span className="text-slate-500 text-xs">{open ? "Hide ▲" : "Show ▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 text-sm">
          {rows.map(({ label, value }) => (
            <div key={label}>
              <span className="text-slate-500 text-xs uppercase tracking-wide">{label}</span>
              <p className="mt-0.5 text-slate-300">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

Find the results section that renders the itinerary. Add the card above the itinerary, gated on travel intel existing:

```tsx
{viewModel.match.destination.venues?.travelIntel && (
  <TravelIntelCard intel={viewModel.match.destination.venues.travelIntel} />
)}
```

- [ ] **Step 5: Replace "Best Time to Go" placeholder sentence**

Search `scenario-explorer.tsx` for the generic placeholder: `"Check local weather because the best season depends on the region"` (or similar). Replace it with:

```tsx
{viewModel.match.destination.venues?.travelIntel?.bestMonths
  ? <p className="text-slate-300 text-sm">{viewModel.match.destination.venues.travelIntel.bestMonths}</p>
  : <p className="text-slate-500 text-sm">Check local weather — best season varies by destination.</p>
}
```

If this placeholder is in a different component (e.g., `itinerary-timeline.tsx`), find it with `grep -r "best season" components/` and apply the same pattern there.

- [ ] **Step 6: Write tier to URL when user selects a tier tab**

Find the tier-selection handler (it likely calls `setActiveIndex` or similar). Update it to also write the tier to the URL:

```tsx
function handleTierSelect(newIndex: number, tier: ScenarioTier) {
  startTransition(() => {
    setActiveIndex(newIndex);
    const params = new URLSearchParams(window.location.search);
    params.set("tier", tier);
    window.history.replaceState(null, "", `?${params.toString()}`);
  });
}
```

Wire this to the tier tab `onClick` handler, passing both the index and the tier.

- [ ] **Step 7: Run full test suite**

Run: `npx vitest run`
Expected: all tests pass

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 8: Start dev server and smoke test**

Run: `npm run dev`
Open `http://localhost:3000`, test Tokyo 2 travelers 7 nights:

- [ ] Budget tier shows airfare ≥ $1,100/person (2 travelers = ≥ $2,200 airfare total)
- [ ] Budget hotel shows ≥ $75/night
- [ ] Travel intel card appears, expands, and shows Asakusa/Tokyo-specific content
- [ ] "Copy link" button copies URL
- [ ] Selecting "Best value" tab writes `?tier=balanced` to URL
- [ ] Refreshing with `?tier=signature` restores Treat yourself tab selected
- [ ] Flight card shows pricing source label (e.g., "Economy · Estimated")

- [ ] **Step 9: Commit**

```bash
git add components/results/scenario-explorer.tsx
git commit -m "feat: add travel intel card, copy link, and pricing source labels to scenario explorer"
```

---

## Post-Completion Checklist

- [ ] `npx vitest run` — all tests pass
- [ ] `npx tsc --noEmit` — no TypeScript errors
- [ ] `npm run build` — clean Next.js production build
- [ ] End-to-end smoke test: Tokyo 2 travelers 7 nights
  - [ ] Budget total ≥ $4,000 (2 travelers, realistic airfare + hotel + activities)
  - [ ] Travel intel card shows named Tokyo neighborhoods and travelIntel
  - [ ] Copy link restores exact trip + tier
  - [ ] Flight label shows cabin class and pricing source
- [ ] End-to-end smoke test: Paris 2 travelers 6 nights
  - [ ] Budget tier shows airfare ≥ $1,300 total (2 travelers)
  - [ ] Travel intel card shows Paris-specific content
- [ ] End-to-end smoke test: generic destination (type a city not in the seeded list)
  - [ ] Trip still generates (enrichment fallback to template strings if API key absent)
  - [ ] If ANTHROPIC_API_KEY is set, travel intel card appears with generated content

---

## Phase 2: Philippines Destinations (deferred)

Complete this after Phase 1 is shipped and smoke-tested. Follow the same pattern as Chunks 3–4.

**Priority order:** Boracay → El Nido → Cebu → Manila → Bohol → Siargao → Davao → Sorsogon → Naga

**Minimum per destination:**
- `flightFloors` with `orlando` and `"*"` keys (Manila from Orlando: economy ~$900+)
- `hotelFloors` for all four tiers (Boracay lean floor: $40; Manila lean: $50)
- `arrivalTransferCost` (Boracay requires a ferry or propeller plane from Manila — $80–$150)
- `venues.neighborhoods` for all four tiers
- `venues.travelIntel` with visa note (US: visa on arrival 30 days Philippines), currency (PHP), transit tip

**Full venue data (activities + dining):** Boracay and El Nido first, then Cebu.

Add shape-validation tests for each destination to `tests/domain/trip/data/philippines-destinations.test.ts` using the same pattern as `core-destinations.test.ts`.
