/**
 * Admin Notifications — Local storage for admin notification history.
 * Stores notifications in AsyncStorage so the admin can review them later.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AdminNotificationType = "new_booking" | "booking_cancelled" | "payment_confirmed" | "payment_rejected" | "general";

export type AdminNotification = {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  bookingRef?: string;
  bookingId?: string;
  createdAt: string;
  read: boolean;
};

const STORAGE_KEY = "@royal_voyage_admin_notifications";
const MAX_NOTIFICATIONS = 200;

/**
 * Get all admin notifications from storage.
 */
export async function getAdminNotifications(): Promise<AdminNotification[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as AdminNotification[];
  } catch {
    return [];
  }
}

/**
 * Add a new admin notification to storage.
 */
export async function addAdminNotification(
  notification: Omit<AdminNotification, "id" | "createdAt" | "read">
): Promise<AdminNotification> {
  const existing = await getAdminNotifications();
  const newNotification: AdminNotification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const updated = [newNotification, ...existing].slice(0, MAX_NOTIFICATIONS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newNotification;
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(id: string): Promise<void> {
  const existing = await getAdminNotifications();
  const updated = existing.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsRead(): Promise<void> {
  const existing = await getAdminNotifications();
  const updated = existing.map((n) => ({ ...n, read: true }));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Get unread notification count.
 */
export async function getUnreadCount(): Promise<number> {
  const existing = await getAdminNotifications();
  return existing.filter((n) => !n.read).length;
}

/**
 * Clear all admin notifications.
 */
export async function clearAdminNotifications(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
