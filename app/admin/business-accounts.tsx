import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { formatMRU } from "@/lib/currency";

type BusinessAccount = {
  id: number;
  companyName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  commissionPercent: string;
  creditLimit: string;
  currentBalance: string;
  status: "active" | "suspended" | "closed";
  notes: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  logoUrl: string | null;
  website: string | null;
  totalBookings: number;
  totalRevenue: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "#22C55E20", text: "#22C55E", label: "نشط" },
  suspended: { bg: "#F59E0B20", text: "#F59E0B", label: "معلق" },
  closed: { bg: "#EF444420", text: "#EF4444", label: "مغلق" },
};

export default function BusinessAccountsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BusinessAccount | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [website, setWebsite] = useState("");

  const accountsQuery = trpc.businessAccounts.list.useQuery();
  const createMut = trpc.businessAccounts.create.useMutation();
  const updateMut = trpc.businessAccounts.update.useMutation();
  const deleteMut = trpc.businessAccounts.delete.useMutation();

  const accounts = (accountsQuery.data || []) as unknown as BusinessAccount[];

  const resetForm = () => {
    setCompanyName("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setCommissionPercent("");
    setCreditLimit("");
    setNotes("");
    setAddress("");
    setCity("");
    setCountry("");
    setLogoUrl("");
    setWebsite("");
  };

  const handleCreate = async () => {
    if (!companyName.trim() || !contactName.trim()) {
      Alert.alert("خطأ", "يرجى ملء اسم الشركة واسم جهة الاتصال");
      return;
    }
    const pct = parseFloat(commissionPercent || "0");
    if (isNaN(pct) || pct < 0 || pct > 100) {
      Alert.alert("خطأ", "النسبة المئوية يجب أن تكون بين 0 و 100");
      return;
    }
    try {
      await createMut.mutateAsync({
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        commissionPercent: pct.toFixed(2),
        creditLimit: creditLimit.trim() || undefined,
        notes: notes.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        website: website.trim() || undefined,
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreateModal(false);
      resetForm();
      accountsQuery.refetch();
    } catch (err: any) {
      Alert.alert("خطأ", err?.message || "فشل في إنشاء الحساب");
    }
  };

  const handleEdit = (account: BusinessAccount) => {
    setEditingAccount(account);
    setCompanyName(account.companyName);
    setContactName(account.contactName);
    setContactEmail(account.contactEmail || "");
    setContactPhone(account.contactPhone || "");
    setCommissionPercent(account.commissionPercent);
    setCreditLimit(account.creditLimit);
    setNotes(account.notes || "");
    setAddress(account.address || "");
    setCity(account.city || "");
    setCountry(account.country || "");
    setLogoUrl(account.logoUrl || "");
    setWebsite(account.website || "");
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingAccount) return;
    const pct = parseFloat(commissionPercent || "0");
    if (isNaN(pct) || pct < 0 || pct > 100) {
      Alert.alert("خطأ", "النسبة المئوية يجب أن تكون بين 0 و 100");
      return;
    }
    try {
      await updateMut.mutateAsync({
        id: editingAccount.id,
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        commissionPercent: pct.toFixed(2),
        creditLimit: creditLimit.trim() || undefined,
        notes: notes.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        website: website.trim() || undefined,
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditModal(false);
      setEditingAccount(null);
      resetForm();
      accountsQuery.refetch();
    } catch (err: any) {
      Alert.alert("خطأ", err?.message || "فشل في تحديث الحساب");
    }
  };

  const handleToggleStatus = async (account: BusinessAccount) => {
    const newStatus = account.status === "active" ? "suspended" : "active";
    const msg = newStatus === "suspended" ? "هل تريد تعليق هذا الحساب؟" : "هل تريد تفعيل هذا الحساب؟";
    Alert.alert("تأكيد", msg, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "نعم",
        onPress: async () => {
          try {
            await updateMut.mutateAsync({ id: account.id, status: newStatus });
            accountsQuery.refetch();
          } catch {}
        },
      },
    ]);
  };

  const handleDelete = (account: BusinessAccount) => {
    Alert.alert("حذف الحساب", `هل أنت متأكد من حذف "${account.companyName}"؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMut.mutateAsync({ id: account.id });
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            accountsQuery.refetch();
          } catch {}
        },
      },
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await accountsQuery.refetch();
    setRefreshing(false);
  }, []);

  const totalActive = accounts.filter((a) => a.status === "active").length;
  const totalRevenue = accounts.reduce((s, a) => s + parseFloat(a.totalRevenue || "0"), 0);
  const totalBookings = accounts.reduce((s, a) => s + a.totalBookings, 0);

  const renderFormModal = (isEdit: boolean) => (
    <Modal visible={isEdit ? showEditModal : showCreateModal} animationType="slide" presentationStyle="pageSheet">
      <View style={[s.modalContainer, { backgroundColor: colors.background }]}>
        <View style={s.modalHeader}>
          <Pressable onPress={() => { isEdit ? setShowEditModal(false) : setShowCreateModal(false); resetForm(); }}>
            <Text style={{ color: "#C9A84C", fontSize: 16 }}>إلغاء</Text>
          </Pressable>
          <Text style={[s.modalTitle, { color: colors.foreground }]}>
            {isEdit ? "تعديل الحساب" : "حساب تجاري جديد"}
          </Text>
          <Pressable
            onPress={isEdit ? handleUpdate : handleCreate}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={{ color: "#C9A84C", fontSize: 16, fontWeight: "700" }}>
              {(isEdit ? updateMut : createMut).isPending ? "..." : "حفظ"}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
          {/* Company Info */}
          <Text style={[s.sectionLabel, { color: colors.muted }]}>معلومات الشركة</Text>
          <View style={[s.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>اسم الشركة *</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="مثال: وكالة السفر الذهبية"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>العنوان</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={address}
                onChangeText={setAddress}
                placeholder="العنوان"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>المدينة</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={city}
                onChangeText={setCity}
                placeholder="نواكشوط"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>الدولة</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={country}
                onChangeText={setCountry}
                placeholder="موريتانيا"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>

          {/* Contact Info */}
          <Text style={[s.sectionLabel, { color: colors.muted }]}>جهة الاتصال</Text>
          <View style={[s.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>اسم المسؤول *</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={contactName}
                onChangeText={setContactName}
                placeholder="الاسم الكامل"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>البريد الإلكتروني</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="email@example.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>رقم الهاتف</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="+222 XX XX XX XX"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Financial */}
          <Text style={[s.sectionLabel, { color: colors.muted }]}>الإعدادات المالية</Text>
          <View style={[s.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>نسبة العمولة (%)</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={commissionPercent}
                onChangeText={setCommissionPercent}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>حد الائتمان (MRU)</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={creditLimit}
                onChangeText={setCreditLimit}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Branding / White-Label */}
          <Text style={[s.sectionLabel, { color: colors.muted }]}>هوية العلامة التجارية (للتذاكر)</Text>
          <View style={[s.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>رابط الشعار</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={logoUrl}
                onChangeText={setLogoUrl}
                placeholder="https://example.com/logo.png"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>الموقع الإلكتروني</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://agence.mr"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          {/* Notes */}
          <Text style={[s.sectionLabel, { color: colors.muted }]}>ملاحظات</Text>
          <View style={[s.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[s.notesInput, { color: colors.foreground }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="ملاحظات إضافية..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );

  const renderAccountCard = ({ item }: { item: BusinessAccount }) => {
    const statusInfo = STATUS_COLORS[item.status] || STATUS_COLORS.active;
    return (
      <Pressable
        onPress={() => handleEdit(item)}
        style={({ pressed }) => [s.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
      >
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[s.cardTitle, { color: colors.foreground }]}>{item.companyName}</Text>
            <Text style={[s.cardSubtitle, { color: colors.muted }]}>{item.contactName}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[s.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={[s.cardDivider, { backgroundColor: colors.border }]} />

        <View style={s.cardStats}>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: "#C9A84C" }]}>{item.commissionPercent}%</Text>
            <Text style={[s.statLabel, { color: colors.muted }]}>العمولة</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: colors.foreground }]}>{item.totalBookings}</Text>
            <Text style={[s.statLabel, { color: colors.muted }]}>الحجوزات</Text>
          </View>
          <View style={s.statItem}>
            <Text style={[s.statValue, { color: "#22C55E" }]}>{formatMRU(parseFloat(item.totalRevenue || "0"))}</Text>
            <Text style={[s.statLabel, { color: colors.muted }]}>الإيرادات</Text>
          </View>
        </View>

        {(item.contactEmail || item.contactPhone) && (
          <View style={s.cardContact}>
            {item.contactEmail && (
              <View style={s.contactRow}>
                <IconSymbol name="envelope.fill" size={13} color={colors.muted} />
                <Text style={[s.contactText, { color: colors.muted }]}>{item.contactEmail}</Text>
              </View>
            )}
            {item.contactPhone && (
              <View style={s.contactRow}>
                <IconSymbol name="phone.fill" size={13} color={colors.muted} />
                <Text style={[s.contactText, { color: colors.muted }]}>{item.contactPhone}</Text>
              </View>
            )}
          </View>
        )}

        {/* عرض الرصيد الحالي */}
        <View style={[s.balanceRow, { backgroundColor: colors.border + "20" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <IconSymbol name="creditcard.fill" size={16} color="#C9A84C" />
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>الرصيد الحالي</Text>
          </View>
          <Text style={{ color: "#C9A84C", fontSize: 16, fontWeight: "800" }}>
            {formatMRU(parseFloat(item.currentBalance || "0"))}
          </Text>
        </View>

        <View style={s.cardActions}>
          <Pressable
            onPress={() => router.push(`/admin/account-balance?id=${item.id}&name=${encodeURIComponent(item.companyName)}` as any)}
            style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <IconSymbol name="creditcard.fill" size={16} color="#C9A84C" />
            <Text style={{ fontSize: 12, color: "#C9A84C" }}>الرصيد</Text>
          </Pressable>
          <Pressable
            onPress={() => handleToggleStatus(item)}
            style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <IconSymbol name={item.status === "active" ? "hand.raised.fill" : "checkmark.circle.fill"} size={16} color={item.status === "active" ? "#F59E0B" : "#22C55E"} />
            <Text style={{ fontSize: 12, color: item.status === "active" ? "#F59E0B" : "#22C55E" }}>
              {item.status === "active" ? "تعليق" : "تفعيل"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleEdit(item)}
            style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <IconSymbol name="pencil" size={16} color="#0a7ea4" />
            <Text style={{ fontSize: 12, color: "#0a7ea4" }}>تعديل</Text>
          </Pressable>
          <Pressable
            onPress={() => handleDelete(item)}
            style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <IconSymbol name="trash.fill" size={16} color="#EF4444" />
            <Text style={{ fontSize: 12, color: "#EF4444" }}>حذف</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[s.header, { backgroundColor: "#1B2B5E" }]}>
        <Pressable onPress={() => router.back()} style={{ width: 30 }}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={s.headerTitle}>الحسابات التجارية</Text>
        <Pressable
          onPress={() => { resetForm(); setShowCreateModal(true); }}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <IconSymbol name="plus.circle.fill" size={26} color="#C9A84C" />
        </Pressable>
      </View>

      {/* Summary Cards */}
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { backgroundColor: "#1B2B5E" }]}>
          <Text style={s.summaryValue}>{totalActive}</Text>
          <Text style={s.summaryLabel}>حسابات نشطة</Text>
        </View>
        <View style={[s.summaryCard, { backgroundColor: "#0F172A" }]}>
          <Text style={s.summaryValue}>{totalBookings}</Text>
          <Text style={s.summaryLabel}>إجمالي الحجوزات</Text>
        </View>
        <View style={[s.summaryCard, { backgroundColor: "#14532D" }]}>
          <Text style={[s.summaryValue, { color: "#22C55E" }]}>{formatMRU(totalRevenue)}</Text>
          <Text style={s.summaryLabel}>الإيرادات</Text>
        </View>
      </View>

      {accountsQuery.isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#C9A84C" />
        </View>
      ) : accounts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
          <IconSymbol name="building.fill" size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 16, marginTop: 12, textAlign: "center" }}>
            لا توجد حسابات تجارية بعد
          </Text>
          <Pressable
            onPress={() => { resetForm(); setShowCreateModal(true); }}
            style={({ pressed }) => [s.emptyBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>إنشاء حساب جديد</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAccountCard}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />}
        />
      )}

      {renderFormModal(false)}
      {renderFormModal(true)}
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  summaryRow: { flexDirection: "row", padding: 16, gap: 8 },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  summaryValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  summaryLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 4 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSubtitle: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "600" },
  cardDivider: { height: 1, marginVertical: 12 },
  cardStats: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  cardContact: { marginTop: 12, gap: 4 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  contactText: { fontSize: 12 },
  cardActions: { flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  emptyBtn: {
    backgroundColor: "#C9A84C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128,128,128,0.3)",
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalBody: { flex: 1, padding: 20 },
  sectionLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: 8, marginTop: 20, letterSpacing: 0.5 },
  inputGroup: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  inputLabel: { width: 130, fontSize: 14 },
  inputField: { flex: 1, fontSize: 14, textAlign: "left" },
  divider: { height: 0.5, marginLeft: 16 },
  notesInput: { padding: 16, fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginTop: 10 },
});
