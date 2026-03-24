export type Flight = {
  id: string;
  airline: string;
  airlineLogo: string;
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
  class: "Economy" | "Business" | "First";
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
  type: "flight" | "hotel";
  status: "confirmed" | "pending" | "cancelled";
  reference: string;
  pnr?: string;  // Passenger Name Record - 6 char alphanumeric code (auto-generated)
  realPnr?: string; // Real PNR entered manually by agent from airline system
  realPnrUpdatedAt?: string; // ISO timestamp when realPnr was last updated
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
  totalPrice: number;
  currency: string;
  // Passenger/guest name for search
  passengerName?: string;
  guestName?: string;
};

export const DESTINATIONS: Destination[] = [
  {
    id: "d1",
    city: "Dubai",
    country: "UAE",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    flightPrice: 450,
    hotelPrice: 180,
    currency: "USD",
    tag: "Trending",
  },
  {
    id: "d2",
    city: "Paris",
    country: "France",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    flightPrice: 380,
    hotelPrice: 220,
    currency: "USD",
    tag: "Popular",
  },
  {
    id: "d3",
    city: "Tokyo",
    country: "Japan",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    flightPrice: 620,
    hotelPrice: 150,
    currency: "USD",
    tag: "Hot Deal",
  },
  {
    id: "d4",
    city: "New York",
    country: "USA",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
    flightPrice: 520,
    hotelPrice: 280,
    currency: "USD",
  },
  {
    id: "d5",
    city: "Bali",
    country: "Indonesia",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    flightPrice: 390,
    hotelPrice: 90,
    currency: "USD",
    tag: "Best Value",
  },
  {
    id: "d6",
    city: "London",
    country: "UK",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
    flightPrice: 340,
    hotelPrice: 240,
    currency: "USD",
  },
];

export const FLIGHTS: Flight[] = [
  {
    id: "f1",
    airline: "Emirates",
    airlineLogo: "✈",
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
