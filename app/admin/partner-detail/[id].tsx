import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useAdmin } from "@/lib/admin-context";

export default function PartnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { language } = useAdmin();
  const t = (ar: string, fr: string) => language === "ar" ? ar : fr;

  const partnerId = parseInt(id ?? "0", 10);

  const { data: partner, isLoading: loadingPartner } = trpc.businessAccounts.getById.useQuery(
    { id: partnerId },
    { enabled: !!partnerId }
  );

  const { data: allBookings, isLoading: loadingBookings } = trpc.bookingContacts.list.useQuery();

  // Filter bookings for this partner
  const partnerBookings = allBookings?.filter((b: any) => b.businessAccountId === partnerId) ?? [];

  const totalRevenue = partnerBookings.reduce((sum: number, b: any) => {
    const price = parseFloat(b.totalAmount ?? b.price ?? "0");
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  const commissionRate = parseFloat(partner?.commissionPercent ?? "0");
  const totalCommission = (totalRevenue * commissionRate) / 100;

  const statusColor = (status: string) => {
    if (status === "confirmed") return colors.success;
    if (status === "cancelled") return colors.error;
    return colors.warning;
  };

  const statusLabel = (status: string) => {
    const map: Record<string, [string, string]> = {
      confirmed: ["مؤكد", "Confirmé"],
      cancelled: ["ملغى", "Annulé"],
      pending: ["قيد الانتظار", "En attente"],
    };
    return map[status] ? t(map[status][0], map[status][1]) : status;
  };

  if (loadingPartner) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!partner) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>{t("الشريك غير موجود", "Partenaire introuvable")}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} color="#fff" />
          </Pressable>
          <View style={styles.headerContent}>
            {partner.logoUrl ? (
              <View style={styles.logoCircle}>
                <Image source={{ uri: partner.logoUrl }} style={styles.logoImage} resizeMode="cover" />
              </View>
            ) : (
              <View style={[styles.logoCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Text style={styles.logoText}>{partner.companyName?.charAt(0)?.toUpperCase() ?? "P"}</Text>
              </View>
            )}
            <Text style={styles.companyName}>{partner.companyName}</Text>
            <Text style={styles.contactName}>{partner.contactName}</Text>
            <View style={[styles.statusBadge, {
              backgroundColor: partner.status === "active" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"
            }]}>
              <Text style={[styles.statusText, {
                color: partner.status === "active" ? "#4ADE80" : "#F87171"
              }]}>
                {partner.status === "active" ? t("نشط", "Actif") : partner.status === "suspended" ? t("موقوف", "Suspendu") : t("مغلق", "Fermé")}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{partnerBookings.length}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{t("الحجوزات", "Réservations")}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{totalRevenue.toFixed(0)} MRU</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{t("الإيرادات", "Revenus")}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{totalCommission.toFixed(0)} MRU</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>{t("العمولة", "Commission")}</Text>
          </View>
        </View>

        {/* Partner Info */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t("معلومات الشريك", "Informations").toUpperCase()}</Text>
          {[
            { icon: "envelope.fill", label: t("البريد الإلكتروني", "Email"), value: partner.contactEmail ?? "—" },
            { icon: "phone.fill", label: t("الهاتف", "Téléphone"), value: partner.contactPhone ?? "—" },
            { icon: "mappin.fill", label: t("العنوان", "Adresse"), value: [partner.city, partner.country].filter(Boolean).join(", ") || "—" },
            { icon: "percent", label: t("نسبة العمولة", "Commission"), value: `${partner.commissionPercent ?? 0}%` },
            { icon: "creditcard.fill", label: t("حد الائتمان", "Crédit"), value: partner.creditLimit ? `${partner.creditLimit} MRU` : "—" },
          ].map((row, i) => (
            <View key={i} style={[styles.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + "12" }]}>
                <IconSymbol name={row.icon as any} size={16} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>{row.label}</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{row.value}</Text>
              </View>
            </View>
          ))}
          {partner.notes ? (
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + "12" }]}>
                <IconSymbol name="doc.text.fill" size={16} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>{t("ملاحظات", "Notes")}</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{partner.notes}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Bookings List */}
        <View style={styles.bookingsSection}>
          <Text style={[styles.bookingsSectionTitle, { color: colors.foreground }]}>
            {t("سجل الحجوزات", "Historique des réservations")} ({partnerBookings.length})
          </Text>
          {loadingBookings ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
          ) : partnerBookings.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="doc.text.fill" size={32} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {t("لا توجد حجوزات بعد", "Aucune réservation")}
              </Text>
            </View>
          ) : (
            partnerBookings.map((booking: any, index: number) => (
              <View key={booking.id ?? index} style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.bookingHeader}>
                  <Text style={[styles.bookingRef, { color: colors.primary }]}>
                    {booking.pnr ?? booking.duffelOrderId?.slice(0, 8) ?? `#${booking.id}`}
                  </Text>
                  <View style={[styles.bookingStatus, { backgroundColor: statusColor(booking.status ?? "pending") + "20" }]}>
                    <Text style={[styles.bookingStatusText, { color: statusColor(booking.status ?? "pending") }]}>
                      {statusLabel(booking.status ?? "pending")}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.bookingPassenger, { color: colors.foreground }]}>
                  {booking.passengerName ?? booking.firstName ?? t("مسافر", "Passager")}
                </Text>
                <View style={styles.bookingFooter}>
                  <Text style={[styles.bookingRoute, { color: colors.muted }]}>
                    {booking.origin ?? "—"} → {booking.destination ?? "—"}
                  </Text>
                  <Text style={[styles.bookingPrice, { color: colors.success }]}>
                    {booking.totalAmount ?? booking.price ?? "—"} {booking.currency ?? "MRU"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 16, paddingBottom: 24, paddingHorizontal: 16 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  headerContent: { alignItems: "center", gap: 6 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logoText: { fontSize: 28, fontWeight: "700", color: "#fff" },
  logoImage: { width: 72, height: 72, borderRadius: 36 },
  companyName: { fontSize: 20, fontWeight: "700", color: "#fff", textAlign: "center" },
  contactName: { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 4 },
  statusText: { fontSize: 12, fontWeight: "600" },
  statsRow: { flexDirection: "row", marginHorizontal: 16, marginTop: 16, borderRadius: 12, borderWidth: 1, padding: 16 },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, marginVertical: 4 },
  section: { margin: 16, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  sectionTitle: { fontSize: 11, fontWeight: "600", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  infoIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "500" },
  bookingsSection: { paddingHorizontal: 16 },
  bookingsSectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  emptyBox: { alignItems: "center", justifyContent: "center", padding: 32, borderRadius: 12, borderWidth: 1, gap: 8 },
  emptyText: { fontSize: 14 },
  bookingCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  bookingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  bookingRef: { fontSize: 14, fontWeight: "700", fontFamily: "monospace" },
  bookingStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  bookingStatusText: { fontSize: 11, fontWeight: "600" },
  bookingPassenger: { fontSize: 14, fontWeight: "500", marginBottom: 6 },
  bookingFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bookingRoute: { fontSize: 12 },
  bookingPrice: { fontSize: 14, fontWeight: "700" },
});
