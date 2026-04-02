import crypto from "crypto";

// ─── HBX Group (Hotelbeds) API Client ──────────────────────────────────────
// Docs: https://developer.hotelbeds.com/documentation/hotels/booking-api/
//
// Authentication: X-Signature = SHA256(apiKey + apiSecret + unixTimestamp)
// Base URL (production): https://api.hotelbeds.com/hotel-api/1.0
// Base URL (test):       https://api.test.hotelbeds.com/hotel-api/1.0

const HBX_API_KEY = process.env.HBX_API_KEY ?? "";
const HBX_API_SECRET = process.env.HBX_API_SECRET ?? "";
const HBX_BASE_URL = "https://api.hotelbeds.com/hotel-api/1.0";
const HBX_TEST_BASE_URL = "https://api.test.hotelbeds.com/hotel-api/1.0";

// Use test environment by default (production requires HBX approval)
// Set HBX_USE_PRODUCTION=true to switch to production
const isProduction = process.env.HBX_USE_PRODUCTION === "true";
const BASE_URL = isProduction ? HBX_BASE_URL : HBX_TEST_BASE_URL;

if (HBX_API_KEY) {
  console.log(`[HBX] 🟢 Connected to ${isProduction ? "PRODUCTION" : "TEST"} API`);
} else {
  console.log("[HBX] ⚠️ No HBX_API_KEY configured");
}

// ─── Signature Generator ────────────────────────────────────────────────────
function generateSignature(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const raw = HBX_API_KEY + HBX_API_SECRET + timestamp;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ─── Request Headers ────────────────────────────────────────────────────────
function getHeaders(): Record<string, string> {
  return {
    "Api-key": HBX_API_KEY,
    "X-Signature": generateSignature(),
    "Accept": "application/json",
    "Accept-Encoding": "gzip",
    "Content-Type": "application/json",
  };
}

// ─── Types ──────────────────────────────────────────────────────────────────
export type HBXHotelOffer = {
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
  rateKey?: string;
  rateType?: "BOOKABLE" | "RECHECK";
  boardCode?: string;
  boardName?: string;
  cancellationPolicies?: Array<{ amount: string; from: string }>;
  minRate?: number;
  maxRate?: number;
};

export type HBXBookingResult = {
  reference: string;
  status: string;
  totalNet: string;
  currency: string;
  hotel: {
    code: number;
    name: string;
    checkIn: string;
    checkOut: string;
  };
};

// ─── Hotel Images Cache ──────────────────────────────────────────────────────
// Simple in-memory cache for hotel images to avoid repeated Content API calls
const hotelImageCache = new Map<number, string>();

// Fallback hotel images by star rating
const FALLBACK_IMAGES: Record<number, string> = {
  5: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  4: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
  3: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  2: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
  1: "https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&q=80",
};

function getHotelImage(hotelCode: number, stars: number): string {
  if (hotelImageCache.has(hotelCode)) {
    return hotelImageCache.get(hotelCode)!;
  }
  return FALLBACK_IMAGES[Math.min(Math.max(stars, 1), 5)] || FALLBACK_IMAGES[3];
}

// ─── Category Code to Stars ──────────────────────────────────────────────────
function categoryToStars(categoryCode: string): number {
  const match = categoryCode?.match(/^(\d)/);
  if (match) return parseInt(match[1], 10);
  if (categoryCode?.includes("5")) return 5;
  if (categoryCode?.includes("4")) return 4;
  if (categoryCode?.includes("3")) return 3;
  return 3;
}

// ─── Search Hotels by Destination ───────────────────────────────────────────
export async function searchHotelsByDestination(params: {
  destinationCode: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  rooms: number;
  ratings?: string; // e.g. "3,4,5"
}): Promise<HBXHotelOffer[]> {
  if (!HBX_API_KEY || !HBX_API_SECRET) {
    console.warn("[HBX] Missing API credentials");
    return [];
  }

  const checkIn = params.checkInDate;
  const checkOut = params.checkOutDate;

  // Calculate number of nights
  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const requestBody: Record<string, unknown> = {
    stay: {
      checkIn,
      checkOut,
    },
    occupancies: [
      {
        rooms: params.rooms,
        adults: params.adults,
        children: 0,
      },
    ],
    destination: {
      code: params.destinationCode,
    },
    filter: {
      maxHotels: 20,
    },
  };

  // Add star rating filter if provided
  if (params.ratings) {
    const ratingList = params.ratings.split(",").map(Number).filter(Boolean);
    if (ratingList.length > 0) {
      requestBody.filter = {
        ...requestBody.filter as object,
        minCategory: Math.min(...ratingList),
        maxCategory: Math.max(...ratingList),
      };
    }
  }

  console.log(`[HBX] Searching hotels in destination: ${params.destinationCode}, checkIn: ${checkIn}, checkOut: ${checkOut}`);

  const response = await fetch(`${BASE_URL}/hotels`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[HBX] Search error ${response.status}:`, errorText);
    throw new Error(`HBX API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const hotels = data?.hotels?.hotels ?? [];

  console.log(`[HBX] Found ${hotels.length} hotels`);

  return hotels.map((hotel: any): HBXHotelOffer => {
    const stars = categoryToStars(hotel.categoryCode || "");
    const bestRoom = hotel.rooms?.[0];
    const bestRate = bestRoom?.rates?.[0];
    const totalNet = parseFloat(bestRate?.net || hotel.minRate || "0");
    const pricePerNight = nights > 0 ? totalNet / nights : totalNet;

    return {
      id: `hbx_${hotel.code}`,
      hotelId: String(hotel.code),
      name: hotel.name || "Hotel",
      city: hotel.destinationName || hotel.zoneName || params.destinationCode,
      country: hotel.countryCode || "",
      latitude: hotel.latitude ? parseFloat(hotel.latitude) : undefined,
      longitude: hotel.longitude ? parseFloat(hotel.longitude) : undefined,
      rating: parseFloat(hotel.categoryCode?.match(/(\d)/)?.[1] || "3"),
      stars,
      pricePerNight: Math.round(pricePerNight * 100) / 100,
      currency: data?.hotels?.currency || "USD",
      amenities: [],
      description: `${hotel.name} — ${hotel.categoryName || stars + " Stars"} — ${hotel.zoneName || hotel.destinationName || ""}`,
      address: hotel.address || "",
      image: getHotelImage(hotel.code, stars),
      rateKey: bestRate?.rateKey,
      rateType: bestRate?.rateType as "BOOKABLE" | "RECHECK",
      boardCode: bestRate?.boardCode,
      boardName: bestRate?.boardName,
      cancellationPolicies: bestRate?.cancellationPolicies,
      minRate: parseFloat(hotel.minRate || "0"),
      maxRate: parseFloat(hotel.maxRate || "0"),
    };
  });
}

// ─── Search Hotels by City IATA Code ────────────────────────────────────────
// Maps IATA city codes to HBX destination codes
// HBX uses its own destination codes (e.g., BCN for Barcelona, PMI for Palma)
export async function searchHotelsByCityCode(params: {
  cityCode: string; // IATA code (e.g., "BCN", "CDG")
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  rooms: number;
  ratings?: string;
}): Promise<HBXHotelOffer[]> {
  // HBX destination codes often match IATA city codes
  // Try direct search first with the IATA code as destination code
  try {
    return await searchHotelsByDestination({
      destinationCode: params.cityCode,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults,
      rooms: params.rooms,
      ratings: params.ratings,
    });
  } catch (err: any) {
    console.error(`[HBX] searchHotelsByCityCode error for ${params.cityCode}:`, err.message);
    return [];
  }
}

// ─── CheckRate ───────────────────────────────────────────────────────────────
export async function checkRate(rateKey: string): Promise<{
  rateKey: string;
  rateType: string;
  net: string;
  currency: string;
  cancellationPolicies: Array<{ amount: string; from: string }>;
} | null> {
  if (!HBX_API_KEY || !HBX_API_SECRET) return null;

  const response = await fetch(`${BASE_URL}/checkrates`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      rooms: [{ rateKey }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[HBX] CheckRate error ${response.status}:`, errorText);
    return null;
  }

  const data = await response.json();
  const rate = data?.hotel?.rooms?.[0]?.rates?.[0];
  if (!rate) return null;

  return {
    rateKey: rate.rateKey,
    rateType: rate.rateType,
    net: rate.net,
    currency: data?.hotel?.currency || "USD",
    cancellationPolicies: rate.cancellationPolicies || [],
  };
}

// ─── Create Booking ──────────────────────────────────────────────────────────
export async function createHotelBooking(params: {
  rateKey: string;
  holderName: string;
  holderSurname: string;
  holderEmail?: string;
  holderPhone?: string;
  clientReference?: string;
  remark?: string;
}): Promise<HBXBookingResult | null> {
  if (!HBX_API_KEY || !HBX_API_SECRET) return null;

  // First, check if we need to recheck the rate
  const checkedRate = await checkRate(params.rateKey);
  const finalRateKey = checkedRate?.rateKey || params.rateKey;

  const bookingBody = {
    holder: {
      name: params.holderName,
      surname: params.holderSurname,
    },
    rooms: [
      {
        rateKey: finalRateKey,
        paxes: [
          {
            roomId: 1,
            type: "AD",
            name: params.holderName,
            surname: params.holderSurname,
          },
        ],
      },
    ],
    clientReference: params.clientReference || `RV-${Date.now()}`,
    remark: params.remark || "Royal Voyage booking",
    tolerance: 2, // Accept up to 2% price increase
  };

  const response = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(bookingBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[HBX] Booking error ${response.status}:`, errorText);
    throw new Error(`HBX booking failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const booking = data?.booking;
  if (!booking) return null;

  return {
    reference: booking.reference,
    status: booking.status,
    totalNet: booking.totalNet,
    currency: booking.currency,
    hotel: {
      code: booking.hotel?.code,
      name: booking.hotel?.name,
      checkIn: booking.hotel?.checkIn,
      checkOut: booking.hotel?.checkOut,
    },
  };
}

// ─── Get Booking Details ─────────────────────────────────────────────────────
export async function getHotelBooking(reference: string): Promise<any | null> {
  if (!HBX_API_KEY || !HBX_API_SECRET) return null;

  const response = await fetch(`${BASE_URL}/bookings/${reference}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    console.error(`[HBX] Get booking error ${response.status}`);
    return null;
  }

  return response.json();
}

// ─── Cancel Booking ──────────────────────────────────────────────────────────
export async function cancelHotelBooking(reference: string): Promise<boolean> {
  if (!HBX_API_KEY || !HBX_API_SECRET) return false;

  const response = await fetch(`${BASE_URL}/bookings/${reference}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    console.error(`[HBX] Cancel booking error ${response.status}`);
    return false;
  }

  return true;
}

// ─── HBX Status Check ───────────────────────────────────────────────────────
export function getHBXStatus(): { configured: boolean; mode: string } {
  return {
    configured: !!(HBX_API_KEY && HBX_API_SECRET),
    mode: isProduction ? "production" : "test",
  };
}

// ─── HBX Activities API ──────────────────────────────────────────────────────
// Activities API uses separate credentials
const HBX_ACTIVITIES_API_KEY = process.env.HBX_ACTIVITIES_API_KEY ?? HBX_API_KEY;
const HBX_ACTIVITIES_API_SECRET = process.env.HBX_ACTIVITIES_API_SECRET ?? HBX_API_SECRET;

const ACTIVITIES_BASE_URL = isProduction
  ? "https://api.hotelbeds.com/activity-api/3.0"
  : "https://api.test.hotelbeds.com/activity-api/3.0";

if (HBX_ACTIVITIES_API_KEY) {
  console.log(`[HBX Activities] 🜢 Connected to ${isProduction ? "PRODUCTION" : "TEST"} API`);
} else {
  console.log("[HBX Activities] ⚠️ No HBX_ACTIVITIES_API_KEY configured");
}

function generateActivitiesSignature(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const raw = HBX_ACTIVITIES_API_KEY + HBX_ACTIVITIES_API_SECRET + timestamp;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function getActivitiesHeaders(): Record<string, string> {
  return {
    "Api-key": HBX_ACTIVITIES_API_KEY,
    "X-Signature": generateActivitiesSignature(),
    "Accept": "application/json",
    "Accept-Encoding": "identity",
    "Content-Type": "application/json",
  };
}

export interface HBXActivity {
  code: string;
  name: string;
  description: string;
  city: string;
  country: string;
  category: string;
  minPrice: number;
  currency: string;
  duration: string;
  image: string;
  images?: string[]; // Gallery images (3-5 images)
  latitude?: number;
  longitude?: number;
}

export async function searchActivities(params: {
  destinationCode: string;
  fromDate: string;
  toDate: string;
  language?: string;
  page?: number;
  itemsPerPage?: number;
}): Promise<HBXActivity[]> {
  const { destinationCode, fromDate, toDate, language = "en", page = 1, itemsPerPage = 20 } = params;
  if (!HBX_ACTIVITIES_API_KEY || !HBX_ACTIVITIES_API_SECRET) return [];
  try {
    const url = `${ACTIVITIES_BASE_URL}/activities`;
    const body = JSON.stringify({
      filters: [
        {
          searchFilterItems: [
            { type: "destination", value: destinationCode }
          ]
        }
      ],
      from: fromDate,
      to: toDate,
      language,
      pagination: { itemsPerPage, page },
      order: "DEFAULT"
    });
    const response = await fetch(url, {
      method: "POST",
      headers: getActivitiesHeaders(),
      body
    });
    if (!response.ok) {
      console.error(`[HBX Activities] Search error ${response.status}: ${await response.text()}`);
      return [];
    }
    const data = await response.json();
    const activities = data.activities || [];
    return activities.map((a: any): HBXActivity => ({
      code: a.code || "",
      name: a.name || "",
      description: a.description || "",
      city: a.city?.name || destinationCode,
      country: a.country?.name || "",
      category: a.type?.description || a.categories?.[0]?.description || "",
      minPrice: a.amountsFrom?.[0]?.amount || 0,
      currency: a.amountsFrom?.[0]?.currency || "EUR",
      duration: a.operationDays || "",
      image: a.media?.[0]?.url || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=70",
      images: a.media?.slice(0, 5).map((m: any) => m.url).filter(Boolean) || [],
      latitude: a.geoLocation?.latitude || a.coordinates?.latitude,
      longitude: a.geoLocation?.longitude || a.coordinates?.longitude,
    }));
  } catch (err) {
    console.error("[HBX Activities] Error:", err);
    return [];
  }
}

export async function getActivityDetail(code: string, language = "en"): Promise<HBXActivity | null> {
  if (!HBX_ACTIVITIES_API_KEY || !HBX_ACTIVITIES_API_SECRET) return null;
  try {
    // Use search with service filter to get activity detail
    const url = `${ACTIVITIES_BASE_URL}/activities`;
    const today = new Date();
    const fromDate = today.toISOString().slice(0, 10);
    const toDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const body = JSON.stringify({
      filters: [{ searchFilterItems: [{ type: "service", value: code }] }],
      from: fromDate,
      to: toDate,
      language
    });
    const response = await fetch(url, {
      method: "POST",
      headers: getActivitiesHeaders(),
      body
    });
    if (!response.ok) return null;
    const data = await response.json();
    const a = data.activity;
    if (!a) return null;
    return {
      code: a.code || code,
      name: a.name || "",
      description: a.description || "",
      city: a.city?.name || "",
      country: a.country?.name || "",
      category: a.type?.description || "",
      minPrice: a.amountsFrom?.[0]?.amount || 0,
      currency: a.amountsFrom?.[0]?.currency || "EUR",
      duration: a.operationDays || "",
      image: a.media?.[0]?.url || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
      images: a.media?.slice(0, 5).map((m: any) => m.url).filter(Boolean) || [],
      latitude: a.geoLocation?.latitude || a.coordinates?.latitude,
      longitude: a.geoLocation?.longitude || a.coordinates?.longitude,
    };
  } catch (err) {
    console.error("[HBX Activities] Detail error:", err);
    return null;
  }
}

// ─── HBX Activity Booking ────────────────────────────────────────────────────

export type HBXActivityBookingParams = {
  activityCode: string;
  fromDate: string;
  toDate: string;
  rateKey?: string;
  adults: number;
  children: number;
  language: string;
  holder: {
    name: string;
    surname: string;
    email: string;
    phone?: string;
  };
  paxes?: Array<{
    type: "ADULT" | "CHILD";
    name: string;
    surname: string;
    age?: number;
  }>;
};

export type HBXActivityBookingResult = {
  reference: string;
  status: string;
  totalNet: number;
  currency: string;
  activityName: string;
  fromDate: string;
  toDate: string;
};

export async function bookActivity(params: HBXActivityBookingParams): Promise<HBXActivityBookingResult | null> {
  if (!HBX_ACTIVITIES_API_KEY || !HBX_ACTIVITIES_API_SECRET) {
    console.error("[HBX Activities] Missing API credentials for booking");
    return null;
  }

  try {
    const url = `${ACTIVITIES_BASE_URL}/bookings`;

    const paxes = params.paxes ?? [
      { type: "ADULT" as const, name: params.holder.name, surname: params.holder.surname },
      ...Array.from({ length: params.children }, (_, i) => ({
        type: "CHILD" as const,
        name: `Child${i + 1}`,
        surname: params.holder.surname,
        age: 8,
      })),
    ];

    const body = JSON.stringify({
      holder: {
        name: params.holder.name,
        surname: params.holder.surname,
        email: params.holder.email,
        phone: params.holder.phone ?? "",
      },
      activities: [
        {
          rateKey: params.rateKey ?? `${params.activityCode}|${params.fromDate}|${params.toDate}|${params.language}`,
          paxes,
        },
      ],
      clientReference: `RV-ACT-${Date.now()}`,
      language: params.language,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: getActivitiesHeaders(),
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[HBX Activities] Booking error ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    const booking = data.booking;
    if (!booking) return null;

    return {
      reference: booking.reference ?? "",
      status: booking.status ?? "CONFIRMED",
      totalNet: booking.totalNet ?? 0,
      currency: booking.currency ?? "EUR",
      activityName: booking.activities?.[0]?.name ?? params.activityCode,
      fromDate: params.fromDate,
      toDate: params.toDate,
    };
  } catch (err) {
    console.error("[HBX Activities] Booking error:", err);
    return null;
  }
}
