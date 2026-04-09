import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAdmin } from "@/lib/admin-context";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";

const T = {
  ar: {
    title: "إدارة الشركاء",
    add: "إضافة",
    noPartners: "لا يوجد شركاء",
    noPartnersHint: "اضغط + لإضافة شريك جديد",
    searchPlaceholder: "بحث بالاسم أو البريد أو الهاتف...",
    results: "نتيجة",
    filterAll: "الكل",
    active: "نشط",
    suspended: "موقوف",
    closed: "مغلق",
    details: "التفاصيل",
    commission: "العمولة",
    credit: "الائتمان",
    balance: "الرصيد",
    bookings: "الحجوزات",
    revenue: "الإيرادات",
    mru: "أوق",
    edit: "تعديل",
    delete: "حذف",
    confirmDelete: "هل تريد حذف هذا الشريك؟",
    yes: "نعم",
    no: "لا",
    // Form
    formAdd: "إضافة شريك",
    formEdit: "تعديل الشريك",
    companyName: "اسم الشركة *",
    contactName: "اسم المسؤول *",
    contactEmail: "البريد الإلكتروني",
    contactPhone: "الهاتف",
    commissionPercent: "نسبة العمولة (%)",
    creditLimit: "حد الائتمان (أوق)",
    address: "العنوان",
    city: "المدينة",
    country: "الدولة",
    website: "الموقع الإلكتروني",
    notes: "ملاحظات",
    status: "الحالة",
    save: "حفظ",
    cancel: "إلغاء",
    saving: "جارٍ الحفظ...",
    required: "الحقول المطلوبة غير مكتملة",
  },
  fr: {
    title: "Gestion des Partenaires",
    add: "Ajouter",
    noPartners: "Aucun partenaire",
    noPartnersHint: "Appuyez sur + pour ajouter",
    searchPlaceholder: "Rechercher par nom, email ou tél...",
    results: "résultat(s)",
    filterAll: "Tous",
    active: "Actif",
    suspended: "Suspendu",
    closed: "Fermé",
    details: "Détails",
    commission: "Commission",
    credit: "Crédit",
    balance: "Solde",
    bookings: "Réservations",
    revenue: "Revenus",
    mru: "MRU",
    edit: "Modifier",
    delete: "Supprimer",
    confirmDelete: "Supprimer ce partenaire ?",
    yes: "Oui",
    no: "Non",
    formAdd: "Ajouter un partenaire",
    formEdit: "Modifier le partenaire",
    companyName: "Nom de la société *",
    contactName: "Nom du contact *",
    contactEmail: "Email",
    contactPhone: "Téléphone",
    commissionPercent: "Commission (%)",
    creditLimit: "Limite de crédit (MRU)",
    address: "Adresse",
    city: "Ville",
    country: "Pays",
    website: "Site web",
    notes: "Notes",
    status: "Statut",
    save: "Enregistrer",
    cancel: "Annuler",
    saving: "Enregistrement...",
    required: "Champs obligatoires manquants",
  },
};

type PartnerStatus = "active" | "suspended" | "closed";

interface FormState {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  commissionPercent: string;
  creditLimit: string;
  address: string;
  city: string;
  country: string;
  website: string;
  notes: string;
  status: PartnerStatus;
}

const EMPTY_FORM: FormState = {
  companyName: "", contactName: "", contactEmail: "", contactPhone: "",
  commissionPercent: "0", creditLimit: "0", address: "", city: "",
  country: "", website: "", notes: "", status: "active",
};

export default function PartnersScreen() {
  const colors = useColors();
  const { language } = useAdmin();
  const t = T[language];
  const isRTL = language === "ar";

  const { data: partners, isLoading, refetch } = trpc.businessAccounts.list.useQuery();
  const createMutation = trpc.businessAccounts.create.useMutation({ onSuccess: () => { refetch(); setModalVisible(false); } });
  const updateMutation = trpc.businessAccounts.update.useMutation({ onSuccess: () => { refetch(); setModalVisible(false); } });
  const deleteMutation = trpc.businessAccounts.delete.useMutation({ onSuccess: () => refetch() });

  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PartnerStatus>("all");

  const q = search.trim().toLowerCase();
  const filtered = (partners ?? []).filter(p => {
    const matchSearch = !q ||
      p.companyName.toLowerCase().includes(q) ||
      (p.contactName ?? "").toLowerCase().includes(q) ||
      (p.contactEmail ?? "").toLowerCase().includes(q) ||
      (p.contactPhone ?? "").includes(q);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColor: Record<PartnerStatus, string> = {
    active: "#22C55E",
    suspended: "#F59E0B",
    closed: "#EF4444",
  };

  const statusLabel = (s: string) => {
    if (s === "active") return t.active;
    if (s === "suspended") return t.suspended;
    return t.closed;
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      companyName: p.companyName ?? "",
      contactName: p.contactName ?? "",
      contactEmail: p.contactEmail ?? "",
      contactPhone: p.contactPhone ?? "",
      commissionPercent: p.commissionPercent ?? "0",
      creditLimit: p.creditLimit ?? "0",
      address: p.address ?? "",
      city: p.city ?? "",
      country: p.country ?? "",
      website: p.website ?? "",
      notes: p.notes ?? "",
      status: p.status ?? "active",
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!form.companyName.trim() || !form.contactName.trim()) {
      Alert.alert(t.required);
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert(t.confirmDelete, name, [
      { text: t.no, style: "cancel" },
      { text: t.yes, style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]} onPress={openAdd}>
          <IconSymbol name="plus.circle.fill" size={20} color="#fff" />
          <Text style={styles.addBtnText}>{t.add}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <IconSymbol name="xmark" size={16} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {(["all", "active", "suspended", "closed"] as const).map(s => {
          const label = s === "all" ? t.filterAll : s === "active" ? t.active : s === "suspended" ? t.suspended : t.closed;
          const color = s === "all" ? colors.primary : statusColor[s as PartnerStatus];
          const isActive = statusFilter === s;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, { borderColor: isActive ? color : colors.border, backgroundColor: isActive ? color + "18" : colors.surface }]}
              onPress={() => setStatusFilter(s)}
            >
              {s !== "all" && <View style={[styles.filterDot, { backgroundColor: color }]} />}
              <Text style={[styles.filterChipText, { color: isActive ? color : colors.muted }]}>{label}</Text>
              {isActive && s !== "all" && (
                <Text style={[styles.filterCount, { color }]}>{(partners ?? []).filter(p => p.status === s).length}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results count */}
      {(search.trim().length > 0 || statusFilter !== "all") && !isLoading && (
        <View style={[styles.resultsCount, { borderBottomColor: colors.border }]}>
          <Text style={[styles.resultsText, { color: colors.muted }]}>
            {filtered.length} {t.results}
          </Text>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : !filtered.length ? (
        <View style={styles.center}>
          <IconSymbol name="person.3.fill" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>{t.noPartners}</Text>
          <Text style={[styles.emptyHint, { color: colors.muted }]}>{t.noPartnersHint}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Top row */}
              <View style={styles.cardTop}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {item.companyName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.companyName, { color: colors.foreground }]} numberOfLines={1}>
                    {item.companyName}
                  </Text>
                  <Text style={[styles.contactName, { color: colors.muted }]} numberOfLines={1}>
                    {item.contactName}
                  </Text>
                  {item.contactPhone ? (
                    <Text style={[styles.phone, { color: colors.muted }]}>{item.contactPhone}</Text>
                  ) : null}
                </View>
                <View style={styles.cardActions}>
                  <View style={[styles.statusBadge, { backgroundColor: (statusColor[item.status as PartnerStatus] ?? "#22C55E") + "18" }]}>
                    <Text style={[styles.statusText, { color: statusColor[item.status as PartnerStatus] ?? "#22C55E" }]}>
                      {statusLabel(item.status)}
                    </Text>
                  </View>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity onPress={() => router.push(`/admin/partner-detail/${item.id}` as any)} style={styles.iconBtn}>
                      <IconSymbol name="chevron.right" size={18} color={colors.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                      <IconSymbol name="pencil" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id, item.companyName)} style={styles.iconBtn}>
                      <IconSymbol name="trash.fill" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Stats row */}
              <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{item.commissionPercent}%</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{t.commission}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>{parseInt(item.creditLimit ?? "0").toLocaleString()}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{t.credit} {t.mru}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: "#22C55E" }]}>{item.totalBookings ?? 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{t.bookings}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: "#8B5CF6" }]}>{parseInt(item.totalRevenue ?? "0").toLocaleString()}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{t.revenue}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.modalHeader, { backgroundColor: colors.primary }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <IconSymbol name="xmark" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingId ? t.formEdit : t.formAdd}</Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              <Text style={[styles.saveBtn, { opacity: isSaving ? 0.6 : 1 }]}>{isSaving ? t.saving : t.save}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={[styles.modalBody, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: 40 }}>
            <FormField label={t.companyName} value={form.companyName} onChangeText={(v: any) => setForm(f => ({ ...f, companyName: v }))} colors={colors} isRTL={isRTL} />
            <FormField label={t.contactName} value={form.contactName} onChangeText={(v: any) => setForm(f => ({ ...f, contactName: v }))} colors={colors} isRTL={isRTL} />
            <FormField label={t.contactEmail} value={form.contactEmail} onChangeText={(v: any) => setForm(f => ({ ...f, contactEmail: v }))} colors={colors} isRTL={isRTL} keyboardType="email-address" />
            <FormField label={t.contactPhone} value={form.contactPhone} onChangeText={(v: any) => setForm(f => ({ ...f, contactPhone: v }))} colors={colors} isRTL={isRTL} keyboardType="phone-pad" />
            <FormField label={t.commissionPercent} value={form.commissionPercent} onChangeText={(v: any) => setForm(f => ({ ...f, commissionPercent: v }))} colors={colors} isRTL={isRTL} keyboardType="decimal-pad" />
            <FormField label={t.creditLimit} value={form.creditLimit} onChangeText={(v: any) => setForm(f => ({ ...f, creditLimit: v }))} colors={colors} isRTL={isRTL} keyboardType="decimal-pad" />
            <FormField label={t.address} value={form.address} onChangeText={(v: any) => setForm(f => ({ ...f, address: v }))} colors={colors} isRTL={isRTL} />
            <FormField label={t.city} value={form.city} onChangeText={(v: any) => setForm(f => ({ ...f, city: v }))} colors={colors} isRTL={isRTL} />
            <FormField label={t.country} value={form.country} onChangeText={(v: any) => setForm(f => ({ ...f, country: v }))} colors={colors} isRTL={isRTL} />
            <FormField label={t.website} value={form.website} onChangeText={(v: any) => setForm(f => ({ ...f, website: v }))} colors={colors} isRTL={isRTL} keyboardType="url" />
            <FormField label={t.notes} value={form.notes} onChangeText={(v: any) => setForm(f => ({ ...f, notes: v }))} colors={colors} isRTL={isRTL} multiline />
            {/* Status selector */}
            {editingId ? (
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.status}</Text>
                <View style={styles.statusRow}>
                  {(["active", "suspended", "closed"] as PartnerStatus[]).map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusOption, { borderColor: form.status === s ? statusColor[s] : colors.border, backgroundColor: form.status === s ? statusColor[s] + "18" : colors.surface }]}
                      onPress={() => setForm(f => ({ ...f, status: s }))}
                    >
                      <Text style={[styles.statusOptionText, { color: form.status === s ? statusColor[s] : colors.muted }]}>{statusLabel(s)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

function FormField({ label, value, onChangeText, colors, isRTL, keyboardType, multiline }: any) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, textAlign: isRTL ? "right" : "left", height: multiline ? 80 : 44 }]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  searchBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginTop: 12, marginBottom: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 8 },
  filterScroll: { flexGrow: 0 },
  filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  filterChipText: { fontSize: 13, fontWeight: "600" },
  filterCount: { fontSize: 11, fontWeight: "700", marginLeft: 2 },
  searchInput: { flex: 1, fontSize: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptyHint: { fontSize: 13 },
  list: { padding: 12, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 20, fontWeight: "700" },
  cardInfo: { flex: 1, gap: 3 },
  companyName: { fontSize: 15, fontWeight: "700" },
  contactName: { fontSize: 13 },
  phone: { fontSize: 12 },
  cardActions: { alignItems: "flex-end", gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "600" },
  actionBtns: { flexDirection: "row", gap: 10 },
  iconBtn: { padding: 4 },
  statsRow: { flexDirection: "row", borderTopWidth: 1, paddingVertical: 10 },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 13, fontWeight: "700" },
  statLabel: { fontSize: 10 },
  statDivider: { width: 1, marginVertical: 4 },
  resultsCount: { paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 0.5 },
  resultsText: { fontSize: 12, fontWeight: "500" },
  // Modal
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingTop: 20 },
  modalTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  saveBtn: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalBody: { flex: 1, padding: 16 },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 },
  statusRow: { flexDirection: "row", gap: 8 },
  statusOption: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
  statusOptionText: { fontSize: 13, fontWeight: "600" },
});
