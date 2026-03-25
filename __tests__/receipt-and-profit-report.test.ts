import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

function readSrc(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Payment Receipt Upload Feature", () => {
  const mockData = readSrc("lib/mock-data.ts");
  const appContext = readSrc("lib/app-context.tsx");
  const paymentScreen = readSrc("app/booking/payment.tsx");
  const confirmPayment = readSrc("app/admin/confirm-payment.tsx");

  it("Booking type has receiptImage and receiptImageAt fields", () => {
    expect(mockData).toContain("receiptImage?: string");
    expect(mockData).toContain("receiptImageAt?: string");
  });

  it("AppContext has updateBookingReceipt function in type and provider", () => {
    expect(appContext).toContain("updateBookingReceipt: (id: string, receiptImage: string) => void");
    expect(appContext).toContain("const updateBookingReceipt = useCallback");
    expect(appContext).toContain("updateBookingReceipt,");
  });

  it("Payment screen imports expo-image-picker", () => {
    expect(paymentScreen).toContain('import * as ImagePicker from "expo-image-picker"');
  });

  it("Payment screen has receipt image state", () => {
    expect(paymentScreen).toContain("const [receiptImage, setReceiptImage]");
    expect(paymentScreen).toContain("const [showReceiptPreview, setShowReceiptPreview]");
  });

  it("Payment screen has gallery and camera buttons for receipt upload", () => {
    expect(paymentScreen).toContain("launchImageLibraryAsync");
    expect(paymentScreen).toContain("launchCameraAsync");
    expect(paymentScreen).toContain("requestCameraPermissionsAsync");
    expect(paymentScreen).toContain("من المعرض");
    expect(paymentScreen).toContain("التقاط صورة");
  });

  it("Payment screen includes receiptImage in booking object", () => {
    expect(paymentScreen).toContain("receiptImage");
    expect(paymentScreen).toContain("receiptImageAt");
  });

  it("Payment screen has receipt preview modal", () => {
    expect(paymentScreen).toContain("showReceiptPreview");
    expect(paymentScreen).toContain("previewOverlay");
    expect(paymentScreen).toContain("previewCloseBtn");
  });

  it("Payment screen has receipt upload styles", () => {
    expect(paymentScreen).toContain("uploadBtn");
    expect(paymentScreen).toContain("receiptOverlay");
    expect(paymentScreen).toContain("removeReceiptBtn");
  });

  it("Admin confirm-payment screen shows receipt image", () => {
    expect(confirmPayment).toContain("booking.receiptImage");
    expect(confirmPayment).toContain("إيصال الدفع");
    expect(confirmPayment).toContain("previewReceipt");
    expect(confirmPayment).toContain("receiptBadge");
  });

  it("Admin confirm-payment screen has receipt preview modal", () => {
    expect(confirmPayment).toContain("previewOverlay");
    expect(confirmPayment).toContain("previewCloseBtn");
    expect(confirmPayment).toContain("setPreviewReceipt");
  });

  it("Receipt upload is only shown for non-cash payment methods", () => {
    expect(paymentScreen).toContain('paymentMethod !== "cash"');
  });
});

describe("Profit Report Payment Method Breakdown", () => {
  const profitReport = readSrc("app/admin/profit-report.tsx");

  it("Has payment method config with colors and icons", () => {
    expect(profitReport).toContain("PAYMENT_METHOD_CONFIG");
    expect(profitReport).toContain("bankily");
    expect(profitReport).toContain("masrvi");
    expect(profitReport).toContain("sedad");
    expect(profitReport).toContain("cash");
    expect(profitReport).toContain("bank_transfer");
    expect(profitReport).toContain("paypal");
  });

  it("Calculates payment method statistics", () => {
    expect(profitReport).toContain("paymentMethodStats");
    expect(profitReport).toContain("sortedPaymentMethods");
  });

  it("Renders payment method breakdown section in UI", () => {
    expect(profitReport).toContain("تفصيل حسب طريقة الدفع");
  });

  it("Shows percentage bar for each payment method", () => {
    expect(profitReport).toContain("percentage");
    // Progress bar width based on percentage
    expect(profitReport).toContain("Math.max(percentage, 2)");
  });

  it("PDF export includes payment method breakdown table", () => {
    expect(profitReport).toContain("paymentMethodRows");
    expect(profitReport).toContain("تفصيل الإيرادات حسب طريقة الدفع");
  });

  it("PDF has proper HTML structure with RTL support", () => {
    expect(profitReport).toContain('dir="rtl"');
    expect(profitReport).toContain('lang="ar"');
  });

  it("Shows profit per payment method", () => {
    expect(profitReport).toContain("stats.profit");
    expect(profitReport).toContain("ربح:");
  });
});

describe("Icon Symbol Mappings", () => {
  const iconSymbol = readSrc("components/ui/icon-symbol.tsx");

  it("Has camera and photo icons for receipt upload", () => {
    expect(iconSymbol).toContain('"camera.fill"');
    expect(iconSymbol).toContain('"photo.fill"');
    expect(iconSymbol).toContain('"eye.fill"');
  });
});
