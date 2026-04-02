import { ScrollView, Text, View, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { StyleSheet } from "react-native";

type Lang = "ar" | "en" | "fr";

const CONTENT: Record<Lang, { dir: "rtl" | "ltr"; title: string; updated: string; sections: { heading: string; body: string }[] }> = {
  ar: {
    dir: "rtl",
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: أبريل 2026",
    sections: [
      {
        heading: "1. مقدمة",
        body: "تلتزم شركة ROYAL SERVICE L. (المشغّلة لتطبيق ومنصة Royal Voyage) بحماية خصوصية مستخدميها. تصف هذه السياسة بالتفصيل كيفية جمع المعلومات الشخصية واستخدامها ومشاركتها وحمايتها عند استخدام تطبيق Royal Voyage أو الموقع الإلكتروني royalvoyage.online.",
      },
      {
        heading: "2. هوية المتحكم في البيانات",
        body: "الاسم القانوني: ROYAL SERVICE L.\nالعلامة التجارية: Royal Voyage\nالعنوان: تفرغ زين، نواكشوط، موريتانيا\nالبريد الإلكتروني: suporte@royalvoyage.online\nالهاتف: +222 33 70 00 00",
      },
      {
        heading: "3. المعلومات التي نجمعها",
        body: "نجمع المعلومات التي تقدمها مباشرة عند إنشاء حساب أو إجراء حجز، وتشمل:\n• الاسم الكامل وتاريخ الميلاد\n• عنوان البريد الإلكتروني ورقم الهاتف\n• بيانات جواز السفر أو الوثيقة الرسمية\n• معلومات الدفع (معالجة بشكل آمن عبر Stripe)\n• بيانات الاستخدام التلقائية: نوع الجهاز، نظام التشغيل، عنوان IP",
      },
      {
        heading: "4. كيف نستخدم معلوماتك",
        body: "نستخدم معلوماتك للأغراض التالية:\n• معالجة حجوزات الطيران والفنادق والأنشطة\n• إرسال تأكيدات الحجز والتذاكر الإلكترونية\n• إرسال تذكيرات السفر قبل 24 ساعة من موعد الرحلة\n• تحسين خدماتنا وتجربة المستخدم\n• التواصل معك بشأن طلباتك واستفساراتك\n• الامتثال للمتطلبات القانونية والتنظيمية\nلن نبيع معلوماتك الشخصية لأي طرف ثالث تحت أي ظرف.",
      },
      {
        heading: "5. مشاركة المعلومات مع الأطراف الثالثة",
        body: "قد نشارك معلوماتك مع الأطراف التالية لإتمام خدماتنا:\n• شركات الطيران وشركاء الحجز (Duffel API): لإصدار تذاكر الطيران\n• مزودو الفنادق والأنشطة (Hotelbeds/HBX): لتأكيد الحجوزات\n• معالج الدفع Stripe: لمعالجة المعاملات المالية بأمان\n• خدمة البريد الإلكتروني Resend: لإرسال تأكيدات الحجز\nجميع هذه الأطراف ملزمة بسياسات خصوصية صارمة وبالحفاظ على سرية بياناتك.",
      },
      {
        heading: "6. طرق الدفع وأمان المعاملات",
        body: "نقبل الدفع عبر الوسائل التالية:\n• Stripe: بطاقات Visa وMastercard الدولية\n• Bankily: محفظة إلكترونية موريتانية\n• Masrvi: خدمة دفع إلكترونية موريتانية\n• Sedad: منصة دفع رقمية موريتانية\nجميع معاملات الدفع مشفرة بتقنية SSL/TLS. لا نحتفظ بأرقام البطاقات الكاملة على خوادمنا. بيانات بطاقات الائتمان تُعالج مباشرة عبر Stripe المعتمد من PCI DSS.",
      },
      {
        heading: "7. أذونات التطبيق",
        body: "يطلب التطبيق الأذونات التالية:\n• الميكروفون: لميزة البحث الصوتي فقط — لا يتم تخزين أي تسجيلات صوتية\n• الإشعارات: لإرسال تذكيرات السفر وتأكيدات الحجز\nيمكنك رفض أي من هذه الأذونات دون التأثير على الوظائف الأساسية للتطبيق.",
      },
      {
        heading: "8. حماية البيانات والأمان",
        body: "نطبق إجراءات أمنية متعددة لحماية بياناتك:\n• تشفير SSL/TLS لجميع الاتصالات\n• تخزين كلمات المرور بتقنية التجزئة المشفرة\n• الوصول المحدود للبيانات الحساسة\n• مراجعات أمنية دورية\n• عدم الاحتفاظ بأرقام البطاقات الكاملة",
      },
      {
        heading: "9. حقوقك",
        body: "وفقاً للقوانين المعمول بها، يحق لك:\n• الاطلاع على بياناتك الشخصية المخزنة\n• تصحيح أي بيانات غير دقيقة\n• طلب حذف بياناتك (الحق في النسيان)\n• الاعتراض على معالجة بياناتك\n• طلب نسخة من بياناتك بصيغة قابلة للنقل\nللممارسة هذه الحقوق، تواصل معنا على: suporte@royalvoyage.online",
      },
      {
        heading: "10. مدة الاحتفاظ بالبيانات",
        body: "نحتفظ ببياناتك الشخصية طالما حسابك نشط أو طالما كانت ضرورية لتقديم الخدمات. بعد إغلاق الحساب، نحتفظ ببعض البيانات لمدة 5 سنوات للامتثال للمتطلبات القانونية والمحاسبية.",
      },
      {
        heading: "11. تحديثات السياسة",
        body: "قد نحدّث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني. استمرارك في استخدام التطبيق بعد التحديث يعني موافقتك على السياسة الجديدة.",
      },
      {
        heading: "12. التواصل",
        body: "ROYAL SERVICE L. — Royal Voyage\nتفرغ زين، نواكشوط، موريتانيا\nالبريد: suporte@royalvoyage.online\nالهاتف: +222 33 70 00 00\nواتساب: +222 33 70 00 00",
      },
    ],
  },
  en: {
    dir: "ltr",
    title: "Privacy Policy",
    updated: "Last updated: April 2026",
    sections: [
      {
        heading: "1. Introduction",
        body: "ROYAL SERVICE L. (operating the Royal Voyage app and platform) is committed to protecting the privacy of its users. This policy describes in detail how personal information is collected, used, shared, and protected when using the Royal Voyage app or the website royalvoyage.online.",
      },
      {
        heading: "2. Data Controller Identity",
        body: "Legal Name: ROYAL SERVICE L.\nBrand: Royal Voyage\nAddress: Tevragh Zeina, Nouakchott, Mauritania\nEmail: suporte@royalvoyage.online\nPhone: +222 33 70 00 00",
      },
      {
        heading: "3. Information We Collect",
        body: "We collect information you provide directly when creating an account or making a booking, including:\n• Full name and date of birth\n• Email address and phone number\n• Passport or official document details\n• Payment information (processed securely via Stripe)\n• Automatic usage data: device type, operating system, IP address",
      },
      {
        heading: "4. How We Use Your Information",
        body: "We use your information for the following purposes:\n• Processing flight, hotel, and activity bookings\n• Sending booking confirmations and e-tickets\n• Sending travel reminders 24 hours before departure\n• Improving our services and user experience\n• Communicating with you about your requests and inquiries\n• Complying with legal and regulatory requirements\nWe will never sell your personal information to any third party under any circumstances.",
      },
      {
        heading: "5. Sharing Information with Third Parties",
        body: "We may share your information with the following parties to complete our services:\n• Airlines and booking partners (Duffel API): to issue flight tickets\n• Hotel and activity providers (Hotelbeds/HBX): to confirm bookings\n• Payment processor Stripe: to securely process financial transactions\n• Email service Resend: to send booking confirmations\nAll these parties are bound by strict privacy policies and are obligated to maintain the confidentiality of your data.",
      },
      {
        heading: "6. Payment Methods and Transaction Security",
        body: "We accept payment via the following methods:\n• Stripe: Visa and Mastercard international cards\n• Bankily: Mauritanian electronic wallet\n• Masrvi: Mauritanian electronic payment service\n• Sedad: Mauritanian digital payment platform\nAll payment transactions are encrypted with SSL/TLS technology. We do not retain full card numbers on our servers. Credit card data is processed directly through PCI DSS-certified Stripe.",
      },
      {
        heading: "7. App Permissions",
        body: "The app requests the following permissions:\n• Microphone: for voice search feature only — no audio recordings are stored\n• Notifications: to send travel reminders and booking confirmations\nYou may deny any of these permissions without affecting the core functions of the app.",
      },
      {
        heading: "8. Data Protection and Security",
        body: "We implement multiple security measures to protect your data:\n• SSL/TLS encryption for all communications\n• Encrypted hashing for password storage\n• Limited access to sensitive data\n• Regular security audits\n• No retention of full card numbers",
      },
      {
        heading: "9. Your Rights",
        body: "Under applicable laws, you have the right to:\n• Access your stored personal data\n• Correct any inaccurate data\n• Request deletion of your data (right to be forgotten)\n• Object to the processing of your data\n• Request a portable copy of your data\nTo exercise these rights, contact us at: suporte@royalvoyage.online",
      },
      {
        heading: "10. Data Retention Period",
        body: "We retain your personal data as long as your account is active or as long as necessary to provide services. After account closure, we retain some data for 5 years to comply with legal and accounting requirements.",
      },
      {
        heading: "11. Policy Updates",
        body: "We may update this policy from time to time. We will notify you of any material changes via the app or email. Your continued use of the app after an update constitutes your acceptance of the new policy.",
      },
      {
        heading: "12. Contact",
        body: "ROYAL SERVICE L. — Royal Voyage\nTevragh Zeina, Nouakchott, Mauritania\nEmail: suporte@royalvoyage.online\nPhone: +222 33 70 00 00\nWhatsApp: +222 33 70 00 00",
      },
    ],
  },
  fr: {
    dir: "ltr",
    title: "Politique de Confidentialité",
    updated: "Dernière mise à jour : avril 2026",
    sections: [
      {
        heading: "1. Introduction",
        body: "ROYAL SERVICE L. (exploitant l'application et la plateforme Royal Voyage) s'engage à protéger la vie privée de ses utilisateurs. Cette politique décrit en détail comment les informations personnelles sont collectées, utilisées, partagées et protégées lors de l'utilisation de l'application Royal Voyage ou du site royalvoyage.online.",
      },
      {
        heading: "2. Identité du responsable du traitement",
        body: "Raison sociale : ROYAL SERVICE L.\nMarque : Royal Voyage\nAdresse : Tevragh Zeina, Nouakchott, Mauritanie\nEmail : suporte@royalvoyage.online\nTél : +222 33 70 00 00",
      },
      {
        heading: "3. Informations que nous collectons",
        body: "Nous collectons les informations que vous fournissez directement lors de la création d'un compte ou d'une réservation, notamment :\n• Nom complet et date de naissance\n• Adresse e-mail et numéro de téléphone\n• Données du passeport ou document officiel\n• Informations de paiement (traitées en toute sécurité via Stripe)\n• Données d'utilisation automatiques : type d'appareil, système d'exploitation, adresse IP",
      },
      {
        heading: "4. Utilisation de vos informations",
        body: "Nous utilisons vos informations aux fins suivantes :\n• Traitement des réservations de vols, hôtels et activités\n• Envoi de confirmations de réservation et billets électroniques\n• Envoi de rappels de voyage 24 heures avant le départ\n• Amélioration de nos services et de l'expérience utilisateur\n• Communication avec vous concernant vos demandes\n• Conformité aux exigences légales et réglementaires\nNous ne vendrons jamais vos informations personnelles à des tiers.",
      },
      {
        heading: "5. Partage des informations avec des tiers",
        body: "Nous pouvons partager vos informations avec les parties suivantes :\n• Compagnies aériennes et partenaires de réservation (Duffel API) : pour émettre les billets\n• Prestataires d'hôtels et d'activités (Hotelbeds/HBX) : pour confirmer les réservations\n• Processeur de paiement Stripe : pour traiter les transactions financières\n• Service e-mail Resend : pour envoyer les confirmations de réservation\nToutes ces parties sont soumises à des politiques de confidentialité strictes.",
      },
      {
        heading: "6. Modes de paiement et sécurité des transactions",
        body: "Nous acceptons le paiement via les méthodes suivantes :\n• Stripe : cartes Visa et Mastercard internationales\n• Bankily : portefeuille électronique mauritanien\n• Masrvi : service de paiement électronique mauritanien\n• Sedad : plateforme de paiement numérique mauritanienne\nToutes les transactions sont chiffrées SSL/TLS. Nous ne conservons pas les numéros de carte complets. Les données de carte sont traitées directement via Stripe certifié PCI DSS.",
      },
      {
        heading: "7. Autorisations de l'application",
        body: "L'application demande les autorisations suivantes :\n• Microphone : uniquement pour la recherche vocale — aucun enregistrement n'est stocké\n• Notifications : pour envoyer des rappels de voyage et confirmations\nVous pouvez refuser ces autorisations sans affecter les fonctions principales.",
      },
      {
        heading: "8. Protection des données et sécurité",
        body: "Nous mettons en œuvre plusieurs mesures de sécurité :\n• Chiffrement SSL/TLS pour toutes les communications\n• Hachage chiffré pour le stockage des mots de passe\n• Accès limité aux données sensibles\n• Audits de sécurité réguliers\n• Aucune conservation des numéros de carte complets",
      },
      {
        heading: "9. Vos droits",
        body: "Conformément aux lois applicables, vous avez le droit de :\n• Accéder à vos données personnelles stockées\n• Corriger toute donnée inexacte\n• Demander la suppression de vos données\n• Vous opposer au traitement de vos données\n• Demander une copie portable de vos données\nPour exercer ces droits : suporte@royalvoyage.online",
      },
      {
        heading: "10. Durée de conservation des données",
        body: "Nous conservons vos données personnelles aussi longtemps que votre compte est actif. Après fermeture du compte, nous conservons certaines données pendant 5 ans pour respecter les exigences légales et comptables.",
      },
      {
        heading: "11. Mises à jour de la politique",
        body: "Nous pouvons mettre à jour cette politique. Nous vous informerons de tout changement important via l'application ou par e-mail.",
      },
      {
        heading: "12. Contact",
        body: "ROYAL SERVICE L. — Royal Voyage\nTevragh Zeina, Nouakchott, Mauritanie\nEmail : suporte@royalvoyage.online\nTél : +222 33 70 00 00\nWhatsApp : +222 33 70 00 00",
      },
    ],
  },
};

export default function PrivacyScreen() {
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
