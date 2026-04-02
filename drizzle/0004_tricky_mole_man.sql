CREATE TABLE `activity_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityCode` varchar(64) NOT NULL,
	`userId` int,
	`reviewerName` varchar(255) NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`language` varchar(8) NOT NULL DEFAULT 'en',
	`verified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activity_reviews_id` PRIMARY KEY(`id`)
);
