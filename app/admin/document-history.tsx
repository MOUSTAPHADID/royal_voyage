/**
 * Document History Screen
 * Displays all generated documents stored in the database
 * Allows viewing, status updates, and filtering by type
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type DocType = "all" | "employment_contract" | "invoice" | "partnership" | "ticket_invoice";
type DocStatus = "generated" | "sent" | "signed";

const DOC_TYPE_LABELS: Record<string, string> = {
  employment_contract: "عقد عمل",
  invoice: "فاتورة خدمة",
  partnership: "اتفاقية شراكة",
  ticket_invoice: "فاتورة تذاكر",
};

const DOC_TYPE_ICONS: Record<string, any> = {
  employment_contract: "doc.text.fill",
  invoice: "doc.text.fill",
  partnership: "doc.text.fill",
  ticket_invoice: "paperplane.fill",
};

const DOC_TYPE_COLORS: Record<string, string> = {
  employment_contract: "#3B82F6",
  invoice: "#10B981",
  partnership: "#8B5CF6",
  ticket_invoice: "#F59E0B",
};

const STATUS_LABELS: Record<DocStatus, string> = {
  generated: "مولّدة",
  sent: "مرسلة",
  signed: "موقّعة",
};

const STATUS_COLORS: Record<DocStatus, string> = {
  generated: "#6B7280",
  sent: "#10B981",
  signed: "#3B82F6",
};

export default function DocumentHistoryScreen() {
  const router = useRouter();
  const colors = useColors();
  const [filter, setFilter] = useState<DocType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data: docs, isLoading, refetch } = trpc.documents.getDocuments.useQuery(undefined, {
    refetchOnMount: true,
  });

  const updateStatusMut = trpc.documents.updateDocStatus.useMutation();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleUpdateStatus = (id: number, currentStatus: DocStatus) => {
    const nextOptions: DocStatus[] = ["generated", "sent", "signed"].filter(
      (s) => s !== currentStatus
    ) as DocStatus[];

    Alert.alert(
      "تحديث حالة الوثيقة",
      "اختر الحالة الجديدة:",
      [
        ...nextOptions.map((s) => ({
          text: STATUS_LABELS[s],
          onPress: async () => {
            try {
              await updateStatusMut.mutateAsync({ id, status: s });
              await refetch();
            } catch {
              Alert.alert("خطأ", "فشل تحديث الحالة");
            }
          },
        })),
        { text: "إلغاء", style: "cancel" },
      ]
    );
  };

  const filteredDocs = (docs || []).filter(
    (d) => filter === "all" || d.docType === filter
  );

  const formatDate = (dateStr: string | Date) => {
    try {
      return new Date(dateStr).toLocaleDateString("ar-MR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  const s = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
      backgroundColor: "#1B2B5E",
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", flex: 1, textAlign: "right" },
    filterRow: {
      flexDirection: "row",
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterBtnActive: { backgroundColor: "#1B2B5E", borderColor: "#1B2B5E" },
    filterText: { fontSize: 11, fontWeight: "600", color: colors.muted },
    filterTextActive: { color: "#FFFFFF" },
    card: {
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    typeIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    docTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground, textAlign: "right" },
    docSub: { fontSize: 12, color: colors.muted, textAlign: "right", marginTop: 2 },
    cardBottom: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingBottom: 12,
      paddingTop: 4,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusText: { fontSize: 11, fontWeight: "700" },
    dateText: { fontSize: 11, color: colors.muted },
    amountText: { fontSize: 12, fontWeight: "700", color: "#C9A84C", textAlign: "right" },
    emptyBox: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyText: { fontSize: 15, color: colors.muted, marginTop: 12, textAlign: "center" },
    countBadge: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    countText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  });

  const FILTERS: { key: DocType; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "employment_contract", label: "عقود عمل" },
    { key: "invoice", label: "فواتير" },
    { key: "partnership", label: "شراكات" },
    { key: "ticket_invoice", label: "تذاكر" },
  ];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={s.headerTitle}>سجل الوثائق</Text>
        <View style={s.countBadge}>
          <Text style={s.countText}>{filteredDocs.length}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={({ pressed }) => [
              s.filterBtn,
              filter === f.key && s.filterBtnActive,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={s.emptyBox}>
          <ActivityIndicator size="large" color="#1B2B5E" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1B2B5E" />
          }
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {filteredDocs.length === 0 ? (
            <View style={s.emptyBox}>
              <IconSymbol name="doc.text.fill" size={48} color={colors.border} />
              <Text style={s.emptyText}>لا توجد وثائق{filter !== "all" ? " من هذا النوع" : ""}</Text>
            </View>
          ) : (
            filteredDocs.map((doc) => {
              const typeColor = DOC_TYPE_COLORS[doc.docType] || "#6B7280";
              const statusColor = STATUS_COLORS[doc.status as DocStatus] || "#6B7280";
              return (
                <Pressable
                  key={doc.id}
                  style={({ pressed }) => [s.card, { opacity: pressed ? 0.85 : 1 }]}
                  onPress={() => handleUpdateStatus(doc.id, doc.status as DocStatus)}
                >
                  <View style={s.cardTop}>
                    <View style={[s.typeIcon, { backgroundColor: typeColor + "18" }]}>
                      <IconSymbol
                        name={DOC_TYPE_ICONS[doc.docType] || "doc.text.fill"}
                        size={22}
                        color={typeColor}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.docTitle}>{DOC_TYPE_LABELS[doc.docType] || doc.docType}</Text>
                      <Text style={s.docSub}>{doc.partyName}</Text>
                      {doc.refNumber ? (
                        <Text style={[s.docSub, { color: "#C9A84C", marginTop: 1 }]}>
                          #{doc.refNumber}
                        </Text>
                      ) : null}
                    </View>
                    {doc.amount && parseFloat(String(doc.amount)) > 0 ? (
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={s.amountText}>
                          {parseFloat(String(doc.amount)).toLocaleString("ar-MR")}
                        </Text>
                        <Text style={[s.docSub, { marginTop: 0 }]}>{doc.currency || "MRU"}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={s.cardBottom}>
                    <Text style={s.dateText}>{formatDate(doc.createdAt)}</Text>
                    <Pressable
                      style={({ pressed }) => [
                        s.statusBadge,
                        { backgroundColor: statusColor + "20", opacity: pressed ? 0.7 : 1 },
                      ]}
                      onPress={() => handleUpdateStatus(doc.id, doc.status as DocStatus)}
                    >
                      <Text style={[s.statusText, { color: statusColor }]}>
                        {STATUS_LABELS[doc.status as DocStatus] || doc.status}
                      </Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
