import Amadeus from "amadeus";

// Initialize Amadeus SDK — credentials loaded from environment variables
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID!,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
  // hostname: 'production' // uncomment for production environment
});

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
  rawOffer: unknown; // full Amadeus offer for pricing/booking
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
};

function getAirlineName(code: string): string {
  return AIRLINE_NAMES[code] || code;
}

function parseDuration(isoDuration: string): string {
  // PT2H30M → 2h 30m
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;
  const hours = match[1] ? `${match[1]}h` : "";
  const mins = match[2] ? ` ${match[2]}m` : "";
  return `${hours}${mins}`.trim();
}

function formatTime(isoDateTime: string): string {
  // 2026-05-01T08:30:00 → 08:30
  return isoDateTime.slice(11, 16);
}

function getHotelImage(city: string): string {
  const images: Record<string, string> = {
    Dubai: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    Paris: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    London: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    Tokyo: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    "New York": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    Bali: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    Istanbul: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
    Barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
    Rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
    Amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80",
  };
  return (
    images[city] ||
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"
  );
}

// ─── Flight Search ────────────────────────────────────────────────────────────

export async function searchFlights(params: {
  originCode: string;
  destinationCode: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  adults: number;
  travelClass?: string;
  max?: number;
}): Promise<FlightOffer[]> {
  const query: Record<string, string> = {
    originLocationCode: params.originCode,
    destinationLocationCode: params.destinationCode,
    departureDate: params.departureDate,
    adults: String(params.adults),
    max: String(params.max ?? 15),
    currencyCode: "USD",
  };

  if (params.returnDate) query.returnDate = params.returnDate;
  if (params.travelClass) query.travelClass = params.travelClass;

  const response = await amadeus.shopping.flightOffersSearch.get(query);
  const offers = response.data as any[];

  return offers.map((offer: any, idx: number): FlightOffer => {
    const itinerary = offer.itineraries[0];
    const segments = itinerary.segments;
    const firstSeg = segments[0];
    const lastSeg = segments[segments.length - 1];
    const airlineCode = offer.validatingAirlineCodes?.[0] || firstSeg.carrierCode;

    return {
      id: offer.id || `f${idx}`,
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
      class: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || "ECONOMY",
      seatsLeft: offer.numberOfBookableSeats ?? 9,
      rawOffer: offer,
    };
  });
}

// ─── Airport / City Autocomplete ──────────────────────────────────────────────

export async function searchLocations(keyword: string): Promise<LocationSuggestion[]> {
  if (keyword.length < 2) return [];

  const response = await amadeus.referenceData.locations.get({
    keyword,
    subType: "AIRPORT,CITY",
    "page[limit]": "8",
  });

  const data = response.data as any[];
  return data.map((loc: any): LocationSuggestion => ({
    name: loc.name || loc.detailedName || keyword,
    iataCode: loc.iataCode,
    cityName: loc.address?.cityName || loc.name || "",
    countryName: loc.address?.countryName || "",
    type: loc.subType as "AIRPORT" | "CITY",
  }));
}

// ─── Hotel Search ─────────────────────────────────────────────────────────────

export async function searchHotelsByCity(params: {
  cityCode: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  adults: number;
  rooms?: number;
  ratings?: string; // "3,4,5"
}): Promise<HotelOffer[]> {
  // Step 1: Get hotel list by city
  const listResponse = await amadeus.referenceData.locations.hotels.byCity.get({
    cityCode: params.cityCode,
    ratings: params.ratings || "3,4,5",
    amenities: "SWIMMING_POOL,WIFI",
  });

  const hotels = (listResponse.data as any[]).slice(0, 20);
  if (hotels.length === 0) return [];

  const hotelIds = hotels.map((h: any) => h.hotelId).join(",");

  // Step 2: Get offers for those hotels
  let offersData: any[] = [];
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
    offersData = offersResponse.data as any[];
  } catch {
    // If hotel offers fail, return hotels without pricing
    offersData = [];
  }

  // Build a map of hotelId → offer
  const offerMap = new Map<string, any>();
  for (const item of offersData) {
    offerMap.set(item.hotel?.hotelId, item);
  }

  return hotels.slice(0, 10).map((h: any, idx: number): HotelOffer => {
    const offerItem = offerMap.get(h.hotelId);
    const offer = offerItem?.offers?.[0];
    const cityName = h.address?.cityName || params.cityCode;

    return {
      id: h.hotelId || `hotel_${idx}`,
      hotelId: h.hotelId,
      name: h.name || "Hotel",
      city: cityName,
      country: h.address?.countryCode || "",
      latitude: h.geoCode?.latitude,
      longitude: h.geoCode?.longitude,
      rating: parseFloat(h.rating || "4.0"),
      stars: parseInt(h.rating || "4", 10),
      pricePerNight: offer ? parseFloat(offer.price?.total || "0") : 0,
      currency: offer?.price?.currency || "USD",
      amenities: (h.amenities || []).slice(0, 6).map((a: string) =>
        a.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
      ),
      description: `${h.name} — a ${h.rating || "4"}-star hotel in ${cityName}.`,
      address: [h.address?.lines?.[0], cityName].filter(Boolean).join(", "),
      image: getHotelImage(cityName),
    };
  });
}
