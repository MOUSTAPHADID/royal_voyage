ALTER TABLE `booking_contacts` ADD `paymentStatus` varchar(32) DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `booking_contacts` ADD `paymentConfirmedAt` timestamp;--> statement-breakpoint
ALTER TABLE `booking_contacts` ADD `paymentMethod` varchar(64);