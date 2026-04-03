/**
 * Document Generator Screen
 * Allows admin to fill contract/invoice data and generate a custom PDF
 * Features: Save to DB, Send by Email, Ticket Invoice template
 */
import React, { useState, useEffect } from "react";
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
  Modal,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

type DocType = "employment" | "invoice" | "partnership" | "ticket";

// ─── Form field helper ────────────────────────────────────────────────────────
function Field({
  label, value, onChangeText, placeholder, keyboardType, multiline, colors, required,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  multiline?: boolean; colors: any; required?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, textAlign: "right", marginBottom: 5 }}>
        {label}{required && <Text style={{ color: "#EF4444" }}> *</Text>}
      </Text>
      <TextInput
        value={value} onChangeText={onChangeText}
        placeholder={placeholder || label} placeholderTextColor={colors.muted}
        keyboardType={keyboardType || "default"} multiline={multiline}
        style={{
          backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
          borderRadius: 10, paddingHorizontal: 14, paddingVertical: multiline ? 10 : 0,
          height: multiline ? 80 : 46, fontSize: 14, color: colors.foreground, textAlign: "right",
        }}
      />
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DocumentGeneratorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    mode?: string;
    passengerName?: string;
    passengerEmail?: string;
    bookingRef?: string;
    pnr?: string;
    origin?: string;
    originCity?: string;
    destination?: string;
    destinationCity?: string;
    departureDate?: string;
    departureTime?: string;
    arrivalTime?: string;
    airline?: string;
    flightNumber?: string;
    cabinClass?: string;
    passengers?: string;
    totalPrice?: string;
    businessAccountId?: string;
  }>();
  const colors = useColors();
  const initialDocType: DocType = params.mode === "ticket_invoice" ? "ticket" : ((params.type as DocType) || "employment");
  const [docType, setDocType] = useState<DocType>(initialDocType);
  const [loading, setLoading] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<{ base64: string; filename: string } | null>(null);
  const [savedDocId, setSavedDocId] = useState<number | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

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

  // Ticket Invoice fields
  const [tickInvNum, setTickInvNum] = useState(`TKT-${Date.now().toString().slice(-6)}`);
  const [tickDate, setTickDate] = useState(new Date().toLocaleDateString("en-GB"));
  const [tickPassenger, setTickPassenger] = useState("");
  const [tickPassEmail, setTickPassEmail] = useState("");
  const [tickPassPhone, setTickPassPhone] = useState("");
  const [tickBookingRef, setTickBookingRef] = useState("");
  const [tickPnr, setTickPnr] = useState("");
  const [tickOrigin, setTickOrigin] = useState("");
  const [tickOriginCity, setTickOriginCity] = useState("");
  const [tickDest, setTickDest] = useState("");
  const [tickDestCity, setTickDestCity] = useState("");
  const [tickDepDate, setTickDepDate] = useState("");
  const [tickRetDate, setTickRetDate] = useState("");
  const [tickAirline, setTickAirline] = useState("");
  const [tickFlightNum, setTickFlightNum] = useState("");
  const [tickCabin, setTickCabin] = useState("Economy");
  const [tickAdults, setTickAdults] = useState("1");
  const [tickChildren, setTickChildren] = useState("0");
  const [tickInfants, setTickInfants] = useState("0");
  const [tickAdultPrice, setTickAdultPrice] = useState("");
  const [tickChildPrice, setTickChildPrice] = useState("");
  const [tickInfantPrice, setTickInfantPrice] = useState("");
  const [tickTaxes, setTickTaxes] = useState("0");
  const [tickCurrency, setTickCurrency] = useState("MRU");
  const [tickPayMethod, setTickPayMethod] = useState("Bank Transfer");
  const [tickNotes, setTickNotes] = useState("");

  // Auto-fill ticket fields from URL params when navigating from booking detail
  useEffect(() => {
    if (params.mode === "ticket_invoice") {
      if (params.passengerName) setTickPassenger(params.passengerName);
      if (params.passengerEmail) setTickPassEmail(params.passengerEmail);
      if (params.bookingRef) setTickBookingRef(params.bookingRef);
      if (params.pnr) setTickPnr(params.pnr);
      if (params.origin) setTickOrigin(params.origin);
      if (params.originCity) setTickOriginCity(params.originCity);
      if (params.destination) setTickDest(params.destination);
      if (params.destinationCity) setTickDestCity(params.destinationCity);
      if (params.departureDate) setTickDepDate(params.departureDate);
      if (params.airline) setTickAirline(params.airline);
      if (params.flightNumber) setTickFlightNum(params.flightNumber);
      if (params.cabinClass) setTickCabin(params.cabinClass);
      if (params.passengers) setTickAdults(params.passengers);
      if (params.totalPrice) {
        const total = parseFloat(params.totalPrice);
        if (!isNaN(total) && total > 0) setTickAdultPrice(total.toFixed(2));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // tRPC mutations
  const empMutation = trpc.documents.generateEmploymentContract.useMutation();
  const invMutation = trpc.documents.generateInvoice.useMutation();
  const partMutation = trpc.documents.generatePartnership.useMutation();
  const ticketMutation = trpc.documents.generateTicketInvoice.useMutation();
  const saveDocMutation = trpc.documents.saveDocument.useMutation();
  const sendEmailMutation = trpc.documents.sendByEmail.useMutation();

  const s = StyleSheet.create({
    header: {
      flexDirection: "row", alignItems: "center", paddingHorizontal: 20,
      paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
      alignItems: "center", justifyContent: "center",
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, flex: 1, textAlign: "right" },
    tabRow: {
      flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12,
      gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    tab: {
      flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    tabActive: { backgroundColor: "#1B2B5E", borderColor: "#1B2B5E" },
    tabText: { fontSize: 11, fontWeight: "600", color: colors.muted },
    tabTextActive: { color: "#FFFFFF" },
    section: { padding: 20 },
    sectionTitle: {
      fontSize: 13, fontWeight: "700", color: "#1B2B5E", textAlign: "right",
      marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    itemBox: {
      backgroundColor: colors.surface, borderRadius: 12, padding: 14,
      marginBottom: 12, borderWidth: 1, borderColor: colors.border,
    },
    itemLabel: { fontSize: 12, fontWeight: "700", color: "#C9A84C", textAlign: "right", marginBottom: 10 },
    itemRow: { flexDirection: "row", gap: 10 },
    generateBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      backgroundColor: "#1B2B5E", marginHorizontal: 20, marginBottom: 30,
      paddingVertical: 16, borderRadius: 14, gap: 10,
    },
    generateBtnText: { fontSize: 16, fontWeight: "700", color: "#C9A84C" },
    actionRow: {
      flexDirection: "row", gap: 10, marginHorizontal: 20, marginBottom: 16,
    },
    actionBtn: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      paddingVertical: 13, borderRadius: 12, gap: 8,
    },
    actionBtnText: { fontSize: 13, fontWeight: "700" },
    modalOverlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center",
      alignItems: "center", padding: 20,
    },
    modalBox: {
      backgroundColor: colors.background, borderRadius: 16, padding: 24,
      width: "100%", maxWidth: 400,
    },
    modalTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground, textAlign: "right", marginBottom: 16 },
    modalBtn: {
      paddingVertical: 13, borderRadius: 12, alignItems: "center", marginTop: 10,
    },
  });

  const handleGenerate = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setGeneratedPdf(null);
    setSavedDocId(null);
    try {
      let result: { base64: string; filename: string } | null = null;
      let partyName = "";
      let partyEmail = "";
      let partyPhone = "";
      let refNumber = "";
      let amount = "";
      let currency = "";
      let dbDocType: "employment_contract" | "invoice" | "partnership" | "ticket_invoice" = "employment_contract";

      if (docType === "employment") {
        if (!empName || !empPosition || !empStartDate || !empSalary) {
          Alert.alert("حقول مطلوبة", "يرجى ملء: الاسم، المسمى الوظيفي، تاريخ البدء، الراتب");
          setLoading(false); return;
        }
        result = await empMutation.mutateAsync({
          employeeName: empName, employeeId: empId, nationality: empNationality,
          birthDate: empBirthDate, position: empPosition, department: empDepartment,
          startDate: empStartDate, contractDuration: empDuration, salary: empSalary,
          workHours: empWorkHours, probationPeriod: empProbation,
          date: new Date().toLocaleDateString("ar-MA"),
        });
        partyName = empName; partyPhone = ""; partyEmail = "";
        refNumber = `EMP-${Date.now().toString().slice(-6)}`; amount = empSalary; currency = "MRU";
        dbDocType = "employment_contract";

      } else if (docType === "invoice") {
        if (!invClientName || !item1Desc || !item1Price) {
          Alert.alert("حقول مطلوبة", "يرجى ملء: اسم العميل وبيان الخدمة الأولى وسعرها");
          setLoading(false); return;
        }
        const items = [
          { description: item1Desc, quantity: parseInt(item1Qty) || 1, unitPrice: parseFloat(item1Price) || 0 },
          ...(item2Desc ? [{ description: item2Desc, quantity: parseInt(item2Qty) || 1, unitPrice: parseFloat(item2Price) || 0 }] : []),
          ...(item3Desc ? [{ description: item3Desc, quantity: parseInt(item3Qty) || 1, unitPrice: parseFloat(item3Price) || 0 }] : []),
        ];
        const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
        result = await invMutation.mutateAsync({
          invoiceNumber: invNumber, date: invDate, dueDate: invDueDate || undefined,
          clientName: invClientName, clientPhone: invClientPhone || undefined,
          clientEmail: invClientEmail || undefined, clientAddress: invClientAddress || undefined,
          items, currency: invCurrency, notes: invNotes || undefined, paymentMethod: invPaymentMethod || undefined,
        });
        partyName = invClientName; partyEmail = invClientEmail; partyPhone = invClientPhone;
        refNumber = invNumber; amount = total.toFixed(2); currency = invCurrency;
        dbDocType = "invoice";

      } else if (docType === "partnership") {
        if (!partName || !partCommission || !partStartDate) {
          Alert.alert("حقول مطلوبة", "يرجى ملء: اسم الشريك، نسبة العمولة، تاريخ البدء");
          setLoading(false); return;
        }
        result = await partMutation.mutateAsync({
          partnerName: partName, partnerLegal: partLegal || undefined,
          partnerAddress: partAddress || undefined, partnerPhone: partPhone || undefined,
          partnerEmail: partEmail || undefined, partnerRep: partRep || undefined,
          commissionRate: partCommission, startDate: partStartDate,
          duration: partDuration || undefined, date: new Date().toLocaleDateString("ar-MA"),
        });
        partyName = partName; partyEmail = partEmail; partyPhone = partPhone;
        refNumber = `PART-${Date.now().toString().slice(-6)}`; amount = `${partCommission}%`; currency = "";
        dbDocType = "partnership";

      } else {
        // Ticket Invoice
        if (!tickPassenger || !tickOrigin || !tickDest || !tickAdultPrice) {
          Alert.alert("حقول مطلوبة", "يرجى ملء: اسم المسافر، المطارات، وسعر التذكرة");
          setLoading(false); return;
        }
        const adults = parseInt(tickAdults) || 1;
        const children = parseInt(tickChildren) || 0;
        const infants = parseInt(tickInfants) || 0;
        const adultPrice = parseFloat(tickAdultPrice) || 0;
        const childPrice = parseFloat(tickChildPrice) || 0;
        const infantPrice = parseFloat(tickInfantPrice) || 0;
        const taxes = parseFloat(tickTaxes) || 0;
        const total = adults * adultPrice + children * childPrice + infants * infantPrice + taxes;
        result = await ticketMutation.mutateAsync({
          invoiceNumber: tickInvNum, date: tickDate,
          passengerName: tickPassenger, passengerEmail: tickPassEmail || undefined,
          passengerPhone: tickPassPhone || undefined, bookingRef: tickBookingRef || undefined,
          pnr: tickPnr || undefined, origin: tickOrigin.toUpperCase(), originCity: tickOriginCity,
          destination: tickDest.toUpperCase(), destinationCity: tickDestCity,
          departureDate: tickDepDate, returnDate: tickRetDate || undefined,
          airline: tickAirline, flightNumber: tickFlightNum, cabinClass: tickCabin,
          adults, children, infants, adultPrice, childPrice: childPrice || undefined,
          infantPrice: infantPrice || undefined, taxes, totalPrice: total,
          currency: tickCurrency, paymentMethod: tickPayMethod || undefined,
          notes: tickNotes || undefined,
        });
        partyName = tickPassenger; partyEmail = tickPassEmail; partyPhone = tickPassPhone;
        refNumber = tickInvNum; amount = total.toFixed(2); currency = tickCurrency;
        dbDocType = "ticket_invoice";
      }

      if (result) {
        setGeneratedPdf(result);
        // Auto-save to DB
        try {
          const saved = await saveDocMutation.mutateAsync({
            docType: dbDocType, refNumber, partyName,
            partyEmail: partyEmail || undefined, partyPhone: partyPhone || undefined,
            amount: amount || undefined, currency: currency || undefined,
          });
          if (saved.id) setSavedDocId(saved.id);
        } catch { /* DB save is non-critical */ }
        // Auto-share/download
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
      const dataUrl = `data:application/pdf;base64,${base64}`;
      const link = (document as any).createElement("a");
      link.href = dataUrl; link.download = filename;
      (document as any).body.appendChild(link); link.click();
      (document as any).body.removeChild(link);
      Alert.alert("تم", `تم تحميل الملف: ${filename}`);
      return;
    }
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, { mimeType: "application/pdf", dialogTitle: filename, UTI: "com.adobe.pdf" });
    } else {
      Alert.alert("تم الحفظ", `تم حفظ الملف في: ${fileUri}`);
    }
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSendEmail = async () => {
    if (!generatedPdf || !emailTo) return;
    setSendingEmail(true);
    try {
      const docTypeMap: Record<DocType, "employment_contract" | "invoice" | "partnership" | "ticket_invoice"> = {
        employment: "employment_contract", invoice: "invoice",
        partnership: "partnership", ticket: "ticket_invoice",
      };
      const partyName = docType === "employment" ? empName : docType === "invoice" ? invClientName :
        docType === "partnership" ? partName : tickPassenger;
      await sendEmailMutation.mutateAsync({
        toEmail: emailTo, toName: partyName,
        docType: docTypeMap[docType], pdfBase64: generatedPdf.base64,
        filename: generatedPdf.filename, documentId: savedDocId || undefined,
      });
      setShowEmailModal(false);
      Alert.alert("تم الإرسال", `تم إرسال الوثيقة إلى ${emailTo}`);
    } catch (err: any) {
      Alert.alert("خطأ", `فشل الإرسال: ${err?.message || "خطأ غير معروف"}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const TABS: { id: DocType; label: string }[] = [
    { id: "employment", label: "عقد عمل" },
    { id: "invoice", label: "فاتورة" },
    { id: "partnership", label: "شراكة" },
    { id: "ticket", label: "تذاكر" },
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
          <Pressable key={tab.id} style={[s.tab, docType === tab.id && s.tabActive]}
            onPress={() => { setDocType(tab.id); setGeneratedPdf(null); setSavedDocId(null); }}>
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
            <Field label="الراتب الأساسي الشهري" value={empSalary} onChangeText={setEmpSalary} placeholder="مثال: 50,000 MRU" colors={colors} required />
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
            <View style={s.itemBox}>
              <Text style={s.itemLabel}>البند الأول *</Text>
              <Field label="البيان" value={item1Desc} onChangeText={setItem1Desc} colors={colors} required />
              <View style={s.itemRow}>
                <View style={{ flex: 1 }}><Field label="الكمية" value={item1Qty} onChangeText={setItem1Qty} keyboardType="numeric" colors={colors} /></View>
                <View style={{ flex: 2 }}><Field label="سعر الوحدة" value={item1Price} onChangeText={setItem1Price} keyboardType="numeric" colors={colors} required /></View>
              </View>
            </View>
            <View style={s.itemBox}>
              <Text style={s.itemLabel}>البند الثاني (اختياري)</Text>
              <Field label="البيان" value={item2Desc} onChangeText={setItem2Desc} colors={colors} />
              <View style={s.itemRow}>
                <View style={{ flex: 1 }}><Field label="الكمية" value={item2Qty} onChangeText={setItem2Qty} keyboardType="numeric" colors={colors} /></View>
                <View style={{ flex: 2 }}><Field label="سعر الوحدة" value={item2Price} onChangeText={setItem2Price} keyboardType="numeric" colors={colors} /></View>
              </View>
            </View>
            <View style={s.itemBox}>
              <Text style={s.itemLabel}>البند الثالث (اختياري)</Text>
              <Field label="البيان" value={item3Desc} onChangeText={setItem3Desc} colors={colors} />
              <View style={s.itemRow}>
                <View style={{ flex: 1 }}><Field label="الكمية" value={item3Qty} onChangeText={setItem3Qty} keyboardType="numeric" colors={colors} /></View>
                <View style={{ flex: 2 }}><Field label="سعر الوحدة" value={item3Price} onChangeText={setItem3Price} keyboardType="numeric" colors={colors} /></View>
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

        {/* ── Ticket Invoice Form ── */}
        {docType === "ticket" && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>بيانات الفاتورة</Text>
            <Field label="رقم الفاتورة" value={tickInvNum} onChangeText={setTickInvNum} colors={colors} required />
            <Field label="التاريخ" value={tickDate} onChangeText={setTickDate} placeholder="DD/MM/YYYY" colors={colors} required />

            <Text style={[s.sectionTitle, { marginTop: 8 }]}>بيانات المسافر</Text>
            <Field label="اسم المسافر الكامل" value={tickPassenger} onChangeText={setTickPassenger} colors={colors} required />
            <Field label="البريد الإلكتروني" value={tickPassEmail} onChangeText={setTickPassEmail} keyboardType="email-address" colors={colors} />
            <Field label="رقم الهاتف" value={tickPassPhone} onChangeText={setTickPassPhone} keyboardType="phone-pad" colors={colors} />
            <Field label="رقم الحجز (Booking Ref)" value={tickBookingRef} onChangeText={setTickBookingRef} colors={colors} />
            <Field label="رقم PNR" value={tickPnr} onChangeText={setTickPnr} colors={colors} />

            <Text style={[s.sectionTitle, { marginTop: 8 }]}>تفاصيل الرحلة</Text>
            <View style={s.itemRow}>
              <View style={{ flex: 1 }}><Field label="رمز المطار (من)" value={tickOrigin} onChangeText={setTickOrigin} placeholder="NKC" colors={colors} required /></View>
              <View style={{ flex: 1 }}><Field label="رمز المطار (إلى)" value={tickDest} onChangeText={setTickDest} placeholder="CDG" colors={colors} required /></View>
            </View>
            <View style={s.itemRow}>
              <View style={{ flex: 1 }}><Field label="مدينة المغادرة" value={tickOriginCity} onChangeText={setTickOriginCity} placeholder="Nouakchott" colors={colors} /></View>
              <View style={{ flex: 1 }}><Field label="مدينة الوصول" value={tickDestCity} onChangeText={setTickDestCity} placeholder="Paris" colors={colors} /></View>
            </View>
            <Field label="شركة الطيران" value={tickAirline} onChangeText={setTickAirline} placeholder="Air France" colors={colors} required />
            <Field label="رقم الرحلة" value={tickFlightNum} onChangeText={setTickFlightNum} placeholder="AF123" colors={colors} />
            <View style={s.itemRow}>
              <View style={{ flex: 1 }}><Field label="تاريخ المغادرة" value={tickDepDate} onChangeText={setTickDepDate} placeholder="DD/MM/YYYY" colors={colors} required /></View>
              <View style={{ flex: 1 }}><Field label="تاريخ العودة" value={tickRetDate} onChangeText={setTickRetDate} placeholder="اختياري" colors={colors} /></View>
            </View>
            <Field label="درجة السفر" value={tickCabin} onChangeText={setTickCabin} placeholder="Economy / Business" colors={colors} />

            <Text style={[s.sectionTitle, { marginTop: 8 }]}>المسافرون والأسعار</Text>
            <View style={s.itemRow}>
              <View style={{ flex: 1 }}><Field label="البالغون" value={tickAdults} onChangeText={setTickAdults} keyboardType="numeric" colors={colors} required /></View>
              <View style={{ flex: 1 }}><Field label="الأطفال" value={tickChildren} onChangeText={setTickChildren} keyboardType="numeric" colors={colors} /></View>
              <View style={{ flex: 1 }}><Field label="الرضع" value={tickInfants} onChangeText={setTickInfants} keyboardType="numeric" colors={colors} /></View>
            </View>
            <View style={s.itemRow}>
              <View style={{ flex: 1 }}><Field label="سعر البالغ" value={tickAdultPrice} onChangeText={setTickAdultPrice} keyboardType="numeric" colors={colors} required /></View>
              <View style={{ flex: 1 }}><Field label="سعر الطفل" value={tickChildPrice} onChangeText={setTickChildPrice} keyboardType="numeric" colors={colors} /></View>
              <View style={{ flex: 1 }}><Field label="سعر الرضيع" value={tickInfantPrice} onChangeText={setTickInfantPrice} keyboardType="numeric" colors={colors} /></View>
            </View>
            <Field label="الضرائب والرسوم" value={tickTaxes} onChangeText={setTickTaxes} keyboardType="numeric" colors={colors} />
            <Field label="العملة" value={tickCurrency} onChangeText={setTickCurrency} placeholder="MRU / USD / EUR" colors={colors} />
            <Field label="طريقة الدفع" value={tickPayMethod} onChangeText={setTickPayMethod} colors={colors} />
            <Field label="ملاحظات" value={tickNotes} onChangeText={setTickNotes} multiline colors={colors} />
          </View>
        )}

        {/* Generate Button */}
        <Pressable
          style={({ pressed }) => [s.generateBtn, pressed && { opacity: 0.8 }, loading && { backgroundColor: "#666" }]}
          onPress={handleGenerate} disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <IconSymbol name="arrow.down.to.line" size={20} color="#C9A84C" />}
          <Text style={s.generateBtnText}>{loading ? "جارٍ التوليد..." : "توليد PDF وتحميله"}</Text>
        </Pressable>

        {/* Post-generation actions */}
        {generatedPdf && (
          <View style={s.actionRow}>
            <Pressable
              style={({ pressed }) => [s.actionBtn, { backgroundColor: "#1B2B5E", opacity: pressed ? 0.8 : 1 }]}
              onPress={() => savePDF(generatedPdf.base64, generatedPdf.filename)}
            >
              <IconSymbol name="square.and.arrow.up" size={18} color="#C9A84C" />
              <Text style={[s.actionBtnText, { color: "#C9A84C" }]}>مشاركة</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.actionBtn, { backgroundColor: "#059669", opacity: pressed ? 0.8 : 1 }]}
              onPress={() => setShowEmailModal(true)}
            >
              <IconSymbol name="envelope.fill" size={18} color="#FFFFFF" />
              <Text style={[s.actionBtnText, { color: "#FFFFFF" }]}>إرسال بريد</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Email Modal */}
      <Modal visible={showEmailModal} transparent animationType="fade" onRequestClose={() => setShowEmailModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>إرسال الوثيقة بالبريد الإلكتروني</Text>
            <TextInput
              value={emailTo} onChangeText={setEmailTo}
              placeholder="البريد الإلكتروني للمستلم" placeholderTextColor={colors.muted}
              keyboardType="email-address" autoCapitalize="none"
              style={{
                backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 14,
                color: colors.foreground, textAlign: "right",
              }}
            />
            <Pressable
              style={({ pressed }) => [s.modalBtn, { backgroundColor: "#059669", opacity: pressed ? 0.8 : 1 }]}
              onPress={handleSendEmail} disabled={sendingEmail}
            >
              {sendingEmail ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>إرسال الآن</Text>}
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.modalBtn, { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
              onPress={() => setShowEmailModal(false)}
            >
              <Text style={{ color: colors.muted, fontWeight: "600", fontSize: 14 }}>إلغاء</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
