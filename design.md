# Royal Service — Mobile App Design Plan

## App Concept
A premium flight and hotel booking application with an elegant, luxury travel aesthetic. The name "Royal Service" evokes sophistication, comfort, and world-class travel experiences.

---

## Brand Identity

### Color Palette
| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `primary` | `#1A3C5E` | `#4A90D9` | Deep navy blue — trust, luxury, sky |
| `secondary` | `#C9A84C` | `#F0C96B` | Gold accent — premium, royalty |
| `background` | `#F8F9FB` | `#0D1117` | App background |
| `surface` | `#FFFFFF` | `#161B22` | Cards and elevated surfaces |
| `foreground` | `#0D1117` | `#F0F6FC` | Primary text |
| `muted` | `#6E7681` | `#8B949E` | Secondary text |
| `border` | `#E1E4E8` | `#21262D` | Dividers and borders |
| `success` | `#2DA44E` | `#3FB950` | Confirmed bookings |
| `warning` | `#D29922` | `#E3B341` | Pending status |
| `error` | `#CF222E` | `#F85149` | Errors and cancellations |

### Typography
- **Headlines**: Bold, large (28-32px)
- **Section titles**: Semibold (18-20px)
- **Body**: Regular (14-16px)
- **Captions**: Regular (12px), muted color

---

## Screen List

### Auth Flow
1. **Splash Screen** — Animated logo with tagline "Your Royal Journey Begins"
2. **Onboarding** — 3-slide carousel showcasing flights, hotels, and deals
3. **Login Screen** — Email/password with social login options
4. **Register Screen** — Full registration form
5. **Forgot Password** — Email recovery

### Main App (Tab Navigation)
6. **Home Screen** — Search widget, featured destinations, deals
7. **Search Flights** — Origin/destination, dates, passengers
8. **Search Hotels** — Destination, check-in/out, guests
9. **Explore** — Trending destinations, curated collections
10. **My Bookings** — Active, upcoming, and past reservations
11. **Profile** — User info, preferences, settings

### Detail & Booking Flow
12. **Flight Results** — Filterable list of available flights
13. **Flight Detail** — Full flight info, seat selection
14. **Hotel Results** — Filterable list of hotels with map toggle
15. **Hotel Detail** — Gallery, amenities, room types
16. **Booking Form** — Passenger/guest details
17. **Payment Screen** — Card input, summary, confirm
18. **Booking Confirmation** — Success animation, booking reference
19. **Booking Detail** — Full reservation details, QR code

---

## Key User Flows

### Flight Booking Flow
Home → Tap "Flights" → Fill origin/destination/dates → View Results → Select Flight → Choose Seat → Fill Passenger Details → Payment → Confirmation

### Hotel Booking Flow
Home → Tap "Hotels" → Fill destination/dates/guests → View Results → Select Hotel → View Rooms → Select Room → Fill Guest Details → Payment → Confirmation

### View Bookings Flow
Tab: My Bookings → Select booking → View Details → Download/Share

---

## Layout Principles

- **One-handed usage**: Primary actions in bottom 60% of screen
- **Card-based UI**: Content in elevated white cards with subtle shadows
- **Hero imagery**: Full-width destination photos with gradient overlays
- **Bottom sheet modals**: Filters, date pickers, passenger selectors
- **Sticky search bar**: Always accessible on results screens
- **Tab bar**: 5 tabs — Home, Explore, Bookings, Profile (+ floating search)

---

## Component Library

- `SearchWidget` — Tabbed flight/hotel search on home
- `DestinationCard` — Image card with city name and price
- `FlightCard` — Airline, route, time, price, duration
- `HotelCard` — Photo, name, rating, price per night
- `BookingCard` — Status badge, route/destination, dates
- `PriceTag` — Formatted price with currency
- `RatingBadge` — Star rating display
- `StatusBadge` — Confirmed/Pending/Cancelled pill
- `DateRangePicker` — Calendar bottom sheet
- `PassengerSelector` — Increment/decrement counter
