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
  // Per-passenger-type pricing from Duffel
  passengerPricing?: Array<{
    type: string; // "adult" | "child" | "infant_without_seat"
    quantity: number;
    totalAmount: number; // Total for all passengers of this type
    perPersonAmount: number; // Per-person amount for this type
  }>;
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

// ─── Arabic/French → English City/Airport Translation Map ────────────────────
// Duffel suggestions API only supports English queries.
// This map translates common Arabic & French city names so users can search in their language.
const CITY_TRANSLATION_MAP: Record<string, string> = {
  // Arabic names
  "بيروت": "Beirut",
  "اسطنبول": "Istanbul",
  "إسطنبول": "Istanbul",
  "اسطمبول": "Istanbul",
  "إسطمبول": "Istanbul",
  "استانبول": "Istanbul",
  "دبي": "Dubai",
  "الدوحة": "Doha",
  "القاهرة": "Cairo",
  "الرياض": "Riyadh",
  "جدة": "Jeddah",
  "نواكشوط": "Nouakchott",
  "الدار البيضاء": "Casablanca",
  "مراكش": "Marrakech",
  "تونس": "Tunis",
  "الجزائر": "Algiers",
  "عمان": "Amman",
  "بغداد": "Baghdad",
  "دمشق": "Damascus",
  "أبوظبي": "Abu Dhabi",
  "ابوظبي": "Abu Dhabi",
  "المنامة": "Bahrain",
  "مسقط": "Muscat",
  "الكويت": "Kuwait",
  "باريس": "Paris",
  "لندن": "London",
  "مدريد": "Madrid",
  "روما": "Rome",
  "برلين": "Berlin",
  "أمستردام": "Amsterdam",
  "نيويورك": "New York",
  "واشنطن": "Washington",
  "لوس أنجلوس": "Los Angeles",
  "شيكاغو": "Chicago",
  "تورنتو": "Toronto",
  "مونتريال": "Montreal",
  "طوكيو": "Tokyo",
  "بكين": "Beijing",
  "شنغهاي": "Shanghai",
  "سنغافورة": "Singapore",
  "بانكوك": "Bangkok",
  "كوالالمبور": "Kuala Lumpur",
  "جاكرتا": "Jakarta",
  "سيول": "Seoul",
  "ميلانو": "Milan",
  "برشلونة": "Barcelona",
  "فرانكفورت": "Frankfurt",
  "ميونخ": "Munich",
  "زيورخ": "Zurich",
  "جنيف": "Geneva",
  "فيينا": "Vienna",
  "بروكسل": "Brussels",
  "لشبونة": "Lisbon",
  "أثينا": "Athens",
  "موسكو": "Moscow",
  "أنقرة": "Ankara",
  "طرابلس": "Tripoli",
  "الخرطوم": "Khartoum",
  "أديس أبابا": "Addis Ababa",
  "نيروبي": "Nairobi",
  "لاغوس": "Lagos",
  "أكرا": "Accra",
  "داكار": "Dakar",
  "أبيدجان": "Abidjan",
  "جوهانسبرغ": "Johannesburg",
  "كيب تاون": "Cape Town",
  "المدينة المنورة": "Medina",
  "مكة": "Mecca",
  "الطائف": "Taif",
  "أنطاليا": "Antalya",
  "بودروم": "Bodrum",
  "شرم الشيخ": "Sharm El Sheikh",
  "الغردقة": "Hurghada",
  "الأقصر": "Luxor",
  "أسوان": "Aswan",
  "طنجة": "Tangier",
  "فاس": "Fez",
  "أغادير": "Agadir",
  "وهران": "Oran",
  "قسنطينة": "Constantine",
  // French names
  "Le Caire": "Cairo",
  "Riyad": "Riyadh",
  "Djeddah": "Jeddah",
  "Beyrouth": "Beirut",
  "Damas": "Damascus",
  "Koweït": "Kuwait",
  "Pékin": "Beijing",
  "Moscou": "Moscow",
  "Athènes": "Athens",
  "Vienne": "Vienna",
  "Bruxelles": "Brussels",
  "Lisbonne": "Lisbon",
  "Genève": "Geneva",
  "Zurich": "Zurich",
  "Francfort": "Frankfurt",
  "Barcelone": "Barcelona",
  "Milan": "Milan",
  "Séoul": "Seoul",
  "Singapour": "Singapore",
  "Abidjan": "Abidjan",
  "Alger": "Algiers",
  "Tripoli": "Tripoli",
  "Khartoum": "Khartoum",
  "Addis-Abeba": "Addis Ababa",
  "Le Cap": "Cape Town",
  "Charm el-Cheikh": "Sharm El Sheikh",
  "Hurghada": "Hurghada",
  "Louxor": "Luxor",
  "Assouan": "Aswan",
  "Tanger": "Tangier",
  "Fès": "Fez",
  "Oran": "Oran",
  "Médine": "Medina",
  "La Mecque": "Mecca",
  "Antalya": "Antalya",
};

/**
 * Translate a non-English keyword to English using the city map.
 * Tries exact match first, then partial/fuzzy match.
 */
function translateToEnglish(keyword: string): string {
  // Exact match
  if (CITY_TRANSLATION_MAP[keyword]) return CITY_TRANSLATION_MAP[keyword];
  // Case-insensitive match
  const lower = keyword.toLowerCase();
  for (const [key, value] of Object.entries(CITY_TRANSLATION_MAP)) {
    if (key.toLowerCase() === lower) return value;
  }
  // Partial match (keyword contains or is contained in a key)
  for (const [key, value] of Object.entries(CITY_TRANSLATION_MAP)) {
    if (key.includes(keyword) || keyword.includes(key)) return value;
  }
  return keyword; // No translation found, return as-is
}

/**
 * Detect if keyword contains non-Latin characters (Arabic, French accented, etc.)
 */
function hasNonLatinChars(text: string): boolean {
  return /[^\x00-\x7F]/.test(text);
}

export async function searchLocations(
  keyword: string
): Promise<LocationSuggestion[]> {
  if (keyword.length < 2) return [];

  // Always try translation (for Arabic, French, and accented Latin keywords)
  const translatedKeyword = translateToEnglish(keyword);
  const searchKeyword = translatedKeyword;

  try {
    console.log(`[Duffel] searchLocations: "${keyword}" → "${searchKeyword}"`);
    const response = await duffel.suggestions.list({
      query: searchKeyword,
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
        `https://api.duffel.com/air/airports?name=${encodeURIComponent(searchKeyword)}&limit=8`,
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
  childAges?: number[]; // actual ages of children (2-11)
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
    const ages = params.childAges || [];
    for (let i = 0; i < params.children; i++) {
      const age = ages[i] ?? 5; // Use actual age or default to 5
      passengers.push({ age });
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

    // Extract per-passenger-type pricing from Duffel offer
    const passengerPricing: FlightOffer["passengerPricing"] = [];
    const offerPassengers = offer.passengers || [];
    const typeMap = new Map<string, { quantity: number; total: number }>();
    for (const p of offerPassengers) {
      const pType = p.type || (p.age && p.age < 2 ? "infant_without_seat" : p.age && p.age < 12 ? "child" : "adult");
      const existing = typeMap.get(pType) || { quantity: 0, total: 0 };
      existing.quantity += 1;
      // Duffel provides per-passenger fare in passenger object or we can derive from total
      // The passenger object may have fare_amount or we use total_amount / count
      existing.total += 0; // Will be computed from slices below
      typeMap.set(pType, existing);
    }
    // Try to get per-passenger pricing from slices
    for (const slice of (offer.slices || [])) {
      for (const seg of (slice.segments || [])) {
        for (const pax of (seg.passengers || [])) {
          // Each segment passenger has a passenger_id that maps to offer.passengers
          const matchedPax = offerPassengers.find((op: any) => op.id === pax.passenger_id);
          if (matchedPax) {
            // We only need to count once per passenger across segments
            // Skip — pricing is at offer level, not segment level
          }
        }
      }
    }
    // Simpler approach: use total_amount and divide proportionally
    // Duffel doesn't always provide per-type breakdown in the offer object
    // But we can check if passengers have individual amounts
    const totalAmount = parseFloat(offer.total_amount || "0");
    if (typeMap.size > 0) {
      // Check if Duffel provides per-passenger amounts in the offer
      let hasIndividualPricing = false;
      for (const p of offerPassengers) {
        if (p.fare_amount || p.loyalty_programme_accounts) {
          hasIndividualPricing = true;
          break;
        }
      }
      
      if (!hasIndividualPricing && typeMap.size === 1) {
        // All same type — simple division
        for (const [type, data] of typeMap) {
          passengerPricing.push({
            type,
            quantity: data.quantity,
            totalAmount: totalAmount,
            perPersonAmount: Math.round((totalAmount / data.quantity) * 100) / 100,
          });
        }
      } else {
        // Multiple types — estimate infant at ~10% of adult price
        const adultData = typeMap.get("adult") || { quantity: 1, total: 0 };
        const childData = typeMap.get("child");
        const infantData = typeMap.get("infant_without_seat");
        
        // Typical airline pricing: infant ~10% of adult, child ~75% of adult
        const infantRatio = 0.10;
        const childRatio = 0.75;
        let weightedTotal = adultData.quantity * 1.0;
        if (childData) weightedTotal += childData.quantity * childRatio;
        if (infantData) weightedTotal += infantData.quantity * infantRatio;
        
        const adultPerPerson = totalAmount / weightedTotal;
        
        passengerPricing.push({
          type: "adult",
          quantity: adultData.quantity,
          totalAmount: Math.round(adultPerPerson * adultData.quantity * 100) / 100,
          perPersonAmount: Math.round(adultPerPerson * 100) / 100,
        });
        if (childData) {
          const childPerPerson = adultPerPerson * childRatio;
          passengerPricing.push({
            type: "child",
            quantity: childData.quantity,
            totalAmount: Math.round(childPerPerson * childData.quantity * 100) / 100,
            perPersonAmount: Math.round(childPerPerson * 100) / 100,
          });
        }
        if (infantData) {
          const infantPerPerson = adultPerPerson * infantRatio;
          passengerPricing.push({
            type: "infant_without_seat",
            quantity: infantData.quantity,
            totalAmount: Math.round(infantPerPerson * infantData.quantity * 100) / 100,
            perPersonAmount: Math.round(infantPerPerson * 100) / 100,
          });
        }
      }
    }

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
      price: totalAmount,
      currency: offer.total_currency || "USD",
      class: cabinClassDisplay.toUpperCase(),
      seatsLeft: offer.available_services?.length ?? 9,
      rawOffer: offer,
      passengerPricing: passengerPricing.length > 0 ? passengerPricing : undefined,
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
      agency_email: "suporte@royalvoyage.online",
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

// ─── Create Hold Order (Reserve without payment — 24h hold) ─────────────────

export type HoldOrderResult = {
  orderId: string;
  pnr: string;
  status: string;
  paymentRequiredBy: string; // ISO deadline
  totalAmount: string;
  totalCurrency: string;
  associatedRecords: Array<{ reference: string; originSystemCode?: string }>;
};

export async function createHoldOrder(
  pricedOffer: any,
  travelers: TravelerInput[]
): Promise<HoldOrderResult> {
  const offerId = pricedOffer?.id || pricedOffer;
  const offerData = typeof pricedOffer === "object" ? pricedOffer : getCachedOffer(offerId);
  if (!offerData) {
    throw new Error("Offer not found or expired. Please search again.");
  }

  // Check if the offer supports hold
  const requiresInstant = offerData.payment_requirements?.requires_instant_payment;
  if (requiresInstant === true) {
    throw new Error("INSTANT_PAYMENT_REQUIRED: This offer does not support hold. Please use instant payment.");
  }

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

  console.log(`[Duffel] Creating HOLD order for offer ${offerId} with ${travelers.length} passenger(s)...`);

  const orderResponse = await duffel.orders.create({
    type: "hold" as any,
    selected_offers: [offerId],
    passengers: passengersPayload as any,
    metadata: {
      agency: "Royal Voyage",
      agency_phone: "+22233700000",
      agency_email: "suporte@royalvoyage.online",
    },
  });

  const order = orderResponse.data;
  const pnr = order.booking_reference || "";
  const orderId = order.id || "";

  // Get payment deadline from Duffel
  const paymentRequiredBy = (order as any).payment_status?.payment_required_by
    || (order as any).payment_required_by
    || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const associatedRecords: Array<{ reference: string; originSystemCode: string }> = [];
  if (order.booking_reference) {
    associatedRecords.push({
      reference: order.booking_reference,
      originSystemCode: order.owner?.iata_code || "",
    });
  }

  console.log(`[Duffel] ✅ Hold order created! ID: ${orderId}, PNR: ${pnr}, Pay by: ${paymentRequiredBy}`);

  return {
    orderId,
    pnr,
    status: "AWAITING_PAYMENT",
    paymentRequiredBy,
    totalAmount: order.total_amount || "0",
    totalCurrency: order.total_currency || "USD",
    associatedRecords,
  };
}

// ─── Pay for Hold Order (Confirm payment and issue tickets) ─────────────────

export type PayHoldOrderResult = {
  orderId: string;
  pnr: string;
  status: string;
  documents: Array<{ type: string; unique_identifier: string }>;
  ticketNumber?: string;
};

export async function payForHoldOrder(orderId: string): Promise<PayHoldOrderResult> {
  console.log(`[Duffel] Paying for hold order: ${orderId}`);

  // First get the order to know the amount
  const orderResponse = await duffel.orders.get(orderId);
  const order = orderResponse.data;

  if (order.cancelled_at) {
    throw new Error("ORDER_CANCELLED: This order has been cancelled.");
  }

  const awaitingPayment = (order as any).payment_status?.awaiting_payment;
  if (awaitingPayment === false) {
    // Already paid — just return current state
    const documents = (order.documents || []).map((doc: any) => ({
      type: doc.type || "electronic_ticket",
      unique_identifier: doc.unique_identifier || "",
    }));
    return {
      orderId: order.id,
      pnr: order.booking_reference || "",
      status: "CONFIRMED",
      documents,
      ticketNumber: documents[0]?.unique_identifier || undefined,
    };
  }

  // Create payment
  const paymentResponse = await duffel.payments.create({
    order_id: orderId,
    payment: {
      type: "balance" as any,
      amount: order.total_amount || "0",
      currency: order.total_currency || "USD",
    },
  });

  console.log(`[Duffel] ✅ Payment confirmed for order ${orderId}`);

  // Re-fetch order to get documents (tickets)
  const updatedOrderResponse = await duffel.orders.get(orderId);
  const updatedOrder = updatedOrderResponse.data;

  const documents = (updatedOrder.documents || []).map((doc: any) => ({
    type: doc.type || "electronic_ticket",
    unique_identifier: doc.unique_identifier || "",
  }));

  const ticketNumber = documents[0]?.unique_identifier || undefined;

  console.log(`[Duffel] 🎫 ${documents.length} ticket(s) issued after payment. Ticket: ${ticketNumber || "pending"}`);

  return {
    orderId: updatedOrder.id,
    pnr: updatedOrder.booking_reference || "",
    status: "CONFIRMED",
    documents,
    ticketNumber,
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
