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
  ActivityIndicator,
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
  fetchLiveExchangeRates,
} from "@/lib/pricing-settings";

interface FieldConfig {
  key: keyof PricingSettings;
  label: string;
  unit: string;
  description: string;
  min: number;
  max: number;
  step: number;
  section?: string;
}

const FIELDS: FieldConfig[] = [
  // --- رسوم الوكالة ---
  {
    key: "agencyFeeMRU",
    label: "رسوم الوكالة — دولي",
    unit: "MRU",
    description: "رسوم الرحلات الدولية (مخفية عن الزبون)",
    min: 0,
    max: 50000,
    step: 100,
    section: "رسوم الوكالة",
  },
  {
    key: "agencyFeeDomesticMRU",
    label: "رسوم الوكالة — داخلي",
    unit: "MRU",
    description: "رسوم الرحلات الداخلية الموريتانية (مخفية عن الزبون)",
    min: 0,
    max: 50000,
    step: 100,
    section: "رسوم الوكالة",
  },
  // --- أسعار الصرف ---
  {
    key: "usdToMRU",
    label: "الدولار (USD)",
    unit: "MRU",
    description: "1 USD = ؟ MRU",
    min: 1,
    max: 200,
    step: 0.5,
    section: "أسعار الصرف",
  },
  {
    key: "eurToMRU",
    label: "اليورو (EUR)",
    unit: "MRU",
    description: "1 EUR = ؟ MRU",
    min: 1,
    max: 200,
    step: 0.5,
    section: "أسعار الصرف",
  },
  {
    key: "gbpToMRU",
    label: "الجنيه (GBP)",
    unit: "MRU",
    description: "1 GBP = ؟ MRU",
    min: 1,
    max: 200,
    step: 0.5,
    section: "أسعار الصرف",
  },
  {
    key: "sarToMRU",
    label: "الريال (SAR)",
    unit: "MRU",
    description: "1 SAR = ؟ MRU",
    min: 1,
    max: 100,
    step: 0.1,
    section: "أسعار الصرف",
  },
  {
    key: "aedToMRU",
    label: "الدرهم (AED)",
    unit: "MRU",
    description: "1 AED = ؟ MRU",
    min: 1,
    max: 100,
    step: 0.1,
    section: "أسعار الصرف",
  },
  {
    key: "aoaToMRU",
    label: "الكوانزا (AOA)",
    unit: "MRU",
    description: "1 AOA = ؟ MRU (Multicaixa Express)",
    min: 0.001,
    max: 1,
    step: 0.001,
    section: "أسعار الصرف",
  },
  // --- رسوم الخدمات الإضافية ---
  {
    key: "extraLegroomFeeMRU",
    label: "رسوم مساحة الأرجل الإضافية",
    unit: "MRU",
    description: "رسوم ترقية المقعد للحصول على مساحة أكبر للأرجل",
    min: 0,
    max: 10000,
    step: 50,
    section: "رسوم الخدمات",
  },
  {
    key: "seatChangeFeeMRU",
    label: "رسوم تغيير المقعد",
    unit: "MRU",
    description: "رسوم تغيير المقعد بعد تسجيل الوصول",
    min: 0,
    max: 10000,
    step: 50,
    section: "رسوم الخدمات",
  },
  {
    key: "hold24hFeeMRU",
    label: "رسوم الاحتفاظ بالسعر 24 ساعة",
    unit: "MRU",
    description: "رسوم خيار حجز مؤكد 24 ساعة (احجز الآن وادفع خلال 24 ساعة)",
    min: 0,
    max: 20000,
    step: 100,
    section: "رسوم الخدمات",
  },
  // --- أسعار الأطفال ---
  {
    key: "childDiscountRate",
    label: "معدل سعر الطفل",
    unit: "× سعر البالغ",
    description: "0.75 = 75% من سعر البالغ (خصم 25%)",
    min: 0.1,
    max: 1.0,
    step: 0.05,
    section: "أسعار الأطفال",
  },
  // --- هامش الرحلات الدولية ---
  {
    key: "markupEconomy",
    label: "اقتصادي — دولي",
    unit: "%",
    description: "نسبة الهامش على الدرجة الاقتصادية للرحلات الدولية",
    min: 0,
    max: 50,
    step: 0.5,
    section: "هامش دولي",
  },
  {
    key: "markupBusiness",
    label: "أعمال — دولي",
    unit: "%",
    description: "نسبة الهامش على درجة الأعمال للرحلات الدولية",
    min: 0,
    max: 50,
    step: 0.5,
    section: "هامش دولي",
  },
  {
    key: "markupFirst",
    label: "أولى — دولي",
    unit: "%",
    description: "نسبة الهامش على الدرجة الأولى للرحلات الدولية",
    min: 0,
    max: 50,
    step: 0.5,
    section: "هامش دولي",
  },
  // --- هامش الرحلات الداخلية ---
  {
    key: "markupEconomyDomestic",
    label: "اقتصادي — داخلي",
    unit: "%",
    description: "نسبة الهامش على الدرجة الاقتصادية للرحلات الداخلية",
    min: 0,
    max: 50,
    step: 0.5,
    section: "هامش داخلي",
  },
  {
    key: "markupBusinessDomestic",
    label: "أعمال — داخلي",
    unit: "%",
    description: "نسبة الهامش على درجة الأعمال للرحلات الداخلية",
    min: 0,
    max: 50,
    step: 0.5,
    section: "هامش داخلي",
  },
  {
    key: "markupFirstDomestic",
    label: "أولى — داخلي",
    unit: "%",
    description: "نسبة الهامش على الدرجة الأولى للرحلات الداخلية",
    min: 0,
    max: 50,
    step: 0.5,
    section: "هامش داخلي",
  },
];

const SECTIONS = ["رسوم الوكالة", "رسوم الخدمات", "هامش دولي", "هامش داخلي", "أسعار الصرف", "أسعار الأطفال"];

export default function PricingAdminScreen() {
  const router = useRouter();
  const colors = useColors();
  const [settings, setSettings] = useState<PricingSettings>({ ...DEFAULT_PRICING });
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingRates, setUpdatingRates] = useState(false);

  useEffect(() => {
    loadPricingSettings().then((s) => {
      setSettings(s);
      const init: Record<string, string> = {};
      FIELDS.forEach((f) => {
        const val = s[f.key as keyof PricingSettings];
        init[f.key] = val !== undefined ? String(val) : String(DEFAULT_PRICING[f.key as keyof PricingSettings]);
      });
      setValues(init);
      setLoading(false);
    });
  }, []);

  const handleChange = (key: keyof PricingSettings, text: string) => {
    setValues((prev) => ({ ...prev, [key]: text }));
    setSaved(false);
  };

  const handleUpdateRates = async () => {
    setUpdatingRates(true);
    const liveRates = await fetchLiveExchangeRates();
    setUpdatingRates(false);

    if (!liveRates) {
      Alert.alert("خطأ", "تعذّر تحديث أسعار الصرف. تحقق من الاتصال بالإنترنت.");
      return;
    }

    // تحديث القيم المعروضة
    const rateKeys: Array<keyof PricingSettings> = ["usdToMRU", "eurToMRU", "gbpToMRU", "sarToMRU", "aedToMRU", "aoaToMRU"];
    setValues((prev) => {
      const updated = { ...prev };
      rateKeys.forEach((k) => {
        if (liveRates[k] !== undefined) {
          updated[k] = String(liveRates[k]);
        }
      });
      return updated;
    });

    // حفظ تلقائي
    const updatedSettings: PricingSettings = { ...settings, ...liveRates };
    await savePricingSettings(updatedSettings);
    setSettings(updatedSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    const dateStr = new Date().toLocaleDateString("ar-SA", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    Alert.alert("تم التحديث", `تم تحديث أسعار الصرف بنجاح\n${dateStr}`);
  };

  const handleSave = async () => {
    const updated: PricingSettings = { ...settings };
    let hasError = false;

    for (const field of FIELDS) {
      const num = parseFloat(values[field.key]);
      if (isNaN(num) || num < field.min || num > field.max) {
        Alert.alert("قيمة غير صحيحة", `${field.label}: يجب أن تكون بين ${field.min} و ${field.max}`);
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
              const val = DEFAULT_PRICING[f.key as keyof PricingSettings];
              init[f.key] = val !== undefined ? String(val) : "0";
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
          <ActivityIndicator size="large" color="#1B2B5E" />
        </View>
      </ScreenContainer>
    );
  }

  const lastUpdated = settings.ratesLastUpdated
    ? new Date(settings.ratesLastUpdated).toLocaleDateString("ar-SA", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "لم يتم التحديث بعد";

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B2B5E" }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>إدارة الأسعار</Text>
        <Pressable style={styles.resetBtn} onPress={handleReset}>
          <IconSymbol name="arrow.counterclockwise" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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

          {/* زر تحديث أسعار الصرف */}
          <Pressable
            style={({ pressed }) => [
              styles.updateRatesBtn,
              { backgroundColor: "#0a7ea4", opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleUpdateRates}
            disabled={updatingRates}
          >
            {updatingRates ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="arrow.clockwise" size={18} color="#FFFFFF" />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.updateRatesBtnText}>
                {updatingRates ? "جاري التحديث..." : "تحديث أسعار الصرف تلقائياً"}
              </Text>
              <Text style={styles.updateRatesSubText}>آخر تحديث: {lastUpdated}</Text>
            </View>
          </Pressable>

          {/* الأقسام */}
          {SECTIONS.map((section) => {
            const sectionFields = FIELDS.filter((f) => f.section === section);
            return (
              <View key={section}>
                <Text style={[styles.sectionHeader, { color: colors.muted }]}>{section}</Text>
                {sectionFields.map((field) => (
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

                    <Text style={[styles.defaultHint, { color: colors.muted }]}>
                      الافتراضي: {DEFAULT_PRICING[field.key as keyof PricingSettings]}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* زر الحفظ */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: saved ? colors.success : "#1B2B5E", opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSave}
        >
          <IconSymbol
            name={saved ? "checkmark.circle.fill" : "square.and.arrow.down"}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.saveBtnText}>
            {saved ? "تم الحفظ" : "حفظ الإعدادات"}
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
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  updateRatesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
  },
  updateRatesBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  updateRatesSubText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
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
    fontSize: 15,
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
