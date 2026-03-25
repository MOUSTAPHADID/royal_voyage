/**
 * PayPal Notification Sync — Polls the server for PayPal payment notifications
 * and syncs them to the local admin notification store.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "@/constants/oauth";
import { addAdminNotification } from "@/lib/admin-notifications";

const LAST_SYNC_KEY = "@royal_voyage_paypal_last_sync";

interface PayPalServerNotification {
  id: string;
  type: string;
  txId: string;
  amount: string;
  currency: string;
  name: string;
  booking: string;
  timestamp: string;
}

/**
 * Fetch new PayPal notifications from the server and add them to local admin notifications.
 * Only adds notifications that are newer than the last sync time.
 */
export async function syncPayPalNotifications(): Promise<number> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/paypal-notifications`);
    if (!response.ok) return 0;

    const data = await response.json();
    const serverNotifications: PayPalServerNotification[] = data.notifications || [];

    if (serverNotifications.length === 0) return 0;

    // Get last sync timestamp
    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
    const lastSync = lastSyncStr ? new Date(lastSyncStr).getTime() : 0;

    // Filter only new notifications
    const newNotifications = serverNotifications.filter((n) => {
      const notifTime = new Date(n.timestamp).getTime();
      return notifTime > lastSync;
    });

    if (newNotifications.length === 0) return 0;

    // Add each new notification to local admin notifications
    for (const n of newNotifications) {
      await addAdminNotification({
        type: "paypal_payment",
        title: `\u062f\u0641\u0639\u0629 PayPal \u062c\u062f\u064a\u062f\u0629 \u{1F4B3}`,
        body: `${n.name || "\u0632\u0628\u0648\u0646"} \u062f\u0641\u0639 ${n.amount} ${n.currency} \u0639\u0628\u0631 PayPal\n\u0631\u0642\u0645 \u0627\u0644\u0639\u0645\u0644\u064a\u0629: ${n.txId}`,
      });
    }

    // Update last sync time to the newest notification
    const newestTimestamp = newNotifications.reduce((max, n) => {
      const t = new Date(n.timestamp).getTime();
      return t > max ? t : max;
    }, 0);
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date(newestTimestamp).toISOString());

    return newNotifications.length;
  } catch (error) {
    console.warn("[PayPal Sync] Error:", error);
    return 0;
  }
}
