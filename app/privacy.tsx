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
    updated: "آخر تحديث: مارس 2026",
    sections: [
      {
        heading: "مقدمة",
        body: "تلتزم وكالة Royal Voyage بحماية خصوصية مستخدمي تطبيقها. تصف هذه السياسة كيفية جمع المعلومات الشخصية واستخدامها وحمايتها عند استخدام تطبيق Royal Voyage.",
      },
      {
        heading: "المعلومات التي نجمعها",
        body: "نجمع المعلومات التي تقدمها مباشرة عند إنشاء حساب أو إجراء حجز، وتشمل: الاسم الكامل، عنوان البريد الإلكتروني، رقم الهاتف، بيانات جواز السفر، ومعلومات الدفع. كما نجمع بيانات الاستخدام تلقائياً مثل نوع الجهاز ونظام التشغيل.",
      },
      {
        heading: "كيف نستخدم معلوماتك",
        body: "نستخدم معلوماتك لمعالجة حجوزات الطيران والفنادق، وإرسال تأكيدات الحجز وتذاكر السفر، وتحسين خدماتنا، والتواصل معك بشأن طلباتك. لن نبيع معلوماتك الشخصية لأي طرف ثالث.",
      },
      {
        heading: "مشاركة المعلومات",
        body: "قد نشارك معلوماتك مع شركات الطيران والفنادق لإتمام حجوزاتك، ومع مزودي خدمات الدفع لمعالجة المعاملات المالية. جميع هذه الأطراف ملزمة بالحفاظ على سرية بياناتك.",
      },
      {
        heading: "أذونات التطبيق",
        body: "يطلب التطبيق إذن الوصول إلى الميكروفون لميزة البحث الصوتي فقط، ولا يتم تخزين أي تسجيلات صوتية على خوادمنا. يمكنك رفض هذا الإذن دون التأثير على بقية وظائف التطبيق.",
      },
      {
        heading: "حماية البيانات",
        body: "نستخدم تقنيات تشفير SSL/TLS لحماية بياناتك أثناء النقل. يتم تخزين بيانات الدفع بشكل مشفر ولا يتم الاحتفاظ بأرقام البطاقات الكاملة على خوادمنا.",
      },
      {
        heading: "حقوقك",
        body: "يحق لك طلب الاطلاع على بياناتك الشخصية أو تعديلها أو حذفها في أي وقت. للتواصل معنا بشأن أي استفسار يتعلق بخصوصيتك، يرجى الاتصال على: +222 33 70 00 00",
      },
      {
        heading: "تحديثات السياسة",
        body: "قد نحدّث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني. استمرارك في استخدام التطبيق بعد التحديث يعني موافقتك على السياسة الجديدة.",
      },
      {
        heading: "التواصل",
        body: "Royal Voyage — تفرغ زينة، نواكشوط، موريتانيا\nهاتف: +222 33 70 00 00",
      },
    ],
  },
  en: {
    dir: "ltr",
    title: "Privacy Policy",
    updated: "Last updated: March 2026",
    sections: [
      {
        heading: "Introduction",
        body: "Royal Voyage is committed to protecting the privacy of its app users. This policy describes how we collect, use, and protect personal information when you use the Royal Voyage app.",
      },
      {
        heading: "Information We Collect",
        body: "We collect information you provide directly when creating an account or making a booking, including: full name, email address, phone number, passport details, and payment information. We also automatically collect usage data such as device type and operating system.",
      },
      {
        heading: "How We Use Your Information",
        body: "We use your information to process flight and hotel bookings, send booking confirmations and travel tickets, improve our services, and communicate with you about your requests. We will never sell your personal information to any third party.",
      },
      {
        heading: "Information Sharing",
        body: "We may share your information with airlines and hotels to complete your bookings, and with payment service providers to process financial transactions. All these parties are bound to maintain the confidentiality of your data.",
      },
      {
        heading: "App Permissions",
        body: "The app requests microphone access only for the voice search feature. No audio recordings are stored on our servers. You may deny this permission without affecting other app functions.",
      },
      {
        heading: "Data Protection",
        body: "We use SSL/TLS encryption to protect your data in transit. Payment data is stored in encrypted form and full card numbers are never retained on our servers.",
      },
      {
        heading: "Your Rights",
        body: "You have the right to request access to, modification of, or deletion of your personal data at any time. To contact us regarding any privacy inquiry, please call: +222 33 70 00 00",
      },
      {
        heading: "Policy Updates",
        body: "We may update this policy from time to time. We will notify you of any material changes via the app or email. Your continued use of the app after an update constitutes your acceptance of the new policy.",
      },
      {
        heading: "Contact",
        body: "Royal Voyage — Tevragh Zeina, Nouakchott, Mauritania\nPhone: +222 33 70 00 00",
      },
    ],
  },
  fr: {
    dir: "ltr",
    title: "Politique de Confidentialité",
    updated: "Dernière mise à jour : mars 2026",
    sections: [
      {
        heading: "Introduction",
        body: "Royal Voyage s'engage à protéger la vie privée des utilisateurs de son application. Cette politique décrit comment nous collectons, utilisons et protégeons les informations personnelles lors de l'utilisation de l'application Royal Voyage.",
      },
      {
        heading: "Informations que nous collectons",
        body: "Nous collectons les informations que vous fournissez directement lors de la création d'un compte ou d'une réservation, notamment : nom complet, adresse e-mail, numéro de téléphone, données du passeport et informations de paiement. Nous collectons également automatiquement des données d'utilisation telles que le type d'appareil et le système d'exploitation.",
      },
      {
        heading: "Utilisation de vos informations",
        body: "Nous utilisons vos informations pour traiter les réservations de vols et d'hôtels, envoyer des confirmations de réservation et des billets de voyage, améliorer nos services et communiquer avec vous concernant vos demandes. Nous ne vendrons jamais vos informations personnelles à des tiers.",
      },
      {
        heading: "Partage des informations",
        body: "Nous pouvons partager vos informations avec les compagnies aériennes et les hôtels pour finaliser vos réservations, et avec les prestataires de services de paiement pour traiter les transactions financières. Toutes ces parties sont tenues de maintenir la confidentialité de vos données.",
      },
      {
        heading: "Autorisations de l'application",
        body: "L'application demande l'accès au microphone uniquement pour la fonctionnalité de recherche vocale. Aucun enregistrement audio n'est stocké sur nos serveurs. Vous pouvez refuser cette autorisation sans affecter les autres fonctions de l'application.",
      },
      {
        heading: "Protection des données",
        body: "Nous utilisons le chiffrement SSL/TLS pour protéger vos données en transit. Les données de paiement sont stockées sous forme chiffrée et les numéros de carte complets ne sont jamais conservés sur nos serveurs.",
      },
      {
        heading: "Vos droits",
        body: "Vous avez le droit de demander l'accès, la modification ou la suppression de vos données personnelles à tout moment. Pour nous contacter concernant toute question de confidentialité, veuillez appeler : +222 33 70 00 00",
      },
      {
        heading: "Mises à jour de la politique",
        body: "Nous pouvons mettre à jour cette politique de temps à autre. Nous vous informerons de tout changement important via l'application ou par e-mail. Votre utilisation continue de l'application après une mise à jour constitue votre acceptation de la nouvelle politique.",
      },
      {
        heading: "Contact",
        body: "Royal Voyage — Tevragh Zeina, Nouakchott, Mauritanie\nTél : +222 33 70 00 00",
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
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{content.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Language switcher */}
      <View style={[styles.langRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(["ar", "en", "fr"] as Lang[]).map((l) => (
          <Pressable
            key={l}
            style={[
              styles.langBtn,
              lang === l && { backgroundColor: colors.primary },
            ]}
            onPress={() => setLang(l)}
          >
            <Text style={[styles.langText, { color: lang === l ? "#fff" : colors.muted }]}>
              {l === "ar" ? "العربية" : l === "en" ? "English" : "Français"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { direction: content.dir === "rtl" ? "rtl" : "ltr" } as any]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updated, { color: colors.muted, textAlign: content.dir === "rtl" ? "right" : "left" }]}>
          {content.updated}
        </Text>

        {content.sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionHeading, { color: colors.primary, textAlign: content.dir === "rtl" ? "right" : "left" }]}>
              {section.heading}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.foreground, textAlign: content.dir === "rtl" ? "right" : "left" }]}>
              {section.body}
            </Text>
          </View>
        ))}

        {/* Contact button */}
        <Pressable
          style={[styles.contactBtn, { backgroundColor: colors.primary }]}
          onPress={() => Linking.openURL("tel:+22233700000")}
        >
          <IconSymbol name="phone.fill" size={18} color="#fff" />
          <Text style={styles.contactBtnText}>+222 33 70 00 00</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  langRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 0.5,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  langText: {
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
  },
  updated: {
    fontSize: 12,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  contactBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
