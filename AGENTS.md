# VoyageIQ — Project Context

## What This Is
VoyageIQ is a constraint-aware travel optimizer that generates complete trip strategies from minimal input and makes tradeoffs legible as budget, comfort, and trip length change.

## Tech Stack
- Next.js 16 App Router
- React 19 + TypeScript
- Tailwind CSS 4
- Drizzle ORM + libSQL/Turso
- Framer Motion + Zod

## Commands
- `npm run dev` — start the local app
- `npm run build` — create the production build
- `npm run lint` — run lint checks
- `npm run typecheck` — run TypeScript checks
- `npm run db:push` — push the current Drizzle schema

## Key Decisions
- Keep planner computation server-first and deterministic
- Use adapter boundaries for flights, lodging, food, activities, and maps
- Use seeded/mock inventory for MVP and upgrade adapters to live providers later
- Persist saved strategies in libSQL/Turso so user data survives restarts

## File Structure
```text
/app
/components
/adapters
/domain
/features
/lib
/server
/drizzle
```

