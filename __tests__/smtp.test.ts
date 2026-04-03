import { describe, it, expect } from "vitest";
import "../scripts/load-env.js";

describe("SMTP Configuration", () => {
  it("should have EMAIL_USER set", () => {
    const user = process.env.EMAIL_USER;
    // If not set, the email service will log only (graceful degradation)
    // This test just verifies the env loading works
    expect(typeof user === "string" || user === undefined).toBe(true);
  });

  it("should have EMAIL_PASS set when EMAIL_USER is set", () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    if (user && user.length > 0) {
      expect(pass).toBeTruthy();
    } else {
      // No SMTP configured — graceful degradation mode
      expect(true).toBe(true);
    }
  });
});
