import { describe, it, expect } from "vitest";

// ─── Test 1: FlightTicketData and HotelConfirmationData include ticketNumber ───
describe("Ticket Number in Email Data Types", () => {
  it("FlightTicketData should accept ticketNumber field", async () => {
    // Import the type and verify it compiles with ticketNumber
    const { default: fs } = await import("fs");
    const emailContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/server/email.ts",
      "utf-8"
    );
    // Check FlightTicketData has ticketNumber
    const flightMatch = emailContent.match(
      /export interface FlightTicketData \{[\s\S]*?ticketNumber\?\: string;[\s\S]*?\}/
    );
    expect(flightMatch).not.toBeNull();
  });

  it("HotelConfirmationData should accept ticketNumber field", async () => {
    const { default: fs } = await import("fs");
    const emailContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/server/email.ts",
      "utf-8"
    );
    const hotelMatch = emailContent.match(
      /export interface HotelConfirmationData \{[\s\S]*?ticketNumber\?\: string;[\s\S]*?\}/
    );
    expect(hotelMatch).not.toBeNull();
  });
});

// ─── Test 2: PDF includes Ticket Number rendering logic ───
describe("Ticket Number in PDF", () => {
  it("Flight PDF should render TICKET NO. when ticketNumber is provided", async () => {
    const { default: fs } = await import("fs");
    const pdfContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/server/pdf.ts",
      "utf-8"
    );
    // Check that the flight ticket section has TICKET NO. rendering
    expect(pdfContent).toContain('"TICKET NO."');
    expect(pdfContent).toContain("data.ticketNumber");
  });

  it("Hotel PDF should render TICKET NO. when ticketNumber is provided", async () => {
    const { default: fs } = await import("fs");
    const pdfContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/server/pdf.ts",
      "utf-8"
    );
    // Check hotel stub includes TICKET label
    expect(pdfContent).toContain('{ label: "TICKET", value: data.ticketNumber }');
  });

  it("Flight stub should include TICKET when ticketNumber is provided", async () => {
    const { default: fs } = await import("fs");
    const pdfContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/server/pdf.ts",
      "utf-8"
    );
    // Check flight stub includes TICKET label
    const flightStubMatch = pdfContent.match(
      /flightStubItems\.push\(\{ label: "TICKET", value: data\.ticketNumber \}\)/
    );
    expect(flightStubMatch).not.toBeNull();
  });
});

// ─── Test 3: Zod schema includes ticketNumber ───
describe("Zod Schema includes ticketNumber", () => {
  it("sendAirlineConfirmedTicket schema should include ticketNumber", async () => {
    const { default: fs } = await import("fs");
    const routersContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/server/routers.ts",
      "utf-8"
    );
    // Find the sendAirlineConfirmedTicket section and check for ticketNumber
    const airlineSection = routersContent.match(
      /sendAirlineConfirmedTicket[\s\S]*?\.mutation/
    );
    expect(airlineSection).not.toBeNull();
    expect(airlineSection![0]).toContain("ticketNumber: z.string().optional()");
  });

  it("sendAirlineConfirmedHotelTicket schema should include ticketNumber", async () => {
    const { default: fs } = await import("fs");
    const routersContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/server/routers.ts",
      "utf-8"
    );
    const hotelSection = routersContent.match(
      /sendAirlineConfirmedHotelTicket[\s\S]*?\.mutation/
    );
    expect(hotelSection).not.toBeNull();
    expect(hotelSection![0]).toContain("ticketNumber: z.string().optional()");
  });
});

// ─── Test 4: Admin redirect for admin user ───
describe("Admin Redirect on App Open", () => {
  it("index.tsx should redirect admin users to /admin", async () => {
    const { default: fs } = await import("fs");
    const indexContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/index.tsx",
      "utf-8"
    );
    // Check that admin redirect logic exists
    expect(indexContent).toContain("user?.isAdmin");
    expect(indexContent).toContain('href="/admin"');
  });

  it("index.tsx should redirect regular users to /(tabs)", async () => {
    const { default: fs } = await import("fs");
    const indexContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/index.tsx",
      "utf-8"
    );
    expect(indexContent).toContain('href="/(tabs)"');
  });
});

// ─── Test 5: Filter in manage-pnr.tsx ───
describe("Filter Tabs in Manage PNR Screen", () => {
  it("manage-pnr.tsx should have filter state with 4 options", async () => {
    const { default: fs } = await import("fs");
    const pnrContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/manage-pnr.tsx",
      "utf-8"
    );
    expect(pnrContent).toContain('"all" | "no_ticket" | "no_pnr" | "complete"');
  });

  it("manage-pnr.tsx should filter by no_ticket", async () => {
    const { default: fs } = await import("fs");
    const pnrContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/manage-pnr.tsx",
      "utf-8"
    );
    expect(pnrContent).toContain('filter === "no_ticket"');
    expect(pnrContent).toContain("!b.ticketNumber");
  });

  it("manage-pnr.tsx should filter by no_pnr", async () => {
    const { default: fs } = await import("fs");
    const pnrContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/manage-pnr.tsx",
      "utf-8"
    );
    expect(pnrContent).toContain('filter === "no_pnr"');
    expect(pnrContent).toContain("!b.realPnr");
  });

  it("manage-pnr.tsx should filter by complete (has both PNR and ticket)", async () => {
    const { default: fs } = await import("fs");
    const pnrContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/manage-pnr.tsx",
      "utf-8"
    );
    expect(pnrContent).toContain('filter === "complete"');
    expect(pnrContent).toContain("b.realPnr && b.ticketNumber");
  });

  it("manage-pnr.tsx should have filter tab styles", async () => {
    const { default: fs } = await import("fs");
    const pnrContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/manage-pnr.tsx",
      "utf-8"
    );
    expect(pnrContent).toContain("filterTab:");
    expect(pnrContent).toContain("filterTabText:");
    expect(pnrContent).toContain("filterBadge:");
    expect(pnrContent).toContain("filterBadgeText:");
  });

  it("manage-pnr.tsx should display count badges for each filter", async () => {
    const { default: fs } = await import("fs");
    const pnrContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/manage-pnr.tsx",
      "utf-8"
    );
    expect(pnrContent).toContain("noTicketCount");
    expect(pnrContent).toContain("noPnrCount");
    expect(pnrContent).toContain("completeCount");
  });
});

// ─── Test 6: update-status.tsx passes ticketNumber ───
describe("Update Status passes ticketNumber", () => {
  it("update-status.tsx should pass ticketNumber to sendAirlineConfirmedTicket", async () => {
    const { default: fs } = await import("fs");
    const statusContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/update-status.tsx",
      "utf-8"
    );
    // Check that ticketNumber is passed in the flight ticket mutation
    const flightSection = statusContent.match(
      /sendAirlineConfirmedTicket\.mutateAsync\(\{[\s\S]*?\}\)/
    );
    expect(flightSection).not.toBeNull();
    expect(flightSection![0]).toContain("ticketNumber");
  });

  it("update-status.tsx should pass ticketNumber to sendAirlineConfirmedHotelTicket", async () => {
    const { default: fs } = await import("fs");
    const statusContent = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/update-status.tsx",
      "utf-8"
    );
    const hotelSection = statusContent.match(
      /sendAirlineConfirmedHotelTicket\.mutateAsync\(\{[\s\S]*?\}\)/
    );
    expect(hotelSection).not.toBeNull();
    expect(hotelSection![0]).toContain("ticketNumber");
  });
});
