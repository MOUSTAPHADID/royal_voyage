import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAdmin } from "@/lib/admin-context";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";

const T = {
  ar: {
    title: "تفاصيل الحجز",
    pnr: "رقم PNR",
    ref: "المرجع",
    passenger: "المسافر",
    route: "المسار",
    price: "السعر الإجمالي",
    status: "الحالة",
    confirmed: "مؤكد",
    pending: "في الانتظار",
    setPnr: "تعيين PNR",
    pnrPlaceholder: "أدخل رقم PNR...",
    save: "حفظ",
    cancel: "إلغاء",
    cancelBooking: "إلغاء الحجز",
    cancelConfirmTitle: "تأكيد الإلغاء",
    cancelConfirmMsg: "هل أنت متأكد من إلغاء هذا الحجز؟ سيتم إلغاؤه من Amadeus وحذفه من السجلات.",
    cancelConfirmYes: "نعم، إلغاء",
    cancelConfirmNo: "لا",
    cancelSuccess: "تم إلغاء الحجز بنجاح",
    cancelError: "فشل إلغاء الحجز",
    mru: "أوق",
    back: "رجوع",
    editPnr: "تعديل PNR",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    notFound: "الحجز غير موجود",
    loading: "جاري التحميل...",
    ticketStatus: "حالة التذكرة",
    checkTicket: "التحقق من التذكرة",
    checking: "جاري التحقق...",
    ticketIssued: "تم إصدار التذكرة",
    ticketPending: "التذكرة في الانتظار",
    ticketCancelled: "التذكرة ملغاة",
    orderId: "رقم الطلب",
    createdAt: "تاريخ الحجز",
    sendTicket: "إرسال التذكرة للعميل",
    sendTicketSuccess: "تم إرسال التذكرة بنجاح",
    sendTicketError: "فشل إرسال التذكرة",
  },
  fr: {
    title: "Détails réservation",
    pnr: "PNR",
    ref: "Référence",
    passenger: "Passager",
    route: "Itinéraire",
    price: "Prix total",
    status: "Statut",
    confirmed: "Confirmé",
    pending: "En attente",
    setPnr: "Définir PNR",
    pnrPlaceholder: "Entrer le PNR...",
    save: "Enregistrer",
    cancel: "Annuler",
    cancelBooking: "Annuler la réservation",
    cancelConfirmTitle: "Confirmer l'annulation",
    cancelConfirmMsg: "Voulez-vous annuler cette réservation? Elle sera annulée sur Amadeus et supprimée des enregistrements.",
    cancelConfirmYes: "Oui, annuler",
    cancelConfirmNo: "Non",
    cancelSuccess: "Réservation annulée avec succès",
    cancelError: "Échec de l'annulation",
    mru: "MRU",
    back: "Retour",
    editPnr: "Modifier PNR",
    email: "E-mail",
    phone: "Téléphone",
    notFound: "Réservation introuvable",
    loading: "Chargement...",
    ticketStatus: "Statut du billet",
    checkTicket: "Vérifier le billet",
    checking: "Vérification...",
    ticketIssued: "Billet émis",
    ticketPending: "Billet en attente",
    ticketCancelled: "Billet annulé",
    orderId: "ID commande",
    createdAt: "Date de réservation",
    sendTicket: "Envoyer le billet au client",
    sendTicketSuccess: "Billet envoyé avec succès",
    sendTicketError: "Échec de l'envoi du billet",
  },
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { language } = useAdmin();
  const t = T[language];

  const [editingPnr, setEditingPnr] = useState(false);
  const [pnrInput, setPnrInput] = useState("");
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);
  const [checkingTicket, setCheckingTicket] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  const { data: bookingsData, isLoading, refetch } = trpc.bookingContacts.list.useQuery();
  const updatePnrMutation = trpc.bookingContacts.updatePnr.useMutation({
    onSuccess: () => { setEditingPnr(false); refetch(); },
    onError: (err) => Alert.alert("Error", err.message),
  });
  const cancelAndDeleteMutation = trpc.bookingContacts.cancelAndDelete.useMutation({
    onSuccess: () => {
      Alert.alert("✅", t.cancelSuccess, [{ text: "OK", onPress: () => router.back() }]);
    },
    onError: (err) => Alert.alert(t.cancelError, err.message),
  });
  const checkTicketMutation = trpc.duffel.checkTicketIssuance.useMutation();
  const sendTicketMutation = trpc.email.sendFlightTicket.useMutation();
  const confirmPaymentMutation = trpc.bookingContacts.confirmPayment.useMutation({
    onSuccess: () => {
      setShowPaymentMethods(false);
      refetch();
      Alert.alert("✅", language === "ar" ? "تم تأكيد الدفع وإرسال بريد التأكيد للعميل" : "Paiement confirmé et email envoyé au client");
    },
    onError: (err) => Alert.alert("❌", err.message),
  });

  const booking = bookingsData?.find(b => b.duffelOrderId === id || String(b.id) === id);

  const handleSavePnr = () => {
    if (!pnrInput.trim() || !booking) return;
    updatePnrMutation.mutate({ id: booking.id, pnr: pnrInput.trim().toUpperCase() });
  };

  const handleCancelBooking = () => {
    if (!booking) return;
    Alert.alert(t.cancelConfirmTitle, t.cancelConfirmMsg, [
      { text: t.cancelConfirmNo, style: "cancel" },
      {
        text: t.cancelConfirmYes,
        style: "destructive",
        onPress: () => {
          cancelAndDeleteMutation.mutate({
            id: booking.id,
            duffelOrderId: booking.duffelOrderId,
          });
        },
      },
    ]);
  };

  const handleCheckTicket = async () => {
    if (!booking?.duffelOrderId) return;
    setCheckingTicket(true);
    try {
      const result = await checkTicketMutation.mutateAsync({ orderId: booking.duffelOrderId });
      if ((result as any).issued) {
        setTicketStatus("issued");
      } else if ((result as any).cancelled) {
        setTicketStatus("cancelled");
      } else {
        setTicketStatus("pending");
      }
    } catch {
      setTicketStatus("pending");
    } finally {
      setCheckingTicket(false);
    }
  };

  const handleSendTicket = () => {
    if (!booking) return;
    const email = (booking as any).passengerEmail;
    if (!email) {
      Alert.alert("تنبيه", "لا يوجد بريد إلكتروني للمسافر");
      return;
    }
    const routeParts = ((booking as any).routeSummary ?? "").split("→");
    const origin = routeParts[0]?.trim() ?? "—";
    const destination = routeParts[1]?.trim() ?? "—";
    sendTicketMutation.mutate(
      {
        passengerName: (booking as any).passengerName ?? "Passenger",
        passengerEmail: email,
        bookingRef: (booking as any).bookingRef ?? booking.duffelOrderId,
        pnr: booking.pnr ?? "PENDING",
        origin,
        originCity: origin,
        destination,
        destinationCity: destination,
        departureDate: "—",
        departureTime: "—",
        arrivalTime: "—",
        airline: "—",
        flightNumber: "—",
        cabinClass: "Economy",
        passengers: 1,
        totalPrice: (booking as any).totalPrice ?? "0",
        currency: (booking as any).currency ?? "MRU",
      },
      {
        onSuccess: () => Alert.alert("✅", t.sendTicketSuccess),
        onError: (err) => Alert.alert(t.sendTicketError, err.message),
      }
    );
  };

  if (isLoading) return (
    <ScreenContainer><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></ScreenContainer>
  );

  if (!booking) return (
    <ScreenContainer>
      <View style={styles.center}>
        <IconSymbol name="xmark.circle.fill" size={48} color="#EF4444" />
        <Text style={[styles.notFound, { color: colors.muted }]}>{t.notFound}</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.backBtnText}>{t.back}</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );

  const isConfirmed = !!booking.pnr;
  const isPaymentConfirmed = (booking as any).paymentStatus === "confirmed";
  const paymentConfirmedAt = (booking as any).paymentConfirmedAt
    ? new Date((booking as any).paymentConfirmedAt).toLocaleString("ar-MR", { dateStyle: "short", timeStyle: "short" })
    : null;
  const paymentMethods = [
    { key: "cash", label: language === "ar" ? "نقداً" : "Espèces" },
    { key: "bank_transfer", label: language === "ar" ? "تحويل بنكي" : "Virement bancaire" },
    { key: "bankily", label: "Bankily" },
    { key: "masrvi", label: "Masrvi" },
    { key: "sedad", label: "Sedad" },
    { key: "multicaixa", label: "Multicaixa Express" },
    { key: "stripe", label: "Stripe" },
  ];
  const createdDate = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })
    : "—";

  const ticketStatusColor = ticketStatus === "issued" ? "#22C55E" : ticketStatus === "cancelled" ? "#EF4444" : "#F59E0B";
  const ticketStatusLabel = ticketStatus === "issued" ? t.ticketIssued : ticketStatus === "cancelled" ? t.ticketCancelled : t.ticketPending;

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
            { label: t.orderId, value: booking.duffelOrderId },
            { label: t.passenger, value: (booking as any).passengerName ?? "—" },
            { label: t.email, value: (booking as any).passengerEmail ?? "—" },
            { label: t.route, value: (booking as any).routeSummary ?? "—" },
            { label: t.price, value: (booking as any).totalPrice ? `${parseFloat((booking as any).totalPrice).toLocaleString()} ${t.mru}` : "—" },
            { label: t.createdAt, value: createdDate },
          ].map(row => (
            <View key={row.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>{row.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]} selectable numberOfLines={1}>{row.value}</Text>
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

        {/* Ticket Status Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.pnrHeader}>
            <Text style={[styles.pnrTitle, { color: colors.foreground }]}>{t.ticketStatus}</Text>
            {ticketStatus && (
              <View style={[styles.ticketStatusBadge, { backgroundColor: ticketStatusColor + "20" }]}>
                <Text style={[styles.ticketStatusText, { color: ticketStatusColor }]}>{ticketStatusLabel}</Text>
              </View>
            )}
          </View>
          <View style={styles.ticketActions}>
            <TouchableOpacity
              style={[styles.checkTicketBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
              onPress={handleCheckTicket}
              disabled={checkingTicket}
            >
              {checkingTicket ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <IconSymbol name="checkmark.seal.fill" size={18} color={colors.primary} />
              )}
              <Text style={[styles.checkTicketText, { color: colors.primary }]}>
                {checkingTicket ? t.checking : t.checkTicket}
              </Text>
            </TouchableOpacity>

            {(booking as any).passengerEmail && (
              <TouchableOpacity
                style={[styles.sendTicketBtn, { backgroundColor: "#22C55E15", borderColor: "#22C55E" }]}
                onPress={handleSendTicket}
                disabled={sendTicketMutation.isPending}
              >
                {sendTicketMutation.isPending ? (
                  <ActivityIndicator size="small" color="#22C55E" />
                ) : (
                  <IconSymbol name="paperplane.fill" size={18} color="#22C55E" />
                )}
                <Text style={[styles.checkTicketText, { color: "#22C55E" }]}>{t.sendTicket}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Payment Confirmation Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: isPaymentConfirmed ? "#22C55E" : colors.border }]}>
          <View style={styles.pnrHeader}>
            <Text style={[styles.pnrTitle, { color: colors.foreground }]}>
              {language === "ar" ? "حالة الدفع" : "Statut du paiement"}
            </Text>
            <View style={[styles.ticketStatusBadge, { backgroundColor: isPaymentConfirmed ? "#22C55E20" : "#F59E0B20" }]}>
              <Text style={[styles.ticketStatusText, { color: isPaymentConfirmed ? "#22C55E" : "#F59E0B" }]}>
                {isPaymentConfirmed
                  ? (language === "ar" ? "مدفوع" : "Payé")
                  : (language === "ar" ? "في الانتظار" : "En attente")}
              </Text>
            </View>
          </View>

          {isPaymentConfirmed ? (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 6 }}>
              {(booking as any).paymentMethod && (
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {language === "ar" ? "طريقة الدفع: " : "Méthode: "}
                  <Text style={{ color: colors.foreground, fontWeight: "700" }}>{(booking as any).paymentMethod}</Text>
                </Text>
              )}
              {paymentConfirmedAt && (
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {language === "ar" ? "تاريخ التأكيد: " : "Confirmé le: "}
                  <Text style={{ color: "#22C55E", fontWeight: "600" }}>{paymentConfirmedAt}</Text>
                </Text>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                <IconSymbol name="checkmark.seal.fill" size={16} color="#22C55E" />
                <Text style={{ color: "#22C55E", fontSize: 13, fontWeight: "700" }}>
                  {language === "ar" ? "تم إرسال بريد التأكيد للعميل" : "Email de confirmation envoyé"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ padding: 16, paddingTop: 4, gap: 10 }}>
              {!showPaymentMethods ? (
                <TouchableOpacity
                  style={[styles.checkTicketBtn, { backgroundColor: "#22C55E15", borderColor: "#22C55E" }]}
                  onPress={() => setShowPaymentMethods(true)}
                >
                  <IconSymbol name="checkmark.seal.fill" size={18} color="#22C55E" />
                  <Text style={[styles.checkTicketText, { color: "#22C55E" }]}>
                    {language === "ar" ? "تأكيد الدفع" : "Confirmer le paiement"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ gap: 8 }}>
                  <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 4 }}>
                    {language === "ar" ? "اختر طريقة الدفع:" : "Choisir la méthode de paiement:"}
                  </Text>
                  {paymentMethods.map(pm => (
                    <TouchableOpacity
                      key={pm.key}
                      style={[styles.checkTicketBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
                      onPress={() => {
                        if (!booking) return;
                        confirmPaymentMutation.mutate({
                          duffelOrderId: booking.duffelOrderId,
                          paymentMethod: pm.label,
                        });
                      }}
                      disabled={confirmPaymentMutation.isPending}
                    >
                      {confirmPaymentMutation.isPending ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={[styles.checkTicketText, { color: colors.primary }]}>{pm.label}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => setShowPaymentMethods(false)}
                  >
                    <Text style={[styles.cancelBtnText, { color: colors.muted }]}>
                      {language === "ar" ? "إلغاء" : "Annuler"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Cancel Booking */}
        <TouchableOpacity
          style={[styles.cancelBookingBtn, { borderColor: "#EF4444" }]}
          onPress={handleCancelBooking}
          disabled={cancelAndDeleteMutation.isPending}
        >
          {cancelAndDeleteMutation.isPending ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <IconSymbol name="xmark.circle.fill" size={18} color="#EF4444" />
          )}
          <Text style={[styles.cancelBookingText, { color: "#EF4444" }]}>{t.cancelBooking}</Text>
        </TouchableOpacity>
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
  content: { padding: 16, gap: 16, paddingBottom: 32 },
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
  ticketStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  ticketStatusText: { fontSize: 12, fontWeight: "700" },
  ticketActions: { padding: 16, paddingTop: 4, gap: 10 },
  checkTicketBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  sendTicketBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  checkTicketText: { fontWeight: "700", fontSize: 14 },
  cancelBookingBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 8 },
  cancelBookingText: { fontWeight: "700", fontSize: 15 },
  errorColor: { color: "#EF4444" },
});
