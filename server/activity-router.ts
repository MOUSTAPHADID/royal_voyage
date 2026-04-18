import { router, publicProcedure } from "./trpc";
import { z } from "zod";

export const activityRouter = router({
  // Get all activities
  getAll: publicProcedure
    .input(z.object({ search: z.string().optional(), city: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const activities = [
        { id: "a1", name: "Architecture Tour", city: "Barcelona", price: 45, rating: 4.8, image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80" },
        { id: "a2", name: "Desert Safari", city: "Dubai", price: 60, rating: 4.9, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80" },
        { id: "a3", name: "Eiffel Tower Tour", city: "Paris", price: 35, rating: 4.7, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80" },
        { id: "a4", name: "Snorkeling & Diving", city: "Palma", price: 55, rating: 4.8, image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80" },
        { id: "a5", name: "Old City Tour", city: "Marrakech", price: 40, rating: 4.6, image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80" },
        { id: "a6", name: "Mountain Hiking", city: "Swiss Alps", price: 50, rating: 4.9, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
      ];

      let filtered = activities;

      if (input?.search) {
        const search = input.search.toLowerCase();
        filtered = filtered.filter(a => a.name.toLowerCase().includes(search) || a.city.toLowerCase().includes(search));
      }

      if (input?.city) {
        filtered = filtered.filter(a => a.city.toLowerCase() === input.city?.toLowerCase());
      }

      return filtered;
    }),

  // Get activity by ID
  getById: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const activities = [
        { 
          id: "a1", 
          name: "Architecture Tour", 
          city: "Barcelona", 
          price: 45, 
          rating: 4.8, 
          reviews: 245,
          duration: "4-5 hours",
          groupSize: "2-10 people",
          language: "English, Arabic, French",
          image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80",
          description: "Enjoy a comprehensive tour of Barcelona's architectural wonders with a specialized guide.",
          highlights: ["Visit historical landmarks", "Tour traditional markets", "Taste local food", "Professional photos"],
          included: ["Professional tour guide", "Drinks and snacks", "Travel insurance", "Digital photos"],
          notIncluded: ["Museum entries", "Main meals", "Alcoholic beverages"],
        },
        // Add more activities as needed
      ];

      return activities.find(a => a.id === input) || null;
    }),

  // Create activity booking
  createBooking: publicProcedure
    .input(z.object({
      activityId: z.string(),
      date: z.string(),
      guests: z.number(),
      email: z.string().email(),
      phone: z.string(),
      totalPrice: z.number(),
    }))
    .mutation(async ({ input }) => {
      // In a real app, this would save to database
      return {
        bookingId: `ACT-${Date.now()}`,
        status: "pending",
        ...input,
        createdAt: new Date().toISOString(),
      };
    }),

  // Get user's activity bookings
  getUserBookings: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      // In a real app, this would query from database
      return [];
    }),

  // Cancel activity booking
  cancelBooking: publicProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      return {
        bookingId: input,
        status: "cancelled",
        refundAmount: 0,
      };
    }),
});
