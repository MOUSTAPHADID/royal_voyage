/**
 * Royal Service — Client-side PDF Ticket Generator
 * Uses expo-print to generate a professional PDF ticket locally on the device.
 * Uses expo-sharing to share the PDF via WhatsApp or other apps.
 */
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { Platform, Linking, Alert } from "react-native";
import { COMPANY_INFO } from "@/lib/ticket-generator";

export interface FlightPDFData {
  reference: string;
  pnr?: string;
  passengerName: string;
  dateOfBirth?: string;
  passportNumber?: string;
  nationality?: string;
  email: string;
  phone?: string;
  airline: string;
  flightNumber: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cabinClass: string;
  adults: number;
  children: number;
  infants: number;
  tripType: "oneway" | "roundtrip";
  returnDate?: string;
  totalPrice: string;
  currency: string;
  issueDate: string;
  seatNumber?: string;
  gate?: string;
  boardingGroup?: string;
  meal?: string;
}

export interface HotelPDFData {
  reference: string;
  guestName: string;
  email: string;
  phone?: string;
  hotelName: string;
  hotelCity: string;
  hotelCountry: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  adults: number;
  children: number;
  infants: number;
  totalPrice: string;
  currency: string;
  issueDate: string;
}

function generateFlightTicketHTML(data: FlightPDFData): string {
  const passengerCount =
    data.adults + data.children > 1
      ? `${data.adults} Adult${data.adults > 1 ? "s" : ""}${data.children > 0 ? ` + ${data.children} Child${data.children > 1 ? "ren" : ""}` : ""}${data.infants > 0 ? ` + ${data.infants} Infant${data.infants > 1 ? "s" : ""}` : ""}`
      : `1 Adult${data.infants > 0 ? ` + ${data.infants} Infant${data.infants > 1 ? "s" : ""}` : ""}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f0f4f8; padding: 20px; }
  .ticket { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #0B1E3F, #1A3A6B); padding: 24px; text-align: center; color: white; }
  .header h1 { font-size: 22px; margin-bottom: 4px; letter-spacing: 2px; }
  .header .subtitle { font-size: 13px; opacity: 0.8; }
  .header .plane { font-size: 28px; margin-bottom: 8px; }
  .section { padding: 16px 24px; border-bottom: 1px dashed #e0e0e0; }
  .section:last-child { border-bottom: none; }
  .section-title { font-size: 11px; font-weight: 700; color: #0B1E3F; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #C5A028; display: inline-block; }
  .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .value { font-size: 14px; font-weight: 600; color: #1a1a1a; }
  .route { display: flex; align-items: center; justify-content: center; padding: 20px; gap: 20px; }
  .route .city { text-align: center; }
  .route .code { font-size: 28px; font-weight: 800; color: #0B1E3F; }
  .route .name { font-size: 11px; color: #666; margin-top: 2px; }
  .route .arrow { font-size: 24px; color: #C5A028; }
  .highlight { background: #f8f9ff; padding: 16px 24px; }
  .price-box { background: linear-gradient(135deg, #0B1E3F, #1A3A6B); color: white; padding: 16px 24px; text-align: center; }
  .price-box .amount { font-size: 26px; font-weight: 800; color: #C5A028; }
  .price-box .label { color: rgba(255,255,255,0.7); }
  .footer { background: #f8f9ff; padding: 16px 24px; text-align: center; font-size: 11px; color: #888; }
  .footer .company { font-weight: 700; color: #0B1E3F; font-size: 13px; margin-bottom: 4px; }
  .badge { display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .qr-placeholder { width: 80px; height: 80px; background: #f0f0f0; border: 2px dashed #ccc; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999; margin: 0 auto; }
</style>
</head>
<body>
<div class="ticket">
  <div class="header">
    <div class="plane">✈</div>
    <h1>ROYAL VOYAGE</h1>
    <div class="subtitle">ELECTRONIC TICKET / BOARDING PASS</div>
  </div>

  <div class="route">
    <div class="city">
      <div class="code">${data.originCode}</div>
      <div class="name">${data.origin}</div>
    </div>
    <div class="arrow">✈ ─────</div>
    <div class="city">
      <div class="code">${data.destinationCode}</div>
      <div class="name">${data.destination}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Booking Information</div>
    <div class="grid-2">
      <div><div class="label">Booking Ref</div><div class="value">${data.reference}</div></div>
      ${data.pnr ? `<div><div class="label">Airline PNR</div><div class="value">${data.pnr}</div></div>` : ""}
      <div><div class="label">Issue Date</div><div class="value">${data.issueDate}</div></div>
      <div><div class="label">Trip Type</div><div class="value"><span class="badge">${data.tripType === "roundtrip" ? "Round Trip" : "One Way"}</span></div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Passenger Details</div>
    <div class="grid-2">
      <div><div class="label">Passenger Name</div><div class="value">${data.passengerName.toUpperCase()}</div></div>
      ${data.passportNumber ? `<div><div class="label">Passport</div><div class="value">${data.passportNumber.toUpperCase()}</div></div>` : ""}
      ${data.nationality ? `<div><div class="label">Nationality</div><div class="value">${data.nationality.toUpperCase()}</div></div>` : ""}
      ${data.dateOfBirth ? `<div><div class="label">Date of Birth</div><div class="value">${data.dateOfBirth}</div></div>` : ""}
      <div><div class="label">Email</div><div class="value" style="font-size:12px">${data.email}</div></div>
      <div><div class="label">Passengers</div><div class="value">${passengerCount}</div></div>
    </div>
  </div>

  <div class="section highlight">
    <div class="section-title">Flight Details</div>
    <div class="grid-3">
      <div><div class="label">Airline</div><div class="value">${data.airline}</div></div>
      <div><div class="label">Flight</div><div class="value">${data.flightNumber}</div></div>
      <div><div class="label">Class</div><div class="value">${data.cabinClass}</div></div>
    </div>
    <div style="height:8px"></div>
    <div class="grid-3">
      <div><div class="label">Departure</div><div class="value">${data.departureTime}</div></div>
      <div><div class="label">Arrival</div><div class="value">${data.arrivalTime}</div></div>
      <div><div class="label">Duration</div><div class="value">${data.duration}</div></div>
    </div>
    ${data.seatNumber || data.gate || data.boardingGroup ? `
    <div style="height:8px"></div>
    <div class="grid-3">
      ${data.seatNumber ? `<div><div class="label">Seat</div><div class="value">${data.seatNumber}</div></div>` : "<div></div>"}
      ${data.gate ? `<div><div class="label">Gate</div><div class="value">${data.gate}</div></div>` : "<div></div>"}
      ${data.boardingGroup ? `<div><div class="label">Boarding</div><div class="value">Group ${data.boardingGroup}</div></div>` : "<div></div>"}
    </div>` : ""}
    ${data.meal ? `
    <div style="height:8px"></div>
    <div class="grid-3">
      <div><div class="label">Meal</div><div class="value">${data.meal}</div></div>
      <div></div><div></div>
    </div>` : ""}
  </div>

  ${data.tripType === "roundtrip" && data.returnDate ? `
  <div class="section">
    <div class="section-title">Return Flight</div>
    <div class="grid-2">
      <div><div class="label">Return Date</div><div class="value">${data.returnDate}</div></div>
      <div><div class="label">Route</div><div class="value">${data.destinationCode} → ${data.originCode}</div></div>
    </div>
  </div>` : ""}

  <div class="price-box">
    <div class="label">TOTAL AMOUNT PAID</div>
    <div class="amount">${data.totalPrice}</div>
  </div>

  <div class="footer">
    <div class="company">${COMPANY_INFO.name}</div>
    <div>${COMPANY_INFO.address}</div>
    <div>${COMPANY_INFO.phone} | ${COMPANY_INFO.email}</div>
    <div style="margin-top:8px; color:#C5A028; font-weight:600;">Thank you for choosing Royal Service!</div>
  </div>
</div>
</body>
</html>`;
}

function generateHotelVoucherHTML(data: HotelPDFData): string {
  const guestCount =
    data.adults + data.children > 1
      ? `${data.adults} Adult${data.adults > 1 ? "s" : ""}${data.children > 0 ? ` + ${data.children} Child${data.children > 1 ? "ren" : ""}` : ""}${data.infants > 0 ? ` + ${data.infants} Infant${data.infants > 1 ? "s" : ""}` : ""}`
      : `1 Adult${data.infants > 0 ? ` + ${data.infants} Infant${data.infants > 1 ? "s" : ""}` : ""}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f0f4f8; padding: 20px; }
  .ticket { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #0B1E3F, #1A3A6B); padding: 24px; text-align: center; color: white; }
  .header h1 { font-size: 22px; margin-bottom: 4px; letter-spacing: 2px; }
  .header .subtitle { font-size: 13px; opacity: 0.8; }
  .header .icon { font-size: 28px; margin-bottom: 8px; }
  .section { padding: 16px 24px; border-bottom: 1px dashed #e0e0e0; }
  .section:last-child { border-bottom: none; }
  .section-title { font-size: 11px; font-weight: 700; color: #0B1E3F; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #C5A028; display: inline-block; }
  .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .value { font-size: 14px; font-weight: 600; color: #1a1a1a; }
  .hotel-name { text-align: center; padding: 20px; }
  .hotel-name .name { font-size: 24px; font-weight: 800; color: #0B1E3F; }
  .hotel-name .location { font-size: 13px; color: #666; margin-top: 4px; }
  .highlight { background: #f8f9ff; padding: 16px 24px; }
  .price-box { background: linear-gradient(135deg, #0B1E3F, #1A3A6B); color: white; padding: 16px 24px; text-align: center; }
  .price-box .amount { font-size: 26px; font-weight: 800; color: #C5A028; }
  .price-box .label { color: rgba(255,255,255,0.7); }
  .footer { background: #f8f9ff; padding: 16px 24px; text-align: center; font-size: 11px; color: #888; }
  .footer .company { font-weight: 700; color: #0B1E3F; font-size: 13px; margin-bottom: 4px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .dates { display: flex; align-items: center; justify-content: center; padding: 16px; gap: 16px; }
  .dates .date-box { text-align: center; background: #f8f9ff; padding: 12px 20px; border-radius: 12px; }
  .dates .date-box .day { font-size: 20px; font-weight: 800; color: #0B1E3F; }
  .dates .date-box .full { font-size: 11px; color: #666; }
  .dates .arrow { font-size: 20px; color: #C5A028; }
</style>
</head>
<body>
<div class="ticket">
  <div class="header">
    <div class="icon">🏨</div>
    <h1>ROYAL VOYAGE</h1>
    <div class="subtitle">HOTEL RESERVATION VOUCHER</div>
  </div>

  <div class="hotel-name">
    <div class="name">${data.hotelName}</div>
    <div class="location">${data.hotelCity}, ${data.hotelCountry}</div>
  </div>

  <div class="section">
    <div class="section-title">Booking Information</div>
    <div class="grid-2">
      <div><div class="label">Booking Ref</div><div class="value">${data.reference}</div></div>
      <div><div class="label">Issue Date</div><div class="value">${data.issueDate}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Guest Details</div>
    <div class="grid-2">
      <div><div class="label">Guest Name</div><div class="value">${data.guestName.toUpperCase()}</div></div>
      <div><div class="label">Email</div><div class="value" style="font-size:12px">${data.email}</div></div>
      ${data.phone ? `<div><div class="label">Phone</div><div class="value">${data.phone}</div></div>` : ""}
      <div><div class="label">Guests</div><div class="value">${guestCount}</div></div>
    </div>
  </div>

  <div class="section highlight">
    <div class="section-title">Stay Details</div>
    <div class="grid-2">
      <div><div class="label">Check-in</div><div class="value">${data.checkIn}</div></div>
      <div><div class="label">Check-out</div><div class="value">${data.checkOut}</div></div>
      <div><div class="label">Room Type</div><div class="value">${data.roomType}</div></div>
      <div></div>
    </div>
  </div>

  <div class="price-box">
    <div class="label">TOTAL AMOUNT PAID</div>
    <div class="amount">${data.totalPrice}</div>
  </div>

  <div class="footer">
    <div class="company">${COMPANY_INFO.name}</div>
    <div>${COMPANY_INFO.address}</div>
    <div>${COMPANY_INFO.phone} | ${COMPANY_INFO.email}</div>
    <div style="margin-top:8px; color:#C5A028; font-weight:600;">Thank you for choosing Royal Service!</div>
  </div>
</div>
</body>
</html>`;
}

/**
 * Generate a flight ticket PDF and share it (via WhatsApp or native share sheet).
 */
export async function shareFlightTicketPDF(data: FlightPDFData, viaWhatsApp = true): Promise<void> {
  try {
    const html = generateFlightTicketHTML(data);
    const { uri } = await Print.printToFileAsync({
      html,
      margins: { left: 10, top: 10, right: 10, bottom: 10 },
    });

    if (viaWhatsApp && Platform.OS !== "web") {
      // Share the PDF file - the share sheet will show WhatsApp as an option
      await shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Send Ticket via WhatsApp",
        UTI: "com.adobe.pdf",
      });
    } else {
      await shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Flight Ticket",
        UTI: "com.adobe.pdf",
      });
    }
  } catch (err) {
    // Fallback to text-based WhatsApp sharing
    if (viaWhatsApp) {
      const { generateFlightTicket } = require("@/lib/ticket-generator");
      const ticketText = generateFlightTicket(data);
      const encoded = encodeURIComponent(ticketText);
      const url = `https://wa.me/?text=${encoded}`;
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert("Error", "Could not open WhatsApp. Please try again.");
      }
    } else {
      Alert.alert("Error", "Could not generate PDF. Please try again.");
    }
  }
}

/**
 * Generate a hotel voucher PDF and share it (via WhatsApp or native share sheet).
 */
export async function shareHotelVoucherPDF(data: HotelPDFData, viaWhatsApp = true): Promise<void> {
  try {
    const html = generateHotelVoucherHTML(data);
    const { uri } = await Print.printToFileAsync({
      html,
      margins: { left: 10, top: 10, right: 10, bottom: 10 },
    });

    if (viaWhatsApp && Platform.OS !== "web") {
      await shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Send Voucher via WhatsApp",
        UTI: "com.adobe.pdf",
      });
    } else {
      await shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Hotel Voucher",
        UTI: "com.adobe.pdf",
      });
    }
  } catch (err) {
    if (viaWhatsApp) {
      const { generateHotelVoucher } = require("@/lib/ticket-generator");
      const voucherText = generateHotelVoucher(data);
      const encoded = encodeURIComponent(voucherText);
      const url = `https://wa.me/?text=${encoded}`;
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert("Error", "Could not open WhatsApp. Please try again.");
      }
    } else {
      Alert.alert("Error", "Could not generate PDF. Please try again.");
    }
  }
}
