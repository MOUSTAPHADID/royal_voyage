/**
 * خدمة Push Notifications
 * توفر إرسال إشعارات فورية للعملاء والمديرين
 */

import * as Notifications from 'expo-notifications';

interface PushTokenStore {
  [userId: string]: string;
}

const pushTokens: PushTokenStore = {};

/**
 * تسجيل push token للمستخدم
 */
export function registerPushToken(userId: string, token: string): void {
  pushTokens[userId] = token;
  console.log(`[Push] Registered token for user ${userId}`);
}

/**
 * الحصول على push token للمستخدم
 */
export function getPushToken(userId: string): string | null {
  return pushTokens[userId] || null;
}

/**
 * إرسال إشعار push للمستخدم
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const token = getPushToken(userId);
    if (!token) {
      console.warn(`[Push] No token registered for user ${userId}`);
      return false;
    }

    // إرسال عبر Expo Push Notifications
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
        badge: 1,
        priority: 'high',
      }),
    });

    const result = await response.json();
    const success = result?.data?.[0]?.status === 'ok';

    if (success) {
      console.log(`[Push] ✅ Sent to ${userId}`);
    } else {
      console.error(`[Push] ❌ Failed to send to ${userId}:`, result?.data?.[0]?.message);
    }

    return success;
  } catch (error) {
    console.error('[Push] Error sending notification:', error);
    return false;
  }
}

/**
 * إرسال إشعار دفع مؤكد
 */
export async function notifyPaymentConfirmed(
  userId: string,
  bookingRef: string,
  amount: number,
  currency: string
): Promise<boolean> {
  return sendPushNotification(
    userId,
    '✅ تم تأكيد الدفع',
    `تم تأكيد دفعك بنجاح - ${amount} ${currency}`,
    { bookingRef, type: 'payment_confirmed' }
  );
}

/**
 * إرسال إشعار تفعيل eSIM
 */
export async function notifyEsimActivated(
  userId: string,
  destination: string,
  dataAmount: string,
  orderId: string
): Promise<boolean> {
  return sendPushNotification(
    userId,
    '🌍 تم تفعيل eSIM',
    `تم تفعيل eSIM الخاص بك في ${destination} - ${dataAmount}`,
    { orderId, destination, type: 'esim_activated' }
  );
}

/**
 * إرسال إشعار تحديث حالة الحجز
 */
export async function notifyBookingStatusChanged(
  userId: string,
  bookingRef: string,
  status: string
): Promise<boolean> {
  const statusMessages: Record<string, { title: string; emoji: string }> = {
    confirmed: { title: 'تم تأكيد حجزك', emoji: '✅' },
    cancelled: { title: 'تم إلغاء حجزك', emoji: '❌' },
    completed: { title: 'اكتمل حجزك', emoji: '🎉' },
    pending: { title: 'حجزك قيد الانتظار', emoji: '⏳' },
  };

  const message = statusMessages[status] || { title: 'تم تحديث حجزك', emoji: '📝' };

  return sendPushNotification(
    userId,
    `${message.emoji} ${message.title}`,
    `رقم الحجز: ${bookingRef}`,
    { bookingRef, status, type: 'booking_updated' }
  );
}

/**
 * إرسال إشعار للمديرين عند دفع جديد
 */
export async function notifyAdminNewPayment(
  adminUserId: string,
  customerEmail: string,
  amount: number,
  currency: string,
  bookingRef: string
): Promise<boolean> {
  return sendPushNotification(
    adminUserId,
    '💳 دفع جديد',
    `تم استقبال دفع من ${customerEmail} - ${amount} ${currency}`,
    { bookingRef, type: 'admin_payment' }
  );
}

/**
 * إرسال إشعار للمديرين عند حجز جديد
 */
export async function notifyAdminNewBooking(
  adminUserId: string,
  customerName: string,
  bookingType: 'flight' | 'hotel' | 'esim',
  amount: number,
  bookingRef: string
): Promise<boolean> {
  const typeLabel = {
    flight: 'رحلة جديدة',
    hotel: 'فندق جديد',
    esim: 'eSIM جديد',
  }[bookingType];

  return sendPushNotification(
    adminUserId,
    `📅 ${typeLabel}`,
    `من ${customerName} - ${amount} MRU`,
    { bookingRef, type: 'admin_booking', bookingType }
  );
}

/**
 * مسح جميع push tokens (للاختبار)
 */
export function clearAllTokens(): void {
  Object.keys(pushTokens).forEach(key => delete pushTokens[key]);
  console.log('[Push] All tokens cleared');
}

/**
 * الحصول على عدد المستخدمين المسجلين
 */
export function getRegisteredUsersCount(): number {
  return Object.keys(pushTokens).length;
}
