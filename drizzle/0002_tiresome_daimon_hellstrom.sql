CREATE TABLE `booking_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`duffelOrderId` varchar(128) NOT NULL,
	`bookingRef` varchar(64) NOT NULL,
	`passengerName` varchar(255) NOT NULL,
	`passengerEmail` varchar(320),
	`customerPushToken` text,
	`pnr` varchar(32),
	`routeSummary` varchar(255),
	`totalPrice` varchar(32),
	`currency` varchar(8),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `booking_contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `booking_contacts_duffelOrderId_unique` UNIQUE(`duffelOrderId`)
);
