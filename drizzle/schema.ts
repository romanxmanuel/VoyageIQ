import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tripRequests = sqliteTable("trip_requests", {
  id: text("id").primaryKey(),
  destinationQuery: text("destination_query").notNull(),
  resolvedDestinationSlug: text("resolved_destination_slug").notNull(),
  origin: text("origin").notNull(),
  travelers: integer("travelers").notNull(),
  nights: integer("nights").notNull(),
  scenarioPayload: text("scenario_payload"),
  selectedScenarioId: text("selected_scenario_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export type TripRequestRecord = typeof tripRequests.$inferSelect;
export type NewTripRequestRecord = typeof tripRequests.$inferInsert;

