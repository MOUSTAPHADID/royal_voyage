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
