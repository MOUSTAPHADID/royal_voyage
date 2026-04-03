import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { generateEmploymentContractPDF, generateInvoicePDF, generatePartnershipPDF, generateTicketInvoicePDF } from "./contracts-pdf";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import {
  searchFlights,
  searchLocations,
  searchHotelsByCity,
  priceFlightOffer,
  createFlightOrder,
  getCachedRawOffer,
  getFlightOrder,
  cancelFlightOrder,
  createHoldOrder,
  payForHoldOrder,
  getDuffelStatus,
  checkTicketIssuance,
  queueToConsolidator,
  getConsolidatorConfig,
  setConsolidatorOfficeId,
  setActiveConsolidator,
  addConsolidator,
  removeConsolidator,
  getConsolidatorForBooking,
} from "./duffel";
import { sendFlightTicket, sendHotelConfirmation, sendPnrUpdateEmail, sendPaymentConfirmationEmail, sendCancellationEmail, sendHoldConfirmationEmail, sendEmployeeWelcomeEmail, sendDocumentEmail } from "./email";
import {
  getWebhookLog,
  getWebhookNotifications,
  clearWebhookNotifications,
  createDuffelWebhook,
  listDuffelWebhooks,
  deleteDuffelWebhook,
  pingDuffelWebhook,
} from "./duffel-webhooks";
import { transcribeAudio } from "./_core/voiceTranscription";
import { createPaymentIntent, getPaymentIntent, isStripeConfigured, getPublishableKey } from "./stripe";
import { storagePut } from "./storage";
import {
  searchHotelsByCityCode,
  checkRate as hbxCheckRate,
  createHotelBooking as hbxCreateBooking,
  getHotelBooking as hbxGetBooking,
  cancelHotelBooking as hbxCancelBooking,
  getHBXStatus,
  searchActivities,
  getActivityDetail,
  bookActivity,
} from "./hbx";
import {
  getBusinessAccounts,
  getBusinessAccountById,
  createBusinessAccount,
  updateBusinessAccount,
  deleteBusinessAccount,
  getEmployees,
  getEmployeeById,
  getEmployeeByEmail,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  verifyPassword,
  upsertBookingContact,
  getTopUpRequests,
  getTopUpRequestsByAccount,
  getTopUpRequestById,
  createTopUpRequest,
  approveTopUpRequest,
  rejectTopUpRequest,
  getBalanceTransactions,
  deductBalance,
  getActivityReviews,
  addActivityReview,
  addLoginLog,
  getLoginLogs,
  updateEmployeeLastLogin,
  saveGeneratedDocument,
  getGeneratedDocuments,
  updateDocumentStatus,
} from "./db";

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

  // ─── Flight & Hotel API (Duffel) ──────────────────────────────────────────
  duffel: router({
    searchLocations: publicProcedure
      .input(z.object({ keyword: z.string().min(1) }))
      .query(async ({ input }) => {
        try {
          return await searchLocations(input.keyword);
        } catch (err: any) {
          console.error("[Duffel] searchLocations error:", err?.code || err?.message);
          return [];
        }
      }),

    // ─── Flight Search ────────────────────────────────────────────────
    searchFlights: publicProcedure
      .input(
        z.object({
          originCode: z.string().length(3),
          destinationCode: z.string().length(3),
          departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          adults: z.number().min(1).max(9).default(1),
          children: z.number().min(0).max(8).default(0),
          infants: z.number().min(0).max(4).default(0),
          childAges: z.array(z.number().min(2).max(11)).optional(),
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
            children: input.children,
            infants: input.infants,
            childAges: input.childAges,
            travelClass: input.travelClass,
            max: input.max,
          });
          return { success: true, data: flights };
        } catch (err: any) {
          console.error("[Duffel] searchFlights error:", err?.code || err?.message);
          return { success: false, data: [], error: err?.code || err?.message || "SEARCH_ERROR" };
        }
      }),

    // ─── Price Flight Offer ─────────────────────────────────────────
    priceFlightOffer: publicProcedure
      .input(z.object({ rawOffer: z.any() }))
      .mutation(async ({ input }) => {
        try {
          const result = await priceFlightOffer(input.rawOffer);
          return { success: true, data: result };
        } catch (err: any) {
          console.error("[Duffel] priceFlightOffer error:", err?.message || err);
          return { success: false, data: null, error: err?.message || "PRICING_ERROR" };
        }
      }),

    // ─── Book Flight with PNR (Instant Confirmation via Duffel) ─────
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
          passengers: z.number().min(1).max(9).default(1),
          children: z.number().min(0).max(8).default(0),
          childDetails: z.array(
            z.object({
              firstName: z.string(),
              lastName: z.string(),
              dateOfBirth: z.string(),
            })
          ).optional(),
          infantDetails: z.array(
            z.object({
              firstName: z.string(),
              lastName: z.string(),
              dateOfBirth: z.string(),
            })
          ).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Step 1: Get cached offer
          const rawOffer = getCachedRawOffer(input.offerId);
          if (!rawOffer) {
            console.warn(`[Duffel] No cached offer for ID: ${input.offerId}`);
            return { success: false, pnr: null, error: "OFFER_EXPIRED" };
          }

          // Step 2: Price the offer (refresh)
          console.log(`[Duffel] Pricing offer ${input.offerId}...`);
          const priced = await priceFlightOffer(rawOffer);

          // Step 3: Build travelers array (adults + children + infants)
          // Order must match the offer passengers: adults first, then children, then infants
          const travelers: Array<{
            id: string;
            dateOfBirth: string;
            firstName: string;
            lastName: string;
            gender: "MALE" | "FEMALE";
            email: string;
            phone: string;
            countryCallingCode: string;
          }> = [];

          // Primary adult
          travelers.push({
            id: "1",
            dateOfBirth: input.dateOfBirth,
            firstName: input.firstName,
            lastName: input.lastName,
            gender: input.gender,
            email: input.email,
            phone: input.phone,
            countryCallingCode: input.countryCallingCode,
          });

          // Additional adults (duplicate primary info for now)
          for (let i = 1; i < input.passengers; i++) {
            travelers.push({
              id: String(travelers.length + 1),
              dateOfBirth: input.dateOfBirth,
              firstName: input.firstName,
              lastName: input.lastName,
              gender: input.gender,
              email: input.email,
              phone: input.phone,
              countryCallingCode: input.countryCallingCode,
            });
          }

          // Children (use actual child details if provided, otherwise fallback)
          const childDetails = input.childDetails || [];
          for (let i = 0; i < input.children; i++) {
            const child = childDetails[i];
            const childDob = child?.dateOfBirth || (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 5); return d.toISOString().split("T")[0]; })();
            travelers.push({
              id: String(travelers.length + 1),
              dateOfBirth: childDob,
              firstName: child?.firstName || input.firstName,
              lastName: child?.lastName || input.lastName,
              gender: input.gender,
              email: input.email,
              phone: input.phone,
              countryCallingCode: input.countryCallingCode,
            });
          }

          // Infants (use actual infant details if provided)
          const infantDetails = input.infantDetails || [];
          for (let i = 0; i < infantDetails.length; i++) {
            const inf = infantDetails[i];
            travelers.push({
              id: String(travelers.length + 1),
              dateOfBirth: inf.dateOfBirth,
              firstName: inf.firstName,
              lastName: inf.lastName,
              gender: "MALE",
              email: input.email,
              phone: input.phone,
              countryCallingCode: input.countryCallingCode,
            });
          }

          // Step 4: Create the order with instant confirmation
          console.log(`[Duffel] Creating flight order for ${input.firstName} ${input.lastName} with ${travelers.length} traveler(s)...`);
          const order = await createFlightOrder(priced.pricedOffer, travelers);

          console.log(`[Duffel] ✅ PNR: ${order.pnr}, OrderID: ${order.orderId}, Status: ${order.status}`);

          // Save booking contact for webhook email notifications
          if (order.orderId) {
            upsertBookingContact({
              duffelOrderId: order.orderId,
              bookingRef: `RV-FL-${Date.now().toString().slice(-6)}`,
              passengerName: `${input.firstName} ${input.lastName}`,
              passengerEmail: input.email,
              pnr: order.pnr || undefined,
            }).catch(e => console.warn("[DB] Failed to save booking contact:", e));
          }

          return {
            success: true,
            pnr: order.pnr,
            orderId: order.orderId,
            associatedRecords: order.associatedRecords,
            ticketingDeadline: order.ticketingDeadline,
            status: order.status,
            documents: order.documents,
          };
        } catch (err: any) {
          console.error("[Duffel] bookFlightWithPNR error:", err?.message || err);
          const detail = err?.errors?.[0]?.message || err?.message || "BOOKING_ERROR";
          return { success: false, pnr: null, error: detail };
        }
      }),

    // ─── Create Flight Order (Real PNR) ─────────────────────────
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
          console.log(`[Duffel] ✅ Flight order created! PNR: ${result.pnr}, OrderID: ${result.orderId}`);
          return { success: true, data: result };
        } catch (err: any) {
          console.error("[Duffel] createFlightOrder error:", err?.message || err);
          const detail = err?.errors?.[0]?.message || err?.message || "ORDER_ERROR";
          return { success: false, data: null, error: detail };
        }
      }),

       // ─── Hold Flight Order (Reserve without payment — office payment) ─────
    holdFlightOrder: publicProcedure
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
          passengers: z.number().min(1).max(9).default(1),
          children: z.number().min(0).max(8).default(0),
          childDetails: z.array(
            z.object({
              firstName: z.string(),
              lastName: z.string(),
              dateOfBirth: z.string(),
            })
          ).optional(),
          infantDetails: z.array(
            z.object({
              firstName: z.string(),
              lastName: z.string(),
              dateOfBirth: z.string(),
            })
          ).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Step 1: Price the offer (refresh to get latest price)
          const priced = await priceFlightOffer(input.offerId);
          if (!priced || !priced.pricedOffer) {
            return { success: false, pnr: null, error: "OFFER_UNAVAILABLE" };
          }

          // Step 2: Build travelers array (adults + children + infants)
          const travelers: Array<{
            id: string;
            dateOfBirth: string;
            firstName: string;
            lastName: string;
            gender: "MALE" | "FEMALE";
            email: string;
            phone: string;
            countryCallingCode: string;
          }> = [];

          // Primary adult
          travelers.push({
            id: "1",
            dateOfBirth: input.dateOfBirth,
            firstName: input.firstName,
            lastName: input.lastName,
            gender: input.gender,
            email: input.email,
            phone: input.phone,
            countryCallingCode: input.countryCallingCode,
          });

          // Additional adults
          for (let i = 1; i < input.passengers; i++) {
            travelers.push({
              id: String(travelers.length + 1),
              dateOfBirth: input.dateOfBirth,
              firstName: input.firstName,
              lastName: input.lastName,
              gender: input.gender,
              email: input.email,
              phone: input.phone,
              countryCallingCode: input.countryCallingCode,
            });
          }

          // Children (use actual child details if provided, otherwise fallback)
          const childDetails = input.childDetails || [];
          for (let i = 0; i < input.children; i++) {
            const child = childDetails[i];
            const childDob = child?.dateOfBirth || (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 5); return d.toISOString().split("T")[0]; })();
            travelers.push({
              id: String(travelers.length + 1),
              dateOfBirth: childDob,
              firstName: child?.firstName || input.firstName,
              lastName: child?.lastName || input.lastName,
              gender: input.gender,
              email: input.email,
              phone: input.phone,
              countryCallingCode: input.countryCallingCode,
            });
          }

          // Infants (use actual infant details if provided)
          const infantDetails = input.infantDetails || [];
          for (let i = 0; i < infantDetails.length; i++) {
            const inf = infantDetails[i];
            travelers.push({
              id: String(travelers.length + 1),
              dateOfBirth: inf.dateOfBirth,
              firstName: inf.firstName,
              lastName: inf.lastName,
              gender: "MALE",
              email: input.email,
              phone: input.phone,
              countryCallingCode: input.countryCallingCode,
            });
          }

          // Step 3: Create hold order (no payment)
          console.log(`[Duffel] Creating HOLD order for ${input.firstName} ${input.lastName} with ${travelers.length} traveler(s)...`);
          const holdResult = await createHoldOrder(priced.pricedOffer, travelers);

          // Save booking contact for webhook email notifications
          if (holdResult.orderId) {
            upsertBookingContact({
              duffelOrderId: holdResult.orderId,
              bookingRef: `RV-FL-${Date.now().toString().slice(-6)}`,
              passengerName: `${input.firstName} ${input.lastName}`,
              passengerEmail: input.email,
              pnr: holdResult.pnr || undefined,
              totalPrice: holdResult.totalAmount || undefined,
              currency: holdResult.totalCurrency || undefined,
            }).catch(e => console.warn("[DB] Failed to save booking contact:", e));
          }

          return {
            success: true,
            pnr: holdResult.pnr,
            orderId: holdResult.orderId,
            status: holdResult.status,
            paymentRequiredBy: holdResult.paymentRequiredBy,
            totalAmount: holdResult.totalAmount,
            totalCurrency: holdResult.totalCurrency,
          };
        } catch (err: any) {
          console.error("[Duffel] holdFlightOrder error:", err?.message || err);
          const detail = err?.errors?.[0]?.message || err?.message || "HOLD_ERROR";
          return { success: false, pnr: null, error: detail };
        }
      }),

    // ─── Pay for Hold Order (Admin confirms payment → issue tickets) ───
    payHoldOrder: publicProcedure
      .input(z.object({ orderId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const result = await payForHoldOrder(input.orderId);
          console.log(`[Duffel] ✅ Hold order paid! PNR: ${result.pnr}, Ticket: ${result.ticketNumber || "pending"}`);
          return {
            success: true,
            pnr: result.pnr,
            orderId: result.orderId,
            status: result.status,
            ticketNumber: result.ticketNumber || null,
            documents: result.documents,
          };
        } catch (err: any) {
          console.error("[Duffel] payHoldOrder error:", err?.message || err);
          const detail = err?.errors?.[0]?.message || err?.message || "PAYMENT_ERROR";
          return { success: false, error: detail };
        }
      }),

    // ─── Get Flight Order Status (PNR Lookup) ─────────────────
    getFlightOrder: publicProcedure
      .input(z.object({ orderId: z.string() }))
      .query(async ({ input }) => {
        try {
          const result = await getFlightOrder(input.orderId);
          return { success: true, data: result };
        } catch (err: any) {
          console.error("[Duffel] getFlightOrder error:", err?.message || err);
          const detail = err?.errors?.[0]?.message || err?.message || "RETRIEVE_ERROR";
          return { success: false, data: null, error: detail };
        }
      }),

    // ─── Cancel Flight Order ─────────────────────────────────────────
    cancelFlightOrder: publicProcedure
      .input(z.object({ orderId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const result = await cancelFlightOrder(input.orderId);
          console.log(`[Duffel] ✅ Order ${input.orderId} cancelled`);
          return { success: true, data: result };
        } catch (err: any) {
          console.error("[Duffel] cancelFlightOrder error:", err?.message || err);
          const detail = err?.message || "CANCEL_ERROR";
          return { success: false, data: null, error: detail };
        }
      }),

    // ─── Get Status Info ──────────────────────────────────────────
    getStatus: publicProcedure.query(() => {
      return getDuffelStatus();
    }),

    // ─── Get Duffel Status ──────────────────────────────────────────
    getDuffelStatus: publicProcedure.query(() => {
      return getDuffelStatus();
    }),

    // ─── Check Ticket Issuance ──────────────────────────────────────
    checkTicketIssuance: publicProcedure
      .input(z.object({ orderId: z.string() }))
      .query(async ({ input }) => {
        try {
          const result = await checkTicketIssuance(input.orderId);
          return { success: true, data: result };
        } catch (err: any) {
          console.error("[Duffel] checkTicketIssuance error:", err?.message || err);
          const detail = err?.message || "TICKET_CHECK_ERROR";
          return { success: false, data: null, error: detail };
        }
      }),

    // ─── Queue to Consolidator (no-op for Duffel) ──────────────────
    queueToConsolidator: publicProcedure
      .input(z.object({ orderId: z.string() }))
      .mutation(async ({ input }) => {
        const result = queueToConsolidator(input.orderId);
        return { success: true, data: result };
      }),

    // ─── Get Consolidator Config ────────────────────────────────────
    getConsolidatorConfig: publicProcedure.query(() => {
      return getConsolidatorConfig();
    }),

    // ─── Update Consolidator Office ID (no-op for Duffel) ──────────
    setConsolidatorOfficeId: publicProcedure
      .input(z.object({ officeId: z.string() }))
      .mutation(async ({ input }) => {
        const config = setConsolidatorOfficeId(input.officeId);
        return { success: true, data: config };
      }),

    // ─── Set Active Consolidator (no-op for Duffel) ────────────────
    setActiveConsolidator: publicProcedure
      .input(z.object({ index: z.number() }))
      .mutation(async ({ input }) => {
        const config = setActiveConsolidator(input.index);
        return { success: true, data: config };
      }),

    // ─── Add Consolidator (no-op for Duffel) ──────────────────────
    addConsolidator: publicProcedure
      .input(z.object({ officeId: z.string(), currency: z.string() }))
      .mutation(async ({ input }) => {
        const config = addConsolidator(input.officeId, input.currency);
        return { success: true, data: config };
      }),

    // ─── Remove Consolidator (no-op for Duffel) ───────────────────
    removeConsolidator: publicProcedure
      .input(z.object({ index: z.number() }))
      .mutation(async ({ input }) => {
        const config = removeConsolidator(input.index);
        return { success: true, data: config };
      }),

    // ─── Hotel Search ─────────────────────────────────────────────────
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
          console.error("[Duffel] searchHotels error:", err?.code || err?.message);
          return { success: false, data: [], error: err?.code || "SEARCH_ERROR" };
        }
      }),

    // ─── Register Booking Contact (client calls after successful booking) ───
    registerBookingContact: publicProcedure
      .input(
        z.object({
          duffelOrderId: z.string(),
          bookingRef: z.string(),
          passengerName: z.string(),
          passengerEmail: z.string().optional(),
          customerPushToken: z.string().optional(),
          pnr: z.string().optional(),
          routeSummary: z.string().optional(),
          totalPrice: z.string().optional(),
          currency: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          await upsertBookingContact(input);
          return { success: true };
        } catch (err: any) {
          console.error("[DB] registerBookingContact error:", err?.message);
          return { success: false, error: err?.message };
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
          ticketNumber: z.string().optional(),
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
          infants: z.number().default(0),
          totalPrice: z.string(),
          currency: z.string().default("MRU"),
          tripType: z.enum(["one-way", "round-trip"]).default("one-way"),
          returnDate: z.string().optional(),
          /** Optional: business partner account ID — ticket will be branded with partner info */
          businessAccountId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { businessAccountId, ...ticketData } = input;
        let partnerInfo = undefined;
        if (businessAccountId) {
          const account = await getBusinessAccountById(businessAccountId);
          if (account) {
            partnerInfo = {
              companyName: account.companyName,
              contactName: account.contactName || undefined,
              contactEmail: account.contactEmail || undefined,
              contactPhone: account.contactPhone || undefined,
              address: account.address || undefined,
              city: account.city || undefined,
              country: account.country || undefined,
            };
          }
        }
        const success = await sendFlightTicket({ ...ticketData, partnerInfo });
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
          bookingType: z.enum(["flight", "hotel", "activity"]),
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
          infants: z.number().default(0),
          totalPrice: z.string().default(""),
          currency: z.string().default("MRU"),
          tripType: z.enum(["one-way", "round-trip"]).default("one-way"),
          returnDate: z.string().optional(),
          // Push notification
          expoPushToken: z.string().optional(),
          /** Optional: business partner account ID — ticket will be branded with partner info */
          businessAccountId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { expoPushToken, businessAccountId, ...ticketData } = input;
        // Fetch partner info if booking is from a business account
        let partnerInfo = undefined;
        if (businessAccountId) {
          const account = await getBusinessAccountById(businessAccountId);
          if (account) {
            partnerInfo = {
              companyName: account.companyName,
              contactName: account.contactName || undefined,
              contactEmail: account.contactEmail || undefined,
              contactPhone: account.contactPhone || undefined,
              address: account.address || undefined,
              city: account.city || undefined,
              country: account.country || undefined,
            };
          }
        }
        // Send PDF ticket via email (branded with partner info if applicable)
        const emailSent = await sendFlightTicket({ ...ticketData, partnerInfo });
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
                body: `\u062a\u0645 \u0625\u0635\u062f\u0627\u0631 \u062a\u0630\u0643\u0631\u0629 \u0631\u062d\u0644\u062a\u0643 ${input.bookingRef} \u0628\u0646\u062c\u0627\u062d. \u062a\u062d\u0642\u0642 \u0645\u0646 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0644\u062a\u0646\u0632\u064a\u0644 \u0627\u0644\u062a\u0630\u0643\u0631\u0629.`,
                data: { bookingRef: input.bookingRef, type: "airline_confirmed" },
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
    // ─── Cancellation Email ─────────────────────────────────────────────
    sendCancellation: publicProcedure
      .input(
        z.object({
          passengerEmail: z.string().email(),
          passengerName: z.string(),
          bookingRef: z.string(),
          pnr: z.string().optional(),
          route: z.string().optional(),
          date: z.string().optional(),
          refundAmount: z.string().optional(),
          refundCurrency: z.string().optional(),
          reason: z.string().optional(),
          expoPushToken: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { expoPushToken, ...emailData } = input;
        const emailSent = await sendCancellationEmail(emailData);
        let pushSent = false;
        if (expoPushToken) {
          try {
            const response = await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({
                to: expoPushToken,
                sound: "default",
                title: "\u274C \u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u062D\u062C\u0632\u0643",
                body: `\u062D\u062C\u0632\u0643 ${input.bookingRef} \u062A\u0645 \u0625\u0644\u063A\u0627\u0624\u0647. \u062A\u062D\u0642\u0642 \u0645\u0646 \u0628\u0631\u064A\u062F\u0643 \u0644\u0644\u062A\u0641\u0627\u0635\u064A\u0644.`,
                data: { bookingRef: input.bookingRef, type: "booking_cancelled" },
              }),
            });
            const result = await response.json();
            pushSent = result?.data?.[0]?.status === "ok";
          } catch (err: any) {
            console.warn("[Push] Failed to send cancellation push:", err?.message);
          }
        }
        return { emailSent, pushSent };
      }),

    // ─── Hold Confirmation Email (Hold → Confirmed & Paid) ──────────────
    sendHoldConfirmation: publicProcedure
      .input(
        z.object({
          passengerEmail: z.string().email(),
          passengerName: z.string(),
          bookingRef: z.string(),
          pnr: z.string(),
          ticketNumber: z.string().optional(),
          route: z.string().optional(),
          date: z.string().optional(),
          totalAmount: z.string(),
          currency: z.string().default("MRU"),
          expoPushToken: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { expoPushToken, ...emailData } = input;
        const emailSent = await sendHoldConfirmationEmail(emailData);
        let pushSent = false;
        if (expoPushToken) {
          try {
            const response = await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Accept": "application/json" },
              body: JSON.stringify({
                to: expoPushToken,
                sound: "default",
                title: "\u2705 \u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u062D\u062C\u0632\u0643!",
                body: `\u062D\u062C\u0632\u0643 ${input.bookingRef} \u062A\u0645 \u062A\u0623\u0643\u064A\u062F\u0647 \u0648\u062F\u0641\u0639\u0647 \u0628\u0646\u062C\u0627\u062D. PNR: ${input.pnr}`,
                data: { bookingRef: input.bookingRef, pnr: input.pnr, type: "hold_confirmed" },
              }),
            });
            const result = await response.json();
            pushSent = result?.data?.[0]?.status === "ok";
          } catch (err: any) {
            console.warn("[Push] Failed to send hold confirmation push:", err?.message);
          }
        }
        return { emailSent, pushSent };
      }),
  }),

  // ─── Business Accounts Management (Admin) ──────────────────────────────────
  businessAccounts: router({
    list: publicProcedure.query(async () => {
      return await getBusinessAccounts();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getBusinessAccountById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        companyName: z.string().min(1).max(255),
        contactName: z.string().min(1).max(255),
        contactEmail: z.string().max(320).optional(),
        contactPhone: z.string().max(32).optional(),
        commissionPercent: z.string(),
        creditLimit: z.string().optional(),
        notes: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createBusinessAccount(input);
        return { success: true, id };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        companyName: z.string().min(1).max(255).optional(),
        contactName: z.string().min(1).max(255).optional(),
        contactEmail: z.string().max(320).optional(),
        contactPhone: z.string().max(32).optional(),
        commissionPercent: z.string().optional(),
        creditLimit: z.string().optional(),
        status: z.enum(["active", "suspended", "closed"]).optional(),
        notes: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateBusinessAccount(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteBusinessAccount(input.id);
        return { success: true };
      }),
  }),

  // ─── Employee Management (Admin) ───────────────────────────────────────────
  employees: router({
    list: publicProcedure.query(async () => {
      const emps = await getEmployees();
      // Strip password hashes from response
      return emps.map(({ passwordHash, ...rest }) => rest);
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const emp = await getEmployeeById(input.id);
        if (!emp) return null;
        const { passwordHash, ...rest } = emp;
        return rest;
      }),

    create: publicProcedure
      .input(z.object({
        fullName: z.string().min(1).max(255),
        email: z.string().email().max(320),
        phone: z.string().max(32).optional(),
        password: z.string().min(4),
        role: z.enum(["manager", "accountant", "booking_agent", "support"]),
        permissions: z.string().optional(),
        department: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check if email already exists
        const existing = await getEmployeeByEmail(input.email);
        if (existing) {
          throw new Error("البريد الإلكتروني مستخدم بالفعل");
        }
        const id = await createEmployee(input);
        // Send welcome email with login credentials
        sendEmployeeWelcomeEmail({
          fullName: input.fullName,
          email: input.email,
          password: input.password,
          role: input.role,
          department: input.department,
        }).catch((e) => console.warn("[Email] Failed to send employee welcome:", e));
        return { success: true, id };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        fullName: z.string().min(1).max(255).optional(),
        email: z.string().email().max(320).optional(),
        phone: z.string().max(32).optional(),
        password: z.string().min(4).optional(),
        role: z.enum(["manager", "accountant", "booking_agent", "support"]).optional(),
        permissions: z.string().optional(),
        status: z.enum(["active", "inactive"]).optional(),
        department: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateEmployee(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteEmployee(input.id);
        return { success: true };
      }),

    // Verify employee login
    verifyLogin: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const emp = await getEmployeeByEmail(input.email);
        if (!emp || emp.status !== "active") {
          return { success: false, error: "بيانات الدخول غير صحيحة" };
        }
        const valid = verifyPassword(input.password, emp.passwordHash);
        if (!valid) {
          return { success: false, error: "كلمة المرور غير صحيحة" };
        }
        const { passwordHash, ...safeEmp } = emp;
        return { success: true, employee: safeEmp };
      }),
  }),
  // ─── Duffel Webhooks Management ──────────────────────────────────────────
  webhooks: router({
    // Get webhook event log
    getLog: adminProcedure
      .input(z.object({}).optional())
      .query(async () => {
        return { log: getWebhookLog() };
      }),

    // Get webhook notifications
    getNotifications: adminProcedure
      .input(z.object({}).optional())
      .query(async () => {
        return { notifications: getWebhookNotifications() };
      }),

    // Clear webhook notifications
    clearNotifications: adminProcedure
      .input(z.object({}).optional())
      .mutation(async () => {
        clearWebhookNotifications();
        return { success: true };
      }),

    // Register a new webhook with Duffel
    register: adminProcedure
      .input(
        z.object({
          url: z.string().url(),
          events: z.array(z.string()).min(1),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await createDuffelWebhook(input.url, input.events);
          return {
            success: true,
            webhook: result.data,
            message: "تم تسجيل Webhook بنجاح. احفظ السر (secret) — لن يظهر مرة أخرى!",
          };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      }),

    // List all registered webhooks
    list: adminProcedure
      .input(z.object({}).optional())
      .query(async () => {
        try {
          const result = await listDuffelWebhooks();
          return { success: true, webhooks: result.data || [] };
        } catch (err: any) {
          return { success: false, webhooks: [], error: err.message };
        }
      }),

    // Delete a webhook
    delete: adminProcedure
      .input(z.object({ webhookId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          await deleteDuffelWebhook(input.webhookId);
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      }),

    // Ping a webhook to test it
    ping: adminProcedure
      .input(z.object({ webhookId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          await pingDuffelWebhook(input.webhookId);
          return { success: true, message: "تم إرسال Ping بنجاح" };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      }),
  }),
  // ─── Stripe Payments ─────────────────────────────────────────────────
  stripe: router({
    createPaymentIntent: publicProcedure
      .input(
        z.object({
          amount: z.number().min(1), // Amount in MRU
          currency: z.string().default("eur"), // Target Stripe currency: "eur" or "usd"
          description: z.string().optional(),
          bookingRef: z.string().optional(),
          passengerName: z.string().optional(),
          passengerEmail: z.string().email().optional(),
          usdToMRU: z.number().optional(),
          eurToMRU: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          if (!isStripeConfigured()) {
            return { success: false as const, error: "STRIPE_NOT_CONFIGURED" };
          }
          const result = await createPaymentIntent({
            amount: input.amount,
            currency: input.currency,
            description: input.description || `Royal Voyage Booking${input.bookingRef ? ` - ${input.bookingRef}` : ""}`,
            metadata: {
              ...(input.bookingRef ? { bookingRef: input.bookingRef } : {}),
              ...(input.passengerName ? { passengerName: input.passengerName } : {}),
              ...(input.passengerEmail ? { passengerEmail: input.passengerEmail } : {}),
              bookingType: "flight",
            },
            receiptEmail: input.passengerEmail,
            rates: {
              usdToMRU: input.usdToMRU,
              eurToMRU: input.eurToMRU,
            },
          });
          return { success: true as const, ...result };
        } catch (err: any) {
          console.error("[Stripe] createPaymentIntent error:", err?.message);
          return { success: false as const, error: err?.message || "PAYMENT_INTENT_ERROR" };
        }
      }),

    getPaymentStatus: publicProcedure
      .input(z.object({ paymentIntentId: z.string() }))
      .query(async ({ input }) => {
        try {
          const result = await getPaymentIntent(input.paymentIntentId);
          return { success: true, ...result };
        } catch (err: any) {
          console.error("[Stripe] getPaymentStatus error:", err?.message);
          return { success: false, error: err?.message || "STATUS_ERROR" };
        }
      }),

    isConfigured: publicProcedure.query(() => {
      return { configured: isStripeConfigured() };
    }),

    getPublishableKey: publicProcedure.query(() => {
      return { key: getPublishableKey() };
    }),
  }),

  // ─── Top-Up Requests (طلبات شحن الرصيد) ────────────────────────────────────────────
  topUp: router({
    list: publicProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }).optional())
      .query(async ({ input }) => {
        return await getTopUpRequests(input?.status);
      }),

    listByAccount: publicProcedure
      .input(z.object({ businessAccountId: z.number() }))
      .query(async ({ input }) => {
        return await getTopUpRequestsByAccount(input.businessAccountId);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getTopUpRequestById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        businessAccountId: z.number(),
        amount: z.string(),
        paymentMethod: z.string().optional(),
        paymentReference: z.string().optional(),
        receiptImage: z.string().optional(),
        requestNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createTopUpRequest(input);
        return { success: true, id };
      }),

    approve: publicProcedure
      .input(z.object({
        id: z.number(),
        processedBy: z.string(),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await approveTopUpRequest(input.id, input.processedBy, input.adminNotes);
        return { success: true };
      }),

    reject: publicProcedure
      .input(z.object({
        id: z.number(),
        processedBy: z.string(),
        adminNotes: z.string(),
      }))
      .mutation(async ({ input }) => {
        await rejectTopUpRequest(input.id, input.processedBy, input.adminNotes);
        return { success: true };
      }),
  }),

  // ─── HBX Group Hotels API ─────────────────────────────────────────────────
  hbx: router({
    // Status check
    getStatus: publicProcedure.query(() => getHBXStatus()),

    // Search hotels by city IATA code
    searchHotels: publicProcedure
      .input(
        z.object({
          cityCode: z.string().min(2).max(5),
          checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          adults: z.number().min(1).max(9).default(2),
          rooms: z.number().min(1).max(5).default(1),
          ratings: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        try {
          const hotels = await searchHotelsByCityCode({
            cityCode: input.cityCode,
            checkInDate: input.checkInDate,
            checkOutDate: input.checkOutDate,
            adults: input.adults,
            rooms: input.rooms,
            ratings: input.ratings,
          });
          return { success: true, data: hotels };
        } catch (err: any) {
          console.error("[HBX] searchHotels error:", err?.message);
          return { success: false, data: [], error: err?.message || "SEARCH_ERROR" };
        }
      }),

    // CheckRate before booking
    checkRate: publicProcedure
      .input(z.object({ rateKey: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const result = await hbxCheckRate(input.rateKey);
          return { success: !!result, data: result };
        } catch (err: any) {
          console.error("[HBX] checkRate error:", err?.message);
          return { success: false, data: null, error: err?.message };
        }
      }),

    // Create hotel booking
    createBooking: publicProcedure
      .input(
        z.object({
          rateKey: z.string(),
          holderName: z.string(),
          holderSurname: z.string(),
          holderEmail: z.string().optional(),
          holderPhone: z.string().optional(),
          clientReference: z.string().optional(),
          remark: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const result = await hbxCreateBooking(input);
          return { success: !!result, data: result };
        } catch (err: any) {
          console.error("[HBX] createBooking error:", err?.message);
          return { success: false, data: null, error: err?.message };
        }
      }),

    // Get booking details
    getBooking: publicProcedure
      .input(z.object({ reference: z.string() }))
      .query(async ({ input }) => {
        try {
          const result = await hbxGetBooking(input.reference);
          return { success: !!result, data: result };
        } catch (err: any) {
          return { success: false, data: null, error: err?.message };
        }
      }),

    // Cancel booking
    cancelBooking: publicProcedure
      .input(z.object({ reference: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const ok = await hbxCancelBooking(input.reference);
          return { success: ok };
        } catch (err: any) {
          return { success: false, error: err?.message };
        }
      }),
  }),

  // ─── HBX Activities ────────────────────────────────────────────────────────
  hbxActivities: router({
    search: publicProcedure
      .input(z.object({
        destinationCode: z.string(),
        fromDate: z.string(),
        toDate: z.string(),
        language: z.string().optional(),
      }))
      .query(async ({ input }) => {
        try {
          return await searchActivities(input);
        } catch (err: any) {
          console.error("[HBX Activities] search error:", err?.message);
          return [];
        }
      }),
    detail: publicProcedure
      .input(z.object({
        code: z.string(),
        language: z.string().optional(),
      }))
      .query(async ({ input }) => {
        try {
          return await getActivityDetail(input.code, input.language);
        } catch (err: any) {
          console.error("[HBX Activities] detail error:", err?.message);
          return null;
        }
      }),
    book: publicProcedure
      .input(z.object({
        activityCode: z.string(),
        fromDate: z.string(),
        toDate: z.string(),
        rateKey: z.string().optional(),
        adults: z.number(),
        children: z.number(),
        language: z.string(),
        holder: z.object({
          name: z.string(),
          surname: z.string(),
          email: z.string(),
          phone: z.string().optional(),
        }),
        paxes: z.array(z.object({
          type: z.enum(["ADULT", "CHILD"]),
          name: z.string(),
          surname: z.string(),
          age: z.number().optional(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          return await bookActivity(input);
        } catch (err: any) {
          console.error("[HBX Activities] book error:", err?.message);
          throw new Error("Failed to book activity");
        }
      }),
  }),

  // ─── Activity Reviews (تقييمات الأنشطة) ──────────────────────────────────────
  activityReviews: router({
    list: publicProcedure
      .input(z.object({ activityCode: z.string() }))
      .query(async ({ input }) => {
        return await getActivityReviews(input.activityCode);
      }),
    add: publicProcedure
      .input(z.object({
        activityCode: z.string(),
        reviewerName: z.string().min(2).max(255),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
        language: z.string().default("en"),
      }))
      .mutation(async ({ input, ctx }) => {
        const review = await addActivityReview({
          activityCode: input.activityCode,
          reviewerName: input.reviewerName,
          rating: input.rating,
          comment: input.comment || null,
          language: input.language,
          userId: ctx.user?.id || null,
          verified: false,
        });
        if (!review) throw new Error("Failed to save review");
        return review;
      }),
  }),

  // ─── Balance Transactions (سجل معاملات الرصيد) ───────────────────────────────────
  balanceTransactions: router({
    list: publicProcedure
      .input(z.object({ businessAccountId: z.number() }))
      .query(async ({ input }) => {
        return await getBalanceTransactions(input.businessAccountId);
      }),
  }),

  // ─── Login Audit Log (سجل محاولات الدخول) ────────────────────────────────────
  loginLogs: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(200).optional() }))
      .query(async ({ input }) => {
        return await getLoginLogs(input.limit ?? 50);
      }),
    add: publicProcedure
      .input(z.object({
        identifier: z.string(),
        accountType: z.enum(["admin", "employee"]),
        success: z.boolean(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
        failureReason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await addLoginLog(input);
        return { success: true };
      }),
  }),

  // ─── Admin Push Token Storage ─────────────────────────────────────────
  adminToken: router({
    // Save admin push token to server (persists across devices)
    save: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        // Store in memory (survives server restarts via env fallback)
        (global as any).__adminPushToken = input.token;
        console.log("[AdminToken] Saved admin push token:", input.token.slice(0, 30) + "...");
        return { success: true };
      }),
    // Get admin push token
    get: publicProcedure
      .query(async () => {
        const token = (global as any).__adminPushToken ?? null;
        return { token };
      }),
    // Send push notification to admin using stored token
    sendToAdmin: publicProcedure
      .input(z.object({
        title: z.string(),
        body: z.string(),
        data: z.record(z.string(), z.unknown()).optional(),
        sound: z.string().optional(),
        channelId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const token = (global as any).__adminPushToken;
        if (!token) return { success: false, error: "No admin token registered" };
        try {
          const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
              to: token,
              sound: input.sound ?? "default",
              title: input.title,
              body: input.body,
              data: input.data ?? {},
              channelId: input.channelId,
            }),
          });
          const result = await response.json();
          console.log("[AdminToken] Push sent:", JSON.stringify(result));
          return { success: true, result };
        } catch (err: any) {
          console.error("[AdminToken] Push failed:", err?.message);
          return { success: false, error: err?.message };
        }
      }),
  }),
  // ─── Company Documents PDF Generator ─────────────────────────────────────
  documents: router({
    // Generate Employment Contract PDF
    generateEmploymentContract: publicProcedure
      .input(z.object({
        employeeName: z.string(),
        employeeId: z.string().optional(),
        nationality: z.string().optional(),
        birthDate: z.string().optional(),
        position: z.string(),
        department: z.string().optional(),
        startDate: z.string(),
        contractDuration: z.string().optional(),
        salary: z.string(),
        workHours: z.string().optional(),
        probationPeriod: z.string().optional(),
        refNumber: z.string().optional(),
        date: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const pdfBuffer = await generateEmploymentContractPDF(input);
        const base64 = pdfBuffer.toString("base64");
        return { base64, filename: `employment_contract_${input.employeeName.replace(/\s+/g, "_")}.pdf` };
      }),
    // Generate Service Invoice PDF
    generateInvoice: publicProcedure
      .input(z.object({
        invoiceNumber: z.string(),
        date: z.string(),
        dueDate: z.string().optional(),
        clientName: z.string(),
        clientPhone: z.string().optional(),
        clientEmail: z.string().optional(),
        clientAddress: z.string().optional(),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
        })),
        currency: z.string(),
        taxRate: z.number().optional(),
        notes: z.string().optional(),
        paymentMethod: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const pdfBuffer = await generateInvoicePDF(input);
        const base64 = pdfBuffer.toString("base64");
        return { base64, filename: `invoice_${input.invoiceNumber}.pdf` };
      }),
    // Generate Partnership Agreement PDF
    generatePartnership: publicProcedure
      .input(z.object({
        partnerName: z.string(),
        partnerLegal: z.string().optional(),
        partnerAddress: z.string().optional(),
        partnerPhone: z.string().optional(),
        partnerEmail: z.string().optional(),
        partnerRep: z.string().optional(),
        commissionRate: z.string(),
        startDate: z.string(),
        duration: z.string().optional(),
        refNumber: z.string().optional(),
        date: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const pdfBuffer = await generatePartnershipPDF(input);
        const base64 = pdfBuffer.toString("base64");
        return { base64, filename: `partnership_${input.partnerName.replace(/\s+/g, "_")}.pdf` };
      }),

    // Generate Ticket Invoice PDF
    generateTicketInvoice: publicProcedure
      .input(z.object({
        invoiceNumber: z.string(),
        date: z.string(),
        passengerName: z.string(),
        passengerEmail: z.string().optional(),
        passengerPhone: z.string().optional(),
        bookingRef: z.string().optional(),
        pnr: z.string().optional(),
        origin: z.string(),
        originCity: z.string(),
        destination: z.string(),
        destinationCity: z.string(),
        departureDate: z.string(),
        returnDate: z.string().optional(),
        airline: z.string(),
        flightNumber: z.string(),
        cabinClass: z.string(),
        adults: z.number().min(1),
        children: z.number().min(0).default(0),
        infants: z.number().min(0).default(0),
        adultPrice: z.number(),
        childPrice: z.number().optional(),
        infantPrice: z.number().optional(),
        taxes: z.number(),
        totalPrice: z.number(),
        currency: z.string(),
        paymentMethod: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const pdfBuffer = await generateTicketInvoicePDF(input);
        const base64 = pdfBuffer.toString("base64");
        return { base64, filename: `ticket_invoice_${input.invoiceNumber}.pdf` };
      }),

    // Save document record to DB
    saveDocument: publicProcedure
      .input(z.object({
        docType: z.enum(["employment_contract", "invoice", "partnership", "ticket_invoice"]),
        refNumber: z.string().optional(),
        partyName: z.string(),
        partyEmail: z.string().optional(),
        partyPhone: z.string().optional(),
        amount: z.string().optional(),
        currency: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await saveGeneratedDocument(input);
        return { success: true, id };
      }),

    // Get all saved documents
    getDocuments: publicProcedure
      .query(async () => {
        return getGeneratedDocuments(100);
      }),

    // Send document by email
    sendByEmail: publicProcedure
      .input(z.object({
        toEmail: z.string().email(),
        toName: z.string(),
        docType: z.enum(["employment_contract", "invoice", "partnership", "ticket_invoice"]),
        pdfBase64: z.string(),
        filename: z.string(),
        refNumber: z.string().optional(),
        amount: z.string().optional(),
        currency: z.string().optional(),
        documentId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const sent = await sendDocumentEmail(input);
        if (sent && input.documentId) {
          await updateDocumentStatus(input.documentId, "sent");
        }
        return { success: sent };
      }),
  }),
});
export type AppRouter = typeof appRouter;
