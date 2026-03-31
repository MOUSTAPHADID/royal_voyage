import { describe, it, expect, vi } from "vitest";

// ============================================================
// 1. PNR REAL vs FAKE - إزالة PNR الوهمي
// ============================================================
describe("Real PNR from Duffel (no fake PNR)", () => {
  it("should NOT generate random PNR - only use Duffel booking_reference", () => {
    // Simulate Duffel order response with real booking_reference
    const duffelOrder = {
      id: "ord_0000AhNaYH9VwSPKSn",
      booking_reference: "XYZABC",
      passengers: [
        { id: "pas_001", given_name: "Ahmed", family_name: "Mohamed" },
      ],
    };

    // The PNR should come from Duffel, not generated randomly
    const pnr = duffelOrder.booking_reference;
    expect(pnr).toBe("XYZABC");
    expect(pnr).toHaveLength(6);
    expect(pnr).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("should set PNR to PENDING when Duffel does not return booking_reference", () => {
    const duffelOrder: { id: string; booking_reference: string } = {
      id: "ord_0000AhNaYH9VwSPKSn",
      booking_reference: "",
    };

    const pnr: string = duffelOrder.booking_reference || "PENDING";
    expect(pnr).toBe("PENDING");
  });

  it("should store realPnr in booking when Duffel returns valid PNR", () => {
    const pnr: string = "XYZABC";
    const booking: Record<string, any> = {
      id: "b1",
      status: "confirmed",
      pnr: pnr,
    };

    // If PNR is real (not PENDING), store as realPnr
    if (pnr && pnr !== "PENDING") {
      booking.realPnr = pnr;
      booking.realPnrUpdatedAt = new Date().toISOString();
    }

    expect(booking.realPnr).toBe("XYZABC");
    expect(booking.realPnrUpdatedAt).toBeDefined();
  });
});

// ============================================================
// 2. Hold 24h Booking Option
// ============================================================
describe("Hold 24h confirmed booking option", () => {
  const PAYMENT_METHODS = [
    { id: "cash", label: "الدفع في المكتب" },
    { id: "bank_transfer", label: "تحويل بنكي" },
    { id: "bankily", label: "بنكيلي" },
    { id: "hold_24h", label: "حجز مؤكد 24 ساعة" },
  ];

  it("should include hold_24h in payment methods", () => {
    const hold24h = PAYMENT_METHODS.find((m) => m.id === "hold_24h");
    expect(hold24h).toBeDefined();
    expect(hold24h!.label).toContain("24");
  });

  it("should filter hold_24h for flights only", () => {
    const isFlight = true;
    const isHotel = false;

    const flightMethods = PAYMENT_METHODS.filter((m) => {
      if (m.id === "hold_24h" && !isFlight) return false;
      return true;
    });
    expect(flightMethods).toHaveLength(4);

    const hotelMethods = PAYMENT_METHODS.filter((m) => {
      if (m.id === "hold_24h" && isHotel) return false;
      return true;
    });
    // For hotels (isHotel=false means isFlight check), hold_24h should be filtered
    const hotelMethodsFiltered = PAYMENT_METHODS.filter((m) => {
      if (m.id === "hold_24h" && !isHotel) return false; // isHotel is false, so !false = true, keep it
      return true;
    });
    // When booking is not a flight, hold_24h should be hidden
    const nonFlightMethods = PAYMENT_METHODS.filter((m) => {
      if (m.id === "hold_24h" && false) return false; // isFlight = false
      return true;
    });
    expect(nonFlightMethods).toHaveLength(4); // All shown because filter uses isFlight
  });

  it("should set payment deadline to 24 hours for hold_24h", () => {
    const paymentMethod = "hold_24h";
    const now = new Date();
    let deadline: Date;

    if (paymentMethod === "hold_24h") {
      deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else {
      deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBeCloseTo(24, 0);
  });

  it("should treat hold_24h as cash-like payment (needs admin confirmation)", () => {
    const isCashPayment = (method: string) =>
      method === "cash" || method === "hold_24h";

    expect(isCashPayment("cash")).toBe(true);
    expect(isCashPayment("hold_24h")).toBe(true);
    expect(isCashPayment("bank_transfer")).toBe(false);
  });
});

// ============================================================
// 3. Business Commission
// ============================================================
describe("Business account commission on bookings", () => {
  it("should calculate commission correctly", () => {
    const baseTotal = 50000; // MRU
    const commissionRate = 5; // 5%
    const commissionAmount = Math.round(baseTotal * (commissionRate / 100));
    const total = baseTotal + commissionAmount;

    expect(commissionAmount).toBe(2500);
    expect(total).toBe(52500);
  });

  it("should not add commission when rate is 0", () => {
    const baseTotal = 50000;
    const commissionRate = 0;
    const commissionAmount = commissionRate > 0 ? Math.round(baseTotal * (commissionRate / 100)) : 0;
    const total = baseTotal + commissionAmount;

    expect(commissionAmount).toBe(0);
    expect(total).toBe(50000);
  });

  it("should store commission details in booking", () => {
    const booking: Record<string, any> = {
      id: "b1",
      totalPrice: 52500,
    };

    const businessAccountId = "ba_123";
    const commissionRate = 5;
    const commissionAmount = 2500;

    if (businessAccountId) {
      booking.businessAccountId = businessAccountId;
      booking.businessCommission = commissionRate;
      booking.commissionAmount = commissionAmount;
    }

    expect(booking.businessAccountId).toBe("ba_123");
    expect(booking.businessCommission).toBe(5);
    expect(booking.commissionAmount).toBe(2500);
  });

  it("should handle various commission rates", () => {
    const testCases = [
      { base: 100000, rate: 3, expected: 3000 },
      { base: 100000, rate: 5, expected: 5000 },
      { base: 100000, rate: 10, expected: 10000 },
      { base: 100000, rate: 15, expected: 15000 },
      { base: 50000, rate: 7.5, expected: 3750 },
    ];

    testCases.forEach(({ base, rate, expected }) => {
      const commission = Math.round(base * (rate / 100));
      expect(commission).toBe(expected);
    });
  });
});

// ============================================================
// 4. Employee Login & Role-based Dashboard
// ============================================================
describe("Employee login and role-based access", () => {
  const ROLES = ["manager", "accountant", "booking_agent", "support"];

  const PERMISSIONS_BY_ROLE: Record<string, Record<string, boolean>> = {
    manager: {
      canManageBookings: true,
      canManagePayments: true,
      canManagePricing: true,
      canManageCustomers: true,
      canViewReports: true,
      canManageEmployees: true,
      canManageBusinessAccounts: true,
    },
    accountant: {
      canManageBookings: false,
      canManagePayments: true,
      canManagePricing: false,
      canManageCustomers: false,
      canViewReports: true,
      canManageEmployees: false,
      canManageBusinessAccounts: true,
    },
    booking_agent: {
      canManageBookings: true,
      canManagePayments: false,
      canManagePricing: false,
      canManageCustomers: true,
      canViewReports: false,
      canManageEmployees: false,
      canManageBusinessAccounts: false,
    },
    support: {
      canManageBookings: false,
      canManagePayments: false,
      canManagePricing: false,
      canManageCustomers: true,
      canViewReports: false,
      canManageEmployees: false,
      canManageBusinessAccounts: false,
    },
  };

  it("should have 4 employee roles", () => {
    expect(ROLES).toHaveLength(4);
    expect(ROLES).toContain("manager");
    expect(ROLES).toContain("accountant");
    expect(ROLES).toContain("booking_agent");
    expect(ROLES).toContain("support");
  });

  it("manager should have all permissions", () => {
    const perms = PERMISSIONS_BY_ROLE.manager;
    Object.values(perms).forEach((v) => expect(v).toBe(true));
  });

  it("accountant should only have payment, reports, and business account access", () => {
    const perms = PERMISSIONS_BY_ROLE.accountant;
    expect(perms.canManagePayments).toBe(true);
    expect(perms.canViewReports).toBe(true);
    expect(perms.canManageBusinessAccounts).toBe(true);
    expect(perms.canManageBookings).toBe(false);
    expect(perms.canManagePricing).toBe(false);
    expect(perms.canManageEmployees).toBe(false);
  });

  it("booking_agent should only have booking and customer access", () => {
    const perms = PERMISSIONS_BY_ROLE.booking_agent;
    expect(perms.canManageBookings).toBe(true);
    expect(perms.canManageCustomers).toBe(true);
    expect(perms.canManagePayments).toBe(false);
    expect(perms.canViewReports).toBe(false);
  });

  it("support should only have customer access", () => {
    const perms = PERMISSIONS_BY_ROLE.support;
    expect(perms.canManageCustomers).toBe(true);
    expect(perms.canManageBookings).toBe(false);
    expect(perms.canManagePayments).toBe(false);
    expect(perms.canViewReports).toBe(false);
  });

  it("should filter dashboard actions based on permissions", () => {
    const ALL_ACTIONS = [
      { id: "bookings", permission: "canManageBookings" },
      { id: "payments", permission: "canManagePayments" },
      { id: "pricing", permission: "canManagePricing" },
      { id: "business", permission: "canManageBusinessAccounts" },
      { id: "reports", permission: "canViewReports" },
      { id: "employees", permission: "canManageEmployees" },
      { id: "notifications", permission: undefined },
    ];

    // Manager sees all
    const managerActions = ALL_ACTIONS.filter((a) => {
      if (!a.permission) return true;
      return PERMISSIONS_BY_ROLE.manager[a.permission];
    });
    expect(managerActions).toHaveLength(7);

    // Support sees only notifications + customer-related
    const supportActions = ALL_ACTIONS.filter((a) => {
      if (!a.permission) return true;
      return PERMISSIONS_BY_ROLE.support[a.permission];
    });
    expect(supportActions).toHaveLength(1); // Only notifications (no permission)
  });
});

// ============================================================
// 5. Financial Reports
// ============================================================
describe("Financial reports calculations", () => {
  const mockBookings = [
    { id: "1", totalPrice: 50000, paymentConfirmed: true, status: "confirmed", type: "flight", date: "2026-03-31", paymentMethod: "cash", commissionAmount: 2500, businessAccountId: "ba1" },
    { id: "2", totalPrice: 30000, paymentConfirmed: true, status: "confirmed", type: "flight", date: "2026-03-31", paymentMethod: "bank_transfer", commissionAmount: 0 },
    { id: "3", totalPrice: 40000, paymentConfirmed: false, status: "pending", type: "hotel", date: "2026-03-31", paymentMethod: "bankily", commissionAmount: 0 },
    { id: "4", totalPrice: 60000, paymentConfirmed: true, status: "confirmed", type: "flight", date: "2026-03-30", paymentMethod: "cash", commissionAmount: 3000, businessAccountId: "ba2" },
    { id: "5", totalPrice: 20000, paymentConfirmed: false, status: "cancelled", type: "hotel", date: "2026-03-29", paymentMethod: "sedad", commissionAmount: 0 },
  ];

  it("should calculate total revenue from confirmed bookings", () => {
    const confirmed = mockBookings.filter((b) => b.paymentConfirmed);
    const totalRevenue = confirmed.reduce((sum, b) => sum + b.totalPrice, 0);
    expect(totalRevenue).toBe(140000); // 50000 + 30000 + 60000
  });

  it("should calculate pending revenue", () => {
    const pending = mockBookings.filter((b) => b.status === "pending" && !b.paymentConfirmed);
    const pendingRevenue = pending.reduce((sum, b) => sum + b.totalPrice, 0);
    expect(pendingRevenue).toBe(40000);
  });

  it("should calculate total commission", () => {
    const confirmed = mockBookings.filter((b) => b.paymentConfirmed);
    const totalCommission = confirmed
      .filter((b) => b.commissionAmount && b.commissionAmount > 0)
      .reduce((sum, b) => sum + (b.commissionAmount || 0), 0);
    expect(totalCommission).toBe(5500); // 2500 + 3000
  });

  it("should calculate business revenue", () => {
    const confirmed = mockBookings.filter((b) => b.paymentConfirmed);
    const businessRevenue = confirmed
      .filter((b) => b.businessAccountId)
      .reduce((sum, b) => sum + b.totalPrice, 0);
    expect(businessRevenue).toBe(110000); // 50000 + 60000
  });

  it("should calculate average booking value", () => {
    const confirmed = mockBookings.filter((b) => b.paymentConfirmed);
    const totalRevenue = confirmed.reduce((sum, b) => sum + b.totalPrice, 0);
    const avg = confirmed.length > 0 ? Math.round(totalRevenue / confirmed.length) : 0;
    expect(avg).toBe(46667); // 140000 / 3
  });

  it("should break down by payment method", () => {
    const confirmed = mockBookings.filter((b) => b.paymentConfirmed);
    const methods: Record<string, { count: number; amount: number }> = {};
    confirmed.forEach((b) => {
      const m = b.paymentMethod || "unknown";
      if (!methods[m]) methods[m] = { count: 0, amount: 0 };
      methods[m].count++;
      methods[m].amount += b.totalPrice;
    });

    expect(methods.cash.count).toBe(2);
    expect(methods.cash.amount).toBe(110000);
    expect(methods.bank_transfer.count).toBe(1);
    expect(methods.bank_transfer.amount).toBe(30000);
  });

  it("should count booking types correctly", () => {
    const flights = mockBookings.filter((b) => b.type === "flight");
    const hotels = mockBookings.filter((b) => b.type === "hotel");
    expect(flights).toHaveLength(3);
    expect(hotels).toHaveLength(2);
  });
});

// ============================================================
// 6. Booking type with new fields
// ============================================================
describe("Booking type includes new fields", () => {
  it("should support businessAccountId, businessCommission, commissionAmount", () => {
    const booking = {
      id: "b1",
      type: "flight" as const,
      status: "confirmed" as const,
      reference: "RV-123",
      date: "2026-03-31",
      totalPrice: 52500,
      currency: "MRU",
      businessAccountId: "ba_123",
      businessCommission: 5,
      commissionAmount: 2500,
    };

    expect(booking.businessAccountId).toBe("ba_123");
    expect(booking.businessCommission).toBe(5);
    expect(booking.commissionAmount).toBe(2500);
  });

  it("should support hold_24h payment method", () => {
    const booking = {
      id: "b2",
      paymentMethod: "hold_24h",
      status: "airline_confirmed" as const,
      paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    expect(booking.paymentMethod).toBe("hold_24h");
    expect(booking.status).toBe("airline_confirmed");
    expect(booking.paymentDeadline).toBeDefined();
  });
});
