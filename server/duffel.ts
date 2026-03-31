import { Duffel } from "@duffel/api";

// ─── Duffel Client ──────────────────────────────────────────────────────────
// Uses DUFFEL_API_TOKEN for authentication.
// Live tokens start with duffel_live_, test tokens start with duffel_test_.

const DUFFEL_TOKEN = process.env.DUFFEL_API_TOKEN || "";
const isLive = DUFFEL_TOKEN.startsWith("duffel_live_");

const duffel = new Duffel({
  token: DUFFEL_TOKEN,
});

if (DUFFEL_TOKEN) {
  if (isLive) {
    console.log("[Duffel] 🟢 Connected to LIVE API");
  } else {
    console.log("[Duffel] 🟡 Connected to TEST API");
  }
} else {
  console.log("[Duffel] ⚠️ No DUFFEL_API_TOKEN configured");
}

// ─── Offer Cache ────────────────────────────────────────────────────────────
// Cache offers from search results for later booking
// Key: offer ID, TTL: 30 minutes
const offerCache = new Map<string, { offer: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000;

function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, val] of offerCache) {
    if (now - val.timestamp > CACHE_TTL) offerCache.delete(key);
  }
}

export function cacheOffer(offerId: string, offer: any) {
  cleanExpiredCache();
  offerCache.set(offerId, { offer, timestamp: Date.now() });
}

export function getCachedOffer(offerId: string): any | null {
  const entry = offerCache.get(offerId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    offerCache.delete(offerId);
    return null;
  }
  return entry.offer;
}

// ─── Types (compatible with existing FlightOffer interface) ─────────────────

export type FlightOffer = {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  class: string;
  seatsLeft: number;
  rawOffer: unknown;
};

export type HotelOffer = {
  id: string;
  hotelId: string;
  name: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  stars: number;
  pricePerNight: number;
  currency: string;
  amenities: string[];
  description: string;
  address: string;
  image: string;
};

export type LocationSuggestion = {
  name: string;
  iataCode: string;
  cityName: string;
  countryName: string;
  type: "AIRPORT" | "CITY";
};

// ─── Airline name mapping ───────────────────────────────────────────────────

const AIRLINE_NAMES: Record<string, string> = {
  AT: "Royal Air Maroc",
  EK: "Emirates",
  QR: "Qatar Airways",
  AF: "Air France",
  BA: "British Airways",
  TK: "Turkish Airlines",
  LH: "Lufthansa",
  MS: "EgyptAir",
  PC: "Pegasus Airlines",
  FR: "Ryanair",
  U2: "easyJet",
  IB: "Iberia",
  KL: "KLM",
  SV: "Saudia",
  EY: "Etihad Airways",
  FZ: "flydubai",
  WY: "Oman Air",
  GF: "Gulf Air",
  ME: "Middle East Airlines",
  RJ: "Royal Jordanian",
  UX: "Air Europa",
  VY: "Vueling",
  W6: "Wizz Air",
  DL: "Delta Air Lines",
  AA: "American Airlines",
  UA: "United Airlines",
  LX: "Swiss International",
  OS: "Austrian Airlines",
  SQ: "Singapore Airlines",
  CX: "Cathay Pacific",
  NH: "ANA",
  JL: "Japan Airlines",
  AC: "Air Canada",
  QF: "Qantas",
  AZ: "ITA Airways",
  TP: "TAP Air Portugal",
  SK: "Scandinavian Airlines",
  AY: "Finnair",
  LO: "LOT Polish Airlines",
  OK: "Czech Airlines",
  BT: "airBaltic",
  WF: "Widerøe",
  "6X": "Duffel Test Airline",
  ZZ: "Duffel Airways",
};

function getAirlineName(code: string): string {
  return AIRLINE_NAMES[code] || code;
}

function parseDuration(isoOrMinutes: string): string {
  // Duffel returns duration as ISO 8601 (e.g. "PT2H30M") or sometimes as minutes
  if (isoOrMinutes.startsWith("PT")) {
    const match = isoOrMinutes.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return isoOrMinutes;
    const hours = match[1] ? `${match[1]}h` : "";
    const mins = match[2] ? ` ${match[2]}m` : "";
    return `${hours}${mins}`.trim();
  }
  // If it's just a number (minutes)
  const totalMins = parseInt(isoOrMinutes, 10);
  if (!isNaN(totalMins)) {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  }
  return isoOrMinutes;
}

function formatTime(isoDateTime: string): string {
  return isoDateTime.slice(11, 16);
}

// ─── Airport / City Search (using Duffel Places API) ────────────────────────

export async function searchLocations(
  keyword: string
): Promise<LocationSuggestion[]> {
  if (keyword.length < 2) return [];

  try {
    const response = await duffel.suggestions.list({
      query: keyword,
    });

    return response.data
      .filter((place: any) => place.type === "airport" || place.type === "city")
      .slice(0, 8)
      .map((place: any): LocationSuggestion => ({
        name: place.name || keyword,
        iataCode: place.iata_code || place.iata_city_code || "",
        cityName: place.city_name || place.city?.name || place.name || "",
        countryName: place.city?.country?.name || "",
        type: place.type === "airport" ? "AIRPORT" : "CITY",
      }));
  } catch (err: any) {
    console.error("[Duffel] searchLocations error:", err?.message);
    // Fallback: try airports endpoint
    try {
      const airportsResponse = await fetch(
        `https://api.duffel.com/air/airports?name=${encodeURIComponent(keyword)}&limit=8`,
        {
          headers: {
            Authorization: `Bearer ${DUFFEL_TOKEN}`,
            "Duffel-Version": "v2",
            Accept: "application/json",
          },
        }
      );
      const airportsData = await airportsResponse.json();
      return (airportsData.data || []).map((airport: any): LocationSuggestion => ({
        name: airport.name || keyword,
        iataCode: airport.iata_code || "",
        cityName: airport.city_name || airport.city?.name || "",
        countryName: airport.city?.country?.name || "",
        type: "AIRPORT",
      }));
    } catch {
      return [];
    }
  }
}

// ─── Flight Search ──────────────────────────────────────────────────────────

export async function searchFlights(params: {
  originCode: string;
  destinationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  max?: number;
}): Promise<FlightOffer[]> {
  // Build slices
  const slices: any[] = [
    {
      origin: params.originCode.toUpperCase(),
      destination: params.destinationCode.toUpperCase(),
      departure_date: params.departureDate,
    },
  ];

  // Add return slice if round trip
  if (params.returnDate) {
    slices.push({
      origin: params.destinationCode.toUpperCase(),
      destination: params.originCode.toUpperCase(),
      departure_date: params.returnDate,
    });
  }

  // Build passengers array
  const passengers: any[] = [];
  for (let i = 0; i < params.adults; i++) {
    passengers.push({ type: "adult" as const });
  }
  if (params.children) {
    for (let i = 0; i < params.children; i++) {
      passengers.push({ age: 10 }); // Default child age
    }
  }
  if (params.infants) {
    for (let i = 0; i < params.infants; i++) {
      passengers.push({ type: "infant_without_seat" as const });
    }
  }

  // Map travel class
  const cabinClassMap: Record<string, string> = {
    ECONOMY: "economy",
    PREMIUM_ECONOMY: "premium_economy",
    BUSINESS: "business",
    FIRST: "first",
  };
  const cabinClass = params.travelClass
    ? cabinClassMap[params.travelClass] || "economy"
    : undefined;

  console.log(`[Duffel] Searching flights: ${params.originCode} → ${params.destinationCode} on ${params.departureDate}`);

  const offerRequestResponse = await duffel.offerRequests.create({
    slices,
    passengers,
    cabin_class: cabinClass as any,
    return_offers: true,
    max_connections: 2,
  });

  const offers = offerRequestResponse.data.offers || [];
  const maxResults = params.max ?? 15;

  console.log(`[Duffel] Found ${offers.length} offers, returning top ${maxResults}`);

  return offers.slice(0, maxResults).map((offer: any, idx: number): FlightOffer => {
    const firstSlice = offer.slices?.[0];
    const segments = firstSlice?.segments || [];
    const firstSeg = segments[0];
    const lastSeg = segments[segments.length - 1];

    // Get airline info from the owner
    const airlineCode =
      offer.owner?.iata_code ||
      firstSeg?.marketing_carrier?.iata_code ||
      firstSeg?.operating_carrier?.iata_code ||
      "";
    const airlineName =
      offer.owner?.name ||
      getAirlineName(airlineCode);

    const offerId = offer.id;

    // Cache the offer for later booking
    cacheOffer(offerId, offer);

    // Calculate total duration from first segment departure to last segment arrival
    let duration = "";
    if (firstSeg && lastSeg) {
      const depTime = new Date(firstSeg.departing_at).getTime();
      const arrTime = new Date(lastSeg.arriving_at).getTime();
      const diffMs = arrTime - depTime;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      duration = `${hours}h ${mins}m`;
    } else if (firstSlice?.duration) {
      duration = parseDuration(firstSlice.duration);
    }

    // Flight number
    const flightNumber = firstSeg
      ? `${firstSeg.marketing_carrier?.iata_code || airlineCode} ${firstSeg.marketing_carrier_flight_number || ""}`
      : "";

    // Cabin class
    const cabinClassDisplay =
      firstSeg?.passengers?.[0]?.cabin_class_marketing_name ||
      firstSeg?.passengers?.[0]?.cabin_class ||
      "economy";

    return {
      id: offerId,
      airline: airlineName,
      airlineCode,
      flightNumber: flightNumber.trim(),
      origin: firstSeg?.origin?.name || firstSeg?.origin?.iata_code || params.originCode,
      originCode: firstSeg?.origin?.iata_code || params.originCode,
      destination: lastSeg?.destination?.name || lastSeg?.destination?.iata_code || params.destinationCode,
      destinationCode: lastSeg?.destination?.iata_code || params.destinationCode,
      departureTime: firstSeg ? formatTime(firstSeg.departing_at) : "",
      arrivalTime: lastSeg ? formatTime(lastSeg.arriving_at) : "",
      duration,
      stops: Math.max(0, segments.length - 1),
      price: parseFloat(offer.total_amount || "0"),
      currency: offer.total_currency || "USD",
      class: cabinClassDisplay.toUpperCase(),
      seatsLeft: offer.available_services?.length ?? 9,
      rawOffer: offer,
    };
  });
}

// ─── Get Single Offer (Refresh Price) ───────────────────────────────────────

export type PricedFlightOffer = {
  pricedOffer: unknown;
  totalPrice: number;
  currency: string;
  lastTicketingDate?: string;
};

export async function priceFlightOffer(rawOffer: any): Promise<PricedFlightOffer> {
  // In Duffel, we get the latest offer by its ID
  const offerId = rawOffer?.id || rawOffer;

  try {
    const response = await duffel.offers.get(offerId);
    const offer = response.data;

    // Cache the refreshed offer
    cacheOffer(offer.id, offer);

    return {
      pricedOffer: offer,
      totalPrice: parseFloat(offer.total_amount || "0"),
      currency: offer.total_currency || "USD",
      lastTicketingDate: offer.expires_at || undefined,
    };
  } catch (err: any) {
    console.error("[Duffel] priceFlightOffer error:", err?.message);
    // If we can't refresh, use the cached version
    if (rawOffer && typeof rawOffer === "object" && rawOffer.total_amount) {
      return {
        pricedOffer: rawOffer,
        totalPrice: parseFloat(rawOffer.total_amount || "0"),
        currency: rawOffer.total_currency || "USD",
        lastTicketingDate: rawOffer.expires_at || undefined,
      };
    }
    throw err;
  }
}

// ─── Create Order (Book Flight — Instant Confirmation) ──────────────────────

export type FlightOrderResult = {
  orderId: string;
  pnr: string; // Airline booking reference (PNR)
  associatedRecords: Array<{ reference: string; creationDate?: string; originSystemCode?: string }>;
  ticketingDeadline?: string;
  status: string;
  documents: Array<{ type: string; unique_identifier: string }>;
};

export type TravelerInput = {
  id: string;
  dateOfBirth: string; // YYYY-MM-DD
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE";
  email: string;
  phone: string;
  countryCallingCode: string;
};

export async function createFlightOrder(
  pricedOffer: any,
  travelers: TravelerInput[]
): Promise<FlightOrderResult> {
  const offerId = pricedOffer?.id || pricedOffer;

  // Build passengers array with passenger IDs from the offer
  const offerData = typeof pricedOffer === "object" ? pricedOffer : getCachedOffer(offerId);
  if (!offerData) {
    throw new Error("Offer not found or expired. Please search again.");
  }

  // Map passenger IDs from the offer request
  const offerPassengers = offerData.passengers || [];

  const passengersPayload = travelers.map((t, idx) => {
    const passengerFromOffer = offerPassengers[idx];
    return {
      id: passengerFromOffer?.id || t.id,
      phone_number: `+${t.countryCallingCode}${t.phone}`,
      email: t.email,
      born_on: t.dateOfBirth,
      title: t.gender === "MALE" ? "mr" : "ms",
      gender: t.gender === "MALE" ? "m" : "f",
      family_name: t.lastName.toUpperCase(),
      given_name: t.firstName.toUpperCase(),
    };
  });

  console.log(`[Duffel] Creating order for offer ${offerId} with ${travelers.length} passenger(s)...`);

  const orderResponse = await duffel.orders.create({
    type: "instant",
    selected_offers: [offerId],
    payments: [
      {
        type: "balance" as any,
        currency: offerData.total_currency || "USD",
        amount: offerData.total_amount || "0",
      },
    ],
    passengers: passengersPayload as any,
    metadata: {
      agency: "Royal Voyage",
      agency_phone: "+22233700000",
      agency_email: "royal-voyage@gmail.com",
    },
  });

  const order = orderResponse.data;

  // Extract booking reference (PNR)
  const pnr = order.booking_reference || "";
  const orderId = order.id || "";

  // Build associated records from booking_references
  const associatedRecords: Array<{ reference: string; originSystemCode: string }> = [];
  // Use the main booking reference
  if (order.booking_reference) {
    associatedRecords.push({
      reference: order.booking_reference,
      originSystemCode: order.owner?.iata_code || "",
    });
  }



  // Extract documents (e-tickets)
  const documents = (order.documents || []).map((doc: any) => ({
    type: doc.type || "electronic_ticket",
    unique_identifier: doc.unique_identifier || "",
  }));

  const status = order.payment_status?.awaiting_payment ? "PENDING_PAYMENT" : "CONFIRMED";

  console.log(`[Duffel] ✅ Order created! ID: ${orderId}, PNR: ${pnr}, Status: ${status}`);
  if (documents.length > 0) {
    console.log(`[Duffel] 🎫 ${documents.length} document(s) issued`);
  }

  return {
    orderId,
    pnr,
    associatedRecords,
    ticketingDeadline: undefined, // Duffel handles ticketing automatically
    status,
    documents,
  };
}

// ─── Get Order Status ───────────────────────────────────────────────────────

export interface FlightOrderStatus {
  orderId: string;
  pnr: string;
  status: string;
  travelers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
  }>;
  segments: Array<{
    departure: { iataCode: string; terminal?: string; at: string };
    arrival: { iataCode: string; terminal?: string; at: string };
    carrierCode: string;
    number: string;
    aircraft?: string;
    duration?: string;
    status?: string;
  }>;
  ticketing: Array<{
    number?: string;
    status?: string;
    dateOfIssuance?: string;
  }>;
  price: {
    total: string;
    currency: string;
    base?: string;
  };
  contacts: Array<{
    emailAddress?: string;
    phones?: Array<{ number: string }>;
  }>;
  associatedRecords: Array<{
    reference: string;
    originSystemCode: string;
  }>;
  ticketingDeadline?: string;
  createdAt?: string;
}

export async function getFlightOrder(orderId: string): Promise<FlightOrderStatus> {
  console.log(`[Duffel] Retrieving order: ${orderId}`);

  const response = await duffel.orders.get(orderId);
  const order = response.data;

  // Extract travelers
  const travelers = (order.passengers || []).map((p: any) => ({
    id: p.id || "",
    firstName: p.given_name || "",
    lastName: p.family_name || "",
    dateOfBirth: p.born_on,
    gender: p.gender === "m" ? "MALE" : p.gender === "f" ? "FEMALE" : undefined,
  }));

  // Extract segments from slices
  const segments: FlightOrderStatus["segments"] = [];
  for (const slice of order.slices || []) {
    for (const seg of slice.segments || []) {
      segments.push({
        departure: {
          iataCode: seg.origin?.iata_code || "",
          terminal: seg.origin_terminal || undefined,
          at: seg.departing_at || "",
        },
        arrival: {
          iataCode: seg.destination?.iata_code || "",
          terminal: seg.destination_terminal || undefined,
          at: seg.arriving_at || "",
        },
        carrierCode: seg.marketing_carrier?.iata_code || seg.operating_carrier?.iata_code || "",
        number: seg.marketing_carrier_flight_number || "",
        aircraft: seg.aircraft?.name || seg.aircraft?.iata_code,
        duration: seg.duration ? parseDuration(seg.duration) : undefined,
        status: "CONFIRMED",
      });
    }
  }

  // Extract ticketing info from documents
  const ticketing = (order.documents || []).map((doc: any) => ({
    number: doc.unique_identifier || undefined,
    status: "ISSUED",
    dateOfIssuance: order.created_at,
  }));

  // Build associated records
  const associatedRecords: Array<{ reference: string; originSystemCode: string }> = [];
  if (order.booking_reference) {
    associatedRecords.push({
      reference: order.booking_reference,
      originSystemCode: order.owner?.iata_code || "",
    });
  }

  // Extract contacts
  const contacts = (order.passengers || [])
    .filter((p: any) => p.email || p.phone_number)
    .slice(0, 1)
    .map((p: any) => ({
      emailAddress: p.email,
      phones: p.phone_number ? [{ number: p.phone_number }] : [],
    }));

  // Determine status
  let status = "CONFIRMED";
  if (order.cancelled_at) {
    status = "CANCELLED";
  } else if (ticketing.length > 0) {
    status = "TICKETED";
  }

  return {
    orderId: order.id,
    pnr: order.booking_reference || "",
    status,
    travelers,
    segments,
    ticketing,
    price: {
      total: order.total_amount || "0",
      currency: order.total_currency || "USD",
      base: order.base_amount || undefined,
    },
    contacts,
    associatedRecords,
    ticketingDeadline: undefined,
    createdAt: order.created_at,
  };
}

// ─── Cancel Order ───────────────────────────────────────────────────────────

export interface CancelOrderResult {
  success: boolean;
  orderId: string;
  message: string;
  refundAmount?: string;
  refundCurrency?: string;
}

export async function cancelFlightOrder(orderId: string): Promise<CancelOrderResult> {
  console.log(`[Duffel] Cancelling order: ${orderId}`);

  try {
    // First, create a cancellation request to check refund amount
    const cancellationResponse = await duffel.orderCancellations.create({
      order_id: orderId,
    });

    const cancellation = cancellationResponse.data;

    // Confirm the cancellation
    if (cancellation.id) {
      await duffel.orderCancellations.confirm(cancellation.id);
    }

    console.log(`[Duffel] ✅ Order ${orderId} cancelled successfully`);
    return {
      success: true,
      orderId,
      message: "Order cancelled successfully",
      refundAmount: cancellation.refund_amount || undefined,
      refundCurrency: cancellation.refund_currency || undefined,
    };
  } catch (err: any) {
    console.error(`[Duffel] ❌ Failed to cancel order ${orderId}:`, err?.message || err);
    const detail = err?.errors?.[0]?.message || err?.message || "CANCEL_ERROR";
    throw new Error(detail);
  }
}

// ─── Check Ticket Issuance ──────────────────────────────────────────────────

export interface TicketIssuanceResult {
  success: boolean;
  orderId: string;
  tickets: Array<{
    ticketNumber: string;
    status: string;
    dateOfIssuance?: string;
    travelerId?: string;
  }>;
  message: string;
}

export async function checkTicketIssuance(orderId: string): Promise<TicketIssuanceResult> {
  console.log(`[Duffel] Checking ticket issuance for order: ${orderId}`);

  try {
    const response = await duffel.orders.get(orderId);
    const order = response.data;

    const tickets: TicketIssuanceResult["tickets"] = [];

    // In Duffel, documents contain e-ticket info
    for (const doc of order.documents || []) {
      if (doc.unique_identifier) {
        tickets.push({
          ticketNumber: doc.unique_identifier,
          status: "ISSUED",
          dateOfIssuance: order.created_at,
        });
      }
    }

    if (tickets.length > 0) {
      console.log(`[Duffel] ✅ Found ${tickets.length} ticket(s) for order ${orderId}`);
      return {
        success: true,
        orderId,
        tickets,
        message: `${tickets.length} ticket(s) found`,
      };
    }

    // No tickets yet - Duffel orders are usually instantly confirmed
    console.log(`[Duffel] ⏳ No tickets found for order ${orderId}`);
    return {
      success: true,
      orderId,
      tickets: [],
      message: "Order confirmed. Tickets will be issued automatically by the airline.",
    };
  } catch (err: any) {
    console.error(`[Duffel] ❌ Failed to check ticket issuance for ${orderId}:`, err?.message || err);
    const detail = err?.errors?.[0]?.message || err?.message || "TICKET_CHECK_ERROR";
    throw new Error(detail);
  }
}

// ─── Duffel Status Info ─────────────────────────────────────────────────────

export interface DuffelStatusInfo {
  provider: "duffel";
  environment: "live" | "test";
  isConnected: boolean;
  tokenConfigured: boolean;
}

export function getDuffelStatus(): DuffelStatusInfo {
  return {
    provider: "duffel",
    environment: isLive ? "live" : "test",
    isConnected: !!DUFFEL_TOKEN,
    tokenConfigured: !!DUFFEL_TOKEN,
  };
}

// ─── Hotel Search (using Amadeus as fallback — Duffel Stays API) ────────────
// Note: Duffel has a Stays API but it may not be enabled for all accounts.
// We keep the hotel search interface compatible with the existing app.

const HOTEL_IMAGES: Record<string, string> = {
  DUBAI: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
  PARIS: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
  LONDON: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  TOKYO: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "NEW YORK": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  BALI: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
  ISTANBUL: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
  BARCELONA: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
  ROME: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
  AMSTERDAM: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80",
  MADRID: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80",
  CASABLANCA: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&q=80",
  RIYADH: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&q=80",
  CAIRO: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80",
  DOHA: "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=800&q=80",
  SINGAPORE: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
  BANGKOK: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80",
  SYDNEY: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80",
  TORONTO: "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=800&q=80",
  FRANKFURT: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80",
};

function getHotelImage(cityName: string): string {
  const key = cityName.toUpperCase();
  return (
    HOTEL_IMAGES[key] ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
  );
}

export async function searchHotelsByCity(params: {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  rooms?: number;
  ratings?: string;
}): Promise<HotelOffer[]> {
  // Try Duffel Stays API
  try {
    const response = await (duffel as any).stays.search({
      check_in_date: params.checkInDate,
      check_out_date: params.checkOutDate,
      rooms: params.rooms || 1,
      guests: [{ type: "adult" }],
      location: {
        geographic_coordinates: {
          // We'd need to geocode the city code — for now use a fallback
          latitude: 0,
          longitude: 0,
        },
        radius: 10,
      },
    });

    if (response?.data?.length > 0) {
      return response.data.slice(0, 15).map((hotel: any, idx: number): HotelOffer => ({
        id: hotel.id || `hotel_${idx}`,
        hotelId: hotel.id,
        name: hotel.accommodation?.name || "Hotel",
        city: params.cityCode,
        country: "",
        rating: hotel.accommodation?.rating || 4,
        stars: hotel.accommodation?.rating || 4,
        pricePerNight: parseFloat(hotel.total_amount || "0") /
          Math.max(1, Math.ceil((new Date(params.checkOutDate).getTime() - new Date(params.checkInDate).getTime()) / (1000 * 60 * 60 * 24))),
        currency: hotel.total_currency || "USD",
        amenities: (hotel.accommodation?.amenities || []).slice(0, 6),
        description: `${hotel.accommodation?.name || "Hotel"} in ${params.cityCode}`,
        address: hotel.accommodation?.address?.line_one || "",
        image: getHotelImage(params.cityCode),
      }));
    }
  } catch (err: any) {
    console.warn("[Duffel] Stays API not available or error:", err?.message);
  }

  // Fallback: return empty (hotel search can still use Amadeus if needed)
  console.log("[Duffel] Hotel search: Stays API not available. Returning empty results.");
  return [];
}

// ─── Consolidator Compatibility Layer ───────────────────────────────────────
// Duffel doesn't use consolidators — tickets are issued directly.
// These functions maintain API compatibility with the existing admin panel.

export type ConsolidatorEntry = {
  officeId: string;
  currency: string;
  label: string;
  city: string;
};

export function getConsolidatorConfig() {
  return {
    isConfigured: false,
    consolidatorOfficeId: "",
    consolidatorCurrency: "USD",
    agencyOfficeId: "",
    environment: isLive ? "live" as const : "test" as const,
    ticketingMode: "INSTANT" as const, // Duffel issues tickets instantly
    consolidators: [] as Array<ConsolidatorEntry & { isActive: boolean }>,
    activeIndex: -1,
    provider: "duffel" as const,
    note: "Duffel API issues tickets directly — no consolidator needed.",
  };
}

export function setActiveConsolidator(_index: number) {
  return getConsolidatorConfig();
}

export function addConsolidator(_officeId: string, _currency: string) {
  return getConsolidatorConfig();
}

export function removeConsolidator(_index: number) {
  return getConsolidatorConfig();
}

export function setConsolidatorOfficeId(_newOfficeId: string) {
  return getConsolidatorConfig();
}

export function getConsolidatorForBooking(_consolidatorIndex?: number): ConsolidatorEntry | null {
  return null; // Duffel doesn't use consolidators
}

export function queueToConsolidator(_orderId: string) {
  return {
    success: true,
    orderId: _orderId,
    consolidatorOfficeId: "",
    ticketingOption: "INSTANT",
    message: "Duffel API issues tickets directly. No consolidator queuing needed.",
  };
}

// Backward compat exports
export function getCachedRawOffer(offerId: string) {
  return getCachedOffer(offerId);
}

export function cacheRawOffer(offerId: string, rawOffer: unknown) {
  cacheOffer(offerId, rawOffer);
}

export function getAmadeusStatus() {
  return {
    officeId: "",
    consolidatorOfficeId: "",
    environment: isLive ? "live" : "test",
    isConnected: !!DUFFEL_TOKEN,
    clientIdConfigured: !!DUFFEL_TOKEN,
    provider: "duffel",
  };
}
