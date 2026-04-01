import { ScrollView, Text, View, Pressable, Linking, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type Lang = "ar" | "en" | "fr";

const CONTENT: Record<Lang, { dir: "rtl" | "ltr"; title: string; updated: string; sections: { heading: string; body: string }[] }> = {
  ar: {
    dir: "rtl",
    title: "سياسة الاسترداد",
    updated: "آخر تحديث: أبريل 2026",
    sections: [
      {
        heading: "1. الإلغاء قبل 24 ساعة",
        body: "إذا أُلغي الحجز خلال 24 ساعة من إجرائه وقبل 7 أيام على الأقل من موعد السفر، يحق لك الحصول على استرداد كامل للمبلغ المدفوع مطروحاً منه رسوم المعالجة (2% من قيمة الحجز).",
      },
      {
        heading: "2. الإلغاء بعد 24 ساعة",
        body: "يخضع الاسترداد لسياسة شركة الطيران أو الفندق المعني. تتراوح رسوم الإلغاء عادةً بين 10% و50% من قيمة الحجز حسب الوقت المتبقي على السفر وفئة التذكرة.",
      },
      {
        heading: "3. التذاكر غير القابلة للاسترداد",
        body: "بعض التذاكر الاقتصادية المخفضة غير قابلة للاسترداد. سيتم الإشارة بوضوح إلى هذا الشرط قبل إتمام الحجز. يمكن في بعض الحالات تحويل قيمة التذكرة كرصيد لحجز مستقبلي.",
      },
      {
        heading: "4. إلغاء الرحلة من قِبل شركة الطيران",
        body: "في حال إلغاء الرحلة من قِبل شركة الطيران، يحق لك الحصول على استرداد كامل أو إعادة الحجز على رحلة بديلة بدون رسوم إضافية. سنتولى التنسيق مع شركة الطيران نيابةً عنك.",
      },
      {
        heading: "5. استرداد الفنادق",
        body: "يخضع استرداد حجوزات الفنادق لسياسة كل فندق على حدة. معظم الفنادق تتيح الإلغاء المجاني حتى 48 ساعة قبل موعد الوصول. ستجد شروط الإلغاء محددة في صفحة تفاصيل كل فندق.",
      },
      {
        heading: "6. مدة الاسترداد",
        body: "تستغرق عمليات الاسترداد عادةً من 5 إلى 14 يوم عمل، حسب طريقة الدفع المستخدمة:\n• البطاقات الائتمانية: 5-7 أيام عمل\n• Bankily/Sedad: 1-3 أيام عمل\n• التحويل البنكي: 7-14 يوم عمل",
      },
      {
        heading: "7. كيفية طلب الاسترداد",
        body: "لطلب استرداد، تواصل معنا عبر:\n• الهاتف: +222 33 70 00 00\n• البريد الإلكتروني: suporte@royalvoyage.online\n• واتساب: +222 33 70 00 00\nيرجى تقديم رقم الحجز وسبب الإلغاء.",
      },
      {
        heading: "8. الاستثناءات",
        body: "لا يُطبق الاسترداد في الحالات التالية: عدم الحضور للرحلة (No-Show)، التأخر عن موعد المغادرة، رفض الصعود لأسباب تتعلق بالمسافر (وثائق غير صالحة).",
      },
    ],
  },
  en: {
    dir: "ltr",
    title: "Refund Policy",
    updated: "Last updated: April 2026",
    sections: [
      {
        heading: "1. Cancellation within 24 hours",
        body: "If a booking is cancelled within 24 hours of making it and at least 7 days before the travel date, you are entitled to a full refund minus processing fees (2% of booking value).",
      },
      {
        heading: "2. Cancellation after 24 hours",
        body: "Refunds are subject to the policy of the relevant airline or hotel. Cancellation fees typically range from 10% to 50% of the booking value depending on time remaining before travel and ticket class.",
      },
      {
        heading: "3. Non-refundable tickets",
        body: "Some discounted economy tickets are non-refundable. This condition will be clearly indicated before completing the booking. In some cases, the ticket value can be converted to credit for a future booking.",
      },
      {
        heading: "4. Airline-initiated cancellations",
        body: "If a flight is cancelled by the airline, you are entitled to a full refund or rebooking on an alternative flight at no extra charge. We will coordinate with the airline on your behalf.",
      },
      {
        heading: "5. Hotel refunds",
        body: "Hotel booking refunds are subject to each hotel's individual policy. Most hotels allow free cancellation up to 48 hours before check-in. Cancellation terms are specified on each hotel's detail page.",
      },
      {
        heading: "6. Refund timeline",
        body: "Refunds typically take 5 to 14 business days depending on the payment method used:\n• Credit cards: 5-7 business days\n• Bankily/Sedad: 1-3 business days\n• Bank transfer: 7-14 business days",
      },
      {
        heading: "7. How to request a refund",
        body: "To request a refund, contact us via:\n• Phone: +222 33 70 00 00\n• Email: suporte@royalvoyage.online\n• WhatsApp: +222 33 70 00 00\nPlease provide your booking number and reason for cancellation.",
      },
      {
        heading: "8. Exceptions",
        body: "Refunds do not apply in the following cases: No-show (failure to appear for the flight), missing the departure time, denied boarding due to traveler-related reasons (invalid documents).",
      },
    ],
  },
  fr: {
    dir: "ltr",
    title: "Politique de Remboursement",
    updated: "Dernière mise à jour : avril 2026",
    sections: [
      {
        heading: "1. Annulation dans les 24 heures",
        body: "Si une réservation est annulée dans les 24 heures suivant sa réalisation et au moins 7 jours avant la date de voyage, vous avez droit à un remboursement intégral moins les frais de traitement (2% de la valeur de la réservation).",
      },
      {
        heading: "2. Annulation après 24 heures",
        body: "Les remboursements sont soumis à la politique de la compagnie aérienne ou de l'hôtel concerné. Les frais d'annulation varient généralement entre 10% et 50% de la valeur de la réservation.",
      },
      {
        heading: "3. Billets non remboursables",
        body: "Certains billets économiques à prix réduit ne sont pas remboursables. Cette condition sera clairement indiquée avant de finaliser la réservation.",
      },
      {
        heading: "4. Annulations par la compagnie aérienne",
        body: "Si un vol est annulé par la compagnie aérienne, vous avez droit à un remboursement intégral ou à une nouvelle réservation sur un vol alternatif sans frais supplémentaires.",
      },
      {
        heading: "5. Remboursements hôteliers",
        body: "Les remboursements des réservations d'hôtel sont soumis à la politique de chaque hôtel. La plupart des hôtels permettent l'annulation gratuite jusqu'à 48 heures avant l'arrivée.",
      },
      {
        heading: "6. Délai de remboursement",
        body: "Les remboursements prennent généralement 5 à 14 jours ouvrables selon le mode de paiement utilisé.",
      },
      {
        heading: "7. Comment demander un remboursement",
        body: "Pour demander un remboursement, contactez-nous via:\n• Téléphone : +222 33 70 00 00\n• Email : suporte@royalvoyage.online\n• WhatsApp : +222 33 70 00 00",
      },
      {
        heading: "8. Exceptions",
        body: "Les remboursements ne s'appliquent pas dans les cas suivants : non-présentation au vol, retard à l'embarquement, refus d'embarquement pour des raisons liées au voyageur.",
      },
    ],
  },
};

export default function RefundScreen() {
  const colors = useColors();
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ar");
  const content = CONTENT[lang];

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{content.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.langRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(["ar", "en", "fr"] as Lang[]).map((l) => (
          <Pressable key={l} style={[styles.langBtn, lang === l && { backgroundColor: colors.primary }]} onPress={() => setLang(l)}>
            <Text style={[styles.langText, { color: lang === l ? "#fff" : colors.muted }]}>
              {l === "ar" ? "العربية" : l === "en" ? "English" : "Français"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: colors.muted, textAlign: content.dir === "rtl" ? "right" : "left" }]}>{content.updated}</Text>
        {content.sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionHeading, { color: colors.primary, textAlign: content.dir === "rtl" ? "right" : "left" }]}>{section.heading}</Text>
            <Text style={[styles.sectionBody, { color: colors.foreground, textAlign: content.dir === "rtl" ? "right" : "left" }]}>{section.body}</Text>
          </View>
        ))}
        <Pressable style={[styles.contactBtn, { backgroundColor: colors.primary }]} onPress={() => Linking.openURL("tel:+22233700000")}>
          <IconSymbol name="phone.fill" size={18} color="#fff" />
          <Text style={styles.contactBtnText}>+222 33 70 00 00</Text>
        </Pressable>
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  langRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 0.5 },
  langBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  langText: { fontSize: 13, fontWeight: "600" },
  scrollContent: { padding: 20 },
  updated: { fontSize: 12, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionHeading: { fontSize: 15, fontWeight: "700", marginBottom: 6 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  contactBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  contactBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
