import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Share,
} from "react-native";
import { trpc } from "@/lib/trpc";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatMRU } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";
import { addAdminNotification } from "@/lib/admin-notifications";
import { generateFlightTicket, generateHotelVoucher, COMPANY_INFO } from "@/lib/ticket-generator";
import { shareFlightTicketPDF, shareHotelVoucherPDF } from "@/lib/pdf-ticket-generator";
import { Platform } from "react-native";

function useCountdown(deadlineISO?: string) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!deadlineISO) return;
    const update = () => {
      const diff = new Date(deadlineISO).getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [deadlineISO]);
  return remaining;
}

export default function BookingDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings, cancelBooking, adminPushToken } = useApp();
  const { fmt } = useCurrency();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sendingTicket, setSendingTicket] = useState(false);
  const sendFlightMutation = trpc.email.sendFlightTicket.useMutation();
  const sendHotelMutation = trpc.email.sendHotelConfirmation.useMutation();
  const sendAdminPush = trpc.email.sendPushNotification.useMutation();

  const booking = bookings.find((b) => b.id === id);

  if (!booking) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>Booking not found</Text>
        </View>
      </ScreenContainer>
    );
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: colors.success + "15", text: colors.success },
    pending: { bg: colors.warning + "15", text: colors.warning },
    cancelled: { bg: colors.error + "15", text: colors.error },
    processing: { bg: "#3B82F615", text: "#3B82F6" },
    airline_confirmed: { bg: "#10B98115", text: "#10B981" },
  };
  const statusLabels: Record<string, string> = {
    confirmed: "Confirmed ✅",
    pending: "Pending ⏳",
    cancelled: "Cancelled ❌",
    processing: "قيد المعالجة 🔄",
    airline_confirmed: "مؤكد من شركة الطيران ✈️",
  };
  const statusStyle = statusColors[booking.status] ?? statusColors.pending;

  const handleRetrieveTicket = async () => {
    if (!booking) return;
    // Ask for email
    Alert.prompt(
      "استرداد التذكرة",
      "أدخل عنوان البريد الإلكتروني لإرسال التذكرة",
      async (email) => {
        if (!email) return;
        setSendingTicket(true);
        try {
          if (booking.type === "flight" && booking.flight) {
            await sendFlightMutation.mutateAsync({
              passengerName: booking.passengerName ?? "العميل",
              passengerEmail: email,
              bookingRef: booking.reference,
              pnr: booking.realPnr || booking.pnr,
              origin: booking.flight.originCode,
              originCity: booking.flight.origin,
              destination: booking.flight.destinationCode,
              destinationCity: booking.flight.destination,
              departureDate: booking.date,
              departureTime: booking.flight.departureTime,
              arrivalTime: booking.flight.arrivalTime,
              airline: booking.flight.airline,
              flightNumber: booking.flight.flightNumber,
              cabinClass: booking.flight.class ?? "Economy",
              passengers: booking.passengers ?? 1,
              totalPrice: `${booking.totalPrice}`,
            });
          } else if (booking.type === "hotel" && booking.hotel) {
            const checkInDate = booking.checkIn ?? "";
            const checkOutDate = booking.checkOut ?? "";
            const nights = checkInDate && checkOutDate
              ? Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000))
              : 1;
            await sendHotelMutation.mutateAsync({
              guestName: booking.guestName ?? "العميل",
              guestEmail: email,
              bookingRef: booking.reference,
              hotelName: booking.hotel.name,
              hotelCity: booking.hotel.city,
              hotelCountry: booking.hotel.country ?? "Mauritania",
              stars: booking.hotel.stars ?? 3,
              checkIn: checkInDate,
              checkOut: checkOutDate,
              nights,
              guests: booking.guests ?? 1,
              totalPrice: `${booking.totalPrice}`,
            });
          }
          Alert.alert("تم الإرسال ✓", `تم إرسال التذكرة إلى ${email}`);
        } catch {
          Alert.alert("خطأ", "فشل إرسال التذكرة. تحقق من البريد وحاول مجدداً.");
        } finally {
          setSendingTicket(false);
        }
      },
      "plain-text",
      "",
      "email-address"
    );
  };

  const handleChangeBooking = () => {
    router.push({ pathname: "/booking/change" as any, params: { id: booking?.id } });
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? This action cannot be undone.",
      [
        { text: "Keep Booking", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: () => {
            cancelBooking(booking.id);

            // إرسال إشعار للمدير عند إلغاء حجز
            const bookingType = booking.type === "flight" ? "✈️ رحلة" : "🏨 فندق";
            const customerName = (booking.passengerName ?? booking.guestName ?? "زبون");
            const dest = booking.type === "flight"
              ? `${booking.flight?.originCode ?? ""} → ${booking.flight?.destinationCode ?? ""}`
              : booking.hotel?.name ?? "";
            const notifTitle = `❌ إلغاء حجز! ${bookingType}`;
            const notifBody = `${customerName} • ${dest} • ${fmt(booking.totalPrice)} • ${booking.reference}`;

            // حفظ الإشعار محلياً
            addAdminNotification({
              type: "booking_cancelled",
              title: notifTitle,
              body: notifBody,
              bookingRef: booking.reference,
              bookingId: booking.id,
            }).catch(() => {});

            // إرسال Push للمدير
            if (adminPushToken) {
              sendAdminPush.mutateAsync({
                expoPushToken: adminPushToken,
                title: notifTitle,
                body: notifBody,
                data: { bookingRef: booking.reference, type: "booking_cancelled" },
                sound: "new_booking.wav",
                channelId: "booking_cancelled",
              }).catch(() => {});
            }

            router.back();
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <Pressable style={[styles.shareBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg, borderColor: statusStyle.text + "30" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusLabels[booking.status] ?? booking.status}
          </Text>
          <Text style={[styles.refText, { color: statusStyle.text }]}>{booking.reference}</Text>
        </View>

        {/* Cash Payment Countdown */}
        {booking.paymentDeadline && (() => {
          const diff = new Date(booking.paymentDeadline).getTime() - Date.now();
          if (diff <= 0) return (
            <View style={[styles.countdownBanner, { backgroundColor: "#EF444415", borderColor: "#EF444430" }]}>
              <Text style={{ fontSize: 18 }}>⚠️</Text>
              <Text style={{ color: "#EF4444", fontWeight: "700", flex: 1 }}>انتهت مهلة الدفع النقدي</Text>
            </View>
          );
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const isUrgent = hours < 2;
          return (
            <View style={[styles.countdownBanner, { backgroundColor: isUrgent ? "#EF444415" : "#F59E0B15", borderColor: isUrgent ? "#EF444430" : "#F59E0B30" }]}>
              <Text style={{ fontSize: 18 }}>{isUrgent ? "⚠️" : "⏰"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: isUrgent ? "#EF4444" : "#F59E0B", fontWeight: "700", fontSize: 13 }}>مهلة الدفع النقدي</Text>
                <Text style={{ color: isUrgent ? "#EF4444" : "#F59E0B", fontSize: 12, marginTop: 2 }}>
                  {hours > 0 ? `${hours} ساعة و${minutes} دقيقة` : `${minutes} دقيقة`} متبقية — يرجى الدفع في مكتبنا
                </Text>
              </View>
            </View>
          );
        })()}

        {/* Main Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.typeIcon, { backgroundColor: booking.type === "flight" ? colors.primary + "15" : colors.secondary + "20" }]}>
              <Text style={{ fontSize: 28 }}>{booking.type === "flight" ? "✈" : "🏨"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mainTitle, { color: colors.foreground }]}>
                {booking.type === "flight"
                  ? `${booking.flight?.airline} · ${booking.flight?.flightNumber}`
                  : booking.hotel?.name ?? "Hotel"}
              </Text>
              <Text style={[styles.mainSubtitle, { color: colors.muted }]}>
                {booking.type === "flight"
                  ? `${booking.flight?.originCode} → ${booking.flight?.destinationCode}`
                  : `${booking.hotel?.city}, ${booking.hotel?.country}`}
              </Text>
            </View>
          </View>

          {booking.type === "flight" && booking.flight ? (
            <View style={[styles.routeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.routePoint}>
                <Text style={[styles.routeTime, { color: colors.foreground }]}>{booking.flight.departureTime}</Text>
                <Text style={[styles.routeCode, { color: colors.primary }]}>{booking.flight.originCode}</Text>
                <Text style={[styles.routeCity, { color: colors.muted }]}>{booking.flight.origin}</Text>
              </View>
              <View style={styles.routeCenter}>
                <Text style={[styles.routeDuration, { color: colors.muted }]}>{booking.flight.duration}</Text>
                <View style={styles.routeLine}>
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  <View style={[styles.line, { backgroundColor: colors.border }]} />
                  <Text style={{ fontSize: 16 }}>✈</Text>
                  <View style={[styles.line, { backgroundColor: colors.border }]} />
                  <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
                </View>
                <Text style={[styles.routeStops, { color: booking.flight.stops === 0 ? colors.success : colors.warning }]}>
                  {booking.flight.stops === 0 ? "Direct" : `${booking.flight.stops} stop`}
                </Text>
              </View>
              <View style={[styles.routePoint, { alignItems: "flex-end" }]}>
                <Text style={[styles.routeTime, { color: colors.foreground }]}>{booking.flight.arrivalTime}</Text>
                <Text style={[styles.routeCode, { color: colors.secondary }]}>{booking.flight.destinationCode}</Text>
                <Text style={[styles.routeCity, { color: colors.muted }]}>{booking.flight.destination}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Booking Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Booking Information</Text>

          {/* PNR Box */}
          {(booking.realPnr || booking.pnr) && (
            <View style={[
              styles.pnrBox,
              booking.realPnr
                ? { backgroundColor: colors.success + "10", borderColor: colors.success }
                : { backgroundColor: colors.primary + "10", borderColor: colors.primary }
            ]}>
              <Text style={[styles.pnrLabel, { color: colors.muted }]}>رقم الحجز PNR</Text>
              <Text style={[styles.pnrValue, { color: booking.realPnr ? colors.success : colors.primary }]}>
                {booking.realPnr || booking.pnr}
              </Text>
              {booking.realPnr ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.pnrHint, { color: colors.success }]}>✓ رمز مؤكد من شركة الطيران — استخدمه في المطار</Text>
                  {booking.realPnrUpdatedAt && (
                    <Text style={[styles.pnrHint, { color: colors.muted, fontSize: 10, marginTop: 2 }]}>
                      تحديث: {new Date(booking.realPnrUpdatedAt).toLocaleString('ar-MR', { dateStyle: 'short', timeStyle: 'short' })}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={[styles.pnrHint, { color: colors.muted }]}>سيتم تحديث هذا الرمز بعد تأكيد الحجز مع شركة الطيران</Text>
              )}
            </View>
          )}

          {/* Ticket Number Box */}
          {booking.ticketNumber && (
            <View style={[
              styles.pnrBox,
              { backgroundColor: "#1B2B5E10", borderColor: "#1B2B5E" }
            ]}>
              <Text style={[styles.pnrLabel, { color: colors.muted }]}>رقم التذكرة Ticket Number</Text>
              <Text style={[styles.ticketNumberValue, { color: "#1B2B5E" }]}>
                {booking.ticketNumber}
              </Text>
              <Text style={[styles.pnrHint, { color: colors.success }]}>✓ رقم التذكرة الإلكترونية</Text>
              {booking.ticketNumberUpdatedAt && (
                <Text style={[styles.pnrHint, { color: colors.muted, fontSize: 10, marginTop: 2 }]}>
                  تحديث: {new Date(booking.ticketNumberUpdatedAt).toLocaleString('ar-MR', { dateStyle: 'short', timeStyle: 'short' })}
                </Text>
              )}
            </View>
          )}

          {/* Payment Status */}
          {booking.paymentConfirmed && (
            <View style={[styles.pnrBox, { backgroundColor: "#22C55E10", borderColor: "#22C55E" }]}>
              <Text style={{ fontSize: 28 }}>✅</Text>
              <Text style={{ color: "#22C55E", fontSize: 16, fontWeight: "700", marginTop: 4 }}>تم تأكيد الدفع</Text>
              {booking.paymentConfirmedAt && (
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
                  {new Date(booking.paymentConfirmedAt).toLocaleString('ar-MR', { dateStyle: 'short', timeStyle: 'short' })}
                </Text>
              )}
            </View>
          )}
          {booking.paymentRejected && (
            <View style={[styles.pnrBox, { backgroundColor: "#EF444410", borderColor: "#EF4444" }]}>
              <Text style={{ fontSize: 28 }}>❌</Text>
              <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: "700", marginTop: 4 }}>تم رفض الدفع</Text>
              {booking.paymentRejectedReason && (
                <Text style={{ color: "#EF4444", fontSize: 13, marginTop: 4, textAlign: "center" }}>
                  السبب: {booking.paymentRejectedReason}
                </Text>
              )}
              {booking.paymentRejectedAt && (
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
                  {new Date(booking.paymentRejectedAt).toLocaleString('ar-MR', { dateStyle: 'short', timeStyle: 'short' })}
                </Text>
              )}
            </View>
          )}

          {[
            { label: "تاريخ الحجز", value: booking.date },
            { label: "رقم المرجع", value: booking.reference },
            ...(booking.type === "flight" ? [
              { label: "Class", value: booking.flight?.class ?? "Economy" },
              { label: "Passengers", value: `${booking.passengers ?? 1}` },
            ] : [
              { label: "Check-in", value: booking.checkIn ?? "-" },
              { label: "Check-out", value: booking.checkOut ?? "-" },
              { label: "Guests", value: `${booking.guests ?? 1}` },
              { label: "Rooms", value: `${booking.rooms ?? 1}` },
            ]),
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total Paid</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{fmt(booking.totalPrice ?? 0)}</Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: "center" }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Boarding Pass / Voucher</Text>
          <View style={[styles.qrBox, { backgroundColor: colors.background }]}>
            <IconSymbol name="qrcode" size={100} color={colors.primary} />
          </View>
          <Text style={[styles.qrLabel, { color: colors.muted }]}>
            Present this QR code at check-in
          </Text>
        </View>

        {/* Action Buttons */}
        {booking.status !== "cancelled" && (
          <View style={styles.actionRow}>
            {/* Retrieve Ticket */}
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.primary + "15", borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleRetrieveTicket}
              disabled={sendingTicket}
            >
              {sendingTicket ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <IconSymbol name="envelope.fill" size={16} color={colors.primary} />
              )}
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                استرداد التذكرة
              </Text>
            </Pressable>

            {/* Change Booking */}
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.warning + "15", borderColor: colors.warning, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleChangeBooking}
            >
              <IconSymbol name="pencil" size={16} color={colors.warning} />
              <Text style={[styles.actionBtnText, { color: colors.warning }]}>
                تغيير الحجز
              </Text>
            </Pressable>
          </View>
        )}

        {/* Send Ticket PDF via WhatsApp */}
        {booking.status !== "cancelled" && Platform.OS !== "web" && (
          <Pressable
            style={({ pressed }) => [
              styles.whatsappTicketBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => {
              if (booking.type === "flight" && booking.flight) {
                shareFlightTicketPDF({
                  reference: booking.reference,
                  pnr: booking.realPnr || booking.pnr,
                  passengerName: booking.passengerName || "---",
                  email: booking.passengerEmail || "",
                  airline: booking.flight.airline,
                  flightNumber: booking.flight.flightNumber,
                  origin: booking.flight.origin,
                  originCode: booking.flight.originCode,
                  destination: booking.flight.destination,
                  destinationCode: booking.flight.destinationCode,
                  departureTime: booking.flight.departureTime,
                  arrivalTime: booking.flight.arrivalTime,
                  duration: booking.flight.duration,
                  cabinClass: booking.flight.class ?? "Economy",
                  adults: booking.passengers ?? 1,
                  children: 0,
                  tripType: "oneway",
                  totalPrice: fmt(booking.totalPrice ?? 0),
                  currency: booking.currency || "MRU",
                  issueDate: new Date(booking.date).toLocaleDateString("en-US"),
                  seatNumber: booking.seatNumber,
                  boardingGroup: booking.boardingGroup,
                  meal: booking.mealChoice,
                }, true);
              } else if (booking.type === "hotel" && booking.hotel) {
                shareHotelVoucherPDF({
                  reference: booking.reference,
                  guestName: booking.guestName || "---",
                  email: booking.passengerEmail || "",
                  hotelName: booking.hotel.name,
                  hotelCity: booking.hotel.city,
                  hotelCountry: booking.hotel.country ?? "Mauritania",
                  checkIn: booking.checkIn ?? "",
                  checkOut: booking.checkOut ?? "",
                  roomType: "Standard",
                  adults: booking.guests ?? 1,
                  children: 0,
                  totalPrice: fmt(booking.totalPrice ?? 0),
                  currency: booking.currency || "MRU",
                  issueDate: new Date(booking.date).toLocaleDateString("en-US"),
                }, true);
              } else {
                Alert.alert("\u062a\u0646\u0628\u064a\u0647", "\u0644\u0627 \u062a\u0648\u062c\u062f \u0628\u064a\u0627\u0646\u0627\u062a \u0643\u0627\u0641\u064a\u0629 \u0644\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u0630\u0643\u0631\u0629");
              }
            }}
          >
            <Text style={styles.whatsappTicketIcon}>{"\uD83D\uDCE8"}</Text>
            <Text style={styles.whatsappTicketText}>\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062a\u0630\u0643\u0631\u0629 PDF \u0639\u0628\u0631 WhatsApp</Text>
          </Pressable>
        )}

        {/* Share Ticket PDF (general) */}
        {booking.status !== "cancelled" && Platform.OS !== "web" && (
          <Pressable
            style={({ pressed }) => [
              styles.sharePdfBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => {
              if (booking.type === "flight" && booking.flight) {
                shareFlightTicketPDF({
                  reference: booking.reference,
                  pnr: booking.realPnr || booking.pnr,
                  passengerName: booking.passengerName || "---",
                  email: booking.passengerEmail || "",
                  airline: booking.flight.airline,
                  flightNumber: booking.flight.flightNumber,
                  origin: booking.flight.origin,
                  originCode: booking.flight.originCode,
                  destination: booking.flight.destination,
                  destinationCode: booking.flight.destinationCode,
                  departureTime: booking.flight.departureTime,
                  arrivalTime: booking.flight.arrivalTime,
                  duration: booking.flight.duration,
                  cabinClass: booking.flight.class ?? "Economy",
                  adults: booking.passengers ?? 1,
                  children: 0,
                  tripType: "oneway",
                  totalPrice: fmt(booking.totalPrice ?? 0),
                  currency: booking.currency || "MRU",
                  issueDate: new Date(booking.date).toLocaleDateString("en-US"),
                  seatNumber: booking.seatNumber,
                  boardingGroup: booking.boardingGroup,
                  meal: booking.mealChoice,
                }, false);
              } else if (booking.type === "hotel" && booking.hotel) {
                shareHotelVoucherPDF({
                  reference: booking.reference,
                  guestName: booking.guestName || "---",
                  email: booking.passengerEmail || "",
                  hotelName: booking.hotel.name,
                  hotelCity: booking.hotel.city,
                  hotelCountry: booking.hotel.country ?? "Mauritania",
                  checkIn: booking.checkIn ?? "",
                  checkOut: booking.checkOut ?? "",
                  roomType: "Standard",
                  adults: booking.guests ?? 1,
                  children: 0,
                  totalPrice: fmt(booking.totalPrice ?? 0),
                  currency: booking.currency || "MRU",
                  issueDate: new Date(booking.date).toLocaleDateString("en-US"),
                }, false);
              }
            }}
          >
            <Text style={styles.sharePdfIcon}>{"\uD83D\uDCC4"}</Text>
            <Text style={styles.sharePdfText}>\u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u062a\u0630\u0643\u0631\u0629 PDF</Text>
          </Pressable>
        )}

        {/* Online Check-in */}
        {booking.type === "flight" && booking.status !== "cancelled" && (
          <Pressable
            style={({ pressed }) => [
              styles.checkinBtn,
              {
                backgroundColor: booking.checkedIn ? colors.success + "15" : colors.success,
                borderColor: colors.success,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => router.push({ pathname: "/online-checkin" as any, params: { id: booking.id } })}
          >
            <IconSymbol name="person.badge.clock" size={18} color={booking.checkedIn ? colors.success : "#FFF"} />
            <Text style={[styles.checkinBtnText, { color: booking.checkedIn ? colors.success : "#FFF" }]}>
              {booking.checkedIn
                ? `\u2713 \u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644 - ${booking.seatNumber}`
                : "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A"}
            </Text>
          </Pressable>
        )}

        {/* Change Seat (after check-in) */}
        {booking.type === "flight" && booking.checkedIn && booking.status !== "cancelled" && (
          <Pressable
            style={({ pressed }) => [
              styles.changeSeatBtn,
              { borderColor: "#FF9800", opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.push({ pathname: "/change-seat" as any, params: { id: booking.id } })}
          >
            <IconSymbol name="repeat" size={18} color="#FF9800" />
            <Text style={[styles.changeSeatText, { color: "#FF9800" }]}>
              {booking.seatChangeCount ? `\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0642\u0639\u062F (${booking.seatChangeCount}x)` : "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0642\u0639\u062F"}
            </Text>
          </Pressable>
        )}

        {/* Track Flight Status */}
        {booking.type === "flight" && booking.status !== "cancelled" && (
          <Pressable
            style={({ pressed }) => [
              styles.trackFlightBtn,
              { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.push({ pathname: "/flight-status" as any, params: { id: booking.id } })}
          >
            <IconSymbol name="airplane.circle.fill" size={18} color={colors.primary} />
            <Text style={[styles.trackFlightText, { color: colors.primary }]}>\u062A\u062A\u0628\u0639 \u062D\u0627\u0644\u0629 \u0627\u0644\u0631\u062D\u0644\u0629</Text>
          </Pressable>
        )}

        {/* Travel Checklist */}
        {booking.status !== "cancelled" && (
          <Pressable
            style={({ pressed }) => [
              styles.checklistBtn,
              { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.push({ pathname: "/travel-checklist" as any, params: { id: booking.id } })}
          >
            <IconSymbol name="list.bullet.clipboard" size={18} color={colors.primary} />
            <Text style={[styles.checklistText, { color: colors.primary }]}>\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062A\u062D\u0642\u0642 \u0642\u0628\u0644 \u0627\u0644\u0633\u0641\u0631</Text>
          </Pressable>
        )}

        {/* PNR Status (Amadeus) */}
        {booking.type === "flight" && booking.status !== "cancelled" && booking.amadeusOrderId && (
          <Pressable
            style={({ pressed }) => [
              styles.pnrStatusBtn,
              { borderColor: "#6366F1", opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.push({ pathname: "/pnr-status" as any, params: { orderId: booking.amadeusOrderId, bookingId: booking.id } })}
          >
            <IconSymbol name="doc.text.magnifyingglass" size={18} color="#6366F1" />
            <Text style={[styles.pnrStatusText, { color: "#6366F1" }]}>PNR Status (Amadeus)</Text>
          </Pressable>
        )}

        {/* Cancel */}
        {booking.status !== "cancelled" && (
          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              { borderColor: colors.error, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleCancel}
          >
            <IconSymbol name="xmark" size={16} color={colors.error} />
            <Text style={[styles.cancelBtnText, { color: colors.error }]}>إلغاء الحجز</Text>
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  refText: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  typeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 14,
  },
  routeBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  routePoint: {
    minWidth: 70,
  },
  routeTime: {
    fontSize: 20,
    fontWeight: "700",
  },
  routeCode: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  routeCity: {
    fontSize: 11,
    marginTop: 2,
  },
  routeCenter: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  routeDuration: {
    fontSize: 12,
  },
  routeLine: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    flex: 1,
    height: 1.5,
  },
  routeStops: {
    fontSize: 11,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
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
  qrBox: {
    width: 140,
    height: 140,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  qrLabel: {
    fontSize: 13,
    textAlign: "center",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    marginBottom: 0,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    margin: 16,
    marginBottom: 0,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  pnrBox: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  pnrLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  pnrValue: { fontSize: 34, fontWeight: "800", letterSpacing: 6, fontFamily: "monospace" },
  ticketNumberValue: { fontSize: 22, fontWeight: "800", letterSpacing: 3, fontFamily: "monospace" },
  pnrHint: { fontSize: 11, marginTop: 6, textAlign: "center" },
  countdownBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  whatsappTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#25D366",
  },
  whatsappTicketIcon: {
    fontSize: 20,
  },
  whatsappTicketText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  checkinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  checkinBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  trackFlightBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  trackFlightText: {
    fontSize: 15,
    fontWeight: "700",
  },
  changeSeatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginTop: 8,
  },
  changeSeatText: {
    fontSize: 15,
    fontWeight: "700",
  },
  checklistBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginTop: 8,
  },
  checklistText: {
    fontSize: 15,
    fontWeight: "700",
  },
  sharePdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#1A73E8",
    marginTop: 8,
  },
  sharePdfIcon: {
    fontSize: 18,
  },
  sharePdfText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  pnrStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginTop: 8,
  },
  pnrStatusText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
