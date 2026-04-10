import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAdmin } from "@/lib/admin-context";

const LABELS = {
  ar: {
    title: "سجل النشاط",
    subtitle: "تتبع جميع عمليات الموظفين",
    all: "الكل",
    create: "إضافة",
    update: "تعديل",
    delete: "حذف",
    login: "دخول",
    other: "أخرى",
    employee: "موظف",
    partner: "شريك",
    booking: "حجز",
    pricing: "تسعير",
    pnr: "PNR",
    status: "حالة",
    payment: "دفع",
    noLogs: "لا توجد سجلات بعد",
    noLogsDesc: "ستظهر هنا جميع العمليات التي يقوم بها الموظفون",
    search: "بحث في السجلات...",
    admin: "المدير",
    filterByAction: "نوع العملية",
    filterByEntity: "نوع الكيان",
    loadMore: "تحميل المزيد",
    refresh: "تحديث",
  },
  fr: {
    title: "Journal d'activité",
    subtitle: "Suivre toutes les opérations des employés",
    all: "Tout",
    create: "Créer",
    update: "Modifier",
    delete: "Supprimer",
    login: "Connexion",
    other: "Autre",
    employee: "Employé",
    partner: "Partenaire",
    booking: "Réservation",
    pricing: "Tarification",
    pnr: "PNR",
    status: "Statut",
    payment: "Paiement",
    noLogs: "Aucun journal",
    noLogsDesc: "Toutes les opérations des employés apparaîtront ici",
    search: "Rechercher dans les journaux...",
    admin: "Administrateur",
    filterByAction: "Type d'action",
    filterByEntity: "Type d'entité",
    loadMore: "Charger plus",
    refresh: "Actualiser",
  },
};

const ACTION_COLORS: Record<string, string> = {
  create: "#22C55E",
  update: "#F59E0B",
  delete: "#EF4444",
  login: "#3B82F6",
  other: "#8B5CF6",
};

const ACTION_ICONS: Record<string, string> = {
  create: "+",
  update: "✎",
  delete: "✕",
  login: "→",
  other: "•",
};

const ENTITY_ICONS: Record<string, string> = {
  employee: "👤",
  partner: "🏢",
  booking: "✈️",
  pricing: "💰",
  pnr: "📋",
  status: "🔄",
  payment: "💳",
};

type ActivityLog = {
  id: number;
  employeeId: number | null;
  employeeName: string | null;
  employeeRole: string | null;
  action: string;
  entityType: string;
  entityId: number | null;
  description: string;
  metadata: string | null;
  createdAt: string | Date;
};

function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days < 7) return `منذ ${days} يوم`;
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
}

function LogCard({ log, labels }: { log: ActivityLog; labels: typeof LABELS.ar }) {
  const colors = useColors();
  const actionColor = ACTION_COLORS[log.action] ?? "#8B5CF6";
  const actionIcon = ACTION_ICONS[log.action] ?? "•";
  const entityIcon = ENTITY_ICONS[log.entityType] ?? "📄";
  const actionLabel = (labels as any)[log.action] ?? log.action;
  const entityLabel = (labels as any)[log.entityType] ?? log.entityType;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Action badge */}
      <View style={styles.cardLeft}>
        <View style={[styles.actionBadge, { backgroundColor: actionColor + "22", borderColor: actionColor + "44" }]}>
          <Text style={[styles.actionIcon, { color: actionColor }]}>{actionIcon}</Text>
        </View>
        <View style={[styles.timeline, { backgroundColor: colors.border }]} />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.entityIcon]}>{entityIcon}</Text>
          <View style={[styles.actionTag, { backgroundColor: actionColor + "22" }]}>
            <Text style={[styles.actionTagText, { color: actionColor }]}>{actionLabel}</Text>
          </View>
          <View style={[styles.entityTag, { backgroundColor: colors.border }]}>
            <Text style={[styles.entityTagText, { color: colors.muted }]}>{entityLabel}</Text>
          </View>
        </View>

        <Text style={[styles.description, { color: colors.foreground }]}>{log.description}</Text>

        <View style={styles.cardFooter}>
          <Text style={[styles.employeeName, { color: colors.primary }]}>
            {log.employeeName ?? labels.admin}
            {log.employeeRole ? ` · ${log.employeeRole}` : ""}
          </Text>
          <Text style={[styles.timestamp, { color: colors.muted }]}>
            {formatDate(log.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ActivityLogScreen() {
  const colors = useColors();
  const { language } = useAdmin();
  const labels = LABELS[language];

  const [searchText, setSearchText] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | undefined>(undefined);
  const [selectedEntity, setSelectedEntity] = useState<string | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50;

  const { data, isLoading, refetch, isFetching } = trpc.activityLog.list.useQuery(
    { limit: LIMIT, offset, entityType: selectedEntity, action: selectedAction }
  );

  useEffect(() => {
    if (!data) return;
    const newLogs = data as ActivityLog[];
    if (offset === 0) {
      setAllLogs(newLogs);
    } else {
      setAllLogs((prev) => [...prev, ...newLogs]);
    }
    setHasMore(newLogs.length === LIMIT);
  }, [data]);

  const handleRefresh = useCallback(() => {
    setOffset(0);
    setAllLogs([]);
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setOffset((prev) => prev + LIMIT);
    }
  }, [isFetching, hasMore]);

  const handleActionFilter = (action: string | undefined) => {
    setSelectedAction(action);
    setOffset(0);
    setAllLogs([]);
  };

  const handleEntityFilter = (entity: string | undefined) => {
    setSelectedEntity(entity);
    setOffset(0);
    setAllLogs([]);
  };

  const filteredLogs = searchText.trim()
    ? allLogs.filter((l) =>
        l.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (l.employeeName ?? "").toLowerCase().includes(searchText.toLowerCase())
      )
    : allLogs;

  const actionFilters = [
    { key: undefined, label: labels.all },
    { key: "create", label: labels.create },
    { key: "update", label: labels.update },
    { key: "delete", label: labels.delete },
    { key: "login", label: labels.login },
  ];

  const entityFilters = [
    { key: undefined, label: labels.all },
    { key: "employee", label: labels.employee },
    { key: "partner", label: labels.partner },
    { key: "booking", label: labels.booking },
  ];

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{labels.title}</Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{labels.subtitle}</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.searchIcon, { color: colors.muted }]}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder={labels.search}
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Text style={[styles.clearBtn, { color: colors.muted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Filters */}
      <View style={styles.filtersRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={actionFilters}
          keyExtractor={(item) => item.key ?? "all"}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => {
            const isActive = selectedAction === item.key;
            const color = item.key ? ACTION_COLORS[item.key] : colors.primary;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { borderColor: isActive ? color : colors.border, backgroundColor: isActive ? color + "22" : colors.surface },
                ]}
                onPress={() => handleActionFilter(item.key)}
              >
                <Text style={[styles.filterChipText, { color: isActive ? color : colors.muted }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Entity Filters */}
      <View style={styles.filtersRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={entityFilters}
          keyExtractor={(item) => item.key ?? "all-entity"}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => {
            const isActive = selectedEntity === item.key;
            return (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  { borderColor: isActive ? colors.primary : colors.border, backgroundColor: isActive ? colors.primary + "22" : colors.surface },
                ]}
                onPress={() => handleEntityFilter(item.key)}
              >
                <Text style={[styles.filterChipText, { color: isActive ? colors.primary : colors.muted }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Log List */}
      {isLoading && allLogs.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredLogs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{labels.noLogs}</Text>
          <Text style={[styles.emptyDesc, { color: colors.muted }]}>{labels.noLogsDesc}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isFetching && offset === 0} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => <LogCard log={item} labels={labels} />}
          ListFooterComponent={
            isFetching && offset > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "right",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    textAlign: "right",
  },
  searchContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
  },
  clearBtn: { fontSize: 14, paddingHorizontal: 4 },
  filtersRow: {
    marginTop: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  card: {
    flexDirection: "row-reverse",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardLeft: {
    width: 48,
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 0,
  },
  actionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 14,
    fontWeight: "700",
  },
  timeline: {
    flex: 1,
    width: 1.5,
    marginTop: 4,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
  },
  cardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  entityIcon: { fontSize: 14 },
  actionTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  actionTagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  entityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  entityTagText: {
    fontSize: 11,
    fontWeight: "500",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "right",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  employeeName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  timestamp: {
    fontSize: 11,
    textAlign: "left",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
