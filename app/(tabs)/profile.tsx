import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, logout, bookings } = useApp();
  const colorScheme = useColorScheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed").length;

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
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
      title: "Account",
      items: [
        { icon: "person.fill", label: "Edit Profile", value: "", onPress: () => {} },
        { icon: "creditcard.fill", label: "Payment Methods", value: "", onPress: () => {} },
        { icon: "shield.fill", label: "Security & Privacy", value: "", onPress: () => {} },
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: "globe", label: "Language", value: "English", onPress: () => {} },
        { icon: "tag.fill", label: "Currency", value: "USD", onPress: () => {} },
      ],
    },
    {
      title: "Support",
      items: [
        { icon: "info.circle.fill", label: "Help Center", value: "", onPress: () => {} },
        { icon: "envelope.fill", label: "Contact Us", value: "", onPress: () => {} },
        { icon: "star.fill", label: "Rate the App", value: "", onPress: () => {} },
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
          <Text style={styles.userName}>{user?.name ?? "Traveller"}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ""}</Text>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{bookings.length}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{confirmedBookings}</Text>
              <Text style={styles.statLabel}>Confirmed</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Gold</Text>
              <Text style={styles.statLabel}>Status</Text>
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
              <Text style={[styles.notifTitle, { color: colors.foreground }]}>Push Notifications</Text>
              <Text style={[styles.notifSub, { color: colors.muted }]}>Flight updates, deals & offers</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

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
                  <View style={[styles.menuIconBox, { backgroundColor: colors.primary + "12" }]}>
                    <IconSymbol name={item.icon as any} size={18} color={colors.primary} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <View style={styles.menuRight}>
                    {item.value && (
                      <Text style={[styles.menuValue, { color: colors.muted }]}>{item.value}</Text>
                    )}
                    <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* App Version */}
        <Text style={[styles.version, { color: colors.muted }]}>Royal Voyage v1.0.0</Text>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            { borderColor: colors.error, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handleLogout}
        >
          <IconSymbol name="arrow.left" size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: "center",
    gap: 8,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 4,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  userEmail: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    width: "100%",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: 16,
    marginBottom: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  notifLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  notifSub: {
    fontSize: 12,
  },
  menuSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  menuValue: {
    fontSize: 14,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
