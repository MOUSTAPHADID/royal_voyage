import { describe, it, expect } from "vitest";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

describe("SMTP Configuration", () => {
  it("should have EMAIL_USER set", () => {
    const user = process.env.EMAIL_USER;
    expect(user).toBeTruthy();
    expect(user).toContain("@");
  });

  it("should have EMAIL_PASS set", () => {
    const pass = process.env.EMAIL_PASS;
    expect(pass).toBeTruthy();
    expect(pass!.length).toBeGreaterThan(4);
  });
});
