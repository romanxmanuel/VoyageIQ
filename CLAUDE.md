# VoyageIQ Project Guide

## 1. Project Purpose

VoyageIQ is a constraint-aware travel optimizer, not a booking-filter clone.

The product helps a user understand the best trip they can have under real constraints such as:
- total budget
- trip length
- family size
- comfort level
- destination preference
- willingness to trade convenience for price

The core UX goal is to generate a credible, end-to-end trip strategy from minimal input, then clearly show how the plan changes as constraints change. The product should feel like a trip strategy engine that explains tradeoffs, not a form-heavy travel agency UI.

## 2. Tech Stack

Primary stack:
- Next.js 15+ with App Router
- TypeScript with strict mode enabled
- React
- Tailwind CSS
- shadcn/ui for accessible primitives, customized to match VoyageIQ's visual identity
- Framer Motion for intentional motion and scenario transitions
- Drizzle ORM
- libSQL / Turso for lightweight persistent storage that works locally and on Vercel
- Zod for schema validation at API boundaries

Why this stack:
- Next.js is employer-friendly, modern, and deploys cleanly to Vercel
- TypeScript + Zod keep the codebase reliable and maintainable
- Turso gives SQLite-style lightweight persistence without relying on Vercel's ephemeral filesystem
- Drizzle keeps schema and queries explicit, typed, and modular

Optional future additions:
- Upstash Redis for caching if third-party API usage grows
- PostHog or Plausible for analytics
- Sentry for production error tracking

## 3. Folder Architecture

Use a feature-oriented structure with shared infrastructure separated from domain logic.

```text
/app
  /(marketing)
  /(planner)
  /api

/components
  /ui
  /layout
  /planner
  /results
  /maps

/features
  /search
  /constraints
  /itinerary
  /pricing
  /lodging
  /flights
  /food
  /activities
  /scenarios

/lib
  /db
  /env
  /utils
  /formatters
  /validation

/domain
  /trip
  /pricing
  /inventory
  /constraints
  /scenarios

/adapters
  /flights
  /lodging
  /food
  /activities
  /maps

/server
  /services
  /repositories
  /orchestrators

/drizzle
  /migrations

/public
  /images
  /icons
```

Architecture rule:
- UI lives in `app` and `components`
- business rules live in `domain`
- external data translation lives in `adapters`
- request orchestration lives in `server/services` or `server/orchestrators`
- raw database access lives in `server/repositories`

Do not place core pricing or itinerary logic inside React components, route handlers, or database query files.

## 4. Coding Standards

- Use TypeScript strict mode
- Prefer small, single-purpose modules
- Prefer named exports over default exports for shared modules
- Keep files focused; split once a file becomes multi-responsibility
- Use pure functions for deterministic calculations whenever possible
- Validate all untrusted input with Zod
- Keep route handlers thin; they should call services, not implement business logic
- Avoid implicit `any`, broad unions, and undocumented magic values
- Write clear interfaces for domain objects such as `TripRequest`, `Scenario`, `FlightOption`, `StayOption`, and `CostBreakdown`
- Add comments only when the intent is non-obvious
- Keep employer-facing naming clean, professional, and descriptive

Testing expectations:
- unit tests for pricing, scoring, and tradeoff logic
- integration tests for itinerary assembly and adapter normalization
- end-to-end tests for the primary planner flow

## 5. UX Design Principles

VoyageIQ must feel like an intelligent planning engine, not a travel booking dashboard.

Rules:
- Ask for the minimum necessary input to produce value
- Infer defaults intelligently and surface them clearly
- Generate complete scenarios instead of making users assemble every detail
- Make tradeoffs visible immediately
- Explain what improves and what disappears when the user changes budget, comfort, or duration
- Present one coherent recommendation first, then alternatives
- Use strong visual hierarchy and rich scenario cards, not dense filter panels
- Show totals, per-person totals, and per-day totals together
- Keep the output screen strategy-first: summary, tradeoffs, itinerary, cost map, then booking details
- Use motion to communicate state changes, not decoration

Design direction:
- bold, electric, premium visual identity
- polished but credible
- map-aware and itinerary-aware
- mobile friendly, but designed first around a strong desktop planning experience

## 6. State Management Rules

Use the smallest state tool that fits the problem.

Rules:
- Server state should be fetched and composed on the server where practical
- URL state should hold durable planner parameters that should be shareable
- Local UI-only state should stay local to components
- Cross-page client state should use a minimal store only when truly necessary
- Persist user trip drafts and saved scenarios in the database, not only browser storage

Preferred pattern:
- React local state for ephemeral UI behavior
- URL search params for planner inputs worth sharing or revisiting
- Server actions / route handlers for writes
- Database persistence for trip requests, generated scenarios, favorites, and saved itineraries

Do not introduce a global client store for deterministic pricing or itinerary computation.

## 7. API Integration Rules

All external providers must be accessed through adapter interfaces.

Adapter rules:
- one adapter per provider type
- normalize provider responses into internal domain models
- keep provider-specific fields inside adapter boundaries
- support mock, seeded, and live implementations behind the same interface
- define timeouts, retries, and graceful fallbacks
- cache expensive reads where appropriate

MVP rule:
- Core experience must still work without expensive real-time APIs
- Use seeded destination data, heuristic scoring, and cached or batched provider data for baseline scenario generation
- Live API integrations should enhance the final recommendation, not make the app unusable without them

Planned provider categories:
- flights
- lodging
- restaurants
- activities
- maps / travel time / geocoding

Migration path:
- start with mock/curated adapters
- move to hybrid adapters with cached live enrichment
- graduate to fully live production adapters only where ROI is justified

## 8. Cost-Calculation Architecture

Cost calculation must be deterministic, testable, and separate from UI and provider code.

Core principle:
- LLMs may assist with copy or summarization later, but never with structured price math, scoring, or itinerary cost calculations

Recommended pipeline:
1. Normalize inventory data into internal option objects
2. Build candidate scenarios from flight, stay, food, and activity combinations
3. Score scenarios against constraints
4. Compute detailed cost breakdowns
5. Use a similarity helper layer to find nearest alternatives after rule-based scoring
6. Generate tradeoff deltas between neighboring scenarios

Required cost layers:
- transportation total
- lodging total
- food total
- activities total
- local transit total
- taxes and fees estimate
- contingency / buffer
- total trip cost
- cost per traveler
- cost per day

Rules:
- Every displayed total must be traceable to line items
- Each scenario must preserve raw inputs and computed outputs
- Cost formulas must live in dedicated pricing modules under `domain/pricing` or `features/pricing`
- Use versioned calculation logic when formulas materially change
- Slider interactions should select from precomputed or quickly recomputed scenarios, not trigger opaque UI-only math
- Euclidean-style distance may be used only as a helper for scenario similarity, never as the main pricing or feasibility engine

## 9. Persistence Requirements

Persistence is mandatory. User data must survive restarts and deployments.

Store at minimum:
- trip requests
- inferred defaults used for each request
- generated scenarios
- selected itinerary
- saved destinations
- saved comparison states
- optional user profile preferences

Rules:
- Do not rely on in-memory storage for anything user-important
- Do not rely on local SQLite files in production on Vercel
- Local development may use a local libSQL/SQLite-compatible database
- Production persistence should use Turso/libSQL so data persists across restarts with a small footprint
- Add migrations for all schema changes

## 10. Deployment Requirements for Vercel

The app must deploy cleanly to Vercel with minimal operational overhead.

Rules:
- Prefer edge-safe or serverless-safe patterns where appropriate, but do not force Edge runtime if dependencies do not support it
- Keep environment variables explicit and documented
- Avoid filesystem persistence in production
- Avoid long-running server processes
- Route handlers and server actions must be stateless between requests
- All production secrets must come from environment variables
- Use Vercel-compatible image, font, and asset handling

Deployment baseline:
- frontend and API routes served from the same Next.js app
- Turso for persistent storage
- optional external providers gated behind environment variables and adapter flags

## 11. Git Workflow Expectations

- Work in focused branches using the `codex/` prefix when creating branches
- Keep commits scoped and readable
- Avoid mixing refactors with feature work unless necessary
- Update documentation when architecture or conventions change
- Prefer PR-friendly changes with clear boundaries
- Never commit secrets, `.env` files, or provider credentials
- Keep the repo employer-friendly: clean names, clear structure, low noise

Suggested commit style:
- `docs: add VoyageIQ project architecture guide`
- `feat: add trip request domain schema`
- `feat: build scenario pricing engine`
- `refactor: split lodging adapter normalization`

## 12. Rules for Clean, Modular, Scalable Code

- Build by vertical slices, not by one giant planner file
- Keep domain models stable and adapters replaceable
- Separate orchestration from calculation
- Prefer composition over inheritance
- Encapsulate provider-specific behavior so future API swaps do not ripple through the app
- Ensure every major subsystem can be tested independently
- Make optimistic assumptions visible in code and data
- Keep scenario generation explainable
- Every new module must have a single clear reason to change
- If a component needs too many props, split responsibilities
- If a service is doing IO plus pricing plus formatting, split it
- Do not let `app/api` become the business-logic layer
- Do not let React components own itinerary assembly logic
- Do not allow data model drift between adapters, DB schema, and UI types

## Initial System Direction

VoyageIQ should initially be built around three separable engines:
- intake engine: turns minimal user input into structured trip constraints
- scenario engine: assembles viable trip options under those constraints
- tradeoff engine: explains what changes as budget, comfort, and time move

VoyageIQ should also include a helper similarity layer after scoring:
- filter and generate valid scenarios first
- score them with explicit business logic second
- use weighted similarity only to surface the nearest cheaper, more premium, or more convenient alternative

That separation is foundational and should remain intact as the product grows.
