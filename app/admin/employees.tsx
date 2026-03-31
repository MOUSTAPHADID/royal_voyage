import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Switch,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type EmployeeRole = "manager" | "accountant" | "booking_agent" | "support";

type Employee = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: EmployeeRole;
  permissions: string | null;
  status: "active" | "inactive";
  department: string | null;
  hireDate: string | null;
  lastLogin: string | null;
  notes: string | null;
  createdAt: string;
};

const ROLE_INFO: Record<EmployeeRole, { label: string; color: string; icon: string }> = {
  manager: { label: "مدير", color: "#C9A84C", icon: "crown.fill" },
  accountant: { label: "محاسب", color: "#0EA5E9", icon: "banknote.fill" },
  booking_agent: { label: "وكيل حجز", color: "#8B5CF6", icon: "airplane" },
  support: { label: "دعم فني", color: "#22C55E", icon: "person.fill" },
};

// Available permissions per role
const ALL_PERMISSIONS = [
  { key: "view_bookings", label: "عرض الحجوزات", description: "مشاهدة جميع الحجوزات" },
  { key: "manage_bookings", label: "إدارة الحجوزات", description: "إنشاء وتعديل وإلغاء الحجوزات" },
  { key: "confirm_payments", label: "تأكيد المدفوعات", description: "تأكيد أو رفض المدفوعات" },
  { key: "issue_tickets", label: "إصدار التذاكر", description: "إدخال أرقام التذاكر وإرسالها" },
  { key: "view_reports", label: "عرض التقارير", description: "مشاهدة تقارير المبيعات" },
  { key: "manage_business_accounts", label: "إدارة الحسابات التجارية", description: "إنشاء وتعديل الحسابات التجارية" },
  { key: "manage_employees", label: "إدارة الموظفين", description: "إنشاء وتعديل حسابات الموظفين" },
  { key: "manage_consolidator", label: "إدارة Consolidator", description: "تعديل إعدادات الموحد" },
  { key: "send_notifications", label: "إرسال الإشعارات", description: "إرسال إشعارات للعملاء" },
  { key: "update_pnr", label: "تحديث PNR", description: "تحديث رقم PNR الحقيقي" },
];

// Default permissions per role
const DEFAULT_PERMISSIONS: Record<EmployeeRole, string[]> = {
  manager: ALL_PERMISSIONS.map((p) => p.key),
  accountant: ["view_bookings", "confirm_payments", "view_reports"],
  booking_agent: ["view_bookings", "manage_bookings", "issue_tickets", "update_pnr", "send_notifications"],
  support: ["view_bookings", "send_notifications"],
};

export default function EmployeesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<EmployeeRole>("booking_agent");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [department, setDepartment] = useState("");
  const [notes, setNotes] = useState("");

  const employeesQuery = trpc.employees.list.useQuery();
  const createMut = trpc.employees.create.useMutation();
  const updateMut = trpc.employees.update.useMutation();
  const deleteMut = trpc.employees.delete.useMutation();

  const employeesList = (employeesQuery.data || []) as unknown as Employee[];

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRole("booking_agent");
    setSelectedPermissions(DEFAULT_PERMISSIONS.booking_agent);
    setDepartment("");
    setNotes("");
  };

  const handleRoleChange = (newRole: EmployeeRole) => {
    setRole(newRole);
    setSelectedPermissions(DEFAULT_PERMISSIONS[newRole]);
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleCreate = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert("خطأ", "يرجى ملء الاسم والبريد الإلكتروني وكلمة المرور");
      return;
    }
    if (password.length < 4) {
      Alert.alert("خطأ", "كلمة المرور يجب أن تكون 4 أحرف على الأقل");
      return;
    }
    try {
      await createMut.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        role,
        permissions: JSON.stringify(selectedPermissions),
        department: department.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreateModal(false);
      resetForm();
      employeesQuery.refetch();
    } catch (err: any) {
      Alert.alert("خطأ", err?.message || "فشل في إنشاء الموظف");
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFullName(emp.fullName);
    setEmail(emp.email);
    setPhone(emp.phone || "");
    setPassword("");
    setRole(emp.role);
    try {
      setSelectedPermissions(emp.permissions ? JSON.parse(emp.permissions) : DEFAULT_PERMISSIONS[emp.role]);
    } catch {
      setSelectedPermissions(DEFAULT_PERMISSIONS[emp.role]);
    }
    setDepartment(emp.department || "");
    setNotes(emp.notes || "");
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingEmployee) return;
    try {
      await updateMut.mutateAsync({
        id: editingEmployee.id,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password: password.trim() || undefined,
        role,
        permissions: JSON.stringify(selectedPermissions),
        department: department.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEditModal(false);
      setEditingEmployee(null);
      resetForm();
      employeesQuery.refetch();
    } catch (err: any) {
      Alert.alert("خطأ", err?.message || "فشل في تحديث الموظف");
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const newStatus = emp.status === "active" ? "inactive" : "active";
    const msg = newStatus === "inactive" ? `هل تريد تعطيل حساب "${emp.fullName}"؟` : `هل تريد تفعيل حساب "${emp.fullName}"؟`;
    Alert.alert("تأكيد", msg, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "نعم",
        onPress: async () => {
          try {
            await updateMut.mutateAsync({ id: emp.id, status: newStatus });
            employeesQuery.refetch();
          } catch {}
        },
      },
    ]);
  };

  const handleDelete = (emp: Employee) => {
    Alert.alert("حذف الموظف", `هل أنت متأكد من حذف "${emp.fullName}"؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMut.mutateAsync({ id: emp.id });
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            employeesQuery.refetch();
          } catch {}
        },
      },
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await employeesQuery.refetch();
    setRefreshing(false);
  }, []);

  const activeCount = employeesList.filter((e) => e.status === "active").length;

  const renderFormModal = (isEdit: boolean) => (
    <Modal visible={isEdit ? showEditModal : showCreateModal} animationType="slide" presentationStyle="pageSheet">
      <View style={[s.modalContainer, { backgroundColor: colors.background }]}>
        <View style={s.modalHeader}>
          <Pressable onPress={() => { isEdit ? setShowEditModal(false) : setShowCreateModal(false); resetForm(); }}>
            <Text style={{ color: "#C9A84C", fontSize: 16 }}>إلغاء</Text>
          </Pressable>
          <Text style={[s.modalTitle, { color: colors.foreground }]}>
            {isEdit ? "تعديل الموظف" : "موظف جديد"}
          </Text>
          <Pressable
            onPress={isEdit ? handleUpdate : handleCreate}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={{ color: "#C9A84C", fontSize: 16, fontWeight: "700" }}>
              {(isEdit ? updateMut : createMut).isPending ? "..." : "حفظ"}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
          {/* Basic Info */}
          <Text style={[s.sectionLabel, { color: colors.muted }]}>المعلومات الأساسية</Text>
          <View style={[s.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>الاسم الكامل *</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="الاسم الكامل"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>البريد الإلكتروني *</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>رقم الهاتف</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="+222 XX XX XX XX"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>{isEdit ? "كلمة مرور جديدة" : "كلمة المرور *"}</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={password}
                onChangeText={setPassword}
                placeholder={isEdit ? "اتركه فارغاً للإبقاء" : "4 أحرف على الأقل"}
                placeholderTextColor={colors.muted}
                secureTextEntry
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.inputRow}>
              <Text style={[s.inputLabel, { color: colors.foreground }]}>القسم</Text>
              <TextInput
                style={[s.inputField, { color: colors.foreground }]}
                value={department}
                onChangeText={setDepartment}
                placeholder="مثال: المبيعات"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>

          {/* Role Selection */}
          <Text style={[s.sectionLabel, { color: colors.muted }]}>الدور الوظيفي</Text>
          <View style={s.roleGrid}>
            {(Object.entries(ROLE_INFO) as [EmployeeRole, typeof ROLE_INFO[EmployeeRole]][]).map(([key, info]) => (
              <Pressable
                key={key}
                onPress={() => handleRoleChange(key)}
                style={({ pressed }) => [
                  s.roleCard,
                  {
                    backgroundColor: role === key ? info.color + "20" : colors.surface,
                    borderColor: role === key ? info.color : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <IconSymbol name={info.icon as any} size={22} color={role === key ? info.color : colors.muted} />
                <Text style={[s.roleLabel, { color: role === key ? info.color : colors.foreground }]}>
                  {info.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Permissions */}
          <Text style={[s.sectionLabel, { color: colors.muted }]}>الصلاحيات</Text>
          <View style={[s.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {ALL_PERMISSIONS.map((perm, idx) => (
              <React.Fragment key={perm.key}>
                {idx > 0 && <View style={[s.divider, { backgroundColor: colors.border }]} />}
                <View style={s.permRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.permLabel, { color: colors.foreground }]}>{perm.label}</Text>
                    <Text style={[s.permDesc, { color: colors.muted }]}>{perm.description}</Text>
                  </View>
                  <Switch
                    value={selectedPermissions.includes(perm.key)}
                    onValueChange={() => togglePermission(perm.key)}
                    trackColor={{ false: colors.border, true: "#C9A84C80" }}
                    thumbColor={selectedPermissions.includes(perm.key) ? "#C9A84C" : "#f4f3f4"}
                  />
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Notes */}
          <Text style={[s.sectionLabel, { color: colors.muted }]}>ملاحظات</Text>
          <View style={[s.inputGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[s.notesInput, { color: colors.foreground }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="ملاحظات إضافية..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );

  const renderEmployeeCard = ({ item }: { item: Employee }) => {
    const roleInfo = ROLE_INFO[item.role] || ROLE_INFO.support;
    const isActive = item.status === "active";
    let permCount = 0;
    try { permCount = item.permissions ? JSON.parse(item.permissions).length : 0; } catch {}

    return (
      <Pressable
        onPress={() => handleEdit(item)}
        style={({ pressed }) => [s.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
      >
        <View style={s.cardHeader}>
          <View style={[s.avatarCircle, { backgroundColor: roleInfo.color + "20" }]}>
            <IconSymbol name={roleInfo.icon as any} size={20} color={roleInfo.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.cardTitle, { color: colors.foreground }]}>{item.fullName}</Text>
            <Text style={[s.cardSubtitle, { color: colors.muted }]}>{item.email}</Text>
          </View>
          <View style={[s.statusDot, { backgroundColor: isActive ? "#22C55E" : "#EF4444" }]} />
        </View>

        <View style={s.chipRow}>
          <View style={[s.chip, { backgroundColor: roleInfo.color + "20" }]}>
            <Text style={[s.chipText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
          </View>
          {item.department && (
            <View style={[s.chip, { backgroundColor: colors.border + "60" }]}>
              <Text style={[s.chipText, { color: colors.foreground }]}>{item.department}</Text>
            </View>
          )}
          <View style={[s.chip, { backgroundColor: "#0EA5E920" }]}>
            <Text style={[s.chipText, { color: "#0EA5E9" }]}>{permCount} صلاحيات</Text>
          </View>
        </View>

        {item.phone && (
          <View style={[s.contactRow, { marginTop: 8 }]}>
            <IconSymbol name="phone.fill" size={12} color={colors.muted} />
            <Text style={[s.contactText, { color: colors.muted }]}>{item.phone}</Text>
          </View>
        )}

        <View style={s.cardActions}>
          <Pressable
            onPress={() => handleToggleStatus(item)}
            style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <IconSymbol name={isActive ? "hand.raised.fill" : "checkmark.circle.fill"} size={16} color={isActive ? "#F59E0B" : "#22C55E"} />
            <Text style={{ fontSize: 12, color: isActive ? "#F59E0B" : "#22C55E" }}>
              {isActive ? "تعطيل" : "تفعيل"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleEdit(item)}
            style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <IconSymbol name="pencil" size={16} color="#0a7ea4" />
            <Text style={{ fontSize: 12, color: "#0a7ea4" }}>تعديل</Text>
          </Pressable>
          <Pressable
            onPress={() => handleDelete(item)}
            style={({ pressed }) => [s.actionBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <IconSymbol name="trash.fill" size={16} color="#EF4444" />
            <Text style={{ fontSize: 12, color: "#EF4444" }}>حذف</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[s.header, { backgroundColor: "#1B2B5E" }]}>
        <Pressable onPress={() => router.back()} style={{ width: 30 }}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={s.headerTitle}>إدارة الموظفين</Text>
        <Pressable
          onPress={() => { resetForm(); setShowCreateModal(true); }}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <IconSymbol name="plus.circle.fill" size={26} color="#C9A84C" />
        </Pressable>
      </View>

      {/* Summary */}
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { backgroundColor: "#1B2B5E" }]}>
          <Text style={s.summaryValue}>{employeesList.length}</Text>
          <Text style={s.summaryLabel}>إجمالي الموظفين</Text>
        </View>
        <View style={[s.summaryCard, { backgroundColor: "#14532D" }]}>
          <Text style={[s.summaryValue, { color: "#22C55E" }]}>{activeCount}</Text>
          <Text style={s.summaryLabel}>نشط</Text>
        </View>
        <View style={[s.summaryCard, { backgroundColor: "#7C2D12" }]}>
          <Text style={[s.summaryValue, { color: "#F87171" }]}>{employeesList.length - activeCount}</Text>
          <Text style={s.summaryLabel}>معطل</Text>
        </View>
      </View>

      {/* Role Legend */}
      <View style={s.legendRow}>
        {(Object.entries(ROLE_INFO) as [EmployeeRole, typeof ROLE_INFO[EmployeeRole]][]).map(([key, info]) => {
          const count = employeesList.filter((e) => e.role === key).length;
          return (
            <View key={key} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: info.color }]} />
              <Text style={[s.legendText, { color: colors.muted }]}>{info.label} ({count})</Text>
            </View>
          );
        })}
      </View>

      {employeesQuery.isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#C9A84C" />
        </View>
      ) : employeesList.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
          <IconSymbol name="person.3.fill" size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, fontSize: 16, marginTop: 12, textAlign: "center" }}>
            لا يوجد موظفون بعد
          </Text>
          <Pressable
            onPress={() => { resetForm(); setShowCreateModal(true); }}
            style={({ pressed }) => [s.emptyBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>إضافة موظف جديد</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={employeesList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEmployeeCard}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />}
        />
      )}

      {renderFormModal(false)}
      {renderFormModal(true)}
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
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  summaryRow: { flexDirection: "row", padding: 16, gap: 8 },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  summaryValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  summaryLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 4 },
  legendRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12, marginBottom: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSubtitle: { fontSize: 13, marginTop: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  chipText: { fontSize: 11, fontWeight: "600" },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  contactText: { fontSize: 12 },
  cardActions: { flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: "rgba(128,128,128,0.2)" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  emptyBtn: {
    backgroundColor: "#C9A84C",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128,128,128,0.3)",
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalBody: { flex: 1, padding: 20 },
  sectionLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: 8, marginTop: 20, letterSpacing: 0.5 },
  inputGroup: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  inputLabel: { width: 140, fontSize: 14 },
  inputField: { flex: 1, fontSize: 14, textAlign: "left" },
  divider: { height: 0.5, marginLeft: 16 },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roleCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  roleLabel: { fontSize: 13, fontWeight: "600" },
  permRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  permLabel: { fontSize: 14, fontWeight: "500" },
  permDesc: { fontSize: 11, marginTop: 2 },
  notesInput: { padding: 16, fontSize: 14, minHeight: 80, textAlignVertical: "top" },
});
