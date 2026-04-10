CREATE TABLE `customer_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`rating` int NOT NULL,
	`comment` text NOT NULL,
	`travelType` varchar(32) NOT NULL DEFAULT 'general',
	`destination` varchar(255),
	`approved` boolean NOT NULL DEFAULT false,
	`language` varchar(8) NOT NULL DEFAULT 'ar',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_feedback_id` PRIMARY KEY(`id`)
);
