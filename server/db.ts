import { eq, desc, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, businessAccounts, InsertBusinessAccount, BusinessAccount, employees, InsertEmployee, Employee, bookingContacts, BookingContact, InsertBookingContact, topUpRequests, TopUpRequest, InsertTopUpRequest, balanceTransactions, BalanceTransaction, InsertBalanceTransaction, activityReviews, ActivityReview, InsertActivityReview, loginLogs, LoginLog, generatedDocuments, GeneratedDocument, InsertGeneratedDocument, customerFeedback, CustomerFeedback, activityLogs, ActivityLog } from "../drizzle/schema";
import { ENV } from "./_core/env";
import * as crypto from "crypto";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Password Hashing ─────────────────────────────────────────────────────────
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// ─── Business Account Queries ─────────────────────────────────────────────────

export async function getBusinessAccounts(): Promise<BusinessAccount[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businessAccounts).orderBy(desc(businessAccounts.createdAt));
}

export async function getBusinessAccountById(id: number): Promise<BusinessAccount | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businessAccounts).where(eq(businessAccounts.id, id)).limit(1);
  return result[0];
}

export async function createBusinessAccount(data: {
  companyName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  commissionPercent: string;
  creditLimit?: string;
  notes?: string;
  address?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  website?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(businessAccounts).values({
    companyName: data.companyName,
    contactName: data.contactName,
    contactEmail: data.contactEmail || null,
    contactPhone: data.contactPhone || null,
    commissionPercent: data.commissionPercent,
    creditLimit: data.creditLimit || "0.00",
    notes: data.notes || null,
    address: data.address || null,
    city: data.city || null,
    country: data.country || null,
    logoUrl: data.logoUrl || null,
    website: data.website || null,
  });
  return result[0].insertId;
}

export async function updateBusinessAccount(id: number, data: {
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  commissionPercent?: string;
  creditLimit?: string;
  status?: "active" | "suspended" | "closed";
  notes?: string;
  address?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  website?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateSet: Record<string, unknown> = {};
  if (data.companyName !== undefined) updateSet.companyName = data.companyName;
  if (data.contactName !== undefined) updateSet.contactName = data.contactName;
  if (data.contactEmail !== undefined) updateSet.contactEmail = data.contactEmail;
  if (data.contactPhone !== undefined) updateSet.contactPhone = data.contactPhone;
  if (data.commissionPercent !== undefined) updateSet.commissionPercent = data.commissionPercent;
  if (data.creditLimit !== undefined) updateSet.creditLimit = data.creditLimit;
  if (data.status !== undefined) updateSet.status = data.status;
  if (data.notes !== undefined) updateSet.notes = data.notes;
  if (data.address !== undefined) updateSet.address = data.address;
  if (data.city !== undefined) updateSet.city = data.city;
  if (data.country !== undefined) updateSet.country = data.country;
  if (data.logoUrl !== undefined) updateSet.logoUrl = data.logoUrl;
  if (data.website !== undefined) updateSet.website = data.website;
  if (Object.keys(updateSet).length === 0) return;
  await db.update(businessAccounts).set(updateSet).where(eq(businessAccounts.id, id));
}

export async function deleteBusinessAccount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(businessAccounts).where(eq(businessAccounts.id, id));
}

export async function incrementBusinessAccountBooking(id: number, revenue: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(businessAccounts).set({
    totalBookings: sql`${businessAccounts.totalBookings} + 1`,
    totalRevenue: sql`${businessAccounts.totalRevenue} + ${revenue}`,
  }).where(eq(businessAccounts.id, id));
}

// ─── Employee Queries ─────────────────────────────────────────────────────────

export async function getEmployees(): Promise<Employee[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).orderBy(desc(employees.createdAt));
}

export async function getEmployeeById(id: number): Promise<Employee | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result[0];
}

export async function getEmployeeByEmail(email: string): Promise<Employee | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.email, email)).limit(1);
  return result[0];
}

export async function createEmployee(data: {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: "manager" | "accountant" | "booking_agent" | "support";
  permissions?: string;
  department?: string;
  hireDate?: Date;
  notes?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(employees).values({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone || null,
    passwordHash: hashPassword(data.password),
    role: data.role,
    permissions: data.permissions || null,
    department: data.department || null,
    hireDate: data.hireDate || null,
    notes: data.notes || null,
  });
  return result[0].insertId;
}

export async function updateEmployee(id: number, data: {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: "manager" | "accountant" | "booking_agent" | "support";
  permissions?: string;
  status?: "active" | "inactive";
  department?: string;
  notes?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateSet: Record<string, unknown> = {};
  if (data.fullName !== undefined) updateSet.fullName = data.fullName;
  if (data.email !== undefined) updateSet.email = data.email;
  if (data.phone !== undefined) updateSet.phone = data.phone;
  if (data.password !== undefined) updateSet.passwordHash = hashPassword(data.password);
  if (data.role !== undefined) updateSet.role = data.role;
  if (data.permissions !== undefined) updateSet.permissions = data.permissions;
  if (data.status !== undefined) updateSet.status = data.status;
  if (data.department !== undefined) updateSet.department = data.department;
  if (data.notes !== undefined) updateSet.notes = data.notes;
  if (Object.keys(updateSet).length === 0) return;
  await db.update(employees).set(updateSet).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(employees).where(eq(employees.id, id));
}

export async function updateEmployeeLastLogin(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(employees).set({ lastLogin: new Date() }).where(eq(employees.id, id));
}

// ─── Booking Contacts (ربط حجوزات Duffel ببيانات العملاء) ──────────────────

export async function upsertBookingContact(data: {
  duffelOrderId: string;
  bookingRef: string;
  passengerName: string;
  passengerEmail?: string;
  customerPushToken?: string;
  pnr?: string;
  routeSummary?: string;
  totalPrice?: string;
  currency?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert booking contact: database not available");
    return;
  }
  try {
    await db.insert(bookingContacts).values({
      duffelOrderId: data.duffelOrderId,
      bookingRef: data.bookingRef,
      passengerName: data.passengerName,
      passengerEmail: data.passengerEmail || null,
      customerPushToken: data.customerPushToken || null,
      pnr: data.pnr || null,
      routeSummary: data.routeSummary || null,
      totalPrice: data.totalPrice || null,
      currency: data.currency || null,
    }).onDuplicateKeyUpdate({
      set: {
        bookingRef: data.bookingRef,
        passengerName: data.passengerName,
        passengerEmail: data.passengerEmail || null,
        customerPushToken: data.customerPushToken || null,
        pnr: data.pnr || null,
        routeSummary: data.routeSummary || null,
        totalPrice: data.totalPrice || null,
        currency: data.currency || null,
      },
    });
    console.log(`[Database] ✅ Booking contact saved for order ${data.duffelOrderId}`);
  } catch (error) {
    console.error("[Database] ❌ Failed to upsert booking contact:", error);
  }
}

export async function getBookingContactByOrderId(duffelOrderId: string): Promise<BookingContact | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookingContacts).where(eq(bookingContacts.duffelOrderId, duffelOrderId)).limit(1);
  return result[0];
}

export async function updateBookingContactPnr(duffelOrderId: string, pnr: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(bookingContacts).set({ pnr }).where(eq(bookingContacts.duffelOrderId, duffelOrderId));
}

export async function confirmBookingPayment(duffelOrderId: string, paymentMethod?: string): Promise<BookingContact | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(bookingContacts)
    .set({
      paymentStatus: "confirmed",
      paymentConfirmedAt: new Date(),
      ...(paymentMethod ? { paymentMethod } : {}),
    })
    .where(eq(bookingContacts.duffelOrderId, duffelOrderId));
  return getBookingContactByOrderId(duffelOrderId);
}


// ─── Top-Up Requests (طلبات شحن الرصيد) ──────────────────────────────────────

export async function getTopUpRequests(status?: "pending" | "approved" | "rejected"): Promise<TopUpRequest[]> {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(topUpRequests).where(eq(topUpRequests.status, status)).orderBy(desc(topUpRequests.createdAt));
  }
  return db.select().from(topUpRequests).orderBy(desc(topUpRequests.createdAt));
}

export async function getTopUpRequestsByAccount(businessAccountId: number): Promise<TopUpRequest[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(topUpRequests).where(eq(topUpRequests.businessAccountId, businessAccountId)).orderBy(desc(topUpRequests.createdAt));
}

export async function getTopUpRequestById(id: number): Promise<TopUpRequest | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(topUpRequests).where(eq(topUpRequests.id, id)).limit(1);
  return result[0];
}

export async function createTopUpRequest(data: {
  businessAccountId: number;
  amount: string;
  paymentMethod?: string;
  paymentReference?: string;
  receiptImage?: string;
  requestNotes?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(topUpRequests).values({
    businessAccountId: data.businessAccountId,
    amount: data.amount,
    paymentMethod: data.paymentMethod || null,
    paymentReference: data.paymentReference || null,
    receiptImage: data.receiptImage || null,
    requestNotes: data.requestNotes || null,
  });
  return result[0].insertId;
}

export async function approveTopUpRequest(id: number, processedBy: string, adminNotes?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const request = await getTopUpRequestById(id);
  if (!request) throw new Error("Top-up request not found");
  if (request.status !== "pending") throw new Error("Request already processed");

  const account = await getBusinessAccountById(request.businessAccountId);
  if (!account) throw new Error("Business account not found");

  const amount = parseFloat(request.amount);
  const currentBalance = parseFloat(account.currentBalance);
  const newBalance = currentBalance + amount;

  await db.update(topUpRequests).set({
    status: "approved",
    processedBy,
    adminNotes: adminNotes || null,
    processedAt: new Date(),
  }).where(eq(topUpRequests.id, id));

  await db.update(businessAccounts).set({
    currentBalance: newBalance.toFixed(2),
  }).where(eq(businessAccounts.id, request.businessAccountId));

  await db.insert(balanceTransactions).values({
    businessAccountId: request.businessAccountId,
    type: "top_up",
    amount: amount.toFixed(2),
    balanceAfter: newBalance.toFixed(2),
    description: `شحن رصيد - طلب #${id}`,
    topUpRequestId: id,
  });
}

export async function rejectTopUpRequest(id: number, processedBy: string, adminNotes: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const request = await getTopUpRequestById(id);
  if (!request) throw new Error("Top-up request not found");
  if (request.status !== "pending") throw new Error("Request already processed");

  await db.update(topUpRequests).set({
    status: "rejected",
    processedBy,
    adminNotes,
    processedAt: new Date(),
  }).where(eq(topUpRequests.id, id));
}

// ─── Balance Transactions (سجل معاملات الرصيد) ──────────────────────────────

export async function getBalanceTransactions(businessAccountId: number): Promise<BalanceTransaction[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(balanceTransactions).where(eq(balanceTransactions.businessAccountId, businessAccountId)).orderBy(desc(balanceTransactions.createdAt));
}

export async function deductBalance(businessAccountId: number, amount: number, bookingRef: string, description: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const account = await getBusinessAccountById(businessAccountId);
  if (!account) throw new Error("Business account not found");

  const currentBalance = parseFloat(account.currentBalance);
  const newBalance = currentBalance - amount;

  await db.update(businessAccounts).set({
    currentBalance: newBalance.toFixed(2),
  }).where(eq(businessAccounts.id, businessAccountId));

  await db.insert(balanceTransactions).values({
    businessAccountId,
    type: "booking_deduction",
    amount: (-amount).toFixed(2),
    balanceAfter: newBalance.toFixed(2),
    description,
    bookingRef,
  });
}

// ─── Activity Reviews ─────────────────────────────────────────────────────────

export async function getActivityReviews(activityCode: string): Promise<ActivityReview[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db
      .select()
      .from(activityReviews)
      .where(eq(activityReviews.activityCode, activityCode))
      .orderBy(desc(activityReviews.createdAt))
      .limit(20);
  } catch (err) {
    console.error("[DB] getActivityReviews error:", err);
    return [];
  }
}

export async function addActivityReview(review: InsertActivityReview): Promise<ActivityReview | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.insert(activityReviews).values(review);
    const [inserted] = await db
      .select()
      .from(activityReviews)
      .where(eq(activityReviews.activityCode, review.activityCode))
      .orderBy(desc(activityReviews.createdAt))
      .limit(1);
    return inserted || null;
  } catch (err) {
    console.error("[DB] addActivityReview error:", err);
    return null;
  }
}

// ─── Login Audit Log ──────────────────────────────────────────────────────────

export async function addLoginLog(data: {
  identifier: string;
  accountType: "admin" | "employee";
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(loginLogs).values({
      identifier: data.identifier,
      accountType: data.accountType,
      success: data.success,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      failureReason: data.failureReason || null,
    });
  } catch (err) {
    console.warn("[DB] addLoginLog error:", err);
  }
}

export async function getLoginLogs(limit = 50): Promise<LoginLog[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(loginLogs).orderBy(desc(loginLogs.createdAt)).limit(limit);
}

// ─── Generated Documents ───────────────────────────────────────────────────────────
export async function saveGeneratedDocument(data: InsertGeneratedDocument): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(generatedDocuments).values(data);
    return (result[0] as any)?.insertId ?? null;
  } catch (err) {
    console.warn("[DB] saveGeneratedDocument error:", err);
    return null;
  }
}

export async function getGeneratedDocuments(limit = 100): Promise<GeneratedDocument[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generatedDocuments).orderBy(desc(generatedDocuments.createdAt)).limit(limit);
}

export async function updateDocumentStatus(id: number, status: "generated" | "sent" | "signed"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(generatedDocuments).set({ status }).where(eq(generatedDocuments.id, id));
  } catch (err) {
    console.warn("[DB] updateDocumentStatus error:", err);
  }
}

// ─── Admin: Get All Booking Contacts ─────────────────────────────────────────
export async function getAllBookingContacts(): Promise<BookingContact[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookingContacts).orderBy(desc(bookingContacts.createdAt));
}

// ─── Admin: Update Booking Contact PNR by ID ─────────────────────────────────
export async function updateBookingContactPnrById(id: number, pnr: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(bookingContacts).set({ pnr }).where(eq(bookingContacts.id, id));
}

// ─── Admin: Delete Booking Contact ──────────────────────────────────────────
export async function deleteBookingContact(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(bookingContacts).where(eq(bookingContacts.id, id));
}

// ─── Customer Feedback ────────────────────────────────────────────────────────
export async function createFeedback(data: { name: string; email?: string; rating: number; comment: string; travelType?: string; destination?: string; language?: string }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await (db as any).insert(customerFeedback).values({
    name: data.name,
    email: data.email ?? null,
    rating: data.rating,
    comment: data.comment,
    travelType: data.travelType ?? "general",
    destination: data.destination ?? null,
    language: data.language ?? "ar",
    approved: false,
  });
  return result[0]?.insertId ?? 0;
}

export async function getApprovedFeedback(): Promise<CustomerFeedback[]> {
  const db = await getDb();
  if (!db) return [];
  return (db as any).select().from(customerFeedback).where(eq(customerFeedback.approved, true)).orderBy(desc(customerFeedback.createdAt)).limit(20);
}

export async function getAllFeedback(): Promise<CustomerFeedback[]> {
  const db = await getDb();
  if (!db) return [];
  return (db as any).select().from(customerFeedback).orderBy(desc(customerFeedback.createdAt));
}

export async function approveFeedback(id: number, approved: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await (db as any).update(customerFeedback).set({ approved }).where(eq(customerFeedback.id, id));
}

export async function deleteFeedback(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await (db as any).delete(customerFeedback).where(eq(customerFeedback.id, id));
}

// ─── Activity Logs (سجل النشاط) ───────────────────────────────────────────────

export async function createActivityLog(data: {
  employeeId?: number | null;
  employeeName?: string | null;
  employeeRole?: string | null;
  action: "create" | "update" | "delete" | "login" | "other";
  entityType: string;
  entityId?: number | null;
  description: string;
  metadata?: string | null;
}): Promise<void> {
  const db = await getDb();
  if (!db) return; // silently skip if DB unavailable
  try {
    await (db as any).insert(activityLogs).values({
      employeeId: data.employeeId ?? null,
      employeeName: data.employeeName ?? null,
      employeeRole: data.employeeRole ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      description: data.description,
      metadata: data.metadata ?? null,
    });
  } catch (err) {
    console.warn("[ActivityLog] Failed to write log:", err);
  }
}

export async function getActivityLogs(options?: {
  limit?: number;
  offset?: number;
  employeeId?: number;
  entityType?: string;
  action?: string;
}): Promise<ActivityLog[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    let q = (db as any).select().from(activityLogs).orderBy(desc(activityLogs.createdAt));
    if (options?.limit) q = q.limit(options.limit);
    if (options?.offset) q = q.offset(options.offset);
    return await q;
  } catch (err) {
    console.warn("[ActivityLog] Failed to read logs:", err);
    return [];
  }
}
