import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const readFile = (p: string) => fs.readFileSync(path.resolve(__dirname, "..", p), "utf-8");

describe("Database Schema - Business Accounts & Employees", () => {
  const schema = readFile("drizzle/schema.ts");

  it("should define businessAccounts table with required columns", () => {
    expect(schema).toContain("businessAccounts");
    expect(schema).toContain("companyName");
    expect(schema).toContain("contactName");
    expect(schema).toContain("contactEmail");
    expect(schema).toContain("commissionPercent");
    expect(schema).toContain("creditLimit");
    expect(schema).toContain("currentBalance");
    expect(schema).toContain("status");
  });

  it("should define employees table with required columns", () => {
    expect(schema).toContain("employees");
    expect(schema).toContain("fullName");
    expect(schema).toContain("passwordHash");
    expect(schema).toContain("role");
    expect(schema).toContain("permissions");
    expect(schema).toContain("department");
  });

  it("should have employee roles: manager, accountant, booking_agent, support", () => {
    expect(schema).toContain("manager");
    expect(schema).toContain("accountant");
    expect(schema).toContain("booking_agent");
    expect(schema).toContain("support");
  });
});

describe("Server DB Helpers - Business Accounts & Employees", () => {
  const db = readFile("server/db.ts");

  it("should export business account CRUD helpers", () => {
    expect(db).toContain("getBusinessAccounts");
    expect(db).toContain("getBusinessAccountById");
    expect(db).toContain("createBusinessAccount");
    expect(db).toContain("updateBusinessAccount");
    expect(db).toContain("deleteBusinessAccount");
  });

  it("should export employee CRUD helpers", () => {
    expect(db).toContain("getEmployees");
    expect(db).toContain("getEmployeeById");
    expect(db).toContain("createEmployee");
    expect(db).toContain("updateEmployee");
    expect(db).toContain("deleteEmployee");
  });

  it("should have password hashing for employees", () => {
    expect(db).toContain("hashPassword");
    expect(db).toContain("verifyPassword");
  });
});

describe("Server Routes - Business Accounts & Employees", () => {
  const routers = readFile("server/routers.ts");

  it("should have businessAccounts router with CRUD operations", () => {
    expect(routers).toContain("businessAccounts: router(");
    expect(routers).toContain("getBusinessAccounts");
    expect(routers).toContain("createBusinessAccount");
    expect(routers).toContain("updateBusinessAccount");
    expect(routers).toContain("deleteBusinessAccount");
  });

  it("should have employees router with CRUD operations", () => {
    expect(routers).toContain("employees: router(");
    expect(routers).toContain("getEmployees");
    expect(routers).toContain("createEmployee");
    expect(routers).toContain("updateEmployee");
    expect(routers).toContain("deleteEmployee");
  });

  it("should have employee login route", () => {
    expect(routers).toContain("verifyLogin:");
    expect(routers).toContain("verifyPassword");
  });
});

describe("Admin Dashboard - Business Accounts Screen", () => {
  const screen = readFile("app/admin/business-accounts.tsx");

  it("should have business account management UI", () => {
    expect(screen).toContain("BusinessAccount");
    expect(screen).toContain("companyName");
    expect(screen).toContain("commissionPercent");
    expect(screen).toContain("creditLimit");
  });

  it("should have create/edit/delete functionality", () => {
    expect(screen).toContain("handleCreate");
    expect(screen).toContain("handleUpdate");
    expect(screen).toContain("handleDelete");
  });

  it("should have commission percentage control", () => {
    expect(screen).toContain("commissionPercent");
    expect(screen).toContain("النسبة المئوية");
  });

  it("should use trpc for API calls", () => {
    expect(screen).toContain("trpc.businessAccounts.list");
    expect(screen).toContain("trpc.businessAccounts.create");
    expect(screen).toContain("trpc.businessAccounts.update");
    expect(screen).toContain("trpc.businessAccounts.delete");
  });
});

describe("Admin Dashboard - Employees Screen", () => {
  const screen = readFile("app/admin/employees.tsx");

  it("should have employee management UI", () => {
    expect(screen).toContain("Employee");
    expect(screen).toContain("fullName");
    expect(screen).toContain("email");
    expect(screen).toContain("role");
  });

  it("should define four employee roles", () => {
    expect(screen).toContain("manager");
    expect(screen).toContain("accountant");
    expect(screen).toContain("booking_agent");
    expect(screen).toContain("support");
  });

  it("should have role-based permissions system", () => {
    expect(screen).toContain("ALL_PERMISSIONS");
    expect(screen).toContain("DEFAULT_PERMISSIONS");
    expect(screen).toContain("selectedPermissions");
    expect(screen).toContain("togglePermission");
  });

  it("should define specific permissions", () => {
    expect(screen).toContain("view_bookings");
    expect(screen).toContain("manage_bookings");
    expect(screen).toContain("confirm_payments");
    expect(screen).toContain("issue_tickets");
    expect(screen).toContain("view_reports");
    expect(screen).toContain("manage_business_accounts");
    expect(screen).toContain("manage_employees");
  });

  it("should have create/edit/delete functionality", () => {
    expect(screen).toContain("handleCreate");
    expect(screen).toContain("handleUpdate");
    expect(screen).toContain("handleDelete");
  });

  it("should have status toggle (active/inactive)", () => {
    expect(screen).toContain("handleToggleStatus");
    expect(screen).toContain("active");
    expect(screen).toContain("inactive");
  });

  it("should use trpc for API calls", () => {
    expect(screen).toContain("trpc.employees.list");
    expect(screen).toContain("trpc.employees.create");
    expect(screen).toContain("trpc.employees.update");
    expect(screen).toContain("trpc.employees.delete");
  });
});

describe("Admin Dashboard - Navigation", () => {
  const adminIndex = readFile("app/admin/index.tsx");
  const layout = readFile("app/_layout.tsx");

  it("should have navigation buttons to business accounts and employees", () => {
    expect(adminIndex).toContain("/admin/business-accounts");
    expect(adminIndex).toContain("/admin/employees");
  });

  it("should register new screens in _layout.tsx", () => {
    expect(layout).toContain("admin/business-accounts");
    expect(layout).toContain("admin/employees");
  });
});

describe("Travel Data - Duffel Alignment", () => {
  const mockData = readFile("lib/mock-data.ts");
  const duffel = readFile("server/duffel.ts");

  it("should have airlineCode field in Flight type", () => {
    expect(mockData).toContain("airlineCode");
  });

  it("should have airline codes in mock flight data", () => {
    expect(mockData).toContain('airlineCode: "EK"');
    expect(mockData).toContain('airlineCode: "AF"');
    expect(mockData).toContain('airlineCode: "QR"');
    expect(mockData).toContain('airlineCode: "BA"');
    expect(mockData).toContain('airlineCode: "TK"');
  });

  it("should have Flight.class accept string (Duffel cabin class)", () => {
    expect(mockData).toContain("| string");
  });

  it("should have FlightOffer type with passengerPricing", () => {
    expect(duffel).toContain("passengerPricing");
    expect(duffel).toContain("perPersonAmount");
  });

  it("should have Duffel searchFlights with infant support", () => {
    expect(duffel).toContain("infant_without_seat");
    expect(duffel).toContain("infants");
  });
});

describe("Explore Screen - Dynamic Dates", () => {
  const explore = readFile("app/(tabs)/explore.tsx");

  it("should not use hardcoded dates", () => {
    expect(explore).not.toContain("Apr 20, 2024");
    expect(explore).not.toContain("Apr 25, 2024");
  });

  it("should compute dates dynamically", () => {
    expect(explore).toContain("Date.now()");
    expect(explore).toContain("toISOString");
  });
});

describe("Icon Mappings", () => {
  const icons = readFile("components/ui/icon-symbol.tsx");

  it("should have all required icon mappings for admin screens", () => {
    expect(icons).toContain("building.fill");
    expect(icons).toContain("person.3.fill");
    expect(icons).toContain("crown.fill");
    expect(icons).toContain("banknote.fill");
    expect(icons).toContain("trash.fill");
    expect(icons).toContain("pencil");
    expect(icons).toContain("plus.circle.fill");
    expect(icons).toContain("checkmark.circle.fill");
    expect(icons).toContain("hand.raised.fill");
  });
});
