/**
 * Royal Service — Ticket Generator
 * Generates a formatted boarding pass / hotel voucher as a shareable text
 * that can be displayed in-app or shared via the native share sheet.
 *
 * Company info:
 *   Phone   : +222 33 70 00 00
 *   Email   : suporte@royalvoyage.online
 *   Address : Tavragh Zeina, Nouakchott, Mauritania
 */

export const COMPANY_INFO = {
  name: "Royal Service",
  phone: "+222 33 70 00 00",
  email: "suporte@royalvoyage.online",
  address: "Tavragh Zeina, Nouakchott, Mauritania",
  website: "www.royal-voyage.mr",
};

export interface FlightTicketData {
  reference: string;
  pnr?: string; // Real PNR from airline (if available)
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
}

export interface HotelVoucherData {
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

function line(char = "─", len = 50): string {
  return char.repeat(len);
}

function center(text: string, width = 50): string {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(pad) + text;
}

/**
 * Generate a formatted flight boarding pass as plain text.
 */
export function generateFlightTicket(data: FlightTicketData): string {
  const passengerCount =
    data.adults + data.children > 1
      ? `${data.adults} Adult${data.adults > 1 ? "s" : ""}${data.children > 0 ? ` + ${data.children} Child${data.children > 1 ? "ren" : ""}` : ""}${data.infants > 0 ? ` + ${data.infants} Infant${data.infants > 1 ? "s" : ""}` : ""}`
      : `1 Adult${data.infants > 0 ? ` + ${data.infants} Infant${data.infants > 1 ? "s" : ""}` : ""}`;

  const ticket = [
    line("═"),
    center("✈  ROYAL VOYAGE  ✈"),
    center("BOARDING PASS"),
    line("═"),
    "",
    `  BOOKING REFERENCE : ${data.reference}`,
    ...(data.pnr ? [`  AIRLINE PNR        : ${data.pnr}`] : []),
    `  ISSUE DATE         : ${data.issueDate}`,
    `  TRIP TYPE          : ${data.tripType === "roundtrip" ? "Round Trip" : "One Way"}`,
    "",
    line("─"),
    center("PASSENGER INFORMATION"),
    line("─"),
    `  NAME               : ${data.passengerName.toUpperCase()}`,
    data.dateOfBirth ? `  DATE OF BIRTH      : ${data.dateOfBirth}` : "",
    data.passportNumber ? `  PASSPORT           : ${data.passportNumber.toUpperCase()}` : "",
    data.nationality ? `  NATIONALITY        : ${data.nationality.toUpperCase()}` : "",
    `  EMAIL              : ${data.email}`,
    data.phone ? `  PHONE              : ${data.phone}` : "",
    `  PASSENGERS         : ${passengerCount}`,
    "",
    line("─"),
    center("OUTBOUND FLIGHT"),
    line("─"),
    `  AIRLINE            : ${data.airline}`,
    `  FLIGHT             : ${data.flightNumber}`,
    `  FROM               : ${data.origin} (${data.originCode})`,
    `  TO                 : ${data.destination} (${data.destinationCode})`,
    `  DEPARTURE          : ${data.departureTime}`,
    `  ARRIVAL            : ${data.arrivalTime}`,
    `  DURATION           : ${data.duration}`,
    `  CABIN CLASS        : ${data.cabinClass.toUpperCase()}`,
    ...(data.tripType === "roundtrip" && data.returnDate
      ? [
          "",
          line("─"),
          center("RETURN FLIGHT"),
          line("─"),
          `  RETURN DATE        : ${data.returnDate}`,
          `  FROM               : ${data.destinationCode} → ${data.originCode}`,
        ]
      : []),
    "",
    line("─"),
    center("PAYMENT SUMMARY"),
    line("─"),
    `  TOTAL PAID         : ${data.totalPrice}`,
    `  CURRENCY           : ${data.currency}`,
    "",
    line("═"),
    center("ISSUED BY"),
    center(COMPANY_INFO.name),
    center(COMPANY_INFO.address),
    center(COMPANY_INFO.phone),
    center(COMPANY_INFO.email),
    line("═"),
    "",
    center("Thank you for choosing Royal Service!"),
    center("Have a safe and pleasant journey."),
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");

  return ticket;
}

/**
 * Generate a formatted hotel voucher as plain text.
 */
export function generateHotelVoucher(data: HotelVoucherData): string {
  const guestCount =
    data.adults + data.children > 1
      ? `${data.adults} Adult${data.adults > 1 ? "s" : ""}${data.children > 0 ? ` + ${data.children} Child${data.children > 1 ? "ren" : ""}` : ""}${data.infants > 0 ? ` + ${data.infants} Infant${data.infants > 1 ? "s" : ""}` : ""}`
      : `1 Adult${data.infants > 0 ? ` + ${data.infants} Infant${data.infants > 1 ? "s" : ""}` : ""}`;

  const voucher = [
    line("═"),
    center("🏨  ROYAL VOYAGE  🏨"),
    center("HOTEL VOUCHER"),
    line("═"),
    "",
    `  BOOKING REFERENCE : ${data.reference}`,
    `  ISSUE DATE         : ${data.issueDate}`,
    "",
    line("─"),
    center("GUEST INFORMATION"),
    line("─"),
    `  NAME               : ${data.guestName.toUpperCase()}`,
    `  EMAIL              : ${data.email}`,
    data.phone ? `  PHONE              : ${data.phone}` : "",
    `  GUESTS             : ${guestCount}`,
    "",
    line("─"),
    center("HOTEL DETAILS"),
    line("─"),
    `  HOTEL              : ${data.hotelName}`,
    `  CITY               : ${data.hotelCity}`,
    `  COUNTRY            : ${data.hotelCountry}`,
    `  ROOM TYPE          : ${data.roomType}`,
    `  CHECK-IN           : ${data.checkIn}`,
    `  CHECK-OUT          : ${data.checkOut}`,
    "",
    line("─"),
    center("PAYMENT SUMMARY"),
    line("─"),
    `  TOTAL PAID         : ${data.totalPrice}`,
    `  CURRENCY           : ${data.currency}`,
    "",
    line("═"),
    center("ISSUED BY"),
    center(COMPANY_INFO.name),
    center(COMPANY_INFO.address),
    center(COMPANY_INFO.phone),
    center(COMPANY_INFO.email),
    line("═"),
    "",
    center("Thank you for choosing Royal Service!"),
    center("We wish you a wonderful stay."),
    "",
  ]
    .filter((l) => l !== null)
    .join("\n");

  return voucher;
}
