import { eq } from "drizzle-orm";
import { tripRequests } from "@/drizzle/schema";
import { db, hasDatabaseConnection } from "@/lib/db/client";
import { PlannerViewModel } from "@/domain/trip/types";

function createId() {
  return `trip_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveTripRequest(viewModel: PlannerViewModel) {
  if (!hasDatabaseConnection || !db) {
    return null;
  }

  const now = new Date().toISOString();
  const id = createId();

  await db.insert(tripRequests).values({
    id,
    destinationQuery: viewModel.input.destinationQuery,
    resolvedDestinationSlug: viewModel.match.destination.slug,
    origin: viewModel.input.origin,
    travelers: viewModel.input.travelers,
    nights: viewModel.input.nights,
    scenarioPayload: JSON.stringify(viewModel.scenarios),
    selectedScenarioId: viewModel.scenarios[viewModel.selectedScenarioIndex]?.id ?? null,
    createdAt: now,
    updatedAt: now
  });

  return id;
}

export async function getTripRequest(id: string) {
  if (!hasDatabaseConnection || !db) {
    return null;
  }

  const result = await db.select().from(tripRequests).where(eq(tripRequests.id, id)).limit(1);
  return result[0] ?? null;
}

