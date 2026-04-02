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
        body: "باستخدامك لتطبيق Royal Voyage أو الموقع الإلكتروني royalvoyage.online، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام خدماتنا. هذه الشروط تُعدّ اتفاقية قانونية ملزمة بينك وبين شركة ROYAL SERVICE L.",
      },
      {
        heading: "2. هوية الشركة",
        body: "الاسم القانوني: ROYAL SERVICE L.\nالعلامة التجارية: Royal Voyage\nالعنوان: تفرغ زين، نواكشوط، موريتانيا\nالبريد الإلكتروني: suporte@royalvoyage.online\nالهاتف: +222 33 70 00 00\nالموقع الإلكتروني: royalvoyage.online",
      },
      {
        heading: "3. طبيعة خدماتنا — نحن وسيط",
        body: "تعمل Royal Voyage بوصفها وسيطاً (Intermediary) بين المسافرين ومزودي الخدمات التالية:\n• شركات الطيران: عبر شريكنا التقني Duffel\n• الفنادق ومرافق الإقامة: عبر Hotelbeds/HBX\n• مزودو الأنشطة السياحية\n\nنحن لسنا الناقل الجوي ولا مزود الإقامة مباشرةً. مسؤوليتنا تقتصر على إجراء الحجوزات نيابةً عنك وضمان تسليم التذاكر والتأكيدات. تخضع الخدمات الفعلية لشروط وأحكام مزودي الخدمة المعنيين.",
      },
      {
        heading: "4. الحجز والدفع",
        body: "جميع الأسعار المعروضة بالدولار الأمريكي (USD) وتشمل الرسوم والضرائب المطبقة.\n\nطرق الدفع المقبولة:\n• Stripe: بطاقات Visa وMastercard الدولية\n• Bankily: محفظة إلكترونية موريتانية\n• Masrvi: خدمة دفع إلكترونية موريتانية\n• Sedad: منصة دفع رقمية موريتانية\n\nيُعتبر الحجز مؤكداً فقط بعد استلام الدفع الكامل وإصدار التذكرة أو التأكيد. الأسعار قابلة للتغيير حتى إتمام الدفع.",
      },
      {
        heading: "5. إصدار التذاكر والتأكيدات",
        body: "بعد اكتمال الدفع، تُصدر التذاكر الإلكترونية وتُرسل مباشرة إلى بريدك الإلكتروني خلال مدة أقصاها 24 ساعة. تحتوي التذاكر على رقم الحجز (PNR) وجميع تفاصيل الرحلة. في حالة عدم استلام التذكرة، يرجى التواصل معنا فوراً.",
      },
      {
        heading: "6. سياسة الإلغاء والاسترداد",
        body: "• الإلغاء خلال 24 ساعة من الحجز وقبل 7 أيام من السفر: استرداد كامل مطروحاً منه 2% رسوم معالجة\n• الإلغاء بعد 24 ساعة: يخضع لسياسة شركة الطيران أو الفندق (10%-50% رسوم إلغاء)\n• التذاكر غير القابلة للاسترداد: تُشار إليها بوضوح قبل إتمام الحجز\n• إلغاء الرحلة من قِبل شركة الطيران: استرداد كامل أو إعادة حجز مجانية\n\nيرجى مراجعة سياسة الاسترداد الكاملة للتفاصيل.",
      },
      {
        heading: "7. مسؤولية المسافر",
        body: "أنت مسؤول مسؤولية كاملة عن:\n• التأكد من صلاحية جواز سفرك (6 أشهر على الأقل بعد تاريخ العودة)\n• الحصول على التأشيرات اللازمة لجميع الدول التي ستزورها\n• الحضور في الوقت المحدد لجميع الرحلات\n• صحة المعلومات الشخصية المُدخلة في الحجز\n\nRoyal Voyage غير مسؤولة عن أي خسائر ناتجة عن وثائق سفر غير صالحة أو رفض الدخول.",
      },
      {
        heading: "8. حدود المسؤولية",
        body: "لا تتحمل ROYAL SERVICE L. المسؤولية عن:\n• تأخيرات الرحلات أو إلغاءاتها من قِبل شركات الطيران\n• الأضرار الناتجة عن ظروف خارجة عن إرادتنا (قوة قاهرة: كوارث طبيعية، إضرابات، قرارات حكومية)\n• فقدان الأمتعة أو تلفها (مسؤولية شركة الطيران)\n• تغييرات في جداول الرحلات تقوم بها شركات الطيران\n\nفي جميع الحالات، تقتصر مسؤوليتنا القصوى على قيمة الحجز المدفوعة.",
      },
      {
        heading: "9. الملكية الفكرية",
        body: "جميع محتويات التطبيق والموقع، بما في ذلك الشعارات والنصوص والصور والتصميمات، هي ملك حصري لـ ROYAL SERVICE L. ومحمية بموجب قوانين حقوق الملكية الفكرية. يُحظر نسخها أو توزيعها أو استخدامها تجارياً دون إذن كتابي مسبق.",
      },
      {
        heading: "10. حماية البيانات",
        body: "نلتزم بحماية بياناتك الشخصية وفق سياسة الخصوصية المفصّلة. نستخدم تشفير SSL/TLS لجميع الاتصالات. بيانات الدفع تُعالج عبر Stripe المعتمد من PCI DSS. لا نحتفظ بأرقام البطاقات الكاملة على خوادمنا.",
      },
      {
        heading: "11. التعديل على الشروط",
        body: "نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني. استمرارك في استخدام الخدمة بعد التعديل يُعدّ قبولاً للشروط الجديدة.",
      },
      {
        heading: "12. القانون المطبق وتسوية النزاعات",
        body: "تخضع هذه الشروط لقوانين جمهورية موريتانيا الإسلامية. في حالة نشوء أي نزاع، يُفضّل حله ودياً أولاً عبر التواصل المباشر معنا. إذا تعذّر الحل الودي، يُحال النزاع إلى المحاكم المختصة في نواكشوط.",
      },
      {
        heading: "13. التواصل",
        body: "ROYAL SERVICE L. — Royal Voyage\nتفرغ زين، نواكشوط، موريتانيا\nالبريد: suporte@royalvoyage.online\nالهاتف: +222 33 70 00 00\nواتساب: +222 33 70 00 00",
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
        body: "By using the Royal Voyage app or the website royalvoyage.online, you agree to be bound by these Terms and Conditions. If you do not agree to any of these terms, please do not use our services. These terms constitute a legally binding agreement between you and ROYAL SERVICE L.",
      },
      {
        heading: "2. Company Identity",
        body: "Legal Name: ROYAL SERVICE L.\nBrand: Royal Voyage\nAddress: Tevragh Zeina, Nouakchott, Mauritania\nEmail: suporte@royalvoyage.online\nPhone: +222 33 70 00 00\nWebsite: royalvoyage.online",
      },
      {
        heading: "3. Nature of Our Services — We Are an Intermediary",
        body: "Royal Voyage acts as an intermediary between travelers and the following service providers:\n• Airlines: via our technology partner Duffel\n• Hotels and accommodation: via Hotelbeds/HBX\n• Tourist activity providers\n\nWe are not the direct air carrier or accommodation provider. Our responsibility is limited to making bookings on your behalf and ensuring delivery of tickets and confirmations. Actual services are subject to the terms and conditions of the respective service providers.",
      },
      {
        heading: "4. Booking and Payment",
        body: "All prices are displayed in US Dollars (USD) and include applicable fees and taxes.\n\nAccepted payment methods:\n• Stripe: Visa and Mastercard international cards\n• Bankily: Mauritanian electronic wallet\n• Masrvi: Mauritanian electronic payment service\n• Sedad: Mauritanian digital payment platform\n\nA booking is confirmed only after full payment is received and the ticket or confirmation is issued. Prices are subject to change until payment is completed.",
      },
      {
        heading: "5. Ticket and Confirmation Issuance",
        body: "After payment is completed, e-tickets are issued and sent directly to your email within a maximum of 24 hours. Tickets include the booking number (PNR) and all flight details. If you do not receive your ticket, please contact us immediately.",
      },
      {
        heading: "6. Cancellation and Refund Policy",
        body: "• Cancellation within 24 hours of booking and at least 7 days before travel: full refund minus 2% processing fee\n• Cancellation after 24 hours: subject to airline or hotel policy (10%-50% cancellation fees)\n• Non-refundable tickets: clearly indicated before completing the booking\n• Airline-initiated cancellation: full refund or free rebooking\n\nPlease review our full Refund Policy for details.",
      },
      {
        heading: "7. Traveler Responsibility",
        body: "You are fully responsible for:\n• Ensuring your passport is valid (at least 6 months after return date)\n• Obtaining necessary visas for all countries you will visit\n• Arriving on time for all flights\n• Accuracy of personal information entered in the booking\n\nRoyal Voyage is not responsible for any losses resulting from invalid travel documents or denial of entry.",
      },
      {
        heading: "8. Limitation of Liability",
        body: "ROYAL SERVICE L. is not liable for:\n• Flight delays or cancellations by airlines\n• Damages resulting from circumstances beyond our control (force majeure: natural disasters, strikes, government decisions)\n• Loss or damage of luggage (airline's responsibility)\n• Schedule changes made by airlines\n\nIn all cases, our maximum liability is limited to the value of the booking paid.",
      },
      {
        heading: "9. Intellectual Property",
        body: "All content on the app and website, including logos, text, images, and designs, is the exclusive property of ROYAL SERVICE L. and is protected by intellectual property laws. Copying, distributing, or commercial use without prior written permission is prohibited.",
      },
      {
        heading: "10. Data Protection",
        body: "We are committed to protecting your personal data in accordance with our detailed Privacy Policy. We use SSL/TLS encryption for all communications. Payment data is processed via PCI DSS-certified Stripe. We do not retain full card numbers on our servers.",
      },
      {
        heading: "11. Modification of Terms",
        body: "We reserve the right to modify these terms at any time. You will be notified of any material changes via the app or email. Your continued use of the service after modification constitutes acceptance of the new terms.",
      },
      {
        heading: "12. Governing Law and Dispute Resolution",
        body: "These terms are governed by the laws of the Islamic Republic of Mauritania. In case of any dispute, amicable resolution is preferred first through direct contact with us. If amicable resolution fails, the dispute shall be referred to the competent courts in Nouakchott.",
      },
      {
        heading: "13. Contact",
        body: "ROYAL SERVICE L. — Royal Voyage\nTevragh Zeina, Nouakchott, Mauritania\nEmail: suporte@royalvoyage.online\nPhone: +222 33 70 00 00\nWhatsApp: +222 33 70 00 00",
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
        body: "En utilisant l'application Royal Voyage ou le site royalvoyage.online, vous acceptez d'être lié par ces Conditions Générales. Ces conditions constituent un accord juridiquement contraignant entre vous et ROYAL SERVICE L.",
      },
      {
        heading: "2. Identité de la société",
        body: "Raison sociale : ROYAL SERVICE L.\nMarque : Royal Voyage\nAdresse : Tevragh Zeina, Nouakchott, Mauritanie\nEmail : suporte@royalvoyage.online\nTél : +222 33 70 00 00\nSite web : royalvoyage.online",
      },
      {
        heading: "3. Nature de nos services — Nous sommes un intermédiaire",
        body: "Royal Voyage agit en tant qu'intermédiaire entre les voyageurs et les prestataires suivants :\n• Compagnies aériennes : via notre partenaire technologique Duffel\n• Hôtels et hébergements : via Hotelbeds/HBX\n• Prestataires d'activités touristiques\n\nNous ne sommes pas le transporteur aérien ni le prestataire d'hébergement direct. Notre responsabilité se limite à effectuer des réservations en votre nom et à assurer la livraison des billets et confirmations.",
      },
      {
        heading: "4. Réservation et paiement",
        body: "Tous les prix sont affichés en Dollar américain (USD) et incluent les frais et taxes applicables.\n\nModes de paiement acceptés :\n• Stripe : cartes Visa et Mastercard internationales\n• Bankily : portefeuille électronique mauritanien\n• Masrvi : service de paiement électronique mauritanien\n• Sedad : plateforme de paiement numérique mauritanienne\n\nUne réservation n'est confirmée qu'après réception du paiement intégral et émission du billet.",
      },
      {
        heading: "5. Émission des billets et confirmations",
        body: "Après le paiement, les billets électroniques sont émis et envoyés directement à votre e-mail dans un délai maximum de 24 heures. Les billets incluent le numéro de réservation (PNR) et tous les détails du vol.",
      },
      {
        heading: "6. Politique d'annulation et de remboursement",
        body: "• Annulation dans les 24h de la réservation et au moins 7 jours avant le voyage : remboursement intégral moins 2% de frais de traitement\n• Annulation après 24h : soumis à la politique de la compagnie aérienne ou de l'hôtel (10%-50% de frais)\n• Billets non remboursables : clairement indiqués avant la finalisation\n• Annulation par la compagnie aérienne : remboursement intégral ou nouvelle réservation gratuite",
      },
      {
        heading: "7. Responsabilité du voyageur",
        body: "Vous êtes entièrement responsable de :\n• Vous assurer que votre passeport est valide (au moins 6 mois après la date de retour)\n• Obtenir les visas nécessaires pour tous les pays visités\n• Arriver à l'heure pour tous les vols\n• L'exactitude des informations personnelles saisies",
      },
      {
        heading: "8. Limitation de responsabilité",
        body: "ROYAL SERVICE L. n'est pas responsable des retards ou annulations de vols, des dommages résultant de circonstances indépendantes de notre volonté (force majeure), ou de la perte/détérioration des bagages. Notre responsabilité maximale est limitée à la valeur de la réservation payée.",
      },
      {
        heading: "9. Propriété intellectuelle",
        body: "Tout le contenu de l'application et du site est la propriété exclusive de ROYAL SERVICE L. et est protégé par les lois sur la propriété intellectuelle. Toute copie ou utilisation commerciale sans autorisation écrite préalable est interdite.",
      },
      {
        heading: "10. Protection des données",
        body: "Nous nous engageons à protéger vos données personnelles conformément à notre Politique de Confidentialité détaillée. Nous utilisons le chiffrement SSL/TLS. Les données de paiement sont traitées via Stripe certifié PCI DSS.",
      },
      {
        heading: "11. Modification des conditions",
        body: "Nous nous réservons le droit de modifier ces conditions à tout moment. Vous serez informé de tout changement important via l'application ou par e-mail.",
      },
      {
        heading: "12. Droit applicable et résolution des litiges",
        body: "Ces conditions sont régies par les lois de la République Islamique de Mauritanie. Tout litige sera d'abord résolu à l'amiable, puis devant les tribunaux compétents de Nouakchott.",
      },
      {
        heading: "13. Contact",
        body: "ROYAL SERVICE L. — Royal Voyage\nTevragh Zeina, Nouakchott, Mauritanie\nEmail : suporte@royalvoyage.online\nTél : +222 33 70 00 00\nWhatsApp : +222 33 70 00 00",
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
        <View style={styles.ctaRow}>
          <Pressable style={[styles.contactBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={() => Linking.openURL("tel:+22233700000")}>
            <IconSymbol name="phone.fill" size={18} color="#fff" />
            <Text style={styles.contactBtnText}>+222 33 70 00 00</Text>
          </Pressable>
          <Pressable style={[styles.contactBtn, { backgroundColor: "#25D366", flex: 1 }]} onPress={() => Linking.openURL("https://wa.me/22233700000")}>
            <IconSymbol name="paperplane.fill" size={18} color="#fff" />
            <Text style={styles.contactBtnText}>WhatsApp</Text>
          </Pressable>
        </View>
        <Pressable style={[styles.emailBtn, { borderColor: colors.border }]} onPress={() => Linking.openURL("mailto:suporte@royalvoyage.online")}>
          <IconSymbol name="envelope.fill" size={16} color={colors.primary} />
          <Text style={[styles.emailBtnText, { color: colors.primary }]}>suporte@royalvoyage.online</Text>
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
  ctaRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  contactBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  contactBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  emailBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginTop: 10 },
  emailBtnText: { fontSize: 14, fontWeight: "500" },
});
