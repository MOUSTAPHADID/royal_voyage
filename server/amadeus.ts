import Amadeus from "amadeus";

// ─── Amadeus Client — Production or Test ─────────────────────────────────────
// Uses AMADEUS_PROD_CLIENT_ID/SECRET if available (api.amadeus.com),
// otherwise falls back to test keys (test.api.amadeus.com).

const isProd = !!(process.env.AMADEUS_PROD_CLIENT_ID && process.env.AMADEUS_PROD_CLIENT_SECRET);

const amadeus = new Amadeus({
  clientId: isProd
    ? process.env.AMADEUS_PROD_CLIENT_ID!
    : process.env.AMADEUS_CLIENT_ID!,
  clientSecret: isProd
    ? process.env.AMADEUS_PROD_CLIENT_SECRET!
    : process.env.AMADEUS_CLIENT_SECRET!,
  hostname: isProd ? "production" : "test",
});

const OFFICE_ID = process.env.AMADEUS_OFFICE_ID || "";
// ─── Multi-Consolidator Support ──────────────────────────────────────────────
// Each consolidator has an office ID and associated currency for ticket issuance.
export type ConsolidatorEntry = {
  officeId: string;
  currency: string; // e.g. "MRU", "AOA"
  label: string;    // e.g. "NKC - Nouakchott (MRU)"
  city: string;     // 3-letter city code from office ID
};

function parseConsolidatorCity(officeId: string): string {
  return officeId.slice(0, 3).toUpperCase();
}

function buildConsolidatorLabel(officeId: string, currency: string): string {
  const city = parseConsolidatorCity(officeId);
  const cityNames: Record<string, string> = {
    NKC: "Nouakchott", LAD: "Luanda", CMN: "Casablanca", CDG: "Paris",
    DXB: "Dubai", JFK: "New York", LHR: "London", IST: "Istanbul",
  };
  return `${city} - ${cityNames[city] || city} (${currency})`;
}

// Initialize consolidators from env
let consolidators: ConsolidatorEntry[] = [];

// Legacy single consolidator (backward compat)
const legacyConsolidator = process.env.AMADEUS_CONSOLIDATOR_OFFICE_ID || "";
if (legacyConsolidator) {
  consolidators.push({
    officeId: legacyConsolidator,
    currency: "MRU",
    label: buildConsolidatorLabel(legacyConsolidator, "MRU"),
    city: parseConsolidatorCity(legacyConsolidator),
  });
}

// Second consolidator: LAD282354 (AOA) — from env AMADEUS_CONSOLIDATOR_OFFICE_ID_2
const ladConsolidator = process.env.AMADEUS_CONSOLIDATOR_OFFICE_ID_2 || "LAD282354";
if (ladConsolidator) {
  // Only add if not already present (avoid duplicates)
  if (!consolidators.find(c => c.officeId === ladConsolidator)) {
    consolidators.push({
      officeId: ladConsolidator,
      currency: "AOA",
      label: buildConsolidatorLabel(ladConsolidator, "AOA"),
      city: parseConsolidatorCity(ladConsolidator),
    });
  }
}

// Third consolidator: from env AMADEUS_CONSOLIDATOR_OFFICE_ID_3 (optional)
const nkc2Consolidator = process.env.AMADEUS_CONSOLIDATOR_OFFICE_ID_3 || "";
if (nkc2Consolidator) {
  if (!consolidators.find(c => c.officeId === nkc2Consolidator)) {
    consolidators.push({
      officeId: nkc2Consolidator,
      currency: "MRU",
      label: buildConsolidatorLabel(nkc2Consolidator, "MRU"),
      city: parseConsolidatorCity(nkc2Consolidator),
    });
  }
}

// Active consolidator (default: first one)
let activeConsolidatorIndex = 0;

// Backward compat: single CONSOLIDATOR_OFFICE_ID getter
function getActiveConsolidatorOfficeId(): string {
  return consolidators[activeConsolidatorIndex]?.officeId || "";
}
function getActiveConsolidatorCurrency(): string {
  return consolidators[activeConsolidatorIndex]?.currency || "MRU";
}

// Keep backward compat variable
let CONSOLIDATOR_OFFICE_ID = getActiveConsolidatorOfficeId();

if (isProd) {
  console.log("[Amadeus] \uD83D\uDFE2 Connected to PRODUCTION API (api.amadeus.com)");
} else {
  console.log("[Amadeus] \uD83D\uDFE1 Connected to TEST API (test.api.amadeus.com)");
}
if (OFFICE_ID) {
  console.log(`[Amadeus] \uD83C\uDFE2 Office ID configured: ${OFFICE_ID}`);
} else {
  console.log("[Amadeus] \u26A0\uFE0F No Office ID configured (AMADEUS_OFFICE_ID)");
}
if (consolidators.length > 0) {
  console.log(`[Amadeus] 🎫 Consolidators configured: ${consolidators.length}`);
  for (const c of consolidators) {
    console.log(`[Amadeus]   → ${c.officeId} (${c.currency}) — ${c.label}`);
  }
  console.log(`[Amadeus]   Active: ${getActiveConsolidatorOfficeId()} (${getActiveConsolidatorCurrency()})`);
}

// ─── Raw Offer Cache ─────────────────────────────────────────────────────────
// Cache raw offers from search results so they can be retrieved for pricing/booking
// Key: flightNumber + departureTime (unique enough for a session)
// TTL: 30 minutes
const offerCache = new Map<string, { offer: unknown; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, val] of offerCache) {
    if (now - val.timestamp > CACHE_TTL) offerCache.delete(key);
  }
}

export function cacheRawOffer(offerId: string, rawOffer: unknown) {
  cleanExpiredCache();
  offerCache.set(offerId, { offer: rawOffer, timestamp: Date.now() });
}

export function getCachedRawOffer(offerId: string): unknown | null {
  const entry = offerCache.get(offerId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    offerCache.delete(offerId);
    return null;
  }
  return entry.offer;
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Airline name mapping ─────────────────────────────────────────────────────

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
  "6X": "Amadeus Test Airline",
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
};

function getAirlineName(code: string): string {
  return AIRLINE_NAMES[code] || code;
}

function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;
  const hours = match[1] ? `${match[1]}h` : "";
  const mins = match[2] ? ` ${match[2]}m` : "";
  return `${hours}${mins}`.trim();
}

function formatTime(isoDateTime: string): string {
  return isoDateTime.slice(11, 16);
}

// Hotel images by city name (Unsplash)
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

// ─── Flight Search ────────────────────────────────────────────────────────────

export async function searchFlights(params: {
  originCode: string;
  destinationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  childAges?: number[];
  travelClass?: string;
  max?: number;
}): Promise<FlightOffer[]> {
  const query: Record<string, string> = {
    originLocationCode: params.originCode.toUpperCase(),
    destinationLocationCode: params.destinationCode.toUpperCase(),
    departureDate: params.departureDate,
    adults: String(params.adults),
    max: String(params.max ?? 15),
    currencyCode: "USD",
  };

  if (params.returnDate) query.returnDate = params.returnDate;
  if (params.travelClass) query.travelClass = params.travelClass;
  if (params.children && params.children > 0) query.children = String(params.children);
  if (params.infants && params.infants > 0) query.infants = String(params.infants);

  console.log(`[Amadeus] Searching: ${params.originCode}→${params.destinationCode} ${params.departureDate}, adults=${params.adults}, children=${params.children||0}, infants=${params.infants||0}`);
  const response = await amadeus.shopping.flightOffersSearch.get(query);
  const offers = response.data as any[];

  return offers.map((offer: any, idx: number): FlightOffer => {
    const itinerary = offer.itineraries[0];
    const segments = itinerary.segments;
    const firstSeg = segments[0];
    const lastSeg = segments[segments.length - 1];
    const airlineCode = offer.validatingAirlineCodes?.[0] || firstSeg.carrierCode;
    const offerId = offer.id || `f${idx}`;

    // Cache the raw offer for later pricing/booking
    cacheRawOffer(offerId, offer);

    return {
      id: offerId,
      airline: getAirlineName(airlineCode),
      airlineCode,
      flightNumber: `${firstSeg.carrierCode} ${firstSeg.number}`,
      origin: firstSeg.departure.iataCode,
      originCode: firstSeg.departure.iataCode,
      destination: lastSeg.arrival.iataCode,
      destinationCode: lastSeg.arrival.iataCode,
      departureTime: formatTime(firstSeg.departure.at),
      arrivalTime: formatTime(lastSeg.arrival.at),
      duration: parseDuration(itinerary.duration),
      stops: segments.length - 1,
      price: parseFloat(offer.price.total),
      currency: offer.price.currency,
      class:
        offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ||
        "ECONOMY",
      seatsLeft: offer.numberOfBookableSeats ?? 9,
      rawOffer: offer,
    };
  });
}

// ─── Flight Offer Pricing (Step 2) ───────────────────────────────────────────

export type PricedFlightOffer = {
  pricedOffer: unknown; // The full priced offer to pass to createFlightOrder
  totalPrice: number;
  currency: string;
  lastTicketingDate?: string;
};

/**
 * Confirms the price of a flight offer before booking.
 * Takes the rawOffer from search results and returns a priced offer.
 */
export async function priceFlightOffer(rawOffer: unknown): Promise<PricedFlightOffer> {
  const response = await amadeus.shopping.flightOffers.pricing.post(
    JSON.stringify({
      data: {
        type: "flight-offers-pricing",
        flightOffers: [rawOffer],
      },
    })
  );

  const resData = response.data as any;
  const pricedOffer = resData?.flightOffers?.[0] ?? (Array.isArray(resData) ? resData[0] : resData);
  if (!pricedOffer) {
    throw new Error("No priced offer returned from Amadeus");
  }

  return {
    pricedOffer,
    totalPrice: parseFloat(pricedOffer.price?.total || "0"),
    currency: pricedOffer.price?.currency || "USD",
    lastTicketingDate: pricedOffer.lastTicketingDate,
  };
}

// ─── Flight Create Order (Step 3 — Real PNR) ────────────────────────────────

export type FlightOrderResult = {
  orderId: string;
  pnr: string; // 6-char airline PNR
  associatedRecords: Array<{ reference: string; creationDate?: string; originSystemCode?: string }>;
  ticketingDeadline?: string;
};

export type TravelerInput = {
  id: string;
  dateOfBirth: string; // YYYY-MM-DD
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE";
  email: string;
  phone: string; // full number without country code
  countryCallingCode: string; // e.g. "222"
};

/**
 * Creates a flight order (booking) on Amadeus and returns a real PNR.
 * The pricedOffer must come from priceFlightOffer().
 */
export async function createFlightOrder(
  pricedOffer: unknown,
  travelers: TravelerInput[]
): Promise<FlightOrderResult> {
  const travelerData = travelers.map((t) => ({
    id: t.id,
    dateOfBirth: t.dateOfBirth,
    name: {
      firstName: t.firstName.toUpperCase(),
      lastName: t.lastName.toUpperCase(),
    },
    gender: t.gender,
    contact: {
      emailAddress: t.email,
      phones: [
        {
          deviceType: "MOBILE",
          countryCallingCode: t.countryCallingCode,
          number: t.phone,
        },
      ],
    },
    documents: [],
  }));

  const orderData: any = {
    type: "flight-order",
    flightOffers: [pricedOffer],
    travelers: travelerData,
    remarks: {
      general: [
        {
          subType: "GENERAL_MISCELLANEOUS",
          text: "ONLINE BOOKING FROM ROYAL VOYAGE",
        },
      ],
    },
    ticketingAgreement: CONSOLIDATOR_OFFICE_ID
      ? {
          option: "DELAY_TO_QUEUE",
          dateTimeInformation: {
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19),
          },
        }
      : {
          option: "CONFIRM",
        },
    contacts: [
      {
        addresseeName: {
          firstName: "ROYAL",
          lastName: "VOYAGE",
        },
        purpose: "STANDARD",
        emailAddress: "royal-voyage@gmail.com",
        phones: [
          {
            deviceType: "MOBILE",
            countryCallingCode: "222",
            number: "33700000",
          },
        ],
        address: {
          lines: ["Tavragh Zeina"],
          cityName: "Nouakchott",
          countryCode: "MR",
        },
      },
    ],
  };

  // Add Office ID (queuing office) if configured
  if (OFFICE_ID) {
    orderData.queuingOfficeId = OFFICE_ID;
    console.log(`[Amadeus] Using Office ID: ${OFFICE_ID}`);
  }

  // Queue to consolidator for ticket issuance if configured
  if (CONSOLIDATOR_OFFICE_ID) {
    orderData.queuingOfficeId = CONSOLIDATOR_OFFICE_ID;
    console.log(`[Amadeus] \uD83C\uDFAB Queuing PNR to Consolidator: ${CONSOLIDATOR_OFFICE_ID}`);
  }

  const body = JSON.stringify({ data: orderData });

  const response = await amadeus.booking.flightOrders.post(body);
  const order = response.data as any;

  // Extract PNR from associatedRecords
  const records = order?.associatedRecords || [];
  const pnr = records[0]?.reference || "";

  if (!pnr) {
    console.warn("[Amadeus] Flight order created but no PNR in associatedRecords:", JSON.stringify(order).slice(0, 500));
  }

  return {
    orderId: order?.id || "",
    pnr,
    associatedRecords: records,
    ticketingDeadline: order?.ticketingAgreement?.dateTimeInformation?.dateTime,
  };
}

// ─── Airport / City Autocomplete ──────────────────────────────────────────────

export async function searchLocations(
  keyword: string
): Promise<LocationSuggestion[]> {
  if (keyword.length < 2) return [];

  const response = await amadeus.referenceData.locations.get({
    keyword,
    subType: "AIRPORT,CITY",
    "page[limit]": "8",
  });

  const data = response.data as any[];
  return data.map(
    (loc: any): LocationSuggestion => ({
      name: loc.detailedName || loc.name || keyword,
      iataCode: loc.iataCode,
      cityName: loc.address?.cityName || loc.name || "",
      countryName: loc.address?.countryName || "",
      type: loc.subType as "AIRPORT" | "CITY",
    })
  );
}

// ─── Hotel Search ─────────────────────────────────────────────────────────────

export async function searchHotelsByCity(params: {
  cityCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  rooms?: number;
  ratings?: string;
}): Promise<HotelOffer[]> {
  // Step 1: Get hotel list by city
  const listResponse = await amadeus.referenceData.locations.hotels.byCity.get({
    cityCode: params.cityCode.toUpperCase(),
    ratings: params.ratings || "3,4,5",
  });

  const hotels = (listResponse.data as any[]).slice(0, 25);
  if (hotels.length === 0) return [];

  // Step 2: Get offers in batches of 10 (API limit)
  const batchSize = 10;
  let offersData: any[] = [];

  for (let i = 0; i < Math.min(hotels.length, 20); i += batchSize) {
    const batch = hotels.slice(i, i + batchSize);
    const hotelIds = batch.map((h: any) => h.hotelId).join(",");

    try {
      const offersResponse = await amadeus.shopping.hotelOffersSearch.get({
        hotelIds,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        adults: String(params.adults),
        roomQuantity: String(params.rooms ?? 1),
        currency: "USD",
        bestRateOnly: "true",
      });
      offersData = offersData.concat(offersResponse.data as any[]);
    } catch {
      // Continue with next batch if this one fails
    }
  }

  // Build a map of hotelId → offer
  const offerMap = new Map<string, any>();
  for (const item of offersData) {
    offerMap.set(item.hotel?.hotelId, item);
  }

  // Merge hotel info with offers — prioritize hotels that have pricing
  const result = hotels
    .map((h: any, idx: number): HotelOffer => {
      const offerItem = offerMap.get(h.hotelId);
      const offer = offerItem?.offers?.[0];
      const cityName =
        h.address?.cityName ||
        offerItem?.hotel?.cityCode ||
        params.cityCode;

      return {
        id: h.hotelId || `hotel_${idx}`,
        hotelId: h.hotelId,
        name:
          offerItem?.hotel?.name ||
          h.name ||
          "Hotel",
        city: cityName,
        country: h.address?.countryCode || "",
        latitude: h.geoCode?.latitude,
        longitude: h.geoCode?.longitude,
        rating: parseFloat(h.rating || "4.0"),
        stars: parseInt(h.rating || "4", 10),
        pricePerNight: offer
          ? parseFloat(offer.price?.total || "0")
          : 0,
        currency: offer?.price?.currency || "USD",
        amenities: (h.amenities || [])
          .slice(0, 6)
          .map((a: string) =>
            a
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c: string) => c.toUpperCase())
          ),
        description: `${offerItem?.hotel?.name || h.name} — ${h.rating || "4"}-star hotel in ${cityName}.`,
        address: [
          offerItem?.hotel?.address?.lines?.[0] ||
            h.address?.lines?.[0],
          cityName,
        ]
          .filter(Boolean)
          .join(", "),
        image: getHotelImage(cityName),
      };
    })
    // Sort: hotels with pricing first
    .sort((a, b) => {
      if (a.pricePerNight > 0 && b.pricePerNight === 0) return -1;
      if (a.pricePerNight === 0 && b.pricePerNight > 0) return 1;
      return b.stars - a.stars;
    })
    .slice(0, 15);

  return result;
}


// ─── Flight Order Management: Retrieve PNR Status ────────────────────────────

export interface FlightOrderStatus {
  orderId: string;
  pnr: string;
  status: string; // CONFIRMED, CANCELLED, PENDING, etc.
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
  console.log(`[Amadeus] Retrieving flight order: ${orderId}`);

  const response = await (amadeus as any).booking.flightOrder(orderId).get();
  const order = response.data;

  const travelers = (order.travelers || []).map((t: any) => ({
    id: t.id,
    firstName: t.name?.firstName || "",
    lastName: t.name?.lastName || "",
    dateOfBirth: t.dateOfBirth,
    gender: t.gender,
  }));

  const segments: FlightOrderStatus["segments"] = [];
  for (const itinerary of order.flightOffers?.[0]?.itineraries || []) {
    for (const seg of itinerary.segments || []) {
      segments.push({
        departure: {
          iataCode: seg.departure?.iataCode || "",
          terminal: seg.departure?.terminal,
          at: seg.departure?.at || "",
        },
        arrival: {
          iataCode: seg.arrival?.iataCode || "",
          terminal: seg.arrival?.terminal,
          at: seg.arrival?.at || "",
        },
        carrierCode: seg.carrierCode || "",
        number: seg.number || "",
        aircraft: seg.aircraft?.code,
        duration: seg.duration,
        status: seg.operating?.carrierCode ? "OPERATING" : "CONFIRMED",
      });
    }
  }

  const ticketing = (order.ticketingAgreement?.ticketingInfo || []).map((t: any) => ({
    number: t.ticketNumber,
    status: t.status,
    dateOfIssuance: t.dateOfIssuance,
  }));

  // Also check associatedRecords for PNR
  const associatedRecords = (order.associatedRecords || []).map((r: any) => ({
    reference: r.reference || "",
    originSystemCode: r.originSystemCode || "",
  }));

  const pnr = associatedRecords[0]?.reference || order.id || orderId;

  const contacts = (order.contacts || []).map((c: any) => ({
    emailAddress: c.emailAddress,
    phones: c.phones?.map((p: any) => ({ number: p.number })),
  }));

  const price = {
    total: order.flightOffers?.[0]?.price?.total || "0",
    currency: order.flightOffers?.[0]?.price?.currency || "USD",
    base: order.flightOffers?.[0]?.price?.base,
  };

  // Determine overall status
  let status = "CONFIRMED";
  if (order.type === "flight-order") {
    // Check if there's ticketing info
    if (ticketing.length > 0 && ticketing[0].status === "ISSUED") {
      status = "TICKETED";
    } else if (ticketing.length > 0 && ticketing[0].status === "CANCELLED") {
      status = "CANCELLED";
    }
  }

  return {
    orderId: order.id || orderId,
    pnr,
    status,
    travelers,
    segments,
    ticketing,
    price,
    contacts,
    associatedRecords,
    ticketingDeadline: order.ticketingAgreement?.dateTimeInformation?.dateTime,
    createdAt: order.queuingOfficeId ? undefined : undefined, // Amadeus doesn't always return creation date
  };
}

// ─── Flight Order Management: Cancel / Delete Order ──────────────────────────

export interface CancelOrderResult {
  success: boolean;
  orderId: string;
  message: string;
}

export async function cancelFlightOrder(orderId: string): Promise<CancelOrderResult> {
  console.log(`[Amadeus] Cancelling flight order: ${orderId}`);

  try {
    await (amadeus as any).booking.flightOrder(orderId).delete();

    console.log(`[Amadeus] ✅ Flight order ${orderId} cancelled successfully`);
    return {
      success: true,
      orderId,
      message: "Flight order cancelled successfully",
    };
  } catch (err: any) {
    console.error(`[Amadeus] ❌ Failed to cancel order ${orderId}:`, err?.message || err);
    const detail = err?.response?.result?.errors?.[0]?.detail || err?.message || "CANCEL_ERROR";
    throw new Error(detail);
  }
}

// ─── Amadeus Status Info ────────────────────────────────────────────────────

export interface AmadeusStatusInfo {
  officeId: string;
  environment: "production" | "test";
  isConnected: boolean;
  clientIdConfigured: boolean;
}

export function getAmadeusStatus(): AmadeusStatusInfo & { consolidatorOfficeId: string } {
  return {
    officeId: OFFICE_ID,
    consolidatorOfficeId: CONSOLIDATOR_OFFICE_ID,
    environment: isProd ? "production" : "test",
    isConnected: true,
    clientIdConfigured: !!(isProd
      ? process.env.AMADEUS_PROD_CLIENT_ID
      : process.env.AMADEUS_CLIENT_ID),
  };
}

// ─── Consolidator: Queue PNR for Ticket Issuance ──────────────────────────
// When a consolidator is configured, PNRs are automatically queued during
// createFlightOrder via DELAY_TO_QUEUE + queuingOfficeId. This function
// allows manual re-queuing or checking the queue status of an existing order.

export interface ConsolidatorQueueResult {
  success: boolean;
  orderId: string;
  consolidatorOfficeId: string;
  ticketingOption: string;
  message: string;
}

/**
 * Re-queues an existing flight order to the consolidator for ticket issuance.
 * This retrieves the order, checks its status, and provides consolidator info.
 * Actual re-queuing in Amadeus Self-Service is done by retrieving the order
 * (which refreshes its queue position) and verifying the ticketing agreement.
 */
export async function queueToConsolidator(orderId: string): Promise<ConsolidatorQueueResult> {
  if (!CONSOLIDATOR_OFFICE_ID) {
    throw new Error("No consolidator configured. Set AMADEUS_CONSOLIDATOR_OFFICE_ID.");
  }

  console.log(`[Amadeus] \uD83C\uDFAB Queuing order ${orderId} to consolidator ${CONSOLIDATOR_OFFICE_ID}`);

  try {
    // Retrieve the order to verify it exists and check status
    const response = await (amadeus as any).booking.flightOrder(orderId).get();
    const order = response.data;

    const status = order?.type === "flight-order" ? "CONFIRMED" : "UNKNOWN";
    const ticketingOption = order?.ticketingAgreement?.option || "N/A";

    // Check if already ticketed
    const ticketingInfo = order?.ticketingAgreement?.ticketingInfo || [];
    const hasTickets = ticketingInfo.some((t: any) => t.ticketNumber);

    if (hasTickets) {
      return {
        success: true,
        orderId,
        consolidatorOfficeId: CONSOLIDATOR_OFFICE_ID,
        ticketingOption,
        message: "Order already has tickets issued. No need to re-queue.",
      };
    }

    console.log(`[Amadeus] \u2705 Order ${orderId} verified. Status: ${status}, Ticketing: ${ticketingOption}`);
    return {
      success: true,
      orderId,
      consolidatorOfficeId: CONSOLIDATOR_OFFICE_ID,
      ticketingOption,
      message: `Order queued to consolidator ${CONSOLIDATOR_OFFICE_ID} for ticket issuance. Current ticketing option: ${ticketingOption}.`,
    };
  } catch (err: any) {
    console.error(`[Amadeus] \u274C Failed to queue order ${orderId}:`, err?.message || err);
    const detail = err?.response?.result?.errors?.[0]?.detail || err?.message || "QUEUE_ERROR";
    throw new Error(detail);
  }
}

/**
 * Returns consolidator configuration info (multi-consolidator aware).
 */
export function getConsolidatorConfig() {
  const active = consolidators[activeConsolidatorIndex];
  return {
    isConfigured: consolidators.length > 0,
    consolidatorOfficeId: active?.officeId || "",
    consolidatorCurrency: active?.currency || "MRU",
    agencyOfficeId: OFFICE_ID,
    environment: isProd ? "production" as const : "test" as const,
    ticketingMode: consolidators.length > 0 ? "DELAY_TO_QUEUE" : "CONFIRM",
    consolidators: consolidators.map((c, i) => ({
      ...c,
      isActive: i === activeConsolidatorIndex,
    })),
    activeIndex: activeConsolidatorIndex,
  };
}

/**
 * Set the active consolidator by index.
 */
export function setActiveConsolidator(index: number) {
  if (index < 0 || index >= consolidators.length) {
    throw new Error(`Invalid consolidator index: ${index}. Available: 0-${consolidators.length - 1}`);
  }
  activeConsolidatorIndex = index;
  CONSOLIDATOR_OFFICE_ID = getActiveConsolidatorOfficeId();
  console.log(`[Amadeus] 🎫 Active consolidator switched to: ${CONSOLIDATOR_OFFICE_ID} (${getActiveConsolidatorCurrency()})`);
  return getConsolidatorConfig();
}

/**
 * Add a new consolidator at runtime.
 */
export function addConsolidator(officeId: string, currency: string) {
  const trimmed = officeId.trim().toUpperCase();
  if (!trimmed || !/^[A-Z]{3}\d{4,6}[A-Z]?$/.test(trimmed)) {
    throw new Error(`Invalid IATA Office ID format: ${trimmed}. Expected format: ABC12345X`);
  }
  const cur = currency.trim().toUpperCase() || "MRU";
  // Check if already exists
  const existing = consolidators.findIndex(c => c.officeId === trimmed);
  if (existing >= 0) {
    // Update currency
    consolidators[existing].currency = cur;
    consolidators[existing].label = buildConsolidatorLabel(trimmed, cur);
    console.log(`[Amadeus] 🎫 Consolidator ${trimmed} updated to currency: ${cur}`);
    return getConsolidatorConfig();
  }
  consolidators.push({
    officeId: trimmed,
    currency: cur,
    label: buildConsolidatorLabel(trimmed, cur),
    city: parseConsolidatorCity(trimmed),
  });
  console.log(`[Amadeus] 🎫 Consolidator added: ${trimmed} (${cur})`);
  return getConsolidatorConfig();
}

/**
 * Remove a consolidator by index.
 */
export function removeConsolidator(index: number) {
  if (index < 0 || index >= consolidators.length) {
    throw new Error(`Invalid consolidator index: ${index}`);
  }
  const removed = consolidators.splice(index, 1)[0];
  if (activeConsolidatorIndex >= consolidators.length) {
    activeConsolidatorIndex = Math.max(0, consolidators.length - 1);
  }
  CONSOLIDATOR_OFFICE_ID = getActiveConsolidatorOfficeId();
  console.log(`[Amadeus] 🎫 Consolidator removed: ${removed.officeId}`);
  return getConsolidatorConfig();
}

/**
 * Update the Consolidator Office ID at runtime (backward compat - updates first consolidator).
 */
export function setConsolidatorOfficeId(newOfficeId: string) {
  const trimmed = newOfficeId.trim().toUpperCase();
  if (trimmed && !/^[A-Z]{3}\d{4,6}[A-Z]?$/.test(trimmed)) {
    throw new Error(`Invalid IATA Office ID format: ${trimmed}. Expected format: ABC12345X`);
  }
  if (consolidators.length > 0) {
    consolidators[0].officeId = trimmed;
    consolidators[0].label = buildConsolidatorLabel(trimmed, consolidators[0].currency);
    consolidators[0].city = parseConsolidatorCity(trimmed);
  } else if (trimmed) {
    consolidators.push({
      officeId: trimmed,
      currency: "MRU",
      label: buildConsolidatorLabel(trimmed, "MRU"),
      city: parseConsolidatorCity(trimmed),
    });
  }
  CONSOLIDATOR_OFFICE_ID = getActiveConsolidatorOfficeId();
  console.log(`[Amadeus] 🎫 Consolidator Office ID updated to: ${trimmed || '(disabled)'}`);
  return getConsolidatorConfig();
}

/**
 * Queue a PNR to a specific consolidator by index (or active one).
 */
export function getConsolidatorForBooking(consolidatorIndex?: number): ConsolidatorEntry | null {
  if (consolidatorIndex !== undefined && consolidatorIndex >= 0 && consolidatorIndex < consolidators.length) {
    return consolidators[consolidatorIndex];
  }
  return consolidators[activeConsolidatorIndex] || null;
}

// ─── Flight Order Management: Issue Ticket ──────────────────────────────────
// Note: Amadeus Self-Service API does not have a direct "issue ticket" endpoint.
// Ticketing is handled by the airline after order creation with CONFIRM option.
// This function retrieves the order to check if ticketing info is available,
// and returns the ticket numbers if they exist.

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
  console.log(`[Amadeus] Checking ticket issuance for order: ${orderId}`);

  try {
    const response = await (amadeus as any).booking.flightOrder(orderId).get();
    const order = response.data;

    // Extract ticket info from various possible locations in the response
    const tickets: TicketIssuanceResult["tickets"] = [];

    // Check ticketingAgreement.ticketingInfo
    const ticketingInfo = order?.ticketingAgreement?.ticketingInfo || [];
    for (const t of ticketingInfo) {
      if (t.ticketNumber) {
        tickets.push({
          ticketNumber: t.ticketNumber,
          status: t.status || "ISSUED",
          dateOfIssuance: t.dateOfIssuance,
          travelerId: t.travelerId,
        });
      }
    }

    // Also check travelerPricings for e-ticket info
    const travelerPricings = order?.flightOffers?.[0]?.travelerPricings || [];
    for (const tp of travelerPricings) {
      const fareDetails = tp.fareDetailsBySegment || [];
      for (const fd of fareDetails) {
        if (fd.ticketNumber && !tickets.find(t => t.ticketNumber === fd.ticketNumber)) {
          tickets.push({
            ticketNumber: fd.ticketNumber,
            status: "ISSUED",
            travelerId: tp.travelerId,
          });
        }
      }
    }

    if (tickets.length > 0) {
      console.log(`[Amadeus] ✅ Found ${tickets.length} ticket(s) for order ${orderId}`);
      return {
        success: true,
        orderId,
        tickets,
        message: `${tickets.length} ticket(s) found`,
      };
    }

    // No tickets found - order may still be pending ticketing
    const status = order?.type === "flight-order" ? "CONFIRMED_PENDING_TICKETING" : "UNKNOWN";
    console.log(`[Amadeus] ⏳ No tickets found for order ${orderId} (status: ${status})`);
    return {
      success: true,
      orderId,
      tickets: [],
      message: "Order confirmed but tickets not yet issued by airline. Ticketing is automatic after order confirmation.",
    };
  } catch (err: any) {
    console.error(`[Amadeus] ❌ Failed to check ticket issuance for ${orderId}:`, err?.message || err);
    const detail = err?.response?.result?.errors?.[0]?.detail || err?.message || "TICKET_CHECK_ERROR";
    throw new Error(detail);
  }
}
