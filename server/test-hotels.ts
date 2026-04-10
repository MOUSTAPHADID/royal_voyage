import { searchHotelsByCity } from "./amadeus";

async function test() {
  try {
    const hotels = await searchHotelsByCity({
      cityCode: "PAR",
      checkInDate: "2026-05-15",
      checkOutDate: "2026-05-17",
      adults: 2,
      rooms: 1,
    });
    console.log("Hotels found:", hotels.length);
    hotels.slice(0, 3).forEach((h) =>
      console.log(` - ${h.name} | ${h.stars}★ | $${h.pricePerNight} ${h.currency}`)
    );
  } catch (e: any) {
    console.error("Error:", e?.message || e);
  }
}

test();
