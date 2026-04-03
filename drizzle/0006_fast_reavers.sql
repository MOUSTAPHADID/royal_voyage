CREATE TABLE `generated_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`docType` enum('employment_contract','invoice','partnership','ticket_invoice') NOT NULL,
	`refNumber` varchar(128),
	`partyName` varchar(255) NOT NULL,
	`partyEmail` varchar(320),
	`partyPhone` varchar(64),
	`amount` decimal(12,2),
	`currency` varchar(8),
	`status` enum('generated','sent','signed') NOT NULL DEFAULT 'generated',
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generated_documents_id` PRIMARY KEY(`id`)
);
