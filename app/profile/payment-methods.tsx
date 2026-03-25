import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";
import { IconSymbol } from "@/components/ui/icon-symbol";

type PaymentMethod = {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  icon: string;
  color: string;
  available: boolean;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "bankily",
    name: "Bankily",
    nameAr: "بنكيلي",
    nameFr: "Bankily",
    description: "Pay via Bankily mobile wallet",
    descriptionAr: "الدفع عبر محفظة بنكيلي",
    descriptionFr: "Payer via le portefeuille Bankily",
    icon: "📱",
    color: "#00A651",
    available: true,
  },
  {
    id: "masrivi",
    name: "Masrivi",
    nameAr: "مصريفي",
    nameFr: "Masrivi",
    description: "Pay via Masrivi mobile wallet",
    descriptionAr: "الدفع عبر محفظة مصريفي",
    descriptionFr: "Payer via le portefeuille Masrivi",
    icon: "💳",
    color: "#1B4F72",
    available: true,
  },
  {
    id: "sedad",
    name: "Sedad",
    nameAr: "سداد",
    nameFr: "Sedad",
    description: "Pay via Sedad payment platform",
    descriptionAr: "الدفع عبر منصة سداد",
    descriptionFr: "Payer via la plateforme Sedad",
    icon: "🏦",
    color: "#2E86C1",
    available: true,
  },
  {
    id: "cash",
    name: "Cash at Office",
    nameAr: "نقداً في المكتب",
    nameFr: "Espèces au bureau",
    description: "Pay in cash at our office",
    descriptionAr: "الدفع نقداً في مكتب الوكالة",
    descriptionFr: "Payer en espèces à notre bureau",
    icon: "💵",
    color: "#27AE60",
    available: true,
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    nameAr: "تحويل بنكي",
    nameFr: "Virement bancaire",
    description: "Transfer to our bank account",
    descriptionAr: "تحويل إلى حسابنا البنكي",
    descriptionFr: "Virement vers notre compte bancaire",
    icon: "🏧",
    color: "#8E44AD",
    available: true,
  },
  {
    id: "paypal",
    name: "PayPal (Card)",
    nameAr: "PayPal (بالبطاقة)",
    nameFr: "PayPal (par carte)",
    description: "Pay with Visa, Mastercard or PayPal balance",
    descriptionAr: "ادفع بالبطاقة البنكية (Visa, Mastercard) أو رصيد PayPal",
    descriptionFr: "Payez par carte bancaire (Visa, Mastercard) ou solde PayPal",
    icon: "🌐",
    color: "#003087",
    available: true,
  },
];

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { language } = useI18n();

  const getLabel = (method: PaymentMethod, field: "name" | "description") => {
    if (language === "ar") return method[`${field}Ar`];
    if (language === "fr") return method[`${field}Fr`];
    return method[field];
  };

  const handleContact = () => {
    Linking.openURL("tel:+22233700000");
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>
            ← {language === "ar" ? "رجوع" : "Back"}
          </Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {language === "ar" ? "طرق الدفع" : language === "fr" ? "Méthodes de paiement" : "Payment Methods"}
        </Text>
        <Text style={styles.headerSub}>
          {language === "ar" ? "اختر طريقة الدفع المناسبة لك" : language === "fr" ? "Choisissez votre méthode de paiement" : "Choose your preferred payment method"}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Methods */}
        {PAYMENT_METHODS.map((method) => (
          <View
            key={method.id}
            style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.methodIconBox, { backgroundColor: method.color + "15" }]}>
              <Text style={styles.methodIcon}>{method.icon}</Text>
            </View>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodName, { color: colors.foreground }]}>
                {getLabel(method, "name")}
              </Text>
              <Text style={[styles.methodDesc, { color: colors.muted }]}>
                {getLabel(method, "description")}
              </Text>
            </View>
            <View style={[styles.availableBadge, { backgroundColor: colors.success + "15" }]}>
              <Text style={[styles.availableText, { color: colors.success }]}>
                {language === "ar" ? "متاح" : language === "fr" ? "Disponible" : "Available"}
              </Text>
            </View>
          </View>
        ))}

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            {language === "ar"
              ? "يتم اختيار طريقة الدفع عند تأكيد الحجز. للمساعدة، تواصل معنا."
              : language === "fr"
              ? "Le mode de paiement est choisi lors de la confirmation. Pour toute aide, contactez-nous."
              : "Payment method is selected during booking confirmation. For help, contact us."}
          </Text>
        </View>

        {/* Contact Button */}
        <Pressable
          style={({ pressed }) => [
            styles.contactBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleContact}
        >
          <IconSymbol name="phone.fill" size={18} color="#FFF" />
          <Text style={styles.contactBtnText}>
            {language === "ar" ? "اتصل بنا للمساعدة" : language === "fr" ? "Appelez-nous" : "Call Us for Help"}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 6,
  },
  backBtn: {
    marginBottom: 8,
  },
  backText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },
  headerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  methodIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  methodIcon: {
    fontSize: 24,
  },
  methodInfo: {
    flex: 1,
    gap: 3,
  },
  methodName: {
    fontSize: 16,
    fontWeight: "600",
  },
  methodDesc: {
    fontSize: 13,
  },
  availableBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  availableText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    alignItems: "flex-start",
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  contactBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
