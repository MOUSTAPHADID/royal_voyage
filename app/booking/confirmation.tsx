import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  Share,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { generateFlightTicket, generateHotelVoucher, COMPANY_INFO } from "@/lib/ticket-generator";
import { formatAmadeusPriceMRU, formatMRU, toMRU } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";
import { trpc } from "@/lib/trpc";
import { scheduleBookingReminder24h } from "@/lib/push-notifications";
import { useTranslation } from "@/lib/i18n";

// Notification scheduling is handled by use-booking-notifications hook

export default function ConfirmationScreen() {
  const router = useRouter();
  const colors = useColors();
  const { fmt } = useCurrency();
  const { language } = useTranslation();
  const params = useLocalSearchParams<{
    reference: string;
    total: string;
    type: string;
    emailSent?: string;
    passengerName?: string;
    dateOfBirth?: string;
    passportNumber?: string;
    nationality?: string;
    email?: string;
    phone?: string;
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
    tripType?: string;
    returnDate?: string;
    hotelName?: string;
    hotelCity?: string;
    hotelCountry?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    roomType?: string;
    stars?: string;
    currency?: string;
    pnr?: string;
    ticketNumber?: string;
  }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // إذا أرسل payment.tsx التذكرة بالفعل، نبدأ بحالة "sent"
  const initialEmailStatus = params.emailSent === "true" ? "sent" : "idle";
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "failed">(initialEmailStatus);

  const isFlight = params.type === "flight";
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // السعر المُمرَّر من payment.tsx هو دائماً بالأوقية (MRU)
  // إذا كانت العملة MRU، نعرض مباشرة بدون تحويل
  const formattedTotal = params.total
    ? fmt(params.currency === "MRU"
        ? parseFloat(params.total)
        : toMRU(parseFloat(params.total), params.currency ?? "EUR"))
    : "—";

  // tRPC mutations
  const sendFlightEmail = trpc.email.sendFlightTicket.useMutation();
  const sendHotelEmail = trpc.email.sendHotelConfirmation.useMutation();

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Schedule booking notifications: immediate confirmation + 24h reminder
    const eventDate = isFlight
      ? (params.departureTime ?? params.returnDate ?? new Date().toISOString().split("T")[0])
      : (params.checkIn ?? new Date().toISOString().split("T")[0]);

    const bookingName = isFlight
      ? `${params.origin ?? ""} → ${params.destination ?? ""}`
      : (params.hotelName ?? "Hotel");

    scheduleBookingReminder24h({
      bookingRef: params.reference ?? "RV000",
      bookingName,
      eventDate,
      type: isFlight ? "flight" : "hotel",
      language: language as any,
    }).catch(() => {});

    // لا نُرسِل تلقائياً — payment.tsx أرسل التذكرة بالفعل
    // إذا فشل الإرسال من payment.tsx، يمكن للمستخدم الضغط على زر إعادة الإرسال
  }, []);

  const handleSendEmail = async (emailAddress?: string) => {
    const targetEmail = emailAddress ?? params.email;
    if (!targetEmail || !targetEmail.includes("@")) {
      Alert.alert("No Email", "No email address was provided for this booking.");
      return;
    }

    setEmailStatus("sending");

    try {
      const adults = parseInt(params.passengers ?? params.guests ?? "1", 10);
      const children = parseInt(params.children ?? "0", 10);
      const infants = parseInt(params.infants ?? "0", 10);

      if (isFlight) {
        const result = await sendFlightEmail.mutateAsync({
          passengerName: params.passengerName ?? "Passenger",
          passengerEmail: targetEmail,
          bookingRef: params.reference ?? "RV000",
          pnr: params.pnr || undefined,
          ticketNumber: params.ticketNumber || undefined,
          origin: params.originCode ?? "",
          originCity: params.origin ?? "",
          destination: params.destinationCode ?? "",
          destinationCity: params.destination ?? "",
          departureDate: params.returnDate
            ? params.departureTime?.split("T")[0] ?? today
            : today,
          departureTime: params.departureTime ?? "—",
          arrivalTime: params.arrivalTime ?? "—",
          airline: params.airline ?? "Royal Air Maroc",
          flightNumber: params.flightNumber ?? "AT000",
          cabinClass: params.cabinClass ?? "Economy",
          passengers: adults,
          children,
          infants,
          totalPrice: formattedTotal,
          currency: "MRU",
          tripType: params.tripType === "roundtrip" ? "round-trip" : "one-way",
          returnDate: params.returnDate,
        });
        setEmailStatus(result.success ? "sent" : "failed");
      } else {
        const checkIn = params.checkIn ?? today;
        const checkOut = params.checkOut ?? today;
        const nights = Math.max(
          1,
          Math.round(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        const result = await sendHotelEmail.mutateAsync({
          guestName: params.passengerName ?? "Guest",
          guestEmail: targetEmail,
          bookingRef: params.reference ?? "RV000",
          pnr: params.pnr || undefined,
          hotelName: params.hotelName ?? "Hotel",
          hotelCity: params.hotelCity ?? "City",
          hotelCountry: params.hotelCountry ?? "Mauritania",
          stars: parseInt(params.stars ?? "3", 10),
          checkIn,
          checkOut,
          nights,
          roomType: params.roomType ?? "Standard Room",
          guests: adults,
          children,
          totalPrice: formattedTotal,
          currency: "MRU",
        });
        setEmailStatus(result.success ? "sent" : "failed");
      }
    } catch (err) {
      console.error("[Email] Send error:", err);
      setEmailStatus("failed");
    }
  };

  const handleResendEmail = () => {
    if (!params.email || !params.email.includes("@")) {
      Alert.prompt(
        "Send Ticket by Email",
        "Enter the email address to send the ticket to:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Send",
            onPress: (email: string | undefined) => {
              if (email && email.includes("@")) {
                handleSendEmail(email);
              } else {
                Alert.alert("Invalid Email", "Please enter a valid email address.");
              }
            },
          },
        ],
        "plain-text",
        params.email ?? ""
      );
    } else {
      handleSendEmail(params.email);
    }
  };

  const getTicketText = (): string => {
    const adults = parseInt(params.passengers ?? params.guests ?? "1", 10);
    const children = parseInt(params.children ?? "0", 10);
    const infants = parseInt(params.infants ?? "0", 10);

    if (isFlight) {
      return generateFlightTicket({
        reference: params.reference ?? "RV000",
        passengerName: params.passengerName ?? "Passenger",
        dateOfBirth: params.dateOfBirth,
        passportNumber: params.passportNumber,
        nationality: params.nationality,
        email: params.email ?? COMPANY_INFO.email,
        phone: params.phone,
        airline: params.airline ?? "Royal Air Maroc",
        flightNumber: params.flightNumber ?? "AT000",
        origin: params.origin ?? "",
        originCode: params.originCode ?? "",
        destination: params.destination ?? "",
        destinationCode: params.destinationCode ?? "",
        departureTime: params.departureTime ?? "—",
        arrivalTime: params.arrivalTime ?? "—",
        duration: params.duration ?? "—",
        cabinClass: params.cabinClass ?? "Economy",
        adults,
        children,
        infants,
        tripType: (params.tripType as "oneway" | "roundtrip") ?? "oneway",
        returnDate: params.returnDate,
        totalPrice: formattedTotal,
        currency: "MRU",
        issueDate: today,
      });
    } else {
      return generateHotelVoucher({
        reference: params.reference ?? "RV000",
        guestName: params.passengerName ?? "Guest",
        email: params.email ?? COMPANY_INFO.email,
        phone: params.phone,
        hotelName: params.hotelName ?? "Hotel",
        hotelCity: params.hotelCity ?? "City",
        hotelCountry: params.hotelCountry ?? "Mauritania",
        checkIn: params.checkIn ?? "—",
        checkOut: params.checkOut ?? "—",
        roomType: params.roomType ?? "Standard Room",
        adults,
        children,
        infants,
        totalPrice: formattedTotal,
        currency: "MRU",
        issueDate: today,
      });
    }
  };

  const handleViewTicket = () => {
    const ticket = getTicketText();
    Alert.alert(
      isFlight ? "بطاقة الصعود" : "وثيقة الفندق",
      ticket,
      [
        { text: "Share", onPress: () => handleShareTicket() },
        { text: "Close", style: "cancel" },
      ]
    );
  };

  const handleShareTicket = async () => {
    try {
      const ticket = getTicketText();
      await Share.share({
        message: ticket,
        title: isFlight ? "Royal Voyage — Boarding Pass" : "Royal Voyage — Hotel Voucher",
      });
    } catch (e) {
      // ignore
    }
  };

  const renderEmailStatus = () => {
    if (emailStatus === "idle") return null;

    if (emailStatus === "sending") {
      return (
        <View style={[styles.emailStatusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.emailStatusText, { color: colors.muted }]}>
            Sending ticket to {params.email ?? "your email"}...
          </Text>
        </View>
      );
    }

    if (emailStatus === "sent") {
      return (
        <View style={[styles.emailStatusCard, { backgroundColor: "#dcfce7", borderColor: "#86efac" }]}>
          <IconSymbol name="checkmark.circle.fill" size={18} color="#16a34a" />
          <Text style={[styles.emailStatusText, { color: "#16a34a" }]}>
            تم إرسال التذكرة إلى {params.email ?? "بريدك الإلكتروني"}
          </Text>
        </View>
      );
    }

    if (emailStatus === "failed") {
      return (
        <View style={[styles.emailStatusCard, { backgroundColor: "#fef2f2", borderColor: "#fca5a5" }]}>
          <IconSymbol name="exclamationmark.circle.fill" size={18} color="#dc2626" />
          <Text style={[styles.emailStatusText, { color: "#dc2626" }]}>
            Email delivery failed. Tap to retry.
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Success Icon */}
      <Animated.View
        style={[
          styles.successCircle,
          { backgroundColor: colors.success + "15", transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.innerCircle, { backgroundColor: colors.success }]}>
          <IconSymbol name="checkmark.circle.fill" size={48} color="#FFFFFF" />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          {params.pnr === "PENDING" ? "Booking Received!" : "Booking Confirmed!"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {params.pnr === "PENDING" 
            ? `Your ${isFlight ? "flight" : "hotel"} booking has been received.\nPayment confirmation is required to issue your ticket.`
            : `Your ${isFlight ? "flight" : "hotel"} has been successfully booked.\nA ticket has been prepared for you.`
          }
        </Text>

        {/* Email Status Banner */}
        {renderEmailStatus()}

        {/* Reference Card */}
        <View style={[styles.refCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          {/* PNR - Most prominent */}
          {params.pnr && params.pnr !== "PENDING" && (
            <>
              <View style={[styles.pnrBox, { backgroundColor: colors.primary + "12", borderColor: colors.primary }]}>
                <Text style={[styles.pnrLabel, { color: colors.muted }]}>رقم الحجز PNR</Text>
                <Text style={[styles.pnrValue, { color: colors.primary }]}>{params.pnr}</Text>
                <Text style={[styles.pnrHint, { color: colors.muted }]}>احتفظ بهذا الرقم للمراجعة في المطار</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </>
          )}
          {/* PNR Pending - awaiting airline confirmation */}
          {params.pnr === "PENDING" && (
            <>
              <View style={[styles.pnrBox, { backgroundColor: "#F59E0B" + "15", borderColor: "#F59E0B" }]}>
                <Text style={[styles.pnrLabel, { color: colors.muted }]}>رقم الحجز PNR</Text>
                <Text style={[styles.pnrValue, { color: "#F59E0B", fontSize: 16 }]}>في انتظار تأكيد شركة الطيران</Text>
                <Text style={[styles.pnrHint, { color: colors.muted }]}>سيتم إرسال رقم الحجز بعد تأكيد الدفع</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </>
          )}

          {/* E-Ticket Number */}
          {params.ticketNumber ? (
            <>
              <View style={[styles.pnrBox, { backgroundColor: "#C9A84C" + "15", borderColor: "#C9A84C" }]}>
                <Text style={[styles.pnrLabel, { color: colors.muted }]}>رقم التذكرة الإلكترونية</Text>
                <Text style={[styles.pnrValue, { color: "#C9A84C", fontSize: 18, letterSpacing: 2 }]}>{params.ticketNumber}</Text>
                <Text style={[styles.pnrHint, { color: colors.muted }]}>E-Ticket — صادرة من شركة الطيران</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </>
          ) : null}

          <View style={styles.refRow}>
            <Text style={[styles.refLabel, { color: colors.muted }]}>رقم المرجع</Text>
            <View style={[styles.refBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.refBadgeText}>{params.reference}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.refRow}>
            <Text style={[styles.refLabel, { color: colors.muted }]}>المبلغ المدفوع</Text>
            <Text style={[styles.refValue, { color: colors.primary }]}>{formattedTotal}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.refRow}>
            <Text style={[styles.refLabel, { color: colors.muted }]}>الحالة</Text>
            {params.pnr === "PENDING" ? (
              <View style={[styles.statusBadge, { backgroundColor: "#F59E0B" + "15" }]}>
                <Text style={[styles.statusText, { color: "#F59E0B" }]}>في الانتظار</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: colors.success + "15" }]}>
                <Text style={[styles.statusText, { color: colors.success }]}>مؤكد</Text>
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.refRow}>
            <Text style={[styles.refLabel, { color: colors.muted }]}>تاريخ الإصدار</Text>
            <Text style={[styles.refLabel, { color: colors.foreground }]}>{today}</Text>
          </View>
        </View>

        {/* Company Info Card */}
        <View style={[styles.companyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.companyHeader}>
            <IconSymbol name="crown.fill" size={18} color={colors.primary} />
            <Text style={[styles.companyName, { color: colors.primary }]}>Royal Voyage</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 8 }]} />
          <View style={styles.companyRow}>
            <IconSymbol name="phone.fill" size={14} color={colors.muted} />
            <Text style={[styles.companyText, { color: colors.foreground }]}>{COMPANY_INFO.phone}</Text>
          </View>
          <View style={styles.companyRow}>
            <IconSymbol name="envelope.fill" size={14} color={colors.muted} />
            <Text style={[styles.companyText, { color: colors.foreground }]}>{COMPANY_INFO.email}</Text>
          </View>
          <View style={styles.companyRow}>
            <IconSymbol name="location.fill" size={14} color={colors.muted} />
            <Text style={[styles.companyText, { color: colors.foreground }]}>{COMPANY_INFO.address}</Text>
          </View>
        </View>

        {/* Ticket Actions */}
        <View style={styles.ticketActions}>
          <Pressable
            style={({ pressed }) => [
              styles.ticketBtn,
              { backgroundColor: colors.primary + "18", borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleViewTicket}
          >
            <IconSymbol name="ticket.fill" size={18} color={colors.primary} />
            <Text style={[styles.ticketBtnText, { color: colors.primary }]}>
              View {isFlight ? "Boarding Pass" : "Hotel Voucher"}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.ticketBtn,
              { backgroundColor: colors.success + "18", borderColor: colors.success, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleShareTicket}
          >
            <IconSymbol name="square.and.arrow.up" size={18} color={colors.success} />
            <Text style={[styles.ticketBtnText, { color: colors.success }]}>Share Ticket</Text>
          </Pressable>
        </View>

        {/* Email Ticket Button */}
        <Pressable
          style={({ pressed }) => [
            styles.emailBtn,
            {
              backgroundColor: emailStatus === "sent" ? "#dcfce7" : colors.surface,
              borderColor: emailStatus === "sent" ? "#86efac" : colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={handleResendEmail}
          disabled={emailStatus === "sending"}
        >
          {emailStatus === "sending" ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <IconSymbol
              name="envelope.fill"
              size={18}
              color={emailStatus === "sent" ? "#16a34a" : colors.primary}
            />
          )}
          <Text
            style={[
              styles.emailBtnText,
              { color: emailStatus === "sent" ? "#16a34a" : colors.primary },
            ]}
          >
            {emailStatus === "sent"
              ? "تم إرسال التذكرة بالبريد"
              : emailStatus === "sending"
              ? "جاري الإرسال..."
              : emailStatus === "failed"
              ? "إعادة الإرسال"
              : "إرسال التذكرة بالبريد"}
          </Text>
        </Pressable>

        {/* WhatsApp Confirmation */}
        <Pressable
          style={({ pressed }) => [
            styles.whatsappBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => {
            const ref = params.reference ?? "";
            const pnr = params.pnr ?? "";
            const type = isFlight ? "رحلة جوية" : "فندق";
            const route = isFlight
              ? `${params.originCode ?? ""} - ${params.destinationCode ?? ""}`
              : `${params.hotelName ?? ""} - ${params.hotelCity ?? ""}`;
            const msg = `*تأكيد حجز Royal Voyage*\n\n` +
              `النوع: ${type}\n` +
              `المسار: ${route}\n` +
              `رقم المرجع: ${ref}\n` +
              (pnr ? `PNR: ${pnr}\n` : "") +
              `المبلغ: ${formattedTotal}\n` +
              `الاسم: ${params.passengerName ?? ""}\n` +
              `التاريخ: ${today}\n\n` +
              `شكراً لاختياركم Royal Voyage`;
            const encoded = encodeURIComponent(msg);
            const phone = (params.phone ?? "").replace(/[^0-9]/g, "");
            const url = phone
              ? `https://wa.me/${phone}?text=${encoded}`
              : `https://wa.me/?text=${encoded}`;
            Linking.openURL(url).catch(() => {
              Alert.alert("تنبيه", "لم يتم العثور على تطبيق WhatsApp");
            });
          }}
        >
          <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
          <Text style={styles.whatsappText}>إرسال التأكيد عبر WhatsApp</Text>
        </Pressable>

        {/* Main Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.replace("/(tabs)/bookings" as any)}
          >
            <IconSymbol name="doc.text.fill" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>View My Bookings</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.replace("/(tabs)" as any)}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Back to Home</Text>
          </Pressable>
        </View>

        {/* Powered by Duffel */}
        <Pressable
          style={{ alignItems: "center", paddingVertical: 20, gap: 6 }}
          onPress={() => Linking.openURL("https://duffel.com")}
        >
          <Text style={{ fontSize: 10, color: colors.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>Powered by</Text>
          <Image
            source={{ uri: "https://assets.duffel.com/img/duffel-logo.svg" }}
            style={{ width: 72, height: 22 }}
            resizeMode="contain"
          />
        </Pressable>

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  successCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  innerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, paddingHorizontal: 16 },
  emailStatusCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  emailStatusText: { fontSize: 13, fontWeight: "600", flex: 1 },
  refCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refLabel: { fontSize: 14 },
  refBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  refBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  refValue: { fontSize: 18, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 13, fontWeight: "700" },
  divider: { height: 1 },
  companyCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  companyName: { fontSize: 16, fontWeight: "700" },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  companyText: { fontSize: 13, lineHeight: 18 },
  ticketActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  ticketBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  ticketBtnText: { fontSize: 13, fontWeight: "700" },
  emailBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  emailBtnText: { fontSize: 14, fontWeight: "700" },
  actions: { width: "100%", gap: 12 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 16, fontWeight: "600" },
  pnrBox: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  pnrLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  pnrValue: { fontSize: 36, fontWeight: "800", letterSpacing: 6, fontFamily: "monospace" },
  pnrHint: { fontSize: 11, marginTop: 6, textAlign: "center" },
  whatsappBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#25D366",
  },
  whatsappIcon: {
    fontSize: 20,
  },
  whatsappText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
