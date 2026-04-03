import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

// ─── Document definitions ────────────────────────────────────────────────────
type DocItem = {
  id: string;
  titleAr: string;
  titleFr: string;
  description: string;
  pages: number;
  color: string;
  icon: "doc.fill" | "doc.text.fill" | "doc.richtext";
  filename: string;
  category: string;
};

const DOCUMENTS: DocItem[] = [
  {
    id: "partnership",
    titleAr: "اتفاقية شراكة تجارية",
    titleFr: "Accord de Partenariat Commercial",
    description: "نموذج اتفاقية شراكة بين ROYAL SERVICE LIMITED والشركات الشريكة، يتضمن العمولات والالتزامات والشروط القانونية.",
    pages: 3,
    color: "#C9A84C",
    icon: "doc.fill",
    filename: "partnership_agreement.pdf",
    category: "شراكات",
  },
  {
    id: "employment",
    titleAr: "عقد عمل",
    titleFr: "Contrat de Travail",
    description: "نموذج عقد عمل قانوني وفق قانون العمل الموريتاني، يشمل الراتب والمهام والإجازات وشروط الإنهاء.",
    pages: 4,
    color: "#0D1B3E",
    icon: "doc.text.fill",
    filename: "employment_contract.pdf",
    category: "موارد بشرية",
  },
  {
    id: "ticket",
    titleAr: "عقد حجز وشراء تذاكر سفر",
    titleFr: "Contrat de Réservation et d'Achat de Billets",
    description: "نموذج عقد قانوني لحجز وشراء تذاكر الطيران، يتضمن بيانات المسافر وتفاصيل الرحلة وسياسة الإلغاء.",
    pages: 4,
    color: "#1E40AF",
    icon: "doc.richtext",
    filename: "ticket_contract.pdf",
    category: "تذاكر سفر",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DocumentsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [downloading, setDownloading] = useState<string | null>(null);

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
      fontSize: 20,
      fontWeight: "700",
      color: colors.foreground,
      flex: 1,
      textAlign: "right",
    },
    heroBox: {
      margin: 20,
      borderRadius: 16,
      padding: 20,
      backgroundColor: "#0D1B3E",
      overflow: "hidden",
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF",
      textAlign: "right",
      marginBottom: 6,
    },
    heroSub: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      textAlign: "right",
      lineHeight: 20,
    },
    goldBar: {
      height: 3,
      backgroundColor: "#C9A84C",
      borderRadius: 2,
      marginTop: 14,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      textAlign: "right",
      paddingHorizontal: 20,
      marginBottom: 10,
      marginTop: 4,
    },
    card: {
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 14,
    },
    iconBox: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitleAr: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      textAlign: "right",
      marginBottom: 2,
    },
    cardTitleFr: {
      fontSize: 11,
      color: colors.muted,
      textAlign: "right",
      fontStyle: "italic",
    },
    cardDesc: {
      fontSize: 12.5,
      color: colors.muted,
      textAlign: "right",
      lineHeight: 19,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: colors.border,
    },
    badgeText: {
      fontSize: 11,
      color: colors.muted,
      fontWeight: "600",
    },
    downloadBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: "#0D1B3E",
    },
    downloadBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    shareBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#C9A84C",
    },
    shareBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#C9A84C",
    },
    infoBox: {
      margin: 20,
      marginTop: 4,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    infoText: {
      fontSize: 12,
      color: colors.muted,
      textAlign: "right",
      flex: 1,
      lineHeight: 18,
    },
  });

  const handleDownload = async (doc: DocItem) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDownloading(doc.id);

    try {
      if (Platform.OS === "web") {
        // On web, open the asset directly
        const url = `/assets/documents/${doc.filename}`;
        Linking.openURL(url);
        setDownloading(null);
        return;
      }

      // On native: copy from assets bundle to a shareable location
      const assetUri = `${FileSystem.bundleDirectory}assets/documents/${doc.filename}`;
      const destUri = `${FileSystem.cacheDirectory}${doc.filename}`;

      // Try to copy from bundle
      const info = await FileSystem.getInfoAsync(assetUri);
      if (info.exists) {
        await FileSystem.copyAsync({ from: assetUri, to: destUri });
      } else {
        // Fallback: download from server if available
        Alert.alert(
          "الملف غير متاح",
          "لم يتم العثور على الملف في حزمة التطبيق. تأكد من تضمين الملفات في بناء التطبيق.",
          [{ text: "حسناً" }]
        );
        setDownloading(null);
        return;
      }

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destUri, {
          mimeType: "application/pdf",
          dialogTitle: doc.titleAr,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("تم الحفظ", `تم حفظ الملف في: ${destUri}`);
      }
    } catch (err: any) {
      Alert.alert("خطأ", `فشل تحميل الملف: ${err?.message || "خطأ غير معروف"}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleShare = async (doc: DocItem) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "مشاركة الوثيقة",
      `هل تريد مشاركة "${doc.titleAr}"؟`,
      [
        { text: "إلغاء", style: "cancel" },
        { text: "مشاركة", onPress: () => handleDownload(doc) },
      ]
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={s.headerTitle}>وثائق الشركة</Text>
        <IconSymbol name="doc.fill" size={22} color="#C9A84C" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroBox}>
          <Text style={s.heroTitle}>نماذج قانونية جاهزة للاستخدام</Text>
          <Text style={s.heroSub}>
            وثائق رسمية معتمدة لـ ROYAL SERVICE LIMITED — يمكن طباعتها وتعبئتها وتوقيعها مباشرة
          </Text>
          <View style={s.goldBar} />
        </View>

        {/* Info note */}
        <View style={s.infoBox}>
          <IconSymbol name="info.circle.fill" size={18} color="#C9A84C" />
          <Text style={s.infoText}>
            جميع النماذج محررة باللغة العربية وفق القانون الموريتاني. يُنصح بمراجعة محامٍ قبل التوقيع على أي عقد.
          </Text>
        </View>

        {/* Documents */}
        <Text style={s.sectionLabel}>النماذج المتاحة ({DOCUMENTS.length})</Text>

        {DOCUMENTS.map((doc) => (
          <View key={doc.id} style={s.card}>
            {/* Card Header */}
            <View style={s.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitleAr}>{doc.titleAr}</Text>
                <Text style={s.cardTitleFr}>{doc.titleFr}</Text>
              </View>
              <View style={[s.iconBox, { backgroundColor: doc.color }]}>
                <IconSymbol name={doc.icon} size={26} color="#FFFFFF" />
              </View>
            </View>

            {/* Description */}
            <Text style={s.cardDesc}>{doc.description}</Text>

            {/* Footer */}
            <View style={s.cardFooter}>
              {/* Badges */}
              <View style={{ flexDirection: "row", gap: 8, flex: 1, flexWrap: "wrap" }}>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{doc.category}</Text>
                </View>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{doc.pages} صفحات</Text>
                </View>
                <View style={s.badge}>
                  <Text style={s.badgeText}>PDF</Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  style={({ pressed }) => [s.shareBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => handleShare(doc)}
                >
                  <IconSymbol name="square.and.arrow.up" size={14} color="#C9A84C" />
                  <Text style={s.shareBtnText}>مشاركة</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    s.downloadBtn,
                    { backgroundColor: downloading === doc.id ? "#666" : "#0D1B3E" },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => handleDownload(doc)}
                  disabled={downloading === doc.id}
                >
                  <IconSymbol name="arrow.down.to.line" size={14} color="#FFFFFF" />
                  <Text style={s.downloadBtnText}>
                    {downloading === doc.id ? "جارٍ التحميل..." : "تحميل"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        {/* Bottom info */}
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center" }}>
            © ROYAL SERVICE LIMITED — Royal Voyage{"\n"}
            جميع الحقوق محفوظة | royalvoyage.online
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
