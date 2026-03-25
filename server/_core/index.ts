import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
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

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // PayPal Hosted Button payment page
  app.get("/api/paypal-checkout", (req, res) => {
    const amount = String(req.query.amount || "0");
    const currency = String(req.query.currency || "EUR");
    const booking = String(req.query.booking || "");
    const name = String(req.query.name || "");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildCheckoutPage({ amount, currency, booking, name }));
  });

  // PayPal Success page
  app.get("/api/paypal-success", (req, res) => {
    const tx = String(req.query.tx || "N/A");
    const amount = String(req.query.amount || "0");
    const currency = String(req.query.currency || "EUR");
    const name = String(req.query.name || "");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(buildSuccessPage({ tx, amount, currency, name }));
  });

  // PayPal payment notification endpoint
  app.post("/api/paypal-notify", (req, res) => {
    const { txId, amount, currency, name, booking } = req.body || {};
    console.log(`[PayPal] Payment received: TX=${txId}, Amount=${amount} ${currency}, Name=${name}, Booking=${booking}`);
    const notification = {
      id: Date.now().toString(),
      type: "paypal_payment",
      txId,
      amount,
      currency,
      name,
      booking,
      timestamp: new Date().toISOString(),
    };
    if (!(global as any)._paypalNotifications) (global as any)._paypalNotifications = [];
    (global as any)._paypalNotifications.unshift(notification);
    if ((global as any)._paypalNotifications.length > 100) {
      (global as any)._paypalNotifications.length = 100;
    }
    res.json({ ok: true, notification });
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
