import { useEffect, useRef, useCallback, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useApp } from "@/lib/app-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const POLLING_INTERVAL = 60_000; // 60 seconds
const STORAGE_KEY = "@ticket_polling_enabled";
const NOTIFIED_KEY = "@ticket_polling_notified";

/**
 * Hook that polls Amadeus API for ticket issuance status on pending flight bookings.
 * When a ticket is found, it updates the booking and sends a local notification.
 */
export function useTicketPolling() {
  const { bookings, updateBookingTicketNumber, updateBookingStatus } = useApp();
  const [isPolling, setIsPolling] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  // Load polling state from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val !== null) setPollingEnabled(val === "true");
    });
    AsyncStorage.getItem(NOTIFIED_KEY).then((val) => {
      if (val) {
        try {
          const arr = JSON.parse(val);
          notifiedRef.current = new Set(arr);
        } catch {}
      }
    });
  }, []);

  // Get pending flight bookings with amadeusOrderId
  const getPendingBookings = useCallback(() => {
    return bookings.filter(
      (b) =>
        b.type === "flight" &&
        b.amadeusOrderId &&
        b.status !== "cancelled" &&
        !b.ticketNumber &&
        !notifiedRef.current.has(b.id)
    );
  }, [bookings]);

  // Check a single booking for ticket issuance
  const checkBooking = useCallback(
    async (booking: (typeof bookings)[0]) => {
      try {
        // Use fetch directly since we're outside React component
        const apiUrl = `http://127.0.0.1:3000`;
        const resp = await fetch(`${apiUrl}/trpc/amadeus.checkTicketIssuance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ json: { orderId: booking.amadeusOrderId! } }),
        });
        const json = await resp.json();
        const result = json?.result?.data?.json;

        if (result?.ticketNumber) {
          // Ticket found! Update booking
          updateBookingTicketNumber(booking.id, result.ticketNumber);
          updateBookingStatus(booking.id, "airline_confirmed");

          // Mark as notified
          notifiedRef.current.add(booking.id);
          AsyncStorage.setItem(
            NOTIFIED_KEY,
            JSON.stringify([...notifiedRef.current])
          );

          // Send local notification
          await sendTicketNotification(booking, result.ticketNumber);

          return { bookingId: booking.id, ticketNumber: result.ticketNumber };
        }
      } catch (err) {
        // Silently fail for individual checks
        console.log(`[TicketPolling] Error checking ${booking.id}:`, err);
      }
      return null;
    },
    [updateBookingTicketNumber, updateBookingStatus]
  );

  // Poll all pending bookings
  const pollOnce = useCallback(async () => {
    const pending = getPendingBookings();
    setPendingCount(pending.length);

    if (pending.length === 0) return;

    setIsPolling(true);
    const results = [];

    for (const booking of pending) {
      const result = await checkBooking(booking);
      if (result) results.push(result);
      // Small delay between checks to avoid rate limiting
      await new Promise((r) => setTimeout(r, 2000));
    }

    setLastCheck(new Date().toISOString());
    setIsPolling(false);

    return results;
  }, [getPendingBookings, checkBooking]);

  // Start/stop polling
  useEffect(() => {
    if (pollingEnabled && getPendingBookings().length > 0) {
      // Poll immediately
      pollOnce();

      // Then poll at interval
      intervalRef.current = setInterval(pollOnce, POLLING_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pollingEnabled, bookings.length]);

  // Toggle polling
  const togglePolling = useCallback(
    async (enabled: boolean) => {
      setPollingEnabled(enabled);
      await AsyncStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
    },
    []
  );

  // Manual check
  const checkNow = useCallback(async () => {
    return pollOnce();
  }, [pollOnce]);

  return {
    isPolling,
    pollingEnabled,
    togglePolling,
    lastCheck,
    pendingCount: getPendingBookings().length,
    checkNow,
  };
}

/**
 * Send a local notification when a ticket is issued.
 */
async function sendTicketNotification(
  booking: any,
  ticketNumber: string
) {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("tickets", {
        name: "إصدار التذاكر",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#22C55E",
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎫 تم إصدار التذكرة!",
        body: `تم إصدار تذكرة الرحلة ${booking.flightNumber || ""} برقم ${ticketNumber}`,
        data: { bookingId: booking.id, ticketNumber },
        sound: true,
      },
      trigger: null, // Immediately
    });
  } catch (err) {
    console.log("[TicketPolling] Notification error:", err);
  }
}
