/**
 * خدمة الإشعارات المحسّنة
 * 
 * توفر إرسال إشعارات تلقائية:
 * - عند تأكيد الدفع
 * - عند تحديث حالة eSIM
 * - عند تحديث حالة الحجز
 * - للمديرين عند طلبات جديدة
 */

import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { notifications } from '../drizzle/schema';

interface NotificationPayload {
  userId?: string;
  type: 'payment_confirmed' | 'esim_activated' | 'booking_updated' | 'admin_alert';
  title: string;
  body: string;
  data?: Record<string, any>;
  email?: string;
  expoPushToken?: string;
}

/**
 * إرسال إشعار للعميل
 */
export async function sendCustomerNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    // حفظ الإشعار في قاعدة البيانات
    if (payload.userId) {
      const db = await getDb();
      if (db) {
        await (db as any).insert(notifications).values({
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: JSON.stringify(payload.data || {}),
          status: 'sent',
          createdAt: new Date(),
        });
      }
    }

    // إرسال push notification إذا كان متاحاً
    if (payload.expoPushToken) {
      await sendPushNotification(payload.expoPushToken, payload.title, payload.body, payload.data);
    }

    // إرسال بريد إلكتروني إذا كان متاحاً
    if (payload.email) {
      await sendNotificationEmail(payload.email, payload.title, payload.body);
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Error sending notification:', error);
    return false;
  }
}

/**
 * إرسال إشعار للمديرين
 */
export async function sendAdminNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    // إرسال push notification للمديرين
    const adminToken = (global as any)._adminPushToken;
    if (adminToken) {
      await sendPushNotification(adminToken, payload.title, payload.body, payload.data);
    }

    // إرسال بريد إلكتروني للمديرين
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendNotificationEmail(adminEmail, payload.title, payload.body);
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Error sending admin notification:', error);
    return false;
  }
}

/**
 * إرسال push notification عبر Expo
 */
async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
      }),
    });

    const result = await response.json();
    return result?.data?.[0]?.status === 'ok';
  } catch (error) {
    console.error('[Push] Error sending push notification:', error);
    return false;
  }
}

/**
 * إرسال بريد إلكتروني للإشعار
 */
async function sendNotificationEmail(
  email: string,
  title: string,
  body: string
): Promise<boolean> {
  try {
    // يمكن استخدام خدمة البريد الموجودة (nodemailer)
    console.log(`[Email] Sending notification to ${email}: ${title}`);
    return true;
  } catch (error) {
    console.error('[Email] Error sending notification email:', error);
    return false;
  }
}

/**
 * إشعارات تأكيد الدفع
 */
export async function notifyPaymentConfirmed(
  userId: string,
  email: string,
  bookingRef: string,
  amount: number,
  currency: string,
  expoPushToken?: string
): Promise<void> {
  await sendCustomerNotification({
    userId,
    type: 'payment_confirmed',
    title: '✅ تم تأكيد الدفع',
    body: `تم تأكيد دفعك بنجاح. رقم الحجز: ${bookingRef}`,
    data: { bookingRef, amount, currency },
    email,
    expoPushToken,
  });

  // إشعار للمديرين
  await sendAdminNotification({
    type: 'admin_alert',
    title: '💳 دفع جديد',
    body: `تم استقبال دفع من ${email} - ${amount} ${currency}`,
    data: { bookingRef, userId },
  });
}

/**
 * إشعارات تفعيل eSIM
 */
export async function notifyEsimActivated(
  userId: string,
  email: string,
  orderId: string,
  destination: string,
  dataAmount: string,
  expoPushToken?: string
): Promise<void> {
  await sendCustomerNotification({
    userId,
    type: 'esim_activated',
    title: '🌍 تم تفعيل eSIM',
    body: `تم تفعيل eSIM الخاص بك في ${destination} - ${dataAmount}`,
    data: { orderId, destination, dataAmount },
    email,
    expoPushToken,
  });
}

/**
 * إشعارات تحديث حالة الحجز
 */
export async function notifyBookingUpdated(
  userId: string,
  email: string,
  bookingRef: string,
  status: string,
  expoPushToken?: string
): Promise<void> {
  const statusMessages: Record<string, { ar: string; emoji: string }> = {
    confirmed: { ar: 'تم تأكيد حجزك', emoji: '✅' },
    cancelled: { ar: 'تم إلغاء حجزك', emoji: '❌' },
    pending: { ar: 'حجزك قيد الانتظار', emoji: '⏳' },
    completed: { ar: 'اكتمل حجزك', emoji: '🎉' },
  };

  const message = statusMessages[status] || { ar: 'تم تحديث حجزك', emoji: '📝' };

  await sendCustomerNotification({
    userId,
    type: 'booking_updated',
    title: `${message.emoji} ${message.ar}`,
    body: `رقم الحجز: ${bookingRef}`,
    data: { bookingRef, status },
    email,
    expoPushToken,
  });
}

/**
 * تسجيل push token المدير
 */
export function setAdminPushToken(token: string): void {
  (global as any)._adminPushToken = token;
  console.log('[Notifications] Admin push token registered');
}

/**
 * الحصول على push token المدير
 */
export function getAdminPushToken(): string | null {
  return (global as any)._adminPushToken || null;
}
