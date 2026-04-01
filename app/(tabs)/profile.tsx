import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
  Modal,
  Linking,
  TextInput,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTranslation, useI18n, LANGUAGES, Language } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency-context";
import { CURRENCIES, AppCurrency } from "@/lib/currency";
import {
  scheduleDailyProfitNotification,
  cancelDailyProfitNotification,
  getDailyNotificationStatus,
  DEFAULT_NOTIFICATION_HOUR,
} from "@/lib/daily-profit-notification";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, logout, bookings } = useApp();
  const isAdmin = user?.isAdmin === true;
  const { t } = useTranslation();
  const { language, setLanguage } = useI18n();
  const { currency, setCurrency } = useCurrency();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [dailyProfitNotif, setDailyProfitNotif] = useState(false);






  const handleAdminAccess = () => {
    // Open admin login screen
    router.push("/admin/login" as any);
  };



  // تحميل حالة الإشعار اليومي (للأدمن فقط)
  useEffect(() => {
    if (isAdmin) {
      getDailyNotificationStatus().then(({ enabled }) => setDailyProfitNotif(enabled));
    }
  }, [isAdmin]);

  const toggleDailyProfitNotif = async (value: boolean) => {
    setDailyProfitNotif(value);
    if (value) {
      const success = await scheduleDailyProfitNotification(DEFAULT_NOTIFICATION_HOUR);
      if (!success) {
        setDailyProfitNotif(false);
        Alert.alert(
          language === "ar" ? "لا يمكن تفعيل الإشعارات" : "Cannot enable notifications",
          language === "ar" ? "يرجى السماح بالإشعارات من إعدادات الجهاز" : "Please allow notifications in device settings"
        );
      }
    } else {
      await cancelDailyProfitNotification();
    }
  };

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;

  // مستوى المسافر بناءً على عدد الحجوزات المؤكدة
  const getTravelerLevel = () => {
    if (confirmedBookings >= 20) return language === "ar" ? "بلاتيني" : language === "fr" ? "Platine" : "Platinum";
    if (confirmedBookings >= 10) return language === "ar" ? "ذهبي" : language === "fr" ? "Or" : "Gold";
    if (confirmedBookings >= 5) return language === "ar" ? "فضي" : language === "fr" ? "Argent" : "Silver";
    return language === "ar" ? "مبتدئ" : language === "fr" ? "Débutant" : "Starter";
  };

  const currentLangLabel = LANGUAGES.find((l) => l.code === language)?.nativeName ?? language;

  const handleLogout = () => {
    Alert.alert(
      t.profile.signOut,
      t.profile.signOutConfirm,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.profile.signOut,
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/auth/login" as any);
          },
        },
      ]
    );
  };

  const menuSections = [
    {
      title: t.profile.account,
      items: [
        { icon: "person.fill", label: t.profile.editProfile, value: "", onPress: () => router.push("/profile/edit" as any) },
        { icon: "creditcard.fill", label: t.profile.paymentMethods, value: "", onPress: () => router.push("/profile/payment-methods" as any) },
        { icon: "shield.fill", label: t.profile.security, value: "", onPress: () => {} },
      ],
    },
    {
      title: t.profile.preferences,
      items: [
        {
          icon: "globe",
          label: t.profile.language,
          value: currentLangLabel,
          onPress: () => setShowLangModal(true),
        },
        {
          icon: "tag.fill",
          label: t.profile.currency,
          value: CURRENCIES.find((c) => c.code === currency)?.flag + " " + currency,
          onPress: () => setShowCurrencyModal(true),
        },
      ],
    },
    {
      title: t.profile.support,
      items: [
        { icon: "phone.fill", label: language === "ar" ? "اتصل بنا" : language === "fr" ? "Appelez-nous" : "Call Us", value: "+222 33 70 00 00", onPress: () => Linking.openURL("tel:+22233700000") },
        { icon: "envelope.fill", label: t.profile.contactUs, value: "", onPress: () => Linking.openURL("mailto:suporte@royalvoyage.online") },
        { icon: "star.fill", label: t.profile.rateApp, value: "", onPress: () => {} },
        { icon: "info.circle.fill", label: language === "ar" ? "عن الوكالة" : language === "fr" ? "À propos" : "About Us", value: "", onPress: () => router.push("/about" as any) },
        { icon: "shield.fill", label: language === "ar" ? "سياسة الخصوصية" : language === "fr" ? "Politique de Confidentialité" : "Privacy Policy", value: "", onPress: () => router.push("/privacy" as any) },
      ],
    },

  ];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <Pressable style={[styles.editAvatarBtn, { backgroundColor: colors.surface }]}>
              <IconSymbol name="pencil" size={14} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.userName}>{user?.name ?? t.profile.traveller}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ""}</Text>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{bookings.length}</Text>
              <Text style={styles.statLabel}>{t.myBookings.title}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{confirmedBookings}</Text>
              <Text style={styles.statLabel}>{t.myBookings.confirmed}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getTravelerLevel()}</Text>
              <Text style={styles.statLabel}>{t.profile.status}</Text>
            </View>
          </View>
        </View>

        {/* Notifications Toggle */}
        <View style={[styles.notifCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.notifLeft}>
            <View style={[styles.notifIcon, { backgroundColor: colors.primary + "15" }]}>
              <IconSymbol name="bell.fill" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.notifTitle, { color: colors.foreground }]}>{t.profile.notifications}</Text>
              <Text style={[styles.notifSub, { color: colors.muted }]}>{t.profile.notificationsHint}</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Admin Daily Profit Notification - visible only to admin */}
        {isAdmin && (
          <View style={[styles.notifCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8 }]}>
            <View style={styles.notifLeft}>
              <View style={[styles.notifIcon, { backgroundColor: "#1B2B5E15" }]}>
                <IconSymbol name="chart.bar.fill" size={20} color="#1B2B5E" />
              </View>
              <View>
                <Text style={[styles.notifTitle, { color: colors.foreground }]}>
                  {language === "ar" ? "إشعار الأرباح اليومي" : "Daily Profit Alert"}
                </Text>
                <Text style={[styles.notifSub, { color: colors.muted }]}>
                  {language === "ar" ? "إشعار يومي بالأرباح الساعة 8 مساءً" : "Daily profit notification at 8 PM"}
                </Text>
              </View>
            </View>
            <Switch
              value={dailyProfitNotif}
              onValueChange={toggleDailyProfitNotif}
              trackColor={{ false: colors.border, true: "#1B2B5E" }}
              thumbColor="#FFFFFF"
            />
          </View>
        )}

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>{section.title.toUpperCase()}</Text>
            <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.menuItem,
                    index < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={item.onPress}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: (item as any).highlight ? "#1B2B5E" : colors.primary + "12" }]}>
                    <IconSymbol name={item.icon as any} size={18} color={(item as any).highlight ? "#C9A84C" : colors.primary} />
                  </View>
                  <Text style={[styles.menuLabel, { color: (item as any).highlight ? "#1B2B5E" : colors.foreground, fontWeight: (item as any).highlight ? "700" : "400" }]}>{item.label}</Text>
                  <View style={styles.menuRight}>
                    {(item as any).isSwitch ? (
                      <Switch
                        value={(item as any).switchValue ?? false}
                        onValueChange={(item as any).onSwitchChange}
                        trackColor={{ false: colors.border, true: "#1B2B5E" }}
                        thumbColor="#FFFFFF"
                      />
                    ) : (
                      <>
                        {item.value ? (
                          <Text style={[styles.menuValue, { color: colors.muted }]}>{item.value}</Text>
                        ) : null}
                        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                      </>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}



        {/* App Version — Long press to access admin */}
        <Pressable
          onLongPress={handleAdminAccess}
          delayLongPress={1500}
          style={{ alignSelf: "center" }}
        >
          <Text style={[styles.version, { color: colors.muted }]}>Royal Voyage v2.0  ·  Since 2023</Text>
        </Pressable>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            { borderColor: colors.error, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handleLogout}
        >
          <IconSymbol name="arrow.left" size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>{t.profile.signOut}</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCurrencyModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {language === "ar" ? "اختر العملة" : language === "fr" ? "Choisir la devise" : "Select Currency"}
            </Text>
            {CURRENCIES.map((c) => (
              <Pressable
                key={c.code}
                style={({ pressed }) => [
                  styles.langOption,
                  { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  currency === c.code && { backgroundColor: colors.primary + "12" },
                ]}
                onPress={() => {
                  setCurrency(c.code as AppCurrency);
                  setShowCurrencyModal(false);
                }}
              >
                <Text style={styles.langFlag}>{c.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langNative, { color: colors.foreground }]}>{c.code}</Text>
                  <Text style={[styles.langEnglish, { color: colors.muted }]}>{c.name}</Text>
                </View>
                {currency === c.code && (
                  <IconSymbol name="checkmark" size={18} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Language Picker Modal */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLangModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLangModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t.profile.selectLanguage}</Text>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={({ pressed }) => [
                  styles.langOption,
                  { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  language === lang.code && { backgroundColor: colors.primary + "12" },
                ]}
                onPress={() => {
                  setLanguage(lang.code as Language);
                  setShowLangModal(false);
                }}

              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langNative, { color: colors.foreground }]}>{lang.nativeName}</Text>
                  <Text style={[styles.langEnglish, { color: colors.muted }]}>{lang.name}</Text>
                </View>
                {language === lang.code && (
                  <IconSymbol name="checkmark" size={18} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>


    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  socialSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  socialBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: "center",
    gap: 8,
  },
  avatarContainer: { position: "relative", marginBottom: 4 },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 36, fontWeight: "700" },
  editAvatarBtn: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  userName: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  userEmail: { color: "rgba(255,255,255,0.75)", fontSize: 14 },
  statsRow: {
    flexDirection: "row", borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 24,
    marginTop: 8, gap: 0,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  notifCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 16, marginTop: 16,
    padding: 16, borderRadius: 16, borderWidth: 1,
  },
  notifLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  notifIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  notifTitle: { fontSize: 15, fontWeight: "600" },
  notifSub: { fontSize: 12, marginTop: 2 },
  menuSection: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  menuLabel: { flex: 1, fontSize: 15 },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  menuValue: { fontSize: 13 },
  version: { textAlign: "center", fontSize: 12, marginTop: 24, marginBottom: 8 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginHorizontal: 16, marginBottom: 8,
    paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "600" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: "700", textAlign: "center", paddingVertical: 16, paddingHorizontal: 20 },
  langOption: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 0.5,
  },
  langFlag: { fontSize: 28 },
  langNative: { fontSize: 16, fontWeight: "600" },
  langEnglish: { fontSize: 13, marginTop: 2 },

});
