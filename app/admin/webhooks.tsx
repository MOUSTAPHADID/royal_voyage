import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type TabType = "events" | "webhooks" | "notifications";

const EVENT_TYPE_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  "order.created": { icon: "✅", color: "#22C55E", bg: "#DCFCE7" },
  "order.creation_failed": { icon: "⚠️", color: "#EF4444", bg: "#FEE2E2" },
  "order.airline_initiated_change_detected": { icon: "✈️", color: "#F59E0B", bg: "#FEF3C7" },
  "air.order.changed": { icon: "🔄", color: "#3B82F6", bg: "#DBEAFE" },
  "order_cancellation.created": { icon: "🔄", color: "#F97316", bg: "#FED7AA" },
  "order_cancellation.confirmed": { icon: "❌", color: "#EF4444", bg: "#FEE2E2" },
  "air.payment.succeeded": { icon: "💳", color: "#22C55E", bg: "#DCFCE7" },
  "air.payment.failed": { icon: "💳", color: "#EF4444", bg: "#FEE2E2" },
  "air.payment.cancelled": { icon: "🚫", color: "#6B7280", bg: "#F3F4F6" },
  "air.payment.pending": { icon: "⏳", color: "#F59E0B", bg: "#FEF3C7" },
  "ping.triggered": { icon: "🏓", color: "#8B5CF6", bg: "#EDE9FE" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  "order.created": "حجز جديد",
  "order.creation_failed": "فشل إنشاء حجز",
  "order.airline_initiated_change_detected": "تغيير من شركة الطيران",
  "air.order.changed": "تحديث حجز",
  "order_cancellation.created": "طلب إلغاء",
  "order_cancellation.confirmed": "تأكيد إلغاء",
  "air.payment.succeeded": "نجاح الدفع",
  "air.payment.failed": "فشل الدفع",
  "air.payment.cancelled": "إلغاء الدفع",
  "air.payment.pending": "دفع قيد المعالجة",
  "ping.triggered": "اختبار Ping",
};

export default function WebhooksScreen() {
  const router = useRouter();
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>("events");
  const [refreshing, setRefreshing] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  // tRPC queries
  const eventLogQuery = trpc.webhooks.getLog.useQuery(undefined, {
    refetchInterval: 15000,
  });
  const notificationsQuery = trpc.webhooks.getNotifications.useQuery(undefined, {
    refetchInterval: 15000,
  });
  const webhooksListQuery = trpc.webhooks.list.useQuery();

  // tRPC mutations
  const registerWebhookMut = trpc.webhooks.register.useMutation();
  const deleteWebhookMut = trpc.webhooks.delete.useMutation();
  const pingWebhookMut = trpc.webhooks.ping.useMutation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      eventLogQuery.refetch(),
      notificationsQuery.refetch(),
      webhooksListQuery.refetch(),
    ]);
    setRefreshing(false);
  }, []);

  const handleRegisterWebhook = async () => {
    if (!webhookUrl.trim()) {
      Alert.alert("خطأ", "يرجى إدخال عنوان URL صالح");
      return;
    }
    setRegisterLoading(true);
    try {
      await registerWebhookMut.mutateAsync({
        url: webhookUrl.trim(),
        events: [
          "order.created",
          "order.creation_failed",
          "order.airline_initiated_change_detected",
          "air.order.changed",
          "order_cancellation.created",
          "order_cancellation.confirmed",
          "air.payment.failed",
          "air.payment.succeeded",
          "air.payment.cancelled",
          "air.payment.pending",
        ],
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("تم", "تم تسجيل Webhook بنجاح");
      setShowRegisterModal(false);
      setWebhookUrl("");
      webhooksListQuery.refetch();
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "فشل تسجيل Webhook");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleDeleteWebhook = (id: string) => {
    Alert.alert("حذف Webhook", "هل أنت متأكد من حذف هذا الـ Webhook؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteWebhookMut.mutateAsync({ webhookId: id });
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            webhooksListQuery.refetch();
          } catch (err: any) {
            Alert.alert("خطأ", err.message || "فشل الحذف");
          }
        },
      },
    ]);
  };

  const handlePingWebhook = async (id: string) => {
    try {
      await pingWebhookMut.mutateAsync({ webhookId: id });
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert("تم", "تم إرسال Ping بنجاح");
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "فشل إرسال Ping");
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
    return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // ─── Tab: Events Log ──────────────────────────────────────────────────────
  const renderEventItem = ({ item }: { item: any }) => {
    const meta = EVENT_TYPE_ICONS[item.type] || { icon: "📋", color: "#6B7280", bg: "#F3F4F6" };
    const label = EVENT_TYPE_LABELS[item.type] || item.type;

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardRow}>
          <View style={[styles.eventIcon, { backgroundColor: meta.bg }]}>
            <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{label}</Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }]} numberOfLines={1}>
              {item.action_taken}
            </Text>
            <View style={styles.cardMeta}>
              <Text style={[styles.cardTime, { color: colors.muted }]}>
                {formatTime(item.received_at)}
              </Text>
              <View style={[styles.badge, { backgroundColor: item.live_mode ? "#DCFCE7" : "#FEF3C7" }]}>
                <Text style={{ fontSize: 10, color: item.live_mode ? "#166534" : "#92400E", fontWeight: "600" }}>
                  {item.live_mode ? "LIVE" : "TEST"}
                </Text>
              </View>
              {item.processed && (
                <View style={[styles.badge, { backgroundColor: "#DBEAFE" }]}>
                  <Text style={{ fontSize: 10, color: "#1E40AF", fontWeight: "600" }}>معالج</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {item.data_summary && item.data_summary !== "No data" && (
          <View style={[styles.dataSummary, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.dataSummaryText, { color: colors.muted }]} numberOfLines={2}>
              {item.data_summary}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ─── Tab: Notifications ───────────────────────────────────────────────────
  const renderNotifItem = ({ item }: { item: any }) => {
    const isUrgent = item.urgent;
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isUrgent ? "#FEF2F2" : colors.surface,
            borderColor: isUrgent ? "#FECACA" : colors.border,
            borderWidth: isUrgent ? 1.5 : 0.5,
          },
        ]}
      >
        <View style={styles.cardRow}>
          <View style={[styles.eventIcon, { backgroundColor: isUrgent ? "#FEE2E2" : "#DBEAFE" }]}>
            <Text style={{ fontSize: 18 }}>{isUrgent ? "🚨" : "🔔"}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: isUrgent ? "#DC2626" : colors.foreground }]}>
              {item.title}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }]} numberOfLines={2}>
              {item.message}
            </Text>
            <View style={styles.cardMeta}>
              <Text style={[styles.cardTime, { color: colors.muted }]}>
                {formatTime(item.timestamp)}
              </Text>
              {item.orderId && (
                <View style={[styles.badge, { backgroundColor: "#E0E7FF" }]}>
                  <Text style={{ fontSize: 10, color: "#3730A3", fontWeight: "600" }}>
                    {item.orderId.substring(0, 12)}...
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ─── Tab: Webhooks List ───────────────────────────────────────────────────
  const renderWebhookItem = ({ item }: { item: any }) => {
    const wh = item;
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardRow}>
          <View style={[styles.eventIcon, { backgroundColor: "#EDE9FE" }]}>
            <Text style={{ fontSize: 18 }}>🔗</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
              {wh.url || wh.id}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }]} numberOfLines={1}>
              ID: {wh.id}
            </Text>
            {wh.events && (
              <Text style={[styles.cardTime, { color: colors.muted }]}>
                {wh.events.length} أحداث مسجلة
              </Text>
            )}
          </View>
        </View>
        <View style={styles.webhookActions}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: "#DBEAFE", opacity: pressed ? 0.7 : 1 }]}
            onPress={() => handlePingWebhook(wh.id)}
          >
            <Text style={{ fontSize: 12, color: "#1E40AF", fontWeight: "600" }}>🏓 Ping</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: "#FEE2E2", opacity: pressed ? 0.7 : 1 }]}
            onPress={() => handleDeleteWebhook(wh.id)}
          >
            <Text style={{ fontSize: 12, color: "#DC2626", fontWeight: "600" }}>🗑 حذف</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const eventLog = (eventLogQuery.data as any)?.log ?? [];
  const notifications = (notificationsQuery.data as any)?.notifications ?? [];
  const webhooksList = (webhooksListQuery.data as any)?.webhooks ?? [];

  const isLoading = eventLogQuery.isLoading || notificationsQuery.isLoading;

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "events", label: "سجل الأحداث", count: eventLog.length },
    { key: "notifications", label: "الإشعارات", count: notifications.filter((n: any) => n.urgent).length },
    { key: "webhooks", label: "Webhooks", count: webhooksList.length },
  ];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B2B5E" }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Duffel Webhooks</Text>
          <Text style={styles.headerSubtitle}>إشعارات تلقائية من شركات الطيران</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => setShowRegisterModal(true)}
        >
          <IconSymbol name="plus.circle.fill" size={28} color="#C9A84C" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: "#C9A84C", borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? "#1B2B5E" : colors.muted },
              ]}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  {
                    backgroundColor:
                      tab.key === "notifications" && tab.count > 0 ? "#EF4444" : "#E5E7EB",
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: tab.key === "notifications" && tab.count > 0 ? "#FFF" : "#374151",
                  }}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#C9A84C" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>جاري التحميل...</Text>
        </View>
      ) : (
        <>
          {activeTab === "events" && (
            eventLog.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 48 }}>📡</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد أحداث بعد</Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                  ستظهر هنا جميع الأحداث المستلمة من Duffel عند حدوث تغييرات على الحجوزات
                </Text>
              </View>
            ) : (
              <FlatList
                data={eventLog}
                keyExtractor={(item: any, index) => `${item.id}-${index}`}
                renderItem={renderEventItem}
                contentContainerStyle={styles.list}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />
                }
              />
            )
          )}

          {activeTab === "notifications" && (
            notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 48 }}>🔔</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد إشعارات</Text>
                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                  ستظهر هنا إشعارات Duffel عند إنشاء حجوزات أو إلغائها أو تغييرها
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item: any, index) => `notif-${index}`}
                renderItem={renderNotifItem}
                contentContainerStyle={styles.list}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />
                }
              />
            )
          )}

          {activeTab === "webhooks" && (
            <ScrollView
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />
              }
            >
              {/* Info Card */}
              <View style={[styles.infoCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
                <Text style={{ fontSize: 14, color: "#1E40AF", fontWeight: "600", marginBottom: 6 }}>
                  كيفية تفعيل Webhooks
                </Text>
                <Text style={{ fontSize: 12, color: "#1E40AF", lineHeight: 20 }}>
                  1. اضغط على + لتسجيل Webhook جديد{"\n"}
                  2. أدخل عنوان URL الخادم المنشور:{"\n"}
                  {"   "}https://royalvoyage-dcsedylm.manus.space/api/webhooks/duffel{"\n"}
                  3. أو سجّل مباشرة من لوحة تحكم Duffel{"\n"}
                  4. احفظ الـ Secret في متغير البيئة DUFFEL_WEBHOOK_SECRET
                </Text>
              </View>

              {webhooksListQuery.isLoading ? (
                <ActivityIndicator size="small" color="#C9A84C" style={{ marginTop: 20 }} />
              ) : webhooksList.length === 0 ? (
                <View style={[styles.emptyState, { paddingTop: 40 }]}>
                  <Text style={{ fontSize: 48 }}>🔗</Text>
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد Webhooks مسجلة</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                    سجّل Webhook لاستقبال إشعارات تلقائية من Duffel
                  </Text>
                  <Pressable
                    style={({ pressed }) => [styles.registerBtn, { opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => setShowRegisterModal(true)}
                  >
                    <Text style={styles.registerBtnText}>+ تسجيل Webhook جديد</Text>
                  </Pressable>
                </View>
              ) : (
                webhooksList.map((wh: any, index: number) => (
                  <View key={wh.id || index}>
                    {renderWebhookItem({ item: wh })}
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </>
      )}

      {/* Register Modal */}
      <Modal visible={showRegisterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>تسجيل Webhook جديد</Text>
            <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
              أدخل عنوان URL لاستقبال إشعارات Duffel
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder="https://your-server.com/api/webhooks/duffel"
              placeholderTextColor={colors.muted}
              value={webhookUrl}
              onChangeText={setWebhookUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, styles.cancelBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  setShowRegisterModal(false);
                  setWebhookUrl("");
                }}
              >
                <Text style={[styles.modalBtnText, { color: colors.muted }]}>إلغاء</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.confirmBtn,
                  { opacity: pressed ? 0.8 : 1, backgroundColor: registerLoading ? "#9CA3AF" : "#1B2B5E" },
                ]}
                onPress={handleRegisterWebhook}
                disabled={registerLoading}
              >
                {registerLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: "#FFFFFF" }]}>تسجيل</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },
  tabBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  cardTime: {
    fontSize: 11,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dataSummary: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  dataSummaryText: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  webhookActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 40,
    paddingTop: 60,
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
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  registerBtn: {
    backgroundColor: "#1B2B5E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  registerBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "transparent",
  },
  confirmBtn: {},
  modalBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
