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
    title: "الشروط والأحكام",
    updated: "آخر تحديث: أبريل 2026",
    sections: [
      {
        heading: "1. القبول بالشروط",
        body: "باستخدامك لتطبيق Royal Service أو موقعنا الإلكتروني، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام خدماتنا.",
      },
      {
        heading: "2. خدماتنا",
        body: "تقدم Royal Service خدمات حجز تذاكر الطيران والفنادق والرحلات السياحية. نعمل كوسيط بين المسافرين وشركات الطيران والفنادق، ولسنا مسؤولين مباشرة عن تقديم خدمات النقل أو الإقامة.",
      },
      {
        heading: "3. الحجز والدفع",
        body: "جميع الأسعار المعروضة بالمغني الموريتاني (MRU) وتشمل الرسوم والضرائب المطبقة. يُعتبر الحجز مؤكداً فقط بعد استلام الدفع الكامل وإصدار التذكرة. الأسعار قابلة للتغيير حتى إتمام الدفع.",
      },
      {
        heading: "4. سياسة الإلغاء والاسترداد",
        body: "تخضع عمليات الإلغاء لسياسات شركات الطيران والفنادق المعنية. قد تُطبق رسوم إلغاء. يُرجى مراجعة سياسة الاسترداد الخاصة بنا لمزيد من التفاصيل. للإلغاء، تواصل معنا خلال 24 ساعة من الحجز للحصول على أفضل شروط.",
      },
      {
        heading: "5. مسؤولية المسافر",
        body: "أنت مسؤول عن التأكد من صلاحية جواز سفرك وحصولك على التأشيرات اللازمة. Royal Service غير مسؤولة عن أي خسائر ناتجة عن وثائق سفر غير صالحة أو رفض الدخول.",
      },
      {
        heading: "6. حدود المسؤولية",
        body: "لا تتحمل Royal Service المسؤولية عن: تأخيرات الرحلات أو إلغاءاتها من قِبل شركات الطيران، الأضرار الناتجة عن ظروف خارجة عن إرادتنا (قوة قاهرة)، فقدان الأمتعة أو تلفها (مسؤولية شركة الطيران).",
      },
      {
        heading: "7. الملكية الفكرية",
        body: "جميع محتويات التطبيق والموقع، بما في ذلك الشعارات والنصوص والصور، هي ملك حصري لـ Royal Service ومحمية بموجب قوانين حقوق الملكية الفكرية. يُحظر نسخها أو توزيعها دون إذن مسبق.",
      },
      {
        heading: "8. القانون المطبق",
        body: "تخضع هذه الشروط لقوانين جمهورية موريتانيا الإسلامية. أي نزاع يُحل أمام المحاكم المختصة في نواكشوط.",
      },
      {
        heading: "9. التواصل",
        body: "Royal Service — طفرغ زينة، نواكشوط، موريتانيا\nهاتف: +222 33 70 00 00\nالبريد: royal-voyage@gmail.com",
      },
    ],
  },
  en: {
    dir: "ltr",
    title: "Terms & Conditions",
    updated: "Last updated: April 2026",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        body: "By using the Royal Service app or website, you agree to be bound by these Terms and Conditions. If you do not agree to any of these terms, please do not use our services.",
      },
      {
        heading: "2. Our Services",
        body: "Royal Service provides flight ticket, hotel, and tour booking services. We act as an intermediary between travelers and airlines/hotels, and are not directly responsible for providing transportation or accommodation services.",
      },
      {
        heading: "3. Booking and Payment",
        body: "All prices are displayed in Mauritanian Ouguiya (MRU) and include applicable fees and taxes. A booking is confirmed only after full payment is received and the ticket is issued. Prices are subject to change until payment is completed.",
      },
      {
        heading: "4. Cancellation and Refund Policy",
        body: "Cancellations are subject to the policies of the relevant airlines and hotels. Cancellation fees may apply. Please review our Refund Policy for more details. For cancellations, contact us within 24 hours of booking for the best terms.",
      },
      {
        heading: "5. Traveler Responsibility",
        body: "You are responsible for ensuring your passport is valid and obtaining necessary visas. Royal Service is not responsible for any losses resulting from invalid travel documents or denial of entry.",
      },
      {
        heading: "6. Limitation of Liability",
        body: "Royal Service is not liable for: flight delays or cancellations by airlines, damages resulting from circumstances beyond our control (force majeure), loss or damage of luggage (airline's responsibility).",
      },
      {
        heading: "7. Intellectual Property",
        body: "All content on the app and website, including logos, text, and images, is the exclusive property of Royal Service and is protected by intellectual property laws. Copying or distributing without prior permission is prohibited.",
      },
      {
        heading: "8. Governing Law",
        body: "These terms are governed by the laws of the Islamic Republic of Mauritania. Any dispute shall be resolved before the competent courts in Nouakchott.",
      },
      {
        heading: "9. Contact",
        body: "Royal Service — Tevragh Zeina, Nouakchott, Mauritania\nPhone: +222 33 70 00 00\nEmail: royal-voyage@gmail.com",
      },
    ],
  },
  fr: {
    dir: "ltr",
    title: "Conditions Générales",
    updated: "Dernière mise à jour : avril 2026",
    sections: [
      {
        heading: "1. Acceptation des conditions",
        body: "En utilisant l'application ou le site web Royal Service, vous acceptez d'être lié par ces Conditions Générales. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.",
      },
      {
        heading: "2. Nos services",
        body: "Royal Service fournit des services de réservation de billets d'avion, d'hôtels et de circuits touristiques. Nous agissons en tant qu'intermédiaire entre les voyageurs et les compagnies aériennes/hôtels.",
      },
      {
        heading: "3. Réservation et paiement",
        body: "Tous les prix sont affichés en Ouguiya mauritanienne (MRU) et incluent les frais et taxes applicables. Une réservation n'est confirmée qu'après réception du paiement intégral et émission du billet.",
      },
      {
        heading: "4. Annulation et remboursement",
        body: "Les annulations sont soumises aux politiques des compagnies aériennes et hôtels concernés. Des frais d'annulation peuvent s'appliquer. Veuillez consulter notre Politique de Remboursement pour plus de détails.",
      },
      {
        heading: "5. Responsabilité du voyageur",
        body: "Vous êtes responsable de vous assurer que votre passeport est valide et d'obtenir les visas nécessaires. Royal Service n'est pas responsable des pertes résultant de documents de voyage invalides.",
      },
      {
        heading: "6. Limitation de responsabilité",
        body: "Royal Service n'est pas responsable des retards ou annulations de vols par les compagnies aériennes, des dommages résultant de circonstances indépendantes de notre volonté, ou de la perte/détérioration des bagages.",
      },
      {
        heading: "7. Propriété intellectuelle",
        body: "Tout le contenu de l'application et du site web est la propriété exclusive de Royal Service et est protégé par les lois sur la propriété intellectuelle.",
      },
      {
        heading: "8. Droit applicable",
        body: "Ces conditions sont régies par les lois de la République Islamique de Mauritanie. Tout litige sera résolu devant les tribunaux compétents de Nouakchott.",
      },
      {
        heading: "9. Contact",
        body: "Royal Service — Tevragh Zeina, Nouakchott, Mauritanie\nTél : +222 33 70 00 00\nEmail : royal-voyage@gmail.com",
      },
    ],
  },
};

export default function TermsScreen() {
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
