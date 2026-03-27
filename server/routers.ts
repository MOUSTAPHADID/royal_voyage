import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  searchFlights,
  searchLocations,
  searchHotelsByCity,
  priceFlightOffer,
  createFlightOrder,
  getCachedRawOffer,
  getFlightOrder,
  cancelFlightOrder,
  getAmadeusStatus,
  checkTicketIssuance,
  queueToConsolidator,
  getConsolidatorConfig,
  setConsolidatorOfficeId,
} from "./amadeus";
import { sendFlightTicket, sendHotelConfirmation, sendPnrUpdateEmail, sendPaymentConfirmationEmail } from "./email";
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
    // ─── Amadeus: Price Flight Offer ─────────────────────────────────────────
    priceFlightOffer: publicProcedure
      .input(z.object({ rawOffer: z.any() }))
      .mutation(async ({ input }) => {
        try {
          const result = await priceFlightOffer(input.rawOffer);
          return { success: true, data: result };
        } catch (err: any) {
          console.error("[Amadeus] priceFlightOffer error:", err?.message || err);
          return { success: false, data: null, error: err?.message || "PRICING_ERROR" };
        }
      }),

    // ─── Amadeus: Book Flight with Real PNR (uses cached offer) ───────────
    bookFlightWithPNR: publicProcedure
      .input(
        z.object({
          offerId: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          dateOfBirth: z.string(),
          gender: z.enum(["MALE", "FEMALE"]),
          email: z.string(),
          phone: z.string(),
          countryCallingCode: z.string().default("222"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Step 1: Get cached raw offer
          const rawOffer = getCachedRawOffer(input.offerId);
          if (!rawOffer) {
            console.warn(`[Amadeus] No cached offer for ID: ${input.offerId}`);
            return { success: false, pnr: null, error: "OFFER_EXPIRED" };
          }

          // Step 2: Price the offer
          console.log(`[Amadeus] Pricing offer ${input.offerId}...`);
          const priced = await priceFlightOffer(rawOffer);

          // Step 3: Create the order with real PNR
          console.log(`[Amadeus] Creating flight order for ${input.firstName} ${input.lastName}...`);
          const order = await createFlightOrder(priced.pricedOffer, [
            {
              id: "1",
              dateOfBirth: input.dateOfBirth,
              firstName: input.firstName,
              lastName: input.lastName,
              gender: input.gender,
              email: input.email,
              phone: input.phone,
              countryCallingCode: input.countryCallingCode,
            },
          ]);

          console.log(`[Amadeus] \u2705 Real PNR: ${order.pnr}, OrderID: ${order.orderId}`);
          return {
            success: true,
            pnr: order.pnr,
            orderId: order.orderId,
            associatedRecords: order.associatedRecords,
            ticketingDeadline: order.ticketingDeadline,
          };
        } catch (err: any) {
          console.error("[Amadeus] bookFlightWithPNR error:", err?.message || err);
          const detail = err?.response?.result?.errors?.[0]?.detail || err?.message || "BOOKING_ERROR";
          return { success: false, pnr: null, error: detail };
        }
      }),

    // ─── Amadeus: Create Flight Order (Real PNR) ─────────────────────────
    createFlightOrder: publicProcedure
      .input(
        z.object({
          pricedOffer: z.any(),
          travelers: z.array(
            z.object({
              id: z.string(),
              dateOfBirth: z.string(),
              firstName: z.string(),
              lastName: z.string(),
              gender: z.enum(["MALE", "FEMALE"]),
              email: z.string(),
              phone: z.string(),
              countryCallingCode: z.string().default("222"),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await createFlightOrder(input.pricedOffer, input.travelers);
          console.log(`[Amadeus] ✅ Flight order created! PNR: ${result.pnr}, OrderID: ${result.orderId}`);
          return { success: true, data: result };
        } catch (err: any) {
          console.error("[Amadeus] createFlightOrder error:", err?.message || err);
          // Try to extract more useful error info
          const detail = err?.response?.result?.errors?.[0]?.detail || err?.message || "ORDER_ERROR";
          return { success: false, data: null, error: detail };
        }
      }),

    // ─── Amadeus: Get Flight Order Status (PNR Lookup) ─────────────────────
    getFlightOrder: publicProcedure
      .input(z.object({ orderId: z.string() }))
      .query(async ({ input }) => {
        try {
          const result = await getFlightOrder(input.orderId);
          return { success: true, data: result };
        } catch (err: any) {
          console.error("[Amadeus] getFlightOrder error:", err?.message || err);
          const detail = err?.response?.result?.errors?.[0]?.detail || err?.message || "RETRIEVE_ERROR";
          return { success: false, data: null, error: detail };
        }
      }),

    // ─── Amadeus: Cancel Flight Order ─────────────────────────────────────────
    cancelFlightOrder: publicProcedure
      .input(z.object({ orderId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const result = await cancelFlightOrder(input.orderId);
          console.log(`[Amadeus] ✅ Order ${input.orderId} cancelled`);
          return { success: true, data: result };
        } catch (err: any) {
          console.error("[Amadeus] cancelFlightOrder error:", err?.message || err);
          const detail = err?.message || "CANCEL_ERROR";
          return { success: false, data: null, error: detail };
        }
      }),

    // ─── Amadeus: Get Status Info ──────────────────────────────────────────
    getStatus: publicProcedure.query(() => {
      return getAmadeusStatus();
    }),

    // ─── Amadeus: Check Ticket Issuance ──────────────────────────────────────
    checkTicketIssuance: publicProcedure
      .input(z.object({ orderId: z.string() }))
      .query(async ({ input }) => {
        try {
          const result = await checkTicketIssuance(input.orderId);
          return { success: true, data: result };
        } catch (err: any) {
          console.error("[Amadeus] checkTicketIssuance error:", err?.message || err);
          const detail = err?.message || "TICKET_CHECK_ERROR";
          return { success: false, data: null, error: detail };
        }
      }),

    // ─── Amadeus: Queue to Consolidator ──────────────────────────────────────
    queueToConsolidator: publicProcedure
      .input(z.object({ orderId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const result = await queueToConsolidator(input.orderId);
          return { success: true, data: result };
        } catch (err: any) {
          console.error("[Amadeus] queueToConsolidator error:", err?.message || err);
          const detail = err?.message || "QUEUE_ERROR";
          return { success: false, data: null, error: detail };
        }
      }),

    // ─── Amadeus: Get Consolidator Config ────────────────────────────────────
    getConsolidatorConfig: publicProcedure.query(() => {
      return getConsolidatorConfig();
    }),

    // ─── Amadeus: Update Consolidator Office ID ─────────────────────────────
    setConsolidatorOfficeId: publicProcedure
      .input(z.object({ officeId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const config = setConsolidatorOfficeId(input.officeId);
          return { success: true, data: config };
        } catch (err: any) {
          return { success: false, data: null, error: err?.message || "INVALID_OFFICE_ID" };
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
          ticketNumber: z.string().optional(),
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

    // Payment confirmation email
    confirmPayment: publicProcedure
      .input(
        z.object({
          passengerName: z.string(),
          passengerEmail: z.string().email(),
          bookingRef: z.string(),
          pnr: z.string().optional(),
          bookingType: z.enum(["flight", "hotel"]),
          origin: z.string().optional(),
          destination: z.string().optional(),
          airline: z.string().optional(),
          flightNumber: z.string().optional(),
          departureDate: z.string().optional(),
          departureTime: z.string().optional(),
          hotelName: z.string().optional(),
          checkIn: z.string().optional(),
          checkOut: z.string().optional(),
          totalAmount: z.string().optional(),
          paymentMethod: z.string().optional(),
          confirmedAt: z.string().optional(),
          // Push notification
          expoPushToken: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { expoPushToken, ...emailData } = input;
        // Send email
        const emailSent = await sendPaymentConfirmationEmail(emailData);
        // Send push notification if token available
        let pushSent = false;
        if (expoPushToken) {
          try {
            const response = await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({
                to: expoPushToken,
                sound: "default",
                title: "\u2705 \u062a\u0645 \u062a\u0623\u0643\u064a\u062f \u062f\u0641\u0639\u0643",
                body: `\u062d\u062c\u0632\u0643 ${input.bookingRef} \u062a\u0645 \u062a\u0623\u0643\u064a\u062f\u0647 \u0628\u0646\u062c\u0627\u062d. \u0634\u0643\u0631\u0627\u064b \u0644\u0627\u062e\u062a\u064a\u0627\u0631\u0643 Royal Voyage!`,
                data: { bookingRef: input.bookingRef, type: "payment_confirmed" },
              }),
            });
            const result = await response.json();
            pushSent = result?.data?.[0]?.status === "ok";
            console.log("[Push] Payment confirmation push result:", JSON.stringify(result));
          } catch (err: any) {
            console.warn("[Push] Failed to send payment confirmation push:", err?.message);
          }
        }
        return { emailSent, pushSent };
      }),

    // Airline Confirmed: send PDF ticket + push notification
    sendAirlineConfirmedTicket: publicProcedure
      .input(
        z.object({
          passengerName: z.string(),
          passengerEmail: z.string().email(),
          bookingRef: z.string(),
          pnr: z.string().optional(),
          ticketNumber: z.string().optional(),
          origin: z.string().default("NKC"),
          originCity: z.string().default("Nouakchott"),
          destination: z.string().default(""),
          destinationCity: z.string().default(""),
          departureDate: z.string().default(""),
          departureTime: z.string().default(""),
          arrivalTime: z.string().default(""),
          airline: z.string().default(""),
          flightNumber: z.string().default(""),
          cabinClass: z.string().default("ECONOMY"),
          passengers: z.number().default(1),
          children: z.number().default(0),
          totalPrice: z.string().default(""),
          currency: z.string().default("MRU"),
          tripType: z.enum(["one-way", "round-trip"]).default("one-way"),
          returnDate: z.string().optional(),
          // Push notification
          expoPushToken: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { expoPushToken, ...ticketData } = input;
        // Send PDF ticket via email
        const emailSent = await sendFlightTicket(ticketData);
        // Send push notification
        let pushSent = false;
        if (expoPushToken) {
          try {
            const response = await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({
                to: expoPushToken,
                sound: "default",
                title: "\u2708\uFE0F \u062a\u0630\u0643\u0631\u062a\u0643 \u062c\u0627\u0647\u0632\u0629!",
                body: `\u062a\u0645 \u0625\u0635\u062f\u0627\u0631 \u062a\u0630\u0643\u0631\u0629 \u0631\u062d\u0644\u062a\u0643 ${input.bookingRef} \u0628\u0646\u062c\u0627\u062d. \u062a\u062d\u0642\u0642 \u0645\u0646 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0644\u0644\u062a\u0646\u0632\u064a\u0644.`,
                data: { bookingRef: input.bookingRef, type: "airline_confirmed_ticket" },
              }),
            });
            const result = await response.json();
            pushSent = result?.data?.[0]?.status === "ok";
            console.log("[Push] Airline confirmed ticket push result:", JSON.stringify(result));
          } catch (err: any) {
            console.warn("[Push] Failed to send airline confirmed push:", err?.message);
          }
        }
        return { emailSent, pushSent };
      }),

    // Airline Confirmed Hotel: send PDF hotel voucher + push notification
    sendAirlineConfirmedHotelTicket: publicProcedure
      .input(
        z.object({
          guestName: z.string(),
          guestEmail: z.string().email(),
          bookingRef: z.string(),
          pnr: z.string().optional(),
          ticketNumber: z.string().optional(),
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
          // Push notification
          expoPushToken: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { expoPushToken, ...hotelData } = input;
        // Send PDF hotel voucher via email
        const emailSent = await sendHotelConfirmation(hotelData);
        // Send push notification
        let pushSent = false;
        if (expoPushToken) {
          try {
            const response = await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({
                to: expoPushToken,
                sound: "default",
                title: "\u{1F3E8} \u062a\u0623\u0643\u064a\u062f \u062d\u062c\u0632 \u0627\u0644\u0641\u0646\u062f\u0642!",
                body: `\u062a\u0645 \u062a\u0623\u0643\u064a\u062f \u062d\u062c\u0632 \u0641\u0646\u062f\u0642\u0643 ${input.bookingRef} \u0631\u0633\u0645\u064a\u0627\u064b. \u062a\u062d\u0642\u0642 \u0645\u0646 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0644\u062a\u0646\u0632\u064a\u0644 \u0627\u0644\u0642\u0633\u064a\u0645\u0629.`,
                data: { bookingRef: input.bookingRef, type: "airline_confirmed_hotel" },
              }),
            });
            const result = await response.json();
            pushSent = result?.data?.[0]?.status === "ok";
            console.log("[Push] Airline confirmed hotel push result:", JSON.stringify(result));
          } catch (err: any) {
            console.warn("[Push] Failed to send hotel confirmed push:", err?.message);
          }
        }
        return { emailSent, pushSent };
      }),

    // Push notification via Expo Push API
    sendPushNotification: publicProcedure
      .input(
        z.object({
          expoPushToken: z.string(),
          title: z.string(),
          body: z.string(),
          data: z.record(z.string(), z.unknown()).optional(),
          sound: z.string().optional(),
          channelId: z.string().optional(),
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
              sound: input.sound ?? "default",
              title: input.title,
              body: input.body,
              data: input.data ?? {},
              channelId: input.channelId,
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

