CREATE TABLE `blueprint_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` text NOT NULL,
	`at` text NOT NULL,
	`actor` text NOT NULL,
	`changes` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `blueprint_projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `blueprint_members` (
	`project_id` text NOT NULL,
	`email` text NOT NULL,
	PRIMARY KEY(`project_id`, `email`),
	FOREIGN KEY (`project_id`) REFERENCES `blueprint_projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `blueprint_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	`last_mutation` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `blueprint_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL
);
