/**
 * Document Generator Screen
 * Allows admin to fill contract/invoice data and generate a custom PDF
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

type DocType = "employment" | "invoice" | "partnership";

// ─── Form field helper ────────────────────────────────────────────────────────
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  colors,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean;
  colors: any;
  required?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, textAlign: "right", marginBottom: 5 }}>
        {label}{required && <Text style={{ color: "#EF4444" }}> *</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType || "default"}
        multiline={multiline}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 10 : 0,
          height: multiline ? 80 : 46,
          fontSize: 14,
          color: colors.foreground,
          textAlign: "right",
        }}
      />
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DocumentGeneratorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const colors = useColors();
  const [docType, setDocType] = useState<DocType>((params.type as DocType) || "employment");
  const [loading, setLoading] = useState(false);

  // Employment Contract fields
  const [empName, setEmpName] = useState("");
  const [empId, setEmpId] = useState("");
  const [empNationality, setEmpNationality] = useState("موريتانية");
  const [empBirthDate, setEmpBirthDate] = useState("");
  const [empPosition, setEmpPosition] = useState("");
  const [empDepartment, setEmpDepartment] = useState("");
  const [empStartDate, setEmpStartDate] = useState(new Date().toLocaleDateString("ar-MA"));
  const [empDuration, setEmpDuration] = useState("غير محدد المدة");
  const [empSalary, setEmpSalary] = useState("");
  const [empWorkHours, setEmpWorkHours] = useState("8 ساعات يومياً — 40 ساعة أسبوعياً");
  const [empProbation, setEmpProbation] = useState("3 أشهر");

  // Invoice fields
  const [invNumber, setInvNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [invDate, setInvDate] = useState(new Date().toLocaleDateString("ar-MA"));
  const [invDueDate, setInvDueDate] = useState("");
  const [invClientName, setInvClientName] = useState("");
  const [invClientPhone, setInvClientPhone] = useState("");
  const [invClientEmail, setInvClientEmail] = useState("");
  const [invClientAddress, setInvClientAddress] = useState("");
  const [invCurrency, setInvCurrency] = useState("MRU");
  const [invNotes, setInvNotes] = useState("");
  const [invPaymentMethod, setInvPaymentMethod] = useState("تحويل بنكي");
  // Invoice items (simplified: 3 fixed rows)
  const [item1Desc, setItem1Desc] = useState("");
  const [item1Qty, setItem1Qty] = useState("1");
  const [item1Price, setItem1Price] = useState("");
  const [item2Desc, setItem2Desc] = useState("");
  const [item2Qty, setItem2Qty] = useState("1");
  const [item2Price, setItem2Price] = useState("");
  const [item3Desc, setItem3Desc] = useState("");
  const [item3Qty, setItem3Qty] = useState("1");
  const [item3Price, setItem3Price] = useState("");

  // Partnership fields
  const [partName, setPartName] = useState("");
  const [partLegal, setPartLegal] = useState("");
  const [partAddress, setPartAddress] = useState("");
  const [partPhone, setPartPhone] = useState("");
  const [partEmail, setPartEmail] = useState("");
  const [partRep, setPartRep] = useState("");
  const [partCommission, setPartCommission] = useState("5");
  const [partStartDate, setPartStartDate] = useState(new Date().toLocaleDateString("ar-MA"));
  const [partDuration, setPartDuration] = useState("سنة واحدة قابلة للتجديد");

  // tRPC mutations
  const empMutation = trpc.documents.generateEmploymentContract.useMutation();
  const invMutation = trpc.documents.generateInvoice.useMutation();
  const partMutation = trpc.documents.generatePartnership.useMutation();

  const s = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      flex: 1,
      textAlign: "right",
    },
    tabRow: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 12,
      backgroundColor: colors.surface,
      padding: 4,
      gap: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      alignItems: "center",
    },
    tabActive: {
      backgroundColor: "#0D1B3E",
    },
    tabText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.muted,
      textAlign: "center",
    },
    tabTextActive: {
      color: "#FFFFFF",
    },
    section: {
      marginHorizontal: 20,
      marginTop: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: "#0D1B3E",
      textAlign: "right",
      marginBottom: 14,
      paddingBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: "#C9A84C",
    },
    generateBtn: {
      marginHorizontal: 20,
      marginVertical: 24,
      backgroundColor: "#0D1B3E",
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 10,
    },
    generateBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    itemBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginBottom: 12,
    },
    itemLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: "#C9A84C",
      textAlign: "right",
      marginBottom: 8,
    },
    itemRow: {
      flexDirection: "row",
      gap: 8,
    },
  });

  const handleGenerate = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      let result: { base64: string; filename: string } | null = null;

      if (docType === "employment") {
        if (!empName || !empPosition || !empStartDate || !empSalary) {
          Alert.alert("حقول مطلوبة", "يرجى ملء: الاسم، المسمى الوظيفي، تاريخ البدء، الراتب");
          setLoading(false);
          return;
        }
        result = await empMutation.mutateAsync({
          employeeName: empName,
          employeeId: empId,
          nationality: empNationality,
          birthDate: empBirthDate,
          position: empPosition,
          department: empDepartment,
          startDate: empStartDate,
          contractDuration: empDuration,
          salary: empSalary,
          workHours: empWorkHours,
          probationPeriod: empProbation,
          date: new Date().toLocaleDateString("ar-MA"),
        });
      } else if (docType === "invoice") {
        if (!invClientName || !item1Desc || !item1Price) {
          Alert.alert("حقول مطلوبة", "يرجى ملء: اسم العميل وبيان الخدمة الأولى وسعرها");
          setLoading(false);
          return;
        }
        const items = [
          { description: item1Desc, quantity: parseInt(item1Qty) || 1, unitPrice: parseFloat(item1Price) || 0 },
          ...(item2Desc ? [{ description: item2Desc, quantity: parseInt(item2Qty) || 1, unitPrice: parseFloat(item2Price) || 0 }] : []),
          ...(item3Desc ? [{ description: item3Desc, quantity: parseInt(item3Qty) || 1, unitPrice: parseFloat(item3Price) || 0 }] : []),
        ];
        result = await invMutation.mutateAsync({
          invoiceNumber: invNumber,
          date: invDate,
          dueDate: invDueDate || undefined,
          clientName: invClientName,
          clientPhone: invClientPhone || undefined,
          clientEmail: invClientEmail || undefined,
          clientAddress: invClientAddress || undefined,
          items,
          currency: invCurrency,
          notes: invNotes || undefined,
          paymentMethod: invPaymentMethod || undefined,
        });
      } else {
        if (!partName || !partCommission || !partStartDate) {
          Alert.alert("حقول مطلوبة", "يرجى ملء: اسم الشريك، نسبة العمولة، تاريخ البدء");
          setLoading(false);
          return;
        }
        result = await partMutation.mutateAsync({
          partnerName: partName,
          partnerLegal: partLegal || undefined,
          partnerAddress: partAddress || undefined,
          partnerPhone: partPhone || undefined,
          partnerEmail: partEmail || undefined,
          partnerRep: partRep || undefined,
          commissionRate: partCommission,
          startDate: partStartDate,
          duration: partDuration || undefined,
          date: new Date().toLocaleDateString("ar-MA"),
        });
      }

      if (result) {
        await savePDF(result.base64, result.filename);
      }
    } catch (err: any) {
      Alert.alert("خطأ", `فشل توليد PDF: ${err?.message || "خطأ غير معروف"}`);
    } finally {
      setLoading(false);
    }
  };

  const savePDF = async (base64: string, filename: string) => {
    if ((Platform.OS as string) === "web") {
      // Web: trigger download via data URL
      const dataUrl = `data:application/pdf;base64,${base64}`;
      const link = (document as any).createElement("a");
      link.href = dataUrl;
      link.download = filename;
      (document as any).body.appendChild(link);
      link.click();
      (document as any).body.removeChild(link);
      Alert.alert("تم", `تم تحميل الملف: ${filename}`);
      return;
    }

    // Native: save to cache and share
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/pdf",
        dialogTitle: filename,
        UTI: "com.adobe.pdf",
      });
    } else {
      Alert.alert("تم الحفظ", `تم حفظ الملف في: ${fileUri}`);
    }

    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const TABS: { id: DocType; label: string }[] = [
    { id: "employment", label: "عقد عمل" },
    { id: "invoice", label: "فاتورة" },
    { id: "partnership", label: "شراكة" },
  ];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.headerTitle}>توليد وثيقة مخصصة</Text>
        <IconSymbol name="doc.badge.plus" size={22} color="#C9A84C" />
      </View>

      {/* Type Tabs */}
      <View style={s.tabRow}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[s.tab, docType === tab.id && s.tabActive]}
            onPress={() => setDocType(tab.id)}
          >
            <Text style={[s.tabText, docType === tab.id && s.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Employment Contract Form ── */}
        {docType === "employment" && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>بيانات الموظف</Text>
            <Field label="الاسم الكامل" value={empName} onChangeText={setEmpName} colors={colors} required />
            <Field label="رقم الهوية / جواز السفر" value={empId} onChangeText={setEmpId} colors={colors} />
            <Field label="الجنسية" value={empNationality} onChangeText={setEmpNationality} colors={colors} />
            <Field label="تاريخ الميلاد" value={empBirthDate} onChangeText={setEmpBirthDate} placeholder="مثال: 01/01/1990" colors={colors} />

            <Text style={[s.sectionTitle, { marginTop: 8 }]}>تفاصيل الوظيفة</Text>
            <Field label="المسمى الوظيفي" value={empPosition} onChangeText={setEmpPosition} colors={colors} required />
            <Field label="القسم / الإدارة" value={empDepartment} onChangeText={setEmpDepartment} colors={colors} />
            <Field label="تاريخ بدء العمل" value={empStartDate} onChangeText={setEmpStartDate} colors={colors} required />
            <Field label="مدة العقد" value={empDuration} onChangeText={setEmpDuration} colors={colors} />
            <Field label="فترة التجربة" value={empProbation} onChangeText={setEmpProbation} colors={colors} />
            <Field label="ساعات العمل" value={empWorkHours} onChangeText={setEmpWorkHours} colors={colors} />

            <Text style={[s.sectionTitle, { marginTop: 8 }]}>الراتب</Text>
            <Field label="الراتب الأساسي الشهري" value={empSalary} onChangeText={setEmpSalary} placeholder="مثال: 50,000 MRU" keyboardType="default" colors={colors} required />
          </View>
        )}

        {/* ── Invoice Form ── */}
        {docType === "invoice" && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>بيانات الفاتورة</Text>
            <Field label="رقم الفاتورة" value={invNumber} onChangeText={setInvNumber} colors={colors} required />
            <Field label="تاريخ الإصدار" value={invDate} onChangeText={setInvDate} colors={colors} required />
            <Field label="تاريخ الاستحقاق" value={invDueDate} onChangeText={setInvDueDate} placeholder="اختياري" colors={colors} />

            <Text style={[s.sectionTitle, { marginTop: 8 }]}>بيانات العميل</Text>
            <Field label="اسم العميل" value={invClientName} onChangeText={setInvClientName} colors={colors} required />
            <Field label="رقم الهاتف" value={invClientPhone} onChangeText={setInvClientPhone} keyboardType="phone-pad" colors={colors} />
            <Field label="البريد الإلكتروني" value={invClientEmail} onChangeText={setInvClientEmail} keyboardType="email-address" colors={colors} />
            <Field label="العنوان" value={invClientAddress} onChangeText={setInvClientAddress} colors={colors} />

            <Text style={[s.sectionTitle, { marginTop: 8 }]}>بنود الفاتورة</Text>

            {/* Item 1 */}
            <View style={s.itemBox}>
              <Text style={s.itemLabel}>البند الأول *</Text>
              <Field label="البيان" value={item1Desc} onChangeText={setItem1Desc} colors={colors} required />
              <View style={s.itemRow}>
                <View style={{ flex: 1 }}>
                  <Field label="الكمية" value={item1Qty} onChangeText={setItem1Qty} keyboardType="numeric" colors={colors} />
                </View>
                <View style={{ flex: 2 }}>
                  <Field label="سعر الوحدة" value={item1Price} onChangeText={setItem1Price} keyboardType="numeric" colors={colors} required />
                </View>
              </View>
            </View>

            {/* Item 2 */}
            <View style={s.itemBox}>
              <Text style={s.itemLabel}>البند الثاني (اختياري)</Text>
              <Field label="البيان" value={item2Desc} onChangeText={setItem2Desc} colors={colors} />
              <View style={s.itemRow}>
                <View style={{ flex: 1 }}>
                  <Field label="الكمية" value={item2Qty} onChangeText={setItem2Qty} keyboardType="numeric" colors={colors} />
                </View>
                <View style={{ flex: 2 }}>
                  <Field label="سعر الوحدة" value={item2Price} onChangeText={setItem2Price} keyboardType="numeric" colors={colors} />
                </View>
              </View>
            </View>

            {/* Item 3 */}
            <View style={s.itemBox}>
              <Text style={s.itemLabel}>البند الثالث (اختياري)</Text>
              <Field label="البيان" value={item3Desc} onChangeText={setItem3Desc} colors={colors} />
              <View style={s.itemRow}>
                <View style={{ flex: 1 }}>
                  <Field label="الكمية" value={item3Qty} onChangeText={setItem3Qty} keyboardType="numeric" colors={colors} />
                </View>
                <View style={{ flex: 2 }}>
                  <Field label="سعر الوحدة" value={item3Price} onChangeText={setItem3Price} keyboardType="numeric" colors={colors} />
                </View>
              </View>
            </View>

            <Text style={[s.sectionTitle, { marginTop: 8 }]}>معلومات إضافية</Text>
            <Field label="العملة" value={invCurrency} onChangeText={setInvCurrency} placeholder="MRU / USD / EUR" colors={colors} />
            <Field label="طريقة الدفع" value={invPaymentMethod} onChangeText={setInvPaymentMethod} colors={colors} />
            <Field label="ملاحظات" value={invNotes} onChangeText={setInvNotes} multiline colors={colors} />
          </View>
        )}

        {/* ── Partnership Form ── */}
        {docType === "partnership" && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>بيانات الشريك</Text>
            <Field label="الاسم التجاري للشريك" value={partName} onChangeText={setPartName} colors={colors} required />
            <Field label="الاسم القانوني للشركة" value={partLegal} onChangeText={setPartLegal} colors={colors} />
            <Field label="العنوان الكامل" value={partAddress} onChangeText={setPartAddress} colors={colors} />
            <Field label="رقم الهاتف" value={partPhone} onChangeText={setPartPhone} keyboardType="phone-pad" colors={colors} />
            <Field label="البريد الإلكتروني" value={partEmail} onChangeText={setPartEmail} keyboardType="email-address" colors={colors} />
            <Field label="الممثل القانوني" value={partRep} onChangeText={setPartRep} colors={colors} />

            <Text style={[s.sectionTitle, { marginTop: 8 }]}>شروط الشراكة</Text>
            <Field label="نسبة العمولة (%)" value={partCommission} onChangeText={setPartCommission} keyboardType="numeric" colors={colors} required />
            <Field label="تاريخ بدء الشراكة" value={partStartDate} onChangeText={setPartStartDate} colors={colors} required />
            <Field label="مدة الاتفاقية" value={partDuration} onChangeText={setPartDuration} colors={colors} />
          </View>
        )}

        {/* Generate Button */}
        <Pressable
          style={({ pressed }) => [s.generateBtn, pressed && { opacity: 0.8 }, loading && { backgroundColor: "#666" }]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <IconSymbol name="arrow.down.to.line" size={20} color="#C9A84C" />
          )}
          <Text style={s.generateBtnText}>
            {loading ? "جارٍ التوليد..." : "توليد PDF وتحميله"}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
