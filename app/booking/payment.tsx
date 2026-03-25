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
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { FLIGHTS, HOTELS, Booking } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatMRU, fromMRU, formatCurrency } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";
import { trpc } from "@/lib/trpc";
import { scheduleCashPaymentReminder } from "@/lib/push-notifications";
import { addAdminNotification } from "@/lib/admin-notifications";

type PaymentMethod = "cash" | "bank_transfer" | "bankily" | "masrvi" | "sedad" | "paypal";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
}[] = [
  {
    id: "cash",
    label: "دفع نقدي في المكتب",
    sublabel: "ادفع عند زيارة مكتبنا في نواكشوط",
    icon: "💵",
    color: "#22C55E",
  },
  {
    id: "bank_transfer",
    label: "تحويل بنكي",
    sublabel: "تحويل مباشر إلى حساب Royal Voyage",
    icon: "🏦",
    color: "#3B82F6",
  },
  {
    id: "bankily",
    label: "بنكيلي",
    sublabel: "الدفع عبر تطبيق Bankily",
    icon: "📱",
    color: "#F59E0B",
  },
  {
    id: "masrvi",
    label: "مصرفي",
    sublabel: "الدفع عبر تطبيق مصرفي",
    icon: "💳",
    color: "#8B5CF6",
  },
  {
    id: "sedad",
    label: "سداد",
    sublabel: "الدفع عبر منصة Sedad",
    icon: "🔐",
    color: "#EF4444",
  },
  {
    id: "paypal",
    label: "PayPal (بالبطاقة)",
    sublabel: "ادفع بالبطاقة البنكية (Visa, Mastercard) أو رصيد PayPal",
    icon: "🌐",
    color: "#003087",
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
};

export default function PaymentScreen() {
  const router = useRouter();
  const colors = useColors();
  const { addBooking, updateBookingReceipt, expoPushToken, adminPushToken } = useApp();
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
  }>();

  const isFlight = params.type === "flight";
  const flight = isFlight ? FLIGHTS.find((f) => f.id === params.id) ?? FLIGHTS[0] : null;
  const hotel = !isFlight ? HOTELS.find((h) => h.id === params.id) ?? HOTELS[0] : null;

  const adultCount = parseInt(params.passengers ?? "1", 10);
  const childCount = parseInt(params.children ?? "0", 10);

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
  const total = totalMRUPassed > 0
    ? totalMRUPassed
    : Math.round(mockTotalUSD * 39.5);

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

  const sendFlightTicket = trpc.email.sendFlightTicket.useMutation();
  const sendHotelConfirmation = trpc.email.sendHotelConfirmation.useMutation();
  const sendAdminPush = trpc.email.sendPushNotification.useMutation();

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

    // التحقق من رقم مرجع التحويل إن كان مطلوباً
    if (
      (paymentMethod === "bank_transfer" ||
        paymentMethod === "bankily" ||
        paymentMethod === "masrvi" ||
        paymentMethod === "sedad") &&
      transferRef.trim().length < 4
    ) {
      Alert.alert("تنبيه", "الرجاء إدخال رقم مرجع العملية أو رقم الإيصال");
      return;
    }

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1000));

    // Generate unique PNR (6 uppercase alphanumeric chars, airline industry standard)
    const PNR_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const pnr = Array.from({ length: 6 }, () =>
      PNR_CHARS[Math.floor(Math.random() * PNR_CHARS.length)]
    ).join("");

    const ref = "RV-" + (isFlight ? "FL" : "HT") + "-" + Date.now().toString().slice(-6);
    // Build flight data from params (real Amadeus data) with fallback to local FLIGHTS
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
      airlineLogo: flight?.airlineLogo ?? "✈️",
      seatsLeft: flight?.seatsLeft ?? 9,
    } : null;

    // Build hotel data from params (real Amadeus data) with fallback to local HOTELS
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

    // For cash payments, set 24h deadline and schedule a reminder notification
    const isCashPayment = paymentMethod === "cash";
    const paymentDeadline = isCashPayment
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const booking: Booking = {
      id: "b" + Date.now(),
      type: isFlight ? "flight" : "hotel",
      status: "confirmed",
      reference: ref,
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
    };

    await addBooking(booking);

    // إرسال إشعار Push للمدير عند إنشاء حجز جديد
    {
      const customerName = `${params.firstName ?? ""} ${params.lastName ?? ""}`.trim() || "زبون";
      const bookingType = isFlight ? "✈️ رحلة" : "🏨 فندق";
      const dest = isFlight
        ? `${params.originCode ?? ""} → ${params.destinationCode ?? ""}`
        : params.hotelName ?? "";
      const notifTitle = `🔔 حجز جديد! ${bookingType}`;
      const notifBody = `${customerName} • ${dest} • ${fmt(total)} • ${ref}`;

      // حفظ الإشعار محلياً في سجل الإشعارات
      addAdminNotification({
        type: "new_booking",
        title: notifTitle,
        body: notifBody,
        bookingRef: ref,
        bookingId: booking.id,
      }).catch(() => {});

      if (adminPushToken) {
        sendAdminPush.mutateAsync({
          expoPushToken: adminPushToken,
          title: notifTitle,
          body: notifBody,
          data: { bookingRef: ref, type: "new_booking" },
          sound: "new_booking.wav",
          channelId: "new_booking",
        }).catch((err) => console.error("[Payment] Admin push failed:", err));
      }
    }

    // Schedule cash payment reminder (1h before 24h deadline)
    if (isCashPayment && paymentDeadline) {
      scheduleCashPaymentReminder(ref, paymentDeadline).catch(() => {});
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
            totalPrice: totalMRU,
            currency: "MRU",
            tripType: params.tripType === "roundtrip" ? "round-trip" : "one-way",
            returnDate: params.returnDate ?? undefined,
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
        reference: ref,
        pnr,
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

          {/* الضرائب مشمولة في سعر Amadeus - لا تُعرض منفصلة */}

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>الإجمالي</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {fmt(total)}
            </Text>
          </View>
        </View>

        {/* اختيار طريقة الدفع */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>طريقة الدفع</Text>
          <View style={{ gap: 10 }}>
            {PAYMENT_METHODS.map((method) => {
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
                    <Text style={{ fontSize: 22 }}>{method.icon}</Text>
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
                      <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>✓</Text>
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
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>📍 عنوان المكتب</Text>
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Royal Voyage — نواكشوط، موريتانيا
            </Text>
            <Text style={[styles.infoSub, { color: colors.muted }]}>
              شارع جمال عبد الناصر، بجانب البنك المركزي
            </Text>
            <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.infoBoxText, { color: colors.muted }]}>
                🕐 أوقات العمل: السبت – الخميس، 8:00 ص – 6:00 م
              </Text>
              <Text style={[styles.infoBoxText, { color: colors.muted, marginTop: 4 }]}>
                📞 للاستفسار: +222 XX XX XX XX
              </Text>
            </View>
            <View style={[styles.warningBox, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
              <Text style={[styles.warningText, { color: colors.warning }]}>
                ⚠️ يُحجز المقعد لمدة 24 ساعة فقط. يرجى الدفع في أقرب وقت لتأكيد الحجز.
              </Text>
            </View>
          </View>
        )}

        {/* تعليمات التحويل البنكي */}
        {paymentMethod === "bank_transfer" && (
          <View style={[styles.card, { backgroundColor: "#3B82F610", borderColor: "#3B82F630" }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>🏦 بيانات التحويل البنكي</Text>
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
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>📱 الدفع عبر بنكيلي</Text>
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
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>💳 الدفع عبر مصرفي</Text>
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

        {/* تعليمات PayPal */}
        {paymentMethod === "paypal" && (() => {
          // عرض السعر بالدولار أولاً ثم اليورو إذا كانت العملة EUR
          const ppCurrency = currency === "EUR" ? "EUR" : "USD";
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const ppAmount = fromMRU(total, ppCurrency);
          const ppFormatted = formatCurrency(total, ppCurrency);
          return (
            <View style={[styles.card, { backgroundColor: "#003087" + "10", borderColor: "#003087" + "30" }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>🌐 الدفع عبر PayPal</Text>

              {/* بطاقة السعر بالعملة الأجنبية */}
              <View style={[styles.infoBox, { backgroundColor: "#003087" + "15", borderColor: "#003087" + "40", marginBottom: 14 }]}>
                <Text style={{ color: "#003087", fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                  المبلغ المطلوب بالعملة الأجنبية
                </Text>
                <Text style={{ color: "#003087", fontSize: 26, fontWeight: "800", textAlign: "center", marginTop: 4 }}>
                  {ppFormatted}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center", marginTop: 2 }}>
                  (يعادل {fmt(total)} بسعر صرف ثابت)
                </Text>
              </View>

              {/* خطوات الدفع */}
              <View style={[styles.stepsBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {[
                  "افتح تطبيق PayPal أو الموقع الرسمي paypal.com",
                  `أرسل المبلغ ${ppFormatted} إلى البريد الإلكتروني:`,
                  "suporte@royalvoyage.online",
                  "في خانة الملاحظة اكتب: اسمك الكامل + رقم حجزك",
                  "أدخل رقم معرّف العملية (Transaction ID) أدناه",
                ].map((step, i) => (
                  <View key={i} style={[styles.stepRow, i === 2 && { paddingRight: 32 }]}>
                    {i !== 2 ? (
                      <View style={[styles.stepNum, { backgroundColor: "#003087" }]}>
                        <Text style={styles.stepNumText}>{i < 2 ? i + 1 : i}</Text>
                      </View>
                    ) : (
                      <View style={{ width: 28 }} />
                    )}
                    <Text style={[
                      styles.stepText,
                      { color: i === 2 ? "#003087" : colors.foreground, fontWeight: i === 2 ? "700" : "400", fontSize: i === 2 ? 15 : 13 }
                    ]}>{step}</Text>
                  </View>
                ))}
              </View>

              {/* زر فتح PayPal مباشرة */}
              <Pressable
                style={({ pressed }) => [{
                  backgroundColor: "#003087",
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
                onPress={() => {
                  const paypalEmail = "suporte@royalvoyage.online";
                  const paypalUrl = `https://www.paypal.com/paypalme/royalvoyage/${ppAmount.toFixed(2)}${ppCurrency}`;
                  const fallbackUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalEmail)}&amount=${ppAmount.toFixed(2)}&currency_code=${ppCurrency}&item_name=${encodeURIComponent("Royal Voyage Booking")}`;
                  Linking.openURL(fallbackUrl).catch(() => {
                    Linking.openURL(paypalUrl).catch(() => {
                      Linking.openURL("https://www.paypal.com");
                    });
                  });
                }}
              >
                <Text style={{ color: "#FFF", fontSize: 18 }}>🌐</Text>
                <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700" }}>فتح PayPal للدفع الآن</Text>
              </Pressable>
              <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center", marginBottom: 10 }}>
                سيتم فتح PayPal بالمبلغ {ppFormatted} — أدخل Transaction ID بعد إتمام الدفع
              </Text>

              {/* حقل رقم العملية */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>رقم معرّف العملية (Transaction ID) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="مثال: 5AB12345CD678901E"
                  placeholderTextColor={colors.muted}
                  value={transferRef}
                  onChangeText={setTransferRef}
                  autoCapitalize="characters"
                  returnKeyType="done"
                />
              </View>

              {/* تحذير سعر الصرف */}
              <View style={[styles.warningBox, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  ⚠️ سعر الصرف المستخدم ثابت (1 USD = 39.5 MRU). قد يختلف السعر الفعلي في PayPal بحسب يوم التحويل.
                </Text>
              </View>
            </View>
          );
        })()}

        {/* تعليمات سداد */}
        {paymentMethod === "sedad" && (
          <View style={[styles.card, { backgroundColor: "#EF444410", borderColor: "#EF444430" }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>🔐 الدفع عبر سداد</Text>
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

        {/* رفع إيصال الدفع */}
        {paymentMethod !== "cash" && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>📸 إيصال الدفع (اختياري)</Text>
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
            { backgroundColor: selectedMethod.color, opacity: pressed || isProcessing ? 0.85 : 1 },
          ]}
          onPress={handlePay}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={{ fontSize: 18 }}>{selectedMethod.icon}</Text>
              <Text style={styles.payBtnText}>
                {paymentMethod === "cash" ? "تأكيد الحجز" : "تأكيد الدفع"}
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
});
