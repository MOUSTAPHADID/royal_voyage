import React, { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAdmin } from "@/lib/admin-context";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";

// ─── Permissions per role ─────────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<string, { ar: string; fr: string }[]> = {
  manager: [
    { ar: "إدارة الموظفين (إضافة / تعديل / حذف)", fr: "Gérer les employés (ajout/modif./suppr.)" },
    { ar: "إدارة الشركاء والحسابات التجارية", fr: "Gérer les partenaires et comptes commerciaux" },
    { ar: "عرض وتأكيد جميع الحجوزات", fr: "Voir et confirmer toutes les réservations" },
    { ar: "إدارة أسعار الصرف والرسوم", fr: "Gérer les taux de change et les frais" },
    { ar: "الوصول إلى التقارير والإحصائيات", fr: "Accéder aux rapports et statistiques" },
    { ar: "إدارة الإعدادات العامة", fr: "Gérer les paramètres généraux" },
  ],
  accountant: [
    { ar: "عرض جميع الحجوزات", fr: "Voir toutes les réservations" },
    { ar: "تأكيد الدفعات وإصدار الفواتير", fr: "Confirmer les paiements et émettre des factures" },
    { ar: "الوصول إلى تقارير الأرباح", fr: "Accéder aux rapports de bénéfices" },
    { ar: "عرض بيانات الشركاء", fr: "Voir les données des partenaires" },
  ],
  booking_agent: [
    { ar: "البحث عن الرحلات والفنادق", fr: "Rechercher des vols et hôtels" },
    { ar: "إنشاء وتعديل الحجوزات", fr: "Créer et modifier des réservations" },
    { ar: "إدخال وتحديث رقم PNR", fr: "Saisir et mettre à jour le PNR" },
    { ar: "التواصل مع العملاء", fr: "Communiquer avec les clients" },
  ],
  support: [
    { ar: "عرض الحجوزات والاستفسارات", fr: "Voir les réservations et demandes" },
    { ar: "الرد على استفسارات العملاء", fr: "Répondre aux demandes des clients" },
    { ar: "تحديث حالة الطلبات", fr: "Mettre à jour le statut des commandes" },
  ],
};

const T = {
  ar: {
    title: "إدارة الموظفين",
    add: "إضافة موظف",
    noEmployees: "لا يوجد موظفون",
    noEmployeesHint: "اضغط + لإضافة موظف جديد",
    filterAll: "الكل",
    role: { manager: "مدير", accountant: "محاسب", booking_agent: "وكيل حجز", support: "دعم" } as Record<string, string>,
    active: "نشط",
    inactive: "غير نشط",
    delete: "حذف",
    confirmDelete: "هل تريد حذف هذا الموظف؟",
    yes: "نعم",
    no: "لا",
    permissions: "الصلاحيات",
    permissionsTitle: "صلاحيات الدور",
    close: "إغلاق",
    totalEmployees: "إجمالي الموظفين",
    activeCount: "نشطون",
  },
  fr: {
    title: "Gestion des employés",
    add: "Ajouter",
    noEmployees: "Aucun employé",
    noEmployeesHint: "Appuyez sur + pour ajouter",
    filterAll: "Tous",
    role: { manager: "Directeur", accountant: "Comptable", booking_agent: "Agent réservation", support: "Support" } as Record<string, string>,
    active: "Actif",
    inactive: "Inactif",
    delete: "Supprimer",
    confirmDelete: "Supprimer cet employé ?",
    yes: "Oui",
    no: "Non",
    permissions: "Permissions",
    permissionsTitle: "Permissions du rôle",
    close: "Fermer",
    totalEmployees: "Total employés",
    activeCount: "Actifs",
  },
};

const ROLE_COLORS: Record<string, string> = {
  manager: "#8B5CF6",
  accountant: "#3B82F6",
  booking_agent: "#22C55E",
  support: "#F59E0B",
};

type RoleFilter = "all" | "manager" | "accountant" | "booking_agent" | "support";

export default function EmployeesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language } = useAdmin();
  const t = T[language];
  const isRTL = language === "ar";

  const { data: employees, isLoading, refetch } = trpc.employees.list.useQuery();
  const deleteMutation = trpc.employees.delete.useMutation({ onSuccess: () => refetch() });

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [permissionsModal, setPermissionsModal] = useState<{ role: string; visible: boolean }>({ role: "", visible: false });

  const filtered = (employees ?? []).filter(e =>
    roleFilter === "all" || e.role === roleFilter
  );

  const activeCount = (employees ?? []).filter(e => e.status === "active").length;

  const handleDelete = (id: number, name: string) => {
    Alert.alert(t.confirmDelete, name, [
      { text: t.no, style: "cancel" },
      { text: t.yes, style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  const openPermissions = (role: string) => {
    setPermissionsModal({ role, visible: true });
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <Text style={styles.headerSub}>
            {employees?.length ?? 0} {t.totalEmployees} · {activeCount} {t.activeCount}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
          onPress={() => router.push("/admin/employee-form/new" as any)}
        >
          <IconSymbol name="plus.circle.fill" size={20} color="#fff" />
          <Text style={styles.addBtnText}>{t.add}</Text>
        </TouchableOpacity>
      </View>

      {/* Role Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {(["all", "manager", "accountant", "booking_agent", "support"] as RoleFilter[]).map(r => {
          const label = r === "all" ? t.filterAll : (t.role[r] ?? r);
          const color = r === "all" ? colors.primary : (ROLE_COLORS[r] ?? colors.primary);
          const isActive = roleFilter === r;
          const count = r === "all" ? (employees?.length ?? 0) : (employees ?? []).filter(e => e.role === r).length;
          return (
            <TouchableOpacity
              key={r}
              style={[
                styles.filterChip,
                {
                  borderColor: isActive ? color : colors.border,
                  backgroundColor: isActive ? color + "18" : colors.surface,
                },
              ]}
              onPress={() => setRoleFilter(r)}
            >
              {r !== "all" && <View style={[styles.filterDot, { backgroundColor: color }]} />}
              <Text style={[styles.filterChipText, { color: isActive ? color : colors.muted }]}>{label}</Text>
              <Text style={[styles.filterCount, { color: isActive ? color : colors.muted }]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : !filtered.length ? (
        <View style={styles.center}>
          <IconSymbol name="person.3.fill" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>{t.noEmployees}</Text>
          <Text style={[styles.emptyHint, { color: colors.muted }]}>{t.noEmployeesHint}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const roleColor = ROLE_COLORS[item.role] ?? colors.primary;
            return (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Top Row */}
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: roleColor + "20" }]}>
                    <Text style={[styles.avatarText, { color: roleColor }]}>
                      {item.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: colors.foreground }]}>{item.fullName}</Text>
                    <Text style={[styles.email, { color: colors.muted }]}>{item.email}</Text>
                    {item.phone ? (
                      <Text style={[styles.phone, { color: colors.muted }]}>{item.phone}</Text>
                    ) : null}
                  </View>
                  <View style={styles.actions}>
                    <View style={[styles.statusDot, { backgroundColor: item.status === "active" ? "#22C55E" : colors.muted }]} />
                    <TouchableOpacity onPress={() => router.push({ pathname: "/admin/employee-form/[id]" as any, params: { id: item.id } })}>
                      <IconSymbol name="pencil" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id, item.fullName)}>
                      <IconSymbol name="trash.fill" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bottom Row: Role Badge + Permissions Button */}
                <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
                  <View style={[styles.roleBadge, { backgroundColor: roleColor + "18" }]}>
                    <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
                    <Text style={[styles.roleText, { color: roleColor }]}>
                      {t.role[item.role] ?? item.role}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.permBtn, { borderColor: roleColor + "40" }]}
                    onPress={() => openPermissions(item.role)}
                  >
                    <IconSymbol name="lock.fill" size={12} color={roleColor} />
                    <Text style={[styles.permBtnText, { color: roleColor }]}>{t.permissions}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Permissions Modal */}
      <Modal
        visible={permissionsModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPermissionsModal(p => ({ ...p, visible: false }))}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: ROLE_COLORS[permissionsModal.role] ?? colors.primary }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{t.permissionsTitle}</Text>
              <Text style={styles.modalSubtitle}>
                {t.role[permissionsModal.role] ?? permissionsModal.role}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setPermissionsModal(p => ({ ...p, visible: false }))}>
              <IconSymbol name="xmark" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Permissions List */}
          <ScrollView contentContainerStyle={styles.permList}>
            {(ROLE_PERMISSIONS[permissionsModal.role] ?? []).map((perm, i) => (
              <View
                key={i}
                style={[styles.permItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.permCheck, { backgroundColor: (ROLE_COLORS[permissionsModal.role] ?? colors.primary) + "20" }]}>
                  <IconSymbol name="checkmark" size={14} color={ROLE_COLORS[permissionsModal.role] ?? colors.primary} />
                </View>
                <Text style={[styles.permText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
                  {language === "ar" ? perm.ar : perm.fr}
                </Text>
              </View>
            ))}

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: ROLE_COLORS[permissionsModal.role] ?? colors.primary }]}
              onPress={() => setPermissionsModal(p => ({ ...p, visible: false }))}
            >
              <Text style={styles.closeBtnText}>{t.close}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  filterScroll: { flexGrow: 0 },
  filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  filterChipText: { fontSize: 13, fontWeight: "600" },
  filterCount: { fontSize: 11, fontWeight: "700", marginLeft: 2 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  emptyText: { fontSize: 16, fontWeight: "600" },
  emptyHint: { fontSize: 13 },
  list: { padding: 12, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: "700" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: "700" },
  email: { fontSize: 12 },
  phone: { fontSize: 12 },
  actions: { alignItems: "center", gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleText: { fontSize: 12, fontWeight: "600" },
  permBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  permBtnText: { fontSize: 11, fontWeight: "600" },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 24, gap: 12 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  modalSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  permList: { padding: 16, gap: 10 },
  permItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  permCheck: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  permText: { flex: 1, fontSize: 14, lineHeight: 20 },
  closeBtn: { marginTop: 16, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  closeBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
