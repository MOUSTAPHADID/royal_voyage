CREATE TABLE `business_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`contactEmail` varchar(320),
	`contactPhone` varchar(32),
	`commissionPercent` decimal(5,2) NOT NULL DEFAULT '0.00',
	`creditLimit` decimal(12,2) NOT NULL DEFAULT '0.00',
	`currentBalance` decimal(12,2) NOT NULL DEFAULT '0.00',
	`status` enum('active','suspended','closed') NOT NULL DEFAULT 'active',
	`notes` text,
	`address` text,
	`city` varchar(128),
	`country` varchar(128),
	`totalBookings` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(14,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`passwordHash` varchar(255) NOT NULL,
	`role` enum('manager','accountant','booking_agent','support') NOT NULL,
	`permissions` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`department` varchar(128),
	`hireDate` timestamp,
	`lastLogin` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_email_unique` UNIQUE(`email`)
);
