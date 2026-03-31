import React, { useState, useMemo, useEffect } from "react";
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
  Switch,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTicketPolling } from "@/hooks/use-ticket-polling";
import {
  getAdminEmail,
  setAdminEmail,
  getAdminPassword,
  setAdminPassword,
  checkBiometricAvailability,
  isBiometricEnabled,
  setBiometricEnabled,
  authenticateWithBiometric,
  is2FAEnabled,
  set2FAEnabled,
  generateNew2FASecret,
  set2FASecret,
  get2FASecret,
  generate2FACode,
} from "@/lib/admin-security";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { useTranslation } from "@/lib/i18n";
import { Booking } from "@/lib/mock-data";
import { formatMRU } from "@/lib/currency";
import { getPricingSettings } from "@/lib/pricing-settings";
import { trpc } from "@/lib/trpc";
import { syncBookingsToNotifications } from "@/lib/admin-notification-sync";
import { getUnreadCount } from "@/lib/admin-notifications";


// Derive unique clients from bookings
type ClientRecord = {
  name: string;
  email: string;
  bookings: Booking[];
  totalSpent: number;
  lastBooking: string;
};

function deriveClients(bookings: Booking[]): ClientRecord[] {
  const map: Record<string, ClientRecord> = {};
  bookings.forEach((b) => {
    const key = (b as any).passengerName || (b as any).guestName || "Unknown";
    const email = (b as any).email || "—";
    if (!map[key]) {
      map[key] = { name: key, email, bookings: [], totalSpent: 0, lastBooking: b.date };
    }
    map[key].bookings.push(b);
    map[key].totalSpent += b.totalPrice ?? 0;
    if (b.date > map[key].lastBooking) map[key].lastBooking = b.date;
  });
  return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);
}

export default function AdminScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings, user } = useApp();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "clients" | "profits">("overview");

  // Security settings state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<"face" | "fingerprint" | "none">("none");
  const [biometricOn, setBiometricOn] = useState(false);
  // Password change state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [twoFASetupSecret, setTwoFASetupSecret] = useState("");
  const [twoFASetupCode, setTwoFASetupCode] = useState("");
  const [twoFASetupError, setTwoFASetupError] = useState("");
  const [currentAdminEmail, setCurrentAdminEmail] = useState("");

  // Multi-Consolidator state
  const [showConsolidatorModal, setShowConsolidatorModal] = useState(false);
  const [consolidatorInput, setConsolidatorInput] = useState("");
  const [consolidatorCurrencyInput, setConsolidatorCurrencyInput] = useState("MRU");
  const [consolidatorLoading, setConsolidatorLoading] = useState(false);
  const [consolidatorError, setConsolidatorError] = useState("");
  const [consolidatorModalMode, setConsolidatorModalMode] = useState<"add" | "edit">("add");
  const [editConsolidatorIndex, setEditConsolidatorIndex] = useState(-1);
  const [notifUnread, setNotifUnread] = useState(0);

  // Sync bookings to notifications and get unread count
  useEffect(() => {
    (async () => {
      try {
        await syncBookingsToNotifications(bookings);
        const count = await getUnreadCount();
        setNotifUnread(count);
      } catch {}
    })();
  }, [bookings]);
  const consolidatorConfig = trpc.amadeus.getConsolidatorConfig.useQuery();
  const setConsolidatorMut = trpc.amadeus.setConsolidatorOfficeId.useMutation();
  const setActiveMut = trpc.amadeus.setActiveConsolidator.useMutation();
  const addConsolidatorMut = trpc.amadeus.addConsolidator.useMutation();
  const removeConsolidatorMut = trpc.amadeus.removeConsolidator.useMutation();

  // Ticket polling
  const ticketPolling = useTicketPolling();

  // Load biometric, 2FA, and email state
  useEffect(() => {
    checkBiometricAvailability().then(({ available, type }) => {
      setBiometricAvailable(available);
      setBiometricType(type);
    });
    isBiometricEnabled().then(setBiometricOn);
    is2FAEnabled().then(setTwoFAEnabled);
    getAdminEmail().then(setCurrentAdminEmail);
  }, []);

  const handleChangePasswordSubmit = async () => {
    setPasswordChangeError("");
    setPasswordChangeSuccess(false);
    const currentPwd = await getAdminPassword();
    if (currentPasswordInput !== currentPwd) {
      setPasswordChangeError("كلمة المرور الحالية غير صحيحة");
      return;
    }
    if (newPasswordInput.length < 6) {
      setPasswordChangeError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError("كلمة المرور الجديدة غير متطابقة");
      return;
    }
    const ok = await setAdminPassword(newPasswordInput);
    if (ok) {
      setPasswordChangeSuccess(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setCurrentPasswordInput("");
        setNewPasswordInput("");
        setConfirmPasswordInput("");
        setPasswordChangeSuccess(false);
      }, 1200);
    } else {
      setPasswordChangeError("فشل في حفظ كلمة المرور الجديدة");
    }
  };

  const handleEnable2FA = async () => {
    const secret = generateNew2FASecret();
    setTwoFASetupSecret(secret);
    setTwoFASetupCode("");
    setTwoFASetupError("");
    setShow2FASetupModal(true);
  };

  const handleConfirm2FASetup = async () => {
    const expectedCode = generate2FACode(twoFASetupSecret);
    if (twoFASetupCode === expectedCode) {
      await set2FASecret(twoFASetupSecret);
      await set2FAEnabled(true);
      setTwoFAEnabled(true);
      setShow2FASetupModal(false);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("تم التفعيل", "تم تفعيل التحقق الثنائي بنجاح");
    } else {
      setTwoFASetupError("رمز التحقق خاطئ. حاول مرة أخرى.");
      setTwoFASetupCode("");
    }
  };

  const handleDisable2FA = async () => {
    Alert.alert("تعطيل التحقق الثنائي", "هل أنت متأكد من تعطيل التحقق الثنائي؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "تعطيل",
        style: "destructive",
        onPress: async () => {
          await set2FAEnabled(false);
          setTwoFAEnabled(false);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleBiometricToggle = async (val: boolean) => {
    if (val) {
      // Verify biometric before enabling
      const promptMsg = "تحقق لتفعيل الدخول بالبصمة";
      const success = await authenticateWithBiometric(promptMsg);
      if (success) {
        await setBiometricEnabled(true);
        setBiometricOn(true);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      await setBiometricEnabled(false);
      setBiometricOn(false);
    }
  };

  // Redirect non-admin users
  useEffect(() => {
    if (!user?.isAdmin) {
      router.replace("/auth/login" as any);
    }
  }, [user]);

  // Stats
  const stats = useMemo(() => {
    const total = bookings.length;
    const flights = bookings.filter((b) => b.type === "flight").length;
    const hotels = bookings.filter((b) => b.type === "hotel").length;
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const revenue = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
    const avgRevenue = total > 0 ? revenue / total : 0;

    // Top destination
    const destCount: Record<string, number> = {};
    bookings.forEach((b) => {
      const dest = b.flight?.destination || b.hotel?.city || "Unknown";
      destCount[dest] = (destCount[dest] || 0) + 1;
    });
    const topDest = Object.entries(destCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return { total, flights, hotels, confirmed, cancelled, pending, revenue, avgRevenue, topDest };
  }, [bookings]);

  const clients = useMemo(() => deriveClients(bookings), [bookings]);

  // حساب الأرباح الشهرية من رسوم الوكالة
  const profitStats = useMemo(() => {
    const pricing = getPricingSettings();
    const confirmed = bookings.filter((b) => b.status === "confirmed");

    // تصنيف الحجوزات حسب النوع
    const domesticFlights = confirmed.filter((b) => {
      if (b.type !== "flight") return false;
      const origin = b.flight?.originCode || "";
      const dest = b.flight?.destinationCode || "";
      const MR_AIRPORTS = ["NKC","NDB","ATR","KFA","MOM","OUZ","SEY","THI","TMD","ZLG","AEO","EMN","LEG","MBR","OGJ"];
      return MR_AIRPORTS.includes(origin.toUpperCase()) && MR_AIRPORTS.includes(dest.toUpperCase());
    });
    const internationalFlights = confirmed.filter((b) => b.type === "flight" && !domesticFlights.includes(b));
    const hotels = confirmed.filter((b) => b.type === "hotel");

    const domesticProfit = domesticFlights.length * pricing.agencyFeeDomesticMRU;
    const intlProfit = internationalFlights.length * pricing.agencyFeeMRU;
    const hotelProfit = hotels.length * pricing.agencyFeeMRU;

    // تجميع الأرباح حسب الشهر
    const monthlyMap: Record<string, { month: string; count: number; profit: number }> = {};
    confirmed.forEach((b) => {
      const monthKey = (b.date || "").substring(0, 7);
      if (!monthKey) return;
      if (!monthlyMap[monthKey]) {
        const [year, month] = monthKey.split("-");
        const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
        monthlyMap[monthKey] = { month: `${monthNames[parseInt(month) - 1]} ${year}`, count: 0, profit: 0 };
      }
      const isDomestic = domesticFlights.includes(b);
      const fee = b.type === "flight"
        ? (isDomestic ? pricing.agencyFeeDomesticMRU : pricing.agencyFeeMRU)
        : pricing.agencyFeeMRU;
      monthlyMap[monthKey].count += 1;
      monthlyMap[monthKey].profit += fee;
    });

    const months = Object.entries(monthlyMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([, v]) => v);

    const totalProfit = domesticProfit + intlProfit + hotelProfit;
    const avgMonthlyProfit = months.length > 0 ? months.reduce((s, m) => s + m.profit, 0) / months.length : 0;
    const maxProfit = months.length > 0 ? Math.max(...months.map((m) => m.profit)) : 1;

    const breakdown = [
      { label: "رحلات داخلية", count: domesticFlights.length, profit: domesticProfit, color: "#0a7ea4" },
      { label: "رحلات دولية", count: internationalFlights.length, profit: intlProfit, color: "#1B2B5E" },
      { label: "فنادق", count: hotels.length, profit: hotelProfit, color: "#C4973A" },
    ];

    return { months, totalProfit, avgMonthlyProfit, maxProfit, confirmedCount: confirmed.length, breakdown };
  }, [bookings]);

  const s = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: "#1B2B5E",
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF",
      textAlign: "center",
    },
    tabRow: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 12,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.muted,
    },
    barChart: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    barRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    barLabel: {
      width: 80,
      fontSize: 12,
      color: colors.muted,
    },
    barTrack: {
      flex: 1,
      height: 10,
      backgroundColor: colors.border,
      borderRadius: 5,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 5,
    },
    barValue: {
      width: 30,
      fontSize: 12,
      color: colors.foreground,
      textAlign: "right",
      marginLeft: 8,
    },
    bookingCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bookingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    bookingRef: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
    },
    bookingType: {
      fontSize: 11,
      fontWeight: "600",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    bookingDate: {
      fontSize: 12,
      color: colors.muted,
    },
    bookingAmount: {
      fontSize: 14,
      fontWeight: "700",
      color: "#C9A84C",
    },
    statusBadge: {
      fontSize: 11,
      fontWeight: "600",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    clientCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    clientAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#1B2B5E",
      alignItems: "center",
      justifyContent: "center",
    },
    clientAvatarText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 16,
    },
    clientName: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
    },
    clientEmail: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    clientStats: {
      marginTop: 4,
      flexDirection: "row",
      gap: 12,
    },
    clientStatText: {
      fontSize: 12,
      color: colors.muted,
    },
    clientAmount: {
      fontSize: 13,
      fontWeight: "700",
      color: "#C9A84C",
    },
    revenueCard: {
      backgroundColor: "#1B2B5E",
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    revenueLabel: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      marginBottom: 4,
    },
    revenueValue: {
      fontSize: 26,
      fontWeight: "800",
      color: "#C9A84C",
    },
    revenueSubLabel: {
      fontSize: 12,
      color: "rgba(255,255,255,0.6)",
      marginTop: 2,
    },
    revenueSubValue: {
      fontSize: 13,
      fontWeight: "600",
      color: "#FFFFFF",
    },
  });

  // Show loading while checking auth
  if (!user?.isAdmin) {
    return null;
  }

  const flightPct = stats.total > 0 ? stats.flights / stats.total : 0;
  const hotelPct = stats.total > 0 ? stats.hotels / stats.total : 0;
  const confirmedPct = stats.total > 0 ? stats.confirmed / stats.total : 0;
  const cancelledPct = stats.total > 0 ? stats.cancelled / stats.total : 0;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={{ width: 30 }}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={s.headerTitle}>{t.admin.title}</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(["overview", "bookings", "clients", "profits"] as const).map((tab) => {
          const active = activeTab === tab;
          const label =
            tab === "overview" ? t.admin.overview :
            tab === "bookings" ? t.admin.bookings :
            tab === "clients" ? t.admin.clients :
            "الأرباح";
          return (
            <Pressable
              key={tab}
              style={s.tab}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, { color: active ? "#1B2B5E" : colors.muted }]}>
                {label}
              </Text>
              {active && (
                <View style={{ height: 2, width: "60%", backgroundColor: "#1B2B5E", borderRadius: 2, marginTop: 4 }} />
              )}
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <View style={s.section}>
            {/* Duffel API Status Card */}
            <View style={{
              backgroundColor: "#0F172A",
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#1E293B",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#C9A84C20", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="building.fill" size={20} color="#C9A84C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>Duffel API</Text>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>Connection Status & Instant Ticketing</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#22C55E20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" }} />
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#22C55E" }}>Production</Text>
                </View>
              </View>
              {/* Office ID */}
              <View style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, letterSpacing: 1 }}>OFFICE ID</Text>
                <Text style={{ fontSize: 22, fontWeight: "800", color: "#C9A84C", letterSpacing: 3, fontFamily: "monospace" }}>NKC26239A</Text>
              </View>
              {/* Stats Row */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 10, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>{stats.total}</Text>
                  <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>إجمالي الحجوزات</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 10, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#22C55E" }}>{stats.confirmed}</Text>
                  <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>مؤكدة</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 10, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#F59E0B" }}>{stats.pending}</Text>
                  <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>معلقة</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 10, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: "#EF4444" }}>{stats.cancelled}</Text>
                  <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>ملغاة</Text>
                </View>
              </View>
            </View>

            {/* Multi-Consolidator Card */}
            <View style={{
              backgroundColor: "#0F172A",
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#1E293B",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#6366F120", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="ticket.fill" size={20} color="#6366F1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>Consolidators</Text>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>إصدار التذاكر عبر الوسطاء</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#22C55E20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#22C55E" }}>
                    {(consolidatorConfig.data as any)?.consolidators?.length || 0} وسيط
                  </Text>
                </View>
              </View>

              {/* List of consolidators */}
              {((consolidatorConfig.data as any)?.consolidators || []).map((c: any, idx: number) => (
                <Pressable
                  key={c.officeId}
                  style={({ pressed }) => [{
                    backgroundColor: c.isActive ? "#6366F115" : "#1E293B",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 8,
                    borderWidth: c.isActive ? 1.5 : 1,
                    borderColor: c.isActive ? "#6366F1" : "#334155",
                    opacity: pressed ? 0.7 : 1,
                  }]}
                  onPress={async () => {
                    try {
                      await setActiveMut.mutateAsync({ index: idx });
                      consolidatorConfig.refetch();
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ fontSize: 16, fontWeight: "800", color: c.isActive ? "#6366F1" : "#FFFFFF", letterSpacing: 1.5, fontFamily: "monospace" }}>
                          {c.officeId}
                        </Text>
                        {c.isActive && (
                          <View style={{ backgroundColor: "#6366F1", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, fontWeight: "700", color: "#FFFFFF" }}>نشط</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{c.label}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={{ backgroundColor: c.currency === "AOA" ? "#E3193720" : "#C9A84C20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: c.currency === "AOA" ? "#E31937" : "#C9A84C" }}>{c.currency}</Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.5 : 1 }]}
                        onPress={() => {
                          Alert.alert(
                            "حذف الوسيط",
                            `هل تريد حذف ${c.officeId} (${c.currency})؟`,
                            [
                              { text: "إلغاء", style: "cancel" },
                              {
                                text: "حذف",
                                style: "destructive",
                                onPress: async () => {
                                  try {
                                    await removeConsolidatorMut.mutateAsync({ index: idx });
                                    consolidatorConfig.refetch();
                                    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                  } catch {}
                                },
                              },
                            ]
                          );
                        }}
                      >
                        <IconSymbol name="xmark.circle.fill" size={18} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              ))}

              {/* Ticketing mode info */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, marginTop: 4 }}>
                <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 10, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>{consolidatorConfig.data?.ticketingMode || "DELAY_TO_QUEUE"}</Text>
                  <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>وضع الإصدار</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 10, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#C9A84C" }}>تلقائي</Text>
                  <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>إرسال PNR</Text>
                </View>
              </View>

              {/* Add Consolidator Button */}
              <Pressable
                style={({ pressed }) => [{
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                  backgroundColor: "#6366F1", borderRadius: 10, paddingVertical: 12,
                  opacity: pressed ? 0.7 : 1,
                }]}
                onPress={() => {
                  setConsolidatorInput("");
                  setConsolidatorCurrencyInput("MRU");
                  setConsolidatorError("");
                  setConsolidatorModalMode("add");
                  setShowConsolidatorModal(true);
                }}
              >
                <IconSymbol name="plus.circle.fill" size={16} color="#FFFFFF" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>إضافة وسيط جديد</Text>
              </Pressable>
            </View>

            {/* Ticket Polling Card */}
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#22C55E20", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="ticket.fill" size={20} color="#22C55E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>متابعة إصدار التذاكر</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}>فحص تلقائي كل 60 ثانية + إشعار عند الإصدار</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: ticketPolling.pollingEnabled ? "#22C55E20" : "#F59E0B20", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ticketPolling.pollingEnabled ? "#22C55E" : "#F59E0B" }} />
                  <Text style={{ fontSize: 11, fontWeight: "600", color: ticketPolling.pollingEnabled ? "#22C55E" : "#F59E0B" }}>
                    {ticketPolling.pollingEnabled ? "مفعّل" : "موقف"}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 10, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>{ticketPolling.pendingCount}</Text>
                  <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>تذاكر معلقة</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.background, borderRadius: 10, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>{ticketPolling.lastCheck ? new Date(ticketPolling.lastCheck).toLocaleTimeString("ar") : "—"}</Text>
                  <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>آخر فحص</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>متابعة تلقائية</Text>
                  <Switch
                    value={ticketPolling.pollingEnabled}
                    onValueChange={ticketPolling.togglePolling}
                    trackColor={{ false: colors.border, true: "#22C55E" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <Pressable
                  style={({ pressed }) => [{
                    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                    backgroundColor: "#22C55E", borderRadius: 10, paddingVertical: 10,
                    opacity: pressed || ticketPolling.isPolling ? 0.7 : 1,
                  }]}
                  disabled={ticketPolling.isPolling}
                  onPress={ticketPolling.checkNow}
                >
                  {ticketPolling.isPolling ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol name="magnifyingglass" size={14} color="#FFFFFF" />
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>فحص الآن</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            {/* بطاقة تقارير المبيعات */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/sales-reports" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="chart.bar.fill" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>تقارير المبيعات</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>تقارير يومية وشهرية مرتبطة بالمكتب</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بطاقة الحسابات التجارية */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/business-accounts" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#C9A84C", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="building.fill" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>الحسابات التجارية</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>إدارة الشركات والوكالات والعمولات</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بطاقة طلبات شحن الرصيد */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/topup-requests" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="creditcard.fill" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>طلبات شحن الرصيد</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>موافقة أو رفض طلبات شحن الرصيد للحسابات التجارية</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بطاقة إدارة الموظفين */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/employees" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="person.3.fill" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>إدارة الموظفين</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>الأدوار والصلاحيات وحسابات الموظفين</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بطاقة التقارير المالية */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/financial-reports" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#EC4899", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 20 }}>📈</Text>
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>التقارير المالية</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>الإيرادات والعمولات والتقارير الشهرية</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بطاقة Duffel Webhooks */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/webhooks" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="bolt.fill" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>Duffel Webhooks</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>إشعارات تلقائية من شركات الطيران</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بوابة الموظفين */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/employee-login" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#0EA5E9", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 20 }}>👨‍💼</Text>
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>بوابة الموظفين</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>تسجيل دخول الموظفين والوصول حسب الصلاحيات</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* Revenue Card */}
            <View style={s.revenueCard}>
              <View>
                <Text style={s.revenueLabel}>{t.admin.totalRevenue}</Text>
                <Text style={s.revenueValue}>{formatMRU(stats.revenue)}</Text>
                <Text style={s.revenueSubLabel}>{t.admin.avgRevenuePerBooking}</Text>
                <Text style={s.revenueSubValue}>{formatMRU(stats.avgRevenue)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <IconSymbol name="crown.fill" size={40} color="#C9A84C" />
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 8 }}>
                  {t.admin.topDestination}
                </Text>
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
                  {stats.topDest}
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <Text style={s.sectionTitle}>{t.admin.totalBookings}</Text>
            <View style={s.statsGrid}>
              <View style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: "#1B2B5E" }]}>
                <Text style={[s.statValue, { color: "#1B2B5E" }]}>{stats.total}</Text>
                <Text style={s.statLabel}>{t.admin.totalBookings}</Text>
              </View>
              <View style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: "#0a7ea4" }]}>
                <Text style={[s.statValue, { color: "#0a7ea4" }]}>{stats.flights}</Text>
                <Text style={s.statLabel}>{t.admin.flightBookings}</Text>
              </View>
              <View style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: "#C9A84C" }]}>
                <Text style={[s.statValue, { color: "#C9A84C" }]}>{stats.hotels}</Text>
                <Text style={s.statLabel}>{t.admin.hotelBookings}</Text>
              </View>
              <View style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: colors.success }]}>
                <Text style={[s.statValue, { color: colors.success }]}>{stats.confirmed}</Text>
                <Text style={s.statLabel}>{t.admin.confirmedBookings}</Text>
              </View>
              <View style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: colors.error }]}>
                <Text style={[s.statValue, { color: colors.error }]}>{stats.cancelled}</Text>
                <Text style={s.statLabel}>{t.admin.cancelledBookings}</Text>
              </View>
              <View style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: colors.warning }]}>
                <Text style={[s.statValue, { color: colors.warning }]}>{stats.pending}</Text>
                <Text style={s.statLabel}>{t.admin.pendingBookings}</Text>
              </View>
            </View>

            {/* بطاقة سجل الإشعارات */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/notifications" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#F59E0B", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="bell.fill" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>سجل الإشعارات</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>مراجعة جميع إشعارات الحجوزات والإلغاءات</Text>
                  {notifUnread > 0 && <Text style={{ fontSize: 12, color: "#EF4444", fontWeight: "700" }}>{notifUnread} غير مقروءة</Text>}
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بطاقة إدارة الأسعار */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/pricing" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#1B2B5E", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="tag.fill" size={22} color="#C9A84C" />
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>إدارة الأسعار</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>رسوم الوكالة وأسعار الصرف</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بطاقة إدارة PNR */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/manage-pnr" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#C9A84C", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="paperplane.fill" size={22} color="#1B2B5E" />
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>إدارة PNR</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>تحديث رموز الحجز الحقيقية للزبائن</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بطاقة تتبع الطلبات */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/update-status" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="checkmark.circle.fill" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>تتبع الطلبات</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>تحديث حالة الحجوزات وإشعار الزبائن</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بطاقة تأكيد الدفع */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/confirm-payment" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="checkmark.seal.fill" size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>تأكيد الدفع</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>تأكيد دفع الحجوزات وإرسال تأكيد للزبون</Text>
                </View>
                {(() => {
                  const pendingCount = bookings.filter((b) => b.status !== "cancelled" && b.status !== "confirmed").length;
                  const cashPending = bookings.filter((b) => b.status === "confirmed" && b.paymentDeadline && new Date(b.paymentDeadline).getTime() > Date.now()).length;
                  const total = pendingCount + cashPending;
                  if (total === 0) return null;
                  return (
                    <View style={{ backgroundColor: "#EF4444", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 }}>
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{total}</Text>
                    </View>
                  );
                })()}
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* Security Settings Card */}
            <View style={[s.barChart, { marginBottom: 16 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#EF444420", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="shield.fill" size={20} color="#EF4444" />
                </View>
                <Text style={[s.sectionTitle, { marginBottom: 0 }]}>إعدادات الأمان</Text>
              </View>

              {/* Biometric Toggle */}
              {biometricAvailable && (
                <View style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  backgroundColor: colors.background, borderRadius: 12, padding: 14, marginBottom: 10,
                }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                    <IconSymbol name={biometricType === "face" ? "faceid" as any : "touchid" as any} size={18} color={colors.primary} />
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                        {biometricType === "face" ? "Face ID" : "البصمة"}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                        {biometricType === "face" ? "الدخول بالتعرف على الوجه" : "الدخول ببصمة الإصبع"}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={biometricOn}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              )}

              {/* Change Password */}
              <Pressable
                style={({ pressed }) => [{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  backgroundColor: colors.background, borderRadius: 12, padding: 14, marginBottom: 10,
                  opacity: pressed ? 0.7 : 1,
                }]}
                onPress={() => {
                  setCurrentPasswordInput(""); setNewPasswordInput(""); setConfirmPasswordInput("");
                  setPasswordChangeError(""); setPasswordChangeSuccess(false);
                  setShowChangePasswordModal(true);
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <IconSymbol name="lock.fill" size={18} color="#E67E22" />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>تغيير كلمة المرور</Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>تحديث كلمة مرور دخول الإدارة</Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </Pressable>

              {/* Admin Email Display */}
              <View style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: colors.background, borderRadius: 12, padding: 14, marginBottom: 10,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <IconSymbol name="paperplane.fill" size={18} color="#3B82F6" />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>البريد الإلكتروني</Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{currentAdminEmail || "suporte@royalvoyage.online"}</Text>
                  </View>
                </View>
              </View>

              {/* 2FA Toggle */}
              <View style={{
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                backgroundColor: colors.background, borderRadius: 12, padding: 14, marginBottom: 10,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                  <IconSymbol name="shield.fill" size={18} color={twoFAEnabled ? "#22C55E" : colors.muted} />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>التحقق الثنائي (2FA)</Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                      {twoFAEnabled ? "مفعل - رمز تحقق إضافي عند الدخول" : "معطل - تفعيل لحماية إضافية"}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={twoFAEnabled}
                  onValueChange={(val) => val ? handleEnable2FA() : handleDisable2FA()}
                  trackColor={{ false: colors.border, true: "#22C55E" }}
                />
              </View>

              {/* Credentials Management */}
              <Pressable
                style={({ pressed }) => [{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  backgroundColor: colors.background, borderRadius: 12, padding: 14, marginBottom: 10,
                  opacity: pressed ? 0.7 : 1,
                }]}
                onPress={() => router.push("/admin/credentials" as any)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <IconSymbol name="lock.fill" size={18} color="#8B5CF6" />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>إدارة بيانات الاعتماد</Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>تغيير البريد وكلمة المرور</Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </Pressable>

              {/* Login Audit Log */}
              <Pressable
                style={({ pressed }) => [{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  backgroundColor: colors.background, borderRadius: 12, padding: 14,
                  opacity: pressed ? 0.7 : 1,
                }]}
                onPress={() => router.push("/admin/login-audit" as any)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <IconSymbol name="doc.text.fill" size={18} color="#06B6D4" />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>سجل محاولات الدخول</Text>
                    <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>عرض تاريخ جميع محاولات تسجيل الدخول</Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </Pressable>
            </View>

            {/* Distribution Bar Chart */}
            <Text style={s.sectionTitle}>{t.admin.revenue}</Text>
            <View style={s.barChart}>
              <View style={s.barRow}>
                <Text style={s.barLabel}>{t.admin.flightBookings}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${flightPct * 100}%`, backgroundColor: "#0a7ea4" }]} />
                </View>
                <Text style={s.barValue}>{stats.flights}</Text>
              </View>
              <View style={s.barRow}>
                <Text style={s.barLabel}>{t.admin.hotelBookings}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${hotelPct * 100}%`, backgroundColor: "#C9A84C" }]} />
                </View>
                <Text style={s.barValue}>{stats.hotels}</Text>
              </View>
              <View style={s.barRow}>
                <Text style={s.barLabel}>{t.admin.confirmedBookings}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${confirmedPct * 100}%`, backgroundColor: "#22C55E" }]} />
                </View>
                <Text style={s.barValue}>{stats.confirmed}</Text>
              </View>
              <View style={[s.barRow, { marginBottom: 0 }]}>
                <Text style={s.barLabel}>{t.admin.cancelledBookings}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${cancelledPct * 100}%`, backgroundColor: "#EF4444" }]} />
                </View>
                <Text style={s.barValue}>{stats.cancelled}</Text>
              </View>
            </View>
          </View>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t.admin.recentBookings} ({bookings.length})</Text>
            {bookings.length === 0 ? (
              <Text style={{ color: colors.muted, textAlign: "center", marginTop: 32 }}>{t.admin.noBookings}</Text>
            ) : (
              bookings.slice().reverse().map((b) => {
                const statusColor =
                  b.status === "confirmed" ? colors.success :
                  b.status === "cancelled" ? colors.error :
                  colors.warning;
                const typeColor = b.type === "flight" ? "#0a7ea4" : "#C9A84C";
                const dest = b.flight
                  ? `${b.flight.originCode} → ${b.flight.destinationCode}`
                  : b.hotel?.name ?? "—";
                return (
                  <Pressable
                    key={b.id}
                    style={({ pressed }) => [s.bookingCard, { opacity: pressed ? 0.85 : 1 }]}
                    onPress={() => router.push({ pathname: "/admin/booking-detail" as any, params: { id: b.id } })}
                  >
                    <View style={s.bookingRow}>
                      <Text style={s.bookingRef}>{b.reference}</Text>
                      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                        {b.ticketSent && (
                          <Text style={{ fontSize: 14 }}>✉️</Text>
                        )}
                        <Text style={[s.bookingType, { backgroundColor: typeColor + "20", color: typeColor }]}>
                          {b.type === "flight" ? t.admin.flight : t.admin.hotel}
                        </Text>
                        <Text style={[s.statusBadge, { backgroundColor: statusColor + "20", color: statusColor }]}>
                          {b.status === "confirmed" ? t.admin.confirmed :
                           b.status === "cancelled" ? t.admin.cancelled :
                           b.status === "processing" ? "معالجة" :
                           b.status === "airline_confirmed" ? "مؤكد ✈️" : t.admin.pending}
                        </Text>
                      </View>
                    </View>
                    <View style={s.bookingRow}>
                      <Text style={s.bookingDate}>{dest}</Text>
                      <Text style={s.bookingAmount}>{formatMRU(b.totalPrice ?? 0)}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                      <Text style={s.bookingDate}>{b.date}</Text>
                      <Text style={{ fontSize: 11, color: colors.muted }}>اضغط للتفاصيل ›</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {/* CLIENTS TAB */}
        {activeTab === "clients" && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t.admin.allClients} ({clients.length})</Text>
            {clients.length === 0 ? (
              <Text style={{ color: colors.muted, textAlign: "center", marginTop: 32 }}>{t.admin.noBookings}</Text>
            ) : (
              clients.map((c, i) => (
                <View key={c.name + i} style={s.clientCard}>
                  <View style={s.clientAvatar}>
                    <Text style={s.clientAvatarText}>
                      {c.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.clientName}>{c.name}</Text>
                    <Text style={s.clientEmail}>{c.email}</Text>
                    <View style={s.clientStats}>
                      <Text style={s.clientStatText}>
                        {c.bookings.length} {t.admin.bookingsCount}
                      </Text>
                      <Text style={s.clientAmount}>
                        {formatMRU(c.totalSpent)}
                      </Text>
                    </View>
                    <Text style={[s.clientStatText, { marginTop: 2 }]}>
                      {t.admin.lastBooking}: {c.lastBooking}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* PROFITS TAB */}
        {activeTab === "profits" && (
          <View style={s.section}>
            {/* بطاقات الملخص */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              <View style={[s.statCard, { flex: 1, backgroundColor: "#1B2B5E" }]}>
                <Text style={[s.statLabel, { color: "rgba(255,255,255,0.7)" }]}>إجمالي الأرباح</Text>
                <Text style={[s.statValue, { color: "#FFFFFF" }]}>{formatMRU(profitStats.totalProfit)}</Text>
              </View>
              <View style={[s.statCard, { flex: 1 }]}>
                <Text style={s.statLabel}>متوسط شهري</Text>
                <Text style={s.statValue}>{formatMRU(Math.round(profitStats.avgMonthlyProfit))}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              <View style={[s.statCard, { flex: 1 }]}>
                <Text style={s.statLabel}>حجوزات مؤكدة</Text>
                <Text style={s.statValue}>{profitStats.confirmedCount}</Text>
              </View>
              <View style={[s.statCard, { flex: 1 }]}>
                <Text style={s.statLabel}>رسوم لكل حجز</Text>
                <Text style={s.statValue}>{formatMRU(getPricingSettings().agencyFeeMRU)}</Text>
              </View>
            </View>

            {/* مخطط الأرباح الشهرية */}
            <Text style={s.sectionTitle}>الأرباح الشهرية (6 أشهر)</Text>
            {profitStats.months.length === 0 ? (
              <Text style={{ color: colors.muted, textAlign: "center", marginTop: 32, marginBottom: 32 }}>
                لا توجد حجوزات مؤكدة بعد
              </Text>
            ) : (
              profitStats.months.map((m, i) => {
                const barWidth = profitStats.maxProfit > 0 ? (m.profit / profitStats.maxProfit) * 100 : 0;
                return (
                  <View key={i} style={[s.bookingCard, { marginBottom: 10 }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>{m.month}</Text>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: "#1B2B5E", fontWeight: "700", fontSize: 15 }}>{formatMRU(m.profit)}</Text>
                        <Text style={{ color: colors.muted, fontSize: 11 }}>{m.count} حجز</Text>
                      </View>
                    </View>
                    {/* شريط التقدم */}
                    <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
                      <View style={{ height: 8, width: `${barWidth}%`, backgroundColor: "#1B2B5E", borderRadius: 4 }} />
                    </View>
                  </View>
                );
              })
            )}

            {/* تفصيل حسب نوع الحجز */}
            <Text style={[s.sectionTitle, { marginTop: 20 }]}>تفصيل حسب نوع الحجز</Text>
            {profitStats.breakdown.map((item, i) => (
              <View key={i} style={[s.bookingCard, { marginBottom: 10 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color }} />
                    <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>{item.label}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: item.color, fontWeight: "700", fontSize: 15 }}>{formatMRU(item.profit)}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>{item.count} حجز</Text>
                  </View>
                </View>
                <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3 }}>
                  <View style={{
                    height: 6,
                    width: profitStats.totalProfit > 0 ? `${(item.profit / profitStats.totalProfit) * 100}%` : "0%",
                    backgroundColor: item.color,
                    borderRadius: 3
                  }} />
                </View>
              </View>
            ))}

            {/* أزرار الإجراءات */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <Pressable
                style={({ pressed }) => [{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: "#22C55E",
                  opacity: pressed ? 0.85 : 1,
                }]}
                onPress={() => router.push("/admin/profit-report" as any)}
              >
                <IconSymbol name="doc.text.fill" size={18} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>تصدير PDF</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: "#0a7ea4",
                  opacity: pressed ? 0.85 : 1,
                }]}
                onPress={() => router.push("/admin/pricing" as any)}
              >
                <IconSymbol name="slider.horizontal.3" size={18} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>إدارة الأسعار</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }} onPress={() => setShowChangePasswordModal(false)}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: "85%", maxWidth: 360 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#E67E22", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 }}>
              <IconSymbol name="lock.fill" size={24} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, textAlign: "center", marginBottom: 6 }}>
              تغيير كلمة المرور
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", marginBottom: 20 }}>
              أدخل كلمة المرور الحالية ثم الجديدة
            </Text>

            {passwordChangeSuccess && (
              <View style={{ backgroundColor: "#22C55E18", borderRadius: 10, padding: 10, marginBottom: 12 }}>
                <Text style={{ color: "#22C55E", fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                  تم تغيير كلمة المرور بنجاح
                </Text>
              </View>
            )}

            {passwordChangeError !== "" && (
              <View style={{ backgroundColor: colors.error + "18", borderRadius: 10, padding: 10, marginBottom: 12 }}>
                <Text style={{ color: colors.error, fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                  {passwordChangeError}
                </Text>
              </View>
            )}

            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: colors.foreground, backgroundColor: colors.background, marginBottom: 10 }}
              placeholder="كلمة المرور الحالية"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={currentPasswordInput}
              onChangeText={setCurrentPasswordInput}
              autoFocus
            />
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: colors.foreground, backgroundColor: colors.background, marginBottom: 10 }}
              placeholder="كلمة المرور الجديدة"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={newPasswordInput}
              onChangeText={setNewPasswordInput}
            />
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, color: colors.foreground, backgroundColor: colors.background, marginBottom: 16 }}
              placeholder="تأكيد كلمة المرور الجديدة"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={confirmPasswordInput}
              onChangeText={setConfirmPasswordInput}
              returnKeyType="done"
              onSubmitEditing={handleChangePasswordSubmit}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                style={({ pressed }) => [{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.muted }}>إلغاء</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: "#E67E22", alignItems: "center", opacity: pressed ? 0.8 : 1 }]}
                onPress={handleChangePasswordSubmit}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>حفظ</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* 2FA Setup Modal */}
      <Modal
        visible={show2FASetupModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShow2FASetupModal(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }} onPress={() => setShow2FASetupModal(false)}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: "85%", maxWidth: 360 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 16 }}>
              <IconSymbol name="shield.fill" size={24} color="#FFFFFF" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, textAlign: "center", marginBottom: 6 }}>
              تفعيل التحقق الثنائي
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", marginBottom: 16 }}>
              احفظ هذا المفتاح السري في تطبيق المصادقة (Google Authenticator)
            </Text>

            {/* Secret Key Display */}
            <View style={{ backgroundColor: colors.background, borderRadius: 12, padding: 16, marginBottom: 16, alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 6 }}>المفتاح السري</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, letterSpacing: 3, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
                {twoFASetupSecret}
              </Text>
            </View>

            {twoFASetupError !== "" && (
              <View style={{ backgroundColor: colors.error + "18", borderRadius: 10, padding: 10, marginBottom: 12 }}>
                <Text style={{ color: colors.error, fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                  {twoFASetupError}
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", marginBottom: 10 }}>
              أدخل الرمز المكون من 6 أرقام للتأكيد
            </Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 20, color: colors.foreground, backgroundColor: colors.background, marginBottom: 16, textAlign: "center", letterSpacing: 8 }}
              placeholder="000000"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              maxLength={6}
              value={twoFASetupCode}
              onChangeText={setTwoFASetupCode}
              returnKeyType="done"
              onSubmitEditing={handleConfirm2FASetup}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                style={({ pressed }) => [{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setShow2FASetupModal(false)}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.muted }}>إلغاء</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: "#22C55E", alignItems: "center", opacity: pressed ? 0.8 : 1 }]}
                onPress={handleConfirm2FASetup}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>تفعيل</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Add/Edit Consolidator Modal */}
      <Modal visible={showConsolidatorModal} transparent animationType="fade" onRequestClose={() => setShowConsolidatorModal(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}
          onPress={() => setShowConsolidatorModal(false)}
        >
          <View style={{ width: "100%", maxWidth: 380, backgroundColor: colors.surface, borderRadius: 20, padding: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#6366F120", alignItems: "center", justifyContent: "center" }}>
                <IconSymbol name="ticket.fill" size={22} color="#6366F1" />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                  {consolidatorModalMode === "add" ? "إضافة وسيط جديد" : "تعديل الوسيط"}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>أدخل Office ID واختر العملة</Text>
              </View>
            </View>

            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>Office ID</Text>
            <TextInput
              style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 14,
                fontSize: 18,
                fontWeight: "700",
                color: colors.foreground,
                borderWidth: 1,
                borderColor: consolidatorError ? "#EF4444" : colors.border,
                textAlign: "center",
                letterSpacing: 2,
                marginBottom: 12,
              }}
              value={consolidatorInput}
              onChangeText={(t) => { setConsolidatorInput(t.toUpperCase()); setConsolidatorError(""); }}
              placeholder="LAD282354"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              maxLength={10}
              returnKeyType="done"
            />

            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>عملة الإصدار</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {["MRU", "AOA", "EUR", "USD", "XOF"].map((cur) => (
                <Pressable
                  key={cur}
                  style={({ pressed }) => [{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: consolidatorCurrencyInput === cur ? "#6366F1" : colors.background,
                    borderWidth: 1,
                    borderColor: consolidatorCurrencyInput === cur ? "#6366F1" : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  }]}
                  onPress={() => setConsolidatorCurrencyInput(cur)}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: consolidatorCurrencyInput === cur ? "#FFFFFF" : colors.foreground }}>{cur}</Text>
                </Pressable>
              ))}
            </View>

            {consolidatorError ? (
              <Text style={{ fontSize: 12, color: "#EF4444", marginBottom: 8, textAlign: "center" }}>{consolidatorError}</Text>
            ) : (
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 8, textAlign: "center" }}>صيغة IATA: 3 أحرف + أرقام + حرف (مثل LAD282354 أو NKC26203A)</Text>
            )}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <Pressable
                style={({ pressed }) => [{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setShowConsolidatorModal(false)}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.muted }}>إلغاء</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: "#6366F1", alignItems: "center", opacity: pressed || consolidatorLoading ? 0.7 : 1 }]}
                disabled={consolidatorLoading}
                onPress={async () => {
                  if (!consolidatorInput.trim()) {
                    setConsolidatorError("أدخل Office ID");
                    return;
                  }
                  setConsolidatorLoading(true);
                  setConsolidatorError("");
                  try {
                    const result = await addConsolidatorMut.mutateAsync({
                      officeId: consolidatorInput.trim(),
                      currency: consolidatorCurrencyInput,
                    });
                    if (result.success) {
                      consolidatorConfig.refetch();
                      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert(
                        "✅ تمت الإضافة",
                        `الوسيط: ${consolidatorInput.trim()} (عملة: ${consolidatorCurrencyInput})`
                      );
                      setShowConsolidatorModal(false);
                    } else {
                      setConsolidatorError((result as any).error || "فشل الإضافة");
                    }
                  } catch (err: any) {
                    setConsolidatorError(err?.message || "خطأ في الاتصال");
                  } finally {
                    setConsolidatorLoading(false);
                  }
                }}
              >
                {consolidatorLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                    {consolidatorModalMode === "add" ? "إضافة" : "حفظ"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}
