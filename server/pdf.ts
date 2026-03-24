/**
 * Royal Voyage — Premium PDF Ticket Generator
 * Generates airline-style boarding pass tickets and hotel confirmations.
 * Design inspired by real boarding passes: tear-off stub, QR code, airline logo.
 */
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { FlightTicketData, HotelConfirmationData } from "./email";

// ES module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Brand Colors ──────────────────────────────────────────────────────────────
const NAVY    = "#1B2B5E";
const GOLD    = "#C9A84C";
const WHITE   = "#FFFFFF";
const LIGHT   = "#F8FAFC";
const GRAY    = "#64748B";
const BORDER  = "#E2E8F0";
const GREEN   = "#16A34A";
const GREEN_BG = "#DCFCE7";

// ── Page dimensions (A4) ──────────────────────────────────────────────────────
const W = 595.28;
const H = 841.89;
const M = 36; // margin

// ── Airline logo directory ────────────────────────────────────────────────────
const AIRLINES_DIR = path.join(__dirname, "assets", "airlines");

/** Get airline logo buffer if available */
function getAirlineLogo(airlineCode: string): Buffer | null {
  try {
    const logoPath = path.join(AIRLINES_DIR, `${airlineCode.toUpperCase()}.png`);
    if (fs.existsSync(logoPath)) {
      return fs.readFileSync(logoPath);
    }
  } catch {
    // ignore
  }
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function buildQRBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    type: "png",
    width: 120,
    margin: 1,
    color: { dark: NAVY, light: WHITE },
  });
}

function drawRoundedRect(
  doc: PDFKit.PDFDocument,
  x: number, y: number, w: number, h: number,
  r: number, fill: string, stroke?: string
) {
  doc.roundedRect(x, y, w, h, r);
  if (stroke) {
    doc.fillAndStroke(fill, stroke);
  } else {
    doc.fill(fill);
  }
}

/** Draw a dashed tear-off line across the full width */
function drawTearLine(doc: PDFKit.PDFDocument, y: number) {
  doc.save();
  (doc as any).dash(4, { space: 6 });
  doc.moveTo(M, y).lineTo(W - M, y).stroke(BORDER);
  (doc as any).undash();
  doc.restore();
  // Scissors icon
  doc.fontSize(10).fillColor(GRAY).text("✂", M - 14, y - 7);
}

/** Draw a thin horizontal divider */
function divider(doc: PDFKit.PDFDocument, x: number, y: number, w: number) {
  doc.moveTo(x, y).lineTo(x + w, y).stroke(BORDER);
}

/** Small label + value pair */
function infoCell(
  doc: PDFKit.PDFDocument,
  x: number, y: number, w: number,
  label: string, value: string,
  align: "left" | "center" | "right" = "left"
) {
  doc.fontSize(7).fillColor(GRAY).font("Helvetica")
    .text(label.toUpperCase(), x, y, { width: w, align });
  doc.fontSize(10).fillColor(NAVY).font("Helvetica-Bold")
    .text(value, x, y + 11, { width: w, align });
}

// ── Flight Ticket PDF ─────────────────────────────────────────────────────────

export function generateFlightTicketPDF(data: FlightTicketData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const qrData = [
        data.pnr ?? data.bookingRef,
        data.origin,
        data.destination,
        data.departureDate,
        data.passengerName,
      ].join(" | ");
      const qrBuffer = await buildQRBuffer(qrData);

      // Load airline logo
      const airlineCode = (data.airline ?? "").trim().toUpperCase();
      const airlineLogo = getAirlineLogo(airlineCode);

      const doc = new PDFDocument({ size: "A4", margin: 0, compress: true });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const cW = W - M * 2;

      // ══════════════════════════════════════════════════════════════════════
      // HEADER BAND
      // ══════════════════════════════════════════════════════════════════════
      doc.rect(0, 0, W, 90).fill(NAVY);

      // Diagonal gold accent
      doc.save();
      doc.polygon([W - 160, 0], [W, 0], [W, 90], [W - 60, 90])
        .fill(GOLD);
      doc.restore();

      // Logo text
      doc.fontSize(20).fillColor(GOLD).font("Helvetica-Bold")
        .text("ROYAL VOYAGE", M, 22, { width: 260 });
      doc.fontSize(9).fillColor("rgba(255,255,255,0.65)").font("Helvetica")
        .text("Your Premium Travel Partner", M, 46, { width: 260 });
      doc.fontSize(8).fillColor("rgba(255,255,255,0.45)")
        .text("+222 33 70 00 00  ·  WhatsApp: +222 33 70 00 00  ·  suporte@royalvoyage.online", M, 62, { width: 400 });


      let y = 106;

      // ══════════════════════════════════════════════════════════════════════
      // CONFIRMED BADGE
      // ══════════════════════════════════════════════════════════════════════
      drawRoundedRect(doc, M, y, cW, 30, 6, GREEN_BG);
      doc.fontSize(11).fillColor(GREEN).font("Helvetica-Bold")
        .text("✔  BOOKING CONFIRMED", M, y + 8, { width: cW, align: "center" });
      y += 42;

      // ══════════════════════════════════════════════════════════════════════
      // AIRLINE LOGO STRIP (if logo available)
      // ══════════════════════════════════════════════════════════════════════
      if (airlineLogo) {
        const logoStripH = 50;
        drawRoundedRect(doc, M, y, cW, logoStripH, 8, WHITE, BORDER);

        // Airline logo on the left
        try {
          doc.image(airlineLogo, M + 12, y + 8, { height: 34, fit: [120, 34] });
        } catch {
          // fallback: just text
          doc.fontSize(14).fillColor(NAVY).font("Helvetica-Bold")
            .text(airlineCode, M + 16, y + 16, { width: 80 });
        }

        // Airline name + flight number on the right side of logo
        const airlineName = getAirlineName(airlineCode);
        doc.fontSize(12).fillColor(NAVY).font("Helvetica-Bold")
          .text(airlineName, M + 140, y + 10, { width: 200 });
        doc.fontSize(9).fillColor(GRAY).font("Helvetica")
          .text(`Flight ${data.airline} ${data.flightNumber}  ·  ${data.cabinClass}`, M + 140, y + 27, { width: 200 });

        // Small "Operated by" label on far right
        doc.fontSize(7).fillColor(GRAY).font("Helvetica")
          .text("OPERATED BY", M + cW - 110, y + 10, { width: 100, align: "right" });
        doc.fontSize(9).fillColor(NAVY).font("Helvetica-Bold")
          .text(airlineCode, M + cW - 110, y + 22, { width: 100, align: "right" });

        y += logoStripH + 10;
      }

      // ══════════════════════════════════════════════════════════════════════
      // MAIN TICKET BODY
      // ══════════════════════════════════════════════════════════════════════
      const ticketH = 310;
      drawRoundedRect(doc, M, y, cW, ticketH, 10, LIGHT, BORDER);

      // Left section: route
      const leftW = cW - 130;
      const rightW = 118;
      const rightX = M + leftW + 12;

      // ── Route row ──────────────────────────────────────────────────────────
      const routeY = y + 18;

      // Origin
      doc.fontSize(38).fillColor(NAVY).font("Helvetica-Bold")
        .text(data.origin, M + 16, routeY, { width: 90 });
      doc.fontSize(9).fillColor(GRAY).font("Helvetica")
        .text(data.originCity, M + 16, routeY + 42, { width: 90 });

      // Arrow + trip type
      const arrowX = M + 16 + 90;
      const arrowW = leftW - 90 - 90 - 32;
      doc.fontSize(22).fillColor(GOLD).font("Helvetica-Bold")
        .text("→", arrowX, routeY + 8, { width: arrowW, align: "center" });
      doc.fontSize(7).fillColor(GRAY).font("Helvetica")
        .text(data.tripType === "round-trip" ? "ROUND TRIP" : "ONE WAY", arrowX, routeY + 34, { width: arrowW, align: "center" });

      // Destination
      doc.fontSize(38).fillColor(NAVY).font("Helvetica-Bold")
        .text(data.destination, M + leftW - 106, routeY, { width: 90, align: "right" });
      doc.fontSize(9).fillColor(GRAY).font("Helvetica")
        .text(data.destinationCity, M + leftW - 106, routeY + 42, { width: 90, align: "right" });

      // ── Divider ────────────────────────────────────────────────────────────
      divider(doc, M + 16, y + 74, leftW - 32);

      // ── Flight info grid ───────────────────────────────────────────────────
      const gridY = y + 84;
      const cellW = (leftW - 32) / 4;

      infoCell(doc, M + 16, gridY, cellW, "Date", data.departureDate);
      infoCell(doc, M + 16 + cellW, gridY, cellW, "Departs", data.departureTime);
      infoCell(doc, M + 16 + cellW * 2, gridY, cellW, "Arrives", data.arrivalTime);
      infoCell(doc, M + 16 + cellW * 3, gridY, cellW, "Flight", `${data.airline} ${data.flightNumber}`);

      const grid2Y = gridY + 36;
      infoCell(doc, M + 16, grid2Y, cellW, "Class", data.cabinClass);
      infoCell(doc, M + 16 + cellW, grid2Y, cellW * 2, "Passenger",
        `${data.passengers} Adult${data.passengers > 1 ? "s" : ""}${data.children > 0 ? ` + ${data.children} Child` : ""}`);
      infoCell(doc, M + 16 + cellW * 3, grid2Y, cellW, "Total", `${data.totalPrice} ${data.currency}`);

      // ── Passenger name bar ─────────────────────────────────────────────────
      const nameBarY = grid2Y + 40;
      drawRoundedRect(doc, M + 16, nameBarY, leftW - 32, 28, 5, NAVY);
      doc.fontSize(8).fillColor("rgba(255,255,255,0.55)").font("Helvetica")
        .text("PASSENGER NAME", M + 24, nameBarY + 4, { width: 120 });
      doc.fontSize(12).fillColor(GOLD).font("Helvetica-Bold")
        .text(data.passengerName.toUpperCase(), M + 24, nameBarY + 14, { width: leftW - 48 });

      // ── Right section: QR + PNR ────────────────────────────────────────────
      // Vertical dashed separator
      doc.save();
      (doc as any).dash(3, { space: 5 });
      doc.moveTo(rightX - 8, y + 14).lineTo(rightX - 8, y + ticketH - 14).stroke(BORDER);
      (doc as any).undash();
      doc.restore();

      // QR code
      doc.image(qrBuffer, rightX, y + 16, { width: rightW - 4, height: rightW - 4 });

      // PNR
      const pnrY = y + 16 + rightW - 4 + 8;
      doc.fontSize(7).fillColor(GRAY).font("Helvetica")
        .text("PNR", rightX, pnrY, { width: rightW - 4, align: "center" });
      doc.fontSize(14).fillColor(NAVY).font("Helvetica-Bold")
        .text(data.pnr ?? data.bookingRef, rightX, pnrY + 11, { width: rightW - 4, align: "center" });

      // Booking ref
      const refY = pnrY + 36;
      doc.fontSize(7).fillColor(GRAY).font("Helvetica")
        .text("BOOKING REF", rightX, refY, { width: rightW - 4, align: "center" });
      doc.fontSize(10).fillColor(GOLD).font("Helvetica-Bold")
        .text(data.bookingRef, rightX, refY + 11, { width: rightW - 4, align: "center" });

      y += ticketH + 12;

      // ══════════════════════════════════════════════════════════════════════
      // TEAR-OFF STUB
      // ══════════════════════════════════════════════════════════════════════
      drawTearLine(doc, y);
      y += 12;

      const stubH = 80;
      drawRoundedRect(doc, M, y, cW, stubH, 8, NAVY);

      // Gold left accent
      doc.rect(M, y, 6, stubH).fill(GOLD);

      // Stub content
      doc.fontSize(8).fillColor("rgba(255,255,255,0.55)").font("Helvetica")
        .text("PASSENGER COPY — KEEP THIS STUB", M + 16, y + 8, { width: cW - 24 });

      const stubCellW = (cW - 32) / 5;
      const stubDataY = y + 22;
      const stubItems = [
        { label: "FROM", value: data.origin },
        { label: "TO", value: data.destination },
        { label: "DATE", value: data.departureDate },
        { label: "FLIGHT", value: `${data.airline}${data.flightNumber}` },
        { label: "PNR", value: data.pnr ?? data.bookingRef },
      ];
      stubItems.forEach((item, i) => {
        const sx = M + 16 + i * stubCellW;
        doc.fontSize(7).fillColor("rgba(255,255,255,0.5)").font("Helvetica")
          .text(item.label, sx, stubDataY, { width: stubCellW - 4 });
        doc.fontSize(11).fillColor(i === 4 ? GOLD : WHITE).font("Helvetica-Bold")
          .text(item.value, sx, stubDataY + 12, { width: stubCellW - 4 });
      });

      y += stubH + 20;

      // ══════════════════════════════════════════════════════════════════════
      // RETURN FLIGHT (if round-trip)
      // ══════════════════════════════════════════════════════════════════════
      if (data.tripType === "round-trip" && data.returnDate) {
        doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
          .text("↩  RETURN FLIGHT", M, y);
        y += 14;

        const retH = 70;
        drawRoundedRect(doc, M, y, cW, retH, 8, LIGHT, BORDER);
        doc.fontSize(28).fillColor(NAVY).font("Helvetica-Bold")
          .text(data.destination, M + 16, y + 12, { width: 80 });
        doc.fontSize(18).fillColor(GOLD).font("Helvetica-Bold")
          .text("→", M + 100, y + 18, { width: cW - 200, align: "center" });
        doc.fontSize(28).fillColor(NAVY).font("Helvetica-Bold")
          .text(data.origin, M + cW - 96, y + 12, { width: 80, align: "right" });
        infoCell(doc, M + 16, y + 46, 160, "Return Date", data.returnDate);
        y += retH + 16;
      }

      // ══════════════════════════════════════════════════════════════════════
      // PAYMENT SUMMARY
      // ══════════════════════════════════════════════════════════════════════
      doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
        .text("PAYMENT SUMMARY", M, y);
      y += 14;

      const payH = 72;
      drawRoundedRect(doc, M, y, cW, payH, 8, LIGHT, BORDER);

      const rows = [
        { label: "Base Fare", value: data.totalPrice },
        { label: "Taxes & Fees", value: "Included" },
      ];
      rows.forEach((row, i) => {
        const ry = y + 10 + i * 22;
        doc.fontSize(9).fillColor(GRAY).font("Helvetica").text(row.label, M + 16, ry);
        doc.fontSize(9).fillColor(NAVY).font("Helvetica").text(row.value, M + 16, ry, { width: cW - 32, align: "right" });
      });
      divider(doc, M + 16, y + 52, cW - 32);
      doc.fontSize(11).fillColor(NAVY).font("Helvetica-Bold")
        .text("Total Paid", M + 16, y + 56);
      doc.fontSize(11).fillColor(GOLD).font("Helvetica-Bold")
        .text(`${data.totalPrice} ${data.currency}`, M + 16, y + 56, { width: cW - 32, align: "right" });
      y += payH + 16;

      // ══════════════════════════════════════════════════════════════════════
      // NOTICE
      // ══════════════════════════════════════════════════════════════════════
      drawRoundedRect(doc, M, y, cW, 38, 6, "#FFFBEB", "#FDE68A");
      doc.fontSize(8.5).fillColor("#92400E").font("Helvetica")
        .text("⚠  Please arrive at the airport at least 2 hours before departure. Carry a valid ID or passport.", M + 12, y + 11, { width: cW - 24 });
      y += 54;

      // ══════════════════════════════════════════════════════════════════════
      // FOOTER
      // ══════════════════════════════════════════════════════════════════════
      doc.rect(0, H - 56, W, 56).fill(NAVY);
      doc.fontSize(8).fillColor("rgba(255,255,255,0.45)").font("Helvetica")
        .text("Royal Voyage Travel Agency (Since 2023)  ·  Tavragh Zeina, Nouakchott, Mauritania  ·  Tel/WhatsApp: +222 33 70 00 00  ·  suporte@royalvoyage.online", M, H - 38, { width: cW, align: "center" })
        .text("This is an automated ticket. Please do not reply to this email.", M, H - 22, { width: cW, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ── Airline name lookup ───────────────────────────────────────────────────────

function getAirlineName(code: string): string {
  const names: Record<string, string> = {
    G9: "Air Arabia",
    AT: "Royal Air Maroc",
    TK: "Turkish Airlines",
    EK: "Emirates",
    AF: "Air France",
    MS: "EgyptAir",
    SV: "Saudia",
    QR: "Qatar Airways",
    EY: "Etihad Airways",
    WY: "Oman Air",
    KU: "Kuwait Airways",
    GF: "Gulf Air",
    FZ: "flydubai",
    J9: "Jazeera Airways",
    XY: "flynas",
    PC: "Pegasus Airlines",
    LH: "Lufthansa",
    BA: "British Airways",
    IB: "Iberia",
    KL: "KLM",
  };
  return names[code] ?? code;
}

// ── Hotel Confirmation PDF ────────────────────────────────────────────────────

export function generateHotelConfirmationPDF(data: HotelConfirmationData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const qrData = [
        data.pnr ?? data.bookingRef,
        data.hotelName,
        data.checkIn,
        data.checkOut,
        data.guestName,
      ].join(" | ");
      const qrBuffer = await buildQRBuffer(qrData);

      const doc = new PDFDocument({ size: "A4", margin: 0, compress: true });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const cW = W - M * 2;

      // ── Header ──────────────────────────────────────────────────────────────
      doc.rect(0, 0, W, 90).fill(NAVY);
      doc.save();
      doc.polygon([W - 160, 0], [W, 0], [W, 90], [W - 60, 90]).fill(GOLD);
      doc.restore();

      doc.fontSize(20).fillColor(GOLD).font("Helvetica-Bold")
        .text("ROYAL VOYAGE", M, 22, { width: 260 });
      doc.fontSize(9).fillColor("rgba(255,255,255,0.65)").font("Helvetica")
        .text("Hotel Booking Confirmation", M, 46, { width: 260 });
      doc.fontSize(8).fillColor("rgba(255,255,255,0.45)")
        .text("+222 33 70 00 00  ·  WhatsApp: +222 33 70 00 00  ·  suporte@royalvoyage.online", M, 62, { width: 400 });
      doc.fontSize(11).fillColor(NAVY).font("Helvetica-Bold")
        .text("HOTEL VOUCHER", W - 155, 36, { width: 120, align: "center" });

      let y = 106;

      // ── Confirmed badge ────────────────────────────────────────────────────
      drawRoundedRect(doc, M, y, cW, 30, 6, GREEN_BG);
      doc.fontSize(11).fillColor(GREEN).font("Helvetica-Bold")
        .text("✔  BOOKING CONFIRMED", M, y + 8, { width: cW, align: "center" });
      y += 42;

      // ── Main card ──────────────────────────────────────────────────────────
      const cardH = 300;
      drawRoundedRect(doc, M, y, cW, cardH, 10, LIGHT, BORDER);

      const leftW = cW - 130;
      const rightW = 118;
      const rightX = M + leftW + 12;

      // Hotel name + stars
      const starsStr = "★".repeat(data.stars) + "☆".repeat(5 - data.stars);
      doc.fontSize(20).fillColor(NAVY).font("Helvetica-Bold")
        .text(data.hotelName, M + 16, y + 16, { width: leftW - 32 });
      doc.fontSize(13).fillColor(GOLD).font("Helvetica")
        .text(starsStr, M + 16, y + 42);
      doc.fontSize(9).fillColor(GRAY).font("Helvetica")
        .text(`📍 ${data.hotelCity}, ${data.hotelCountry}`, M + 16, y + 60, { width: leftW - 32 });

      divider(doc, M + 16, y + 78, leftW - 32);

      // Check-in / Check-out big display
      const ciY = y + 90;
      const halfW = (leftW - 32) / 2 - 8;
      drawRoundedRect(doc, M + 16, ciY, halfW, 56, 6, NAVY);
      doc.fontSize(7).fillColor("rgba(255,255,255,0.55)").font("Helvetica")
        .text("CHECK-IN", M + 24, ciY + 8, { width: halfW - 16 });
      doc.fontSize(14).fillColor(GOLD).font("Helvetica-Bold")
        .text(data.checkIn, M + 24, ciY + 20, { width: halfW - 16 });
      doc.fontSize(8).fillColor("rgba(255,255,255,0.45)").font("Helvetica")
        .text("From 14:00", M + 24, ciY + 38, { width: halfW - 16 });

      const coX = M + 16 + halfW + 16;
      drawRoundedRect(doc, coX, ciY, halfW, 56, 6, NAVY);
      doc.fontSize(7).fillColor("rgba(255,255,255,0.55)").font("Helvetica")
        .text("CHECK-OUT", coX + 8, ciY + 8, { width: halfW - 16 });
      doc.fontSize(14).fillColor(GOLD).font("Helvetica-Bold")
        .text(data.checkOut, coX + 8, ciY + 20, { width: halfW - 16 });
      doc.fontSize(8).fillColor("rgba(255,255,255,0.45)").font("Helvetica")
        .text("Until 12:00", coX + 8, ciY + 38, { width: halfW - 16 });

      // Info grid
      const gridY = ciY + 68;
      const cellW = (leftW - 32) / 3;
      infoCell(doc, M + 16, gridY, cellW, "Duration", `${data.nights} Night${data.nights > 1 ? "s" : ""}`);
      infoCell(doc, M + 16 + cellW, gridY, cellW, "Room Type", data.roomType);
      infoCell(doc, M + 16 + cellW * 2, gridY, cellW, "Guests",
        `${data.guests} Adult${data.guests > 1 ? "s" : ""}${data.children > 0 ? ` + ${data.children}` : ""}`);

      // Guest name bar
      const nameBarY = gridY + 38;
      drawRoundedRect(doc, M + 16, nameBarY, leftW - 32, 28, 5, NAVY);
      doc.fontSize(8).fillColor("rgba(255,255,255,0.55)").font("Helvetica")
        .text("GUEST NAME", M + 24, nameBarY + 4, { width: 120 });
      doc.fontSize(12).fillColor(GOLD).font("Helvetica-Bold")
        .text(data.guestName.toUpperCase(), M + 24, nameBarY + 14, { width: leftW - 48 });

      // Right: QR + PNR
      doc.save();
      (doc as any).dash(3, { space: 5 });
      doc.moveTo(rightX - 8, y + 14).lineTo(rightX - 8, y + cardH - 14).stroke(BORDER);
      (doc as any).undash();
      doc.restore();

      doc.image(qrBuffer, rightX, y + 16, { width: rightW - 4, height: rightW - 4 });

      const pnrY = y + 16 + rightW - 4 + 8;
      doc.fontSize(7).fillColor(GRAY).font("Helvetica")
        .text("PNR", rightX, pnrY, { width: rightW - 4, align: "center" });
      doc.fontSize(14).fillColor(NAVY).font("Helvetica-Bold")
        .text(data.pnr ?? data.bookingRef, rightX, pnrY + 11, { width: rightW - 4, align: "center" });

      const refY = pnrY + 36;
      doc.fontSize(7).fillColor(GRAY).font("Helvetica")
        .text("BOOKING REF", rightX, refY, { width: rightW - 4, align: "center" });
      doc.fontSize(10).fillColor(GOLD).font("Helvetica-Bold")
        .text(data.bookingRef, rightX, refY + 11, { width: rightW - 4, align: "center" });

      y += cardH + 12;

      // ── Tear-off stub ──────────────────────────────────────────────────────
      drawTearLine(doc, y);
      y += 12;

      const stubH = 80;
      drawRoundedRect(doc, M, y, cW, stubH, 8, NAVY);
      doc.rect(M, y, 6, stubH).fill(GOLD);

      doc.fontSize(8).fillColor("rgba(255,255,255,0.55)").font("Helvetica")
        .text("GUEST COPY — PRESENT AT HOTEL RECEPTION", M + 16, y + 8, { width: cW - 24 });

      const stubCellW = (cW - 32) / 5;
      const stubDataY = y + 22;
      const stubItems = [
        { label: "HOTEL", value: data.hotelName.substring(0, 14) },
        { label: "CHECK-IN", value: data.checkIn },
        { label: "CHECK-OUT", value: data.checkOut },
        { label: "NIGHTS", value: `${data.nights}N` },
        { label: "PNR", value: data.pnr ?? data.bookingRef },
      ];
      stubItems.forEach((item, i) => {
        const sx = M + 16 + i * stubCellW;
        doc.fontSize(7).fillColor("rgba(255,255,255,0.5)").font("Helvetica")
          .text(item.label, sx, stubDataY, { width: stubCellW - 4 });
        doc.fontSize(i === 4 ? 13 : 10).fillColor(i === 4 ? GOLD : WHITE).font("Helvetica-Bold")
          .text(item.value, sx, stubDataY + 12, { width: stubCellW - 4 });
      });

      y += stubH + 20;

      // ── Payment summary ────────────────────────────────────────────────────
      doc.fontSize(9).fillColor(GOLD).font("Helvetica-Bold")
        .text("PAYMENT SUMMARY", M, y);
      y += 14;

      const payH = 72;
      drawRoundedRect(doc, M, y, cW, payH, 8, LIGHT, BORDER);
      const payRows = [
        { label: `Room Rate (${data.nights} night${data.nights > 1 ? "s" : ""})`, value: data.totalPrice },
        { label: "Taxes & Fees", value: "Included" },
      ];
      payRows.forEach((row, i) => {
        const ry = y + 10 + i * 22;
        doc.fontSize(9).fillColor(GRAY).font("Helvetica").text(row.label, M + 16, ry);
        doc.fontSize(9).fillColor(NAVY).font("Helvetica").text(row.value, M + 16, ry, { width: cW - 32, align: "right" });
      });
      divider(doc, M + 16, y + 52, cW - 32);
      doc.fontSize(11).fillColor(NAVY).font("Helvetica-Bold").text("Total Paid", M + 16, y + 56);
      doc.fontSize(11).fillColor(GOLD).font("Helvetica-Bold")
        .text(`${data.totalPrice} ${data.currency}`, M + 16, y + 56, { width: cW - 32, align: "right" });
      y += payH + 16;

      // ── Notice ─────────────────────────────────────────────────────────────
      drawRoundedRect(doc, M, y, cW, 38, 6, "#FFFBEB", "#FDE68A");
      doc.fontSize(8.5).fillColor("#92400E").font("Helvetica")
        .text("⚠  Standard check-in time is 14:00. Please present this voucher and a valid ID at hotel reception.", M + 12, y + 11, { width: cW - 24 });

      // ── Footer ─────────────────────────────────────────────────────────────
      doc.rect(0, H - 56, W, 56).fill(NAVY);
      doc.fontSize(8).fillColor("rgba(255,255,255,0.45)").font("Helvetica")
        .text("Royal Voyage Travel Agency (Since 2023)  ·  Tavragh Zeina, Nouakchott, Mauritania  ·  Tel/WhatsApp: +222 33 70 00 00  ·  suporte@royalvoyage.online", M, H - 38, { width: cW, align: "center" })
        .text("This is an automated confirmation. Please do not reply to this email.", M, H - 22, { width: cW, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
