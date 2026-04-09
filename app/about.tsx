import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
  Image,
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
  legalName: string;
  legalLabel: string;
  sections: { icon: string; heading: string; body: string }[];
  howWeWork: { heading: string; steps: string[] };
  paymentTitle: string;
  paymentMethods: string;
  services: { icon: string; label: string }[];
  contactTitle: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  country: string;
  disclaimer: string;
}> = {
  ar: {
    dir: "rtl",
    title: "عن وكالة Royal Voyage",
    subtitle: "شريكك المميز في السفر منذ 2023",
    since: "منذ 2023",
    legalName: "ROYAL SERVICE LIMITED",
    legalLabel: "الاسم القانوني للشركة",
    sections: [
      {
        icon: "star",
        heading: "من نحن",
        body: "Royal Voyage هي وكالة سفر موريتانية متخصصة في تقديم خدمات الحجز الجوي والفندقي وحجز الأنشطة السياحية بأعلى معايير الجودة. تأسست عام 2023 في نواكشوط تحت الاسم القانوني ROYAL SERVICE LIMITED، وتسعى إلى تقديم تجربة سفر استثنائية لعملائها في موريتانيا وخارجها.",
      },
      {
        icon: "bullseye",
        heading: "رسالتنا",
        body: "نؤمن بأن السفر يجب أن يكون تجربة ممتعة وخالية من التعقيدات. لذلك نوفر منصة متكاملة تجمع بين أفضل الأسعار والخدمة الشخصية المتميزة، مع دعم متعدد اللغات يشمل العربية والفرنسية والإنجليزية والبرتغالية.",
      },
      {
        icon: "trophy",
        heading: "لماذا تختارنا",
        body: "نقدم أسعاراً تنافسية مع خدمة عملاء متاحة 6 أيام في الأسبوع، وتذاكر إلكترونية فورية تُرسل مباشرة إلى بريدك الإلكتروني، ودعم متعدد اللغات، وإمكانية الدفع بوسائل محلية ودولية متعددة.",
      },
      {
        icon: "handshake",
        heading: "دورنا كوسيط",
        body: "تعمل Royal Voyage بوصفها وسيطاً بين المسافرين وشركات الطيران والفنادق ومزودي الأنشطة. نحن لسنا الناقل الجوي ولا مزود الإقامة مباشرةً، بل نتولى إجراء الحجوزات نيابةً عنك عبر شركائنا المعتمدين كـ Duffel وHotelbeds، مع ضمان أفضل الأسعار وأعلى مستوى من الخدمة.",
      },
    ],
    howWeWork: {
      heading: "كيف يعمل الحجز؟",
      steps: [
        "ابحث عن رحلتك أو فندقك أو نشاطك من خلال التطبيق",
        "اختر العرض المناسب وأدخل بيانات المسافرين",
        "أتمم الدفع بإحدى الطرق المتاحة (Stripe / Bankily / Masrvi / Sedad)",
        "تصلك تذكرتك أو تأكيد حجزك فوراً على بريدك الإلكتروني",
        "فريقنا متاح لمساعدتك قبل السفر وأثناءه وبعده",
      ],
    },
    paymentTitle: "طرق الدفع المقبولة",
    paymentMethods: "نقبل الدفع عبر: Stripe (بطاقات Visa/Mastercard)، Bankily، Masrvi، وSedad. جميع المعاملات مشفرة وآمنة.",
    services: [
      { icon: "plane", label: "حجز الطيران" },
      { icon: "hotel", label: "حجز الفنادق" },
      { icon: "map-marked-alt", label: "الأنشطة السياحية" },
      { icon: "file-alt", label: "استشارات التأشيرة" },
      { icon: "shield-alt", label: "تأمين السفر" },
      { icon: "headset", label: "دعم متعدد اللغات" },
    ],
    contactTitle: "تواصل معنا",
    phone: "+222 33 70 00 00",
    email: "suporte@royalvoyage.online",
    whatsapp: "+222 33 70 00 00",
    address: "تفرغ زين، نواكشوط",
    country: "موريتانيا",
    disclaimer: "© 2023–2026 ROYAL SERVICE LIMITED جميع الحقوق محفوظة. Royal Voyage وكالة سفر مرخصة في موريتانيا.",
  },
  en: {
    dir: "ltr",
    title: "About Royal Voyage",
    subtitle: "Your Premium Travel Partner Since 2023",
    since: "Since 2023",
    legalName: "ROYAL SERVICE LIMITED",
    legalLabel: "Legal Company Name",
    sections: [
      {
        icon: "star",
        heading: "Who We Are",
        body: "Royal Voyage is a Mauritanian travel agency specializing in flight, hotel, and activity bookings with the highest quality standards. Founded in 2023 in Nouakchott under the legal name ROYAL SERVICE LIMITED, we strive to deliver an exceptional travel experience for clients in Mauritania and beyond.",
      },
      {
        icon: "bullseye",
        heading: "Our Mission",
        body: "We believe travel should be an enjoyable, hassle-free experience. That's why we offer an integrated platform combining the best prices with outstanding personalized service, with multilingual support in Arabic, French, English, and Portuguese.",
      },
      {
        icon: "trophy",
        heading: "Why Choose Us",
        body: "We offer competitive prices with customer support available 6 days a week, instant e-tickets sent directly to your email, multilingual support, and the ability to pay with multiple local and international payment methods.",
      },
      {
        icon: "handshake",
        heading: "Our Role as Intermediary",
        body: "Royal Voyage acts as an intermediary between travelers and airlines, hotels, and activity providers. We are not the direct air carrier or accommodation provider, but we handle bookings on your behalf through our certified partners such as Duffel and Hotelbeds, ensuring the best prices and highest level of service.",
      },
    ],
    howWeWork: {
      heading: "How Does Booking Work?",
      steps: [
        "Search for your flight, hotel, or activity through the app",
        "Select the right offer and enter traveler details",
        "Complete payment using one of the available methods (Stripe / Bankily / Masrvi / Sedad)",
        "Receive your ticket or booking confirmation instantly by email",
        "Our team is available to assist you before, during, and after your trip",
      ],
    },
    paymentTitle: "Accepted Payment Methods",
    paymentMethods: "We accept payment via: Stripe (Visa/Mastercard cards), Bankily, Masrvi, and Sedad. All transactions are encrypted and secure.",
    services: [
      { icon: "plane", label: "Flight Booking" },
      { icon: "hotel", label: "Hotel Booking" },
      { icon: "map-marked-alt", label: "Tourist Activities" },
      { icon: "file-alt", label: "Visa Consultation" },
      { icon: "shield-alt", label: "Travel Insurance" },
      { icon: "headset", label: "Multilingual Support" },
    ],
    contactTitle: "Contact Us",
    phone: "+222 33 70 00 00",
    email: "suporte@royalvoyage.online",
    whatsapp: "+222 33 70 00 00",
    address: "Tevragh Zeina, Nouakchott",
    country: "Mauritania",
    disclaimer: "© 2023–2026 ROYAL SERVICE LIMITED All rights reserved. Royal Voyage is a licensed travel agency in Mauritania.",
  },
  fr: {
    dir: "ltr",
    title: "À propos de Royal Voyage",
    subtitle: "Votre Partenaire de Voyage Premium depuis 2023",
    since: "Depuis 2023",
    legalName: "ROYAL SERVICE LIMITED",
    legalLabel: "Raison sociale",
    sections: [
      {
        icon: "star",
        heading: "Qui Sommes-Nous",
        body: "Royal Voyage est une agence de voyage mauritanienne spécialisée dans les réservations de vols, d'hôtels et d'activités touristiques selon les plus hauts standards de qualité. Fondée en 2023 à Nouakchott sous la raison sociale ROYAL SERVICE LIMITED, nous nous efforçons d'offrir une expérience de voyage exceptionnelle à nos clients en Mauritanie et au-delà.",
      },
      {
        icon: "bullseye",
        heading: "Notre Mission",
        body: "Nous croyons que le voyage doit être une expérience agréable et sans complications. C'est pourquoi nous proposons une plateforme intégrée combinant les meilleurs prix avec un service personnalisé exceptionnel, avec un support multilingue en arabe, français, anglais et portugais.",
      },
      {
        icon: "trophy",
        heading: "Pourquoi Nous Choisir",
        body: "Nous offrons des prix compétitifs avec un service client disponible 6 jours par semaine, des billets électroniques instantanés envoyés directement à votre e-mail, un support multilingue et la possibilité de payer avec plusieurs méthodes de paiement locales et internationales.",
      },
      {
        icon: "handshake",
        heading: "Notre Rôle d'Intermédiaire",
        body: "Royal Voyage agit en tant qu'intermédiaire entre les voyageurs et les compagnies aériennes, hôtels et prestataires d'activités. Nous ne sommes pas le transporteur aérien ni le prestataire d'hébergement direct, mais nous gérons les réservations en votre nom via nos partenaires certifiés tels que Duffel et Hotelbeds.",
      },
    ],
    howWeWork: {
      heading: "Comment Fonctionne la Réservation ?",
      steps: [
        "Recherchez votre vol, hôtel ou activité via l'application",
        "Sélectionnez l'offre appropriée et saisissez les informations des voyageurs",
        "Finalisez le paiement avec l'une des méthodes disponibles (Stripe / Bankily / Masrvi / Sedad)",
        "Recevez votre billet ou confirmation de réservation instantanément par e-mail",
        "Notre équipe est disponible pour vous aider avant, pendant et après votre voyage",
      ],
    },
    paymentTitle: "Modes de Paiement Acceptés",
    paymentMethods: "Nous acceptons le paiement via : Stripe (cartes Visa/Mastercard), Bankily, Masrvi et Sedad. Toutes les transactions sont chiffrées et sécurisées.",
    services: [
      { icon: "plane", label: "Réservation de Vols" },
      { icon: "hotel", label: "Réservation d'Hôtels" },
      { icon: "map-marked-alt", label: "Activités Touristiques" },
      { icon: "file-alt", label: "Conseil Visa" },
      { icon: "shield-alt", label: "Assurance Voyage" },
      { icon: "headset", label: "Support Multilingue" },
    ],
    contactTitle: "Contactez-Nous",
    phone: "+222 33 70 00 00",
    email: "suporte@royalvoyage.online",
    whatsapp: "+222 33 70 00 00",
    address: "Tevragh Zeina, Nouakchott",
    country: "Mauritanie",
    disclaimer: "© 2023–2026 ROYAL SERVICE LIMITED Tous droits réservés. Royal Voyage est une agence de voyage agréée en Mauritanie.",
  },
};

export default function AboutScreen() {
  const router = useRouter();
  const colors = useColors();
  const { language } = useI18n();
  const lang = (language as Lang) in CONTENT ? (language as Lang) : "en";
  const c = CONTENT[lang];
  const isRTL = lang === "ar";

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
          <View style={styles.goldAccent} />
        </View>

        <View style={styles.content}>
          {/* Subtitle */}
          <View style={[styles.subtitleCard, { backgroundColor: colors.surface, borderColor: GOLD }]}>
            <FontAwesome5 name="globe" size={20} color={GOLD} />
            <Text style={[styles.subtitleText, { color: NAVY }]}>{c.subtitle}</Text>
          </View>

          {/* Legal name badge */}
          <View style={[styles.legalBadge, { backgroundColor: NAVY + "10", borderColor: NAVY + "30" }]}>
            <FontAwesome5 name="building" size={14} color={NAVY} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.legalLabel, { color: colors.muted }]}>{c.legalLabel}</Text>
              <Text style={[styles.legalName, { color: NAVY }]}>{c.legalName}</Text>
            </View>
            <View style={[styles.countryBadge, { backgroundColor: GOLD + "20" }]}>
              <Text style={[styles.countryText, { color: GOLD }]}>{c.country}</Text>
            </View>
          </View>

          {/* Info Sections */}
          {c.sections.map((section, i) => (
            <View key={i} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.sectionIcon, { backgroundColor: NAVY + "15" }]}>
                <FontAwesome5 name={section.icon as any} size={18} color={NAVY} />
              </View>
              <View style={[styles.sectionBody, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
                <Text style={[styles.sectionHeading, { color: NAVY, textAlign: isRTL ? "right" : "left" }]}>{section.heading}</Text>
                <Text style={[styles.sectionText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>{section.body}</Text>
              </View>
            </View>
          ))}

          {/* How We Work */}
          <View style={[styles.howCard, { backgroundColor: NAVY, borderColor: NAVY }]}>
            <Text style={styles.howTitle}>{c.howWeWork.heading}</Text>
            {c.howWeWork.steps.map((step, i) => (
              <View key={i} style={[styles.howStep, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { textAlign: isRTL ? "right" : "left" }]}>{step}</Text>
              </View>
            ))}
          </View>

          {/* Payment Methods */}
          <View style={[styles.paymentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.paymentHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <FontAwesome5 name="credit-card" size={16} color={GOLD} />
              <Text style={[styles.paymentTitle, { color: NAVY, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>{c.paymentTitle}</Text>
            </View>
            <Text style={[styles.paymentText, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>{c.paymentMethods}</Text>
            <View style={styles.paymentLogos}>
              {["Stripe", "Bankily", "Masrvi", "Sedad"].map((m) => (
                <View key={m} style={[styles.paymentBadge, { backgroundColor: NAVY + "10" }]}>
                  <Text style={[styles.paymentBadgeText, { color: NAVY }]}>{m}</Text>
                </View>
              ))}
            </View>
          </View>

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
              style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1, flexDirection: isRTL ? "row-reverse" : "row" }]}
              onPress={() => Linking.openURL("tel:+22233700000")}
            >
              <View style={[styles.contactIcon, { backgroundColor: NAVY + "15" }]}>
                <FontAwesome5 name="phone" size={16} color={NAVY} />
              </View>
              <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
                <Text style={[styles.contactLabel, { color: colors.muted }]}>
                  {lang === "ar" ? "الهاتف" : lang === "fr" ? "Téléphone" : "Phone"}
                </Text>
                <Text style={[styles.contactValue, { color: NAVY }]}>{c.phone}</Text>
              </View>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable
              style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1, flexDirection: isRTL ? "row-reverse" : "row" }]}
              onPress={() => Linking.openURL(`https://wa.me/22233700000`)}
            >
              <View style={[styles.contactIcon, { backgroundColor: "#25D36620" }]}>
                <FontAwesome5 name="whatsapp" size={16} color="#25D366" />
              </View>
              <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
                <Text style={[styles.contactLabel, { color: colors.muted }]}>WhatsApp</Text>
                <Text style={[styles.contactValue, { color: "#25D366" }]}>{c.whatsapp}</Text>
              </View>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Pressable
              style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1, flexDirection: isRTL ? "row-reverse" : "row" }]}
              onPress={() => Linking.openURL("mailto:suporte@royalvoyage.online")}
            >
              <View style={[styles.contactIcon, { backgroundColor: GOLD + "20" }]}>
                <FontAwesome5 name="envelope" size={16} color={GOLD} />
              </View>
              <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
                <Text style={[styles.contactLabel, { color: colors.muted }]}>
                  {lang === "ar" ? "البريد الإلكتروني" : lang === "fr" ? "E-mail" : "Email"}
                </Text>
                <Text style={[styles.contactValue, { color: GOLD }]}>{c.email}</Text>
              </View>
            </Pressable>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={[styles.contactRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[styles.contactIcon, { backgroundColor: "#EF444420" }]}>
                <FontAwesome5 name="map-marker-alt" size={16} color="#EF4444" />
              </View>
              <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
                <Text style={[styles.contactLabel, { color: colors.muted }]}>
                  {lang === "ar" ? "العنوان" : lang === "fr" ? "Adresse" : "Address"}
                </Text>
                <Text style={[styles.contactValue, { color: colors.foreground }]}>{c.address}</Text>
                <Text style={[styles.contactLabel, { color: colors.muted, marginTop: 2 }]}>{c.country}</Text>
              </View>
            </View>
          </View>

          {/* Technology Partners */}
          <Text style={[styles.servicesTitle, { color: NAVY, marginTop: 8 }]}>
            {lang === "ar" ? "شركاؤنا التقنيون" : lang === "fr" ? "Partenaires Technologiques" : "Technology Partners"}
          </Text>
          <Pressable
            style={[styles.partnerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => Linking.openURL("https://duffel.com")}
          >
            <Image
              source={{ uri: "https://assets.duffel.com/img/duffel-logo.svg" }}
              style={{ width: 90, height: 28 }}
              resizeMode="contain"
            />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: NAVY }}>Duffel</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                {lang === "ar" ? "شريك API معتمد — منصة حجز الطيران" : lang === "fr" ? "Partenaire API Certifié — Réservation de Vols" : "Certified API Partner — Flight Booking Platform"}
              </Text>
            </View>
            <FontAwesome5 name="external-link-alt" size={12} color={colors.muted} />
          </Pressable>

          {/* Airline Partners */}
          <Text style={[styles.servicesTitle, { color: NAVY, marginTop: 8 }]}>
            {lang === "ar" ? "شركاء الطيران" : lang === "fr" ? "Compagnies Aériennes Partenaires" : "Airline Partners"}
          </Text>
          <View style={[styles.airlinesGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              { name: "Royal Air Maroc", code: "AT" },
              { name: "Qatar Airways", code: "QR" },
              { name: "Turkish Airlines", code: "TK" },
              { name: "Air Arabia", code: "G9" },
              { name: "EgyptAir", code: "MS" },
              { name: "Tunisair", code: "TU" },
            ].map((a) => (
              <View key={a.name} style={styles.airlineItem}>
                <Image
                  source={{ uri: `https://images.kiwi.com/airlines/64/${a.code}.png` }}
                  style={{ width: 40, height: 40, borderRadius: 8 }}
                  resizeMode="contain"
                />
                <Text style={{ fontSize: 10, color: colors.muted, textAlign: "center", marginTop: 4 }}>{a.name}</Text>
              </View>
            ))}
          </View>

          {/* Brand Values */}
          <Text style={[styles.servicesTitle, { color: NAVY, marginTop: 8 }]}>
            {lang === "ar" ? "قيمنا" : lang === "fr" ? "Nos Valeurs" : "Our Values"}
          </Text>
          <View style={{ gap: 10 }}>
            {[
              { icon: "gem", color: GOLD, title: lang === "ar" ? "الجودة" : lang === "fr" ? "Qualit\u00e9" : "Quality", desc: lang === "ar" ? "نلتزم بأعلى معايير الجودة في كل حجز وخدمة." : lang === "fr" ? "Nous maintenons les plus hauts standards de qualit\u00e9 dans chaque r\u00e9servation." : "We maintain the highest quality standards in every booking and service." },
              { icon: "shield-alt", color: "#22C55E", title: lang === "ar" ? "الأمانة" : lang === "fr" ? "Confiance" : "Trust", desc: lang === "ar" ? "شفافية كاملة في الأسعار والرسوم وسياسات الإلغاء." : lang === "fr" ? "Transparence totale sur les prix, frais et politiques d'annulation." : "Full transparency on prices, fees, and cancellation policies." },
              { icon: "bolt", color: "#F59E0B", title: lang === "ar" ? "السرعة" : lang === "fr" ? "Rapidit\u00e9" : "Speed", desc: lang === "ar" ? "تذاكر إلكترونية فورية تصلك خلال دقائق من إتمام الحجز." : lang === "fr" ? "Billets instantan\u00e9s envoy\u00e9s en quelques minutes apr\u00e8s la r\u00e9servation." : "Instant e-tickets delivered within minutes of completing your booking." },
              { icon: "heart", color: "#EF4444", title: lang === "ar" ? "العناية بالعميل" : lang === "fr" ? "Service Client" : "Customer Care", desc: lang === "ar" ? "فريقنا متاح 6 أيام في الأسبوع لمساعدتك بالعربية والفرنسية والإنجليزية." : lang === "fr" ? "Notre \u00e9quipe est disponible 6 jours/semaine en arabe, fran\u00e7ais et anglais." : "Our team is available 6 days/week in Arabic, French, and English." },
            ].map((v, i) => (
              <View key={i} style={[styles.valueCard, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[styles.valueIcon, { backgroundColor: v.color + "18" }]}>
                  <FontAwesome5 name={v.icon as any} size={18} color={v.color} />
                </View>
                <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
                  <Text style={[styles.valueTitle, { color: NAVY }]}>{v.title}</Text>
                  <Text style={[styles.valueDesc, { color: colors.foreground }]}>{v.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: NAVY }]}>
            {[
              { num: "+500", label: lang === "ar" ? "شركة طيران" : lang === "fr" ? "Compagnies" : "Airlines" },
              { num: "+50K", label: lang === "ar" ? "رحلة محجوزة" : lang === "fr" ? "R\u00e9servations" : "Bookings" },
              { num: "4.8★", label: lang === "ar" ? "تقييم العملاء" : lang === "fr" ? "Note Client" : "Rating" },
              { num: "2023", label: lang === "ar" ? "تأسيس الشركة" : lang === "fr" ? "Fond\u00e9e" : "Founded" },
            ].map((s, i) => (
              <View key={i} style={styles.statBlock}>
                <Text style={styles.statBlockNum}>{s.num}</Text>
                <Text style={styles.statBlockLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Footer */}
          <Text style={[styles.footer, { color: colors.muted }]}>{c.disclaimer}</Text>
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
  headerContent: { gap: 6 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
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
  sinceText: { color: GOLD, fontSize: 12, fontWeight: "600" },
  content: { padding: 16, gap: 12 },
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
  subtitleText: { fontSize: 15, fontWeight: "600", flex: 1 },
  legalBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 4,
  },
  legalLabel: { fontSize: 11, marginBottom: 2 },
  legalName: { fontSize: 15, fontWeight: "700" },
  countryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countryText: { fontSize: 12, fontWeight: "600" },
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
  sectionBody: { flex: 1, gap: 4 },
  sectionHeading: { fontSize: 14, fontWeight: "700" },
  sectionText: { fontSize: 13, lineHeight: 20 },
  howCard: {
    padding: 18,
    borderRadius: 14,
    gap: 12,
  },
  howTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 4 },
  howStep: { alignItems: "flex-start", gap: 10 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumText: { fontSize: 13, fontWeight: "700", color: NAVY },
  stepText: { fontSize: 13, color: "rgba(255,255,255,0.9)", flex: 1, lineHeight: 20 },
  paymentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  paymentHeader: { alignItems: "center", gap: 8 },
  paymentTitle: { fontSize: 15, fontWeight: "700" },
  paymentText: { fontSize: 13, lineHeight: 20 },
  paymentLogos: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paymentBadgeText: { fontSize: 12, fontWeight: "700" },
  servicesTitle: { fontSize: 16, fontWeight: "700", marginTop: 8, marginBottom: 4 },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
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
  serviceLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  contactCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  contactRow: {
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
  contactLabel: { fontSize: 11, marginBottom: 2 },
  contactValue: { fontSize: 14, fontWeight: "600" },
  divider: { height: 1, marginHorizontal: 14 },
  footer: { textAlign: "center", fontSize: 11, marginTop: 8, marginBottom: 20, lineHeight: 18 },
  partnerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  airlinesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 8,
  },
  airlineItem: { width: "30%", flexGrow: 1, alignItems: "center", padding: 8 },
  // Brand Values
  valueCard: { padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center", gap: 12 },
  valueIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  valueTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  valueDesc: { fontSize: 12, lineHeight: 18 },
  // Stats Row
  statsRow: { borderRadius: 14, padding: 20, flexDirection: "row", justifyContent: "space-around", flexWrap: "wrap", gap: 12 },
  statBlock: { alignItems: "center", minWidth: 60 },
  statBlockNum: { fontSize: 22, fontWeight: "900", color: GOLD },
  statBlockLabel: { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2, textAlign: "center" },
});
