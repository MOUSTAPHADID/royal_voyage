import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Booking Summary Screen", () => {
  const summaryPath = path.join(__dirname, "../app/booking/summary.tsx");

  it("summary.tsx file exists", () => {
    expect(fs.existsSync(summaryPath)).toBe(true);
  });

  it("renders flight and hotel details sections", () => {
    const content = fs.readFileSync(summaryPath, "utf-8");
    expect(content).toContain("تفاصيل الرحلة");
    expect(content).toContain("تفاصيل الفندق");
  });

  it("renders passenger data section", () => {
    const content = fs.readFileSync(summaryPath, "utf-8");
    expect(content).toContain("بيانات المسافر");
    expect(content).toContain("الاسم الكامل");
    expect(content).toContain("البريد الإلكتروني");
  });

  it("renders cost summary with total", () => {
    const content = fs.readFileSync(summaryPath, "utf-8");
    expect(content).toContain("ملخص التكلفة");
    expect(content).toContain("الإجمالي");
  });

  it("has continue to payment button", () => {
    const content = fs.readFileSync(summaryPath, "utf-8");
    expect(content).toContain("المتابعة إلى الدفع");
    expect(content).toContain("/booking/payment");
  });

  it("has edit data button to go back", () => {
    const content = fs.readFileSync(summaryPath, "utf-8");
    expect(content).toContain("تعديل البيانات");
    expect(content).toContain("router.back()");
  });

  it("has warning note about reviewing data", () => {
    const content = fs.readFileSync(summaryPath, "utf-8");
    expect(content).toContain("يرجى مراجعة جميع البيانات بعناية");
  });

  it("passes all params to payment screen", () => {
    const content = fs.readFileSync(summaryPath, "utf-8");
    const requiredParams = [
      "firstName", "lastName", "email", "phone", "passport",
      "nationality", "dateOfBirth", "airline", "flightNumber",
      "origin", "destination", "passengers", "children",
      "hotelName", "checkIn", "checkOut", "roomType",
    ];
    for (const param of requiredParams) {
      expect(content).toContain(param);
    }
  });
});

describe("Passenger Details routes to Payment", () => {
  it("passenger-details.tsx navigates to /booking/payment", () => {
    const pdPath = path.join(__dirname, "../app/booking/passenger-details.tsx");
    const content = fs.readFileSync(pdPath, "utf-8");
    expect(content).toContain("/booking/payment");
  });
});

describe("Payment Timer (15 min countdown)", () => {
  const paymentPath = path.join(__dirname, "../app/booking/payment.tsx");

  it("has timer state and useEffect", () => {
    const content = fs.readFileSync(paymentPath, "utf-8");
    expect(content).toContain("timeLeft");
    expect(content).toContain("setTimeLeft");
    expect(content).toContain("15 * 60"); // TIMER_DURATION = 15 * 60
  });

  it("formats time as MM:SS", () => {
    const content = fs.readFileSync(paymentPath, "utf-8");
    // Should have minutes and seconds formatting
    expect(content).toContain("Math.floor");
    expect(content).toContain("padStart");
  });

  it("shows timer bar in UI", () => {
    const content = fs.readFileSync(paymentPath, "utf-8");
    expect(content).toContain("timerBar");
    expect(content).toContain("timerText");
  });

  it("changes color when time is running low", () => {
    const content = fs.readFileSync(paymentPath, "utf-8");
    // Should have conditional colors for low time
    expect(content).toContain("timeLeft <= 180"); // 3 minutes warning
    expect(content).toContain("timeLeft <= 60"); // 1 minute critical
  });

  it("navigates back when timer expires", () => {
    const content = fs.readFileSync(paymentPath, "utf-8");
    expect(content).toContain("timeLeft <= 0");
  });
});

describe("WhatsApp Confirmation Button", () => {
  const confirmPath = path.join(__dirname, "../app/booking/confirmation.tsx");

  it("has WhatsApp button", () => {
    const content = fs.readFileSync(confirmPath, "utf-8");
    expect(content).toContain("WhatsApp");
    expect(content).toContain("whatsappBtn");
  });

  it("uses wa.me link format", () => {
    const content = fs.readFileSync(confirmPath, "utf-8");
    expect(content).toContain("wa.me");
  });

  it("includes booking details in WhatsApp message", () => {
    const content = fs.readFileSync(confirmPath, "utf-8");
    expect(content).toContain("تأكيد حجز Royal Voyage");
    expect(content).toContain("رقم المرجع");
    expect(content).toContain("المبلغ");
  });

  it("imports Linking for opening WhatsApp", () => {
    const content = fs.readFileSync(confirmPath, "utf-8");
    expect(content).toContain("Linking");
    expect(content).toContain("Linking.openURL");
  });

  it("has green WhatsApp button style", () => {
    const content = fs.readFileSync(confirmPath, "utf-8");
    expect(content).toContain("#25D366"); // WhatsApp green
  });
});
