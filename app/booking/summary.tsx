import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { FLIGHTS, HOTELS } from "@/lib/mock-data";
import { formatMRU, toMRU } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";

export default function BookingSummaryScreen() {
  const router = useRouter();
  const colors = useColors();
  const { fmt } = useCurrency();
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

  const adultCount = parseInt(params.passengers ?? params.guests ?? "1", 10);
  const childCount = parseInt(params.children ?? "0", 10);
  const infantCount = parseInt(params.infants ?? "0", 10);

  const passedPrice = parseFloat(params.price ?? "0");
  const passedRoomPrice = parseFloat(params.roomPrice ?? "0");
  const totalMRU = isFlight
    ? passedPrice
    : passedRoomPrice > 0 ? passedRoomPrice : passedPrice;

  const unitPrice = isFlight ? (flight?.price ?? 0) : (hotel?.pricePerNight ?? 0);
  const mockTotalUSD = (unitPrice * adultCount) + (Math.round(unitPrice * 0.75) * childCount);
  const total = totalMRU > 0 ? totalMRU : Math.round(mockTotalUSD * 39.5);

  const passengerName = `${params.firstName ?? ""} ${params.lastName ?? ""}`.trim();

  const handleContinueToPayment = () => {
    router.push({
      pathname: "/booking/payment" as any,
      params: {
        type: params.type,
        id: params.id,
        roomId: params.roomId,
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        phone: params.phone,
        passport: params.passport,
        nationality: params.nationality,
        dateOfBirth: params.dateOfBirth,
        price: params.price,
        currency: params.currency,
        priceCurrency: params.priceCurrency,
        airline: params.airline,
        flightNumber: params.flightNumber,
        origin: params.origin,
        destination: params.destination,
        originCode: params.originCode,
        destinationCode: params.destinationCode,
        departureTime: params.departureTime,
        arrivalTime: params.arrivalTime,
        duration: params.duration,
        cabinClass: params.cabinClass,
        passengers: params.passengers,
        children: params.children,
        infants: params.infants,
        tripType: params.tripType,
        returnDate: params.returnDate,
        hotelName: params.hotelName,
        hotelCity: params.hotelCity,
        hotelCountry: params.hotelCountry,
        hotelStars: params.hotelStars,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: params.guests,
        roomType: params.roomType,
        roomPrice: params.roomPrice,
      },
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("ar-SA", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>ملخص الحجز</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* نوع الحجز */}
        <View style={[styles.typeTag, { backgroundColor: isFlight ? "#0EA5E9" : "#8B5CF6" }]}>
          <Text style={styles.typeTagText}>
            {isFlight ? "✈️ حجز رحلة طيران" : "🏨 حجز فندق"}
          </Text>
        </View>

        {/* تفاصيل الرحلة / الفندق */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>
            {isFlight ? "تفاصيل الرحلة" : "تفاصيل الفندق"}
          </Text>

          {isFlight ? (
            <>
              <SummaryRow
                label="شركة الطيران"
                value={params.airline ?? flight?.airline ?? "—"}
                colors={colors}
              />
              <SummaryRow
                label="رقم الرحلة"
                value={params.flightNumber ?? flight?.flightNumber ?? "—"}
                colors={colors}
              />
              <SummaryRow
                label="المسار"
                value={`${params.origin ?? flight?.origin ?? ""} → ${params.destination ?? flight?.destination ?? ""}`}
                colors={colors}
              />
              <SummaryRow
                label="الكود"
                value={`${params.originCode ?? flight?.originCode ?? ""} → ${params.destinationCode ?? flight?.destinationCode ?? ""}`}
                colors={colors}
              />
              <SummaryRow
                label="المغادرة"
                value={params.departureTime ?? flight?.departureTime ?? "—"}
                colors={colors}
              />
              <SummaryRow
                label="الوصول"
                value={params.arrivalTime ?? flight?.arrivalTime ?? "—"}
                colors={colors}
              />
              <SummaryRow
                label="المدة"
                value={params.duration ?? flight?.duration ?? "—"}
                colors={colors}
              />
              <SummaryRow
                label="الدرجة"
                value={params.cabinClass ?? "Economy"}
                colors={colors}
              />
              <SummaryRow
                label="نوع الرحلة"
                value={params.tripType === "roundtrip" ? "ذهاب وعودة" : "ذهاب فقط"}
                colors={colors}
              />
              {params.returnDate && (
                <SummaryRow
                  label="تاريخ العودة"
                  value={formatDate(params.returnDate)}
                  colors={colors}
                />
              )}
            </>
          ) : (
            <>
              <SummaryRow
                label="الفندق"
                value={params.hotelName ?? hotel?.name ?? "—"}
                colors={colors}
              />
              <SummaryRow
                label="المدينة"
                value={params.hotelCity ?? hotel?.city ?? "—"}
                colors={colors}
              />
              <SummaryRow
                label="الدولة"
                value={params.hotelCountry ?? hotel?.country ?? "—"}
                colors={colors}
              />
              <SummaryRow
                label="التصنيف"
                value={"⭐".repeat(parseInt(params.hotelStars ?? "3", 10))}
                colors={colors}
              />
              <SummaryRow
                label="تسجيل الدخول"
                value={formatDate(params.checkIn)}
                colors={colors}
              />
              <SummaryRow
                label="تسجيل الخروج"
                value={formatDate(params.checkOut)}
                colors={colors}
              />
              <SummaryRow
                label="نوع الغرفة"
                value={params.roomType ?? "Standard"}
                colors={colors}
              />
            </>
          )}
        </View>

        {/* بيانات المسافر */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>بيانات المسافر</Text>
          <SummaryRow label="الاسم الكامل" value={passengerName} colors={colors} />
          <SummaryRow label="البريد الإلكتروني" value={params.email ?? "—"} colors={colors} />
          {params.phone && <SummaryRow label="الهاتف" value={params.phone} colors={colors} />}
          {params.passport && <SummaryRow label="رقم الجواز" value={params.passport} colors={colors} />}
          {params.nationality && <SummaryRow label="الجنسية" value={params.nationality} colors={colors} />}
          {params.dateOfBirth && <SummaryRow label="تاريخ الميلاد" value={formatDate(params.dateOfBirth)} colors={colors} />}
        </View>

        {/* ملخص التكلفة */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>ملخص التكلفة</Text>
          <SummaryRow
            label={`البالغين (${adultCount})`}
            value={adultCount.toString()}
            colors={colors}
          />
          {childCount > 0 && (
            <SummaryRow
              label={`الأطفال (${childCount})`}
              value={childCount.toString()}
              colors={colors}
            />
          )}
          {infantCount > 0 && (
            <SummaryRow
              label={`الرضع (${infantCount})`}
              value={infantCount.toString()}
              colors={colors}
            />
          )}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>الإجمالي</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {fmt(total)}
            </Text>
          </View>
        </View>

        {/* تنبيه */}
        <View style={[styles.noteCard, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
          <Text style={styles.noteIcon}>⚠️</Text>
          <Text style={styles.noteText}>
            يرجى مراجعة جميع البيانات بعناية قبل المتابعة. لن يمكن تعديل البيانات بعد إتمام الدفع.
          </Text>
        </View>

        {/* أزرار */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleContinueToPayment}
          >
            <Text style={styles.continueBtnText}>المتابعة إلى الدفع</Text>
            <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: colors.foreground }]}>تعديل البيانات</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SummaryRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={summaryStyles.row}>
      <Text style={[summaryStyles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[summaryStyles.value, { color: colors.foreground }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1.5,
    textAlign: "right",
  },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  typeTag: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeTagText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1.5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 18,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  backButton: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
