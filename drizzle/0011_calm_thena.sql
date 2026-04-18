CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerUserId` varchar(64) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`tradingName` varchar(255),
	`businessEmail` varchar(320) NOT NULL,
	`phoneNumber` varchar(32),
	`country` varchar(128),
	`city` varchar(128),
	`businessAddress` text,
	`website` varchar(512),
	`businessType` enum('company','travel_agency','ngo','school','government','other') NOT NULL DEFAULT 'company',
	`registrationNumber` varchar(128),
	`taxId` varchar(64),
	`iataNumber` varchar(32),
	`contactPersonFullName` varchar(255),
	`jobTitle` varchar(128),
	`contactEmail` varchar(320),
	`contactPhone` varchar(32),
	`logoUrl` varchar(1024),
	`status` enum('pending_review','more_documents_required','approved','rejected','suspended') NOT NULL DEFAULT 'pending_review',
	`rejectionReason` text,
	`reviewNotes` text,
	`commissionPercent` decimal(5,2) DEFAULT '0.00',
	`submissionDate` timestamp NOT NULL DEFAULT (now()),
	`approvalDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`bookingReference` varchar(64),
	`travelerId` int,
	`createdByUserId` varchar(64),
	`route` varchar(255),
	`travelDate` varchar(32),
	`totalAmount` decimal(12,2),
	`currency` varchar(8) DEFAULT 'MRU',
	`paymentStatus` enum('pending','confirmed','refunded','failed') NOT NULL DEFAULT 'pending',
	`bookingStatus` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`documentType` varchar(64) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`verificationStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewerNote` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` varchar(64) NOT NULL,
	`role` enum('owner','admin','booker','viewer') NOT NULL DEFAULT 'viewer',
	`inviteStatus` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_travelers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`dateOfBirth` varchar(16),
	`gender` enum('male','female'),
	`nationality` varchar(64),
	`passportNumber` varchar(64),
	`passportExpiryDate` varchar(16),
	`frequentFlyerNumber` varchar(64),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_travelers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `esim_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`companyId` int,
	`providerOrderId` varchar(128),
	`planName` varchar(255) NOT NULL,
	`destination` varchar(128) NOT NULL,
	`dataAmount` varchar(32),
	`validityDays` int,
	`priceMru` decimal(10,2) NOT NULL,
	`priceUsd` decimal(10,2),
	`iccid` varchar(64),
	`qrCode` text,
	`activationInstructions` text,
	`status` enum('pending','processing','active','expired','cancelled','failed') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('pending','paid','refunded') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `esim_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`bookingId` int,
	`invoiceNumber` varchar(64) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(8) DEFAULT 'MRU',
	`issueDate` timestamp NOT NULL DEFAULT (now()),
	`dueDate` timestamp,
	`status` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`pdfUrl` varchar(1024),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`companyId` int,
	`type` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`relatedEntityType` varchar(64),
	`relatedEntityId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stripe_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64) NOT NULL,
	`paymentIntentId` varchar(128) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(8) NOT NULL,
	`status` enum('requires_payment_method','requires_confirmation','requires_action','processing','succeeded','cancelled') NOT NULL DEFAULT 'requires_payment_method',
	`entityType` varchar(32),
	`entityId` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripe_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripe_payments_paymentIntentId_unique` UNIQUE(`paymentIntentId`)
);
