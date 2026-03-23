import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  searchFlights,
  searchLocations,
  searchHotelsByCity,
} from "./amadeus";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Amadeus: Location Autocomplete ─────────────────────────────────────────
  amadeus: router({
    searchLocations: publicProcedure
      .input(z.object({ keyword: z.string().min(1) }))
      .query(async ({ input }) => {
        try {
          return await searchLocations(input.keyword);
        } catch (err: any) {
          console.error("[Amadeus] searchLocations error:", err?.code || err?.message);
          return [];
        }
      }),

    // ─── Amadeus: Flight Search ────────────────────────────────────────────────
    searchFlights: publicProcedure
      .input(
        z.object({
          originCode: z.string().length(3),
          destinationCode: z.string().length(3),
          departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          adults: z.number().min(1).max(9).default(1),
          travelClass: z
            .enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"])
            .optional(),
          max: z.number().min(1).max(20).default(15),
        })
      )
      .query(async ({ input }) => {
        try {
          const flights = await searchFlights({
            originCode: input.originCode,
            destinationCode: input.destinationCode,
            departureDate: input.departureDate,
            returnDate: input.returnDate,
            adults: input.adults,
            travelClass: input.travelClass,
            max: input.max,
          });
          return { success: true, data: flights };
        } catch (err: any) {
          console.error("[Amadeus] searchFlights error:", err?.code || err?.message);
          return { success: false, data: [], error: err?.code || "SEARCH_ERROR" };
        }
      }),

    // ─── Amadeus: Hotel Search ─────────────────────────────────────────────────
    searchHotels: publicProcedure
      .input(
        z.object({
          cityCode: z.string().length(3),
          checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          adults: z.number().min(1).max(9).default(2),
          rooms: z.number().min(1).max(5).default(1),
          ratings: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        try {
          const hotels = await searchHotelsByCity({
            cityCode: input.cityCode,
            checkInDate: input.checkInDate,
            checkOutDate: input.checkOutDate,
            adults: input.adults,
            rooms: input.rooms,
            ratings: input.ratings,
          });
          return { success: true, data: hotels };
        } catch (err: any) {
          console.error("[Amadeus] searchHotels error:", err?.code || err?.message);
          return { success: false, data: [], error: err?.code || "SEARCH_ERROR" };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
