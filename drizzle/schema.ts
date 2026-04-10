import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Business Accounts (حسابات تجارية) ──────────────────────────────────────
// Companies/agencies that get special commission rates on bookings
export const businessAccounts = mysqlTable("business_accounts", {
  id: int("id").autoincrement().primaryKey(),
  /** Company/agency name */
  companyName: varchar("companyName", { length: 255 }).notNull(),
  /** Contact person name */
  contactName: varchar("contactName", { length: 255 }).notNull(),
  /** Contact email */
  contactEmail: varchar("contactEmail", { length: 320 }),
  /** Contact phone */
  contactPhone: varchar("contactPhone", { length: 32 }),
  /** Commission percentage (0-100) — discount given to this business */
  commissionPercent: decimal("commissionPercent", { precision: 5, scale: 2 }).notNull().default("0.00"),
  /** Credit limit in MRU (0 = no credit) */
  creditLimit: decimal("creditLimit", { precision: 12, scale: 2 }).notNull().default("0.00"),
  /** Current balance (negative = owes money) */
  currentBalance: decimal("currentBalance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  /** Account status */
  status: mysqlEnum("status", ["active", "suspended", "closed"]).default("active").notNull(),
  /** Notes/remarks */
  notes: text("notes"),
  /** Address */
  address: text("address"),
  /** City */
  city: varchar("city", { length: 128 }),
  /** Country */
  country: varchar("country", { length: 128 }),
  /** Logo URL (S3 or external image URL) for white-label ticket branding */
  logoUrl: varchar("logoUrl", { length: 1024 }),
  /** Agency website */
  website: varchar("website", { length: 512 }),
  /** Total bookings made by this account */
  totalBookings: int("totalBookings").notNull().default(0),
  /** Total revenue from this account in MRU */
  totalRevenue: decimal("totalRevenue", { precision: 14, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessAccount = typeof businessAccounts.$inferSelect;
export type InsertBusinessAccount = typeof businessAccounts.$inferInsert;

// ─── Employees (موظفين) ─────────────────────────────────────────────────────
// Staff members with defined roles and permissions
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  /** Full name */
  fullName: varchar("fullName", { length: 255 }).notNull(),
  /** Email (used for login) */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Phone number */
  phone: varchar("phone", { length: 32 }),
  /** Hashed password */
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  /** Employee role */
  role: mysqlEnum("role", ["manager", "accountant", "booking_agent", "support"]).notNull(),
  /** Individual permissions (JSON string of permission keys) */
  permissions: text("permissions"),
  /** Account status */
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  /** Department */
  department: varchar("department", { length: 128 }),
  /** Hire date */
  hireDate: timestamp("hireDate"),
  /** Last login */
  lastLogin: timestamp("lastLogin"),
  /** Notes */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// ─── Booking Contacts (ربط حجوزات Duffel ببيانات العملاء) ──────────────────
// Maps Duffel order IDs to customer contact info for webhook email notifications
export const bookingContacts = mysqlTable("booking_contacts", {
  id: int("id").autoincrement().primaryKey(),
  /** Duffel order ID (ord_xxx) */
  duffelOrderId: varchar("duffelOrderId", { length: 128 }).notNull().unique(),
  /** Local booking reference (RV-FL-XXXXXX) */
  bookingRef: varchar("bookingRef", { length: 64 }).notNull(),
  /** Passenger full name */
  passengerName: varchar("passengerName", { length: 255 }).notNull(),
  /** Passenger email for notifications */
  passengerEmail: varchar("passengerEmail", { length: 320 }),
  /** Customer push token for mobile notifications */
  customerPushToken: text("customerPushToken"),
  /** PNR from airline */
  pnr: varchar("pnr", { length: 32 }),
  /** Flight route summary (e.g., NKC → CDG) */
  routeSummary: varchar("routeSummary", { length: 255 }),
  /** Total price */
  totalPrice: varchar("totalPrice", { length: 32 }),
  /** Currency */
  currency: varchar("currency", { length: 8 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BookingContact = typeof bookingContacts.$inferSelect;
export type InsertBookingContact = typeof bookingContacts.$inferInsert;

// ─── Top-Up Requests (طلبات شحن الرصيد) ──────────────────────────────────────
// Business accounts request balance top-ups, admin approves or rejects
export const topUpRequests = mysqlTable("top_up_requests", {
  id: int("id").autoincrement().primaryKey(),
  /** Business account ID */
  businessAccountId: int("businessAccountId").notNull(),
  /** Requested amount in MRU */
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  /** Request status */
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  /** Payment method used for top-up */
  paymentMethod: varchar("paymentMethod", { length: 64 }),
  /** Payment reference / receipt number */
  paymentReference: varchar("paymentReference", { length: 255 }),
  /** Receipt image URL */
  receiptImage: text("receiptImage"),
  /** Notes from the requester */
  requestNotes: text("requestNotes"),
  /** Admin notes (reason for rejection, etc.) */
  adminNotes: text("adminNotes"),
  /** Admin who processed the request */
  processedBy: varchar("processedBy", { length: 255 }),
  /** When the request was processed */
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TopUpRequest = typeof topUpRequests.$inferSelect;
export type InsertTopUpRequest = typeof topUpRequests.$inferInsert;

// ─── Balance Transactions (سجل معاملات الرصيد) ──────────────────────────────
// Tracks all balance changes: top-ups, booking deductions, refunds
export const balanceTransactions = mysqlTable("balance_transactions", {
  id: int("id").autoincrement().primaryKey(),
  /** Business account ID */
  businessAccountId: int("businessAccountId").notNull(),
  /** Transaction type */
  type: mysqlEnum("type", ["top_up", "booking_deduction", "refund", "adjustment"]).notNull(),
  /** Amount (positive for credits, negative for debits) */
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  /** Balance after this transaction */
  balanceAfter: decimal("balanceAfter", { precision: 12, scale: 2 }).notNull(),
  /** Description of the transaction */
  description: text("description"),
  /** Related booking reference (for deductions) */
  bookingRef: varchar("bookingRef", { length: 64 }),
  /** Related top-up request ID */
  topUpRequestId: int("topUpRequestId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BalanceTransaction = typeof balanceTransactions.$inferSelect;
export type InsertBalanceTransaction = typeof balanceTransactions.$inferInsert;

// ─── Activity Reviews (تقييمات الأنشطة) ──────────────────────────────────────
export const activityReviews = mysqlTable("activity_reviews", {
  id: int("id").autoincrement().primaryKey(),
  /** Activity code from HBX */
  activityCode: varchar("activityCode", { length: 64 }).notNull(),
  /** User ID (optional - anonymous reviews allowed) */
  userId: int("userId"),
  /** Reviewer name */
  reviewerName: varchar("reviewerName", { length: 255 }).notNull(),
  /** Rating (1-5 stars) */
  rating: int("rating").notNull(),
  /** Review text */
  comment: text("comment"),
  /** Review language */
  language: varchar("language", { length: 8 }).default("en").notNull(),
  /** Is this review verified (user actually booked the activity)? */
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ActivityReview = typeof activityReviews.$inferSelect;
export type InsertActivityReview = typeof activityReviews.$inferInsert;

// ─── Login Audit Log ──────────────────────────────────────────────────────────
/** Records all admin and employee login attempts for security auditing */
export const loginLogs = mysqlTable("login_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** Who attempted to log in: "admin" or employee email */
  identifier: varchar("identifier", { length: 320 }).notNull(),
  /** Type of account: admin or employee */
  accountType: mysqlEnum("accountType", ["admin", "employee"]).notNull().default("admin"),
  /** Whether the login was successful */
  success: boolean("success").notNull().default(false),
  /** IP address of the request (optional, may not be available on mobile) */
  ipAddress: varchar("ipAddress", { length: 64 }),
  /** Device/platform info */
  userAgent: varchar("userAgent", { length: 512 }),
  /** Failure reason if login failed */
  failureReason: varchar("failureReason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LoginLog = typeof loginLogs.$inferSelect;
export type InsertLoginLog = typeof loginLogs.$inferInsert;

// ─── Generated Documents Log (سجل الوثائق المولّدة) ──────────────────
export const generatedDocuments = mysqlTable("generated_documents", {
  id: int("id").autoincrement().primaryKey(),
  /** Document type */
  docType: mysqlEnum("docType", ["employment_contract", "invoice", "partnership", "ticket_invoice"]).notNull(),
  /** Reference number or invoice number */
  refNumber: varchar("refNumber", { length: 128 }),
  /** Name of the other party */
  partyName: varchar("partyName", { length: 255 }).notNull(),
  /** Email of the other party */
  partyEmail: varchar("partyEmail", { length: 320 }),
  /** Phone of the other party */
  partyPhone: varchar("partyPhone", { length: 64 }),
  /** Total amount (for invoices) */
  amount: decimal("amount", { precision: 12, scale: 2 }),
  /** Currency */
  currency: varchar("currency", { length: 8 }),
  /** Status */
  status: mysqlEnum("status", ["generated", "sent", "signed"]).default("generated").notNull(),
  /** Extra metadata as JSON */
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GeneratedDocument = typeof generatedDocuments.$inferSelect;
export type InsertGeneratedDocument = typeof generatedDocuments.$inferInsert;

// ─── Customer Feedback (تقييمات العملاء) ─────────────────────────────────────
// Public reviews submitted via the landing page feedback form
export const customerFeedback = mysqlTable("customer_feedback", {
  id: int("id").autoincrement().primaryKey(),
  /** Reviewer full name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Reviewer email (optional) */
  email: varchar("email", { length: 320 }),
  /** Star rating 1-5 */
  rating: int("rating").notNull(),
  /** Review comment */
  comment: text("comment").notNull(),
  /** Travel type: flight, hotel, activity, general */
  travelType: varchar("travelType", { length: 32 }).default("general").notNull(),
  /** Destination mentioned */
  destination: varchar("destination", { length: 255 }),
  /** Approved by admin for public display */
  approved: boolean("approved").default(false).notNull(),
  /** Language of the review */
  language: varchar("language", { length: 8 }).default("ar").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CustomerFeedback = typeof customerFeedback.$inferSelect;
export type InsertCustomerFeedback = typeof customerFeedback.$inferInsert;

// ─── Activity Logs (سجل النشاط) ───────────────────────────────────────────────
// Tracks all admin/employee actions: create, update, delete on any entity
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** Employee ID who performed the action (null = system/admin) */
  employeeId: int("employeeId"),
  /** Employee full name (snapshot at time of action) */
  employeeName: varchar("employeeName", { length: 255 }),
  /** Employee role at time of action */
  employeeRole: varchar("employeeRole", { length: 64 }),
  /** Action type: create | update | delete | login | other */
  action: mysqlEnum("action", ["create", "update", "delete", "login", "other"]).notNull(),
  /** Entity type: employee | partner | booking | pricing | pnr | status | payment */
  entityType: varchar("entityType", { length: 64 }).notNull(),
  /** Entity ID (optional) */
  entityId: int("entityId"),
  /** Human-readable description of the action */
  description: varchar("description", { length: 512 }).notNull(),
  /** Extra JSON metadata (old/new values, etc.) */
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
