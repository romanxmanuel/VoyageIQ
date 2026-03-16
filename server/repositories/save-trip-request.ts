import { tripRequests } from "@/drizzle/schema";
import { client, db } from "@/lib/db/client";
import type { PlannerViewModel } from "@/domain/trip/types";

let hasEnsuredSchema = false;

async function ensureSchema() {
  if (hasEnsuredSchema || !client) {
    return;
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS trip_requests (
      id TEXT PRIMARY KEY NOT NULL,
      destination_query TEXT NOT NULL,
      resolved_destination_slug TEXT NOT NULL,
      origin TEXT NOT NULL,
      travelers INTEGER NOT NULL,
      nights INTEGER NOT NULL,
      scenario_payload TEXT,
      selected_scenario_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  hasEnsuredSchema = true;
}

export async function saveTripRequest(viewModel: PlannerViewModel, selectedScenarioId: string) {
  if (!db) {
    throw new Error("Database is not configured. Set TURSO_DATABASE_URL for persistence.");
  }

  await ensureSchema();

  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(tripRequests).values({
    id,
    destinationQuery: viewModel.input.destinationQuery,
    resolvedDestinationSlug: viewModel.match.destination.slug,
    origin: viewModel.input.origin,
    travelers: viewModel.input.travelers,
    nights: viewModel.input.nights,
    scenarioPayload: JSON.stringify(viewModel.scenarios),
    selectedScenarioId,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return id;
}
