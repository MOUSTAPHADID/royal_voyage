import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import {
  AdminNotification,
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAdminNotifications,
} from "@/lib/admin-notifications";

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings } = useApp();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    const data = await getAdminNotifications();
    setNotifications(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleNotificationPress = async (notification: AdminNotification) => {
    if (!notification.read) {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }
    // Navigate to booking detail if bookingId exists
    if (notification.bookingId) {
      const bookingExists = bookings.find((b) => b.id === notification.bookingId);
      if (bookingExists) {
        router.push({
          pathname: "/admin/booking-detail" as any,
          params: { id: notification.bookingId },
        });
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    Alert.alert(
      "مسح جميع الإشعارات",
      "هل أنت متأكد من مسح جميع الإشعارات؟ لا يمكن التراجع عن هذا الإجراء.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "مسح الكل",
          style: "destructive",
          onPress: async () => {
            await clearAdminNotifications();
            setNotifications([]);
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "new_booking":
        return { icon: "airplane" as const, color: "#0A7EA4", bg: "#E6F4FE" };
      case "booking_cancelled":
        return { icon: "xmark.circle.fill" as const, color: "#EF4444", bg: "#FEE2E2" };
      case "payment_confirmed":
        return { icon: "checkmark.seal.fill" as const, color: "#22C55E", bg: "#DCFCE7" };
      default:
        return { icon: "bell.fill" as const, color: "#F59E0B", bg: "#FEF3C7" };
    }
  };

  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "الآن";
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item }: { item: AdminNotification }) => {
    const { icon, color, bg } = getNotificationIcon(item.type);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.notifCard,
          {
            backgroundColor: item.read ? colors.background : colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.notifIcon, { backgroundColor: bg }]}>
          <IconSymbol name={icon} size={20} color={color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text
              style={[
                styles.notifTitle,
                { color: colors.foreground, fontWeight: item.read ? "500" : "700" },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.read && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
          <Text style={[styles.notifBody, { color: colors.muted }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[styles.notifTime, { color: colors.muted }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        {item.bookingId && (
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        )}
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>الإشعارات</Text>
        {unreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{unreadCount}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {notifications.length > 0 && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {unreadCount > 0 && (
              <Pressable
                style={({ pressed }) => [styles.headerAction, { opacity: pressed ? 0.7 : 1 }]}
                onPress={handleMarkAllRead}
              >
                <Text style={styles.headerActionText}>قراءة الكل</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.headerAction, { opacity: pressed ? 0.7 : 1 }]}
              onPress={handleClearAll}
            >
              <Text style={[styles.headerActionText, { color: "#FCA5A5" }]}>مسح</Text>
            </Pressable>
          </View>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol name="bell.fill" size={48} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            لا توجد إشعارات
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            ستظهر هنا إشعارات الحجوزات الجديدة والإلغاءات
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  headerAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 8,
    gap: 12,
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
    gap: 3,
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notifTitle: {
    fontSize: 14,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
