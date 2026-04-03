CREATE TABLE `login_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier` varchar(320) NOT NULL,
	`accountType` enum('admin','employee') NOT NULL DEFAULT 'admin',
	`success` boolean NOT NULL DEFAULT false,
	`ipAddress` varchar(64),
	`userAgent` varchar(512),
	`failureReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `login_logs_id` PRIMARY KEY(`id`)
);
