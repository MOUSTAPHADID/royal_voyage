import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAdmin } from "@/lib/admin-context";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";

const T = {
  ar: { title: "تفاصيل الحجز", pnr: "رقم PNR", ref: "المرجع", passenger: "المسافر", route: "المسار", price: "السعر الإجمالي", status: "الحالة", confirmed: "مؤكد", pending: "معلق", setPnr: "تعيين PNR", pnrPlaceholder: "أدخل رقم PNR...", save: "حفظ", cancel: "إلغاء", mru: "أوق", back: "رجوع", editPnr: "تعديل PNR", email: "البريد الإلكتروني", phone: "الهاتف", notFound: "الحجز غير موجود", loading: "جاري التحميل..." },
  fr: { title: "Détails réservation", pnr: "PNR", ref: "Référence", passenger: "Passager", route: "Itinéraire", price: "Prix total", status: "Statut", confirmed: "Confirmé", pending: "En attente", setPnr: "Définir PNR", pnrPlaceholder: "Entrer le PNR...", save: "Enregistrer", cancel: "Annuler", mru: "MRU", back: "Retour", editPnr: "Modifier PNR", email: "E-mail", phone: "Téléphone", notFound: "Réservation introuvable", loading: "Chargement..." },
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { language } = useAdmin();
  const t = T[language];

  const [editingPnr, setEditingPnr] = useState(false);
  const [pnrInput, setPnrInput] = useState("");

  const { data: bookingsData, isLoading, refetch } = trpc.bookingContacts.list.useQuery();
  const updatePnrMutation = trpc.bookingContacts.updatePnr.useMutation({
    onSuccess: () => { setEditingPnr(false); refetch(); },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const booking = bookingsData?.find(b => b.duffelOrderId === id || String(b.id) === id);

  const handleSavePnr = () => {
    if (!pnrInput.trim() || !booking) return;
    updatePnrMutation.mutate({ id: booking.id, pnr: pnrInput.trim().toUpperCase() });
  };

  if (isLoading) return (
    <ScreenContainer><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></ScreenContainer>
  );

  if (!booking) return (
    <ScreenContainer>
      <View style={styles.center}>
        <IconSymbol name="xmark.circle.fill" size={48} color={colors.error} />
        <Text style={[styles.notFound, { color: colors.muted }]}>{t.notFound}</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.backBtnText}>{t.back}</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );

  const isConfirmed = !!booking.pnr;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={[styles.statusPill, { backgroundColor: isConfirmed ? "#22C55E30" : "#F59E0B30" }]}>
          <Text style={[styles.statusPillText, { color: isConfirmed ? "#22C55E" : "#F59E0B" }]}>
            {isConfirmed ? t.confirmed : t.pending}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { label: t.ref, value: (booking as any).bookingRef ?? booking.duffelOrderId },
            { label: t.passenger, value: (booking as any).passengerName ?? "—" },
            { label: t.email, value: (booking as any).email ?? "—" },
            { label: t.phone, value: (booking as any).phone ?? "—" },
            { label: t.route, value: (booking as any).routeSummary ?? "—" },
            { label: t.price, value: (booking as any).totalPrice ? `${parseFloat((booking as any).totalPrice).toLocaleString()} ${t.mru}` : "—" },
          ].map(row => (
            <View key={row.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>{row.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]} selectable>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* PNR Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.pnrHeader}>
            <Text style={[styles.pnrTitle, { color: colors.foreground }]}>{t.pnr}</Text>
            {booking.pnr && !editingPnr && (
              <TouchableOpacity onPress={() => { setPnrInput(booking.pnr ?? ""); setEditingPnr(true); }}>
                <IconSymbol name="pencil" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {booking.pnr && !editingPnr ? (
            <View style={[styles.pnrBadge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.pnrValue, { color: colors.primary }]}>{booking.pnr}</Text>
            </View>
          ) : editingPnr ? (
            <View style={styles.pnrEdit}>
              <TextInput
                style={[styles.pnrInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                value={pnrInput}
                onChangeText={setPnrInput}
                placeholder={t.pnrPlaceholder}
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoFocus
              />
              <View style={styles.pnrActions}>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSavePnr} disabled={updatePnrMutation.isPending}>
                  {updatePnrMutation.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{t.save}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setEditingPnr(false)}>
                  <Text style={[styles.cancelBtnText, { color: colors.muted }]}>{t.cancel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={[styles.setPnrBtn, { backgroundColor: colors.primary }]} onPress={() => { setPnrInput(""); setEditingPnr(true); }}>
              <IconSymbol name="plus.circle.fill" size={18} color="#fff" />
              <Text style={styles.setPnrBtnText}>{t.setPnr}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 16, gap: 12 },
  backArrow: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800", flex: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 12, fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  notFound: { fontSize: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  backBtnText: { color: "#fff", fontWeight: "600" },
  content: { padding: 16, gap: 16 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 14, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  pnrHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 8 },
  pnrTitle: { fontSize: 15, fontWeight: "700" },
  pnrBadge: { margin: 16, marginTop: 4, padding: 14, borderRadius: 12, alignItems: "center" },
  pnrValue: { fontSize: 22, fontWeight: "800", letterSpacing: 2 },
  pnrEdit: { padding: 16, paddingTop: 4, gap: 10 },
  pnrInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, fontWeight: "700", letterSpacing: 1 },
  pnrActions: { flexDirection: "row", gap: 10 },
  saveBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700" },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  cancelBtnText: { fontWeight: "600" },
  setPnrBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 16, marginTop: 4, paddingVertical: 12, borderRadius: 12 },
  setPnrBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
