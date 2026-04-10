import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert,
  TextInput, ActivityIndicator, FlatList, Modal,
} from "react-native";
import {
  fetchLiveExchangeRates, savePricingSettings, getPricingSettings, loadPricingSettings,
} from "@/lib/pricing-settings";
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
    // Consolidators
    consolidators: "وكالات إصدار التذاكر (Consolidators)",
    consolidatorActive: "نشط",
    consolidatorActivate: "تفعيل",
    consolidatorDelete: "حذف",
    consolidatorAdd: "إضافة Consolidator",
    consolidatorOfficeId: "رقم المكتب (Office ID)",
    consolidatorCurrency: "العملة",
    consolidatorOfficeIdPlaceholder: "مثال: NKC262203",
    consolidatorCurrencyPlaceholder: "مثال: MRU",
    consolidatorAdded: "تمت الإضافة بنجاح",
    consolidatorActivated: "تم التفعيل بنجاح",
    consolidatorDeleted: "تم الحذف",
    consolidatorDeleteConfirm: "هل تريد حذف هذا الـ Consolidator؟",
    consolidatorEnvNote: "ملاحظة: يتم حفظ التغييرات مؤقتاً حتى إعادة تشغيل الخادم. لحفظ دائم، أضف المتغير البيئي.",
    consolidatorAgencyId: "رقم مكتب الوكالة (Agency Office ID)",
    consolidatorEnv: "البيئة",
    consolidatorMode: "وضع الإصدار",
    noConsolidators: "لا توجد consolidators مضافة",
    add: "إضافة",
    adding: "جاري الإضافة...",
    activating: "جاري التفعيل...",
    deleting: "جاري الحذف...",
    refresh: "تحديث",
    // Exchange Rates
    exchangeRates: "أسعار الصرف",
    exchangeRatesNote: "يتم التحديث تلقائياً عند فتح التطبيق",
    lastUpdated: "آخر تحديث",
    neverUpdated: "لم يتم التحديث بعد",
    updateRates: "تحديث الآن",
    updatingRates: "جاري التحديث...",
    ratesUpdated: "تم تحديث أسعار الصرف بنجاح",
    ratesFailed: "فشل تحديث الأسعار",
    usdRate: "1 USD =",
    eurRate: "1 EUR =",
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
    // Consolidators
    consolidators: "Consolidateurs (Émission de billets)",
    consolidatorActive: "Actif",
    consolidatorActivate: "Activer",
    consolidatorDelete: "Supprimer",
    consolidatorAdd: "Ajouter un Consolidateur",
    consolidatorOfficeId: "ID Bureau (Office ID)",
    consolidatorCurrency: "Devise",
    consolidatorOfficeIdPlaceholder: "Ex: NKC262203",
    consolidatorCurrencyPlaceholder: "Ex: MRU",
    consolidatorAdded: "Ajouté avec succès",
    consolidatorActivated: "Activé avec succès",
    consolidatorDeleted: "Supprimé",
    consolidatorDeleteConfirm: "Voulez-vous supprimer ce consolidateur ?",
    consolidatorEnvNote: "Note: Les changements sont temporaires jusqu'au redémarrage du serveur.",
    consolidatorAgencyId: "ID Bureau Agence (Agency Office ID)",
    consolidatorEnv: "Environnement",
    consolidatorMode: "Mode d'émission",
    noConsolidators: "Aucun consolidateur configuré",
    add: "Ajouter",
    adding: "Ajout...",
    activating: "Activation...",
    deleting: "Suppression...",
    refresh: "Actualiser",
    // Exchange Rates
    exchangeRates: "Taux de change",
    exchangeRatesNote: "Mis à jour automatiquement à l'ouverture de l'application",
    lastUpdated: "Dernière mise à jour",
    neverUpdated: "Jamais mis à jour",
    updateRates: "Mettre à jour",
    updatingRates: "Mise à jour...",
    ratesUpdated: "Taux mis à jour avec succès",
    ratesFailed: "Échec de la mise à jour",
    usdRate: "1 USD =",
    eurRate: "1 EUR =",
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

  // ─── Exchange Rates ──────────────────────────────────────────────────────
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [currentRates, setCurrentRates] = useState(() => getPricingSettings());

  React.useEffect(() => {
    loadPricingSettings().then((s) => setCurrentRates(s));
  }, []);

  const handleUpdateRates = async () => {
    setIsUpdatingRates(true);
    try {
      const liveRates = await fetchLiveExchangeRates();
      if (liveRates) {
        const current = getPricingSettings();
        const updated = { ...current, ...liveRates };
        await savePricingSettings(updated);
        setCurrentRates(updated);
        Alert.alert("✅", t.ratesUpdated);
      } else {
        Alert.alert("⚠️", t.ratesFailed);
      }
    } catch {
      Alert.alert("⚠️", t.ratesFailed);
    } finally {
      setIsUpdatingRates(false);
    }
  };

  // ─── Consolidators ───────────────────────────────────────────────────────
  const consolidatorQuery = trpc.duffel.getConsolidatorConfig.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const setActiveMutation = trpc.duffel.setActiveConsolidator.useMutation({
    onSuccess: () => {
      Alert.alert(t.consolidatorActivated);
      consolidatorQuery.refetch();
    },
    onError: (e) => Alert.alert("خطأ", e.message),
  });
  const addConsolidatorMutation = trpc.duffel.addConsolidator.useMutation({
    onSuccess: () => {
      Alert.alert(t.consolidatorAdded);
      setNewOfficeId("");
      setNewCurrency("");
      consolidatorQuery.refetch();
    },
    onError: (e) => Alert.alert("خطأ", e.message),
  });
  const removeConsolidatorMutation = trpc.duffel.removeConsolidator.useMutation({
    onSuccess: () => {
      Alert.alert(t.consolidatorDeleted);
      consolidatorQuery.refetch();
    },
    onError: (e) => Alert.alert("خطأ", e.message),
  });

  const [newOfficeId, setNewOfficeId] = useState("");
  const [newCurrency, setNewCurrency] = useState("MRU");

  const handleAddConsolidator = () => {
    const id = newOfficeId.trim().toUpperCase();
    const cur = newCurrency.trim().toUpperCase() || "MRU";
    if (!id) return Alert.alert("خطأ", "أدخل رقم المكتب (Office ID)");
    addConsolidatorMutation.mutate({ officeId: id, currency: cur });
  };

  const handleDeleteConsolidator = (index: number, officeId: string) => {
    Alert.alert(t.consolidatorDeleteConfirm, officeId, [
      { text: t.no, style: "cancel" },
      {
        text: t.consolidatorDelete,
        style: "destructive",
        onPress: () => removeConsolidatorMutation.mutate({ index }),
      },
    ]);
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

  const config = consolidatorQuery.data;

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

        {/* ─── Consolidators Panel ─────────────────────────────────────────── */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t.consolidators}</Text>
            <TouchableOpacity onPress={() => consolidatorQuery.refetch()} style={{ padding: 4 }}>
              <IconSymbol name="arrow.clockwise" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Agency Info */}
          {config && (
            <View style={[styles.agencyRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.agencyLabel, { color: colors.muted }]}>{t.consolidatorAgencyId}</Text>
                <Text style={[styles.agencyValue, { color: colors.foreground }]}>{config.agencyOfficeId || "—"}</Text>
              </View>
              <View style={[styles.envBadge, { backgroundColor: config.environment === "production" ? colors.success + "20" : colors.warning + "20" }]}>
                <Text style={[styles.envBadgeText, { color: config.environment === "production" ? colors.success : colors.warning }]}>
                  {config.environment === "production" ? "PROD" : "TEST"}
                </Text>
              </View>
            </View>
          )}

          {/* Consolidators List */}
          {consolidatorQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
          ) : config && config.consolidators && config.consolidators.length > 0 ? (
            <View style={{ gap: 10 }}>
              {config.consolidators.map((c: any, index: number) => (
                <View
                  key={c.officeId + index}
                  style={[
                    styles.consolidatorCard,
                    {
                      backgroundColor: c.isActive ? colors.primary + "10" : colors.background,
                      borderColor: c.isActive ? colors.primary : colors.border,
                      borderWidth: c.isActive ? 2 : 1,
                    },
                  ]}
                >
                  {/* Active Badge */}
                  {c.isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.activeBadgeText}>✓ {t.consolidatorActive}</Text>
                    </View>
                  )}

                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.consolidatorId, { color: colors.foreground }]}>{c.officeId}</Text>
                      <Text style={[styles.consolidatorLabel, { color: colors.muted }]}>{c.label}</Text>
                      <View style={[styles.currencyBadge, { backgroundColor: colors.primary + "15" }]}>
                        <Text style={[styles.currencyText, { color: colors.primary }]}>{c.currency}</Text>
                      </View>
                    </View>

                    <View style={{ gap: 8, alignItems: "flex-end" }}>
                      {/* Activate Button */}
                      {!c.isActive && (
                        <TouchableOpacity
                          style={[styles.activateBtn, { backgroundColor: colors.primary }]}
                          onPress={() => setActiveMutation.mutate({ index })}
                          disabled={setActiveMutation.isPending}
                          activeOpacity={0.8}
                        >
                          {setActiveMutation.isPending ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={styles.activateBtnText}>{t.consolidatorActivate}</Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Delete Button (not for active) */}
                      {!c.isActive && (
                        <TouchableOpacity
                          style={[styles.deleteBtn, { borderColor: colors.error + "60" }]}
                          onPress={() => handleDeleteConsolidator(index, c.officeId)}
                          disabled={removeConsolidatorMutation.isPending}
                          activeOpacity={0.8}
                        >
                          <IconSymbol name="trash" size={14} color={colors.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyConsolidators}>
              <IconSymbol name="ticket" size={32} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>{t.noConsolidators}</Text>
            </View>
          )}

          {/* Add New Consolidator */}
          <View style={[styles.addSection, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.addTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {t.consolidatorAdd}
            </Text>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
              <TextInput
                style={[styles.addInput, { flex: 2, borderColor: colors.border, backgroundColor: colors.surface, color: colors.foreground }]}
                value={newOfficeId}
                onChangeText={setNewOfficeId}
                placeholder={t.consolidatorOfficeIdPlaceholder}
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                textAlign={isRTL ? "right" : "left"}
              />
              <TextInput
                style={[styles.addInput, { flex: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.foreground }]}
                value={newCurrency}
                onChangeText={setNewCurrency}
                placeholder={t.consolidatorCurrencyPlaceholder}
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                maxLength={3}
                textAlign="center"
              />
            </View>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary, opacity: addConsolidatorMutation.isPending ? 0.7 : 1 }]}
              onPress={handleAddConsolidator}
              disabled={addConsolidatorMutation.isPending}
              activeOpacity={0.85}
            >
              {addConsolidatorMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <IconSymbol name="plus" size={16} color="#fff" />
                  <Text style={styles.addBtnText}>{t.add}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Env Note */}
          <View style={[styles.noteBox, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
            <IconSymbol name="info.circle" size={14} color={colors.warning} />
            <Text style={[styles.noteText, { color: colors.warning, textAlign: isRTL ? "right" : "left" }]}>
              {t.consolidatorEnvNote}
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

        {/* Exchange Rates */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.muted, marginBottom: 0 }]}>{t.exchangeRates}</Text>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, marginTop: 0, opacity: isUpdatingRates ? 0.7 : 1, flexDirection: "row", alignItems: "center", gap: 6 }]}
              onPress={handleUpdateRates}
              disabled={isUpdatingRates}
              activeOpacity={0.85}
            >
              {isUpdatingRates ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <IconSymbol name="arrow.clockwise" size={14} color="#fff" />
              )}
              <Text style={[styles.saveBtnText, { fontSize: 13 }]}>
                {isUpdatingRates ? t.updatingRates : t.updateRates}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12, textAlign: isRTL ? "right" : "left" }}>
            {t.exchangeRatesNote}
          </Text>

          {/* Current Rates Display */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4, textAlign: "center" }}>{t.usdRate}</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>
                {currentRates.usdToMRU.toFixed(2)}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center" }}>MRU</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4, textAlign: "center" }}>{t.eurRate}</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, textAlign: "center" }}>
                {currentRates.eurToMRU.toFixed(2)}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center" }}>MRU</Text>
            </View>
          </View>

          {/* Last Updated */}
          <Text style={{ fontSize: 11, color: colors.muted, textAlign: isRTL ? "right" : "left" }}>
            {t.lastUpdated}: {currentRates.ratesLastUpdated
              ? new Date(currentRates.ratesLastUpdated).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
              : t.neverUpdated}
          </Text>
        </View>

        {/* Login Logs */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>{t.loginLogs}</Text>
          <TouchableOpacity
            style={[styles.viewLogsBtn, { borderColor: colors.primary }]}
            onPress={() => setShowLogs(true)}
            activeOpacity={0.8}
          >
            <IconSymbol name="list.bullet" size={16} color={colors.primary} />
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
  // Consolidators
  agencyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 10, borderWidth: 1 },
  agencyLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  agencyValue: { fontSize: 15, fontWeight: "700", letterSpacing: 0.5 },
  envBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  envBadgeText: { fontSize: 11, fontWeight: "800" },
  consolidatorCard: { borderRadius: 14, padding: 14, gap: 8 },
  activeBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 4 },
  activeBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  consolidatorId: { fontSize: 17, fontWeight: "800", letterSpacing: 0.5 },
  consolidatorLabel: { fontSize: 12, marginTop: 2 },
  currencyBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  currencyText: { fontSize: 12, fontWeight: "700" },
  activateBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, minWidth: 80, alignItems: "center" },
  activateBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  emptyConsolidators: { alignItems: "center", gap: 8, paddingVertical: 16 },
  emptyText: { fontSize: 13 },
  addSection: { borderRadius: 12, padding: 14, borderWidth: 1, gap: 10 },
  addTitle: { fontSize: 13, fontWeight: "700" },
  addInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12 },
  addBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  noteBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  noteText: { fontSize: 11, flex: 1, lineHeight: 16 },
});
