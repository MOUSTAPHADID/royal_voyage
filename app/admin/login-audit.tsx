import React, { useState, useCallback } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getLoginAuditLog,
  clearLoginAuditLog,
  type LoginAttempt,
} from "@/lib/admin-login-audit";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return new Date(iso).toLocaleDateString("ar");
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const methodLabels: Record<string, string> = {
  email: "بريد/كلمة مرور",
  biometric: "بصمة/وجه",
  "2fa": "تحقق ثنائي",
  direct: "دخول مباشر",
};

export default function LoginAuditScreen() {
  const router = useRouter();
  const colors = useColors();
  const [entries, setEntries] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const data = await getLoginAuditLog();
    setEntries(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleClear = () => {
    Alert.alert("مسح السجل", "هل أنت متأكد من مسح جميع سجلات الدخول؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "مسح",
        style: "destructive",
        onPress: async () => {
          await clearLoginAuditLog();
          setEntries([]);
        },
      },
    ]);
  };

  const successCount = entries.filter((e) => e.status === "success").length;
  const failedCount = entries.filter((e) => e.status === "failed").length;

  const renderItem = ({ item }: { item: LoginAttempt }) => {
    const isSuccess = item.status === "success";
    const statusColor = isSuccess ? "#22C55E" : "#EF4444";
    const statusIcon = isSuccess ? "✅" : "❌";
    const statusLabel = isSuccess ? "ناجح" : "فاشل";

    return (
      <View
        style={[
          s.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderLeftColor: statusColor,
            borderLeftWidth: 4,
          },
        ]}
      >
        <View style={s.cardHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 18 }}>{statusIcon}</Text>
            <View>
              <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
              <Text style={[s.methodText, { color: colors.muted }]}>
                {methodLabels[item.method] || item.method}
              </Text>
            </View>
          </View>
          <Text style={[s.timeText, { color: colors.muted }]}>{relativeTime(item.timestamp)}</Text>
        </View>

        <View style={[s.detailRow, { borderTopColor: colors.border }]}>
          <Text style={[s.detailLabel, { color: colors.muted }]}>التاريخ والوقت:</Text>
          <Text style={[s.detailValue, { color: colors.foreground }]}>{formatDateTime(item.timestamp)}</Text>
        </View>

        {item.email && (
          <View style={s.detailRowInline}>
            <Text style={[s.detailLabel, { color: colors.muted }]}>البريد:</Text>
            <Text style={[s.detailValue, { color: colors.foreground }]}>{item.email}</Text>
          </View>
        )}

        {item.detail && (
          <View style={s.detailRowInline}>
            <Text style={[s.detailLabel, { color: colors.muted }]}>التفاصيل:</Text>
            <Text style={[s.detailValue, { color: colors.foreground }]}>{item.detail}</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={s.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.primary }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={s.headerTitle}>سجل محاولات الدخول</Text>
        {entries.length > 0 ? (
          <Pressable onPress={handleClear}>
            <Text style={s.clearBtn}>مسح</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Stats */}
      <View style={[s.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={s.statItem}>
          <Text style={[s.statNum, { color: colors.foreground }]}>{entries.length}</Text>
          <Text style={[s.statLabel, { color: colors.muted }]}>إجمالي</Text>
        </View>
        <View style={[s.statDivider, { backgroundColor: colors.border }]} />
        <View style={s.statItem}>
          <Text style={[s.statNum, { color: "#22C55E" }]}>{successCount}</Text>
          <Text style={[s.statLabel, { color: colors.muted }]}>ناجح</Text>
        </View>
        <View style={[s.statDivider, { backgroundColor: colors.border }]} />
        <View style={s.statItem}>
          <Text style={[s.statNum, { color: "#EF4444" }]}>{failedCount}</Text>
          <Text style={[s.statLabel, { color: colors.muted }]}>فاشل</Text>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>لا توجد سجلات</Text>
            <Text style={[s.emptySubtitle, { color: colors.muted }]}>
              ستظهر هنا جميع محاولات الدخول للوحة الإدارة
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  clearBtn: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
  },
  statItem: { alignItems: "center", flex: 1 },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 12, fontWeight: "500", marginTop: 2 },
  statDivider: { width: 1, height: 30 },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusText: { fontSize: 15, fontWeight: "700" },
  methodText: { fontSize: 12, fontWeight: "500", marginTop: 1 },
  timeText: { fontSize: 11, fontWeight: "500" },
  detailRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  detailRowInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  detailLabel: { fontSize: 12, fontWeight: "600" },
  detailValue: { fontSize: 12, fontWeight: "500" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: "center" },
});
