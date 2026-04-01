import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n";

const NAVY = "#1B2B5E";
const GOLD = "#C9A84C";

type Lang = "ar" | "en" | "fr";

const CONTENT: Record<Lang, {
  dir: "rtl" | "ltr";
  title: string;
  subtitle: string;
  since: string;
  sections: { icon: string; heading: string; body: string }[];
  services: { icon: string; label: string }[];
  contactTitle: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
}> = {
  ar: {
    dir: "rtl",
    title: "عن وكالة Royal Service",
    subtitle: "شريكك المميز في السفر",
    since: "منذ 2023",
    sections: [
      {
        icon: "star",
        heading: "من نحن",
        body: "وكالة Royal Service هي وكالة سفر موريتانية متخصصة في تقديم خدمات الحجز الجوي والفندقي بأعلى معايير الجودة. تأسست عام 2023 في نواكشوط، وتسعى إلى تقديم تجربة سفر استثنائية لعملائها.",
      },
      {
        icon: "bullseye",
        heading: "رسالتنا",
        body: "نؤمن بأن السفر يجب أن يكون تجربة ممتعة وخالية من التعقيدات. لذلك نوفر منصة متكاملة تجمع بين أفضل الأسعار والخدمة الشخصية المتميزة.",
      },
      {
        icon: "trophy",
        heading: "لماذا تختارنا",
        body: "نقدم أسعاراً تنافسية مع خدمة عملاء متاحة على مدار الساعة، وتذاكر إلكترونية فورية، ودعم متعدد اللغات (العربية، الفرنسية، الإنجليزية).",
      },
    ],
    services: [
      { icon: "plane", label: "حجز الطيران" },
      { icon: "hotel", label: "حجز الفنادق" },
      { icon: "file-alt", label: "تأشيرات السفر" },
      { icon: "shield-alt", label: "تأمين السفر" },
      { icon: "map-marked-alt", label: "باقات سياحية" },
      { icon: "headset", label: "دعم 24/7" },
    ],
    contactTitle: "تواصل معنا",
    phone: "+222 33 70 00 00",
    email: "suporte@royalvoyage.online",
    whatsapp: "+222 33 70 00 00",
    address: "طارق زين، نواكشوط، موريتانيا",
  },
  en: {
    dir: "ltr",
    title: "About Royal Service",
    subtitle: "Your Premium Travel Partner",
    since: "Since 2023",
    sections: [
      {
        icon: "star",
        heading: "Who We Are",
        body: "Royal Service is a Mauritanian travel agency specializing in flight and hotel bookings with the highest quality standards. Founded in 2023 in Nouakchott, we strive to deliver an exceptional travel experience for our clients.",
      },
      {
        icon: "bullseye",
        heading: "Our Mission",
        body: "We believe travel should be an enjoyable, hassle-free experience. That's why we offer an integrated platform combining the best prices with outstanding personalized service.",
      },
      {
        icon: "trophy",
        heading: "Why Choose Us",
        body: "We offer competitive prices with 24/7 customer support, instant e-tickets, and multilingual support (Arabic, French, English).",
      },
    ],
    services: [
      { icon: "plane", label: "Flight Booking" },
      { icon: "hotel", label: "Hotel Booking" },
      { icon: "file-alt", label: "Visa Services" },
      { icon: "shield-alt", label: "Travel Insurance" },
      { icon: "map-marked-alt", label: "Tour Packages" },
      { icon: "headset", label: "24/7 Support" },
    ],
    contactTitle: "Contact Us",
    phone: "+222 33 70 00 00",
    email: "suporte@royalvoyage.online",
    whatsapp: "+222 33 70 00 00",
    address: "Tavragh Zeina, Nouakchott, Mauritania",
  },
  fr: {
    dir: "ltr",
    title: "À propos de Royal Service",
    subtitle: "Votre Partenaire de Voyage Premium",
    since: "Depuis 2023",
    sections: [
      {
        icon: "star",
        heading: "Qui Sommes-Nous",
        body: "Royal Service est une agence de voyage mauritanienne spécialisée dans les réservations de vols et d'hôtels selon les plus hauts standards de qualité. Fondée en 2023 à Nouakchott, nous nous efforçons d'offrir une expérience de voyage exceptionnelle à nos clients.",
      },
      {
        icon: "bullseye",
        heading: "Notre Mission",
        body: "Nous croyons que le voyage doit être une expérience agréable et sans complications. C'est pourquoi nous proposons une plateforme intégrée combinant les meilleurs prix avec un service personnalisé exceptionnel.",
      },
      {
        icon: "trophy",
        heading: "Pourquoi Nous Choisir",
        body: "Nous offrons des prix compétitifs avec un service client disponible 24h/24, des billets électroniques instantanés et un support multilingue (Arabe, Français, Anglais).",
      },
    ],
    services: [
      { icon: "plane", label: "Réservation de Vols" },
      { icon: "hotel", label: "Réservation d'Hôtels" },
      { icon: "file-alt", label: "Services Visa" },
      { icon: "shield-alt", label: "Assurance Voyage" },
      { icon: "map-marked-alt", label: "Forfaits Touristiques" },
      { icon: "headset", label: "Support 24/7" },
    ],
    contactTitle: "Contactez-Nous",
    phone: "+222 33 70 00 00",
    email: "suporte@royalvoyage.online",
    whatsapp: "+222 33 70 00 00",
    address: "Tavragh Zeina, Nouakchott, Mauritanie",
  },
};

export default function AboutScreen() {
  const router = useRouter();
  const colors = useColors();
  const { language } = useI18n();
  const lang = (language as Lang) in CONTENT ? (language as Lang) : "en";
  const c = CONTENT[lang];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: NAVY }]}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
          >
            <FontAwesome5 name="arrow-left" size={16} color="#fff" />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{c.title}</Text>
            <View style={styles.sinceBadge}>
              <FontAwesome5 name="calendar-alt" size={11} color={GOLD} />
              <Text style={styles.sinceText}>{c.since}</Text>
            </View>
          </View>
          {/* Gold diagonal accent */}
          <View style={styles.goldAccent} />
        </View>

        <View style={styles.content}>
          {/* Subtitle */}
          <View style={[styles.subtitleCard, { backgroundColor: colors.surface, borderColor: GOLD }]}>
            <FontAwesome5 name="globe" size={20} color={GOLD} />
            <Text style={[styles.subtitleText, { color: NAVY }]}>{c.subtitle}</Text>
          </View>

          {/* Info Sections */}
          {c.sections.map((section, i) => (
            <View key={i} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.sectionIcon, { backgroundColor: NAVY + "15" }]}>
                <FontAwesome5 name={section.icon as any} size={18} color={NAVY} />
              </View>
              <View style={styles.sectionBody}>
                <Text style={[styles.sectionHeading, { color: NAVY }]}>{section.heading}</Text>
                <Text style={[styles.sectionText, { color: colors.foreground }]}>{section.body}</Text>
              </View>
            </View>
          ))}

          {/* Services */}
          <Text style={[styles.servicesTitle, { color: NAVY }]}>
            {lang === "ar" ? "خدماتنا" : lang === "fr" ? "Nos Services" : "Our Services"}
          </Text>
          <View style={styles.servicesGrid}>
            {c.services.map((s, i) => (
              <View key={i} style={[styles.serviceItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.serviceIcon, { backgroundColor: GOLD + "20" }]}>
                  <FontAwesome5 name={s.icon as any} size={20} color={GOLD} />
                </View>
                <Text style={[styles.serviceLabel, { color: colors.foreground }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Contact */}
          <Text style={[styles.servicesTitle, { color: NAVY }]}>{c.contactTitle}</Text>
          <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => Linking.openURL("tel:+22233700000")}
            >
              <View style={[styles.contactIcon, { backgroundColor: NAVY + "15" }]}>
                <FontAwesome5 name="phone" size={16} color={NAVY} />
              </View>
              <View>
                <Text style={[styles.contactLabel, { color: colors.muted }]}>
                  {lang === "ar" ? "الهاتف" : lang === "fr" ? "Téléphone" : "Phone"}
                </Text>
                <Text style={[styles.contactValue, { color: NAVY }]}>{c.phone}</Text>
              </View>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable
              style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => Linking.openURL(`https://wa.me/22233700000`)}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#25D36620" }]}>
                <FontAwesome5 name="whatsapp" size={16} color="#25D366" />
              </View>
              <View>
                <Text style={[styles.contactLabel, { color: colors.muted }]}>WhatsApp</Text>
                <Text style={[styles.contactValue, { color: "#25D366" }]}>{c.whatsapp}</Text>
              </View>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable
              style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => Linking.openURL("mailto:suporte@royalvoyage.online")}
            >
              <View style={[styles.contactIcon, { backgroundColor: GOLD + "20" }]}>
                <FontAwesome5 name="envelope" size={16} color={GOLD} />
              </View>
              <View>
                <Text style={[styles.contactLabel, { color: colors.muted }]}>
                  {lang === "ar" ? "البريد الإلكتروني" : lang === "fr" ? "E-mail" : "Email"}
                </Text>
                <Text style={[styles.contactValue, { color: GOLD }]}>{c.email}</Text>
              </View>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.contactRow}>
              <View style={[styles.contactIcon, { backgroundColor: "#EF444420" }]}>
                <FontAwesome5 name="map-marker-alt" size={16} color="#EF4444" />
              </View>
              <View>
                <Text style={[styles.contactLabel, { color: colors.muted }]}>
                  {lang === "ar" ? "العنوان" : lang === "fr" ? "Adresse" : "Address"}
                </Text>
                <Text style={[styles.contactValue, { color: colors.foreground }]}>{c.address}</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <Text style={[styles.footer, { color: colors.muted }]}>
            © 2023–2026 Royal Service. {lang === "ar" ? "جميع الحقوق محفوظة." : lang === "fr" ? "Tous droits réservés." : "All rights reserved."}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  goldAccent: {
    position: "absolute",
    right: -30,
    top: 0,
    width: 120,
    height: 90,
    backgroundColor: GOLD,
    transform: [{ skewX: "-20deg" }],
    opacity: 0.3,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerContent: {
    gap: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  sinceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(201,168,76,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  sinceText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  subtitleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: GOLD,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  sectionCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionBody: {
    flex: 1,
    gap: 4,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  serviceItem: {
    width: "30%",
    flexGrow: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  contactCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 20,
  },
});
