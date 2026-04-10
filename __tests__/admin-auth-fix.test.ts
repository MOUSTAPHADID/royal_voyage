/**
 * Tests for:
 * 1. adminProcedure accepting active employees via X-Employee-Id header
 * 2. createAdminTRPCClient existence in lib/trpc.ts
 * 3. partners.tsx FormState includes logoUrl field
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

describe("Admin Auth Fix - Employee Permissions", () => {
  it("adminProcedure in server/_core/trpc.ts accepts any active employee (not just manager)", () => {
    const content = readFileSync(join(ROOT, "server/_core/trpc.ts"), "utf-8");
    // Should NOT restrict to manager role only
    expect(content).not.toContain('emp.role === "manager"');
    // Should check for active status
    expect(content).toContain('emp.status === "active"');
    // Should read x-employee-id header
    expect(content).toContain("x-employee-id");
  });

  it("lib/trpc.ts sends X-Employee-Id header from AsyncStorage", () => {
    const content = readFileSync(join(ROOT, "lib/trpc.ts"), "utf-8");
    expect(content).toContain("x-employee-id");
    expect(content).toContain("@rv_admin_employee");
    expect(content).toContain("AsyncStorage");
  });

  it("lib/trpc.ts exports createAdminTRPCClient function", () => {
    const content = readFileSync(join(ROOT, "lib/trpc.ts"), "utf-8");
    expect(content).toContain("export function createAdminTRPCClient");
  });
});

describe("Company Logo Upload Feature", () => {
  it("partners.tsx FormState includes logoUrl field", () => {
    const content = readFileSync(join(ROOT, "app/admin/(tabs)/partners.tsx"), "utf-8");
    expect(content).toContain("logoUrl");
    expect(content).toContain("expo-image-picker");
    expect(content).toContain("handlePickLogo");
    expect(content).toContain("uploadLogo.upload");
  });

  it("partners.tsx shows logo image when logoUrl is set", () => {
    const content = readFileSync(join(ROOT, "app/admin/(tabs)/partners.tsx"), "utf-8");
    expect(content).toContain("item.logoUrl");
    expect(content).toContain("logoPreview");
  });

  it("businessAccounts router accepts logoUrl in create and update", () => {
    const content = readFileSync(join(ROOT, "server/routers.ts"), "utf-8");
    // logoUrl in create
    const createIdx = content.indexOf("businessAccounts: router");
    const createSlice = content.slice(createIdx, createIdx + 2000);
    expect(createSlice).toContain("logoUrl");
  });
});
