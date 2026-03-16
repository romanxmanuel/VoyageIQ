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
