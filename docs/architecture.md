# VoyageIQ Architecture

## Overview

VoyageIQ is built as a constraint-aware travel planning system, not a generic booking UI.

The codebase is intentionally organized so that:
- UI concerns stay in the UI layer
- deterministic trip logic stays in domain modules
- external providers stay behind adapters
- orchestration happens in server services
- persistence stays in repository/database boundaries

That separation keeps the project readable, scalable, and employer-friendly.

## Core Flow

1. User enters lightweight planner input
2. Search params are parsed into a typed `PlannerInput`
3. Destination resolution maps the request to a supported destination profile
4. Scenario generation builds coherent trip options
5. Pricing and scoring create cost and fit outputs
6. Similarity logic attaches nearest alternatives
7. Provider adapters attach verification or live-enrichment links
8. The UI renders a strategy-first output page

## Major Layers

### 1. App and UI

Relevant folders:
- `app/`
- `components/`

Responsibilities:
- routing
- page composition
- planner forms
- result cards
- itinerary rendering
- animation and interaction polish

Rules:
- no deterministic pricing logic here
- no provider-specific transformation logic here
- no database logic here

### 2. Domain

Relevant folders:
- `domain/trip/`
- `domain/scenarios/`
- `domain/pricing/`

Responsibilities:
- trip models
- destination modeling
- scenario generation
- pricing formulas
- similarity calculations
- rule-based scoring

This layer is the product brain.

### 3. Adapters

Relevant folder:
- `adapters/`

Responsibilities:
- integrate provider APIs
- normalize provider responses
- expose stable interfaces to the rest of the app

Current adapter categories:
- flights
- lodging
- food
- activities
- maps

Architecture intent:
- the planner should still function with seeded data
- live providers enrich or improve the output
- provider swaps should not require UI rewrites

### 4. Server Services

Relevant folder:
- `server/services/`

Responsibilities:
- orchestrate planner building
- attach verification resources
- choose provider registry implementations
- enrich seeded scenarios with live provider data

Key idea:
- route handlers should stay thin
- orchestration belongs here instead of inside API files

### 5. Persistence

Relevant locations:
- `server/repositories/`
- `drizzle/`

Responsibilities:
- save trip requests
- persist generated plans
- manage schema and migrations

Production persistence strategy:
- lightweight footprint
- Vercel-friendly
- libSQL/Turso-compatible

## Key Design Decisions

### Deterministic Core

VoyageIQ does not use opaque AI logic for:
- pricing
- structured itinerary cost math
- scenario feasibility
- hard constraints

Those are deterministic and testable.

### Similarity as Helper, Not Engine

Weighted similarity is used after rule-based scenario generation to answer questions like:
- what is the closest cheaper trip
- what is the least disruptive premium upgrade
- what changes the least if convenience is prioritized

It is not used as the core planning engine.

### Seeded-First, Live-Ready

The codebase is designed so that:
- seeded destinations provide reliable MVP behavior
- live providers can enrich the result later
- failures in provider calls degrade gracefully instead of breaking the planner

### Strategy-First UX

The product is built to feel like:
- a trip strategy engine

It is not built to feel like:
- a booking-filter wall
- an OTA clone
- a travel spreadsheet

## Current Provider Model

The system currently supports a hybrid approach:

- seeded destination intelligence for scenario generation
- Travelpayouts flight enrichment
- Amadeus hotel enrichment path
- Google Places exact-link enrichment for restaurants, activities, and stays
- outbound booking/search fallbacks when provider data is unavailable

Provider selection is centralized in:
- `server/services/provider-registry.ts`

## Testing Strategy

Tests are organized across:
- adapters
- domain logic
- feature parsing
- integration planner flow
- server utilities

That split supports confidence in:
- business logic
- provider normalization
- end-to-end planning behavior

## Why This Architecture Is Employer-Friendly

This project demonstrates:
- typed domain modeling
- boundary-driven design
- clean separation of concerns
- practical fallback strategy for third-party APIs
- deployable production thinking
- product-aware engineering rather than just UI assembly

The repo is strongest when reviewed through the lens of:
- modularity
- maintainability
- system design maturity
- shipping discipline
