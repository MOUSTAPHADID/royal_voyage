import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Dynamic import to avoid crashes in Expo Go / web
let Notifications: typeof import("expo-notifications") | null = null;

async function getNotifications() {
  if (Notifications) return Notifications;
  if (Platform.OS === "web") return null;
  try {
    Notifications = await import("expo-notifications");
    return Notifications;
  } catch {
    return null;
  }
}

// ─── Notification texts per language ───────────────────────────────────────

type Lang = "ar" | "fr" | "en" | "pt";

interface NotifTexts {
  confirmTitle: string;
  confirmBody: (ref: string) => string;
  reminderTitle: string;
  reminderBody: (name: string, date: string) => string;
}

const TEXTS: Record<Lang, NotifTexts> = {
  ar: {
    confirmTitle: "✅ تم تأكيد حجزك",
    confirmBody: (ref) => `رقم الحجز: ${ref} — سنذكّرك قبل 24 ساعة من موعدك.`,
    reminderTitle: "⏰ تذكير: موعدك غداً!",
    reminderBody: (name, date) =>
      `${name} — ${date}\nلا تنسَ الاستعداد لرحلتك. فريق Royal Voyage يتمنى لك رحلة سعيدة!`,
  },
  fr: {
    confirmTitle: "✅ Réservation confirmée",
    confirmBody: (ref) => `Référence: ${ref} — Nous vous rappellerons 24h avant votre départ.`,
    reminderTitle: "⏰ Rappel: Votre voyage est demain!",
    reminderBody: (name, date) =>
      `${name} — ${date}\nN'oubliez pas de vous préparer. Bon voyage de la part de Royal Voyage!`,
  },
  en: {
    confirmTitle: "✅ Booking Confirmed",
    confirmBody: (ref) => `Reference: ${ref} — We'll remind you 24 hours before your trip.`,
    reminderTitle: "⏰ Reminder: Your trip is tomorrow!",
    reminderBody: (name, date) =>
      `${name} — ${date}\nDon't forget to prepare. Have a great trip from Royal Voyage!`,
  },
  pt: {
    confirmTitle: "✅ Reserva Confirmada",
    confirmBody: (ref) => `Referência: ${ref} — Iremos lembrá-lo 24 horas antes da sua viagem.`,
    reminderTitle: "⏰ Lembrete: A sua viagem é amanhã!",
    reminderBody: (name, date) =>
      `${name} — ${date}\nNão se esqueça de se preparar. Boa viagem da Royal Voyage!`,
  },
};

// ─── Setup Android channel ──────────────────────────────────────────────────

export async function setupNotificationChannel() {
  const N = await getNotifications();
  if (!N) return;

  // Set handler so notifications show when app is in foreground
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === "android") {
    await N.setNotificationChannelAsync("bookings", {
      name: "Booking Reminders",
      importance: N.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#1B4F72",
      sound: "default",
    });
  }
}

// ─── Request permissions ────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  const N = await getNotifications();
  if (!N) return false;

  const { status: existing } = await N.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await N.requestPermissionsAsync();
  return status === "granted";
}

// ─── Storage key for scheduled notification IDs ─────────────────────────────

const STORAGE_KEY = "booking_notification_ids";

async function saveNotifId(bookingRef: string, notifId: string) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[bookingRef] = notifId;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

async function getNotifId(bookingRef: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map: Record<string, string> = JSON.parse(raw);
    return map[bookingRef] ?? null;
  } catch {
    return null;
  }
}

// ─── Cancel a previously scheduled notification ─────────────────────────────

export async function cancelBookingNotification(bookingRef: string) {
  const N = await getNotifications();
  if (!N) return;

  const id = await getNotifId(bookingRef);
  if (id) {
    await N.cancelScheduledNotificationAsync(id).catch(() => {});
  }
}

// ─── Main: schedule confirmation + 24h reminder ─────────────────────────────

export interface ScheduleBookingNotifOptions {
  /** Booking reference number */
  bookingRef: string;
  /** Human-readable name of the booking (e.g. flight route or hotel name) */
  bookingName: string;
  /**
   * ISO date string of the event (departure date, check-in date, activity date).
   * Format: "YYYY-MM-DD" or full ISO string.
   */
  eventDate: string;
  /** Type of booking for icon selection */
  type: "flight" | "hotel" | "activity";
  /** App language */
  language?: Lang;
}

export async function scheduleBookingNotifications(
  opts: ScheduleBookingNotifOptions
): Promise<void> {
  const N = await getNotifications();
  if (!N) return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  const lang: Lang = (opts.language as Lang) || "ar";
  const texts = TEXTS[lang] || TEXTS.ar;

  // ── 1. Immediate confirmation notification ──────────────────────────────
  await N.scheduleNotificationAsync({
    content: {
      title: texts.confirmTitle,
      body: texts.confirmBody(opts.bookingRef),
      data: { bookingRef: opts.bookingRef, type: opts.type },
      sound: "default",
      ...(Platform.OS === "android" ? { channelId: "bookings" } : {}),
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    } as any,
  });

  // ── 2. 24-hour reminder before event ───────────────────────────────────
  // Parse the event date and subtract 24 hours
  let eventDateTime: Date;
  try {
    // If only a date string like "2026-05-10", treat it as midnight local time
    if (/^\d{4}-\d{2}-\d{2}$/.test(opts.eventDate)) {
      eventDateTime = new Date(`${opts.eventDate}T08:00:00`); // 8 AM on event day
    } else {
      eventDateTime = new Date(opts.eventDate);
    }
  } catch {
    return;
  }

  const reminderTime = new Date(eventDateTime.getTime() - 24 * 60 * 60 * 1000);
  const now = new Date();

  // Only schedule if the reminder time is in the future (at least 1 minute from now)
  if (reminderTime.getTime() > now.getTime() + 60 * 1000) {
    const formattedDate = eventDateTime.toLocaleDateString(
      lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : lang === "pt" ? "pt-PT" : "en-GB",
      { weekday: "long", day: "numeric", month: "long" }
    );

    const reminderId = await N.scheduleNotificationAsync({
      content: {
        title: texts.reminderTitle,
        body: texts.reminderBody(opts.bookingName, formattedDate),
        data: { bookingRef: opts.bookingRef, type: opts.type, isReminder: true },
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: "bookings" } : {}),
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      } as any,
    });

    await saveNotifId(opts.bookingRef, reminderId);
  }
}
