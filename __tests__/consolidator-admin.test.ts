import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

describe("Consolidator Office ID Change from Admin", () => {
  it("server/amadeus.ts exports setConsolidatorOfficeId function", () => {
    const content = fs.readFileSync(path.join(ROOT, "server/amadeus.ts"), "utf-8");
    expect(content).toContain("export function setConsolidatorOfficeId");
  });

  it("setConsolidatorOfficeId validates IATA format", () => {
    const content = fs.readFileSync(path.join(ROOT, "server/amadeus.ts"), "utf-8");
    expect(content).toContain("Invalid IATA Office ID format");
    expect(content).toContain("/^[A-Z]{3}\\d{4,6}[A-Z]?$/");
  });

  it("setConsolidatorOfficeId updates CONSOLIDATOR_OFFICE_ID at runtime", () => {
    const content = fs.readFileSync(path.join(ROOT, "server/amadeus.ts"), "utf-8");
    expect(content).toContain("CONSOLIDATOR_OFFICE_ID = trimmed");
    expect(content).toContain('process.env.AMADEUS_CONSOLIDATOR_OFFICE_ID = trimmed');
  });

  it("CONSOLIDATOR_OFFICE_ID is declared as let (mutable)", () => {
    const content = fs.readFileSync(path.join(ROOT, "server/amadeus.ts"), "utf-8");
    expect(content).toContain("let CONSOLIDATOR_OFFICE_ID");
  });

  it("tRPC route setConsolidatorOfficeId exists in routers.ts", () => {
    const content = fs.readFileSync(path.join(ROOT, "server/routers.ts"), "utf-8");
    expect(content).toContain("setConsolidatorOfficeId: publicProcedure");
    expect(content).toContain("officeId: z.string()");
  });

  it("admin/index.tsx has Consolidator change modal", () => {
    const content = fs.readFileSync(path.join(ROOT, "app/admin/index.tsx"), "utf-8");
    expect(content).toContain("showConsolidatorModal");
    expect(content).toContain("setConsolidatorOfficeId");
    expect(content).toContain("تغيير Consolidator Office ID");
    expect(content).toContain("consolidatorInput");
  });

  it("admin/index.tsx uses consolidatorConfig from tRPC query", () => {
    const content = fs.readFileSync(path.join(ROOT, "app/admin/index.tsx"), "utf-8");
    expect(content).toContain("trpc.amadeus.getConsolidatorConfig.useQuery()");
    expect(content).toContain("consolidatorConfig.data?.isConfigured");
    expect(content).toContain("consolidatorConfig.data?.consolidatorOfficeId");
  });
});

describe("Ticket Polling with Notifications", () => {
  it("use-ticket-polling.ts hook exists", () => {
    const content = fs.readFileSync(path.join(ROOT, "hooks/use-ticket-polling.ts"), "utf-8");
    expect(content).toContain("export function useTicketPolling");
  });

  it("polling interval is 60 seconds", () => {
    const content = fs.readFileSync(path.join(ROOT, "hooks/use-ticket-polling.ts"), "utf-8");
    expect(content).toContain("POLLING_INTERVAL = 60_000");
  });

  it("hook returns isPolling, pollingEnabled, togglePolling, lastCheck, pendingCount, checkNow", () => {
    const content = fs.readFileSync(path.join(ROOT, "hooks/use-ticket-polling.ts"), "utf-8");
    expect(content).toContain("isPolling");
    expect(content).toContain("pollingEnabled");
    expect(content).toContain("togglePolling");
    expect(content).toContain("lastCheck");
    expect(content).toContain("pendingCount");
    expect(content).toContain("checkNow");
  });

  it("hook sends local notification when ticket is issued", () => {
    const content = fs.readFileSync(path.join(ROOT, "hooks/use-ticket-polling.ts"), "utf-8");
    expect(content).toContain("scheduleNotificationAsync");
    expect(content).toContain("تم إصدار التذكرة");
    expect(content).toContain("tickets"); // Android notification channel
  });

  it("hook persists polling state in AsyncStorage", () => {
    const content = fs.readFileSync(path.join(ROOT, "hooks/use-ticket-polling.ts"), "utf-8");
    expect(content).toContain("@ticket_polling_enabled");
    expect(content).toContain("AsyncStorage.setItem");
    expect(content).toContain("AsyncStorage.getItem");
  });

  it("hook filters only pending flight bookings with amadeusOrderId", () => {
    const content = fs.readFileSync(path.join(ROOT, "hooks/use-ticket-polling.ts"), "utf-8");
    expect(content).toContain('b.type === "flight"');
    expect(content).toContain("b.amadeusOrderId");
    expect(content).toContain("!b.ticketNumber");
  });

  it("admin/index.tsx imports and uses useTicketPolling", () => {
    const content = fs.readFileSync(path.join(ROOT, "app/admin/index.tsx"), "utf-8");
    expect(content).toContain('import { useTicketPolling }');
    expect(content).toContain("useTicketPolling()");
    expect(content).toContain("ticketPolling.pollingEnabled");
    expect(content).toContain("ticketPolling.checkNow");
    expect(content).toContain("متابعة إصدار التذاكر");
    expect(content).toContain("فحص الآن");
  });

  it("admin/index.tsx has toggle switch for polling", () => {
    const content = fs.readFileSync(path.join(ROOT, "app/admin/index.tsx"), "utf-8");
    expect(content).toContain("ticketPolling.togglePolling");
    expect(content).toContain("متابعة تلقائية");
  });

  it("hook updates booking ticket number and status on success", () => {
    const content = fs.readFileSync(path.join(ROOT, "hooks/use-ticket-polling.ts"), "utf-8");
    expect(content).toContain("updateBookingTicketNumber(booking.id, result.ticketNumber)");
    expect(content).toContain('updateBookingStatus(booking.id, "airline_confirmed")');
  });

  it("hook tracks notified bookings to avoid duplicate notifications", () => {
    const content = fs.readFileSync(path.join(ROOT, "hooks/use-ticket-polling.ts"), "utf-8");
    expect(content).toContain("notifiedRef");
    expect(content).toContain("@ticket_polling_notified");
    expect(content).toContain("notifiedRef.current.add(booking.id)");
  });
});
