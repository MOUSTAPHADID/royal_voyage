/**
 * Royal Voyage — Email Service
 * Sends flight tickets and hotel booking confirmations to customers.
 * Uses nodemailer with Gmail SMTP (configurable via env vars).
 */
import nodemailer from "nodemailer";
import { generateFlightTicketPDF, generateHotelConfirmationPDF } from "./pdf";

// Company info
const COMPANY = {
  name: "Royal Voyage",
  phone: "+222 33 70 00 00",
  email: "suporte@royalvoyage.online",
  address: "Tavragh Zeina, Nouakchott, Mauritania",
  website: "www.royal-voyage.mr",
};

// ─── Transporter ─────────────────────────────────────────────────────────────
function getTransporter() {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("[Email] SMTP credentials not configured — emails will be logged only");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

// ─── HTML Templates ───────────────────────────────────────────────────────────

function baseLayout(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; color: #1a1a2e; }
    .wrapper { max-width: 640px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.10); }
    .header { background: linear-gradient(135deg, #1B2B5E 0%, #0d1a3a 100%); padding: 32px 40px; text-align: center; }
    .header-logo { font-size: 28px; font-weight: 800; color: #C9A84C; letter-spacing: 2px; }
    .header-sub { color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 4px; }
    .body { padding: 36px 40px; }
    .section-title { font-size: 11px; font-weight: 700; color: #C9A84C; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; }
    .flight-route { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .airport-code { font-size: 32px; font-weight: 800; color: #1B2B5E; }
    .airport-name { font-size: 12px; color: #64748b; margin-top: 2px; }
    .flight-arrow { font-size: 24px; color: #C9A84C; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .info-item span { display: block; font-size: 14px; font-weight: 600; color: #1a1a2e; margin-top: 2px; }
    .ref-box { background: linear-gradient(135deg, #1B2B5E, #2d4a8a); border-radius: 12px; padding: 20px 24px; text-align: center; margin-bottom: 20px; }
    .ref-label { font-size: 11px; color: rgba(255,255,255,0.6); letter-spacing: 2px; text-transform: uppercase; }
    .ref-code { font-size: 28px; font-weight: 800; color: #C9A84C; letter-spacing: 6px; margin-top: 6px; }
    .price-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .price-row:last-child { border-bottom: none; font-weight: 700; font-size: 16px; }
    .badge { display: inline-block; background: #dcfce7; color: #16a34a; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; letter-spacing: 1px; }
    .footer { background: #1B2B5E; padding: 24px 40px; text-align: center; }
    .footer p { color: rgba(255,255,255,0.6); font-size: 12px; line-height: 1.8; }
    .footer a { color: #C9A84C; text-decoration: none; }
    .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
    .hotel-name { font-size: 22px; font-weight: 800; color: #1B2B5E; margin-bottom: 4px; }
    .hotel-location { font-size: 13px; color: #64748b; }
    .stars { color: #C9A84C; font-size: 16px; margin: 6px 0; }
    .notice { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #92400e; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">✈ ROYAL VOYAGE</div>
      <div class="header-sub">Your Premium Travel Partner</div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>
        <strong style="color:#C9A84C">Royal Voyage Travel Agency</strong><br/>
        ${COMPANY.address}<br/>
        📞 ${COMPANY.phone} &nbsp;|&nbsp; ✉ <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>
      </p>
      <p style="margin-top:12px; font-size:11px; opacity:0.5">
        This is an automated email. Please do not reply directly to this message.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Flight Ticket Template ───────────────────────────────────────────────────
export interface FlightTicketData {
  passengerName: string;
  passengerEmail: string;
  bookingRef: string;
  pnr?: string;
  ticketNumber?: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  cabinClass: string;
  passengers: number;
  children: number;
  infants: number;
  totalPrice: string;
  currency: string;
  tripType: "one-way" | "round-trip";
  returnDate?: string;
}

function flightTicketHtml(data: FlightTicketData): string {
  const content = `
    <p style="font-size:16px; margin-bottom:24px;">
      Dear <strong>${data.passengerName}</strong>,<br/>
      Your flight booking has been <span class="badge">CONFIRMED</span>
    </p>

    <div class="ref-box">
      <div class="ref-label">Booking Reference</div>
      <div class="ref-code">${data.bookingRef}</div>
    </div>

    ${data.pnr ? `
    <div style="background:#C9A84C;border-radius:12px;padding:18px 24px;text-align:center;margin-bottom:20px;">
      <div style="font-size:11px;color:rgba(0,0,0,0.6);letter-spacing:2px;text-transform:uppercase;font-weight:700;">PNR — Airline Record Locator</div>
      <div style="font-size:36px;font-weight:900;color:#1B2B5E;letter-spacing:8px;margin-top:6px;font-family:monospace;">${data.pnr}</div>
      <div style="font-size:11px;color:rgba(0,0,0,0.55);margin-top:6px;">Present this code at the airport check-in counter</div>
    </div>
    ` : ""}

    ${data.ticketNumber ? `
    <div style="background:#1B2B5E;border-radius:12px;padding:14px 24px;text-align:center;margin-bottom:20px;">
      <div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;font-weight:700;">E-Ticket Number</div>
      <div style="font-size:22px;font-weight:800;color:#C9A84C;letter-spacing:4px;margin-top:6px;font-family:monospace;">${data.ticketNumber}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:6px;">Electronic ticket issued by the airline</div>
    </div>
    ` : ""}

    <div class="section-title">✈ Outbound Flight</div>
    <div class="card">
      <div class="flight-route">
        <div>
          <div class="airport-code">${data.origin}</div>
          <div class="airport-name">${data.originCity}</div>
        </div>
        <div class="flight-arrow">→</div>
        <div style="text-align:right">
          <div class="airport-code">${data.destination}</div>
          <div class="airport-name">${data.destinationCity}</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-item"><label>Date</label><span>${data.departureDate}</span></div>
        <div class="info-item"><label>Departure</label><span>${data.departureTime}</span></div>
        <div class="info-item"><label>Arrival</label><span>${data.arrivalTime}</span></div>
        <div class="info-item"><label>Flight</label><span>${data.airline} ${data.flightNumber}</span></div>
        <div class="info-item"><label>Class</label><span>${data.cabinClass}</span></div>
        <div class="info-item"><label>Passengers</label><span>${data.passengers} Adult${data.passengers > 1 ? "s" : ""}${data.children > 0 ? ` + ${data.children} Child${data.children > 1 ? "ren" : ""}` : ""}${data.infants > 0 ? ` + ${data.infants} Infant${data.infants > 1 ? "s" : ""}` : ""}</span></div>
      </div>
    </div>

    ${data.tripType === "round-trip" && data.returnDate ? `
    <div class="section-title">↩ Return Flight</div>
    <div class="card">
      <div class="flight-route">
        <div>
          <div class="airport-code">${data.destination}</div>
          <div class="airport-name">${data.destinationCity}</div>
        </div>
        <div class="flight-arrow">→</div>
        <div style="text-align:right">
          <div class="airport-code">${data.origin}</div>
          <div class="airport-name">${data.originCity}</div>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-item"><label>Return Date</label><span>${data.returnDate}</span></div>
        <div class="info-item"><label>Trip Type</label><span>Round Trip</span></div>
      </div>
    </div>
    ` : ""}

    <div class="section-title">💳 Payment Summary</div>
    <div class="card">
      <div class="price-row"><span>Base Fare</span><span>${data.totalPrice}</span></div>
      <div class="price-row"><span>Taxes & Fees</span><span>Included</span></div>
      <div class="price-row"><span><strong>Total Paid</strong></span><span><strong>${data.totalPrice} ${data.currency}</strong></span></div>
    </div>

    <div class="notice">
      ⚠ Please arrive at the airport at least 2 hours before departure. Carry a valid ID or passport.
    </div>
  `;
  return baseLayout(content, `Flight Ticket — ${data.bookingRef}`);
}

// ─── Hotel Confirmation Template ──────────────────────────────────────────────
export interface HotelConfirmationData {
  guestName: string;
  guestEmail: string;
  bookingRef: string;
  pnr?: string;
  ticketNumber?: string;
  hotelName: string;
  hotelCity: string;
  hotelCountry: string;
  stars: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  guests: number;
  children: number;
  totalPrice: string;
  currency: string;
}

function hotelConfirmationHtml(data: HotelConfirmationData): string {
  const starsStr = "★".repeat(data.stars) + "☆".repeat(5 - data.stars);
  const content = `
    <p style="font-size:16px; margin-bottom:24px;">
      Dear <strong>${data.guestName}</strong>,<br/>
      Your hotel booking has been <span class="badge">CONFIRMED</span>
    </p>

    <div class="ref-box">
      <div class="ref-label">Booking Reference</div>
      <div class="ref-code">${data.bookingRef}</div>
    </div>

    ${data.pnr ? `
    <div style="background:#C9A84C;border-radius:12px;padding:18px 24px;text-align:center;margin-bottom:20px;">
      <div style="font-size:11px;color:rgba(0,0,0,0.6);letter-spacing:2px;text-transform:uppercase;font-weight:700;">Booking PNR</div>
      <div style="font-size:36px;font-weight:900;color:#1B2B5E;letter-spacing:8px;margin-top:6px;font-family:monospace;">${data.pnr}</div>
      <div style="font-size:11px;color:rgba(0,0,0,0.55);margin-top:6px;">Present this code at hotel reception</div>
    </div>
    ` : ""}

    <div class="section-title">🏨 Hotel Details</div>
    <div class="card">
      <div class="hotel-name">${data.hotelName}</div>
      <div class="stars">${starsStr}</div>
      <div class="hotel-location">📍 ${data.hotelCity}, ${data.hotelCountry}</div>
      <div class="divider"></div>
      <div class="info-grid">
        <div class="info-item"><label>Check-In</label><span>${data.checkIn}</span></div>
        <div class="info-item"><label>Check-Out</label><span>${data.checkOut}</span></div>
        <div class="info-item"><label>Duration</label><span>${data.nights} Night${data.nights > 1 ? "s" : ""}</span></div>
        <div class="info-item"><label>Room Type</label><span>${data.roomType}</span></div>
        <div class="info-item"><label>Guests</label><span>${data.guests} Adult${data.guests > 1 ? "s" : ""}${data.children > 0 ? ` + ${data.children} Child${data.children > 1 ? "ren" : ""}` : ""}</span></div>
      </div>
    </div>

    <div class="section-title">💳 Payment Summary</div>
    <div class="card">
      <div class="price-row"><span>Room Rate (${data.nights} night${data.nights > 1 ? "s" : ""})</span><span>${data.totalPrice}</span></div>
      <div class="price-row"><span>Taxes & Fees</span><span>Included</span></div>
      <div class="price-row"><span><strong>Total Paid</strong></span><span><strong>${data.totalPrice} ${data.currency}</strong></span></div>
    </div>

    <div class="notice">
      ⚠ Standard check-in time is 14:00. Please present this confirmation and a valid ID at the hotel reception.
    </div>
  `;
  return baseLayout(content, `Hotel Booking — ${data.bookingRef}`);
}

// ─── PNR Update Email ────────────────────────────────────────────────────────

export interface PnrUpdateData {
  passengerName: string;
  passengerEmail: string;
  bookingRef: string;
  pnr: string;
  ticketNumber?: string;
  origin?: string;
  destination?: string;
  departureDate?: string;
  airline?: string;
  flightNumber?: string;
}

function pnrUpdateHtml(data: PnrUpdateData): string {
  const content = `
    <p style="font-size:16px; margin-bottom:24px;">
      Dear <strong>${data.passengerName}</strong>,<br/>
      Your flight booking PNR has been <span class="badge">UPDATED</span>
    </p>

    <div class="ref-box">
      <div class="ref-label">Booking Reference</div>
      <div class="ref-code">${data.bookingRef}</div>
    </div>

    <div style="background:#C9A84C;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
      <div style="font-size:11px;color:rgba(0,0,0,0.6);letter-spacing:2px;text-transform:uppercase;font-weight:700;">PNR — Airline Record Locator</div>
      <div style="font-size:42px;font-weight:900;color:#1B2B5E;letter-spacing:10px;margin-top:8px;font-family:monospace;">${data.pnr}</div>
      <div style="font-size:12px;color:rgba(0,0,0,0.6);margin-top:8px;">Present this code at the airport check-in counter</div>
    </div>

    ${data.ticketNumber ? `
    <div style="background:#1B2B5E;border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:20px;">
      <div style="font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;font-weight:700;">Ticket Number</div>
      <div style="font-size:28px;font-weight:800;color:#C9A84C;letter-spacing:4px;margin-top:8px;font-family:monospace;">${data.ticketNumber}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:8px;">Your airline e-ticket number</div>
    </div>
    ` : ""}

    ${data.origin && data.destination ? `
    <div class="card">
      <div class="flight-route">
        <div><div class="airport-code">${data.origin}</div></div>
        <div class="flight-arrow">→</div>
        <div style="text-align:right"><div class="airport-code">${data.destination}</div></div>
      </div>
      ${data.airline ? `<div class="info-grid">
        <div class="info-item"><label>Airline</label><span>${data.airline} ${data.flightNumber ?? ""}</span></div>
        ${data.departureDate ? `<div class="info-item"><label>Date</label><span>${data.departureDate}</span></div>` : ""}
      </div>` : ""}
    </div>
    ` : ""}

    <div class="notice">
      ⚠ Please save this PNR code${data.ticketNumber ? ' and ticket number' : ''}. You will need it for check-in at the airport. If you have any questions, contact us at ${COMPANY.phone}.
    </div>
  `;
  return baseLayout(content, `PNR Updated — ${data.bookingRef}`);
}

export async function sendPnrUpdateEmail(data: PnrUpdateData): Promise<boolean> {
  const transporter = getTransporter();
  const html = pnrUpdateHtml(data);

  if (!transporter) {
    console.log(`[Email] Would send PNR update to: ${data.passengerEmail}`);
    console.log(`[Email] PNR: ${data.pnr} for booking ${data.bookingRef}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Royal Voyage ✈" <${process.env.EMAIL_USER}>`,
      to: data.passengerEmail,
      subject: `✈ ${data.ticketNumber ? 'PNR & Ticket' : 'PNR'} Updated — ${data.bookingRef} | Royal Voyage`,
      html,
    });
    console.log(`[Email] ✅ PNR update email sent to ${data.passengerEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] ❌ Failed to send PNR update email:", error);
    return false;
  }
}

// ─── Send Functions ───────────────────────────────────────────────────────────

export async function sendFlightTicket(data: FlightTicketData): Promise<boolean> {
  const transporter = getTransporter();
  const html = flightTicketHtml(data);

  // Generate PDF attachment
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateFlightTicketPDF(data);
  } catch (err) {
    console.warn("[Email] PDF generation failed, sending without attachment:", err);
  }

  if (!transporter) {
    console.log(`[Email] Would send flight ticket to: ${data.passengerEmail}`);
    console.log(`[Email] Subject: ✈ Your Flight Ticket — ${data.bookingRef} | Royal Voyage`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Royal Voyage ✈" <${process.env.EMAIL_USER}>`,
      to: data.passengerEmail,
      subject: `✈ Your Flight Ticket — ${data.bookingRef} | Royal Voyage`,
      html,
      attachments: pdfBuffer ? [{
        filename: `RoyalVoyage_Ticket_${data.bookingRef}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }] : [],
    });
    console.log(`[Email] ✅ Flight ticket sent to ${data.passengerEmail} (PDF: ${pdfBuffer ? "attached" : "skipped"})`);
    return true;
  } catch (error) {
    console.error("[Email] ❌ Failed to send flight ticket:", error);
    return false;
  }
}

export async function sendHotelConfirmation(data: HotelConfirmationData): Promise<boolean> {
  const transporter = getTransporter();
  const html = hotelConfirmationHtml(data);

  // Generate PDF attachment
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateHotelConfirmationPDF(data);
  } catch (err) {
    console.warn("[Email] PDF generation failed, sending without attachment:", err);
  }

  if (!transporter) {
    console.log(`[Email] Would send hotel confirmation to: ${data.guestEmail}`);
    console.log(`[Email] Subject: 🏨 Hotel Booking Confirmed — ${data.bookingRef} | Royal Voyage`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Royal Voyage ✈" <${process.env.EMAIL_USER}>`,
      to: data.guestEmail,
      subject: `🏨 Hotel Booking Confirmed — ${data.bookingRef} | Royal Voyage`,
      html,
      attachments: pdfBuffer ? [{
        filename: `RoyalVoyage_Hotel_${data.bookingRef}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }] : [],
    });
    console.log(`[Email] ✅ Hotel confirmation sent to ${data.guestEmail} (PDF: ${pdfBuffer ? "attached" : "skipped"})`);
    return true;
  } catch (error) {
    console.error("[Email] ❌ Failed to send hotel confirmation:", error);
    return false;
  }
}

// ─── Payment Confirmation Email ───────────────────────────────────────────────

export type PaymentConfirmationData = {
  passengerName: string;
  passengerEmail: string;
  bookingRef: string;
  pnr?: string;
  bookingType: "flight" | "hotel" | "activity";
  // Flight fields
  origin?: string;
  destination?: string;
  airline?: string;
  flightNumber?: string;
  departureDate?: string;
  departureTime?: string;
  // Hotel fields
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  // Common
  totalAmount?: string;
  paymentMethod?: string;
  confirmedAt?: string;
};

function paymentConfirmationHtml(data: PaymentConfirmationData): string {
  const isHotel = data.bookingType === "hotel";
  const content = `
    <p style="font-size:16px; margin-bottom:24px;">
      Dear <strong>${data.passengerName}</strong>,<br/>
      Great news! Your payment has been <span class="badge" style="background:#22C55E;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">CONFIRMED ✅</span> by Royal Voyage.
    </p>

    <div class="ref-box">
      <div class="ref-label">Booking Reference</div>
      <div class="ref-code">${data.bookingRef}</div>
      ${data.confirmedAt ? `<div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:6px;">Confirmed on ${data.confirmedAt}</div>` : ""}
    </div>

    ${data.pnr ? `
    <div style="background:#C9A84C;border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:20px;">
      <div style="font-size:11px;color:rgba(0,0,0,0.6);letter-spacing:2px;text-transform:uppercase;font-weight:700;">PNR — Airline Record Locator</div>
      <div style="font-size:38px;font-weight:900;color:#1B2B5E;letter-spacing:8px;margin-top:8px;font-family:monospace;">${data.pnr}</div>
      <div style="font-size:12px;color:rgba(0,0,0,0.6);margin-top:6px;">Present this code at the airport check-in counter</div>
    </div>` : ""}

    <div class="card">
      <div class="section-title">${isHotel ? "🏨 Hotel Details" : "✈ Flight Details"}</div>
      ${isHotel ? `
        <div class="info-grid">
          <div class="info-item"><label>Hotel</label><span>${data.hotelName ?? "—"}</span></div>
          <div class="info-item"><label>Check-In</label><span>${data.checkIn ?? "—"}</span></div>
          <div class="info-item"><label>Check-Out</label><span>${data.checkOut ?? "—"}</span></div>
          ${data.totalAmount ? `<div class="info-item"><label>Total Paid</label><span style="color:#22C55E;font-weight:800;">${data.totalAmount}</span></div>` : ""}
        </div>
      ` : `
        <div class="flight-route">
          <div><div class="airport-code">${data.origin ?? "—"}</div></div>
          <div class="flight-arrow">→</div>
          <div style="text-align:right"><div class="airport-code">${data.destination ?? "—"}</div></div>
        </div>
        <div class="info-grid">
          ${data.airline ? `<div class="info-item"><label>Airline</label><span>${data.airline} ${data.flightNumber ?? ""}</span></div>` : ""}
          ${data.departureDate ? `<div class="info-item"><label>Date</label><span>${data.departureDate}</span></div>` : ""}
          ${data.departureTime ? `<div class="info-item"><label>Departure</label><span>${data.departureTime}</span></div>` : ""}
          ${data.totalAmount ? `<div class="info-item"><label>Total Paid</label><span style="color:#22C55E;font-weight:800;">${data.totalAmount}</span></div>` : ""}
        </div>
      `}
    </div>

    ${data.paymentMethod ? `
    <div class="card" style="background:#f0fdf4;border-color:#bbf7d0;">
      <div class="section-title" style="color:#22C55E;">💳 Payment Details</div>
      <div class="info-grid">
        <div class="info-item"><label>Method</label><span>${data.paymentMethod}</span></div>
        <div class="info-item"><label>Status</label><span style="color:#22C55E;font-weight:700;">✅ Confirmed</span></div>
      </div>
    </div>` : ""}

    <div class="notice">
      ✅ Your booking is now fully confirmed. Thank you for choosing Royal Voyage!<br/>
      For assistance: ${COMPANY.phone} | ${COMPANY.email} | ${COMPANY.address}
    </div>
  `;
  return baseLayout(content, `Payment Confirmed — ${data.bookingRef}`);
}

export async function sendPaymentConfirmationEmail(data: PaymentConfirmationData): Promise<boolean> {
  const transporter = getTransporter();
  const html = paymentConfirmationHtml(data);

  if (!transporter) {
    console.log(`[Email] Would send payment confirmation to: ${data.passengerEmail}`);
    console.log(`[Email] Booking: ${data.bookingRef} | Type: ${data.bookingType}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Royal Voyage ✈" <${process.env.EMAIL_USER}>`,
      to: data.passengerEmail,
      subject: `✅ Payment Confirmed — ${data.bookingRef} | Royal Voyage`,
      html,
    });
    console.log(`[Email] ✅ Payment confirmation sent to ${data.passengerEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] ❌ Failed to send payment confirmation:", error);
    return false;
  }
}

// ─── Cancellation Email ──────────────────────────────────────────────────────

export type CancellationEmailData = {
  passengerEmail: string;
  passengerName: string;
  bookingRef: string;
  pnr?: string;
  route?: string; // e.g. "NKC → CDG"
  date?: string;
  refundAmount?: string;
  refundCurrency?: string;
  reason?: string;
};

function cancellationHtml(data: CancellationEmailData): string {
  const content = `
    <div class="body">
      <h2 style="color: #EF4444; margin-bottom: 8px;">Booking Cancelled</h2>
      <p style="color: #687076; margin-bottom: 24px;">
        Dear ${data.passengerName}, your booking has been cancelled.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; color: #687076;">Booking Reference</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-weight: 700; text-align: right;">${data.bookingRef}</td>
        </tr>
        ${data.pnr ? `<tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; color: #687076;">PNR</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-weight: 700; text-align: right;">${data.pnr}</td>
        </tr>` : ""}
        ${data.route ? `<tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; color: #687076;">Route</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-weight: 700; text-align: right;">${data.route}</td>
        </tr>` : ""}
        ${data.date ? `<tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; color: #687076;">Date</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-weight: 700; text-align: right;">${data.date}</td>
        </tr>` : ""}
        ${data.refundAmount ? `<tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; color: #687076;">Refund Amount</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-weight: 700; color: #22C55E; text-align: right;">${data.refundCurrency || ""} ${data.refundAmount}</td>
        </tr>` : ""}
        ${data.reason ? `<tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; color: #687076;">Reason</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; text-align: right;">${data.reason}</td>
        </tr>` : ""}
      </table>

      <p style="color: #687076; font-size: 14px;">
        If you have any questions, please contact us at <strong>${COMPANY.phone}</strong> or <strong>${COMPANY.email}</strong>.
      </p>
    </div>
    <div class="footer">
      <p>${COMPANY.name} — ${COMPANY.address}</p>
      <p>${COMPANY.phone} | ${COMPANY.email}</p>
    </div>
  `;
  return baseLayout(content, `Booking Cancelled — ${data.bookingRef}`);
}

export async function sendCancellationEmail(data: CancellationEmailData): Promise<boolean> {
  const transporter = getTransporter();
  const html = cancellationHtml(data);

  if (!transporter) {
    console.log(`[Email] Would send cancellation email to: ${data.passengerEmail}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Royal Voyage ✈" <${process.env.EMAIL_USER}>`,
      to: data.passengerEmail,
      subject: `❌ Booking Cancelled — ${data.bookingRef} | Royal Voyage`,
      html,
    });
    console.log(`[Email] ✅ Cancellation email sent to ${data.passengerEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] ❌ Failed to send cancellation email:", error);
    return false;
  }
}

// ─── Hold Confirmation Email ─────────────────────────────────────────────────

export type HoldConfirmationEmailData = {
  passengerEmail: string;
  passengerName: string;
  bookingRef: string;
  pnr: string;
  ticketNumber?: string;
  route?: string;
  date?: string;
  totalAmount: string;
  currency: string;
};

function holdConfirmationHtml(data: HoldConfirmationEmailData): string {
  const content = `
    <div class="body">
      <h2 style="color: #22C55E; margin-bottom: 8px;">✅ Booking Confirmed!</h2>
      <p style="color: #687076; margin-bottom: 24px;">
        Dear ${data.passengerName}, your hold booking has been confirmed and paid. Your ticket has been issued.
      </p>

      <div style="background: #F0FDF4; border: 2px solid #22C55E; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <p style="color: #687076; font-size: 12px; margin-bottom: 4px;">PNR (Booking Reference)</p>
        <p style="font-size: 28px; font-weight: 800; color: #22C55E; letter-spacing: 4px; margin-bottom: 8px;">${data.pnr}</p>
        <p style="color: #687076; font-size: 12px;">Keep this number for check-in at the airport</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; color: #687076;">Reference</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-weight: 700; text-align: right;">${data.bookingRef}</td>
        </tr>
        ${data.ticketNumber ? `<tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; color: #687076;">Ticket Number</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-weight: 700; text-align: right;">${data.ticketNumber}</td>
        </tr>` : ""}
        ${data.route ? `<tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; color: #687076;">Route</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-weight: 700; text-align: right;">${data.route}</td>
        </tr>` : ""}
        ${data.date ? `<tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; color: #687076;">Date</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-weight: 700; text-align: right;">${data.date}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; color: #687076;">Amount Paid</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; font-weight: 700; color: #22C55E; text-align: right;">${data.currency} ${data.totalAmount}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; color: #687076;">Status</td>
          <td style="padding: 12px 16px; font-weight: 700; color: #22C55E; text-align: right;">✅ Confirmed & Paid</td>
        </tr>
      </table>

      <p style="color: #687076; font-size: 14px;">
        Your flight ticket will be sent separately. For any questions, contact us at <strong>${COMPANY.phone}</strong> or <strong>${COMPANY.email}</strong>.
      </p>
    </div>
    <div class="footer">
      <p>${COMPANY.name} — ${COMPANY.address}</p>
      <p>${COMPANY.phone} | ${COMPANY.email}</p>
    </div>
  `;
  return baseLayout(content, `Booking Confirmed — ${data.pnr}`);
}

export async function sendHoldConfirmationEmail(data: HoldConfirmationEmailData): Promise<boolean> {
  const transporter = getTransporter();
  const html = holdConfirmationHtml(data);

  if (!transporter) {
    console.log(`[Email] Would send hold confirmation to: ${data.passengerEmail}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"Royal Voyage ✈" <${process.env.EMAIL_USER}>`,
      to: data.passengerEmail,
      subject: `✅ Booking Confirmed — PNR: ${data.pnr} | Royal Voyage`,
      html,
    });
    console.log(`[Email] ✅ Hold confirmation email sent to ${data.passengerEmail}`);
    return true;
  } catch (error) {
    console.error("[Email] ❌ Failed to send hold confirmation email:", error);
    return false;
  }
}

// ─── Employee Welcome Email ───────────────────────────────────────────────────

export interface EmployeeWelcomeData {
  fullName: string;
  email: string;
  password: string;
  role: string;
  department?: string;
}

const ROLE_LABELS_AR: Record<string, string> = {
  manager: "مدير",
  accountant: "محاسب",
  booking_agent: "وكيل حجز",
  support: "دعم فني",
};

function employeeWelcomeHtml(data: EmployeeWelcomeData): string {
  const roleLabel = ROLE_LABELS_AR[data.role] || data.role;
  const content = `
    <div style="text-align:center;padding:24px 0 16px;">
      <h1 style="color:#1B2B5E;font-size:22px;margin:0 0 6px;">مرحباً بك في Royal Voyage</h1>
      <p style="color:#687076;font-size:14px;margin:0;">تم إنشاء حسابك بنجاح — يرجى الاحتفاظ بهذه البيانات</p>
    </div>
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:24px;margin:20px 0;direction:rtl;text-align:right;">
      <h2 style="color:#1B2B5E;font-size:15px;margin:0 0 16px;border-bottom:1px solid #E2E8F0;padding-bottom:10px;">بيانات تسجيل الدخول</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:7px 0;color:#687076;font-size:13px;width:40%;">الاسم الكامل</td><td style="padding:7px 0;color:#11181C;font-size:13px;font-weight:600;">${data.fullName}</td></tr>
        <tr><td style="padding:7px 0;color:#687076;font-size:13px;">البريد الإلكتروني</td><td style="padding:7px 0;color:#1B2B5E;font-size:13px;font-weight:700;">${data.email}</td></tr>
        <tr><td style="padding:7px 0;color:#687076;font-size:13px;">كلمة المرور</td><td style="padding:7px 0;font-size:18px;font-weight:900;color:#1B2B5E;letter-spacing:3px;font-family:monospace;">${data.password}</td></tr>
        <tr><td style="padding:7px 0;color:#687076;font-size:13px;">المنصب</td><td style="padding:7px 0;color:#11181C;font-size:13px;font-weight:600;">${roleLabel}</td></tr>
        ${data.department ? `<tr><td style="padding:7px 0;color:#687076;font-size:13px;">القسم</td><td style="padding:7px 0;color:#11181C;font-size:13px;font-weight:600;">${data.department}</td></tr>` : ""}
      </table>
    </div>
    <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:14px 16px;margin:16px 0;direction:rtl;text-align:right;">
      <p style="color:#92400E;font-size:13px;margin:0;">⚠️ <strong>تنبيه أمني:</strong> يرجى تغيير كلمة المرور فور تسجيل الدخول لأول مرة. لا تشارك بيانات دخولك مع أي شخص.</p>
    </div>
    <div style="text-align:center;margin:20px 0;">
      <p style="color:#687076;font-size:12px;">للمساعدة: <a href="mailto:${COMPANY.email}" style="color:#1B2B5E;">${COMPANY.email}</a> | <a href="tel:${COMPANY.phone}" style="color:#1B2B5E;">${COMPANY.phone}</a></p>
    </div>
  `;
  return baseLayout(content, `مرحباً بك في ${COMPANY.name}`);
}

export async function sendEmployeeWelcomeEmail(data: EmployeeWelcomeData): Promise<boolean> {
  const transporter = getTransporter();
  const html = employeeWelcomeHtml(data);
  if (!transporter) {
    console.log(`[Email] Would send employee welcome to: ${data.email} | Role: ${data.role} | Password: ${data.password}`);
    return true;
  }
  try {
    await transporter.sendMail({
      from: `"Royal Voyage — الإدارة" <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject: `🎉 مرحباً بك في Royal Voyage — بيانات حسابك`,
      html,
    });
    console.log(`[Email] ✅ Employee welcome email sent to ${data.email}`);
    return true;
  } catch (error) {
    console.error("[Email] ❌ Failed to send employee welcome email:", error);
    return false;
  }
}
