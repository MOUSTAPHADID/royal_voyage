import { describe, it, expect } from "vitest";

describe("Email SMTP Configuration", () => {
  it("should have EMAIL_USER configured", () => {
    const emailUser = process.env.EMAIL_USER;
    expect(emailUser).toBeTruthy();
    expect(emailUser).toContain("@");
    console.log("[Test] EMAIL_USER:", emailUser);
  });

  it("should have EMAIL_PASS configured", () => {
    const emailPass = process.env.EMAIL_PASS;
    expect(emailPass).toBeTruthy();
    expect(emailPass!.length).toBeGreaterThan(4);
    console.log("[Test] EMAIL_PASS is set (length:", emailPass!.length, ")");
  });

  it("EMAIL_USER should have valid domain format", () => {
    const emailUser = process.env.EMAIL_USER ?? "";
    // Check it's a valid email format
    expect(emailUser).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    // Should NOT have typo 'onlne'
    expect(emailUser).not.toContain("onlne");
    console.log("[Test] EMAIL_USER domain is valid:", emailUser.split("@")[1]);
  });
});
