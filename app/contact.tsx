import { ScrollView, Text, View, Pressable, Linking, StyleSheet, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

type Lang = "ar" | "en" | "fr";

const T: Record<Lang, {
  dir: "rtl" | "ltr";
  title: string;
  subtitle: string;
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
}> = {
  ar: {
    dir: "rtl",
    title: "تواصل معنا",
    subtitle: "نحن هنا لمساعدتك في أي استفسار أو طلب",
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
    addressVal: "طفرغ زينة، نواكشوط\nموريتانيا",
  },
  en: {
    dir: "ltr",
    title: "Contact Us",
    subtitle: "We're here to help with any inquiry or request",
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
    addressVal: "Tevragh Zeina, Nouakchott\nMauritania",
  },
  fr: {
    dir: "ltr",
    title: "Contactez-nous",
    subtitle: "Nous sommes là pour vous aider avec toute question ou demande",
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
    addressVal: "Tevragh Zeina, Nouakchott\nMauritanie",
  },
};

export default function ContactScreen() {
  const colors = useColors();
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const t = T[lang];

  const handleSend = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert(lang === "ar" ? "خطأ" : "Error", lang === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields");
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    Alert.alert(t.sent, t.sentMsg);
    setName(""); setEmail(""); setSubject(""); setMessage("");
  };

  const channels = [
    { icon: "phone.fill" as const, label: lang === "ar" ? "هاتف" : lang === "en" ? "Phone" : "Téléphone", value: "+222 33 70 00 00", action: () => Linking.openURL("tel:+22233700000") },
    { icon: "paperplane.fill" as const, label: lang === "ar" ? "واتساب" : "WhatsApp", value: "+222 33 70 00 00", action: () => Linking.openURL("https://wa.me/22233700000") },
    { icon: "paperplane.fill" as const, label: lang === "ar" ? "بريد إلكتروني" : lang === "en" ? "Email" : "Email", value: "suporte@royalvoyage.online", action: () => Linking.openURL("mailto:suporte@royalvoyage.online") },
    { icon: "paperplane.fill" as const, label: lang === "ar" ? "بريد رسمي" : lang === "en" ? "Official Email" : "Email officiel", value: "suporte@royalvoyage.online", action: () => Linking.openURL("mailto:suporte@royalvoyage.online") },
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
        <Text style={[styles.subtitle, { color: colors.muted, textAlign: t.dir === "rtl" ? "right" : "left" }]}>{t.subtitle}</Text>

        {/* Contact channels */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: t.dir === "rtl" ? "right" : "left" }]}>{t.channels}</Text>
        <View style={styles.channelsGrid}>
          {channels.map((ch, i) => (
            <Pressable key={i} style={({ pressed }) => [styles.channelCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]} onPress={ch.action}>
              <View style={[styles.channelIcon, { backgroundColor: colors.primary + "20" }]}>
                <IconSymbol name={ch.icon} size={20} color={colors.primary} />
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
          </View>
        </View>

        {/* Contact form */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: t.dir === "rtl" ? "right" : "left", marginTop: 8 }]}>
          {lang === "ar" ? "أرسل رسالة" : lang === "en" ? "Send a Message" : "Envoyer un message"}
        </Text>
        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, textAlign: t.dir === "rtl" ? "right" : "left" }]} placeholder={t.namePlaceholder} placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
          <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, textAlign: t.dir === "rtl" ? "right" : "left" }]} placeholder={t.emailPlaceholder} placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={[styles.input, { color: colors.foreground, borderColor: colors.border, textAlign: t.dir === "rtl" ? "right" : "left" }]} placeholder={t.subjectPlaceholder} placeholderTextColor={colors.muted} value={subject} onChangeText={setSubject} />
          <TextInput style={[styles.textarea, { color: colors.foreground, borderColor: colors.border, textAlign: t.dir === "rtl" ? "right" : "left" }]} placeholder={t.messagePlaceholder} placeholderTextColor={colors.muted} value={message} onChangeText={setMessage} multiline numberOfLines={5} textAlignVertical="top" />
          <Pressable style={({ pressed }) => [styles.sendBtn, { backgroundColor: colors.primary, opacity: pressed || sending ? 0.8 : 1 }]} onPress={handleSend} disabled={sending}>
            <Text style={styles.sendBtnText}>{sending ? t.sending : t.send}</Text>
          </Pressable>
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
  subtitle: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  channelsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  channelCard: { width: "47%", borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", gap: 6 },
  channelIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  channelLabel: { fontSize: 11, fontWeight: "600" },
  channelValue: { fontSize: 12, fontWeight: "500", textAlign: "center" },
  infoRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  infoCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14 },
  infoTitle: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  infoText: { fontSize: 12, lineHeight: 18 },
  form: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 120 },
  sendBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
