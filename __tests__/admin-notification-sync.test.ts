import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock AsyncStorage
const store: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
  },
}));

describe("admin-notification-sync", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
  });

  it("syncBookingsToNotifications creates notifications for new bookings", async () => {
    const { syncBookingsToNotifications } = await import("../lib/admin-notification-sync");
    const { getAdminNotifications } = await import("../lib/admin-notifications");

    const bookings = [
      {
        id: "b1",
        type: "flight" as const,
        status: "confirmed" as const,
        reference: "RV-001",
        date: "2026-04-04",
        totalPrice: 5000,
        currency: "MRU",
        passengerName: "أحمد محمد",
        paymentMethod: "cash",
        flight: {
          id: "f1",
          airline: "Turkish Airlines",
          airlineLogo: "",
          flightNumber: "TK123",
          origin: "Beirut",
          originCode: "BEY",
          destination: "Istanbul",
          destinationCode: "IST",
          departureTime: "10:00",
          arrivalTime: "12:00",
          duration: "2h",
          stops: 0,
          price: 5000,
          currency: "MRU",
          class: "Economy",
          seatsLeft: 5,
        },
      },
      {
        id: "b2",
        type: "hotel" as const,
        status: "pending" as const,
        reference: "RV-002",
        date: "2026-04-10",
        totalPrice: 3000,
        currency: "MRU",
        guestName: "فاطمة علي",
        paymentMethod: "bank_transfer",
        hotel: {
          id: "h1",
          name: "Hilton Istanbul",
          image: "",
          rating: 5,
          pricePerNight: 1000,
          currency: "MRU",
          location: "Istanbul",
          amenities: [],
        },
      },
    ];

    const count = await syncBookingsToNotifications(bookings as any);
    expect(count).toBe(2);

    const notifs = await getAdminNotifications();
    expect(notifs.length).toBe(2);
    expect(notifs.some((n) => n.bookingRef === "RV-001")).toBe(true);
    expect(notifs.some((n) => n.bookingRef === "RV-002")).toBe(true);
  });

  it("does not create duplicate notifications on second sync", async () => {
    const { syncBookingsToNotifications } = await import("../lib/admin-notification-sync");
    const { getAdminNotifications } = await import("../lib/admin-notifications");

    const bookings = [
      {
        id: "b3",
        type: "flight" as const,
        status: "confirmed" as const,
        reference: "RV-003",
        date: "2026-04-05",
        totalPrice: 2000,
        currency: "MRU",
        passengerName: "عمر",
        flight: {
          id: "f2",
          airline: "Air France",
          airlineLogo: "",
          flightNumber: "AF456",
          origin: "Paris",
          originCode: "CDG",
          destination: "Dubai",
          destinationCode: "DXB",
          departureTime: "14:00",
          arrivalTime: "22:00",
          duration: "6h",
          stops: 0,
          price: 2000,
          currency: "MRU",
          class: "Economy",
          seatsLeft: 10,
        },
      },
    ];

    const count1 = await syncBookingsToNotifications(bookings as any);
    expect(count1).toBe(1);

    const count2 = await syncBookingsToNotifications(bookings as any);
    expect(count2).toBe(0);

    const notifs = await getAdminNotifications();
    // Only 1 notification for b3 (not duplicated)
    const b3Notifs = notifs.filter((n) => n.bookingRef === "RV-003");
    expect(b3Notifs.length).toBe(1);
  });

  it("creates cancelled notification for cancelled bookings", async () => {
    const { syncBookingsToNotifications } = await import("../lib/admin-notification-sync");
    const { getAdminNotifications } = await import("../lib/admin-notifications");

    const bookings = [
      {
        id: "b4",
        type: "flight" as const,
        status: "cancelled" as const,
        reference: "RV-004",
        date: "2026-04-06",
        totalPrice: 1500,
        currency: "MRU",
        passengerName: "خالد",
        flight: {
          id: "f3",
          airline: "Emirates",
          airlineLogo: "",
          flightNumber: "EK789",
          origin: "Dubai",
          originCode: "DXB",
          destination: "London",
          destinationCode: "LHR",
          departureTime: "08:00",
          arrivalTime: "14:00",
          duration: "7h",
          stops: 0,
          price: 1500,
          currency: "MRU",
          class: "Economy",
          seatsLeft: 3,
        },
      },
    ];

    await syncBookingsToNotifications(bookings as any);
    const notifs = await getAdminNotifications();
    const cancelledNotif = notifs.find((n) => n.bookingRef === "RV-004");
    expect(cancelledNotif).toBeDefined();
    expect(cancelledNotif!.type).toBe("booking_cancelled");
    expect(cancelledNotif!.title).toContain("ملغى");
  });

  it("resetNotificationSync clears synced IDs", async () => {
    const { syncBookingsToNotifications, resetNotificationSync } = await import("../lib/admin-notification-sync");
    const { getAdminNotifications, clearAdminNotifications } = await import("../lib/admin-notifications");

    const bookings = [
      {
        id: "b5",
        type: "flight" as const,
        status: "confirmed" as const,
        reference: "RV-005",
        date: "2026-04-07",
        totalPrice: 4000,
        currency: "MRU",
        passengerName: "سارة",
        flight: {
          id: "f4",
          airline: "Qatar Airways",
          airlineLogo: "",
          flightNumber: "QR100",
          origin: "Doha",
          originCode: "DOH",
          destination: "Cairo",
          destinationCode: "CAI",
          departureTime: "09:00",
          arrivalTime: "12:00",
          duration: "3h",
          stops: 0,
          price: 4000,
          currency: "MRU",
          class: "Economy",
          seatsLeft: 8,
        },
      },
    ];

    await syncBookingsToNotifications(bookings as any);
    await clearAdminNotifications();
    await resetNotificationSync();

    // After reset, syncing again should create new notifications
    const count = await syncBookingsToNotifications(bookings as any);
    expect(count).toBe(1);
  });

  it("admin/notifications.tsx imports syncBookingsToNotifications", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/admin/notifications.tsx", "utf-8");
    expect(content).toContain("syncBookingsToNotifications");
    expect(content).toContain("admin-notification-sync");
  });

  it("admin/index.tsx imports and uses syncBookingsToNotifications", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/admin/index.tsx", "utf-8");
    expect(content).toContain("syncBookingsToNotifications");
    expect(content).toContain("notifUnread");
    expect(content).toContain("getUnreadCount");
  });
});
