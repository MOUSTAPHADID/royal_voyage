import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert,
  TextInput, ActivityIndicator, FlatList, Modal,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAdmin } from "@/lib/admin-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

const T = {
  ar: {
    title: "الإعدادات",
    account: "الحساب",
    name: "الاسم",
    email: "البريد الإلكتروني",
    role: "الدور",
    language: "اللغة",
    arabic: "العربية",
    french: "الفرنسية",
    logout: "تسجيل الخروج",
    confirmLogout: "هل تريد تسجيل الخروج؟",
    yes: "نعم",
    no: "لا",
    version: "الإصدار",
    loginLogs: "سجل تسجيل الدخول",
    viewLogs: "عرض السجل",
    noLogs: "لا توجد سجلات",
    success: "ناجح",
    failed: "فاشل",
    close: "إغلاق",
    priceRetention: "رسوم الاحتفاظ بالسعر",
    retentionFee: "مبلغ الرسوم",
    retentionType: "نوع الرسوم",
    fixed: "مبلغ ثابت (MRU)",
    percent: "نسبة مئوية (%)",
    retentionDuration: "مدة الاحتفاظ (ساعات)",
    save: "حفظ الإعدادات",
    saved: "تم الحفظ بنجاح",
    saving: "جاري الحفظ...",
    inactivity: "الخروج التلقائي",
    inactivityNote: "يتم تسجيل الخروج تلقائياً بعد 15 دقيقة من عدم النشاط",
    roles: { manager: "مدير", accountant: "محاسب", booking_agent: "وكيل حجز", support: "دعم" } as Record<string, string>,
  },
  fr: {
    title: "Paramètres",
    account: "Compte",
    name: "Nom",
    email: "E-mail",
    role: "Rôle",
    language: "Langue",
    arabic: "Arabe",
    french: "Français",
    logout: "Déconnexion",
    confirmLogout: "Voulez-vous vous déconnecter ?",
    yes: "Oui",
    no: "Non",
    version: "Version",
    loginLogs: "Journal de connexion",
    viewLogs: "Voir le journal",
    noLogs: "Aucun enregistrement",
    success: "Succès",
    failed: "Échec",
    close: "Fermer",
    priceRetention: "Frais de rétention de prix",
    retentionFee: "Montant des frais",
    retentionType: "Type de frais",
    fixed: "Montant fixe (MRU)",
    percent: "Pourcentage (%)",
    retentionDuration: "Durée de rétention (heures)",
    save: "Enregistrer",
    saved: "Enregistré avec succès",
    saving: "Enregistrement...",
    inactivity: "Déconnexion automatique",
    inactivityNote: "Déconnexion automatique après 15 minutes d'inactivité",
    roles: { manager: "Directeur", accountant: "Comptable", booking_agent: "Agent réservation", support: "Support" } as Record<string, string>,
  },
};

export default function SettingsScreen() {
  const colors = useColors();
  const { employee, logoutEmployee, language, setLanguage } = useAdmin();
  const t = T[language];
  const isRTL = language === "ar";

  // ─── Login Logs Modal ────────────────────────────────────────────────────
  const [showLogs, setShowLogs] = useState(false);
  const logsQuery = trpc.loginLogs.list.useQuery({ limit: 100 }, { enabled: showLogs });

  // ─── Price Retention Settings ────────────────────────────────────────────
  const settingsQuery = trpc.appSettings.get.useQuery();
  const updateSettingsMutation = trpc.appSettings.update.useMutation({
    onSuccess: () => Alert.alert(t.saved),
  });

  const [retentionFee, setRetentionFee] = useState<string>("");
  const [retentionType, setRetentionType] = useState<"fixed" | "percent">("fixed");
  const [retentionDuration, setRetentionDuration] = useState<string>("");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings into local state once
  React.useEffect(() => {
    if (settingsQuery.data && !settingsLoaded) {
      setRetentionFee(String(settingsQuery.data.priceRetentionFee));
      setRetentionType(settingsQuery.data.priceRetentionType);
      setRetentionDuration(String(settingsQuery.data.priceRetentionDurationHours));
      setSettingsLoaded(true);
    }
  }, [settingsQuery.data]);

  const handleSaveSettings = () => {
    const fee = parseFloat(retentionFee);
    const duration = parseInt(retentionDuration, 10);
    if (isNaN(fee) || fee < 0) return Alert.alert("خطأ", "مبلغ الرسوم غير صحيح");
    if (isNaN(duration) || duration < 1) return Alert.alert("خطأ", "مدة الاحتفاظ غير صحيحة");
    updateSettingsMutation.mutate({
      priceRetentionFee: fee,
      priceRetentionType: retentionType,
      priceRetentionDurationHours: duration,
    });
  };

  const handleLogout = () => {
    Alert.alert(t.confirmLogout, "", [
      { text: t.no, style: "cancel" },
      { text: t.yes, style: "destructive", onPress: logoutEmployee },
    ]);
  };

  const formatLogDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(language === "ar" ? "ar-SA" : "fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>{t.title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Account Info */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t.account}</Text>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>{(employee?.name ?? "A").charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={[styles.empName, { color: colors.foreground }]}>{employee?.name ?? "—"}</Text>
              <Text style={[styles.empEmail, { color: colors.muted }]}>{employee?.email ?? "—"}</Text>
              <Text style={[styles.empRole, { color: colors.primary }]}>{t.roles[employee?.role ?? ""] ?? employee?.role ?? "—"}</Text>
            </View>
          </View>
        </View>

        {/* Language */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t.language}</Text>
          <View style={styles.langRow}>
            {(["ar", "fr"] as const).map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.langBtn, { backgroundColor: language === lang ? colors.primary : colors.background, borderColor: language === lang ? colors.primary : colors.border }]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[styles.langBtnText, { color: language === lang ? "#fff" : colors.foreground }]}>
                  {lang === "ar" ? t.arabic : t.french}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Auto-logout info */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t.inactivity}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <IconSymbol name="lock.fill" size={18} color={colors.warning} />
            <Text style={[styles.infoText, { color: colors.foreground, flex: 1, textAlign: isRTL ? "right" : "left" }]}>
              {t.inactivityNote}
            </Text>
          </View>
        </View>

        {/* Price Retention Settings */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t.priceRetention}</Text>

          {settingsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              {/* Fee Amount */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>{t.retentionFee}</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
                  value={retentionFee}
                  onChangeText={setRetentionFee}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                />
              </View>

              {/* Fee Type */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>{t.retentionType}</Text>
                <View style={styles.typeRow}>
                  {(["fixed", "percent"] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeBtn, { backgroundColor: retentionType === type ? colors.primary : colors.background, borderColor: retentionType === type ? colors.primary : colors.border }]}
                      onPress={() => setRetentionType(type)}
                    >
                      <Text style={[styles.typeBtnText, { color: retentionType === type ? "#fff" : colors.foreground }]}>
                        {type === "fixed" ? t.fixed : t.percent}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Duration */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>{t.retentionDuration}</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
                  value={retentionDuration}
                  onChangeText={setRetentionDuration}
                  keyboardType="numeric"
                  placeholder="24"
                  placeholderTextColor={colors.muted}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: updateSettingsMutation.isPending ? 0.7 : 1 }]}
                onPress={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                activeOpacity={0.85}
              >
                {updateSettingsMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{t.save}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Login Logs */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t.loginLogs}</Text>
          <TouchableOpacity
            style={[styles.viewLogsBtn, { borderColor: colors.primary }]}
            onPress={() => setShowLogs(true)}
            activeOpacity={0.8}
          >
            <IconSymbol name="list.bullet" size={18} color={colors.primary} />
            <Text style={[styles.viewLogsBtnText, { color: colors.primary }]}>{t.viewLogs}</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.error + "12", borderColor: colors.error + "30" }]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>{t.logout}</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.muted }]}>Royal Voyage Admin v1.0.0</Text>
      </ScrollView>

      {/* Login Logs Modal */}
      <Modal visible={showLogs} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowLogs(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t.loginLogs}</Text>
            <TouchableOpacity onPress={() => setShowLogs(false)}>
              <IconSymbol name="xmark.circle.fill" size={26} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {logsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : logsQuery.data && logsQuery.data.length > 0 ? (
            <FlatList
              data={logsQuery.data}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              renderItem={({ item }) => (
                <View style={[styles.logItem, { backgroundColor: colors.surface, borderColor: item.success ? colors.success + "40" : colors.error + "40", borderLeftColor: item.success ? colors.success : colors.error }]}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[styles.logIdentifier, { color: colors.foreground }]}>{item.identifier}</Text>
                    <View style={[styles.logBadge, { backgroundColor: item.success ? colors.success + "20" : colors.error + "20" }]}>
                      <Text style={[styles.logBadgeText, { color: item.success ? colors.success : colors.error }]}>
                        {item.success ? t.success : t.failed}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.logDate, { color: colors.muted }]}>{formatLogDate(item.createdAt)}</Text>
                  {item.failureReason && (
                    <Text style={[styles.logReason, { color: colors.error }]}>{item.failureReason}</Text>
                  )}
                  {item.userAgent && (
                    <Text style={[styles.logAgent, { color: colors.muted }]}>{item.userAgent}</Text>
                  )}
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyLogs}>
              <IconSymbol name="list.bullet" size={40} color={colors.muted} />
              <Text style={[styles.emptyLogsText, { color: colors.muted }]}>{t.noLogs}</Text>
            </View>
          )}
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  content: { padding: 16, gap: 16 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22, fontWeight: "700" },
  empName: { fontSize: 17, fontWeight: "700" },
  empEmail: { fontSize: 13, marginTop: 2 },
  empRole: { fontSize: 12, fontWeight: "600", marginTop: 3 },
  langRow: { flexDirection: "row", gap: 10 },
  langBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  langBtnText: { fontSize: 14, fontWeight: "600" },
  infoText: { fontSize: 13, lineHeight: 20 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  typeBtnText: { fontSize: 13, fontWeight: "600" },
  saveBtn: { paddingVertical: 13, borderRadius: 12, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  viewLogsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  viewLogsBtnText: { fontSize: 14, fontWeight: "600" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, borderRadius: 14, borderWidth: 1 },
  logoutText: { fontSize: 15, fontWeight: "700" },
  version: { textAlign: "center", fontSize: 12 },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  logItem: { borderRadius: 12, padding: 14, borderWidth: 1, borderLeftWidth: 4, gap: 4 },
  logIdentifier: { fontSize: 14, fontWeight: "600" },
  logDate: { fontSize: 12 },
  logReason: { fontSize: 12, fontStyle: "italic" },
  logAgent: { fontSize: 11 },
  logBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  logBadgeText: { fontSize: 11, fontWeight: "700" },
  emptyLogs: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyLogsText: { fontSize: 15 },
});
