CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int,
	`employeeName` varchar(255),
	`employeeRole` varchar(64),
	`action` enum('create','update','delete','login','other') NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int,
	`description` varchar(512) NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
