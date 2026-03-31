import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { formatMRU } from "@/lib/currency";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "#F59E0B20", text: "#F59E0B", label: "قيد الانتظار" },
  approved: { bg: "#22C55E20", text: "#22C55E", label: "تمت الموافقة" },
  rejected: { bg: "#EF444420", text: "#EF4444", label: "مرفوض" },
};

type FilterType = "all" | "pending" | "approved" | "rejected";

export default function TopUpRequestsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [filter, setFilter] = useState<FilterType>("pending");
  const [refreshing, setRefreshing] = useState(false);

  const statusParam = filter === "all" ? undefined : filter;
  const requestsQuery = trpc.topUp.list.useQuery(statusParam ? { status: statusParam } : undefined);
  const accountsQuery = trpc.businessAccounts.list.useQuery();
  const approveMut = trpc.topUp.approve.useMutation();
  const rejectMut = trpc.topUp.reject.useMutation();

  const requests = (requestsQuery.data || []) as any[];
  const accounts = (accountsQuery.data || []) as any[];

  const getAccountName = (accountId: number) => {
    const acc = accounts.find((a: any) => a.id === accountId);
    return acc?.companyName || `حساب #${accountId}`;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([requestsQuery.refetch(), accountsQuery.refetch()]);
    setRefreshing(false);
  }, []);

  const handleApprove = (requestId: number) => {
    Alert.alert("تأكيد الموافقة", "هل تريد الموافقة على طلب الشحن هذا؟ سيتم إضافة المبلغ لرصيد الحساب التجاري.", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "موافقة",
        onPress: async () => {
          try {
            await approveMut.mutateAsync({ id: requestId, processedBy: "Admin" });
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            requestsQuery.refetch();
          } catch (err: any) {
            Alert.alert("خطأ", err?.message || "فشل في الموافقة");
          }
        },
      },
    ]);
  };

  const handleReject = (requestId: number) => {
    Alert.alert("رفض الطلب", "هل تريد رفض هذا الطلب؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "رفض",
        style: "destructive",
        onPress: async () => {
          try {
            await rejectMut.mutateAsync({ id: requestId, processedBy: "Admin", adminNotes: "مرفوض من الإدارة" });
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            requestsQuery.refetch();
          } catch (err: any) {
            Alert.alert("خطأ", err?.message || "فشل في الرفض");
          }
        },
      },
    ]);
  };

  const pendingCount = filter === "all"
    ? requests.filter((r: any) => r.status === "pending").length
    : filter === "pending" ? requests.length : 0;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[s.header, { backgroundColor: "#1B2B5E" }]}>
        <Pressable onPress={() => router.back()} style={{ width: 30 }}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={s.headerTitle}>طلبات شحن الرصيد</Text>
          {pendingCount > 0 && (
            <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "600" }}>{pendingCount} طلب قيد الانتظار</Text>
          )}
        </View>
        <View style={{ width: 30 }} />
      </View>

      {/* Filter Tabs */}
      <View style={[s.filterBar, { borderBottomColor: colors.border }]}>
        {([
          { key: "pending" as FilterType, label: "قيد الانتظار" },
          { key: "approved" as FilterType, label: "مقبولة" },
          { key: "rejected" as FilterType, label: "مرفوضة" },
          { key: "all" as FilterType, label: "الكل" },
        ]).map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[s.filterTab, filter === tab.key && s.activeFilter]}
          >
            <Text style={[s.filterText, { color: filter === tab.key ? "#C9A84C" : colors.muted }]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {requestsQuery.isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#C9A84C" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />}
          ListEmptyComponent={
            <View style={[s.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="doc.text.fill" size={40} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 15, marginTop: 12, fontWeight: "600" }}>لا توجد طلبات</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                {filter === "pending" ? "لا توجد طلبات شحن قيد الانتظار" : "لا توجد طلبات في هذه الفئة"}
              </Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
            const statusInfo = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
            const accountName = getAccountName(item.businessAccountId);
            return (
              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Top Row: Account name + Status */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>{accountName}</Text>
                    <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: "800", marginTop: 4 }}>
                      {formatMRU(parseFloat(item.amount))}
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={{ color: statusInfo.text, fontSize: 11, fontWeight: "600" }}>{statusInfo.label}</Text>
                  </View>
                </View>

                {/* Details */}
                <View style={[s.detailsRow, { borderTopColor: colors.border }]}>
                  <Text style={{ color: colors.muted, fontSize: 11 }}>
                    {new Date(item.createdAt).toLocaleDateString("ar", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  {item.paymentMethod && (
                    <Text style={{ color: colors.muted, fontSize: 11 }}>• {item.paymentMethod}</Text>
                  )}
                </View>

                {item.paymentReference && (
                  <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>مرجع:</Text>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>{item.paymentReference}</Text>
                  </View>
                )}

                {item.requestNotes && (
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6, fontStyle: "italic" }}>
                    {item.requestNotes}
                  </Text>
                )}

                {item.adminNotes && (
                  <View style={{ marginTop: 8, padding: 8, backgroundColor: colors.border + "30", borderRadius: 8 }}>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>ملاحظة الإدارة: {item.adminNotes}</Text>
                  </View>
                )}

                {item.processedBy && item.processedAt && (
                  <Text style={{ color: colors.muted, fontSize: 10, marginTop: 6 }}>
                    تمت المعالجة بواسطة {item.processedBy} في {new Date(item.processedAt).toLocaleDateString("ar", { day: "numeric", month: "short" })}
                  </Text>
                )}

                {/* Action Buttons for pending requests */}
                {item.status === "pending" && (
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
                    <Pressable
                      onPress={() => handleApprove(item.id)}
                      style={({ pressed }) => [s.approveBtn, { opacity: pressed ? 0.8 : 1 }]}
                    >
                      <IconSymbol name="checkmark.circle.fill" size={18} color="#FFFFFF" />
                      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>موافقة</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleReject(item.id)}
                      style={({ pressed }) => [s.rejectBtn, { opacity: pressed ? 0.8 : 1 }]}
                    >
                      <IconSymbol name="xmark.circle.fill" size={18} color="#EF4444" />
                      <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 14 }}>رفض</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  filterBar: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeFilter: {
    borderBottomWidth: 2,
    borderBottomColor: "#C9A84C",
  },
  filterText: { fontSize: 12, fontWeight: "600" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#22C55E",
    paddingVertical: 12,
    borderRadius: 12,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EF444420",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EF444440",
  },
});
