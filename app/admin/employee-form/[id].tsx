import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAdmin } from "@/lib/admin-context";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";

const T = {
  ar: {
    addTitle: "إضافة موظف", editTitle: "تعديل موظف",
    name: "الاسم الكامل", email: "البريد الإلكتروني",
    phone: "الهاتف", password: "كلمة المرور",
    role: "الدور", save: "حفظ", cancel: "إلغاء",
    roles: { manager: "مدير", accountant: "محاسب", booking_agent: "وكيل حجز", support: "دعم" },
    namePh: "أدخل الاسم الكامل", emailPh: "example@email.com",
    phonePh: "+222 XXXXXXXX", passwordPh: "كلمة المرور (6 أحرف على الأقل)",
    success: "تم الحفظ بنجاح", errorRequired: "يرجى ملء جميع الحقول المطلوبة",
  },
  fr: {
    addTitle: "Ajouter employé", editTitle: "Modifier employé",
    name: "Nom complet", email: "E-mail",
    phone: "Téléphone", password: "Mot de passe",
    role: "Rôle", save: "Enregistrer", cancel: "Annuler",
    roles: { manager: "Directeur", accountant: "Comptable", booking_agent: "Agent réservation", support: "Support" },
    namePh: "Entrez le nom complet", emailPh: "example@email.com",
    phonePh: "+222 XXXXXXXX", passwordPh: "Mot de passe (6 caractères min.)",
    success: "Enregistré avec succès", errorRequired: "Veuillez remplir tous les champs requis",
  },
};

type Role = "manager" | "accountant" | "booking_agent" | "support";

export default function EmployeeFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const colors = useColors();
  const router = useRouter();
  const { language } = useAdmin();
  const t = T[language];

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "", role: "booking_agent" as Role,
  });

  const { data: empData, isLoading: loadingEmp } = trpc.employees.getById.useQuery(
    { id: Number(id) },
    { enabled: !isNew && !!id }
  );

  useEffect(() => {
    if (empData) {
      setForm({
        fullName: empData.fullName ?? "",
        email: empData.email ?? "",
        phone: empData.phone ?? "",
        password: "",
        role: empData.role as Role,
      });
    }
  }, [empData]);

  const createMutation = trpc.employees.create.useMutation({
    onSuccess: () => { Alert.alert("", t.success); router.back(); },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const updateMutation = trpc.employees.update.useMutation({
    onSuccess: () => { Alert.alert("", t.success); router.back(); },
    onError: (err) => Alert.alert("Error", err.message),
  });

  const handleSave = () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      Alert.alert("", t.errorRequired); return;
    }
    if (isNew) {
      if (!form.password.trim() || form.password.length < 6) {
        Alert.alert("", t.errorRequired); return;
      }
      createMutation.mutate({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password, role: form.role });
    } else {
      const update: any = { id: Number(id), fullName: form.fullName, email: form.email, phone: form.phone, role: form.role };
      if (form.password.trim().length >= 6) update.password = form.password;
      updateMutation.mutate(update);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isNew && loadingEmp) {
    return <ScreenContainer><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></ScreenContainer>;
  }

  const roles: Role[] = ["manager", "accountant", "booking_agent", "support"];

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isNew ? t.addTitle : t.editTitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {[
          { key: "fullName", label: t.name, placeholder: t.namePh, keyboard: "default" as const },
          { key: "email", label: t.email, placeholder: t.emailPh, keyboard: "email-address" as const },
          { key: "phone", label: t.phone, placeholder: t.phonePh, keyboard: "phone-pad" as const },
          { key: "password", label: t.password, placeholder: t.passwordPh, keyboard: "default" as const, secure: true },
        ].map(field => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>{field.label}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
              value={(form as any)[field.key]}
              onChangeText={(v) => setForm(f => ({ ...f, [field.key]: v }))}
              placeholder={field.placeholder}
              placeholderTextColor={colors.muted}
              keyboardType={field.keyboard}
              secureTextEntry={field.secure}
              autoCapitalize={field.key === "email" ? "none" : "words"}
            />
          </View>
        ))}

        {/* Role Selector */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.muted }]}>{t.role}</Text>
          <View style={styles.roleGrid}>
            {roles.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, { borderColor: form.role === r ? colors.primary : colors.border, backgroundColor: form.role === r ? colors.primary + "15" : colors.surface }]}
                onPress={() => setForm(f => ({ ...f, role: r }))}
              >
                <Text style={[styles.roleBtnText, { color: form.role === r ? colors.primary : colors.muted }]}>
                  {(t.roles as any)[r]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isPending ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={isPending}
        >
          {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.save}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => router.back()}>
          <Text style={[styles.cancelBtnText, { color: colors.muted }]}>{t.cancel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800", flex: 1 },
  content: { padding: 16, gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  roleBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  roleBtnText: { fontSize: 13, fontWeight: "600" },
  saveBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  cancelBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center", borderWidth: 1 },
  cancelBtnText: { fontSize: 15, fontWeight: "600" },
});
