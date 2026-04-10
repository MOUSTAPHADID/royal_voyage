import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Modal,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { FLIGHTS, HOTELS, Booking } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatMRU, fromMRU, formatCurrency } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";
import { trpc } from "@/lib/trpc";
import { scheduleCashPaymentReminder, scheduleHoldExpiryReminders, scheduleAdminHoldExpiryNotification } from "@/lib/push-notifications";
import { getPricingSettings } from "@/lib/pricing-settings";
import { getApiBaseUrl } from "@/constants/oauth";
import { usePaymentSheet } from "@/hooks/use-stripe-payment";
import { fromMRU as convertFromMRU, type AppCurrency } from "@/lib/currency";

type PaymentMethod = "cash" | "bank_transfer" | "bankily" | "masrvi" | "sedad" | "stripe" | "multicaixa" | "hold_24h";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  sublabel: string;
  logo?: any;
  iconName?: string;
  color: string;
}[] = [
  {
    id: "cash",
    label: "دفع نقدي في المكتب",
    sublabel: "ادفع عند زيارة مكتبنا في نواكشوط",
    iconName: "banknote.fill",
    color: "#22C55E",
  },
  {
    id: "bank_transfer",
    label: "تحويل بنكي",
    sublabel: "تحويل مباشر إلى حساب Royal Voyage",
    iconName: "building.columns.fill",
    color: "#3B82F6",
  },
  {
    id: "bankily",
    label: "بنكيلي",
    sublabel: "الدفع عبر تطبيق Bankily",
    logo: require("@/assets/images/payment/bankily.png"),
    color: "#F59E0B",
  },
  {
    id: "masrvi",
    label: "مصرفي",
    sublabel: "الدفع عبر تطبيق مصرفي",
    logo: require("@/assets/images/payment/masrvi.png"),
    color: "#00C9A7",
  },
  {
    id: "sedad",
    label: "سداد",
    sublabel: "الدفع عبر منصة Sedad",
    logo: require("@/assets/images/payment/sedad.png"),
    color: "#B8860B",
  },
  {
    id: "stripe",
    label: "بطاقة بنكية (Visa / Mastercard)",
    sublabel: "ادفع بالبطاقة البنكية بشكل آمن عبر Stripe",
    logo: require("@/assets/images/payment/stripe.png"),
    color: "#635BFF",
  },
  {
    id: "multicaixa",
    label: "Multicaixa Express",
    sublabel: "الدفع عبر Multicaixa Express (بالكوانزا AOA)",
    iconName: "creditcard.fill",
    color: "#E31937",
  },
  {
    id: "hold_24h",
    label: "حجز مؤكد 24 ساعة",
    sublabel: "احجز الآن وادفع خلال 24 ساعة — حجز مؤكد من شركة الطيران",
    iconName: "timer",
    color: "#0EA5E9",
  },
];

// بيانات التحويل البنكي
const BANK_INFO = {
  bankName: "بنك موريتانيا للتجارة الدولية (BMCI)",
  accountName: "Royal Voyage SARL",
  accountNumber: "MR46 0002 0001 0123 4567 8901 234",
  rib: "00020001012345678901234",
};

// أرقام الدفع عبر المحافظ
const WALLET_NUMBERS: Record<string, string> = {
  bankily: "22 XX XX XX",
  masrvi: "36 XX XX XX", // مصرفي
  sedad: "sedad.royalvoyage.mr",
  multicaixa: "0055 0000 76790864101 08",
};

export default function PaymentScreen() {
  const router = useRouter();
  const colors = useColors();
  const { addBooking, updateBookingReceipt, expoPushToken } = useApp();
  const { fmt, currency } = useCurrency();
  const params = useLocalSearchParams<{
    type: string;
    id: string;
    roomId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    passport?: string;
    nationality?: string;
    dateOfBirth?: string;
    price?: string;
    currency?: string;
    priceCurrency?: string;
    airline?: string;
    flightNumber?: string;
    origin?: string;
    destination?: string;
    originCode?: string;
    destinationCode?: string;
    departureTime?: string;
    arrivalTime?: string;
    duration?: string;
    cabinClass?: string;
    passengers?: string;
    children?: string;
    infants?: string;
    childDetailsJson?: string;
    infantDetailsJson?: string;
    tripType?: string;
    returnDate?: string;
    hotelName?: string;
    hotelCity?: string;
    hotelCountry?: string;
    hotelStars?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    roomType?: string;
    roomPrice?: string;
    businessAccountId?: string;
    businessCommission?: string;
    rawOffer?: string; // JSON string of Duffel raw offer
  }>();

  const isFlight = params.type === "flight";
  const flight = isFlight ? FLIGHTS.find((f) => f.id === params.id) ?? FLIGHTS[0] : null;
  const hotel = !isFlight ? HOTELS.find((h) => h.id === params.id) ?? HOTELS[0] : null;

  const adultCount = parseInt(params.passengers ?? "1", 10);
  const childCount = parseInt(params.children ?? "0", 10);
  const infantCount = parseInt(params.infants ?? "0", 10);

  // السعر المُمرَّر من flights/detail أو hotels/detail هو بالأوقية (MRU) دائماً
  const passedPrice = parseFloat(params.price ?? "0");
  const passedRoomPrice = parseFloat(params.roomPrice ?? "0");

  // للفنادق: استخدم roomPrice إذا كان موجوداً، وإلا price
  const totalMRUPassed = isFlight
    ? passedPrice
    : passedRoomPrice > 0 ? passedRoomPrice : passedPrice;

  // إذا لم يُمرَّر سعر (mock data)، احسب من mock بالدولار وحوّل
  const unitPrice = isFlight ? (flight?.price ?? 0) : (hotel?.pricePerNight ?? 0);
  const adultUnitPrice = unitPrice;
  const childUnitPrice = Math.round(unitPrice * 0.75);
  const mockTotalUSD = adultUnitPrice * adultCount + childUnitPrice * childCount;

  // total دائماً بالأوقية
  const baseTotal = totalMRUPassed > 0
    ? totalMRUPassed
    : Math.round(mockTotalUSD * 39.5);

  // تطبيق العمولة التجارية إذا كان الحجز لحساب تجاري
  const businessCommissionRate = parseFloat(params.businessCommission ?? "0");
  const commissionAmount = businessCommissionRate > 0 ? Math.round(baseTotal * (businessCommissionRate / 100)) : 0;

  // رسوم الاحتفاظ بالسعر 24 ساعة (من إعدادات التسعير)
  const hold24hFee = getPricingSettings().hold24hFeeMRU ?? 500;

  const total = baseTotal + commissionAmount;

  // وحدة سعر الشخص الواحد بالأوقية (للعرض فقط)
  const totalPersons = adultCount + childCount * 0.75;
  const adultUnitMRU = totalPersons > 0 ? Math.round(total / totalPersons) : total;
  const childUnitMRU = Math.round(adultUnitMRU * 0.75);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [transferRef, setTransferRef] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [ibanCopied, setIbanCopied] = useState(false);

  // مؤقت عد تنازلي 15 دقيقة لحجز المقعد مؤقتاً
  const TIMER_DURATION = 15 * 60; // 15 دقيقة بالثواني
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [timerExpired, setTimerExpired] = useState(false);

  React.useEffect(() => {
    if (timeLeft <= 0) {
      setTimerExpired(true);
      Alert.alert(
        "انتهى الوقت",
        "انتهت مهلة الحجز المؤقت (15 دقيقة). يرجى البدء من جديد.",
        [{ text: "حسناً", onPress: () => router.back() }]
      );
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const sendFlightTicket = trpc.email.sendFlightTicket.useMutation();
  const sendHotelConfirmation = trpc.email.sendHotelConfirmation.useMutation();
  const sendAdminPush = trpc.email.sendPushNotification.useMutation();
  const sendToAdmin = trpc.adminToken.sendToAdmin.useMutation();
  const bookFlightWithPNR = trpc.duffel.bookFlightWithPNR.useMutation();
  const holdFlightOrder = trpc.duffel.holdFlightOrder.useMutation();
  const registerBookingContact = trpc.duffel.registerBookingContact.useMutation();
  const createPaymentIntent = trpc.stripe.createPaymentIntent.useMutation();

  // Stripe Payment Sheet
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  const handleStripePayment = async (): Promise<{ success: boolean; paymentIntentId?: string }> => {
    try {
      setStripeLoading(true);
      const stripeCurrency = currency === "USD" ? "usd" : "eur";
      const amountInForeign = convertFromMRU(total, stripeCurrency.toUpperCase() as AppCurrency);
      // Stripe expects amount in smallest unit (cents)
      const amountInCents = Math.round(amountInForeign * 100);

      const result = await createPaymentIntent.mutateAsync({
        amount: total, // MRU amount for conversion on server
        currency: stripeCurrency,
        description: `Royal Voyage - ${isFlight ? 'Flight' : 'Hotel'} Booking`,
        bookingRef: `RV-${isFlight ? 'FL' : 'HT'}-${Date.now().toString().slice(-6)}`,
        passengerName: `${params.firstName ?? ''} ${params.lastName ?? ''}`.trim(),
        passengerEmail: params.email || undefined,
      });

      if (!result.success || !('clientSecret' in result) || !result.clientSecret) {
        const errorMsg = 'error' in result ? result.error : 'Unknown error';
        Alert.alert('خطأ في الدفع', `فشل إنشاء جلسة الدفع: ${errorMsg}`);
        return { success: false };
      }

      // Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: result.clientSecret,
        merchantDisplayName: 'Royal Voyage',
        defaultBillingDetails: {
          name: `${params.firstName ?? ''} ${params.lastName ?? ''}`.trim(),
          email: params.email || undefined,
        },
        style: 'automatic',
      });

      if (initError) {
        Alert.alert('خطأ', `فشل تهيئة نافذة الدفع: ${initError.message}`);
        return { success: false };
      }

      // Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          // User cancelled - not an error
          return { success: false };
        }
        Alert.alert('فشل الدفع', presentError.message);
        return { success: false };
      }

      // Payment succeeded!
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return { success: true, paymentIntentId: result.paymentIntentId };
    } catch (err: any) {
      console.error('[Stripe] Payment error:', err);
      Alert.alert('خطأ في الدفع', err?.message || 'حدث خطأ أثناء معالجة الدفع');
      return { success: false };
    } finally {
      setStripeLoading(false);
    }
  };

  const handlePay = async () => {
    // التحقق من اكتمال بيانات الرحلة
    if (isFlight) {
      const missingFields: string[] = [];
      if (!params.originCode && !params.origin) missingFields.push("مطار المغادرة");
      if (!params.destinationCode && !params.destination) missingFields.push("مطار الوصول");
      if (!params.airline) missingFields.push("شركة الطيران");
      if (!params.price || parseFloat(params.price) === 0) missingFields.push("السعر");
      if (missingFields.length > 0) {
        Alert.alert(
          "بيانات ناقصة",
          `يرجى العودة واختيار الرحلة مجدداً. البيانات الناقصة: ${missingFields.join("، ")}`,
          [{ text: "حسناً" }]
        );
        return;
      }
    }

    // التحقق من اكتمال بيانات الفندق
    if (!isFlight) {
      if (!params.hotelName) {
        Alert.alert(
          "بيانات ناقصة",
          "يرجى العودة واختيار الفندق مجدداً.",
          [{ text: "حسناً" }]
        );
        return;
      }
    }

    // التحقق من اختيار وسيلة دفع
    if (!paymentMethod) {
      Alert.alert("تنبيه", "يرجى اختيار وسيلة الدفع أولاً قبل إتمام الحجز");
      return;
    }

    // التحقق من رقم مرجع التحويل إن كان مطلوباً
    if (
      (paymentMethod === "bank_transfer" ||
        paymentMethod === "bankily" ||
        paymentMethod === "masrvi" ||
        paymentMethod === "sedad" ||
        paymentMethod === "multicaixa") &&
      transferRef.trim().length < 4
    ) {
      Alert.alert("تنبيه", "الرجاء إدخال رقم مرجع العملية أو رقم الإيصال لإتمام الحجز");
      return;
    }

    // ── Stripe: Process card payment first before booking ──
    let stripePaymentIntentId = "";
    if (paymentMethod === "stripe") {
      setIsProcessing(true);
      const stripeResult = await handleStripePayment();
      if (!stripeResult.success) {
        setIsProcessing(false);
        return; // User cancelled or payment failed
      }
      stripePaymentIntentId = stripeResult.paymentIntentId ?? "";
      // Payment succeeded, continue with booking
    }

    setIsProcessing(true);

    // ── Try to get real PNR from Duffel for flights ──
    let pnr = "";
    let royalOrderId = "";
    let ticketNumber = "";
    let duffelPaymentDeadline = "";
    
    const isCashPayment = paymentMethod === "cash";
    const isHold24h = paymentMethod === "hold_24h";
    const needsHoldOrder = isCashPayment || isHold24h;
    
    if (isFlight && params.id) {
      try {
        // Parse child details from JSON if available
        const childDetails: Array<{ firstName: string; lastName: string; dateOfBirth: string }> = [];
        if (params.childDetailsJson) {
          try {
            const parsed = JSON.parse(params.childDetailsJson);
            if (Array.isArray(parsed)) childDetails.push(...parsed);
          } catch (e) {
            console.warn("[Payment] Failed to parse childDetailsJson:", e);
          }
        }

        // Parse infant details from JSON if available
        const infantDetails: Array<{ firstName: string; lastName: string; dateOfBirth: string }> = [];
        if (params.infantDetailsJson) {
          try {
            const parsed = JSON.parse(params.infantDetailsJson);
            if (Array.isArray(parsed)) infantDetails.push(...parsed);
          } catch (e) {
            console.warn("[Payment] Failed to parse infantDetailsJson:", e);
          }
        }

        // Parse rawOffer if available (to avoid cache expiry issues)
        let parsedRawOffer: any = undefined;
        if (params.rawOffer) {
          try {
            parsedRawOffer = JSON.parse(params.rawOffer);
          } catch (e) {
            console.warn("[Payment] Failed to parse rawOffer:", e);
          }
        }

        const bookingParams = {
          offerId: params.id,
          rawOffer: parsedRawOffer,
          firstName: params.firstName ?? "GUEST",
          lastName: params.lastName ?? "PASSENGER",
          dateOfBirth: params.dateOfBirth ?? "1990-01-01",
          gender: "MALE" as const,
          email: params.email ?? "guest@royalvoyage.mr",
          phone: params.phone ?? "33700000",
          countryCallingCode: "222",
          passengers: adultCount,
          children: childCount,
          childDetails: childDetails.length > 0 ? childDetails : undefined,
          infantDetails: infantDetails.length > 0 ? infantDetails : undefined,
        };

        if (needsHoldOrder) {
          // ── Cash / Hold 24h: Create HOLD order (reserve without payment) ──
          console.log(`[Payment] ${isHold24h ? '⏰ Hold 24h' : '💵 Cash'} — Creating HOLD order for offer:`, params.id);
          let holdSucceeded = false;
          try {
            const holdResult = await holdFlightOrder.mutateAsync(bookingParams);
            if (holdResult.success && holdResult.pnr) {
              pnr = holdResult.pnr;
              royalOrderId = holdResult.orderId ?? "";
              duffelPaymentDeadline = holdResult.paymentRequiredBy ?? "";
              holdSucceeded = true;
              console.log(`[Payment] ✅ Hold order created! PNR: ${pnr}, Pay by: ${duffelPaymentDeadline}`);
            } else {
              const holdError = holdResult.error || '';
              console.warn(`[Payment] Hold failed: ${holdError}. Trying instant confirmed booking...`);
              // Check if hold is not allowed in live mode
              if (holdError.includes('not allowed to create hold orders')) {
                console.log('[Payment] Hold orders not supported on this account, falling back to instant booking');
              }
            }
          } catch (holdErr: any) {
            console.warn("[Payment] Hold API error, trying instant confirmed booking:", holdErr?.message);
          }

          // If hold failed, create a confirmed instant booking instead (PNR will be real)
          if (!holdSucceeded) {
            try {
              console.log("[Payment] Creating instant confirmed booking as fallback...");
              const result = await bookFlightWithPNR.mutateAsync(bookingParams);
              if (result.success && result.pnr) {
                pnr = result.pnr;
                royalOrderId = result.orderId ?? "";
                // Instant booking = confirmed, no payment deadline needed
                duffelPaymentDeadline = "";
                const docs = (result as any).documents || [];
                if (docs.length > 0 && docs[0].unique_identifier) {
                  ticketNumber = docs[0].unique_identifier;
                }
                console.log(`[Payment] ✅ Instant confirmed booking PNR: ${pnr}, Ticket: ${ticketNumber || 'pending'}`);
              }
            } catch (instantErr: any) {
              console.error("[Payment] Instant booking also failed:", instantErr?.message);
              const errMsg = instantErr?.message || '';
              if (errMsg.includes('insufficient balance')) {
                Alert.alert(
                  'تنبيه',
                  'لا يمكن تأكيد الحجز حالياً. سيتم حفظ الحجز وتأكيده لاحقاً من قبل الإدارة.',
                  [{ text: 'حسناً' }]
                );
              }
            }
          }
        } else {
          // ── Non-cash payment: Instant booking with PNR + ticket ──
          console.log("[Payment] Attempting Duffel instant booking for offer:", params.id);
          const result = await bookFlightWithPNR.mutateAsync(bookingParams);
          if (result.success && result.pnr) {
            pnr = result.pnr;
            royalOrderId = result.orderId ?? "";
            const docs = (result as any).documents || [];
            if (docs.length > 0 && docs[0].unique_identifier) {
              ticketNumber = docs[0].unique_identifier;
              console.log(`[Payment] 🎫 Got Duffel Ticket Number: ${ticketNumber}`);
            }
            console.log(`[Payment] ✅ Got real Duffel PNR: ${pnr}`);
          } else {
            const bookError = result.error || '';
            console.warn(`[Payment] Duffel booking failed: ${bookError}. Using fallback PNR.`);
            if (bookError === 'OFFER_EXPIRED' || bookError.includes('expired') || bookError.includes('not found')) {
              Alert.alert(
                'انتهت صلاحية العرض',
                'انتهت صلاحية هذا العرض (30 دقيقة). يرجى العودة للبحث واختيار رحلة جديدة.',
                [{ text: 'العودة للبحث', onPress: () => router.push('/(tabs)' as any) }]
              );
              setIsProcessing(false);
              return;
            } else if (bookError.includes('insufficient balance')) {
              Alert.alert(
                'تنبيه',
                'لا يمكن تأكيد الحجز حالياً. سيتم حفظ الحجز وتأكيده لاحقاً من قبل الإدارة.',
                [{ text: 'حسناً' }]
              );
            }
          }
        }
      } catch (err: any) {
        console.warn("[Payment] Duffel API error, using fallback PNR:", err?.message);
      }
    }

    // If Duffel returned a real PNR, mark it as confirmed airline reference
    // No more fake/fallback PNR generation — only real airline references
    if (!pnr && isFlight) {
      // No PNR from Duffel — booking will show "في انتظار تأكيد شركة الطيران"
      console.log("[Payment] No PNR from Duffel — booking awaits airline confirmation");
      pnr = "PENDING";
    } else if (!pnr) {
      // Hotel bookings get a reference-style ID
      pnr = "HT-" + Date.now().toString().slice(-8);
    }

    const ref = "RV-" + (isFlight ? "FL" : "HT") + "-" + Date.now().toString().slice(-6);
    // Build flight data from params (real Duffel data) with fallback to local FLIGHTS
    const flightData = isFlight ? {
      id: params.id ?? flight?.id ?? "unknown",
      airline: params.airline ?? flight?.airline ?? "",
      flightNumber: params.flightNumber ?? flight?.flightNumber ?? "",
      origin: params.origin ?? flight?.origin ?? "",
      originCode: params.originCode ?? flight?.originCode ?? "",
      destination: params.destination ?? flight?.destination ?? "",
      destinationCode: params.destinationCode ?? flight?.destinationCode ?? "",
      departureTime: params.departureTime ?? flight?.departureTime ?? "",
      arrivalTime: params.arrivalTime ?? flight?.arrivalTime ?? "",
      duration: params.duration ?? flight?.duration ?? "",
      price: (parseFloat(params.price ?? "0") || 0) || (flight?.price ?? 0),
      currency: params.currency ?? flight?.currency ?? "MRU",
      class: (params.cabinClass ?? flight?.class ?? "Economy") as "Economy" | "Business" | "First",
      stops: flight?.stops ?? 0,
      airlineLogo: flight?.airlineLogo ?? "",
      seatsLeft: flight?.seatsLeft ?? 9,
    } : null;

    // Build hotel data from params (real HBX data) with fallback to local HOTELS
    const hotelData = !isFlight ? {
      id: params.id ?? hotel?.id ?? "unknown",
      name: params.hotelName ?? hotel?.name ?? "",
      city: params.hotelCity ?? hotel?.city ?? "",
      country: params.hotelCountry ?? hotel?.country ?? "Mauritania",
      image: hotel?.image ?? "",
      rating: hotel?.rating ?? 4,
      reviewCount: hotel?.reviewCount ?? 0,
      pricePerNight: parseFloat(params.roomPrice ?? "0") || (hotel?.pricePerNight ?? 0),
      currency: params.currency ?? hotel?.currency ?? "MRU",
      stars: parseInt(params.hotelStars ?? "0") || (hotel?.stars ?? 3),
      amenities: hotel?.amenities ?? [],
      description: hotel?.description ?? "",
      address: hotel?.address ?? "",
    } : null;

    // For cash/hold_24h payments, use Duffel hold deadline or fallback to 24h
    // If hold failed and instant booking succeeded (duffelPaymentDeadline is empty), no deadline needed
    const paymentDeadline = (needsHoldOrder && duffelPaymentDeadline)
      ? duffelPaymentDeadline
      : (needsHoldOrder && !pnr) 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : undefined;

    // Determine booking status:
    // - If we got a real PNR and ticket (instant booking succeeded), it's confirmed
    // - If we got a hold PNR (no ticket yet), it's pending payment
    // - If no PNR at all, it's pending
    const isConfirmedBooking = pnr && pnr !== "PENDING" && (ticketNumber || !needsHoldOrder);
    const isHoldWithPNR = pnr && pnr !== "PENDING" && needsHoldOrder && !ticketNumber;

    const booking: Booking = {
      id: "b" + Date.now(),
      type: isFlight ? "flight" : "hotel",
      status: (isConfirmedBooking || paymentMethod === "stripe") ? "confirmed" : "pending",
      reference: (pnr && pnr !== "PENDING") ? pnr : ref,
      pnr,
      date: new Date().toISOString().split("T")[0],
      ...(paymentDeadline ? { paymentDeadline } : {}),
      passengerName: `${params.firstName ?? ""} ${params.lastName ?? ""}`.trim(),
      passengerEmail: params.email ?? "",
      customerPushToken: expoPushToken ?? undefined,
      ...(isFlight && flightData ? { flight: flightData, passengers: adultCount } : {}),
      ...(hotelData
        ? {
            hotel: hotelData,
            checkIn: params.checkIn ?? "2025-01-01",
            checkOut: params.checkOut ?? "2025-01-05",
            guests: adultCount,
            rooms: 1,
          }
        : {}),
      totalPrice: total,
      currency: "MRU",
      paymentMethod,
      ...(transferRef.trim() ? { transferRef: transferRef.trim() } : {}),
      ...(receiptImage ? { receiptImage, receiptImageAt: new Date().toISOString() } : {}),
      ...(royalOrderId ? { royalOrderId } : {}),
      ...(ticketNumber ? { ticketNumber, ticketNumberUpdatedAt: new Date().toISOString() } : {}),
      // Store real PNR directly if Duffel returned one (not PENDING)
      ...(pnr && pnr !== "PENDING" && isFlight ? { realPnr: pnr, realPnrUpdatedAt: new Date().toISOString() } : {}),
      // Business account commission tracking
      ...(params.businessAccountId ? { businessAccountId: params.businessAccountId, businessCommission: businessCommissionRate, commissionAmount } : {}),
      ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
    };

    await addBooking(booking);

    // Register booking contact for webhook email notifications
    if (royalOrderId && isFlight) {
      const routeSummary = `${params.originCode ?? ''} → ${params.destinationCode ?? ''}`;
      registerBookingContact.mutateAsync({
        duffelOrderId: royalOrderId,
        bookingRef: ref,
        passengerName: `${params.firstName ?? ''} ${params.lastName ?? ''}`.trim(),
        passengerEmail: params.email ?? undefined,
        customerPushToken: expoPushToken ?? undefined,
        pnr: pnr !== 'PENDING' ? pnr : undefined,
        routeSummary,
        totalPrice: total.toString(),
        currency: 'MRU',
      }).catch(e => console.warn('[Payment] Failed to register booking contact:', e));
    }

    // إرسال إشعار Push للمدير عند إنشاء حجز جديد
    {
      const customerName = `${params.firstName ?? ""} ${params.lastName ?? ""}`.trim() || "زبون";
      const bookingType = isFlight ? "رحلة" : "فندق";
      const dest = isFlight
        ? `${params.originCode ?? ""} → ${params.destinationCode ?? ""}`
        : params.hotelName ?? "";
      const notifTitle = `حجز جديد - ${bookingType}`;
      const notifBody = `${customerName} • ${dest} • ${fmt(total)} • ${ref}`;

      // إرسال إشعار للخادم عبر تطبيق الإدارة
      sendToAdmin.mutateAsync({
        title: notifTitle,
        body: notifBody,
        data: { bookingRef: ref, type: "new_booking" },
        sound: "new_booking.wav",
        channelId: "new_booking",
      }).catch((err) => console.error("[Payment] Server admin push failed:", err));
    }

    // إشعار خاص بدفعة Multicaixa Express
    if (paymentMethod === "multicaixa") {
      const mcxFormatted = formatCurrency(total, "AOA");
      const mcxTitle = "دفعة Multicaixa Express جديدة";
      const mcxCustomer = `${params.firstName ?? ""} ${params.lastName ?? ""}`.trim() || "زبون";
      const mcxBody = `${mcxCustomer} • ${mcxFormatted} • Ref: ${transferRef.trim()} • ${ref}`;
      sendToAdmin.mutateAsync({
        title: mcxTitle,
        body: mcxBody,
        data: { bookingRef: ref, type: "multicaixa_payment" },
        sound: "new_booking.wav",
        channelId: "new_booking",
      }).catch((err) => console.error("[Payment] Server Multicaixa push failed:", err));
    }

    // Schedule payment reminder (1h before deadline) for cash and hold_24h
    if (needsHoldOrder && paymentDeadline) {
      scheduleCashPaymentReminder(ref, paymentDeadline).catch(() => {});
      // For hold_24h, schedule additional expiry reminders (6h, 2h, at expiry)
      if (isHold24h) {
        scheduleHoldExpiryReminders(ref, paymentDeadline).catch(() => {});
        const customerName = `${params.firstName ?? ""} ${params.lastName ?? ""}`.trim() || "عميل";
        scheduleAdminHoldExpiryNotification(ref, customerName, paymentDeadline).catch(() => {});
      }
    }

    // إرسال التذكرة مباشرةً بعد تأكيد الدفع
    const passengerEmail = params.email ?? "";
    const passengerName = `${params.firstName ?? ""} ${params.lastName ?? ""}`.trim();
    const totalMRU = fmt(total);

    if (passengerEmail) {
      setEmailStatus("sending");
      try {
        if (isFlight) {
          await sendFlightTicket.mutateAsync({
            passengerName,
            passengerEmail,
            bookingRef: ref,
            pnr,
            ticketNumber: ticketNumber || undefined,
            origin: params.originCode ?? flight?.originCode ?? "",
            originCity: params.origin ?? flight?.origin ?? "",
            destination: params.destinationCode ?? flight?.destinationCode ?? "",
            destinationCity: params.destination ?? flight?.destination ?? "",
            departureDate: params.returnDate
              ? new Date().toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            departureTime: params.departureTime ?? flight?.departureTime ?? "",
            arrivalTime: params.arrivalTime ?? flight?.arrivalTime ?? "",
            airline: params.airline ?? flight?.airline ?? "",
            flightNumber: params.flightNumber ?? flight?.flightNumber ?? "",
            cabinClass: params.cabinClass ?? "Economy",
            passengers: adultCount,
            children: childCount,
            infants: infantCount,
            totalPrice: totalMRU,
            currency: "MRU",
            tripType: params.tripType === "roundtrip" ? "round-trip" : "one-way",
            returnDate: params.returnDate ?? undefined,
            // Brand ticket with partner info if booking is from a business account
            businessAccountId: params.businessAccountId ? parseInt(params.businessAccountId) : undefined,
          });
        } else {
          const checkInDate = params.checkIn ?? "";
          const checkOutDate = params.checkOut ?? "";
          let nights = 1;
          if (checkInDate && checkOutDate) {
            const d1 = new Date(checkInDate);
            const d2 = new Date(checkOutDate);
            nights = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86400000));
          }
          await sendHotelConfirmation.mutateAsync({
            guestName: passengerName,
            guestEmail: passengerEmail,
            bookingRef: ref,
            pnr,
            hotelName: params.hotelName ?? hotel?.name ?? "",
            hotelCity: params.hotelCity ?? hotel?.city ?? "",
            hotelCountry: params.hotelCountry ?? hotel?.country ?? "Mauritania",
            stars: (parseInt(params.hotelStars ?? "0") || 0) || (hotel?.stars ?? 3),
            checkIn: checkInDate,
            checkOut: checkOutDate,
            nights,
            roomType: params.roomType ?? "Standard Room",
            guests: adultCount,
            children: childCount,
            totalPrice: totalMRU,
            currency: "MRU",
          });
        }
        setEmailStatus("sent");
      } catch (err) {
        console.error("[Email] فشل إرسال التذكرة:", err);
        setEmailStatus("failed");
      }
    }

    setIsProcessing(false);

    router.replace({
      pathname: "/booking/confirmation" as any,
      params: {
        reference: (pnr && pnr !== "PENDING") ? pnr : ref,
        pnr,
        ticketNumber: ticketNumber || "",
        total: total.toString(),
        type: params.type,
        currency: "MRU",
        paymentMethod,
        emailSent: passengerEmail ? (emailStatus === "failed" ? "false" : "true") : "false",
        passengerName,
        dateOfBirth: params.dateOfBirth,
        passportNumber: params.passport,
        nationality: params.nationality,
        email: passengerEmail,
        phone: params.phone,
        airline: params.airline ?? flight?.airline ?? "",
        flightNumber: params.flightNumber ?? flight?.flightNumber ?? "",
        origin: params.origin ?? flight?.origin ?? "",
        destination: params.destination ?? flight?.destination ?? "",
        originCode: params.originCode ?? flight?.originCode ?? "",
        destinationCode: params.destinationCode ?? flight?.destinationCode ?? "",
        departureTime: params.departureTime ?? flight?.departureTime ?? "",
        arrivalTime: params.arrivalTime ?? flight?.arrivalTime ?? "",
        duration: params.duration ?? flight?.duration ?? "",
        cabinClass: params.cabinClass ?? "Economy",
        passengers: params.passengers ?? "1",
        children: params.children ?? "0",
        infants: params.infants ?? "0",
        tripType: params.tripType ?? "oneway",
        returnDate: params.returnDate,
        hotelName: params.hotelName ?? hotel?.name ?? "",
        hotelCity: params.hotelCity ?? hotel?.city ?? "",
        hotelCountry: params.hotelCountry ?? hotel?.country ?? "Mauritania",
        checkIn: params.checkIn ?? "",
        checkOut: params.checkOut ?? "",
        guests: params.guests ?? "1",
        roomType: params.roomType ?? "",
      },
    });
  };

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod)!;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>الدفع</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* مؤقت عد تنازلي */}
      <View style={[
        styles.timerBar,
        { backgroundColor: timeLeft <= 180 ? (timeLeft <= 60 ? "#FEE2E2" : "#FEF3C7") : "#E0F2FE" }
      ]}>
        <Text style={[
          styles.timerIcon,
          { color: timeLeft <= 180 ? (timeLeft <= 60 ? "#DC2626" : "#D97706") : "#0284C7" }
        ]}>
          {timeLeft <= 60 ? "\u26A0\uFE0F" : "\u23F0"}
        </Text>
        <Text style={[
          styles.timerText,
          { color: timeLeft <= 180 ? (timeLeft <= 60 ? "#DC2626" : "#D97706") : "#0284C7" }
        ]}>
          {timeLeft <= 180
            ? `\u0623\u0643\u0645\u0644 \u0627\u0644\u062F\u0641\u0639 \u062E\u0644\u0627\u0644 ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`
            : `\u062D\u062C\u0632 \u0645\u0624\u0642\u062A \u2022 ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")} \u0645\u062A\u0628\u0642\u064A\u0629`
          }
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>

        {/* ملخص الطلب */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>ملخص الطلب</Text>

          <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>
              {isFlight
                ? `رحلة: ${params.originCode ?? flight?.originCode} → ${params.destinationCode ?? flight?.destinationCode}`
                : `فندق: ${params.hotelName ?? hotel?.name}`}
            </Text>
          </View>

          <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>بالغ × {adultCount}</Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {fmt(adultUnitMRU * adultCount)}
            </Text>
          </View>

          {childCount > 0 && (
            <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>طفل × {childCount}</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>
                  خصم 25% • {fmt(childUnitMRU)} / شخص
                </Text>
              </View>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                {fmt(childUnitMRU * childCount)}
              </Text>
            </View>
          )}

          {/* الضرائب مشمولة في السعر - لا تُعرض منفصلة */}

          {commissionAmount > 0 && (
            <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>عمولة تجارية ({businessCommissionRate}%)</Text>
              </View>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>
                +{fmt(commissionAmount)}
              </Text>
            </View>
          )}

          {paymentMethod === "hold_24h" && hold24hFee > 0 && (
            <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>رسوم الاحتفاظ بالسعر 24 ساعة</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>تُخصم من المبلغ عند إتمام الدفع</Text>
              </View>
              <Text style={[styles.summaryValue, { color: colors.warning }]}>
                +{fmt(hold24hFee)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>الإجمالي</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {fmt(paymentMethod === "hold_24h" && hold24hFee > 0 ? total + hold24hFee : total)}
            </Text>
          </View>
        </View>

        {/* اختيار طريقة الدفع */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>طريقة الدفع</Text>
          <View style={{ gap: 10 }}>
            {PAYMENT_METHODS.filter((m) => {
              // Hold 24h only available for flights
              if (m.id === "hold_24h" && !isFlight) return false;
              return true;
            }).map((method) => {
              const isSelected = paymentMethod === method.id;
              return (
                <Pressable
                  key={method.id}
                  style={[
                    styles.methodOption,
                    {
                      borderColor: isSelected ? method.color : colors.border,
                      backgroundColor: isSelected ? method.color + "10" : colors.background,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  <View style={[styles.methodIconBox, { backgroundColor: method.color + "18" }]}>
                    {method.logo ? (
                      <Image source={method.logo} style={{ width: 32, height: 32, resizeMode: "contain" }} />
                    ) : (
                      <IconSymbol name={method.iconName as any} size={22} color={method.color} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.methodLabel, { color: colors.foreground }]}>
                      {method.label}
                    </Text>
                    <Text style={[styles.methodSub, { color: colors.muted }]}>
                      {method.sublabel}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: method.color }]}>
                      <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* تعليمات الدفع النقدي */}
        {paymentMethod === "cash" && (
          <View style={[styles.card, { backgroundColor: "#22C55E10", borderColor: "#22C55E30" }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>عنوان المكتب</Text>
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Royal Voyage — نواكشوط، موريتانيا
            </Text>
            <Text style={[styles.infoSub, { color: colors.muted }]}>
              شارع جمال عبد الناصر، بجانب البنك المركزي
            </Text>
            <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.infoBoxText, { color: colors.muted }]}>
                أوقات العمل: السبت – الخميس، 8:00 ص – 6:00 م
              </Text>
              <Text style={[styles.infoBoxText, { color: colors.muted, marginTop: 4 }]}>
                للاستفسار: +222 XX XX XX XX
              </Text>
            </View>
            <View style={[styles.warningBox, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
              <Text style={[styles.warningText, { color: colors.warning }]}>
                يُحجز المقعد لمدة 24 ساعة فقط. يرجى الدفع في أقرب وقت لتأكيد الحجز.
              </Text>
            </View>
          </View>
        )}

        {/* تعليمات حجز مؤكد 24 ساعة */}
        {paymentMethod === "hold_24h" && (
          <View style={[styles.card, { backgroundColor: "#0EA5E910", borderColor: "#0EA5E930" }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>حجز مؤكد من شركة الطيران</Text>
            <View style={[styles.stepsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {[
                "سيتم حجز مقعدك مباشرةً لدى شركة الطيران",
                "ستحصل على رقم تعريف حقيقي (PNR) من شركة الطيران",
                "يجب إكمال الدفع خلال 24 ساعة لإصدار التذكرة",
                "بعد الدفع، ستصلك التذكرة الإلكترونية عبر البريد",
              ].map((step, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: "#0EA5E9", fontWeight: "700", marginLeft: 8, width: 22 }}>{i + 1}.</Text>
                  <Text style={{ fontSize: 13, color: colors.foreground, flex: 1, lineHeight: 20 }}>{step}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.warningBox, { backgroundColor: "#0EA5E915", borderColor: "#0EA5E940" }]}>
              <Text style={[styles.warningText, { color: "#0EA5E9" }]}>
                هذا حجز مؤكد لدى شركة الطيران. إذا لم يتم الدفع خلال 24 ساعة، سيتم إلغاء الحجز تلقائياً.
              </Text>
            </View>
          </View>
        )}

        {/* تعليمات التحويل البنكي */}
        {paymentMethod === "bank_transfer" && (
          <View style={[styles.card, { backgroundColor: "#3B82F610", borderColor: "#3B82F630" }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>بيانات التحويل البنكي</Text>
            {[
              { label: "اسم البنك", value: BANK_INFO.bankName },
              { label: "اسم الحساب", value: BANK_INFO.accountName },
              { label: "رقم الحساب (IBAN)", value: BANK_INFO.accountNumber },
              { label: "رقم RIB", value: BANK_INFO.rib },
              { label: "المبلغ", value: fmt(total) },
            ].map((item) => (
              <View key={item.label} style={[styles.bankRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.bankLabel, { color: colors.muted }]}>{item.label}</Text>
                <Text style={[styles.bankValue, { color: colors.foreground }]}>{item.value}</Text>
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>رقم مرجع التحويل *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="أدخل رقم مرجع العملية البنكية"
                placeholderTextColor={colors.muted}
                value={transferRef}
                onChangeText={setTransferRef}
                returnKeyType="done"
              />
            </View>
          </View>
        )}

        {/* تعليمات بنكيلي */}
        {paymentMethod === "bankily" && (
          <View style={[styles.card, { backgroundColor: "#F59E0B10", borderColor: "#F59E0B30" }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>الدفع عبر بنكيلي</Text>
            <View style={[styles.stepsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {[
                "افتح تطبيق Bankily على هاتفك",
                `أرسل المبلغ ${fmt(total)} إلى الرقم: ${WALLET_NUMBERS.bankily}`,
                "في خانة الملاحظة اكتب رقم حجزك",
                "أدخل رقم الإيصال أدناه لتأكيد الدفع",
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: "#F59E0B" }]}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>رقم إيصال بنكيلي *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="أدخل رقم الإيصال من التطبيق"
                placeholderTextColor={colors.muted}
                value={transferRef}
                onChangeText={setTransferRef}
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>
          </View>
        )}

        {/* تعليمات مصرفي */}
        {paymentMethod === "masrvi" && (
          <View style={[styles.card, { backgroundColor: "#8B5CF610", borderColor: "#8B5CF630" }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>الدفع عبر مصرفي</Text>
            <View style={[styles.stepsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {[
                "افتح تطبيق مصرفي على هاتفك",
                `أرسل المبلغ ${fmt(total)} إلى الرقم: ${WALLET_NUMBERS.masrvi}`,
                "في خانة الملاحظة اكتب رقم حجزك",
                "أدخل رقم الإيصال أدناه لتأكيد الدفع",
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: "#8B5CF6" }]}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>رقم إيصال مصرفي *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="أدخل رقم الإيصال من التطبيق"
                placeholderTextColor={colors.muted}
                value={transferRef}
                onChangeText={setTransferRef}
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>
          </View>
        )}

        {/* تعليمات الدفع بالبطاقة عبر Stripe */}
        {paymentMethod === "stripe" && (() => {
          const stripeCurrency = currency === "USD" ? "USD" : "EUR";
          const stripeFormatted = formatCurrency(total, stripeCurrency);
          return (
            <View style={[styles.card, { backgroundColor: "#635BFF" + "10", borderColor: "#635BFF" + "30" }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>الدفع بالبطاقة البنكية</Text>

              {/* بطاقة السعر بالعملة الأجنبية */}
              <View style={[styles.infoBox, { backgroundColor: "#635BFF" + "15", borderColor: "#635BFF" + "40", marginBottom: 14 }]}>
                <Text style={{ color: "#635BFF", fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                  المبلغ المطلوب
                </Text>
                <Text style={{ color: "#635BFF", fontSize: 26, fontWeight: "800", textAlign: "center", marginTop: 4 }}>
                  {stripeFormatted}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center", marginTop: 2 }}>
                  (يعادل {fmt(total)} بسعر صرف ثابت)
                </Text>
              </View>

              {/* معلومات الأمان */}
              <View style={[styles.stepsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {[
                  "اضغط على زر \"الدفع بالبطاقة\" أدناه",
                  "سيتم فتح نافذة دفع آمنة من Stripe",
                  "أدخل بيانات بطاقتك (Visa أو Mastercard)",
                  "سيتم تأكيد الحجز تلقائياً بعد نجاح الدفع",
                ].map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={[styles.stepNum, { backgroundColor: "#635BFF" }]}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* شعارات البطاقات المدعومة */}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 8, marginBottom: 12 }}>
                <View style={{ backgroundColor: "#1A1F71", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>VISA</Text>
                </View>
                <View style={{ backgroundColor: "#EB001B", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, flexDirection: "row", gap: 2 }}>
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: "#EB001B", borderWidth: 1, borderColor: "#FFF" }} />
                  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: "#F79E1B", borderWidth: 1, borderColor: "#FFF", marginLeft: -6 }} />
                </View>
              </View>

              {/* ملاحظة الأمان */}
              <View style={[styles.infoBox, { backgroundColor: colors.success + "10", borderColor: colors.success + "30" }]}>
                <Text style={{ color: colors.success, fontSize: 12, textAlign: "center", lineHeight: 18 }}>
                  جميع المعاملات مشفرة ومحمية بواسطة Stripe. لا يتم تخزين بيانات بطاقتك على خوادمنا.
                </Text>
              </View>

              {/* تحذير سعر الصرف */}
              <View style={[styles.warningBox, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40", marginTop: 8 }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  سيتم خصم المبلغ بالعملة الأجنبية ({stripeCurrency}). قد يختلف السعر الفعلي بحسب سعر صرف بنكك.
                </Text>
              </View>
            </View>
          );
        })()}

        {/* تعليمات سداد */}
        {paymentMethod === "sedad" && (
          <View style={[styles.card, { backgroundColor: "#EF444410", borderColor: "#EF444430" }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>الدفع عبر سداد</Text>
            <View style={[styles.stepsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {[
                "توجه إلى منصة Sedad الإلكترونية أو التطبيق",
                `ابحث عن: ${WALLET_NUMBERS.sedad}`,
                `أدخل المبلغ: ${fmt(total)}`,
                "أدخل رقم مرجع العملية أدناه بعد إتمام الدفع",
              ].map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: "#EF4444" }]}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
                </View>
              ))}
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>رقم مرجع سداد *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="أدخل رقم مرجع العملية"
                placeholderTextColor={colors.muted}
                value={transferRef}
                onChangeText={setTransferRef}
                returnKeyType="done"
              />
            </View>
          </View>
        )}

        {/* تعليمات Multicaixa Express */}
        {paymentMethod === "multicaixa" && (() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const mcxAmount = fromMRU(total, "AOA");
          const mcxFormatted = formatCurrency(total, "AOA");
          return (
            <View style={[styles.card, { backgroundColor: "#E3193710", borderColor: "#E3193730" }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>الدفع عبر Multicaixa Express</Text>

              {/* بطاقة السعر بالكوانزا */}
              <View style={[styles.infoBox, { backgroundColor: "#E3193715", borderColor: "#E3193740", marginBottom: 14 }]}>
                <Text style={{ color: "#E31937", fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                  المبلغ المطلوب بالكوانزا الأنغولية
                </Text>
                <Text style={{ color: "#E31937", fontSize: 26, fontWeight: "800", textAlign: "center", marginTop: 4 }}>
                  {mcxFormatted}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center", marginTop: 2 }}>
                  (يعادل {fmt(total)} بسعر صرف ثابت)
                </Text>
              </View>

              {/* بيانات المستفيد */}
              <View style={[styles.stepsBox, { backgroundColor: colors.surface, borderColor: colors.border, gap: 8 }]}>
                <View style={styles.bankRow}>
                  <Text style={[styles.bankLabel, { color: colors.muted }]}>اسم المستفيد</Text>
                  <Text style={[styles.bankValue, { color: colors.foreground }]}>ANGOLAMIR COMERCIO E SERVICOS LDA</Text>
                </View>
                <View style={[styles.bankRow, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.bankLabel, { color: colors.muted }]}>رقم الحساب (IBAN)</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[styles.bankValue, { color: "#E31937", fontWeight: "700", fontSize: 14, flex: 1 }]}>{WALLET_NUMBERS.multicaixa}</Text>
                    <Pressable
                      style={({ pressed }) => [{
                        backgroundColor: ibanCopied ? colors.success : "#E31937",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        opacity: pressed ? 0.8 : 1,
                      }]}
                      onPress={async () => {
                        await Clipboard.setStringAsync(WALLET_NUMBERS.multicaixa);
                        if (Platform.OS !== "web") {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                        setIbanCopied(true);
                        setTimeout(() => setIbanCopied(false), 2500);
                      }}
                    >
                      <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "600" }}>
                        {ibanCopied ? "تم النسخ" : "نسخ"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* خطوات الدفع */}
              <View style={[styles.stepsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {[
                  "افتح تطبيق Multicaixa Express على هاتفك",
                  `اختر تحويل وأدخل المبلغ: ${mcxFormatted}`,
                  "أدخل رقم الحساب (IBAN) الموضح أعلاه",
                  "في خانة الملاحظة اكتب: اسمك الكامل + رقم حجزك",
                  "أدخل رقم معرّف العملية (Transaction ID) أدناه",
                ].map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={[styles.stepNum, { backgroundColor: "#E31937" }]}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* زر فتح Multicaixa Express */}
              <Pressable
                style={({ pressed }) => [{
                  backgroundColor: "#E31937",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginTop: 10,
                  marginBottom: 6,
                  gap: 8,
                  opacity: pressed ? 0.85 : 1,
                }]}
                onPress={async () => {
                  // محاولة فتح تطبيق Multicaixa Express مباشرة
                  const packageName = "com.sibsint.mcxwallet";
                  const playStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
                  const appStoreUrl = "https://apps.apple.com/app/multicaixa-express/id1433675921";
                  const websiteUrl = "https://multicaixa.ao";

                  if (Platform.OS === "android") {
                    // Android: intent URI لفتح التطبيق مباشرة أو الانتقال للمتجر
                    const intentUri = `intent://#Intent;package=${packageName};scheme=multicaixaexpress;launchFlags=0x10000000;S.browser_fallback_url=${encodeURIComponent(playStoreUrl)};end`;
                    try {
                      await Linking.openURL(intentUri);
                    } catch {
                      try {
                        await Linking.openURL(playStoreUrl);
                      } catch {
                        await Linking.openURL(websiteUrl);
                      }
                    }
                  } else if (Platform.OS === "ios") {
                    // iOS: محاولة فتح التطبيق أولاً ثم App Store
                    try {
                      const canOpen = await Linking.canOpenURL("multicaixaexpress://");
                      if (canOpen) {
                        await Linking.openURL("multicaixaexpress://");
                      } else {
                        await Linking.openURL(appStoreUrl);
                      }
                    } catch {
                      try {
                        await Linking.openURL(appStoreUrl);
                      } catch {
                        await Linking.openURL(websiteUrl);
                      }
                    }
                  } else {
                    // Web: فتح الموقع الرسمي
                    await Linking.openURL(websiteUrl);
                  }
                }}
              >

                <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700" }}>فتح Multicaixa Express</Text>
              </Pressable>
              <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center", marginBottom: 10 }}>
                سيتم فتح التطبيق مباشرة — أدخل Transaction ID بعد إتمام الدفع
              </Text>

              {/* حقل رقم العملية */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>رقم معرّف العملية (Transaction ID) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="أدخل رقم معرّف العملية من التطبيق"
                  placeholderTextColor={colors.muted}
                  value={transferRef}
                  onChangeText={setTransferRef}
                  returnKeyType="done"
                />
              </View>

              {/* سعر الصرف الحالي */}
              {(() => {
                const pricing = getPricingSettings();
                const aoaRate = pricing.aoaToMRU;
                const lastUpdated = pricing.ratesLastUpdated;
                const dateStr = lastUpdated
                  ? new Date(lastUpdated).toLocaleDateString("ar-SA", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : null;
                return (
                  <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 6 }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>سعر الصرف الحالي</Text>
                      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>1 AOA = {aoaRate} MRU</Text>
                    </View>
                    {dateStr && (
                      <Text style={{ color: colors.muted, fontSize: 10, textAlign: "left", marginTop: 4 }}>
                        آخر تحديث: {dateStr}
                      </Text>
                    )}
                  </View>
                );
              })()}

              {/* تحذير سعر الصرف */}
              <View style={[styles.warningBox, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  قد يختلف السعر الفعلي بحسب يوم التحويل. يتم تحديث سعر الصرف دورياً من إعدادات المدير.
                </Text>
              </View>
            </View>
          );
        })()}

        {/* رفع إيصال الدفع */}
        {paymentMethod !== "cash" && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>إيصال الدفع (اختياري)</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 12, lineHeight: 18 }}>
              يمكنك رفع صورة إيصال الدفع لتسريع عملية التأكيد من طرف الإدارة
            </Text>

            {receiptImage ? (
              <View>
                <Pressable
                  style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => setShowReceiptPreview(true)}
                >
                  <Image
                    source={{ uri: receiptImage }}
                    style={{ width: "100%" as any, height: 200, borderRadius: 12, backgroundColor: colors.border }}
                    resizeMode="cover"
                  />
                  <View style={[styles.receiptOverlay]}>
                    <IconSymbol name="eye.fill" size={16} color="#FFFFFF" />
                    <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}>اضغط للمعاينة</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.removeReceiptBtn, { borderColor: colors.error, opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => setReceiptImage(null)}
                >
                  <IconSymbol name="trash.fill" size={14} color={colors.error} />
                  <Text style={{ color: colors.error, fontSize: 13, fontWeight: "600" }}>حذف الصورة</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  style={({ pressed }) => [styles.uploadBtn, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40", flex: 1, opacity: pressed ? 0.7 : 1 }]}
                  onPress={async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ["images"],
                      allowsEditing: true,
                      quality: 0.7,
                    });
                    if (!result.canceled && result.assets[0]) {
                      setReceiptImage(result.assets[0].uri);
                    }
                  }}
                >
                  <IconSymbol name="photo.fill" size={22} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600", marginTop: 4 }}>من المعرض</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.uploadBtn, { backgroundColor: "#F59E0B12", borderColor: "#F59E0B40", flex: 1, opacity: pressed ? 0.7 : 1 }]}
                  onPress={async () => {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== "granted") {
                      Alert.alert("تنبيه", "يرجى السماح بالوصول إلى الكاميرا لالتقاط صورة الإيصال");
                      return;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                      allowsEditing: true,
                      quality: 0.7,
                    });
                    if (!result.canceled && result.assets[0]) {
                      setReceiptImage(result.assets[0].uri);
                    }
                  }}
                >
                  <IconSymbol name="camera.fill" size={22} color="#F59E0B" />
                  <Text style={{ color: "#F59E0B", fontSize: 13, fontWeight: "600", marginTop: 4 }}>التقاط صورة</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* معاينة الإيصال */}
        <Modal visible={showReceiptPreview} transparent animationType="fade">
          <View style={styles.previewOverlay}>
            <Pressable style={styles.previewCloseBtn} onPress={() => setShowReceiptPreview(false)}>
              <IconSymbol name="xmark" size={24} color="#FFFFFF" />
            </Pressable>
            {receiptImage && (
              <Image
                source={{ uri: receiptImage }}
                style={{ width: "90%" as any, height: "70%" as any, borderRadius: 16 }}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>

        {/* ملاحظة الأمان */}
        <View style={[styles.securityNote, { backgroundColor: colors.success + "10", borderColor: colors.success + "30" }]}>
          <IconSymbol name="shield.fill" size={16} color={colors.success} />
          <Text style={[styles.securityText, { color: colors.success }]}>
            جميع بيانات حجزك محمية ومشفرة بالكامل
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* زر تأكيد الدفع */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.payTotal, { color: colors.primary }]}>
            {fmt(total)}
          </Text>
          <Text style={[styles.payLabel, { color: colors.muted }]}>
            {selectedMethod.label}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.payBtn,
            { backgroundColor: selectedMethod.color, opacity: (pressed || isProcessing) ? 0.85 : (!paymentMethod || ((paymentMethod === "bank_transfer" || paymentMethod === "bankily" || paymentMethod === "masrvi" || paymentMethod === "sedad" || paymentMethod === "multicaixa") && transferRef.trim().length < 4)) ? 0.5 : 1 },
          ]}
          onPress={handlePay}
          disabled={isProcessing || !paymentMethod || ((paymentMethod === "bank_transfer" || paymentMethod === "bankily" || paymentMethod === "masrvi" || paymentMethod === "sedad" || paymentMethod === "multicaixa") && transferRef.trim().length < 4)}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              {selectedMethod.logo ? (
                <Image source={selectedMethod.logo} style={{ width: 22, height: 22, resizeMode: "contain" }} />
              ) : (
                <IconSymbol name={selectedMethod.iconName as any} size={20} color="#FFFFFF" />
              )}
              <Text style={styles.payBtnText}>
                {paymentMethod === "cash" ? "تأكيد الحجز والدفع لاحقاً" : paymentMethod === "stripe" ? "الدفع بالبطاقة البنكية" : "تأكيد الدفع وإتمام الحجز"}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontSize: 14,
    flex: 1,
    paddingRight: 8,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  methodOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  methodIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  methodSub: {
    fontSize: 12,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoSub: {
    fontSize: 13,
    marginBottom: 12,
  },
  infoBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  infoBoxText: {
    fontSize: 13,
  },
  warningBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 20,
  },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  bankLabel: {
    fontSize: 13,
    flex: 1,
  },
  bankValue: {
    fontSize: 13,
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  stepsBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  stepNumText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  stepText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 22,
  },
  inputGroup: {
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  securityText: {
    fontSize: 13,
    flex: 1,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  payTotal: {
    fontSize: 22,
    fontWeight: "700",
  },
  payLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  payBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  uploadBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  receiptOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  removeReceiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewCloseBtn: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  timerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  timerIcon: {
    fontSize: 18,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
