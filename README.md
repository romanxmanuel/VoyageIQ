# VoyageIQ

> Constraint-aware travel optimization that shows the best trip you can have under real-world limits and what changes when those limits move.

## Tech Stack
![Next.js](https://img.shields.io/badge/Next.js-16-111827?style=flat-square)
![React](https://img.shields.io/badge/React-19-0b7285?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-2563eb?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-4-0891b2?style=flat-square)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-65a30d?style=flat-square)
![Turso](https://img.shields.io/badge/Turso-libSQL-f97316?style=flat-square)

## What Exists
- Minimal-input planner flow with destination, travel month, family size, trip length, and origin
- Deterministic scenario engine with lean, balanced, and elevated trip strategies
- Full itinerary, cost breakdown, booking timing, food, activity, and arrival planning cards
- Weighted similarity helper for nearest cheaper, more premium, and more convenient alternatives
- Adapter-based design for flights, lodging, food, and activities
- Persistence endpoint and Turso-ready schema for saving generated strategies

## Setup

```bash
copy .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Local development can use the file-backed default in `.env.local`:

```bash
TURSO_DATABASE_URL=file:./voyageiq.db
```

For production on Vercel, point `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to a Turso database.

To push the schema:

```bash
npm run db:push
```

## Project Direction

VoyageIQ is intentionally not an Expedia clone. The current scaffold is designed around:
- intake engine
- scenario engine
- tradeoff engine

That lets the app stay cheap, modular, and explainable while keeping a clean path to live provider integrations later.
