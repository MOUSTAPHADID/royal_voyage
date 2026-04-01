import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EMPLOYEE_SESSION_KEY = "royal_voyage_employee_session";

type EmployeePermissions = {
  canManageBookings: boolean;
  canManagePayments: boolean;
  canManagePricing: boolean;
  canManageCustomers: boolean;
  canViewReports: boolean;
  canManageEmployees: boolean;
  canManageBusinessAccounts: boolean;
};

export type EmployeeSession = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  department: string;
  permissions: EmployeePermissions;
  loginAt: string;
};

export async function getEmployeeSession(): Promise<EmployeeSession | null> {
  try {
    const raw = await AsyncStorage.getItem(EMPLOYEE_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export async function clearEmployeeSession(): Promise<void> {
  await AsyncStorage.removeItem(EMPLOYEE_SESSION_KEY);
}

export default function EmployeeLoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.employees.verifyLogin.useMutation();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("خطأ", "يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (result.success && result.employee) {
        const session: EmployeeSession = {
          id: result.employee.id,
          fullName: result.employee.fullName,
          email: result.employee.email,
          role: result.employee.role,
          department: result.employee.department || "",
          permissions: (typeof result.employee.permissions === "string" ? JSON.parse(result.employee.permissions) : result.employee.permissions) as unknown as EmployeePermissions,
          loginAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(session));

        Alert.alert(
          "مرحباً",
          `أهلاً ${result.employee.fullName}!\nالدور: ${getRoleLabel(result.employee.role)}`,
          [
            {
              text: "متابعة",
              onPress: () => router.replace("/employee-dashboard" as any),
            },
          ]
        );
      } else {
        Alert.alert("فشل تسجيل الدخول", result.error || "بيانات غير صحيحة");
      }
    } catch (err: any) {
      Alert.alert("خطأ", err?.message || "حدث خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "manager": return "مدير";
      case "accountant": return "محاسب";
      case "booking_agent": return "وكيل حجوزات";
      case "support": return "دعم عملاء";
      default: return role;
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primary + "15" }]}>
              <Text style={{ fontSize: 40 }}>👨‍💼</Text>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              بوابة الموظفين
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Royal Service — نظام إدارة الحجوزات
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formSection}>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <IconSymbol name="paperplane.fill" size={18} color={colors.muted} style={{ marginLeft: 12 }} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={18} color={colors.muted} style={{ marginLeft: 12 }} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="كلمة المرور"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={{ fontSize: 16 }}>{showPassword ? "🙈" : "👁️"}</Text>
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.loginBtn,
                { backgroundColor: colors.primary },
                isLoading && { opacity: 0.7 },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
              )}
            </Pressable>
          </View>

          {/* Back to app */}
          <Pressable
            style={styles.backLink}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.right" size={14} color={colors.primary} />
            <Text style={[styles.backLinkText, { color: colors.primary }]}>
              العودة إلى التطبيق
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  formSection: {
    paddingHorizontal: 24,
    gap: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    height: 52,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    textAlign: "right",
    writingDirection: "rtl",
  },
  eyeBtn: {
    paddingHorizontal: 14,
    height: "100%",
    justifyContent: "center",
  },
  loginBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    gap: 6,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
