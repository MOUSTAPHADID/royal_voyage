import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAdmin } from "@/lib/admin-context";

const LABELS = {
  ar: { dashboard: "الرئيسية", bookings: "الحجوزات", employees: "الموظفون", reports: "التقارير", settings: "الإعدادات", activityLog: "سجل النشاط" },
  fr: { dashboard: "Accueil", bookings: "Réservations", employees: "Employés", reports: "Rapports", settings: "Paramètres", activityLog: "Journal" },
};

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useAdmin();
  const labels = LABELS[language];
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: labels.dashboard, tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} /> }} />
      <Tabs.Screen name="bookings" options={{ title: labels.bookings, tabBarIcon: ({ color }) => <IconSymbol size={26} name="calendar.badge.checkmark" color={color} /> }} />
      <Tabs.Screen name="employees" options={{ title: labels.employees, tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.3.fill" color={color} /> }} />
      <Tabs.Screen name="reports" options={{ title: labels.reports, tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: labels.settings, tabBarIcon: ({ color }) => <IconSymbol size={26} name="gear" color={color} /> }} />
      <Tabs.Screen name="activity-log" options={{ title: labels.activityLog, tabBarIcon: ({ color }) => <IconSymbol size={26} name="list.bullet.clipboard" color={color} /> }} />
    </Tabs>
  );
}
