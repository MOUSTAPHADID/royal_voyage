import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

describe("Multi-Consolidator Support", () => {
  const amadeusPath = path.join(ROOT, "server/amadeus.ts");
  const amadeusCode = fs.readFileSync(amadeusPath, "utf-8");

  const routersPath = path.join(ROOT, "server/routers.ts");
  const routersCode = fs.readFileSync(routersPath, "utf-8");

  const adminPath = path.join(ROOT, "app/admin/index.tsx");
  const adminCode = fs.readFileSync(adminPath, "utf-8");

  const iconPath = path.join(ROOT, "components/ui/icon-symbol.tsx");
  const iconCode = fs.readFileSync(iconPath, "utf-8");

  describe("Server: Multi-Consolidator data structure", () => {
    it("should define ConsolidatorEntry type with currency field", () => {
      expect(amadeusCode).toContain("type ConsolidatorEntry");
      expect(amadeusCode).toContain('currency: string');
    });

    it("should have consolidators array", () => {
      expect(amadeusCode).toContain("let consolidators: ConsolidatorEntry[] = []");
    });

    it("should initialize LAD282354 with AOA currency", () => {
      expect(amadeusCode).toContain('"LAD282354"');
      expect(amadeusCode).toContain('currency: "AOA"');
    });

    it("should initialize legacy consolidator from env with MRU currency", () => {
      expect(amadeusCode).toContain("AMADEUS_CONSOLIDATOR_OFFICE_ID");
      expect(amadeusCode).toContain('currency: "MRU"');
    });
  });

  describe("Server: Multi-Consolidator functions", () => {
    it("should export addConsolidator function", () => {
      expect(amadeusCode).toContain("export function addConsolidator");
    });

    it("should export removeConsolidator function", () => {
      expect(amadeusCode).toContain("export function removeConsolidator");
    });

    it("should export setActiveConsolidator function", () => {
      expect(amadeusCode).toContain("export function setActiveConsolidator");
    });

    it("should export getConsolidatorForBooking function", () => {
      expect(amadeusCode).toContain("export function getConsolidatorForBooking");
    });

    it("getConsolidatorConfig should return consolidators array", () => {
      expect(amadeusCode).toContain("consolidators: consolidators.map");
    });

    it("getConsolidatorConfig should return consolidatorCurrency", () => {
      expect(amadeusCode).toContain("consolidatorCurrency:");
    });
  });

  describe("Server: tRPC routes", () => {
    it("should import addConsolidator", () => {
      expect(routersCode).toContain("addConsolidator,");
    });

    it("should import removeConsolidator", () => {
      expect(routersCode).toContain("removeConsolidator,");
    });

    it("should import setActiveConsolidator", () => {
      expect(routersCode).toContain("setActiveConsolidator,");
    });

    it("should have addConsolidator route with officeId and currency inputs", () => {
      expect(routersCode).toContain("addConsolidator: publicProcedure");
      expect(routersCode).toContain("officeId: z.string(), currency: z.string()");
    });

    it("should have removeConsolidator route", () => {
      expect(routersCode).toContain("removeConsolidator: publicProcedure");
    });

    it("should have setActiveConsolidator route", () => {
      expect(routersCode).toContain("setActiveConsolidator: publicProcedure");
    });
  });

  describe("Admin UI: Multi-Consolidator card", () => {
    it("should show Consolidators title (plural)", () => {
      expect(adminCode).toContain("Consolidators");
    });

    it("should map over consolidators list", () => {
      expect(adminCode).toContain("consolidators || []).map");
    });

    it("should show active badge", () => {
      expect(adminCode).toContain("نشط");
    });

    it("should show currency badge for each consolidator", () => {
      expect(adminCode).toContain("c.currency");
    });

    it("should have delete consolidator button", () => {
      expect(adminCode).toContain("حذف الوسيط");
    });

    it("should have add consolidator button", () => {
      expect(adminCode).toContain("إضافة وسيط جديد");
    });

    it("should have currency selector with AOA option", () => {
      expect(adminCode).toContain('"AOA"');
      expect(adminCode).toContain('"MRU"');
      expect(adminCode).toContain('"EUR"');
      expect(adminCode).toContain('"USD"');
      expect(adminCode).toContain('"XOF"');
    });

    it("should use addConsolidatorMut for adding", () => {
      expect(adminCode).toContain("addConsolidatorMut.mutateAsync");
    });

    it("should use removeConsolidatorMut for removing", () => {
      expect(adminCode).toContain("removeConsolidatorMut.mutateAsync");
    });

    it("should use setActiveMut for switching active", () => {
      expect(adminCode).toContain("setActiveMut.mutateAsync");
    });
  });

  describe("Icon mappings", () => {
    it("should have xmark.circle.fill icon", () => {
      expect(iconCode).toContain('"xmark.circle.fill"');
    });
  });
});
