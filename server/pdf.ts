/**
 * Royal Voyage — PDF Ticket Generator
 * Generates professional PDF tickets for flights and hotel bookings.
 * Uses pdfkit for server-side PDF generation.
 */
import PDFDocument from "pdfkit";
import type { FlightTicketData, HotelConfirmationData } from "./email";

// Company branding colors
const NAVY = "#1B2B5E";
const GOLD = "#C9A84C";
const LIGHT_GRAY = "#F8FAFC";
const MID_GRAY = "#64748B";
const DARK = "#1A1A2E";

/**
 * Generate a flight ticket PDF and return it as a Buffer.
 */
export function generateFlightTicketPDF(data: FlightTicketData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595.28; // A4 width in points
    const margin = 40;
    const contentW = W - margin * 2;

    // ── Header ──────────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 110).fill(NAVY);
    doc.fontSize(22).fillColor(GOLD).font("Helvetica-Bold")
      .text("✈  ROYAL VOYAGE", margin, 28, { width: contentW, align: "center" });
    doc.fontSize(10).fillColor("white").font("Helvetica")
      .text("Your Premium Travel Partner — Nouakchott, Mauritania", margin, 58, { width: contentW, align: "center" });
    doc.fontSize(9).fillColor("rgba(255,255,255,0.6)")
      .text("+222 33 70 00 00  |  royal-voyage@gmail.com  |  www.royal-voyage.mr", margin, 78, { width: contentW, align: "center" });

    let y = 125;

    // ── Booking Confirmed badge ──────────────────────────────────────────────────
    doc.roundedRect(margin, y, contentW, 36, 8).fill("#DCFCE7");
    doc.fontSize(13).fillColor("#16A34A").font("Helvetica-Bold")
      .text("✔  BOOKING CONFIRMED", margin, y + 10, { width: contentW, align: "center" });
    y += 52;

    // ── Booking Reference & PNR ──────────────────────────────────────────────────
    const refW = data.pnr ? contentW / 2 - 6 : contentW;
    doc.roundedRect(margin, y, refW, 64, 8).fill(NAVY);
    doc.fontSize(8).fillColor("rgba(255,255,255,0.6)").font("Helvetica")
      .text("BOOKING REFERENCE", margin, y + 10, { width: refW, align: "center" });
    doc.fontSize(22).fillColor(GOLD).font("Helvetica-Bold")
      .text(data.bookingRef, margin, y + 24, { width: refW, align: "center" });

    if (data.pnr) {
      const pnrX = margin + refW + 12;
      doc.roundedRect(pnrX, y, refW, 64, 8).fill(GOLD);
      doc.fontSize(8).fillColor("rgba(0,0,0,0.55)").font("Helvetica")
        .text("PNR — AIRLINE RECORD LOCATOR", pnrX, y + 10, { width: refW, align: "center" });
      doc.fontSize(22).fillColor(NAVY).font("Helvetica-Bold")
        .text(data.pnr, pnrX, y + 24, { width: refW, align: "center" });
    }
    y += 80;

    // ── Passenger Info ───────────────────────────────────────────────────────────
    doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
      .text("PASSENGER INFORMATION", margin, y);
    y += 14;
    doc.roundedRect(margin, y, contentW, 50, 6).fill(LIGHT_GRAY).stroke("#E2E8F0");
    doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold")
      .text(data.passengerName, margin + 14, y + 10);
    doc.fontSize(9).fillColor(MID_GRAY).font("Helvetica")
      .text(data.passengerEmail, margin + 14, y + 26);
    doc.fontSize(9).fillColor(MID_GRAY)
      .text(`${data.passengers} Adult${data.passengers > 1 ? "s" : ""}${data.children > 0 ? ` + ${data.children} Child${data.children > 1 ? "ren" : ""}` : ""}  ·  ${data.cabinClass}`, margin + 14, y + 38);
    y += 66;

    // ── Outbound Flight ──────────────────────────────────────────────────────────
    doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
      .text("✈  OUTBOUND FLIGHT", margin, y);
    y += 14;
    doc.roundedRect(margin, y, contentW, 90, 6).fill(LIGHT_GRAY).stroke("#E2E8F0");

    // Route
    const colW = contentW / 3;
    doc.fontSize(28).fillColor(NAVY).font("Helvetica-Bold")
      .text(data.origin, margin + 14, y + 12, { width: colW - 14 });
    doc.fontSize(9).fillColor(MID_GRAY).font("Helvetica")
      .text(data.originCity, margin + 14, y + 46, { width: colW - 14 });

    // Arrow
    doc.fontSize(20).fillColor(GOLD).font("Helvetica-Bold")
      .text("→", margin + colW, y + 30, { width: colW, align: "center" });
    doc.fontSize(8).fillColor(MID_GRAY).font("Helvetica")
      .text(data.tripType === "round-trip" ? "ROUND TRIP" : "ONE WAY", margin + colW, y + 54, { width: colW, align: "center" });

    doc.fontSize(28).fillColor(NAVY).font("Helvetica-Bold")
      .text(data.destination, margin + colW * 2, y + 12, { width: colW - 14, align: "right" });
    doc.fontSize(9).fillColor(MID_GRAY).font("Helvetica")
      .text(data.destinationCity, margin + colW * 2, y + 46, { width: colW - 14, align: "right" });

    // Flight details row
    doc.moveTo(margin + 14, y + 68).lineTo(margin + contentW - 14, y + 68).stroke("#E2E8F0");
    const details = [
      { label: "DATE", value: data.departureDate },
      { label: "DEPARTS", value: data.departureTime },
      { label: "ARRIVES", value: data.arrivalTime },
      { label: "FLIGHT", value: `${data.airline} ${data.flightNumber}` },
    ];
    details.forEach((d, i) => {
      const dx = margin + 14 + (i * (contentW - 28)) / 4;
      doc.fontSize(7).fillColor(MID_GRAY).font("Helvetica").text(d.label, dx, y + 73, { width: 90 });
      doc.fontSize(9).fillColor(DARK).font("Helvetica-Bold").text(d.value, dx, y + 83, { width: 90 });
    });
    y += 106;

    // ── Return Flight (if round-trip) ────────────────────────────────────────────
    if (data.tripType === "round-trip" && data.returnDate) {
      doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
        .text("↩  RETURN FLIGHT", margin, y);
      y += 14;
      doc.roundedRect(margin, y, contentW, 50, 6).fill(LIGHT_GRAY).stroke("#E2E8F0");
      doc.fontSize(28).fillColor(NAVY).font("Helvetica-Bold")
        .text(data.destination, margin + 14, y + 8, { width: colW - 14 });
      doc.fontSize(20).fillColor(GOLD).font("Helvetica-Bold")
        .text("→", margin + colW, y + 14, { width: colW, align: "center" });
      doc.fontSize(28).fillColor(NAVY).font("Helvetica-Bold")
        .text(data.origin, margin + colW * 2, y + 8, { width: colW - 14, align: "right" });
      doc.fontSize(9).fillColor(MID_GRAY).font("Helvetica")
        .text(`Return Date: ${data.returnDate}`, margin + 14, y + 38, { width: contentW - 28 });
      y += 66;
    }

    // ── Payment Summary ──────────────────────────────────────────────────────────
    doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
      .text("💳  PAYMENT SUMMARY", margin, y);
    y += 14;
    doc.roundedRect(margin, y, contentW, 56, 6).fill(LIGHT_GRAY).stroke("#E2E8F0");
    doc.fontSize(9).fillColor(MID_GRAY).font("Helvetica")
      .text("Base Fare", margin + 14, y + 10)
      .text("Taxes & Fees", margin + 14, y + 26);
    doc.fontSize(9).fillColor(DARK).font("Helvetica")
      .text(data.totalPrice, margin + 14, y + 10, { width: contentW - 28, align: "right" })
      .text("Included", margin + 14, y + 26, { width: contentW - 28, align: "right" });
    doc.moveTo(margin + 14, y + 40).lineTo(margin + contentW - 14, y + 40).stroke("#E2E8F0");
    doc.fontSize(11).fillColor(DARK).font("Helvetica-Bold")
      .text("Total Paid", margin + 14, y + 44)
      .text(`${data.totalPrice} ${data.currency}`, margin + 14, y + 44, { width: contentW - 28, align: "right" });
    y += 72;

    // ── Notice ───────────────────────────────────────────────────────────────────
    doc.roundedRect(margin, y, contentW, 36, 6).fill("#FFFBEB").stroke("#FDE68A");
    doc.fontSize(8.5).fillColor("#92400E").font("Helvetica")
      .text("⚠  Please arrive at the airport at least 2 hours before departure. Carry a valid ID or passport.", margin + 10, y + 10, { width: contentW - 20 });
    y += 52;

    // ── Footer ───────────────────────────────────────────────────────────────────
    const footerY = 780;
    doc.rect(0, footerY, W, 62).fill(NAVY);
    doc.fontSize(8).fillColor("rgba(255,255,255,0.5)").font("Helvetica")
      .text("This is an automated ticket. Please do not reply to this email.", margin, footerY + 10, { width: contentW, align: "center" })
      .text("Royal Voyage Travel Agency  ·  Tavragh Zeina, Nouakchott  ·  +222 33 70 00 00", margin, footerY + 26, { width: contentW, align: "center" })
      .text("royal-voyage@gmail.com  ·  www.royal-voyage.mr", margin, footerY + 42, { width: contentW, align: "center" });

    doc.end();
  });
}

/**
 * Generate a hotel booking confirmation PDF and return it as a Buffer.
 */
export function generateHotelConfirmationPDF(data: HotelConfirmationData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = 595.28;
    const margin = 40;
    const contentW = W - margin * 2;

    // ── Header ──────────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 110).fill(NAVY);
    doc.fontSize(22).fillColor(GOLD).font("Helvetica-Bold")
      .text("🏨  ROYAL VOYAGE", margin, 28, { width: contentW, align: "center" });
    doc.fontSize(10).fillColor("white").font("Helvetica")
      .text("Hotel Booking Confirmation — Nouakchott, Mauritania", margin, 58, { width: contentW, align: "center" });
    doc.fontSize(9).fillColor("rgba(255,255,255,0.6)")
      .text("+222 33 70 00 00  |  royal-voyage@gmail.com  |  www.royal-voyage.mr", margin, 78, { width: contentW, align: "center" });

    let y = 125;

    // ── Confirmed badge ──────────────────────────────────────────────────────────
    doc.roundedRect(margin, y, contentW, 36, 8).fill("#DCFCE7");
    doc.fontSize(13).fillColor("#16A34A").font("Helvetica-Bold")
      .text("✔  BOOKING CONFIRMED", margin, y + 10, { width: contentW, align: "center" });
    y += 52;

    // ── Booking Reference & PNR ──────────────────────────────────────────────────
    const refW = data.pnr ? contentW / 2 - 6 : contentW;
    doc.roundedRect(margin, y, refW, 64, 8).fill(NAVY);
    doc.fontSize(8).fillColor("rgba(255,255,255,0.6)").font("Helvetica")
      .text("BOOKING REFERENCE", margin, y + 10, { width: refW, align: "center" });
    doc.fontSize(22).fillColor(GOLD).font("Helvetica-Bold")
      .text(data.bookingRef, margin, y + 24, { width: refW, align: "center" });

    if (data.pnr) {
      const pnrX = margin + refW + 12;
      doc.roundedRect(pnrX, y, refW, 64, 8).fill(GOLD);
      doc.fontSize(8).fillColor("rgba(0,0,0,0.55)").font("Helvetica")
        .text("BOOKING PNR", pnrX, y + 10, { width: refW, align: "center" });
      doc.fontSize(22).fillColor(NAVY).font("Helvetica-Bold")
        .text(data.pnr, pnrX, y + 24, { width: refW, align: "center" });
    }
    y += 80;

    // ── Guest Info ───────────────────────────────────────────────────────────────
    doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
      .text("GUEST INFORMATION", margin, y);
    y += 14;
    doc.roundedRect(margin, y, contentW, 50, 6).fill(LIGHT_GRAY).stroke("#E2E8F0");
    doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold")
      .text(data.guestName, margin + 14, y + 10);
    doc.fontSize(9).fillColor(MID_GRAY).font("Helvetica")
      .text(data.guestEmail, margin + 14, y + 26);
    doc.fontSize(9).fillColor(MID_GRAY)
      .text(`${data.guests} Adult${data.guests > 1 ? "s" : ""}${data.children > 0 ? ` + ${data.children} Child${data.children > 1 ? "ren" : ""}` : ""}`, margin + 14, y + 38);
    y += 66;

    // ── Hotel Details ────────────────────────────────────────────────────────────
    doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
      .text("🏨  HOTEL DETAILS", margin, y);
    y += 14;
    doc.roundedRect(margin, y, contentW, 110, 6).fill(LIGHT_GRAY).stroke("#E2E8F0");
    doc.fontSize(18).fillColor(NAVY).font("Helvetica-Bold")
      .text(data.hotelName, margin + 14, y + 12, { width: contentW - 28 });
    const stars = "★".repeat(data.stars) + "☆".repeat(5 - data.stars);
    doc.fontSize(12).fillColor(GOLD).font("Helvetica")
      .text(stars, margin + 14, y + 36);
    doc.fontSize(9).fillColor(MID_GRAY).font("Helvetica")
      .text(`📍 ${data.hotelCity}, ${data.hotelCountry}`, margin + 14, y + 54);
    doc.moveTo(margin + 14, y + 70).lineTo(margin + contentW - 14, y + 70).stroke("#E2E8F0");

    const cols = [
      { label: "CHECK-IN", value: data.checkIn },
      { label: "CHECK-OUT", value: data.checkOut },
      { label: "NIGHTS", value: `${data.nights}` },
      { label: "ROOM TYPE", value: data.roomType },
    ];
    cols.forEach((c, i) => {
      const cx = margin + 14 + (i * (contentW - 28)) / 4;
      doc.fontSize(7).fillColor(MID_GRAY).font("Helvetica").text(c.label, cx, y + 76, { width: 100 });
      doc.fontSize(9).fillColor(DARK).font("Helvetica-Bold").text(c.value, cx, y + 88, { width: 100 });
    });
    y += 126;

    // ── Payment Summary ──────────────────────────────────────────────────────────
    doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
      .text("💳  PAYMENT SUMMARY", margin, y);
    y += 14;
    doc.roundedRect(margin, y, contentW, 56, 6).fill(LIGHT_GRAY).stroke("#E2E8F0");
    doc.fontSize(9).fillColor(MID_GRAY).font("Helvetica")
      .text(`Room Rate (${data.nights} night${data.nights > 1 ? "s" : ""})`, margin + 14, y + 10)
      .text("Taxes & Fees", margin + 14, y + 26);
    doc.fontSize(9).fillColor(DARK).font("Helvetica")
      .text(data.totalPrice, margin + 14, y + 10, { width: contentW - 28, align: "right" })
      .text("Included", margin + 14, y + 26, { width: contentW - 28, align: "right" });
    doc.moveTo(margin + 14, y + 40).lineTo(margin + contentW - 14, y + 40).stroke("#E2E8F0");
    doc.fontSize(11).fillColor(DARK).font("Helvetica-Bold")
      .text("Total Paid", margin + 14, y + 44)
      .text(`${data.totalPrice} ${data.currency}`, margin + 14, y + 44, { width: contentW - 28, align: "right" });
    y += 72;

    // ── Notice ───────────────────────────────────────────────────────────────────
    doc.roundedRect(margin, y, contentW, 36, 6).fill("#FFFBEB").stroke("#FDE68A");
    doc.fontSize(8.5).fillColor("#92400E").font("Helvetica")
      .text("⚠  Standard check-in time is 14:00. Please present this confirmation and a valid ID at hotel reception.", margin + 10, y + 10, { width: contentW - 20 });
    y += 52;

    // ── Footer ───────────────────────────────────────────────────────────────────
    const footerY = 780;
    doc.rect(0, footerY, W, 62).fill(NAVY);
    doc.fontSize(8).fillColor("rgba(255,255,255,0.5)").font("Helvetica")
      .text("This is an automated confirmation. Please do not reply to this email.", margin, footerY + 10, { width: contentW, align: "center" })
      .text("Royal Voyage Travel Agency  ·  Tavragh Zeina, Nouakchott  ·  +222 33 70 00 00", margin, footerY + 26, { width: contentW, align: "center" })
      .text("royal-voyage@gmail.com  ·  www.royal-voyage.mr", margin, footerY + 42, { width: contentW, align: "center" });

    doc.end();
  });
}
