import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatMRU } from "@/lib/currency";
import { trpc } from "@/lib/trpc";

export default function AdminBookingDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings, updateBookingTicketSent, updateBookingTicketNumber, updateBookingStatus, updateBookingPnr } = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [resending, setResending] = useState(false);
  const [checkingTicket, setCheckingTicket] = useState(false);
  const [queuingConsolidator, setQueuingConsolidator] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const sendAirlineConfirmedTicket = trpc.email.sendAirlineConfirmedTicket.useMutation();
  const sendAirlineConfirmedHotelTicket = trpc.email.sendAirlineConfirmedHotelTicket.useMutation();
  const queueToConsolidatorMut = trpc.amadeus.queueToConsolidator.useMutation();
  const cancelFlightOrder = trpc.amadeus.cancelFlightOrder.useMutation();
  const sendCancellationEmail = trpc.email.sendCancellation.useMutation();
  const payHoldOrder = trpc.amadeus.payHoldOrder.useMutation();
  const sendPaymentConfirmation = trpc.email.confirmPayment.useMutation();

  const booking = bookings.find((b) => b.id === id);

  if (!booking) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>الحجز غير موجود</Text>
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
    confirmed: "مؤكد",
    pending: "معلق",
    cancelled: "ملغى",
    processing: "قيد المعالجة",
    airline_confirmed: "مؤكد من شركة الطيران",
  };
  const statusStyle = statusColors[booking.status] ?? statusColors.pending;

  const handleResendTicket = async () => {
    const email = booking.passengerEmail;
    if (!email) {
      Alert.alert("خطأ", "لا يوجد بريد إلكتروني مسجّل لهذا الحجز.");
      return;
    }

    Alert.alert(
      "إعادة إرسال التذكرة",
      `سيتم إرسال التذكرة PDF إلى:\n${email}\n\nهل تريد المتابعة؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إرسال",
          onPress: async () => {
            setResending(true);
            try {
              const name = booking.passengerName ?? booking.guestName ?? "Guest";
              if (booking.type === "flight" && booking.flight) {
                await sendAirlineConfirmedTicket.mutateAsync({
                  passengerName: name,
                  passengerEmail: email,
                  bookingRef: booking.reference,
                  pnr: booking.realPnr ?? booking.pnr,
                  origin: booking.flight.originCode ?? booking.flight.origin ?? "NKC",
                  originCity: booking.flight.origin ?? "Nouakchott",
                  destination: booking.flight.destinationCode ?? booking.flight.destination ?? "",
                  destinationCity: booking.flight.destination ?? "",
                  departureDate: booking.date ?? "",
                  departureTime: booking.flight.departureTime ?? "",
                  arrivalTime: booking.flight.arrivalTime ?? "",
                  airline: booking.flight.airline ?? "",
                  flightNumber: booking.flight.flightNumber ?? "",
                  cabinClass: booking.flight.class ?? "ECONOMY",
                  passengers: booking.passengers ?? 1,
                  children: 0,
                  totalPrice: formatMRU(booking.totalPrice ?? 0),
                  currency: "MRU",
                  tripType: "one-way",
                  expoPushToken: booking.customerPushToken,
                });
              } else if (booking.type === "hotel" && booking.hotel) {
                let nights = 1;
                if (booking.checkIn && booking.checkOut) {
                  const diff = Math.round(
                    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
                    (1000 * 60 * 60 * 24)
                  );
                  if (diff > 0) nights = diff;
                }
                await sendAirlineConfirmedHotelTicket.mutateAsync({
                  guestName: name,
                  guestEmail: email,
                  bookingRef: booking.reference,
                  pnr: booking.realPnr ?? booking.pnr,
                  hotelName: booking.hotel.name,
                  hotelCity: booking.hotel.city,
                  hotelCountry: booking.hotel.country ?? "Mauritania",
                  stars: booking.hotel.stars ?? 3,
                  checkIn: booking.checkIn ?? "",
                  checkOut: booking.checkOut ?? "",
                  nights,
                  roomType: "Standard Room",
                  guests: booking.guests ?? 1,
                  children: 0,
                  totalPrice: formatMRU(booking.totalPrice ?? 0),
                  currency: "MRU",
                  expoPushToken: booking.customerPushToken,
                });
              }
              await updateBookingTicketSent(booking.id);
              Alert.alert(
                "تم الإرسال",
                `تم إرسال التذكرة PDF بنجاح إلى:\n${email}`
              );
            } catch (err) {
              console.error("[Admin] Resend ticket failed:", err);
              Alert.alert("خطأ", "فشل إرسال التذكرة. تحقق من الاتصال وحاول مجدداً.");
            } finally {
              setResending(false);
            }
          },
        },
      ]
    );
  };

  const paymentLabels: Record<string, string> = {
    cash: "نقداً",
    bank_transfer: "تحويل بنكي",
    stripe: "بطاقة بنكية (Visa/Mastercard)",
    bankily: "Bankily",
    masrvi: "Masrvi",
    sedad: "Sedad",
    paypal: "PayPal (عملة أجنبية)",
    multicaixa: "Multicaixa Express (AOA)",
    hold_24h: "حجز مؤكد 24 ساعة",
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B2B5E" }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>تفاصيل الحجز</Text>
          <Text style={styles.headerSub}>{booking.reference}</Text>
        </View>
        {/* Ticket sent indicator */}
        {booking.ticketSent && (
          <View style={styles.ticketSentBadge}>
            <IconSymbol name="paperplane.fill" size={13} color="#10B981" />
            <Text style={styles.ticketSentText}>أُرسلت</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg, borderColor: statusStyle.text + "30" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusLabels[booking.status] ?? booking.status}
          </Text>
          <Text style={[styles.refText, { color: statusStyle.text }]}>{booking.reference}</Text>
        </View>

        {/* Ticket Sent Info */}
        {booking.ticketSent && booking.ticketSentAt && (
          <View style={[styles.ticketSentBanner, { backgroundColor: "#10B98110", borderColor: "#10B98130" }]}>
            <IconSymbol name="paperplane.fill" size={16} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#10B981", fontWeight: "700", fontSize: 13 }}>تم إرسال التذكرة</Text>
              <Text style={{ color: "#10B981", fontSize: 11, marginTop: 2 }}>
                {new Date(booking.ticketSentAt).toLocaleString("ar-MR", { dateStyle: "short", timeStyle: "short" })}
              </Text>
            </View>
          </View>
        )}

        {/* Booking Type Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.typeIcon, { backgroundColor: booking.type === "flight" ? "#1B2B5E15" : "#C9A84C15" }]}>
              <IconSymbol name={booking.type === "flight" ? "paperplane.fill" : "building.fill"} size={28} color={booking.type === "flight" ? "#1B2B5E" : "#C9A84C"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mainTitle, { color: colors.foreground }]}>
                {booking.type === "flight"
                  ? `${booking.flight?.airline ?? "—"} · ${booking.flight?.flightNumber ?? "—"}`
                  : booking.hotel?.name ?? "—"}
              </Text>
              <Text style={[styles.mainSubtitle, { color: colors.muted }]}>
                {booking.type === "flight"
                  ? `${booking.flight?.originCode ?? "—"} → ${booking.flight?.destinationCode ?? "—"}`
                  : `${booking.hotel?.city ?? "—"}, ${booking.hotel?.country ?? "—"}`}
              </Text>
            </View>
          </View>

          {/* Flight Route */}
          {booking.type === "flight" && booking.flight && (
            <View style={[styles.routeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.routeTime, { color: colors.foreground }]}>{booking.flight.departureTime}</Text>
                <Text style={[styles.routeCode, { color: "#1B2B5E" }]}>{booking.flight.originCode}</Text>
                <Text style={[styles.routeCity, { color: colors.muted }]}>{booking.flight.origin}</Text>
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{booking.flight.duration}</Text>
                <Text style={{ fontSize: 20, marginVertical: 2 }}>→</Text>
                <Text style={{ color: booking.flight.stops === 0 ? colors.success : colors.warning, fontSize: 11 }}>
                  {booking.flight.stops === 0 ? "مباشر" : `${booking.flight.stops} توقف`}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.routeTime, { color: colors.foreground }]}>{booking.flight.arrivalTime}</Text>
                <Text style={[styles.routeCode, { color: "#C9A84C" }]}>{booking.flight.destinationCode}</Text>
                <Text style={[styles.routeCity, { color: colors.muted }]}>{booking.flight.destination}</Text>
              </View>
            </View>
          )}

          {/* Hotel Dates */}
          {booking.type === "hotel" && (
            <View style={[styles.routeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 2 }}>تسجيل الدخول</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{booking.checkIn ?? "—"}</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 18 }}>→</Text>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 2 }}>تسجيل الخروج</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{booking.checkOut ?? "—"}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Customer Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>معلومات العميل</Text>
          {[
            { label: "الاسم", value: booking.passengerName ?? booking.guestName ?? "—" },
            { label: "البريد الإلكتروني", value: booking.passengerEmail ?? "—" },
            { label: "طريقة الدفع", value: paymentLabels[booking.paymentMethod ?? ""] ?? booking.paymentMethod ?? "—" },
            { label: "Push Token", value: booking.customerPushToken ? "مسجّل" : "غير مسجّل" },
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* PNR */}
        {(booking.realPnr || booking.pnr) && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>رمز PNR</Text>
            <View style={[
              styles.pnrBox,
              booking.realPnr
                ? { backgroundColor: colors.success + "10", borderColor: colors.success }
                : { backgroundColor: "#1B2B5E10", borderColor: "#1B2B5E" }
            ]}>
              <Text style={[styles.pnrLabel, { color: colors.muted }]}>
                {booking.realPnr ? "PNR رسمي من شركة الطيران" : "PNR مؤقت"}
              </Text>
              <Text style={[styles.pnrValue, { color: booking.realPnr ? colors.success : "#1B2B5E" }]}>
                {booking.realPnr || booking.pnr}
              </Text>
              {booking.realPnrUpdatedAt && (
                <Text style={[styles.pnrHint, { color: colors.muted }]}>
                  تحديث: {new Date(booking.realPnrUpdatedAt).toLocaleString("ar-MR", { dateStyle: "short", timeStyle: "short" })}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Ticket Number */}
        {booking.ticketNumber && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>رقم التذكرة</Text>
            <View style={[
              styles.pnrBox,
              { backgroundColor: "#1B2B5E10", borderColor: "#1B2B5E" }
            ]}>
              <Text style={[styles.pnrLabel, { color: colors.muted }]}>Ticket Number</Text>
              <Text style={[{ fontSize: 22, fontWeight: "800", letterSpacing: 3, color: "#1B2B5E", fontFamily: "monospace" }]}>
                {booking.ticketNumber}
              </Text>
              {booking.ticketNumberUpdatedAt && (
                <Text style={[styles.pnrHint, { color: colors.muted }]}>
                  تحديث: {new Date(booking.ticketNumberUpdatedAt).toLocaleString("ar-MR", { dateStyle: "short", timeStyle: "short" })}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Price */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>ملخص السعر</Text>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>الإجمالي المدفوع</Text>
            <Text style={[styles.totalValue, { color: "#1B2B5E" }]}>{formatMRU(booking.totalPrice ?? 0)}</Text>
          </View>
          {booking.transferRef ? (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>مرجع التحويل</Text>
              <Text style={[styles.infoValue, { color: colors.foreground, fontFamily: "monospace" }]}>{booking.transferRef}</Text>
            </View>
          ) : null}
          {booking.businessAccountId ? (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>حساب الوسيط</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{booking.businessAccountId}</Text>
            </View>
          ) : null}
          {booking.commissionAmount ? (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>عمولة الوسيط</Text>
              <Text style={[styles.infoValue, { color: "#C9A84C", fontWeight: "700" }]}>{formatMRU(booking.commissionAmount)}</Text>
            </View>
          ) : null}
        </View>

        {/* Receipt Image */}
        {booking.receiptImage ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>إيصال الدفع</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
              <Text style={{ color: colors.success, fontSize: 13, fontWeight: "600" }}>تم رفع الإيصال</Text>
              {booking.receiptImageAt ? (
                <Text style={{ color: colors.muted, fontSize: 11 }}>
                  {new Date(booking.receiptImageAt).toLocaleString("ar-MR", { dateStyle: "short", timeStyle: "short" })}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Check-in Info */}
        {booking.checkedIn ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>معلومات تسجيل الوصول</Text>
            {[
              { label: "الحالة", value: "تم تسجيل الوصول" },
              { label: "رقم المقعد", value: booking.seatNumber ?? "—" },
              { label: "تفضيل المقعد", value: booking.seatPreference === "window" ? "نافذة" : booking.seatPreference === "aisle" ? "ممر" : booking.seatPreference === "middle" ? "وسط" : "—" },
              { label: "مجموعة الصعود", value: booking.boardingGroup ?? "—" },
              { label: "ترقية المقعد", value: booking.seatUpgrade ? `نعم (+${formatMRU(booking.seatUpgradeFee ?? 0)})` : "لا" },
              { label: "اختيار الوجبة", value: booking.mealChoice === "regular" ? "عادية" : booking.mealChoice === "vegetarian" ? "نباتية" : booking.mealChoice === "halal" ? "حلال" : booking.mealChoice === "none" ? "بدون وجبة" : "—" },
            ].map((item) => (
              <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>{item.label}</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
              </View>
            ))}
            {booking.checkedInAt ? (
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 6 }}>
                وقت تسجيل الوصول: {new Date(booking.checkedInAt).toLocaleString("ar-MR", { dateStyle: "short", timeStyle: "short" })}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Resend Ticket Button */}
        {booking.status === "airline_confirmed" && booking.passengerEmail && (
          <Pressable
            style={({ pressed }) => [
              styles.resendBtn,
              { backgroundColor: "#10B981", opacity: pressed || resending ? 0.7 : 1 },
            ]}
            onPress={handleResendTicket}
            disabled={resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.resendBtnText}>
              {booking.ticketSent ? "إعادة إرسال التذكرة PDF" : "إرسال التذكرة PDF"}
            </Text>
          </Pressable>
        )}

        {/* Confirm Payment & Issue Ticket (for hold/cash/pending bookings with Duffel order) */}
        {booking.type === "flight" && booking.royalOrderId && booking.status !== "cancelled" && booking.status !== "airline_confirmed" && (
          <Pressable
            style={({ pressed }) => [{
              flexDirection: "row" as const,
              alignItems: "center" as const,
              justifyContent: "center" as const,
              gap: 10,
              margin: 16,
              marginBottom: 0,
              paddingVertical: 18,
              borderRadius: 14,
              backgroundColor: "#22C55E",
              opacity: pressed || confirmingPayment ? 0.7 : 1,
            }]}
            disabled={confirmingPayment}
            onPress={() => {
              const pnrDisplay = booking.realPnr || booking.pnr || "—";
              Alert.alert(
                "تأكيد الدفع وإصدار التذكرة",
                `هل تم استلام الدفع لهذا الحجز؟\n\nالمرجع: ${booking.reference}\nPNR: ${pnrDisplay}\nالمبلغ: ${formatMRU(booking.totalPrice ?? 0)}\n\nسيتم تأكيد الدفع عبر Duffel وإصدار التذكرة فوراً وإرسال إشعار للعميل.`,
                [
                  { text: "إلغاء", style: "cancel" },
                  {
                    text: "تأكيد الدفع والإصدار",
                    onPress: async () => {
                      setConfirmingPayment(true);
                      try {
                        const result = await payHoldOrder.mutateAsync({ orderId: booking.royalOrderId! });
                        if (result.success) {
                          const confirmedPnr = result.pnr || "";
                          const issuedTicket = result.ticketNumber || "";
                          
                          // Update booking locally
                          if (confirmedPnr) {
                            await updateBookingPnr(booking.id, confirmedPnr);
                          }
                          if (issuedTicket) {
                            await updateBookingTicketNumber(booking.id, issuedTicket);
                          }
                          await updateBookingStatus(booking.id, "confirmed");
                          
                          // Send email + push to customer
                          const email = booking.passengerEmail;
                          const name = booking.passengerName || "عميل";
                          if (email) {
                            try {
                              // Send airline confirmed ticket email
                              if (booking.flight) {
                                await sendAirlineConfirmedTicket.mutateAsync({
                                  passengerName: name,
                                  passengerEmail: email,
                                  bookingRef: booking.reference,
                                  pnr: confirmedPnr || booking.realPnr || booking.pnr,
                                  origin: booking.flight.originCode ?? booking.flight.origin ?? "",
                                  originCity: booking.flight.origin ?? "",
                                  destination: booking.flight.destinationCode ?? booking.flight.destination ?? "",
                                  destinationCity: booking.flight.destination ?? "",
                                  departureDate: booking.date ?? "",
                                  departureTime: booking.flight.departureTime ?? "",
                                  arrivalTime: booking.flight.arrivalTime ?? "",
                                  airline: booking.flight.airline ?? "",
                                  flightNumber: booking.flight.flightNumber ?? "",
                                  cabinClass: booking.flight.class ?? "ECONOMY",
                                  passengers: booking.passengers ?? 1,
                                  children: 0,
                                  totalPrice: formatMRU(booking.totalPrice ?? 0),
                                  currency: "MRU",
                                  tripType: "one-way",
                                  expoPushToken: booking.customerPushToken,
                                });
                              }
                              await updateBookingTicketSent(booking.id);
                            } catch (emailErr) {
                              console.warn("[Admin] Email notification failed:", emailErr);
                            }
                          }
                          
                          Alert.alert(
                            "\u2705 تم تأكيد الدفع وإصدار التذكرة",
                            `PNR: ${confirmedPnr || "—"}\nرقم التذكرة: ${issuedTicket || "قيد الإصدار"}\n\n${email ? "تم إرسال التذكرة للعميل عبر البريد الإلكتروني." : "لا يوجد بريد مسجّل للعميل."}`
                          );
                        } else {
                          const errMsg = result.error || "فشل تأكيد الدفع";
                          if (errMsg.includes("insufficient")) {
                            Alert.alert(
                              "\u26A0\uFE0F رصيد غير كافٍ",
                              "رصيد حساب Duffel غير كافٍ لتأكيد هذا الحجز. يرجى شحن الحساب أولاً."
                            );
                          } else if (errMsg.includes("CANCELLED")) {
                            Alert.alert("\u274C الحجز ملغى", "هذا الحجز تم إلغاؤه مسبقاً ولا يمكن تأكيده.");
                          } else {
                            Alert.alert("\u274C خطأ", errMsg);
                          }
                        }
                      } catch (err: any) {
                        console.error("[Admin] Confirm payment error:", err);
                        Alert.alert("\u274C خطأ", err?.message || "فشل الاتصال بالسيرفر");
                      } finally {
                        setConfirmingPayment(false);
                      }
                    },
                  },
                ]
              );
            }}
          >
            {confirmingPayment ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ fontSize: 22 }}>\u2705</Text>
            )}
            <View>
              <Text style={{ fontSize: 17, fontWeight: "800", color: "#FFFFFF" }}>
                تأكيد الدفع وإصدار التذكرة
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                Duffel Pay & Issue
              </Text>
            </View>
          </Pressable>
        )}

        {/* Check Ticket Issuance from Duffel */}
        {booking.type === "flight" && booking.royalOrderId && !booking.ticketNumber && (
          <Pressable
            style={({ pressed }) => [{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              margin: 16,
              marginBottom: 0,
              paddingVertical: 16,
              borderRadius: 14,
              backgroundColor: "#6366F1",
              opacity: pressed || checkingTicket ? 0.7 : 1,
            }]}
            onPress={async () => {
              setCheckingTicket(true);
              try {
                const res = await fetch(
                  `http://127.0.0.1:3000/trpc/amadeus.checkTicketIssuance?input=${encodeURIComponent(JSON.stringify({ orderId: booking.royalOrderId }))}`
                );
                const json = await res.json();
                const result = json?.result?.data;
                if (result?.success && result?.data?.tickets?.length > 0) {
                  const ticketNum = result.data.tickets[0].ticketNumber;
                  updateBookingTicketNumber(booking.id, ticketNum);
                  Alert.alert(
                    "تم العثور على التذكرة",
                    `رقم التذكرة: ${ticketNum}\nتم حفظه تلقائياً في الحجز.`
                  );
                } else {
                  Alert.alert(
                    "لم تُصدر بعد",
                    result?.data?.message || "التذكرة لم تُصدر بعد من شركة الطيران. حاول لاحقاً."
                  );
                }
              } catch (err: any) {
                Alert.alert("خطأ", err?.message || "فشل التحقق من إصدار التذكرة");
              } finally {
                setCheckingTicket(false);
              }
            }}
            disabled={checkingTicket}
          >
            {checkingTicket ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="ticket.fill" size={20} color="#FFFFFF" />
            )}
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
              التحقق من إصدار التذكرة
            </Text>
          </Pressable>
        )}

        {/* Queue to Consolidator */}
        {booking.type === "flight" && booking.royalOrderId && (
          <Pressable
            style={({ pressed }) => [{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              margin: 16,
              marginBottom: 0,
              paddingVertical: 16,
              borderRadius: 14,
              backgroundColor: "#7C3AED",
              opacity: pressed || queuingConsolidator ? 0.7 : 1,
            }]}
            onPress={async () => {
              setQueuingConsolidator(true);
              try {
                const result = await queueToConsolidatorMut.mutateAsync({ orderId: booking.royalOrderId! });
                if (result.success && result.data) {
                  Alert.alert(
                    "\u2705 Consolidator",
                    `${result.data.message}\n\nConsolidator: ${result.data.consolidatorOfficeId}\nTicketing: ${result.data.ticketingOption}`
                  );
                } else {
                  Alert.alert("\u26A0\uFE0F \u062E\u0637\u0623", (result as any).error || "\u0641\u0634\u0644 \u0625\u0631\u0633\u0627\u0644 PNR \u0625\u0644\u0649 Consolidator");
                }
              } catch (err: any) {
                Alert.alert("\u274C \u062E\u0637\u0623", err?.message || "\u0641\u0634\u0644 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0633\u064A\u0631\u0641\u0631");
              } finally {
                setQueuingConsolidator(false);
              }
            }}
            disabled={queuingConsolidator}
          >
            {queuingConsolidator ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="ticket.fill" size={20} color="#FFFFFF" />
            )}
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
              \u0625\u0631\u0633\u0627\u0644 PNR \u0625\u0644\u0649 Consolidator
            </Text>
          </Pressable>
        )}

        {/* View Booking Status (Duffel) */}
        {booking.type === "flight" && booking.royalOrderId && (
          <Pressable
            style={({ pressed }) => [{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              margin: 16,
              marginBottom: 0,
              paddingVertical: 16,
              borderRadius: 14,
              backgroundColor: "#0a7ea4",
              opacity: pressed ? 0.7 : 1,
            }]}
            onPress={() => router.push({ pathname: "/pnr-status" as any, params: { orderId: booking.royalOrderId } })}
          >
            <IconSymbol name="doc.text.magnifyingglass" size={20} color="#FFFFFF" />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
              عرض حالة الحجز
            </Text>
          </Pressable>
        )}

        {/* Cancel Booking via Duffel */}
        {booking.type === "flight" && booking.royalOrderId && booking.status !== "cancelled" && (
          <Pressable
            style={({ pressed }) => [{
              flexDirection: "row" as const,
              alignItems: "center" as const,
              justifyContent: "center" as const,
              gap: 8,
              margin: 16,
              marginBottom: 0,
              paddingVertical: 16,
              borderRadius: 14,
              backgroundColor: "#EF4444",
              opacity: pressed || cancellingOrder ? 0.7 : 1,
            }]}
            disabled={cancellingOrder}
            onPress={() => {
              Alert.alert(
                "إلغاء الحجز",
                `هل أنت متأكد من إلغاء هذا الحجز؟\n\nالمرجع: ${booking.reference}\nPNR: ${booking.realPnr || booking.pnr || "—"}\n\nسيتم إلغاء الحجز من نظام شركة الطيران وإرسال إشعار للعميل.`,
                [
                  { text: "لا", style: "cancel" },
                  {
                    text: "نعم، إلغاء",
                    style: "destructive",
                    onPress: async () => {
                      setCancellingOrder(true);
                      try {
                        const result = await cancelFlightOrder.mutateAsync({ orderId: booking.royalOrderId! });
                        if (result.success) {
                          await updateBookingStatus(booking.id, "cancelled");
                          // Send cancellation email
                          if (booking.passengerEmail) {
                            try {
                              const route = booking.flight
                                ? `${booking.flight.originCode || ""} → ${booking.flight.destinationCode || ""}`
                                : undefined;
                              await sendCancellationEmail.mutateAsync({
                                passengerEmail: booking.passengerEmail,
                                passengerName: booking.passengerName || "",
                                bookingRef: booking.reference,
                                pnr: booking.realPnr || booking.pnr,
                                route,
                                date: booking.date,
                                reason: "تم الإلغاء بواسطة المسؤول",
                                expoPushToken: booking.customerPushToken,
                              });
                            } catch {}
                          }
                          Alert.alert("تم", "تم إلغاء الحجز بنجاح وإرسال إشعار للعميل.");
                        } else {
                          Alert.alert("خطأ", result.error || "فشل إلغاء الحجز");
                        }
                      } catch (err: any) {
                        Alert.alert("خطأ", err?.message || "فشل إلغاء الحجز");
                      } finally {
                        setCancellingOrder(false);
                      }
                    },
                  },
                ]
              );
            }}
          >
            {cancellingOrder ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="xmark" size={20} color="#FFFFFF" />
            )}
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
              إلغاء الحجز من شركة الطيران
            </Text>
          </Pressable>
        )}

        {/* Send ticket for non-airline_confirmed if email exists */}
        {booking.status !== "airline_confirmed" && booking.passengerEmail && (
          <Pressable
            style={({ pressed }) => [
              styles.resendBtn,
              { backgroundColor: "#1B2B5E", opacity: pressed || resending ? 0.7 : 1 },
            ]}
            onPress={handleResendTicket}
            disabled={resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="paperplane.fill" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.resendBtnText}>إرسال تذكرة للعميل</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  ticketSentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10B98130",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketSentIcon: { fontSize: 14 },
  ticketSentText: { fontSize: 11, fontWeight: "700", color: "#10B981" },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: "700", flex: 1 },
  refText: { fontSize: 12, fontWeight: "600" },
  ticketSentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
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
  mainTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  mainSubtitle: { fontSize: 14 },
  routeBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  routeTime: { fontSize: 20, fontWeight: "700" },
  routeCode: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  routeCity: { fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 14 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: "600", textAlign: "right", flex: 1, marginLeft: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalValue: { fontSize: 22, fontWeight: "700" },
  pnrBox: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  pnrLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  pnrValue: { fontSize: 34, fontWeight: "800", letterSpacing: 6 },
  pnrHint: { fontSize: 11, marginTop: 6, textAlign: "center" },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 16,
    marginBottom: 0,
    paddingVertical: 16,
    borderRadius: 14,
  },
  resendBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
