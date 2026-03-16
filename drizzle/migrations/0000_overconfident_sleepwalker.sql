CREATE TABLE `api_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cache_key` text NOT NULL,
	`payload` text NOT NULL,
	`fetched_at` integer NOT NULL,
	`ttl_hours` integer DEFAULT 2 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_cache_cache_key_unique` ON `api_cache` (`cache_key`);--> statement-breakpoint
CREATE TABLE `trip_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`destination_query` text NOT NULL,
	`resolved_destination_slug` text NOT NULL,
	`origin` text NOT NULL,
	`travelers` integer NOT NULL,
	`nights` integer NOT NULL,
	`scenario_payload` text,
	`selected_scenario_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
