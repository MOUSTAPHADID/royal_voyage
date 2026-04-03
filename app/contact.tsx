import { ScrollView, Text, View, Pressable, Linking, StyleSheet, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";

type Lang = "ar" | "en" | "fr";

const T: Record<Lang, {
  dir: "rtl" | "ltr";
  title: string;
  subtitle: string;
  legalName: string;
  legalLabel: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  subjectPlaceholder: string;
  messagePlaceholder: string;
  send: string;
  sending: string;
  sent: string;
  sentMsg: string;
  channels: string;
  hours: string;
  hoursVal: string;
  address: string;
  addressVal: string;
  country: string;
  formTitle: string;
  faqTitle: string;
  faqs: { q: string; a: string }[];
}> = {
  ar: {
    dir: "rtl",
    title: "تواصل معنا",
    subtitle: "نحن هنا لمساعدتك في أي استفسار أو طلب",
    legalName: "ROYAL SERVICE LIMITED",
    legalLabel: "الاسم القانوني للشركة",
    namePlaceholder: "الاسم الكامل",
    emailPlaceholder: "البريد الإلكتروني",
    subjectPlaceholder: "موضوع الرسالة",
    messagePlaceholder: "اكتب رسالتك هنا...",
    send: "إرسال الرسالة",
    sending: "جاري الإرسال...",
    sent: "تم الإرسال!",
    sentMsg: "تم استلام رسالتك. سنتواصل معك خلال 24 ساعة.",
    channels: "قنوات التواصل",
    hours: "ساعات العمل",
    hoursVal: "السبت – الخميس: 8:00 ص – 8:00 م\nالجمعة: 2:00 م – 8:00 م",
    address: "العنوان",
    addressVal: "تفرغ زين، نواكشوط",
    country: "موريتانيا",
    formTitle: "أرسل رسالة مباشرة",
    faqTitle: "أسئلة شائعة",
    faqs: [
      { q: "كيف أحجز تذكرة طيران؟", a: "ابحث عن رحلتك من الصفحة الرئيسية، اختر العرض المناسب، أدخل بيانات المسافرين، وأتمم الدفع. ستصلك التذكرة فوراً على بريدك الإلكتروني." },
      { q: "كيف أتواصل معكم بعد الحجز؟", a: "يمكنك التواصل معنا عبر الهاتف أو واتساب على +222 33 70 00 00، أو عبر البريد الإلكتروني suporte@royalvoyage.online مع ذكر رقم حجزك." },
      { q: "هل يمكنني إلغاء حجزي؟", a: "نعم، يمكن الإلغاء وفق سياسة الاسترداد الخاصة بنا. للإلغاء خلال 24 ساعة من الحجز وقبل 7 أيام من السفر، ستحصل على استرداد كامل مطروحاً منه 2% رسوم معالجة." },
      { q: "ما طرق الدفع المقبولة؟", a: "نقبل: Stripe (Visa/Mastercard)، Bankily، Masrvi، وSedad. جميع المعاملات مشفرة وآمنة." },
      { q: "هل أنتم وكالة سفر معتمدة؟", a: "نعم، Royal Voyage هي علامة تجارية لشركة ROYAL SERVICE LIMITED المرخصة في موريتانيا، ونعمل كوسيط معتمد مع شركات الطيران والفنادق عبر شريكنا التقني Duffel." },
    ],
  },
  en: {
    dir: "ltr",
    title: "Contact Us",
    subtitle: "We're here to help with any inquiry or request",
    legalName: "ROYAL SERVICE LIMITED",
    legalLabel: "Legal Company Name",
    namePlaceholder: "Full Name",
    emailPlaceholder: "Email Address",
    subjectPlaceholder: "Subject",
    messagePlaceholder: "Write your message here...",
    send: "Send Message",
    sending: "Sending...",
    sent: "Sent!",
    sentMsg: "Your message has been received. We'll get back to you within 24 hours.",
    channels: "Contact Channels",
    hours: "Working Hours",
    hoursVal: "Saturday – Thursday: 8:00 AM – 8:00 PM\nFriday: 2:00 PM – 8:00 PM",
    address: "Address",
    addressVal: "Tevragh Zeina, Nouakchott",
    country: "Mauritania",
    formTitle: "Send a Direct Message",
    faqTitle: "Frequently Asked Questions",
    faqs: [
      { q: "How do I book a flight ticket?", a: "Search for your flight from the home screen, select the right offer, enter traveler details, and complete payment. Your ticket will be sent instantly to your email." },
      { q: "How do I contact you after booking?", a: "You can reach us by phone or WhatsApp at +222 33 70 00 00, or by email at suporte@royalvoyage.online with your booking number." },
      { q: "Can I cancel my booking?", a: "Yes, cancellations are possible according to our refund policy. For cancellations within 24 hours of booking and at least 7 days before travel, you'll receive a full refund minus a 2% processing fee." },
      { q: "What payment methods are accepted?", a: "We accept: Stripe (Visa/Mastercard), Bankily, Masrvi, and Sedad. All transactions are encrypted and secure." },
      { q: "Are you a certified travel agency?", a: "Yes, Royal Voyage is a brand of ROYAL SERVICE LIMITED, licensed in Mauritania. We operate as a certified intermediary with airlines and hotels through our technology partner Duffel." },
    ],
  },
  fr: {
    dir: "ltr",
    title: "Contactez-nous",
    subtitle: "Nous sommes là pour vous aider avec toute question ou demande",
    legalName: "ROYAL SERVICE LIMITED",
    legalLabel: "Raison sociale",
    namePlaceholder: "Nom complet",
    emailPlaceholder: "Adresse e-mail",
    subjectPlaceholder: "Sujet",
    messagePlaceholder: "Écrivez votre message ici...",
    send: "Envoyer le message",
    sending: "Envoi en cours...",
    sent: "Envoyé !",
    sentMsg: "Votre message a été reçu. Nous vous répondrons dans les 24 heures.",
    channels: "Canaux de contact",
    hours: "Heures d'ouverture",
    hoursVal: "Samedi – Jeudi : 8h00 – 20h00\nVendredi : 14h00 – 20h00",
    address: "Adresse",
    addressVal: "Tevragh Zeina, Nouakchott",
    country: "Mauritanie",
    formTitle: "Envoyer un message direct",
    faqTitle: "Questions fréquentes",
    faqs: [
      { q: "Comment réserver un billet d'avion ?", a: "Recherchez votre vol depuis l'écran d'accueil, sélectionnez l'offre appropriée, saisissez les informations des voyageurs et finalisez le paiement. Votre billet vous sera envoyé instantanément par e-mail." },
      { q: "Comment vous contacter après la réservation ?", a: "Vous pouvez nous joindre par téléphone ou WhatsApp au +222 33 70 00 00, ou par e-mail à suporte@royalvoyage.online avec votre numéro de réservation." },
      { q: "Puis-je annuler ma réservation ?", a: "Oui, les annulations sont possibles selon notre politique de remboursement. Pour les annulations dans les 24h de la réservation et au moins 7 jours avant le voyage, vous recevrez un remboursement intégral moins 2% de frais." },
      { q: "Quels modes de paiement sont acceptés ?", a: "Nous acceptons : Stripe (Visa/Mastercard), Bankily, Masrvi et Sedad. Toutes les transactions sont chiffrées et sécurisées." },
      { q: "Êtes-vous une agence de voyage certifiée ?", a: "Oui, Royal Voyage est une marque de ROYAL SERVICE LIMITED, agréée en Mauritanie. Nous opérons en tant qu'intermédiaire certifié avec les compagnies aériennes et hôtels via notre partenaire technologique Duffel." },
    ],
  },
};

export default function ContactScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language } = useI18n();
  const [lang, setLang] = useState<Lang>(() => {
    if (language === "ar" || language === "en" || language === "fr") return language as Lang;
    return "ar";
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const t = T[lang];
  const isRTL = lang === "ar";

  const handleSend = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert(
        lang === "ar" ? "حقول مطلوبة" : lang === "fr" ? "Champs requis" : "Required Fields",
        lang === "ar" ? "يرجى ملء الاسم والبريد الإلكتروني والرسالة" : lang === "fr" ? "Veuillez remplir le nom, l'e-mail et le message" : "Please fill in name, email and message"
      );
      return;
    }
    setSending(true);
    // Open email client with pre-filled message as fallback
    const mailtoUrl = `mailto:suporte@royalvoyage.online?subject=${encodeURIComponent(subject || "Contact from Royal Voyage App")}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
    await Linking.openURL(mailtoUrl).catch(() => {});
    setSending(false);
    Alert.alert(t.sent, t.sentMsg);
    setName(""); setEmail(""); setSubject(""); setMessage("");
  };

  const channels = [
    {
      icon: "phone.fill" as const,
      label: lang === "ar" ? "هاتف" : lang === "en" ? "Phone" : "Téléphone",
      value: "+222 33 70 00 00",
      color: "#1B2B5E",
      action: () => Linking.openURL("tel:+22233700000"),
    },
    {
      icon: "paperplane.fill" as const,
      label: "WhatsApp",
      value: "+222 33 70 00 00",
      color: "#25D366",
      action: () => Linking.openURL("https://wa.me/22233700000"),
    },
    {
      icon: "envelope.fill" as const,
      label: lang === "ar" ? "بريد إلكتروني" : lang === "en" ? "Email" : "Email",
      value: "suporte@royalvoyage.online",
      color: "#C9A84C",
      action: () => Linking.openURL("mailto:suporte@royalvoyage.online"),
    },
    {
      icon: "map.fill" as const,
      label: lang === "ar" ? "الموقع الإلكتروني" : lang === "en" ? "Website" : "Site web",
      value: "royalvoyage.online",
      color: "#0EA5E9",
      action: () => Linking.openURL("https://royalvoyage.online"),
    },
  ];

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{t.title}</Text>
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
        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.muted, textAlign: isRTL ? "right" : "left" }]}>{t.subtitle}</Text>

        {/* Legal name badge */}
        <View style={[styles.legalBadge, { backgroundColor: "#1B2B5E10", borderColor: "#1B2B5E30" }]}>
          <IconSymbol name="building.2.fill" size={16} color="#1B2B5E" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.legalLabel, { color: colors.muted }]}>{t.legalLabel}</Text>
            <Text style={[styles.legalName, { color: "#1B2B5E" }]}>{t.legalName}</Text>
          </View>
        </View>

        {/* Contact channels */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>{t.channels}</Text>
        <View style={styles.channelsGrid}>
          {channels.map((ch, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.channelCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
              onPress={ch.action}
            >
              <View style={[styles.channelIcon, { backgroundColor: ch.color + "20" }]}>
                <IconSymbol name={ch.icon} size={20} color={ch.color} />
              </View>
              <Text style={[styles.channelLabel, { color: colors.muted }]}>{ch.label}</Text>
              <Text style={[styles.channelValue, { color: colors.foreground }]} numberOfLines={1}>{ch.value}</Text>
            </Pressable>
          ))}
        </View>

        {/* Hours & Address */}
        <View style={styles.infoRow}>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>{t.hours}</Text>
            <Text style={[styles.infoText, { color: colors.foreground }]}>{t.hoursVal}</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>{t.address}</Text>
            <Text style={[styles.infoText, { color: colors.foreground }]}>{t.addressVal}</Text>
            <Text style={[styles.infoText, { color: colors.muted, marginTop: 2 }]}>{t.country}</Text>
          </View>
        </View>

        {/* FAQ */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>{t.faqTitle}</Text>
        <View style={[styles.faqContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {t.faqs.map((faq, i) => (
            <View key={i}>
              <Pressable
                style={({ pressed }) => [styles.faqRow, { opacity: pressed ? 0.8 : 1, flexDirection: isRTL ? "row-reverse" : "row" }]}
                onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
              >
                <Text style={[styles.faqQ, { color: colors.foreground, flex: 1, textAlign: isRTL ? "right" : "left" }]}>{faq.q}</Text>
                <IconSymbol name={expandedFaq === i ? "chevron.up" : "chevron.down"} size={16} color={colors.muted} />
              </Pressable>
              {expandedFaq === i && (
                <Text style={[styles.faqA, { color: colors.muted, textAlign: isRTL ? "right" : "left" }]}>{faq.a}</Text>
              )}
              {i < t.faqs.length - 1 && <View style={[styles.faqDivider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        {/* Contact form */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left", marginTop: 8 }]}>{t.formTitle}</Text>
        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, textAlign: isRTL ? "right" : "left" }]}
            placeholder={t.namePlaceholder}
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, textAlign: isRTL ? "right" : "left" }]}
            placeholder={t.emailPlaceholder}
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, textAlign: isRTL ? "right" : "left" }]}
            placeholder={t.subjectPlaceholder}
            placeholderTextColor={colors.muted}
            value={subject}
            onChangeText={setSubject}
          />
          <TextInput
            style={[styles.textarea, { color: colors.foreground, borderColor: colors.border, textAlign: isRTL ? "right" : "left" }]}
            placeholder={t.messagePlaceholder}
            placeholderTextColor={colors.muted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Pressable
            style={({ pressed }) => [styles.sendBtn, { backgroundColor: colors.primary, opacity: pressed || sending ? 0.8 : 1 }]}
            onPress={handleSend}
            disabled={sending}
          >
            <IconSymbol name="paperplane.fill" size={16} color="#fff" />
            <Text style={styles.sendBtnText}>{sending ? t.sending : t.send}</Text>
          </Pressable>
          <Text style={[styles.formNote, { color: colors.muted, textAlign: isRTL ? "right" : "left" }]}>
            {lang === "ar"
              ? "سيفتح تطبيق البريد الإلكتروني تلقائياً لإرسال رسالتك إلى suporte@royalvoyage.online"
              : lang === "fr"
              ? "L'application e-mail s'ouvrira automatiquement pour envoyer votre message à suporte@royalvoyage.online"
              : "Your email app will open automatically to send your message to suporte@royalvoyage.online"}
          </Text>
        </View>

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
  scrollContent: { padding: 16 },
  subtitle: { fontSize: 14, marginBottom: 14, lineHeight: 20 },
  legalBadge: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  legalLabel: { fontSize: 11, marginBottom: 2 },
  legalName: { fontSize: 14, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  channelsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  channelCard: { width: "47%", flexGrow: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", gap: 6 },
  channelIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  channelLabel: { fontSize: 11, fontWeight: "600" },
  channelValue: { fontSize: 11, fontWeight: "500", textAlign: "center" },
  infoRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  infoCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14 },
  infoTitle: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  infoText: { fontSize: 12, lineHeight: 18 },
  faqContainer: { borderRadius: 12, borderWidth: 1, marginBottom: 20, overflow: "hidden" },
  faqRow: { alignItems: "center", padding: 14, gap: 8 },
  faqQ: { fontSize: 13, fontWeight: "600", lineHeight: 20 },
  faqA: { fontSize: 13, lineHeight: 20, paddingHorizontal: 14, paddingBottom: 14 },
  faqDivider: { height: 1, marginHorizontal: 14 },
  form: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 120 },
  sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  formNote: { fontSize: 11, lineHeight: 16 },
});
