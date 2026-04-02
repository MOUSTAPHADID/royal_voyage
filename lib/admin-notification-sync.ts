/**
 * Admin Notification Sync — Generates notifications from bookings.
 * 
 * Since AsyncStorage is local to each device, notifications created on the
 * customer's device are not visible on the admin's device. This module
 * bridges the gap by scanning bookings and creating notifications for any
 * booking that doesn't already have a corresponding notification.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addAdminNotification, getAdminNotifications } from "./admin-notifications";
import type { Booking } from "./mock-data";

const SYNCED_KEY = "@royal_voyage_synced_booking_ids";

/**
 * Get the set of booking IDs that have already been synced as notifications.
 */
async function getSyncedBookingIds(): Promise<Set<string>> {
  try {
    const data = await AsyncStorage.getItem(SYNCED_KEY);
    if (!data) return new Set();
    return new Set(JSON.parse(data) as string[]);
  } catch {
    return new Set();
  }
}

/**
 * Save the set of synced booking IDs.
 */
async function saveSyncedBookingIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(SYNCED_KEY, JSON.stringify([...ids]));
}

/**
 * Format currency for notification body.
 */
function formatPrice(amount: number, currency: string): string {
  if (currency === "MRU") return `${amount.toLocaleString()} MRU`;
  if (currency === "USD") return `$${amount.toLocaleString()}`;
  if (currency === "EUR") return `€${amount.toLocaleString()}`;
  return `${amount.toLocaleString()} ${currency}`;
}

/**
 * Get a human-readable payment method label.
 */
function getPaymentLabel(method?: string): string {
  const labels: Record<string, string> = {
    cash: "نقدي",
    bank_transfer: "تحويل بنكي",
    bankily: "بنكيلي",
    masrvi: "مصرفي",
    sedad: "سداد",
    stripe: "بطاقة بنكية (Stripe)",
    paypal: "PayPal",
    multicaixa: "Multicaixa",
    hold_24h: "حجز 24 ساعة",
  };
  return method ? labels[method] || method : "غير محدد";
}

/**
 * Sync bookings to admin notifications.
 * Creates notifications for any booking that doesn't already have one.
 * Returns the number of new notifications created.
 */
export async function syncBookingsToNotifications(bookings: Booking[]): Promise<number> {
  if (!bookings || bookings.length === 0) return 0;

  const syncedIds = await getSyncedBookingIds();
  const existingNotifs = await getAdminNotifications();
  
  // Also check existing notifications for booking IDs to avoid duplicates
  const notifiedBookingIds = new Set(
    existingNotifs
      .filter((n) => n.bookingId)
      .map((n) => n.bookingId!)
  );

  let newCount = 0;

  // Sort bookings by date (oldest first) so notifications appear in chronological order
  const sortedBookings = [...bookings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const booking of sortedBookings) {
    // Skip if already synced or already has a notification
    if (syncedIds.has(booking.id) || notifiedBookingIds.has(booking.id)) {
      syncedIds.add(booking.id); // Ensure it's in synced set
      continue;
    }

    const customerName = booking.passengerName || booking.guestName || "زبون";
    const isFlight = booking.type === "flight";
    const bookingType = isFlight ? "رحلة" : "فندق";

    let destination = "";
    if (isFlight && booking.flight) {
      destination = `${booking.flight.originCode || booking.flight.origin} → ${booking.flight.destinationCode || booking.flight.destination}`;
    } else if (!isFlight && booking.hotel) {
      destination = booking.hotel.name || "";
    }

    const price = formatPrice(booking.totalPrice, booking.currency);
    const payment = getPaymentLabel(booking.paymentMethod);

    // Determine notification type based on booking status
    let notifType: "new_booking" | "booking_cancelled" | "payment_confirmed" = "new_booking";
    let title = `حجز جديد - ${bookingType}`;
    let body = `${customerName} • ${destination} • ${price} • ${payment} • ${booking.reference}`;

    if (booking.status === "cancelled") {
      notifType = "booking_cancelled";
      title = `تم إلغاء الحجز - ${bookingType}`;
      body = `${customerName} • ${destination} • ${booking.reference}`;
    } else if (booking.paymentConfirmed) {
      notifType = "payment_confirmed";
      title = `تم تأكيد الدفع - ${bookingType}`;
      body = `${customerName} • ${destination} • ${price} • ${booking.reference}`;
    }

    await addAdminNotification({
      type: notifType,
      title,
      body,
      bookingRef: booking.reference,
      bookingId: booking.id,
    });

    syncedIds.add(booking.id);
    newCount++;
  }

  await saveSyncedBookingIds(syncedIds);
  return newCount;
}

/**
 * Reset sync state (useful for testing or when clearing all data).
 */
export async function resetNotificationSync(): Promise<void> {
  await AsyncStorage.removeItem(SYNCED_KEY);
}
