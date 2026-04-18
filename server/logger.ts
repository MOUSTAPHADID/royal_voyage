import * as fs from "fs";
import * as path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: any;
  error?: string;
}

class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private formatLog(level: LogLevel, message: string, data?: any, error?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      data,
      error: error?.message || error?.toString(),
    };
  }

  private writeLog(entry: LogEntry) {
    const logFile = path.join(LOG_DIR, `${this.service}.log`);
    const logLine = JSON.stringify(entry) + "\n";

    fs.appendFileSync(logFile, logLine, "utf-8");

    // Also log to console in development
    if (process.env.NODE_ENV !== "production") {
      const prefix = `[${entry.level.toUpperCase()}] ${entry.service}`;
      console.log(`${prefix}: ${entry.message}`, entry.data || "");
    }
  }

  info(message: string, data?: any) {
    this.writeLog(this.formatLog("info", message, data));
  }

  warn(message: string, data?: any) {
    this.writeLog(this.formatLog("warn", message, data));
  }

  error(message: string, error?: any, data?: any) {
    this.writeLog(this.formatLog("error", message, data, error));
  }

  debug(message: string, data?: any) {
    if (process.env.DEBUG === "true") {
      this.writeLog(this.formatLog("debug", message, data));
    }
  }
}

// Export logger instances for different services
export const apiLogger = new Logger("api");
export const webhookLogger = new Logger("webhook");
export const paymentLogger = new Logger("payment");
export const esimLogger = new Logger("esim");
export const authLogger = new Logger("auth");
export const dbLogger = new Logger("db");

export default Logger;
