import { eq, desc, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, businessAccounts, InsertBusinessAccount, BusinessAccount, employees, InsertEmployee, Employee } from "../drizzle/schema";
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
