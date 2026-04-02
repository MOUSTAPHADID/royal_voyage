import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { formatMRU } from "@/lib/currency";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EMPLOYEE_SESSION_KEY = "royal_voyage_employee_session";

type EmployeePermissions = {
  canManageBookings: boolean;
  canManagePayments: boolean;
  canManagePricing: boolean;
  canManageCustomers: boolean;
  canViewReports: boolean;
  canManageEmployees: boolean;
  canManageBusinessAccounts: boolean;
};

type EmployeeSession = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  department: string;
  permissions: EmployeePermissions;
  loginAt: string;
};

const ROLE_LABELS: Record<string, string> = {
  manager: "مدير",
  accountant: "محاسب",
  booking_agent: "وكيل حجوزات",
  support: "دعم عملاء",
};

const ROLE_ICON_NAMES: Record<string, string> = {
  manager: "briefcase.fill",
  accountant: "chart.bar.fill",
  booking_agent: "airplane",
  support: "phone.fill",
};

type DashboardAction = {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  color: string;
  route: string;
  permission?: keyof EmployeePermissions;
};

const ALL_ACTIONS: DashboardAction[] = [
  {
    id: "bookings",
    title: "إدارة الحجوزات",
    subtitle: "عرض وإدارة جميع الحجوزات",
    iconName: "list.bullet.clipboard",
    color: "#3B82F6",
    route: "/admin/confirm-payment",
    permission: "canManageBookings",
  },
  {
    id: "payments",
    title: "تأكيد المدفوعات",
    subtitle: "مراجعة وتأكيد المدفوعات",
    iconName: "banknote.fill",
    color: "#22C55E",
    route: "/admin/confirm-payment",
    permission: "canManagePayments",
  },
  {
    id: "pricing",
    title: "إعدادات التسعير",
    subtitle: "تعديل الأسعار وأسعار الصرف",
    iconName: "percent",
    color: "#F59E0B",
    route: "/admin/pricing",
    permission: "canManagePricing",
  },
  {
    id: "pnr",
    title: "إدارة PNR والتذاكر",
    subtitle: "إدخال أرقام PNR والتذاكر",
    iconName: "ticket.fill",
    color: "#8B5CF6",
    route: "/admin/manage-pnr",
    permission: "canManageBookings",
  },
  {
    id: "business",
    title: "الحسابات التجارية",
    subtitle: "إدارة حسابات الشركات",
    iconName: "building.fill",
    color: "#0EA5E9",
    route: "/admin/business-accounts",
    permission: "canManageBusinessAccounts",
  },
  {
    id: "reports",
    title: "التقارير المالية",
    subtitle: "عرض الإيرادات والعمولات",
    iconName: "chart.line.uptrend.xyaxis",
    color: "#EC4899",
    route: "/admin/financial-reports",
    permission: "canViewReports",
  },
  {
    id: "employees",
    title: "إدارة الموظفين",
    subtitle: "إضافة وتعديل حسابات الموظفين",
    iconName: "person.3.fill",
    color: "#6366F1",
    route: "/admin/employees",
    permission: "canManageEmployees",
  },
  {
    id: "notifications",
    title: "الإشعارات",
    subtitle: "سجل الإشعارات والتنبيهات",
    iconName: "bell.fill",
    color: "#EF4444",
    route: "/admin/notifications",
  },
];

export default function EmployeeDashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings } = useApp();
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const raw = await AsyncStorage.getItem(EMPLOYEE_SESSION_KEY);
      if (raw) {
        setSession(JSON.parse(raw));
      } else {
        router.replace("/employee-login" as any);
      }
    } catch {
      router.replace("/employee-login" as any);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSession();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "تسجيل الخروج",
      "هل تريد تسجيل الخروج من حسابك؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "خروج",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(EMPLOYEE_SESSION_KEY);
            router.replace("/employee-login" as any);
          },
        },
      ]
    );
  };

  if (!session) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>جارٍ التحميل...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const availableActions = ALL_ACTIONS.filter((action) => {
    if (!action.permission) return true;
    return session.permissions[action.permission];
  });

  // Stats
  const pendingBookings = bookings.filter((b) => b.status === "pending" && !b.paymentConfirmed).length;
  const confirmedToday = bookings.filter((b) => {
    const today = new Date().toISOString().split("T")[0];
    return b.date === today && b.status === "confirmed";
  }).length;
  const totalRevenue = bookings
    .filter((b) => b.paymentConfirmed)
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>مرحباً، {session.fullName}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <IconSymbol name={(ROLE_ICON_NAMES[session.role] || "person.fill") as any} size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.roleLabel}>{ROLE_LABELS[session.role] || session.role}</Text>
            {session.department ? (
              <Text style={styles.deptLabel}>• {session.department}</Text>
            ) : null}
          </View>
        </View>
        <Pressable
          style={styles.logoutBtn}
          onPress={handleLogout}
        >
          <IconSymbol name="door.left.hand.open" size={22} color="rgba(255,255,255,0.9)" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={{ backgroundColor: colors.background }}
      >
        {/* Quick Stats */}
        {(session.permissions.canManageBookings || session.permissions.canViewReports) && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B30" }]}>
              <Text style={[styles.statValue, { color: "#D97706" }]}>{pendingBookings}</Text>
              <Text style={[styles.statLabel, { color: "#92400E" }]}>في الانتظار</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#DCFCE7", borderColor: "#22C55E30" }]}>
              <Text style={[styles.statValue, { color: "#16A34A" }]}>{confirmedToday}</Text>
              <Text style={[styles.statLabel, { color: "#166534" }]}>مؤكدة اليوم</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#E0F2FE", borderColor: "#0EA5E930" }]}>
              <Text style={[styles.statValue, { color: "#0284C7" }]}>{formatMRU(totalRevenue)}</Text>
              <Text style={[styles.statLabel, { color: "#075985" }]}>الإيرادات</Text>
            </View>
          </View>
        )}

        {/* Actions Grid */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            الوظائف المتاحة
          </Text>
          <View style={styles.actionsGrid}>
            {availableActions.map((action) => (
              <Pressable
                key={action.id}
                style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIconBox, { backgroundColor: action.color + "15" }]}>
                  <IconSymbol name={action.iconName as any} size={28} color={action.color} />
                </View>
                <Text style={[styles.actionTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {action.title}
                </Text>
                <Text style={[styles.actionSubtitle, { color: colors.muted }]} numberOfLines={2}>
                  {action.subtitle}
                </Text>
                {action.id === "bookings" && pendingBookings > 0 && (
                  <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
                    <Text style={styles.badgeText}>{pendingBookings}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Session Info */}
        <View style={[styles.sessionInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sessionText, { color: colors.muted }]}>
            تسجيل الدخول: {new Date(session.loginAt).toLocaleString("ar-SA", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  deptLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  actionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    position: "relative",
  },
  actionIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  sessionInfo: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  sessionText: {
    fontSize: 12,
  },
});
