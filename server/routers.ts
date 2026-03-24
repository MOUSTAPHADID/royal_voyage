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
import { sendFlightTicket, sendHotelConfirmation, sendPnrUpdateEmail } from "./email";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";

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

  // ─── Voice: Speech-to-Text ──────────────────────────────────────────────────
  voice: router({
    transcribe: publicProcedure
      .input(
        z.object({
          audioBase64: z.string(),
          mimeType: z.string().default("audio/m4a"),
          language: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Upload audio buffer to storage to get a URL
          const audioBuffer = Buffer.from(input.audioBase64, "base64");
          const ext = input.mimeType.includes("webm") ? "webm"
            : input.mimeType.includes("wav") ? "wav"
            : input.mimeType.includes("ogg") ? "ogg"
            : "m4a";
          const key = `voice/${Date.now()}.${ext}`;
          const { url } = await storagePut(key, audioBuffer, input.mimeType);

          // Transcribe using built-in Whisper service
          const result = await transcribeAudio({
            audioUrl: url,
            language: input.language,
            prompt: "Airport name, city name, or flight destination",
          });

          if ("error" in result) {
            return { success: false, text: "", error: result.error };
          }
          return { success: true, text: result.text.trim(), language: result.language };
        } catch (err: any) {
          console.error("[Voice] transcription error:", err?.message);
          return { success: false, text: "", error: err?.message ?? "Transcription failed" };
        }
      }),
  }),

  // ─── Email: Send Tickets & Confirmations ─────────────────────────────────────
  email: router({
    sendFlightTicket: publicProcedure
      .input(
        z.object({
          passengerName: z.string(),
          passengerEmail: z.string().email(),
          bookingRef: z.string(),
          pnr: z.string().optional(),
          origin: z.string(),
          originCity: z.string(),
          destination: z.string(),
          destinationCity: z.string(),
          departureDate: z.string(),
          departureTime: z.string(),
          arrivalTime: z.string(),
          airline: z.string(),
          flightNumber: z.string(),
          cabinClass: z.string(),
          passengers: z.number(),
          children: z.number().default(0),
          totalPrice: z.string(),
          currency: z.string().default("MRU"),
          tripType: z.enum(["one-way", "round-trip"]).default("one-way"),
          returnDate: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const success = await sendFlightTicket(input);
        return { success };
      }),

    sendHotelConfirmation: publicProcedure
      .input(
        z.object({
          guestName: z.string(),
          guestEmail: z.string().email(),
          bookingRef: z.string(),
          pnr: z.string().optional(),
          hotelName: z.string(),
          hotelCity: z.string(),
          hotelCountry: z.string().default("Mauritania"),
          stars: z.number().min(1).max(5).default(3),
          checkIn: z.string(),
          checkOut: z.string(),
          nights: z.number().min(1),
          roomType: z.string().default("Standard Room"),
          guests: z.number().min(1),
          children: z.number().default(0),
          totalPrice: z.string(),
          currency: z.string().default("MRU"),
        })
      )
      .mutation(async ({ input }) => {
        const success = await sendHotelConfirmation(input);
        return { success };
      }),

    sendPnrUpdate: publicProcedure
      .input(
        z.object({
          passengerName: z.string(),
          passengerEmail: z.string().email(),
          bookingRef: z.string(),
          pnr: z.string(),
          origin: z.string().optional(),
          destination: z.string().optional(),
          departureDate: z.string().optional(),
          airline: z.string().optional(),
          flightNumber: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const success = await sendPnrUpdateEmail(input);
        return { success };
      }),

    // Push notification via Expo Push API
    sendPushNotification: publicProcedure
      .input(
        z.object({
          expoPushToken: z.string(),
          title: z.string(),
          body: z.string(),
          data: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Accept-Encoding": "gzip, deflate",
            },
            body: JSON.stringify({
              to: input.expoPushToken,
              sound: "default",
              title: input.title,
              body: input.body,
              data: input.data ?? {},
            }),
          });
          const result = await response.json();
          console.log("[Push] Expo push result:", JSON.stringify(result));
          return { success: true, result };
        } catch (err: any) {
          console.error("[Push] Failed to send push notification:", err?.message);
          return { success: false, error: err?.message };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

