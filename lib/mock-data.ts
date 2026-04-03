export type Flight = {
  id: string;
  airline: string;
  airlineLogo: string;
  airlineCode?: string;
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
  class: "Economy" | "Business" | "First" | string;
  seatsLeft: number;
};

export type Hotel = {
  id: string;
  name: string;
  city: string;
  country: string;
  image: string;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  currency: string;
  stars: number;
  amenities: string[];
  description: string;
  address: string;
};

export type Destination = {
  id: string;
  city: string;
  country: string;
  image: string;
  flightPrice: number;
  hotelPrice: number;
  currency: string;
  tag?: string;
};

export type Booking = {
  id: string;
  type: "flight" | "hotel" | "activity";
  status: "confirmed" | "pending" | "cancelled" | "processing" | "airline_confirmed";
  reference: string;
  pnr?: string;  // Passenger Name Record - 6 char alphanumeric code (auto-generated)
  realPnr?: string; // Real PNR entered manually by agent from airline system
  realPnrUpdatedAt?: string; // ISO timestamp when realPnr was last updated
  paymentDeadline?: string; // ISO timestamp - 24h deadline for cash payment bookings
  date: string;
  // Flight specific
  flight?: Flight;
  passengers?: number;
  // Hotel specific
  hotel?: Hotel;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  // Activity specific
  activity?: {
    code: string;
    name: string;
    participants: number;
    participantDetails?: any[];
  };
  totalPrice: number;
  currency: string;
  // Passenger/guest name and email for search and notifications
  passengerName?: string;
  guestName?: string;
  passengerEmail?: string;
  paymentMethod?: string; // cash | bank_transfer | bankily | masrvi | sedad
  // Expo Push Token for customer notifications
  customerPushToken?: string;
  // Ticket number entered by admin
  ticketNumber?: string; // Airline ticket number entered by admin
  ticketNumberUpdatedAt?: string; // ISO timestamp when ticketNumber was last updated
  // Ticket delivery tracking
  ticketSent?: boolean; // true when PDF ticket has been sent to customer
  ticketSentAt?: string; // ISO timestamp when ticket was last sent
  // Payment confirmation by admin
  paymentConfirmed?: boolean; // true when admin confirms payment receipt
  paymentConfirmedAt?: string; // ISO timestamp when payment was confirmed
  paymentRejected?: boolean; // true when admin rejects payment
  paymentRejectedReason?: string; // reason for rejection
  paymentRejectedAt?: string; // ISO timestamp when payment was rejected
  transferRef?: string; // Transfer reference / Transaction ID entered by customer
  // Payment receipt image
  receiptImage?: string; // Base64 or URI of payment receipt image uploaded by customer
  receiptImageAt?: string; // ISO timestamp when receipt was uploaded
  // Online Check-in
  checkedIn?: boolean; // true when passenger completed online check-in
  checkedInAt?: string; // ISO timestamp when check-in was completed
  seatNumber?: string; // Selected seat (e.g. "12A")
  seatPreference?: "window" | "middle" | "aisle"; // Seat preference
  boardingGroup?: string; // Boarding group (e.g. "A", "B", "C")
  seatUpgrade?: boolean; // true if extra legroom seat was selected
  seatUpgradeFee?: number; // Fee paid for seat upgrade in MRU
  flightReminderScheduled?: boolean; // true when 2h pre-flight reminder is scheduled
  // Meal selection
  mealChoice?: "regular" | "vegetarian" | "halal" | "none"; // Selected meal option
  // Seat change history
  seatChangeCount?: number; // Number of times seat was changed
  seatChangeFee?: number; // Total fee for seat changes in MRU
  // Travel checklist
  travelChecklist?: Record<string, boolean>; // Checklist items completion status
  // Order Management
  royalOrderId?: string; // Flight order ID for PNR status retrieval and cancellation (stores Duffel ord_xxx)
  // Business Account Commission
  businessAccountId?: string; // ID of the business account this booking belongs to
  businessCommission?: number; // Commission rate percentage applied
  commissionAmount?: number; // Actual commission amount in MRU
  // Stripe payment tracking
  stripePaymentIntentId?: string; // Stripe PaymentIntent ID for card payments
};

export const DESTINATIONS: Destination[] = [
  {
    id: "d1",
    city: "Dubai",
    country: "UAE",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    flightPrice: 145000,
    hotelPrice: 65000,
    currency: "MRU",
    tag: "الأكثر طلباً",
  },
  {
    id: "d2",
    city: "Casablanca",
    country: "Morocco",
    image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=80",
    flightPrice: 58000,
    hotelPrice: 22000,
    currency: "MRU",
    tag: "الأقرب",
  },
  {
    id: "d3",
    city: "Paris",
    country: "France",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    flightPrice: 138000,
    hotelPrice: 80000,
    currency: "MRU",
    tag: "شعبي",
  },
  {
    id: "d4",
    city: "Istanbul",
    country: "Turkey",
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
    flightPrice: 95000,
    hotelPrice: 35000,
    currency: "MRU",
    tag: "عرض مميز",
  },
  {
    id: "d5",
    city: "Dakar",
    country: "Senegal",
    image: "https://images.unsplash.com/photo-1580746738099-b2d4b45d8b7a?w=800&q=80",
    flightPrice: 42000,
    hotelPrice: 18000,
    currency: "MRU",
    tag: "أفريقيا",
  },
  {
    id: "d6",
    city: "Riyadh",
    country: "Saudi Arabia",
    image: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&q=80",
    flightPrice: 112000,
    hotelPrice: 45000,
    currency: "MRU",
  },
  {
    id: "d7",
    city: "Cairo",
    country: "Egypt",
    image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800&q=80",
    flightPrice: 88000,
    hotelPrice: 28000,
    currency: "MRU",
    tag: "تاريخ وحضارة",
  },
  {
    id: "d8",
    city: "Abidjan",
    country: "Ivory Coast",
    image: "https://images.unsplash.com/photo-1612204103590-b963c5d2a7c5?w=800&q=80",
    flightPrice: 55000,
    hotelPrice: 20000,
    currency: "MRU",
    tag: "أفريقيا",
  },
  {
    id: "d9",
    city: "London",
    country: "UK",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
    flightPrice: 155000,
    hotelPrice: 90000,
    currency: "MRU",
  },
  {
    id: "d10",
    city: "Tunis",
    country: "Tunisia",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    flightPrice: 68000,
    hotelPrice: 25000,
    currency: "MRU",
    tag: "قريب ومميز",
  },
  {
    id: "d11",
    city: "Bamako",
    country: "Mali",
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80",
    flightPrice: 38000,
    hotelPrice: 15000,
    currency: "MRU",
    tag: "أفريقيا",
  },
  {
    id: "d12",
    city: "Madrid",
    country: "Spain",
    image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80",
    flightPrice: 125000,
    hotelPrice: 55000,
    currency: "MRU",
    tag: "أوروبا",
  },
];

export const FLIGHTS: Flight[] = [
  {
    id: "f1",
    airline: "Emirates",
    airlineLogo: "✈",
    airlineCode: "EK",
    flightNumber: "EK 201",
    origin: "Casablanca",
    originCode: "CMN",
    destination: "Dubai",
    destinationCode: "DXB",
    departureTime: "08:30",
    arrivalTime: "18:45",
    duration: "7h 15m",
    stops: 0,
    price: 450,
    currency: "USD",
    class: "Economy",
    seatsLeft: 12,
  },
  {
    id: "f2",
    airline: "Air France",
    airlineLogo: "✈",
    airlineCode: "AF",
    flightNumber: "AF 550",
    origin: "Casablanca",
    originCode: "CMN",
    destination: "Paris",
    destinationCode: "CDG",
    departureTime: "11:00",
    arrivalTime: "15:30",
    duration: "3h 30m",
    stops: 0,
    price: 380,
    currency: "USD",
    class: "Economy",
    seatsLeft: 5,
  },
  {
    id: "f3",
    airline: "Qatar Airways",
    airlineLogo: "✈",
    airlineCode: "QR",
    flightNumber: "QR 1350",
    origin: "Casablanca",
    originCode: "CMN",
    destination: "Tokyo",
    destinationCode: "NRT",
    departureTime: "22:15",
    arrivalTime: "18:30",
    duration: "16h 15m",
    stops: 1,
    price: 620,
    currency: "USD",
    class: "Economy",
    seatsLeft: 8,
  },
  {
    id: "f4",
    airline: "British Airways",
    airlineLogo: "✈",
    airlineCode: "BA",
    flightNumber: "BA 493",
    origin: "Casablanca",
    originCode: "CMN",
    destination: "London",
    destinationCode: "LHR",
    departureTime: "14:20",
    arrivalTime: "18:05",
    duration: "3h 45m",
    stops: 0,
    price: 340,
    currency: "USD",
    class: "Economy",
    seatsLeft: 15,
  },
  {
    id: "f5",
    airline: "Emirates",
    airlineLogo: "✈",
    airlineCode: "EK",
    flightNumber: "EK 201",
    origin: "Casablanca",
    originCode: "CMN",
    destination: "Dubai",
    destinationCode: "DXB",
    departureTime: "23:00",
    arrivalTime: "09:15",
    duration: "7h 15m",
    stops: 0,
    price: 520,
    currency: "USD",
    class: "Business",
    seatsLeft: 3,
  },
  {
    id: "f6",
    airline: "Turkish Airlines",
    airlineLogo: "✈",
    airlineCode: "TK",
    flightNumber: "TK 702",
    origin: "Casablanca",
    originCode: "CMN",
    destination: "New York",
    destinationCode: "JFK",
    departureTime: "06:45",
    arrivalTime: "14:30",
    duration: "13h 45m",
    stops: 1,
    price: 520,
    currency: "USD",
    class: "Economy",
    seatsLeft: 20,
  },
];

export const HOTELS: Hotel[] = [
  {
    id: "h1",
    name: "Burj Al Arab",
    city: "Dubai",
    country: "UAE",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    rating: 4.9,
    reviewCount: 2840,
    pricePerNight: 850,
    currency: "USD",
    stars: 5,
    amenities: ["Pool", "Spa", "Restaurant", "WiFi", "Gym", "Beach"],
    description: "The iconic sail-shaped luxury hotel standing on its own island, offering unparalleled luxury and breathtaking views of the Arabian Gulf.",
    address: "Jumeirah Beach Road, Dubai",
  },
  {
    id: "h2",
    name: "Hotel Le Meurice",
    city: "Paris",
    country: "France",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    rating: 4.8,
    reviewCount: 1560,
    pricePerNight: 650,
    currency: "USD",
    stars: 5,
    amenities: ["Restaurant", "Spa", "Bar", "WiFi", "Concierge", "Room Service"],
    description: "A palace hotel on Rue de Rivoli facing the Tuileries Garden, offering timeless elegance in the heart of Paris.",
    address: "228 Rue de Rivoli, Paris",
  },
  {
    id: "h3",
    name: "Park Hyatt Tokyo",
    city: "Tokyo",
    country: "Japan",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    rating: 4.7,
    reviewCount: 3200,
    pricePerNight: 420,
    currency: "USD",
    stars: 5,
    amenities: ["Pool", "Spa", "Restaurant", "WiFi", "Gym", "Bar"],
    description: "Perched on the 39th to 52nd floors of the Shinjuku Park Tower, offering stunning views of Mount Fuji and the Tokyo skyline.",
    address: "3-7-1-2 Nishi Shinjuku, Tokyo",
  },
  {
    id: "h4",
    name: "The Ritz London",
    city: "London",
    country: "UK",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    rating: 4.8,
    reviewCount: 2100,
    pricePerNight: 780,
    currency: "USD",
    stars: 5,
    amenities: ["Restaurant", "Bar", "Spa", "WiFi", "Concierge", "Afternoon Tea"],
    description: "London's most iconic luxury hotel, synonymous with elegance and refinement since 1906.",
    address: "150 Piccadilly, London",
  },
  {
    id: "h5",
    name: "Four Seasons Bali",
    city: "Bali",
    country: "Indonesia",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    rating: 4.9,
    reviewCount: 4500,
    pricePerNight: 380,
    currency: "USD",
    stars: 5,
    amenities: ["Pool", "Spa", "Restaurant", "WiFi", "Beach", "Yoga"],
    description: "A stunning resort nestled in the lush Sayan Valley, offering private villas with plunge pools and panoramic rice terrace views.",
    address: "Sayan, Ubud, Bali",
  },
  {
    id: "h6",
    name: "The Plaza New York",
    city: "New York",
    country: "USA",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    rating: 4.6,
    reviewCount: 3800,
    pricePerNight: 720,
    currency: "USD",
    stars: 5,
    amenities: ["Restaurant", "Spa", "Bar", "WiFi", "Gym", "Concierge"],
    description: "A National Historic Landmark on Fifth Avenue, offering legendary service and luxurious accommodations in the heart of Manhattan.",
    address: "768 5th Ave, New York",
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "b1",
    type: "flight",
    status: "confirmed",
    reference: "RV-FL-2024-001",
    date: "2024-03-15",
    flight: FLIGHTS[0],
    passengers: 2,
    totalPrice: 900,
    currency: "USD",
  },
  {
    id: "b2",
    type: "hotel",
    status: "confirmed",
    reference: "RV-HT-2024-002",
    date: "2024-03-10",
    hotel: HOTELS[1],
    checkIn: "2024-04-20",
    checkOut: "2024-04-25",
    guests: 2,
    rooms: 1,
    totalPrice: 3250,
    currency: "USD",
  },
  {
    id: "b3",
    type: "flight",
    status: "pending",
    reference: "RV-FL-2024-003",
    date: "2024-03-20",
    flight: FLIGHTS[2],
    passengers: 1,
    totalPrice: 620,
    currency: "USD",
  },
];
