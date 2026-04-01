import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("PDF Ticket Generator", () => {
  const filePath = path.resolve(__dirname, "../lib/pdf-ticket-generator.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  it("should export shareFlightTicketPDF function", () => {
    expect(content).toContain("export async function shareFlightTicketPDF");
  });

  it("should export shareHotelVoucherPDF function", () => {
    expect(content).toContain("export async function shareHotelVoucherPDF");
  });

  it("should use expo-print for PDF generation", () => {
    expect(content).toContain('import * as Print from "expo-print"');
    expect(content).toContain("Print.printToFileAsync");
  });

  it("should use expo-sharing for file sharing", () => {
    expect(content).toContain('import { shareAsync } from "expo-sharing"');
    expect(content).toContain("shareAsync(uri");
  });

  it("should set correct PDF mimeType", () => {
    expect(content).toContain('mimeType: "application/pdf"');
  });

  it("should include COMPANY_INFO in the HTML", () => {
    expect(content).toContain("COMPANY_INFO.name");
    expect(content).toContain("COMPANY_INFO.phone");
    expect(content).toContain("COMPANY_INFO.email");
    expect(content).toContain("COMPANY_INFO.address");
  });

  it("should generate branded flight ticket HTML with Royal Service header", () => {
    expect(content).toContain("ROYAL VOYAGE");
    expect(content).toContain("ELECTRONIC TICKET / BOARDING PASS");
  });

  it("should generate hotel voucher HTML with Royal Service header", () => {
    expect(content).toContain("HOTEL RESERVATION VOUCHER");
  });

  it("should include passenger details in flight ticket", () => {
    expect(content).toContain("data.passengerName");
    expect(content).toContain("data.passportNumber");
    expect(content).toContain("data.nationality");
  });

  it("should include flight details in ticket", () => {
    expect(content).toContain("data.flightNumber");
    expect(content).toContain("data.originCode");
    expect(content).toContain("data.destinationCode");
    expect(content).toContain("data.departureTime");
    expect(content).toContain("data.arrivalTime");
  });

  it("should include seat and boarding info when available", () => {
    expect(content).toContain("data.seatNumber");
    expect(content).toContain("data.boardingGroup");
    expect(content).toContain("data.meal");
  });

  it("should include price section", () => {
    expect(content).toContain("TOTAL AMOUNT PAID");
    expect(content).toContain("data.totalPrice");
  });

  it("should have WhatsApp fallback using text", () => {
    expect(content).toContain("https://wa.me/?text=");
  });

  it("should export FlightPDFData interface", () => {
    expect(content).toContain("export interface FlightPDFData");
  });

  it("should export HotelPDFData interface", () => {
    expect(content).toContain("export interface HotelPDFData");
  });
});

describe("Booking Detail - PDF WhatsApp buttons", () => {
  const filePath = path.resolve(__dirname, "../app/booking/detail.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("should import shareFlightTicketPDF and shareHotelVoucherPDF", () => {
    expect(content).toContain("shareFlightTicketPDF");
    expect(content).toContain("shareHotelVoucherPDF");
  });

  it("should have PDF WhatsApp button", () => {
    expect(content).toContain("Send Ticket PDF via WhatsApp");
  });

  it("should have general PDF share button", () => {
    expect(content).toContain("Share Ticket PDF (general)");
  });

  it("should check Platform.OS for native-only features", () => {
    expect(content).toContain('Platform.OS !== "web"');
  });
});

describe("Direct Payment Flow - passenger-details goes to payment", () => {
  const filePath = path.resolve(__dirname, "../app/booking/passenger-details.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("should navigate directly to payment screen", () => {
    expect(content).toContain('pathname: "/booking/payment"');
  });

  it("should NOT navigate to summary screen", () => {
    expect(content).not.toContain('pathname: "/booking/summary"');
  });

  it("should pass all required params to payment", () => {
    expect(content).toContain("firstName");
    expect(content).toContain("lastName");
    expect(content).toContain("email");
    expect(content).toContain("phone");
    expect(content).toContain("passport");
    expect(content).toContain("nationality");
    expect(content).toContain("dateOfBirth");
    expect(content).toContain("price:");
  });
});
