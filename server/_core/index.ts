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
    const amount = req.query.amount || "0";
    const currency = req.query.currency || "EUR";
    const booking = req.query.booking || "";
    const name = req.query.name || "";

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Royal Voyage - \u0627\u0644\u062f\u0641\u0639 \u0639\u0628\u0631 PayPal</title>
  <script src="https://www.paypal.com/sdk/js?client-id=BAAe3HWztSL3qmFxXI2nVSKirPWH_KJhAUyU9OPRnVTQZ8kmmdeF5u2yYJkIYGlqBhOnQvyxhDpFF9qI90&components=hosted-buttons&disable-funding=venmo&currency=${currency}"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #001f4d 0%, #003087 50%, #0070ba 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .logo {
      text-align: center;
      margin-bottom: 20px;
    }
    .logo h1 {
      font-size: 22px;
      color: #003087;
      margin-bottom: 4px;
    }
    .logo p {
      font-size: 13px;
      color: #687076;
    }
    .divider {
      height: 1px;
      background: #E5E7EB;
      margin: 16px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      font-size: 15px;
      color: #333;
    }
    .info-row .label {
      color: #687076;
      font-size: 13px;
    }
    .info-row .value {
      font-weight: 600;
      color: #11181C;
    }
    .amount-box {
      background: #f0f7ff;
      border: 2px solid #003087;
      border-radius: 14px;
      padding: 16px;
      text-align: center;
      margin: 16px 0;
    }
    .amount-box .amount {
      font-size: 32px;
      font-weight: 800;
      color: #003087;
    }
    .amount-box .currency-label {
      font-size: 13px;
      color: #687076;
      margin-top: 4px;
    }
    #paypal-container-HS2AES3UYJHQA {
      margin-top: 20px;
      min-height: 150px;
    }
    .secure-note {
      text-align: center;
      font-size: 11px;
      color: #9BA1A6;
      margin-top: 16px;
    }
    .secure-note span {
      color: #22C55E;
    }
    .back-link {
      display: block;
      text-align: center;
      margin-top: 16px;
      color: #003087;
      font-size: 14px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <h1>\u2708\uFE0F Royal Voyage</h1>
      <p>\u0627\u0644\u062f\u0641\u0639 \u0627\u0644\u0622\u0645\u0646 \u0639\u0628\u0631 PayPal</p>
    </div>
    <div class="divider"></div>
    ${name ? '<div class="info-row"><span class="label">\u0627\u0644\u0627\u0633\u0645</span><span class="value">' + name + '</span></div>' : ""}
    ${booking ? '<div class="info-row"><span class="label">\u0631\u0642\u0645 \u0627\u0644\u062d\u062c\u0632</span><span class="value">' + booking + '</span></div>' : ""}
    <div class="amount-box">
      <div class="amount">${amount} ${currency}</div>
      <div class="currency-label">\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0637\u0644\u0648\u0628</div>
    </div>
    <div id="paypal-container-HS2AES3UYJHQA"></div>
    <script>
      paypal.HostedButtons({
        hostedButtonId: "HS2AES3UYJHQA",
      }).render("#paypal-container-HS2AES3UYJHQA");
    </script>
    <div class="secure-note">
      <span>&#x1F512;</span> دفع آمن عبر PayPal - لا نحفظ بيانات بطاقتك
    </div>
  </div>
</body>
</html>`);
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
