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
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { formatMRU } from "@/lib/currency";

type TabType = "requests" | "transactions";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "#F59E0B20", text: "#F59E0B", label: "قيد الانتظار" },
  approved: { bg: "#22C55E20", text: "#22C55E", label: "تمت الموافقة" },
  rejected: { bg: "#EF444420", text: "#EF4444", label: "مرفوض" },
};

const TX_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  top_up: { label: "شحن رصيد", color: "#22C55E", icon: "arrow.down.circle.fill" },
  booking_deduction: { label: "خصم حجز", color: "#EF4444", icon: "arrow.up.circle.fill" },
  refund: { label: "استرداد", color: "#0a7ea4", icon: "arrow.uturn.left.circle.fill" },
  adjustment: { label: "تعديل", color: "#F59E0B", icon: "pencil.circle.fill" },
};

export default function AccountBalanceScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ id: string; name: string }>();
  const accountId = parseInt(params.id || "0");
  const accountName = params.name || "الحساب التجاري";

  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const [refreshing, setRefreshing] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [requestNotes, setRequestNotes] = useState("");

  const accountQuery = trpc.businessAccounts.getById.useQuery({ id: accountId });
  const requestsQuery = trpc.topUp.listByAccount.useQuery({ businessAccountId: accountId });
  const transactionsQuery = trpc.balanceTransactions.list.useQuery({ businessAccountId: accountId });
  const createTopUpMut = trpc.topUp.create.useMutation();
  const approveMut = trpc.topUp.approve.useMutation();
  const rejectMut = trpc.topUp.reject.useMutation();

  const account = accountQuery.data as any;
  const requests = (requestsQuery.data || []) as any[];
  const transactions = (transactionsQuery.data || []) as any[];

  const currentBalance = parseFloat(account?.currentBalance || "0");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([accountQuery.refetch(), requestsQuery.refetch(), transactionsQuery.refetch()]);
    setRefreshing(false);
  }, []);

  const handleCreateTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      Alert.alert("خطأ", "يرجى إدخال مبلغ صحيح");
      return;
    }
    try {
      await createTopUpMut.mutateAsync({
        businessAccountId: accountId,
        amount: topUpAmount,
        paymentMethod: paymentMethod || undefined,
        paymentReference: paymentRef || undefined,
        requestNotes: requestNotes || undefined,
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowTopUpModal(false);
      setTopUpAmount("");
      setPaymentMethod("");
      setPaymentRef("");
      setRequestNotes("");
      requestsQuery.refetch();
    } catch (err: any) {
      Alert.alert("خطأ", err?.message || "فشل في إنشاء الطلب");
    }
  };

  const handleApprove = (requestId: number) => {
    Alert.alert("تأكيد الموافقة", "سيتم إضافة المبلغ لرصيد الحساب التجاري.", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "موافقة",
        onPress: async () => {
          try {
            await approveMut.mutateAsync({ id: requestId, processedBy: "Admin" });
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await Promise.all([accountQuery.refetch(), requestsQuery.refetch(), transactionsQuery.refetch()]);
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

  const pendingCount = requests.filter((r: any) => r.status === "pending").length;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[s.header, { backgroundColor: "#1B2B5E" }]}>
        <Pressable onPress={() => router.back()} style={{ width: 30 }}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={s.headerTitle}>{accountName}</Text>
          <Text style={{ color: "#C9A84C", fontSize: 12 }}>إدارة الرصيد</Text>
        </View>
        <Pressable
          onPress={() => setShowTopUpModal(true)}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <IconSymbol name="plus.circle.fill" size={26} color="#C9A84C" />
        </Pressable>
      </View>

      {/* Balance Card */}
      <View style={[s.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}>الرصيد الحالي</Text>
          <Text style={{ color: "#C9A84C", fontSize: 32, fontWeight: "800", marginTop: 4 }}>
            {formatMRU(currentBalance)}
          </Text>
        </View>
        {pendingCount > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#F59E0B" }} />
            <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "600" }}>{pendingCount} طلب شحن قيد الانتظار</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={[s.tabBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => setActiveTab("requests")} style={[s.tab, activeTab === "requests" && s.activeTab]}>
          <Text style={{ color: activeTab === "requests" ? "#C9A84C" : colors.muted, fontSize: 13, fontWeight: "600" }}>
            طلبات الشحن ({requests.length})
          </Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab("transactions")} style={[s.tab, activeTab === "transactions" && s.activeTab]}>
          <Text style={{ color: activeTab === "transactions" ? "#C9A84C" : colors.muted, fontSize: 13, fontWeight: "600" }}>
            سجل المعاملات ({transactions.length})
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {activeTab === "requests" ? (
        <FlatList
          data={requests}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />}
          ListEmptyComponent={
            <View style={[s.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="doc.text.fill" size={40} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 15, marginTop: 12, fontWeight: "600" }}>لا توجد طلبات شحن</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>اضغط + لإنشاء طلب شحن جديد</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
            const statusInfo = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
            return (
              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: "800" }}>
                    {formatMRU(parseFloat(item.amount))}
                  </Text>
                  <View style={[s.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={{ color: statusInfo.text, fontSize: 11, fontWeight: "600" }}>{statusInfo.label}</Text>
                  </View>
                </View>
                <View style={[s.detailsRow, { borderTopColor: colors.border }]}>
                  <Text style={{ color: colors.muted, fontSize: 11 }}>
                    {new Date(item.createdAt).toLocaleDateString("ar", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  {item.paymentMethod && <Text style={{ color: colors.muted, fontSize: 11 }}>• {item.paymentMethod}</Text>}
                </View>
                {item.paymentReference && (
                  <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>مرجع:</Text>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>{item.paymentReference}</Text>
                  </View>
                )}
                {item.requestNotes && (
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6, fontStyle: "italic" }}>{item.requestNotes}</Text>
                )}
                {item.adminNotes && (
                  <View style={{ marginTop: 8, padding: 8, backgroundColor: colors.border + "30", borderRadius: 8 }}>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>ملاحظة الإدارة: {item.adminNotes}</Text>
                  </View>
                )}
                {item.status === "pending" && (
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
                    <Pressable onPress={() => handleApprove(item.id)} style={({ pressed }) => [s.approveBtn, { opacity: pressed ? 0.8 : 1 }]}>
                      <IconSymbol name="checkmark.circle.fill" size={18} color="#FFFFFF" />
                      <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>موافقة</Text>
                    </Pressable>
                    <Pressable onPress={() => handleReject(item.id)} style={({ pressed }) => [s.rejectBtn, { opacity: pressed ? 0.8 : 1 }]}>
                      <IconSymbol name="xmark.circle.fill" size={18} color="#EF4444" />
                      <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 14 }}>رفض</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />}
          ListEmptyComponent={
            <View style={[s.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="doc.text.fill" size={40} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 15, marginTop: 12, fontWeight: "600" }}>لا توجد معاملات</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
            const txInfo = TX_TYPE_LABELS[item.type] || TX_TYPE_LABELS.adjustment;
            const amount = parseFloat(item.amount);
            const isPositive = amount >= 0;
            return (
              <View style={[s.txCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: txInfo.color + "20", alignItems: "center", justifyContent: "center" }}>
                    <IconSymbol name={txInfo.icon as any} size={20} color={txInfo.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "600" }}>{txInfo.label}</Text>
                    {item.description && <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{item.description}</Text>}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: isPositive ? "#22C55E" : "#EF4444", fontSize: 16, fontWeight: "700" }}>
                      {isPositive ? "+" : ""}{formatMRU(Math.abs(amount))}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 10, marginTop: 2 }}>
                      الرصيد: {formatMRU(parseFloat(item.balanceAfter))}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.muted, fontSize: 10, marginTop: 8, textAlign: "left" }}>
                  {new Date(item.createdAt).toLocaleDateString("ar", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* Create Top-Up Modal */}
      <Modal visible={showTopUpModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700" }}>طلب شحن رصيد</Text>
                <Pressable onPress={() => setShowTopUpModal(false)}>
                  <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
                </Pressable>
              </View>

              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8 }}>المبلغ (MRU) *</Text>
              <TextInput
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
              />

              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: 16 }}>طريقة الدفع</Text>
              <TextInput
                value={paymentMethod}
                onChangeText={setPaymentMethod}
                placeholder="تحويل بنكي، نقد، ..."
                placeholderTextColor={colors.muted}
                style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
              />

              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: 16 }}>مرجع الدفع</Text>
              <TextInput
                value={paymentRef}
                onChangeText={setPaymentRef}
                placeholder="رقم الإيصال أو التحويل"
                placeholderTextColor={colors.muted}
                style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
              />

              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600", marginBottom: 8, marginTop: 16 }}>ملاحظات</Text>
              <TextInput
                value={requestNotes}
                onChangeText={setRequestNotes}
                placeholder="ملاحظات إضافية..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                style={[s.input, s.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
              />

              <Pressable
                onPress={handleCreateTopUp}
                disabled={createTopUpMut.isPending}
                style={({ pressed }) => [s.submitBtn, { opacity: pressed || createTopUpMut.isPending ? 0.7 : 1 }]}
              >
                {createTopUpMut.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>إرسال طلب الشحن</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  balanceCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#C9A84C",
  },
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
  txCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#C9A84C",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 24,
  },
});
