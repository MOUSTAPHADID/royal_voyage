import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTranslation } from "@/lib/i18n";
import { useRouter, usePathname } from "expo-router";

const BREAKPOINT = 768;

function SidebarNav() {
  const colors = useColors();
  const { isRTL } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: "/(tabs)/", label: isRTL ? "الرئيسية" : "Accueil", icon: "house.fill" as const },
    { name: "/(tabs)/explore", label: isRTL ? "استكشف" : "Explorer", icon: "map.fill" as const },
    { name: "/(tabs)/esim", label: isRTL ? "eSIM" : "eSIM", icon: "globe" as const },
    { name: "/(tabs)/bookings", label: isRTL ? "حجوزاتي" : "Réservations", icon: "calendar.badge.checkmark" as const },
    { name: "/(tabs)/profile", label: isRTL ? "ملفي" : "Profil", icon: "person.fill" as const },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.surface, borderRightColor: colors.border, borderRightWidth: isRTL ? 0 : 0.5, borderLeftColor: colors.border, borderLeftWidth: isRTL ? 0.5 : 0 }]}>
      <View style={styles.sidebarLogo}>
        <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
          <IconSymbol name="airplane" size={20} color="#fff" />
        </View>
        <Text style={[styles.logoText, { color: colors.foreground }]}>Royal Voyage</Text>
      </View>
      <View style={styles.sidebarNav}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.name || (tab.name === "/(tabs)/" && (pathname === "/" || pathname === ""));
          return (
            <Pressable
              key={tab.name}
              style={({ pressed }) => [
                styles.sidebarItem,
                isActive && { backgroundColor: colors.primary + "18" },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => router.push(tab.name as any)}
            >
              <IconSymbol name={tab.icon} size={22} color={isActive ? colors.primary : colors.muted} />
              <Text style={[styles.sidebarLabel, { color: isActive ? colors.primary : colors.muted, fontWeight: isActive ? "700" : "500" }]}>
                {tab.label}
              </Text>
              {isActive && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.sidebarFooter}>
        <Text style={[styles.sidebarFooterText, { color: colors.muted }]}>© 2026 Royal Voyage</Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isRTL } = useTranslation();
  const { width } = useWindowDimensions();
  const isLargeScreen = Platform.OS === "web" && width >= BREAKPOINT;

  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 6);
  const tabBarHeight = 56 + bottomPadding;

  if (isLargeScreen) {
    return (
      <View style={[styles.desktopContainer, { backgroundColor: colors.background }]}>
        {!isRTL && <SidebarNav />}
        <View style={styles.desktopContent}>
          <Tabs
            screenOptions={{
              tabBarStyle: { display: "none" },
              headerShown: false,
            }}
          >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="explore" />
            <Tabs.Screen name="esim" />
            <Tabs.Screen name="bookings" />
            <Tabs.Screen name="profile" />
          </Tabs>
        </View>
        {isRTL && <SidebarNav />}
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isRTL ? "الرئيسية" : "Home",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: isRTL ? "استكشف" : "Explore",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="map.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="esim"
        options={{
          title: "eSIM",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="globe" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: isRTL ? "حجوزاتي" : "Bookings",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="calendar.badge.checkmark" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isRTL ? "ملفي" : "Profile",
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 220,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  sidebarLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 16,
    fontWeight: "700",
  },
  sidebarNav: {
    flex: 1,
    gap: 4,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    position: "relative",
  },
  sidebarLabel: {
    fontSize: 14,
    flex: 1,
  },
  activeIndicator: {
    position: "absolute",
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sidebarFooter: {
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  sidebarFooterText: {
    fontSize: 11,
  },
  desktopContent: {
    flex: 1,
  },
});
