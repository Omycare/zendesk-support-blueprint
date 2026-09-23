CREATE TABLE `blueprint_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `blueprint_credentials` (
	`project_id` text PRIMARY KEY NOT NULL,
	`ciphertext` text NOT NULL,
	`iv` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `blueprint_projects`(`id`) ON UPDATE no action ON DELETE no action
);
