import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf-8");

describe("Feature 1: Office ID display in admin overview", () => {
  it("admin/index.tsx imports trpc", () => {
    const src = read("app/admin/index.tsx");
    expect(src).toContain('import { trpc } from "@/lib/trpc"');
  });

  it("admin/index.tsx shows Office ID card with NKC26239A", () => {
    const src = read("app/admin/index.tsx");
    expect(src).toContain("Amadeus GDS");
    expect(src).toContain("OFFICE ID");
    expect(src).toContain("NKC26239A");
    expect(src).toContain("Production");
  });

  it("admin/index.tsx shows booking stats in Office ID card", () => {
    const src = read("app/admin/index.tsx");
    expect(src).toContain("إجمالي الحجوزات");
    expect(src).toContain("مؤكدة");
    expect(src).toContain("معلقة");
    expect(src).toContain("ملغاة");
  });

  it("admin/index.tsx has sales reports navigation button", () => {
    const src = read("app/admin/index.tsx");
    expect(src).toContain("تقارير المبيعات");
    expect(src).toContain("/admin/sales-reports");
  });

  it("server/amadeus.ts exports getAmadeusStatus", () => {
    const src = read("server/amadeus.ts");
    expect(src).toContain("export function getAmadeusStatus");
    expect(src).toContain("officeId");
    expect(src).toContain("environment");
    expect(src).toContain("isConnected");
  });

  it("server/routers.ts has getStatus endpoint", () => {
    const src = read("server/routers.ts");
    expect(src).toContain("getStatus:");
    expect(src).toContain("getAmadeusStatus");
  });
});

describe("Feature 2: Amadeus ticket issuance check", () => {
  it("server/amadeus.ts exports checkTicketIssuance", () => {
    const src = read("server/amadeus.ts");
    expect(src).toContain("export async function checkTicketIssuance");
    expect(src).toContain("TicketIssuanceResult");
    expect(src).toContain("ticketNumber");
  });

  it("server/routers.ts has checkTicketIssuance endpoint", () => {
    const src = read("server/routers.ts");
    expect(src).toContain("checkTicketIssuance:");
    expect(src).toContain("checkTicketIssuance(input.orderId)");
  });

  it("admin/booking-detail.tsx has ticket issuance check button", () => {
    const src = read("app/admin/booking-detail.tsx");
    expect(src).toContain("التحقق من إصدار التذكرة من Amadeus");
    expect(src).toContain("checkTicketIssuance");
    expect(src).toContain("updateBookingTicketNumber");
  });

  it("admin/booking-detail.tsx has PNR status button for Amadeus orders", () => {
    const src = read("app/admin/booking-detail.tsx");
    expect(src).toContain("عرض حالة PNR من Amadeus");
    expect(src).toContain("/pnr-status");
    expect(src).toContain("amadeusOrderId");
  });

  it("admin/booking-detail.tsx uses checkingTicket state", () => {
    const src = read("app/admin/booking-detail.tsx");
    expect(src).toContain("checkingTicket");
    expect(src).toContain("setCheckingTicket");
  });
});

describe("Feature 3: Sales reports screen", () => {
  it("sales-reports.tsx exists and has correct structure", () => {
    const src = read("app/admin/sales-reports.tsx");
    expect(src).toContain("SalesReportsScreen");
    expect(src).toContain("تقارير المبيعات");
    expect(src).toContain("Office ID");
  });

  it("sales-reports.tsx has daily and monthly view modes", () => {
    const src = read("app/admin/sales-reports.tsx");
    expect(src).toContain('"daily"');
    expect(src).toContain('"monthly"');
    expect(src).toContain("viewMode");
    expect(src).toContain("setViewMode");
  });

  it("sales-reports.tsx computes daily data from confirmed bookings", () => {
    const src = read("app/admin/sales-reports.tsx");
    expect(src).toContain("dailyData");
    expect(src).toContain("confirmedBookings");
    expect(src).toContain("dayMap");
  });

  it("sales-reports.tsx computes monthly data with payment method breakdown", () => {
    const src = read("app/admin/sales-reports.tsx");
    expect(src).toContain("monthlyData");
    expect(src).toContain("paymentMethods");
    expect(src).toContain("domesticFlights");
    expect(src).toContain("internationalFlights");
  });

  it("sales-reports.tsx has PDF export functionality", () => {
    const src = read("app/admin/sales-reports.tsx");
    expect(src).toContain("generatePDF");
    expect(src).toContain("printToFileAsync");
    expect(src).toContain("shareAsync");
    expect(src).toContain("تصدير");
  });

  it("sales-reports.tsx shows summary cards", () => {
    const src = read("app/admin/sales-reports.tsx");
    expect(src).toContain("حجوزات مؤكدة");
    expect(src).toContain("الإيرادات");
    expect(src).toContain("الأرباح");
  });

  it("sales-reports.tsx uses PAYMENT_METHOD_CONFIG for payment breakdown", () => {
    const src = read("app/admin/sales-reports.tsx");
    expect(src).toContain("PAYMENT_METHOD_CONFIG");
    expect(src).toContain("بنكيلي");
    expect(src).toContain("مصرفي");
    expect(src).toContain("Multicaixa Express");
  });

  it("_layout.tsx has sales-reports route", () => {
    const src = read("app/_layout.tsx");
    expect(src).toContain('name="admin/sales-reports"');
  });

  it("icon-symbol.tsx has new icons for features", () => {
    const src = read("components/ui/icon-symbol.tsx");
    expect(src).toContain('"building.fill"');
    expect(src).toContain('"chart.line.uptrend.xyaxis"');
  });
});
