CREATE TABLE `bump_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`intensity` real NOT NULL,
	`speed_kph` real,
	`accuracy_m` real,
	`session_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `road_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`severity` text NOT NULL,
	`road_label` text DEFAULT 'Pinned road location' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
