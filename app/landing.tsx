import { Platform, ScrollView, View, Text, Pressable, Linking, StyleSheet, Dimensions, Image } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

const FEATURES = [
  { icon: "✈️", titleAr: "حجز رحلات جوية", titleEn: "Flight Booking", descAr: "أكثر من 500 شركة طيران حول العالم", descEn: "500+ airlines worldwide" },
  { icon: "🏨", titleAr: "حجز فنادق", titleEn: "Hotel Booking", descAr: "آلاف الفنادق بأفضل الأسعار", descEn: "Thousands of hotels at best prices" },
  { icon: "💳", titleAr: "دفع آمن", titleEn: "Secure Payment", descAr: "Stripe مدعوم بتشفير SSL", descEn: "SSL encrypted Stripe payments" },
  { icon: "🌍", titleAr: "متعدد اللغات", titleEn: "Multi-language", descAr: "عربي، فرنسي، إنجليزي، برتغالي", descEn: "Arabic, French, English, Portuguese" },
  { icon: "📱", titleAr: "تطبيق جوال", titleEn: "Mobile App", descAr: "iOS وAndroid وويب", descEn: "iOS, Android & Web" },
  { icon: "🎯", titleAr: "عروض حصرية", titleEn: "Exclusive Deals", descAr: "خصومات يومية وعروض خاصة", descEn: "Daily discounts & special offers" },
  { icon: "📋", titleAr: "إدارة الحجوزات", titleEn: "Booking Management", descAr: "تتبع جميع حجوزاتك بسهولة", descEn: "Track all your bookings easily" },
  { icon: "🛡️", titleAr: "ضمان الأسعار", titleEn: "Price Guarantee", descAr: "أفضل سعر أو نرد الفرق", descEn: "Best price or we refund the difference" },
];

const DESTINATIONS = [
  { flag: "🇫🇷", name: "Paris", priceAr: "من €420", priceEn: "From €420", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/nPwXbGphjCJvGXhf.jpg" },
  { flag: "🇸🇦", name: "Riyadh", priceAr: "من €380", priceEn: "From €380", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/GEdrKlMTlWWgikRU.jpg" },
  { flag: "🇦🇪", name: "Dubai", priceAr: "من €450", priceEn: "From €450", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/THJnvXjyFANINBdi.jpg" },
  { flag: "🇹🇷", name: "Istanbul", priceAr: "من €320", priceEn: "From €320", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/vAbGLVQHNWAyDPJp.jpg" },
  { flag: "🇪🇸", name: "Madrid", priceAr: "من €390", priceEn: "From €390", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/IhwbRwvGfduhfuPY.jpg" },
  { flag: "🇲🇦", name: "Casablanca", priceAr: "من €180", priceEn: "From €180", img: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/WgrnSLcrXtqEeZyF.jpg" },
];

const AIRLINES = [
  { name: "Emirates", logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/PfaxZjdSGOoOdPCf.png" },
  { name: "Air Arabia", logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/drZzPttNkADvPoBU.png" },
  { name: "Turkish Airlines", logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/RzteqYKjpkBYZTek.png" },
  { name: "Air France", logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/vGKlDOSsukXcycnt.jpeg" },
  { name: "Saudia", logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/LVUIQqNzCwXzLRSm.png" },
  { name: "Royal Air Maroc", logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/UtQoscDRvnJacmhD.png" },
  { name: "flydubai", logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/hZQnXXoDGzJhOfRx.png" },
  { name: "Iberia", logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663457917822/XhLYYUXvLNVLcRVO.png" },
];

const TESTIMONIALS = [
  { name: "أحمد محمد", nameEn: "Ahmed Mohamed", textAr: "أفضل تطبيق لحجز الرحلات! سهل الاستخدام وأسعار رائعة.", textEn: "Best flight booking app! Easy to use with great prices.", stars: 5 },
  { name: "فاطمة الزهراء", nameEn: "Fatima Al-Zahra", textAr: "وفرت الكثير على رحلتي لدبي. خدمة ممتازة!", textEn: "Saved a lot on my Dubai trip. Excellent service!", stars: 5 },
  { name: "محمد علي", nameEn: "Mohamed Ali", textAr: "الدفع آمن وسريع. أنصح به بشدة لكل مسافر.", textEn: "Fast and secure payment. Highly recommended for every traveler.", stars: 5 },
];

const FAQ_ITEMS = [
  { qAr: "كيف أحجز رحلة؟", qEn: "How do I book a flight?", aAr: "اختر وجهتك وتاريخ السفر وعدد المسافرين، ثم اضغط بحث واختر الرحلة المناسبة.", aEn: "Choose your destination, travel date and number of passengers, then search and select the right flight." },
  { qAr: "هل الدفع آمن؟", qEn: "Is payment secure?", aAr: "نعم، نستخدم Stripe مع تشفير SSL لضمان أمان جميع معاملاتك المالية.", aEn: "Yes, we use Stripe with SSL encryption to ensure all your financial transactions are secure." },
  { qAr: "هل يمكنني إلغاء حجزي؟", qEn: "Can I cancel my booking?", aAr: "يعتمد ذلك على سياسة الإلغاء الخاصة بكل رحلة. يمكنك مراجعة التفاصيل في صفحة الحجز.", aEn: "It depends on the cancellation policy of each flight. You can review the details on the booking page." },
  { qAr: "ما هي طرق الدفع المتاحة؟", qEn: "What payment methods are available?", aAr: "نقبل جميع بطاقات الائتمان والخصم عبر Stripe بأمان تام.", aEn: "We accept all credit and debit cards through Stripe with full security." },
];

export default function LandingPage() {
  const router = useRouter();
  const colors = useColors();
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMsg, setFormMsg] = useState("");
  const [formSent, setFormSent] = useState(false);

  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  // Google Analytics - inject script on web
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const GA_ID = "G-XXXXXXXXXX"; // Replace with your GA4 Measurement ID
      if (!document.getElementById("ga-script")) {
        const script1 = document.createElement("script");
        script1.id = "ga-script";
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
        document.head.appendChild(script1);
        const script2 = document.createElement("script");
        script2.innerHTML = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_ID}');`;
        document.head.appendChild(script2);
      }
    }
  }, []);

  const handleOpenApp = () => {
    router.push("/auth/login" as any);
  };

  const handleContact = () => {
    const subject = encodeURIComponent("استفسار من الموقع - Royal Voyage");
    const body = encodeURIComponent(`الاسم: ${formName}\nالبريد: ${formEmail}\n\n${formMsg}`);
    Linking.openURL(`mailto:suporte@royalvoyage.online?subject=${subject}&body=${body}`);
    setFormSent(true);
    setFormName(""); setFormEmail(""); setFormMsg("");
  };

  const primary = "#1B2B5E";
  const gold = "#C9A84C";
  const bg = "#f8f9ff";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ flexGrow: 1 }}>
      {/* ── NAVBAR ── */}
      <View style={[styles.navbar, { backgroundColor: primary, flexDirection: isAr ? "row-reverse" : "row" }]}>
        <View style={{ flexDirection: isAr ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
          <Text style={{ fontSize: 22 }}>👑</Text>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Royal <Text style={{ color: gold }}>Voyage</Text></Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Pressable onPress={() => setLang(isAr ? "en" : "ar")} style={[styles.langBtn, { borderColor: gold }]}>
            <Text style={{ color: gold, fontWeight: "700", fontSize: 13 }}>{isAr ? "EN" : "AR"}</Text>
          </Pressable>
          <Pressable onPress={handleOpenApp} style={[styles.navCta, { backgroundColor: gold }]}>
            <Text style={{ color: primary, fontWeight: "800", fontSize: 13 }}>{isAr ? "دخول" : "Login"}</Text>
          </Pressable>
        </View>
      </View>

      {/* ── HERO ── */}
      <View style={[styles.hero, { backgroundColor: primary }]}>
        <View style={[styles.heroBadge, { backgroundColor: "rgba(201,168,76,0.2)", borderColor: gold }]}>
          <Text style={{ color: gold, fontSize: 13, fontWeight: "700" }}>
            {isAr ? "🌟 التطبيق الأول في موريتانيا" : "🌟 Mauritania's #1 Travel App"}
          </Text>
        </View>
        <Text style={[styles.heroTitle, { color: "#fff" }]}>
          {isAr ? "سافر بأسلوب " : "Travel in "}
          <Text style={{ color: gold }}>{isAr ? "ملكي" : "Royal Style"}</Text>
          {isAr ? "" : ""}
        </Text>
        <Text style={[styles.heroSub, { color: "rgba(255,255,255,0.8)" }]}>
          {isAr
            ? "احجز رحلاتك الجوية والفنادق بأفضل الأسعار. تجربة سفر استثنائية في متناول يدك."
            : "Book flights and hotels at the best prices. An exceptional travel experience at your fingertips."}
        </Text>
        <View style={{ flexDirection: isAr ? "row-reverse" : "row", gap: 12, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <Pressable onPress={handleOpenApp} style={[styles.heroCta, { backgroundColor: gold }]}>
            <Text style={{ color: primary, fontWeight: "800", fontSize: 16 }}>
              {isAr ? "🚀 ابدأ الآن مجاناً" : "🚀 Start Free Now"}
            </Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL("https://royalvoyage.online")} style={[styles.heroCtaOutline, { borderColor: gold }]}>
            <Text style={{ color: gold, fontWeight: "700", fontSize: 15 }}>
              {isAr ? "🌐 فتح التطبيق" : "🌐 Open App"}
            </Text>
          </Pressable>
        </View>
        {/* Stats */}
        <View style={[styles.statsRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          {[
            { num: "500+", labelAr: "شركة طيران", labelEn: "Airlines" },
            { num: "50K+", labelAr: "مسافر سعيد", labelEn: "Happy Travelers" },
            { num: "4.9★", labelAr: "تقييم المستخدمين", labelEn: "User Rating" },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={{ color: gold, fontSize: 22, fontWeight: "800" }}>{s.num}</Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>{isAr ? s.labelAr : s.labelEn}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── FEATURES ── */}
      <View style={[styles.section, { backgroundColor: "#fff" }]}>
        <Text style={[styles.sectionBadge, { color: gold }]}>{isAr ? "✨ مميزات التطبيق" : "✨ App Features"}</Text>
        <Text style={[styles.sectionTitle, { color: primary }]}>
          {isAr ? "كل ما تحتاجه للسفر" : "Everything You Need to Travel"}
        </Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureCard, { borderColor: "#e8ecf8" }]}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</Text>
              <Text style={{ color: primary, fontWeight: "700", fontSize: 15, marginBottom: 4, textAlign: "center" }}>
                {isAr ? f.titleAr : f.titleEn}
              </Text>
              <Text style={{ color: "#666", fontSize: 13, textAlign: "center", lineHeight: 18 }}>
                {isAr ? f.descAr : f.descEn}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── HOW IT WORKS ── */}
      <View style={[styles.section, { backgroundColor: bg }]}>
        <Text style={[styles.sectionBadge, { color: gold }]}>{isAr ? "⚡ كيف يعمل" : "⚡ How It Works"}</Text>
        <Text style={[styles.sectionTitle, { color: primary }]}>
          {isAr ? "4 خطوات بسيطة للسفر" : "4 Simple Steps to Travel"}
        </Text>
        <View style={{ gap: 16, marginTop: 8 }}>
          {[
            { step: "01", titleAr: "اختر وجهتك", titleEn: "Choose Your Destination", descAr: "ابحث بين مئات الوجهات حول العالم", descEn: "Search among hundreds of destinations worldwide" },
            { step: "02", titleAr: "قارن الأسعار", titleEn: "Compare Prices", descAr: "اعثر على أفضل عرض يناسب ميزانيتك", descEn: "Find the best deal that fits your budget" },
            { step: "03", titleAr: "ادفع بأمان", titleEn: "Pay Securely", descAr: "ادفع ببطاقتك عبر Stripe المشفر", descEn: "Pay with your card via encrypted Stripe" },
            { step: "04", titleAr: "استمتع برحلتك", titleEn: "Enjoy Your Trip", descAr: "احصل على تذكرتك فوراً وسافر!", descEn: "Get your ticket instantly and travel!" },
          ].map((s, i) => (
            <View key={i} style={[styles.stepCard, { flexDirection: isAr ? "row-reverse" : "row", borderColor: "#e8ecf8" }]}>
              <View style={[styles.stepNum, { backgroundColor: primary }]}>
                <Text style={{ color: gold, fontWeight: "800", fontSize: 16 }}>{s.step}</Text>
              </View>
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={{ color: primary, fontWeight: "700", fontSize: 15, marginBottom: 4, textAlign: isAr ? "right" : "left" }}>
                  {isAr ? s.titleAr : s.titleEn}
                </Text>
                <Text style={{ color: "#666", fontSize: 13, lineHeight: 18, textAlign: isAr ? "right" : "left" }}>
                  {isAr ? s.descAr : s.descEn}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── DESTINATIONS ── */}
      <View style={[styles.section, { backgroundColor: "#fff" }]}>
        <Text style={[styles.sectionBadge, { color: gold }]}>{isAr ? "🌍 وجهات شائعة" : "🌍 Popular Destinations"}</Text>
        <Text style={[styles.sectionTitle, { color: primary }]}>
          {isAr ? "اكتشف العالم معنا" : "Discover the World With Us"}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 14, paddingHorizontal: 4 }}>
          {DESTINATIONS.map((d, i) => (
            <Pressable key={i} onPress={handleOpenApp} style={styles.destCard}>
              <Image source={{ uri: d.img }} style={styles.destImg} />
              <View style={styles.destOverlay}>
                <Text style={{ fontSize: 24 }}>{d.flag}</Text>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{d.name}</Text>
                <Text style={{ color: gold, fontWeight: "700", fontSize: 14 }}>{isAr ? d.priceAr : d.priceEn}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ── PAYMENT ── */}
      <View style={[styles.section, { backgroundColor: primary }]}>
        <Text style={[styles.sectionBadge, { color: gold }]}>{isAr ? "🔒 دفع آمن" : "🔒 Secure Payment"}</Text>
        <Text style={[styles.sectionTitle, { color: "#fff" }]}>
          {isAr ? "ادفع بثقة واطمئنان" : "Pay with Confidence"}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", textAlign: "center", fontSize: 14, lineHeight: 22, marginBottom: 20 }}>
          {isAr
            ? "جميع معاملاتك محمية بتشفير SSL 256-bit عبر Stripe، المعيار العالمي للدفع الآمن."
            : "All your transactions are protected by 256-bit SSL encryption via Stripe, the global standard for secure payments."}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {["💳 Visa", "💳 Mastercard", "💳 Amex", "🔐 SSL 256-bit", "✅ PCI DSS"].map((p, i) => (
            <View key={i} style={[styles.payBadge, { borderColor: "rgba(201,168,76,0.4)", backgroundColor: "rgba(255,255,255,0.08)" }]}>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>{p}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── AIRLINES PARTNERS ── */}
      <View style={[styles.section, { backgroundColor: "#fff" }]}>
        <Text style={[styles.sectionBadge, { color: gold }]}>{isAr ? "🤝 شركاؤنا" : "🤝 Our Partners"}</Text>
        <Text style={[styles.sectionTitle, { color: primary }]}>
          {isAr ? "شركات الطيران المعتمدة" : "Trusted Airline Partners"}
        </Text>
        <Text style={{ color: "#666", textAlign: "center", fontSize: 14, marginBottom: 20, lineHeight: 20 }}>
          {isAr
            ? "نتعامل مع أكبر شركات الطيران لضمان أفضل الأسعار والخدمات"
            : "We work with the world's top airlines to guarantee the best prices and service"}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {AIRLINES.map((a, i) => (
            <View key={i} style={[styles.airlineCard, { borderColor: "#e8ecf8" }]}>
              <Image source={{ uri: a.logoUrl }} style={{ width: 80, height: 40, resizeMode: "contain", marginBottom: 6 }} />
              <Text style={{ color: primary, fontWeight: "700", fontSize: 11, textAlign: "center" }}>{a.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── TESTIMONIALS ── */}
      <View style={[styles.section, { backgroundColor: bg }]}>
        <Text style={[styles.sectionBadge, { color: gold }]}>{isAr ? "⭐ آراء العملاء" : "⭐ Customer Reviews"}</Text>
        <Text style={[styles.sectionTitle, { color: primary }]}>
          {isAr ? "ماذا يقول مسافرونا" : "What Our Travelers Say"}
        </Text>
        <View style={{ gap: 14, marginTop: 8 }}>
          {TESTIMONIALS.map((t, i) => (
            <View key={i} style={[styles.testimonialCard, { borderColor: "#e8ecf8" }]}>
              <Text style={{ color: gold, fontSize: 18, marginBottom: 6 }}>{"★".repeat(t.stars)}</Text>
              <Text style={{ color: "#444", fontSize: 14, lineHeight: 22, marginBottom: 10, textAlign: isAr ? "right" : "left" }}>
                "{isAr ? t.textAr : t.textEn}"
              </Text>
              <Text style={{ color: primary, fontWeight: "700", fontSize: 14, textAlign: isAr ? "right" : "left" }}>
                — {isAr ? t.name : t.nameEn}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── FAQ ── */}
      <View style={[styles.section, { backgroundColor: "#fff" }]}>
        <Text style={[styles.sectionBadge, { color: gold }]}>{isAr ? "❓ الأسئلة الشائعة" : "❓ FAQ"}</Text>
        <Text style={[styles.sectionTitle, { color: primary }]}>
          {isAr ? "أسئلة يطرحها المسافرون" : "Questions Travelers Ask"}
        </Text>
        <View style={{ gap: 10, marginTop: 8 }}>
          {FAQ_ITEMS.map((f, i) => (
            <Pressable key={i} onPress={() => setOpenFaq(openFaq === i ? null : i)} style={[styles.faqItem, { borderColor: "#e8ecf8" }]}>
              <View style={{ flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: primary, fontWeight: "700", fontSize: 14, flex: 1, textAlign: isAr ? "right" : "left" }}>
                  {isAr ? f.qAr : f.qEn}
                </Text>
                <Text style={{ color: gold, fontSize: 18, marginLeft: isAr ? 0 : 8, marginRight: isAr ? 8 : 0 }}>
                  {openFaq === i ? "−" : "+"}
                </Text>
              </View>
              {openFaq === i && (
                <Text style={{ color: "#555", fontSize: 13, lineHeight: 20, marginTop: 10, textAlign: isAr ? "right" : "left" }}>
                  {isAr ? f.aAr : f.aEn}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── CONTACT ── */}
      <View style={[styles.section, { backgroundColor: bg }]}>
        <Text style={[styles.sectionBadge, { color: gold }]}>{isAr ? "📬 تواصل معنا" : "📬 Contact Us"}</Text>
        <Text style={[styles.sectionTitle, { color: primary }]}>
          {isAr ? "نحن هنا لمساعدتك" : "We're Here to Help"}
        </Text>
        <View style={[styles.contactCard, { borderColor: "#e8ecf8" }]}>
          {formSent ? (
            <View style={{ alignItems: "center", padding: 20 }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>✅</Text>
              <Text style={{ color: primary, fontWeight: "700", fontSize: 16, textAlign: "center" }}>
                {isAr ? "تم إرسال رسالتك بنجاح!" : "Message sent successfully!"}
              </Text>
              <Text style={{ color: "#666", fontSize: 14, marginTop: 6, textAlign: "center" }}>
                {isAr ? "سنرد عليك خلال 24 ساعة" : "We'll reply within 24 hours"}
              </Text>
              <Pressable onPress={() => setFormSent(false)} style={[styles.sendBtn, { backgroundColor: primary, marginTop: 16 }]}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{isAr ? "إرسال رسالة أخرى" : "Send Another Message"}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: isAr ? "row-reverse" : "row", gap: 12, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: primary, fontWeight: "600", fontSize: 13, marginBottom: 6, textAlign: isAr ? "right" : "left" }}>
                    {isAr ? "الاسم الكامل" : "Full Name"}
                  </Text>
                  <View style={[styles.inputBox, { borderColor: "#dde3f0" }]}>
                    <Text style={{ color: formName ? "#333" : "#aaa", fontSize: 14 }} onPress={() => {}}>
                      {formName || (isAr ? "اكتب اسمك..." : "Your name...")}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: primary, fontWeight: "600", fontSize: 13, marginBottom: 6, textAlign: isAr ? "right" : "left" }}>
                    {isAr ? "البريد الإلكتروني" : "Email"}
                  </Text>
                  <View style={[styles.inputBox, { borderColor: "#dde3f0" }]}>
                    <Text style={{ color: formEmail ? "#333" : "#aaa", fontSize: 14 }}>
                      {formEmail || "email@example.com"}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={{ color: primary, fontWeight: "600", fontSize: 13, marginBottom: 6, textAlign: isAr ? "right" : "left" }}>
                {isAr ? "رسالتك" : "Your Message"}
              </Text>
              <View style={[styles.inputBox, { borderColor: "#dde3f0", height: 100, marginBottom: 16 }]}>
                <Text style={{ color: formMsg ? "#333" : "#aaa", fontSize: 14 }}>
                  {formMsg || (isAr ? "اكتب رسالتك هنا..." : "Write your message here...")}
                </Text>
              </View>
              <Pressable
                onPress={() => Linking.openURL(`mailto:suporte@royalvoyage.online?subject=${encodeURIComponent(isAr ? "استفسار من الموقع" : "Website Inquiry")}`)}
                style={[styles.sendBtn, { backgroundColor: primary }]}
              >
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                  {isAr ? "✉️ تواصل عبر البريد" : "✉️ Contact via Email"}
                </Text>
              </Pressable>
              <Text style={{ color: "#888", fontSize: 12, textAlign: "center", marginTop: 10 }}>
                suporte@royalvoyage.online
              </Text>
            </>
          )}
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={[styles.section, { backgroundColor: primary, alignItems: "center" }]}>
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 8 }}>
          {isAr ? "ابدأ رحلتك " : "Start Your Journey "}
          <Text style={{ color: gold }}>{isAr ? "اليوم" : "Today"}</Text>
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, textAlign: "center", marginBottom: 24, lineHeight: 22 }}>
          {isAr
            ? "انضم لآلاف المسافرين الذين يثقون بـ Royal Voyage"
            : "Join thousands of travelers who trust Royal Voyage"}
        </Text>
        <Pressable onPress={handleOpenApp} style={[styles.heroCta, { backgroundColor: gold, paddingHorizontal: 40 }]}>
          <Text style={{ color: primary, fontWeight: "800", fontSize: 17 }}>
            {isAr ? "🚀 افتح التطبيق الآن" : "🚀 Open App Now"}
          </Text>
        </Pressable>
      </View>

      {/* ── FOOTER ── */}
      <View style={[styles.footer, { backgroundColor: "#0d1a3a" }]}>
        <View style={{ flexDirection: isAr ? "row-reverse" : "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Text style={{ fontSize: 28 }}>👑</Text>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>Royal <Text style={{ color: gold }}>Voyage</Text></Text>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 16 }}>
          {isAr
            ? "تطبيق حجز الرحلات الجوية والفنادق الأول في موريتانيا"
            : "Mauritania's #1 flight and hotel booking app"}
        </Text>
        <View style={{ flexDirection: "row", gap: 20, marginBottom: 16 }}>
          <Pressable onPress={() => Linking.openURL("mailto:suporte@royalvoyage.online")}>
            <Text style={{ color: gold, fontSize: 13 }}>📧 suporte@royalvoyage.online</Text>
          </Pressable>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
          © 2026 Royal Voyage. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  navbar: { paddingHorizontal: 20, paddingVertical: 14, justifyContent: "space-between", alignItems: "center" },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5 },
  navCta: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  hero: { padding: 28, alignItems: "center", paddingBottom: 40 },
  heroBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  heroTitle: { fontSize: 32, fontWeight: "800", textAlign: "center", marginBottom: 12, lineHeight: 42 },
  heroSub: { fontSize: 15, textAlign: "center", lineHeight: 24, marginBottom: 20, maxWidth: 500 },
  heroCta: { paddingHorizontal: 28, paddingVertical: 16, borderRadius: 30 },
  heroCtaOutline: { paddingHorizontal: 24, paddingVertical: 15, borderRadius: 30, borderWidth: 2 },
  statsRow: { marginTop: 32, gap: 24, flexWrap: "wrap", justifyContent: "center" },
  statItem: { alignItems: "center", minWidth: 80 },
  section: { padding: 28, paddingVertical: 40 },
  sectionBadge: { fontSize: 13, fontWeight: "700", textAlign: "center", marginBottom: 8, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 24, fontWeight: "800", textAlign: "center", marginBottom: 20, lineHeight: 32 },
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center" },
  featureCard: { width: isWeb ? 180 : (width - 72) / 2, padding: 18, borderRadius: 16, borderWidth: 1, alignItems: "center", backgroundColor: "#fff" },
  stepCard: { padding: 16, borderRadius: 14, borderWidth: 1, alignItems: "center", backgroundColor: "#fff", gap: 4 },
  stepNum: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  destCard: { width: 180, height: 220, borderRadius: 18, overflow: "hidden" },
  destImg: { width: "100%", height: "100%", position: "absolute" },
  destOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end", padding: 14, gap: 2 },
  testimonialCard: { padding: 20, borderRadius: 16, borderWidth: 1, backgroundColor: "#fff" },
  faqItem: { padding: 18, borderRadius: 14, borderWidth: 1, backgroundColor: "#fff" },
  contactCard: { padding: 24, borderRadius: 18, borderWidth: 1, backgroundColor: "#fff" },
  inputBox: { padding: 14, borderRadius: 10, borderWidth: 1.5, backgroundColor: "#fafbff", minHeight: 48, justifyContent: "center" },
  sendBtn: { padding: 16, borderRadius: 12, alignItems: "center" },
  payBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  footer: { padding: 28, alignItems: "center" },
  airlineCard: { width: 100, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: "center", backgroundColor: "#fafbff" },
});
