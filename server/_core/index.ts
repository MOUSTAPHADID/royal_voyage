import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerWebhookRoutes } from "../duffel-webhooks";
import { constructWebhookEvent, isStripeWebhookConfigured } from "../stripe";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { buildCheckoutPage, buildSuccessPage } from "./paypal-pages";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);
  registerWebhookRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // PayPal Hosted Button payment page
  app.get("/api/paypal-checkout", (req, res) => {
    const amount = String(req.query.amount || "0");
    const currency = String(req.query.currency || "EUR");
    const booking = String(req.query.booking || "");
    const name = String(req.query.name || "");
    const scheme = String(req.query.scheme || "manus20260323015034");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildCheckoutPage({ amount, currency, booking, name, scheme }));
  });

  // PayPal Success page
  app.get("/api/paypal-success", (req, res) => {
    const tx = String(req.query.tx || "N/A");
    const amount = String(req.query.amount || "0");
    const currency = String(req.query.currency || "EUR");
    const name = String(req.query.name || "");
    const scheme = String(req.query.scheme || "manus20260323015034");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildSuccessPage({ tx, amount, currency, name, scheme }));
  });

  // ── Stripe Webhook ──────────────────────────────────────────────────
  // Must use raw body for signature verification
  app.post("/api/stripe-webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    // Use env var first, fall back to hardcoded value if not set
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_7g59fzyKXA7lfayC0FsLLQAR7jJIZUs2";

    if (!sig) {
      console.warn("[Stripe Webhook] Missing stripe-signature header");
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    let event;
    try {
      event = constructWebhookEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    console.log(`[Stripe Webhook] Event: ${event.type}`);

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as any;
      const bookingRef = pi.metadata?.bookingRef || pi.metadata?.booking || "";
      const notification = {
        id: pi.id,
        type: "stripe_payment_succeeded",
        paymentIntentId: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        bookingRef,
        metadata: pi.metadata,
        timestamp: new Date().toISOString(),
      };
      if (!(global as any)._stripeNotifications) (global as any)._stripeNotifications = [];
      (global as any)._stripeNotifications.unshift(notification);
      if ((global as any)._stripeNotifications.length > 100) {
        (global as any)._stripeNotifications.length = 100;
      }
      console.log(`[Stripe Webhook] Payment succeeded for booking: ${bookingRef}, amount: ${pi.amount} ${pi.currency}`);
    }

    res.json({ received: true });
  });

  // Admin endpoint to get Stripe notifications
  app.get("/api/stripe-notifications", (_req, res) => {
    res.json({ notifications: (global as any)._stripeNotifications || [] });
  });

  // PayPal payment notification endpoint with validation
  app.post("/api/paypal-notify", async (req, res) => {
    const { txId, amount, currency, name, booking } = req.body || {};
    console.log(`[PayPal] Payment received: TX=${txId}, Amount=${amount} ${currency}, Name=${name}, Booking=${booking}`);

    // Validate required fields
    let verified = false;
    let verificationNote = "";
    if (!txId || txId === "N/A") {
      verificationNote = "Missing transaction ID";
    } else {
      // Attempt to verify via PayPal Orders API (if access token available)
      try {
        const clientId = "BAAe3HWztSL3qmFxXI2nVSKirPWH_KJhAUyU9OPRnVTQZ8kmmdeF5u2yYJkIYGlqBhOnQvyxhDpFF9qI90";
        const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        if (clientSecret) {
          // Get access token
          const authRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
            method: "POST",
            headers: {
              "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
          });
          if (authRes.ok) {
            const authData = await authRes.json() as { access_token: string };
            // Check order status
            const orderRes = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${txId}`, {
              headers: { "Authorization": `Bearer ${authData.access_token}` },
            });
            if (orderRes.ok) {
              const orderData = await orderRes.json() as { status: string };
              verified = orderData.status === "COMPLETED" || orderData.status === "APPROVED";
              verificationNote = `PayPal status: ${orderData.status}`;
              console.log(`[PayPal] Verification: ${verificationNote}`);
            } else {
              verificationNote = "Could not verify order - API error";
            }
          }
        } else {
          // No secret configured - mark as unverified but still record
          verificationNote = "PayPal secret not configured - manual verification needed";
        }
      } catch (err) {
        verificationNote = "Verification failed - network error";
        console.warn("[PayPal] Verification error:", err);
      }
    }

    const notification = {
      id: Date.now().toString(),
      type: "paypal_payment",
      txId,
      amount,
      currency,
      name,
      booking,
      verified,
      verificationNote,
      timestamp: new Date().toISOString(),
    };
    if (!(global as any)._paypalNotifications) (global as any)._paypalNotifications = [];
    (global as any)._paypalNotifications.unshift(notification);
    if ((global as any)._paypalNotifications.length > 100) {
      (global as any)._paypalNotifications.length = 100;
    }
    res.json({ ok: true, verified, notification });
  });

  // Admin endpoint to get PayPal notifications
  app.get("/api/paypal-notifications", (_req, res) => {
    res.json({ notifications: (global as any)._paypalNotifications || [] });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Serve static web build
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const webDistPath = path.join(__dirname, "../../web-dist");
  app.use(express.static(webDistPath));

  // SPA fallback — serve index.html for all non-API routes
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(webDistPath, "index.html"));
    }
  });

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
