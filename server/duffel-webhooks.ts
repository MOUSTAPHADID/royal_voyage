/**
 * Royal Service — Duffel Webhooks Handler
 * Receives and processes webhook events from Duffel API.
 * Handles: order creation, cancellation, airline changes, payment events.
 */
import crypto from "crypto";
import type { Express, Request, Response } from "express";
import { getBookingContactByOrderId } from "./db";
import { sendPnrUpdateEmail, sendCancellationEmail } from "./email";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DuffelWebhookEvent {
  id: string;
  api_version: string;
  type: string;
  data: { object: Record<string, any> } | null;
  live_mode: boolean;
  idempotency_key: string;
  created_at: string;
  identity_organisation_id?: string;
}

export type WebhookEventType =
  | "order.created"
  | "order.creation_failed"
  | "order.airline_initiated_change_detected"
  | "air.order.changed"
  | "order_cancellation.created"
  | "order_cancellation.confirmed"
  | "air.payment.failed"
  | "air.payment.succeeded"
  | "air.payment.cancelled"
  | "air.payment.pending"
  | "air.airline_credit.created"
  | "air.airline_credit.spent"
  | "air.airline_credit.invalidated"
  | "ping.triggered";

// ─── In-memory event log (last 200 events) ─────────────────────────────────

interface WebhookLogEntry {
  id: string;
  type: string;
  idempotency_key: string;
  received_at: string;
  live_mode: boolean;
  processed: boolean;
  action_taken: string;
  data_summary: string;
}

const webhookLog: WebhookLogEntry[] = [];
const MAX_LOG_SIZE = 200;
const processedKeys = new Set<string>();

export function getWebhookLog(): WebhookLogEntry[] {
  return webhookLog;
}

// ─── Signature Verification ─────────────────────────────────────────────────

function verifyDuffelSignature(
  rawBody: Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    // Format: t=TIMESTAMP,v1=SIGNATURE
    const pairs = signatureHeader.split(",").map((p) => p.split("="));
    const timestamp = pairs[0]?.[1];
    const v1 = pairs[1]?.[1];

    if (!timestamp || !v1) return false;

    // Recreate the signature
    const signedPayload = Buffer.concat([
      Buffer.from(timestamp),
      Buffer.from("."),
      rawBody,
    ]);

    const expectedSignature = crypto
      .createHmac("sha256", Buffer.from(secret))
      .update(signedPayload)
      .digest("hex");

    // Secure comparison
    return crypto.timingSafeEqual(
      Buffer.from(v1),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error("[Webhook] Signature verification error:", err);
    return false;
  }
}

// ─── Event Handlers ─────────────────────────────────────────────────────────

async function handleOrderCreated(event: DuffelWebhookEvent): Promise<string> {
  const order = event.data?.object;
  if (!order) return "No order data";

  const orderId = order.id || "unknown";
  const bookingRef = order.booking_reference || "N/A";
  const passengers = order.passengers?.map((p: any) => `${p.given_name} ${p.family_name}`).join(", ") || "N/A";

  console.log(`[Webhook] ✅ Order created: ${orderId}, PNR: ${bookingRef}, Passengers: ${passengers}`);

  // Store in global notifications for admin panel
  addNotification({
    type: "order_created",
    title: "حجز جديد تم إنشاؤه",
    message: `تم إنشاء حجز جديد برقم PNR: ${bookingRef} للمسافرين: ${passengers}`,
    orderId,
    bookingRef,
    timestamp: new Date().toISOString(),
  });

  return `Order created: ${orderId}, PNR: ${bookingRef}`;
}

async function handleOrderCancellationConfirmed(event: DuffelWebhookEvent): Promise<string> {
  const cancellation = event.data?.object;
  if (!cancellation) return "No cancellation data";

  const orderId = cancellation.order_id || cancellation.id || "unknown";
  const refundAmount = cancellation.refund_amount || "N/A";
  const refundCurrency = cancellation.refund_currency || "";

  console.log(`[Webhook] ❌ Order cancellation confirmed: ${orderId}, Refund: ${refundAmount} ${refundCurrency}`);

  addNotification({
    type: "order_cancelled",
    title: "تأكيد إلغاء الحجز",
    message: `تم تأكيد إلغاء الحجز ${orderId}. المبلغ المسترد: ${refundAmount} ${refundCurrency}`,
    orderId,
    timestamp: new Date().toISOString(),
  });

  // Send cancellation email to customer
  try {
    const contact = await getBookingContactByOrderId(orderId);
    if (contact?.passengerEmail) {
      await sendCancellationEmail({
        passengerEmail: contact.passengerEmail,
        passengerName: contact.passengerName,
        bookingRef: contact.bookingRef,
        pnr: contact.pnr || undefined,
        routeSummary: contact.routeSummary || undefined,
        refundAmount: String(refundAmount),
        refundCurrency: refundCurrency || undefined,
      } as any);
      console.log(`[Webhook] ✉️ Cancellation email sent to ${contact.passengerEmail}`);
    } else {
      console.log(`[Webhook] No email found for order ${orderId} - skipping cancellation email`);
    }
  } catch (emailErr) {
    console.error(`[Webhook] Failed to send cancellation email:`, emailErr);
  }

  return `Cancellation confirmed: ${orderId}`;
}

async function handleAirlineChange(event: DuffelWebhookEvent): Promise<string> {
  const change = event.data?.object;
  if (!change) return "No change data";

  const orderId = change.order_id || change.id || "unknown";

  console.log(`[Webhook] ✈️ Airline initiated change detected for order: ${orderId}`);

  addNotification({
    type: "airline_change",
    title: "⚠️ تغيير من شركة الطيران",
    message: `شركة الطيران أجرت تغييراً على الحجز ${orderId}. يرجى مراجعة التفاصيل واتخاذ الإجراء المناسب.`,
    orderId,
    timestamp: new Date().toISOString(),
    urgent: true,
  });

  // Send email notification to customer
  try {
    const contact = await getBookingContactByOrderId(orderId);
    if (contact?.passengerEmail) {
      const changeDetails = change.changes?.map((c: any) => {
        const sliceChanges = c.slices?.updated?.map((s: any) => {
          const seg = s.segments?.[0];
          return seg ? `${seg.origin?.iata_code || ''} → ${seg.destination?.iata_code || ''} (${seg.departing_at || 'TBD'})` : '';
        }).filter(Boolean).join(', ') || 'تغيير في تفاصيل الرحلة';
        return sliceChanges;
      }).join(' | ') || 'تغيير في تفاصيل الرحلة';

      await sendPnrUpdateEmail({
        passengerName: contact.passengerName,
        passengerEmail: contact.passengerEmail,
        bookingRef: contact.bookingRef,
        pnr: contact.pnr || 'N/A',
      });
      console.log(`[Webhook] ✉️ Airline change email sent to ${contact.passengerEmail}`);
    } else {
      console.log(`[Webhook] No email found for order ${orderId} - skipping email notification`);
    }
  } catch (emailErr) {
    console.error(`[Webhook] Failed to send airline change email:`, emailErr);
  }

  return `Airline change detected: ${orderId}`;
}

async function handleOrderChanged(event: DuffelWebhookEvent): Promise<string> {
  const order = event.data?.object;
  if (!order) return "No order data";

  const orderId = order.id || "unknown";
  console.log(`[Webhook] 🔄 Order changed: ${orderId}`);

  addNotification({
    type: "order_changed",
    title: "تحديث على الحجز",
    message: `تم تحديث الحجز ${orderId}. يرجى مراجعة التفاصيل.`,
    orderId,
    timestamp: new Date().toISOString(),
  });

  return `Order changed: ${orderId}`;
}

async function handlePaymentEvent(event: DuffelWebhookEvent): Promise<string> {
  const payment = event.data?.object;
  if (!payment) return "No payment data";

  const paymentId = payment.id || "unknown";
  const status = event.type.split(".").pop() || "unknown";

  console.log(`[Webhook] 💳 Payment ${status}: ${paymentId}`);

  const statusMap: Record<string, string> = {
    succeeded: "✅ نجح الدفع",
    failed: "❌ فشل الدفع",
    cancelled: "🚫 تم إلغاء الدفع",
    pending: "⏳ الدفع قيد المعالجة",
  };

  addNotification({
    type: `payment_${status}`,
    title: statusMap[status] || `حالة الدفع: ${status}`,
    message: `الدفع ${paymentId}: ${statusMap[status] || status}`,
    timestamp: new Date().toISOString(),
    urgent: status === "failed",
  });

  return `Payment ${status}: ${paymentId}`;
}

async function handleOrderCreationFailed(event: DuffelWebhookEvent): Promise<string> {
  const data = event.data?.object;
  const orderId = data?.id || event.idempotency_key || "unknown";

  console.log(`[Webhook] ⚠️ Order creation failed: ${orderId}`);

  addNotification({
    type: "order_creation_failed",
    title: "⚠️ فشل إنشاء الحجز",
    message: `فشل إنشاء الحجز ${orderId}. يرجى المراجعة.`,
    orderId,
    timestamp: new Date().toISOString(),
    urgent: true,
  });

  return `Order creation failed: ${orderId}`;
}

async function handleCancellationCreated(event: DuffelWebhookEvent): Promise<string> {
  const cancellation = event.data?.object;
  const orderId = cancellation?.order_id || cancellation?.id || "unknown";

  console.log(`[Webhook] 🔄 Cancellation request created for order: ${orderId}`);

  addNotification({
    type: "cancellation_created",
    title: "طلب إلغاء جديد",
    message: `تم إنشاء طلب إلغاء للحجز ${orderId}. في انتظار التأكيد من شركة الطيران.`,
    orderId,
    timestamp: new Date().toISOString(),
  });

  return `Cancellation created: ${orderId}`;
}

// ─── Notification Storage ───────────────────────────────────────────────────

interface WebhookNotification {
  type: string;
  title: string;
  message: string;
  orderId?: string;
  bookingRef?: string;
  timestamp: string;
  urgent?: boolean;
}

const webhookNotifications: WebhookNotification[] = [];
const MAX_NOTIFICATIONS = 100;

function addNotification(notif: WebhookNotification) {
  webhookNotifications.unshift(notif);
  if (webhookNotifications.length > MAX_NOTIFICATIONS) {
    webhookNotifications.length = MAX_NOTIFICATIONS;
  }
}

export function getWebhookNotifications(): WebhookNotification[] {
  return webhookNotifications;
}

export function clearWebhookNotifications(): void {
  webhookNotifications.length = 0;
}

// ─── Main Event Router ──────────────────────────────────────────────────────

async function processWebhookEvent(event: DuffelWebhookEvent): Promise<string> {
  switch (event.type) {
    case "order.created":
      return handleOrderCreated(event);
    case "order.creation_failed":
      return handleOrderCreationFailed(event);
    case "order.airline_initiated_change_detected":
      return handleAirlineChange(event);
    case "air.order.changed":
      return handleOrderChanged(event);
    case "order_cancellation.created":
      return handleCancellationCreated(event);
    case "order_cancellation.confirmed":
      return handleOrderCancellationConfirmed(event);
    case "air.payment.failed":
    case "air.payment.succeeded":
    case "air.payment.cancelled":
    case "air.payment.pending":
      return handlePaymentEvent(event);
    case "ping.triggered":
      console.log("[Webhook] 🏓 Ping received");
      return "Pong";
    default:
      console.log(`[Webhook] ℹ️ Unhandled event type: ${event.type}`);
      return `Unhandled: ${event.type}`;
  }
}

// ─── Register Express Routes ────────────────────────────────────────────────

export function registerWebhookRoutes(app: Express) {
  const WEBHOOK_SECRET = process.env.DUFFEL_WEBHOOK_SECRET || "";

  // Main webhook receiver endpoint
  // Uses express.raw() to get raw body for signature verification
  app.post(
    "/api/webhooks/duffel",
    // We need raw body for signature verification, but express.json() already parsed it
    // So we re-serialize or use a separate raw body capture
    async (req: Request, res: Response) => {
      try {
        const event = req.body as DuffelWebhookEvent;

        // Verify signature if secret is configured
        if (WEBHOOK_SECRET) {
          const signatureHeader = req.headers["x-duffel-signature"] as string;
          if (!signatureHeader) {
            console.warn("[Webhook] ⚠️ Missing X-Duffel-Signature header");
            res.status(401).json({ error: "Missing signature" });
            return;
          }

          // Get raw body for verification
          const rawBody = Buffer.from(JSON.stringify(req.body));
          const isValid = verifyDuffelSignature(rawBody, signatureHeader, WEBHOOK_SECRET);
          if (!isValid) {
            console.warn("[Webhook] ⚠️ Invalid signature");
            res.status(401).json({ error: "Invalid signature" });
            return;
          }
        }

        if (!event || !event.type) {
          console.warn("[Webhook] ⚠️ Invalid event payload");
          res.status(400).json({ error: "Invalid payload" });
          return;
        }

        // Idempotency check
        if (event.idempotency_key && processedKeys.has(event.idempotency_key)) {
          console.log(`[Webhook] ℹ️ Duplicate event skipped: ${event.idempotency_key}`);
          res.status(200).json({ success: true, message: "Already processed" });
          return;
        }

        console.log(`[Webhook] 📥 Received event: ${event.type} (${event.id})`);

        // Process the event
        const actionTaken = await processWebhookEvent(event);

        // Mark as processed
        if (event.idempotency_key) {
          processedKeys.add(event.idempotency_key);
          // Limit set size
          if (processedKeys.size > 1000) {
            const keys = Array.from(processedKeys);
            processedKeys.clear();
            keys.slice(-500).forEach((k) => processedKeys.add(k));
          }
        }

        // Log the event
        webhookLog.unshift({
          id: event.id,
          type: event.type,
          idempotency_key: event.idempotency_key,
          received_at: new Date().toISOString(),
          live_mode: event.live_mode,
          processed: true,
          action_taken: actionTaken,
          data_summary: event.data?.object
            ? JSON.stringify(event.data.object).substring(0, 200)
            : "No data",
        });
        if (webhookLog.length > MAX_LOG_SIZE) {
          webhookLog.length = MAX_LOG_SIZE;
        }

        res.status(200).json({ success: true });
      } catch (err) {
        console.error("[Webhook] ❌ Error processing webhook:", err);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  console.log("[Webhook] 📡 Duffel webhook endpoint registered at /api/webhooks/duffel");
}

// ─── Duffel Webhook Management API ──────────────────────────────────────────

const DUFFEL_TOKEN = process.env.DUFFEL_API_TOKEN || "";
const DUFFEL_BASE = "https://api.duffel.com";

export async function createDuffelWebhook(url: string, events: string[]): Promise<any> {
  const res = await fetch(`${DUFFEL_BASE}/air/webhooks`, {
    method: "POST",
    headers: {
      "Accept-Encoding": "gzip",
      Accept: "application/json",
      "Content-Type": "application/json",
      "Duffel-Version": "v2",
      Authorization: `Bearer ${DUFFEL_TOKEN}`,
    },
    body: JSON.stringify({
      data: { url, events },
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Failed to create webhook: ${res.status} ${JSON.stringify(errBody)}`);
  }

  return res.json();
}

export async function listDuffelWebhooks(): Promise<any> {
  const res = await fetch(`${DUFFEL_BASE}/air/webhooks`, {
    method: "GET",
    headers: {
      "Accept-Encoding": "gzip",
      Accept: "application/json",
      "Duffel-Version": "v2",
      Authorization: `Bearer ${DUFFEL_TOKEN}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Failed to list webhooks: ${res.status} ${JSON.stringify(errBody)}`);
  }

  return res.json();
}

export async function deleteDuffelWebhook(webhookId: string): Promise<void> {
  const res = await fetch(`${DUFFEL_BASE}/air/webhooks/${webhookId}`, {
    method: "DELETE",
    headers: {
      "Accept-Encoding": "gzip",
      Accept: "application/json",
      "Duffel-Version": "v2",
      Authorization: `Bearer ${DUFFEL_TOKEN}`,
    },
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Failed to delete webhook: ${res.status} ${JSON.stringify(errBody)}`);
  }
}

export async function pingDuffelWebhook(webhookId: string): Promise<void> {
  const res = await fetch(`${DUFFEL_BASE}/air/webhooks/id/${webhookId}/actions/ping`, {
    method: "POST",
    headers: {
      "Accept-Encoding": "gzip",
      Accept: "application/json",
      "Content-Type": "application/json",
      "Duffel-Version": "v2",
      Authorization: `Bearer ${DUFFEL_TOKEN}`,
    },
    body: "{}",
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Failed to ping webhook: ${res.status} ${JSON.stringify(errBody)}`);
  }
}
