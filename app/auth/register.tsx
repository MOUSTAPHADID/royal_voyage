import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { registerForPushNotifications } from "@/lib/push-notifications";

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const { register, saveExpoPushToken } = useApp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const success = await register(name.trim(), email.trim(), password);
      if (success) {
        // Register push token in background
        registerForPushNotifications()
          .then((token) => { if (token) saveExpoPushToken(token); })
          .catch(() => {});
        router.replace("/(tabs)" as any);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16 }}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Join the Royal Voyage family</Text>
        </View>

        {/* Form */}
        <View style={[styles.formContainer, { backgroundColor: colors.background }]}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + "15", borderColor: colors.error + "40" }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          {[
            { label: "Full Name", value: name, setter: setName, placeholder: "John Doe", type: "default" as const },
            { label: "Email Address", value: email, setter: setEmail, placeholder: "you@example.com", type: "email-address" as const },
            { label: "Password", value: password, setter: setPassword, placeholder: "Min. 6 characters", type: "default" as const, secure: true },
            { label: "Confirm Password", value: confirmPassword, setter: setConfirmPassword, placeholder: "Repeat password", type: "default" as const, secure: true },
          ].map((field) => (
            <View key={field.label} style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>{field.label}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                placeholder={field.placeholder}
                placeholderTextColor={colors.muted}
                value={field.value}
                onChangeText={field.setter}
                keyboardType={field.type}
                autoCapitalize={field.type === "email-address" ? "none" : "words"}
                autoCorrect={false}
                secureTextEntry={field.secure}
                returnKeyType="next"
              />
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [
              styles.registerButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: colors.muted }]}>
              Already have an account?{" "}
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: 24,
    gap: 8,
  },
  backButton: {
    marginBottom: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    padding: 28,
    paddingTop: 32,
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  registerButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 15,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: "700",
  },
});
