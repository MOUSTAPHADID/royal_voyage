import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAdmin } from "@/lib/admin-context";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";

const T = {
  ar: { title: "إدارة الموظفين", add: "إضافة موظف", noEmployees: "لا يوجد موظفون", role: { manager: "مدير", accountant: "محاسب", booking_agent: "وكيل حجز", support: "دعم" } as Record<string,string>, active: "نشط", inactive: "غير نشط", delete: "حذف", confirmDelete: "هل تريد حذف هذا الموظف؟", yes: "نعم", no: "لا" },
  fr: { title: "Gestion des employés", add: "Ajouter", noEmployees: "Aucun employé", role: { manager: "Directeur", accountant: "Comptable", booking_agent: "Agent réservation", support: "Support" } as Record<string,string>, active: "Actif", inactive: "Inactif", delete: "Supprimer", confirmDelete: "Supprimer cet employé ?", yes: "Oui", no: "Non" },
};

export default function EmployeesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language } = useAdmin();
  const t = T[language];

  const { data: employees, isLoading, refetch } = trpc.employees.list.useQuery();
  const deleteMutation = trpc.employees.delete.useMutation({ onSuccess: () => refetch() });

  const handleDelete = (id: number, name: string) => {
    Alert.alert(t.confirmDelete, name, [
      { text: t.no, style: "cancel" },
      { text: t.yes, style: "destructive", onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  const roleColors: Record<string, string> = { manager: "#8B5CF6", accountant: "#3B82F6", booking_agent: "#22C55E", support: "#F59E0B" };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]} onPress={() => router.push("/admin/employee-form/new" as any)}>
          <IconSymbol name="plus.circle.fill" size={20} color="#fff" />
          <Text style={styles.addBtnText}>{t.add}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : !employees?.length ? (
        <View style={styles.center}>
          <IconSymbol name="person.3.fill" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>{t.noEmployees}</Text>
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: (roleColors[item.role] ?? colors.primary) + "20" }]}>
                <Text style={[styles.avatarText, { color: roleColors[item.role] ?? colors.primary }]}>
                  {item.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.foreground }]}>{item.fullName}</Text>
                <Text style={[styles.email, { color: colors.muted }]}>{item.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: (roleColors[item.role] ?? colors.primary) + "18" }]}>
                  <Text style={[styles.roleText, { color: roleColors[item.role] ?? colors.primary }]}>
                    {t.role[item.role] ?? item.role}
                  </Text>
                </View>
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
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyText: { fontSize: 15 },
  list: { padding: 12, gap: 10 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "700" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontWeight: "700" },
  email: { fontSize: 12 },
  roleBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 2 },
  roleText: { fontSize: 11, fontWeight: "600" },
  actions: { alignItems: "center", gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});
