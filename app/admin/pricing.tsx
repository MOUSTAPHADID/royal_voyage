import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  PricingSettings,
  DEFAULT_PRICING,
  loadPricingSettings,
  savePricingSettings,
} from "@/lib/pricing-settings";

interface FieldConfig {
  key: keyof PricingSettings;
  label: string;
  unit: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

const FIELDS: FieldConfig[] = [
  {
    key: "agencyFeeMRU",
    label: "رسوم الوكالة",
    unit: "MRU",
    description: "تُضاف على كل حجز (رحلة أو فندق) ولا تظهر للزبون",
    min: 0,
    max: 50000,
    step: 100,
  },
  {
    key: "usdToMRU",
    label: "سعر الدولار (USD)",
    unit: "MRU",
    description: "1 USD = ؟ MRU",
    min: 1,
    max: 200,
    step: 0.5,
  },
  {
    key: "eurToMRU",
    label: "سعر اليورو (EUR)",
    unit: "MRU",
    description: "1 EUR = ؟ MRU",
    min: 1,
    max: 200,
    step: 0.5,
  },
  {
    key: "gbpToMRU",
    label: "سعر الجنيه (GBP)",
    unit: "MRU",
    description: "1 GBP = ؟ MRU",
    min: 1,
    max: 200,
    step: 0.5,
  },
  {
    key: "sarToMRU",
    label: "سعر الريال (SAR)",
    unit: "MRU",
    description: "1 SAR = ؟ MRU",
    min: 1,
    max: 100,
    step: 0.1,
  },
  {
    key: "aedToMRU",
    label: "سعر الدرهم (AED)",
    unit: "MRU",
    description: "1 AED = ؟ MRU",
    min: 1,
    max: 100,
    step: 0.1,
  },
  {
    key: "childDiscountRate",
    label: "معدل سعر الطفل",
    unit: "× سعر البالغ",
    description: "0.75 = 75% من سعر البالغ (خصم 25%)",
    min: 0.1,
    max: 1.0,
    step: 0.05,
  },
];

export default function PricingAdminScreen() {
  const router = useRouter();
  const colors = useColors();
  const [settings, setSettings] = useState<PricingSettings>({ ...DEFAULT_PRICING });
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPricingSettings().then((s) => {
      setSettings(s);
      const init: Record<string, string> = {};
      FIELDS.forEach((f) => {
        init[f.key] = String(s[f.key]);
      });
      setValues(init);
      setLoading(false);
    });
  }, []);

  const handleChange = (key: keyof PricingSettings, text: string) => {
    setValues((prev) => ({ ...prev, [key]: text }));
    setSaved(false);
  };

  const handleSave = async () => {
    const updated: PricingSettings = { ...settings };
    let hasError = false;

    for (const field of FIELDS) {
      const num = parseFloat(values[field.key]);
      if (isNaN(num) || num < field.min || num > field.max) {
        Alert.alert(
          "قيمة غير صحيحة",
          `${field.label}: يجب أن تكون بين ${field.min} و ${field.max}`
        );
        hasError = true;
        break;
      }
      (updated as any)[field.key] = num;
    }

    if (!hasError) {
      await savePricingSettings(updated);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "إعادة الضبط",
      "هل تريد إعادة جميع الإعدادات إلى القيم الافتراضية؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إعادة الضبط",
          style: "destructive",
          onPress: async () => {
            await savePricingSettings({ ...DEFAULT_PRICING });
            setSettings({ ...DEFAULT_PRICING });
            const init: Record<string, string> = {};
            FIELDS.forEach((f) => {
              init[f.key] = String(DEFAULT_PRICING[f.key]);
            });
            setValues(init);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>جاري التحميل...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>إدارة الأسعار</Text>
        <Pressable style={styles.resetBtn} onPress={handleReset}>
          <IconSymbol name="arrow.counterclockwise" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* تنبيه */}
          <View style={[styles.alertBox, { backgroundColor: colors.warning + "18", borderColor: colors.warning }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.warning} />
            <Text style={[styles.alertText, { color: colors.foreground }]}>
              التغييرات تؤثر فوراً على أسعار جميع الحجوزات الجديدة
            </Text>
          </View>

          {/* حقول الإعدادات */}
          {FIELDS.map((field) => (
            <View
              key={field.key}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.fieldHeader}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{field.label}</Text>
                <Text style={[styles.fieldUnit, { color: colors.primary }]}>{field.unit}</Text>
              </View>
              <Text style={[styles.fieldDesc, { color: colors.muted }]}>{field.description}</Text>

              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Pressable
                  style={[styles.stepBtn, { backgroundColor: colors.primary + "15" }]}
                  onPress={() => {
                    const cur = parseFloat(values[field.key]) || 0;
                    const next = Math.max(field.min, parseFloat((cur - field.step).toFixed(4)));
                    handleChange(field.key, String(next));
                  }}
                >
                  <Text style={[styles.stepBtnText, { color: colors.primary }]}>−</Text>
                </Pressable>

                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={values[field.key]}
                  onChangeText={(t) => handleChange(field.key, t)}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  selectTextOnFocus
                />

                <Pressable
                  style={[styles.stepBtn, { backgroundColor: colors.primary + "15" }]}
                  onPress={() => {
                    const cur = parseFloat(values[field.key]) || 0;
                    const next = Math.min(field.max, parseFloat((cur + field.step).toFixed(4)));
                    handleChange(field.key, String(next));
                  }}
                >
                  <Text style={[styles.stepBtnText, { color: colors.primary }]}>+</Text>
                </Pressable>
              </View>

              {/* القيمة الافتراضية */}
              <Text style={[styles.defaultHint, { color: colors.muted }]}>
                القيمة الافتراضية: {DEFAULT_PRICING[field.key]}
              </Text>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* زر الحفظ */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: saved ? colors.success : colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSave}
        >
          <IconSymbol
            name={saved ? "checkmark.circle.fill" : "square.and.arrow.down"}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.saveBtnText}>
            {saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  resetBtn: { padding: 4 },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { fontSize: 16 },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  fieldUnit: {
    fontSize: 12,
    fontWeight: "500",
  },
  fieldDesc: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  stepBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    fontSize: 22,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    height: 48,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  defaultHint: {
    fontSize: 11,
    marginTop: 6,
    textAlign: "right",
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 0.5,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
