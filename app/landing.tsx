import { Platform, ScrollView, View, Text, Pressable, Linking, StyleSheet, Image, TextInput, ActivityIndicator, useWindowDimensions } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";

const isWeb = Platform.OS === "web";

// ── Constants ──────────────────────────────────────────────────────────────
const HERO_BG = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80";

const NAV_LINKS_AR = ["رحلات", "فنادق", "تأجير سيارات"];
const NAV_LINKS_EN = ["Flights", "Stays", "Rental cars"];

const FEATURES_AR = [
  { icon: "flight", title: "سافر بأقل تكلفة", desc: "احجز مباشرة من موقعنا وتطبيقنا. نقدم أفضل أسعار التذاكر لجميع الوجهات لكلٍّ من الرحلات المباشرة والمتعددة المحطات. مع Royal Voyage، مغامرتك القادمة على بُعد خطوة." },
  { icon: "assignment", title: "ابقَ على اطلاع", desc: "هل تحتاج معلومات عن رحلتك؟ سجّل دخولك لمتابعة تفاصيل رحلتك وخيارات الإضافات وكل ما يتعلق بحجزك في الوقت الفعلي وبدون ضغط." },
  { icon: "savings", title: "وفّر وخطّط بسهولة", desc: "مع تطبيق Royal Voyage، ستحصل على عروض لا تُصدَّق وخصومات حصرية. احجز رحلاتك وأدِر تفاصيل سفرك — كل شيء في مكان واحد. لماذا الانتظار؟" },
];

const FEATURES_EN = [
  { icon: "flight", title: "Fly for less", desc: "Fly more for less with Royal Voyage. When you book directly through our site or app, we offer cheap flight deals to all destinations for both direct and multi-city trips. With Royal Voyage, your next adventure is just around the corner." },
  { icon: "assignment", title: "Stay informed", desc: "Need more info about your flight? Log in to My Bookings for trip details, check-in options and everything related to your add-ons. Plus, track your refund status in real time with no stress." },
  { icon: "savings", title: "Save big and plan easy", desc: "Ready to explore more while spending less? With the Royal Voyage app, you'll unlock unbeatable deals and exclusive savings. Easily book flights and manage your travel details — all in one place. Why wait?" },
];

const TIPS_AR = [
  { bold: "احجز مبكراً", text: " — أسعار الرحلات تنخفض عند الحجز المبكر." },
  { bold: "كن مرناً في التواريخ", text: " — تعديل تاريخ المغادرة أو العودة يساعدك في إيجاد أسعار أفضل." },
  { bold: "استخدم مطارات قريبة", text: " — الطيران من أو إلى مطارات بديلة قد يوفر عليك الكثير." },
  { bold: "راقب اتجاهات الأسعار", text: " — أسعار الرحلات تتقلب، لذا احجز في الوقت المناسب للحصول على أفضل سعر." },
];

const TIPS_EN = [
  { bold: "Book in advance", text: " — Flight prices tend to be lower when booked early." },
  { bold: "Be flexible with travel dates", text: " — Adjusting your departure or return date can help you find better fares." },
  { bold: "Use nearby airports", text: " — Flying from or to alternative airports may save you money." },
  { bold: "Keep an eye on price trends", text: " — Flight prices fluctuate, so booking at the right time can help you secure the best deal." },
];

const FOOTER_LINKS = {
  ar: {
    products: { title: "المنتجات والخدمات", links: [{ label: "حماية الإلغاء", route: "/refund" }] },
    about: { title: "عن الشركة", links: [{ label: "من نحن", route: "/about" }, { label: "شروط السفر", route: "/terms" }, { label: "سياسة الخصوصية", route: "/privacy" }, { label: "معلومات عن ملفات الارتباط", route: "/privacy" }, { label: "إمكانية الوصول", route: "/about" }, { label: "تحميل التطبيق", route: "/auth/login" }] },
    support: { title: "الدعم", links: [{ label: "تواصل معنا", route: "/contact" }, { label: "الأسئلة الشائعة", route: "/contact" }, { label: "معلومات شركات الطيران", route: "/about" }, { label: "حجوزاتي", route: "/auth/login" }] },
  },
  en: {
    products: { title: "Products and services", links: [{ label: "Cancellation protection", route: "/refund" }] },
    about: { title: "About us", links: [{ label: "About us", route: "/about" }, { label: "Travel conditions", route: "/terms" }, { label: "Privacy Policy", route: "/privacy" }, { label: "Information on cookies", route: "/privacy" }, { label: "Accessibility Statement", route: "/about" }, { label: "Download the app", route: "/auth/login" }] },
    support: { title: "Support", links: [{ label: "Contact us", route: "/contact" }, { label: "FAQ", route: "/contact" }, { label: "Airline Information", route: "/about" }, { label: "My Bookings", route: "/auth/login" }] },
  },
};

const PAYMENT_LOGOS = [
  { name: "Visa", url: "https://cdn.simpleicons.org/visa/1A1F71" },
  { name: "Mastercard", url: "https://cdn.simpleicons.org/mastercard" },
  { name: "PayPal", url: "https://cdn.simpleicons.org/paypal/003087" },
  { name: "Apple Pay", url: "https://cdn.simpleicons.org/applepay" },
  { name: "Google Pay", url: "https://cdn.simpleicons.org/googlepay" },
  { name: "Stripe", url: "https://cdn.simpleicons.org/stripe/635BFF" },
  { name: "Amex", url: "https://cdn.simpleicons.org/americanexpress/007BC1" },
  { name: "UnionPay", url: "https://cdn.simpleicons.org/unionpay/E21836" },
];

// ── Customer Reviews ────────────────────────────────────────────────────────────────────
const REVIEWS_AR = [
  { name: "محمد ولد أحمد", city: "نواكشوط", rating: 5, text: "خدمة رائعة وأسعار لا تصدق! حجزت رحلتي إلى دبي بسعر أقل بكثير مما وجدته في مواقع أخرى. سأعود بالتأكيد.", avatar: "مو" },
  { name: "فاطمة بنت سيدي", city: "نواديبو", rating: 5, text: "سهل جداً في الاستخدام، واجهة واضحة ومريحة. حجزت رحلة إسطنبول في دقيقتين فقط!", avatar: "فب" },
  { name: "أحمدو ولد محمود", city: "كيفة", rating: 4, text: "أفضل تطبيق لحجز التذاكر في موريتانيا. الأسعار تنافسية والدعم سريع الاستجابة.", avatar: "أم" },
  { name: "مريم منتو", city: "روسو", rating: 5, text: "وفرت أكثر من 15,000 أوقية على رحلتي إلى القاهرة مقارنةً بالمواقع الأخرى. شكراً Royal Voyage!", avatar: "مم" },
];

const REVIEWS_EN = [
  { name: "Mohamed Ould Ahmed", city: "Nouakchott", rating: 5, text: "Amazing service and unbelievable prices! I booked my Dubai trip for much less than I found elsewhere. Definitely coming back.", avatar: "MO" },
  { name: "Fatima Bint Sidi", city: "Nouadhibou", rating: 5, text: "Very easy to use, clean interface. Booked an Istanbul flight in just 2 minutes!", avatar: "FB" },
  { name: "Ahmadou Ould Mahmoud", city: "Kiffa", rating: 4, text: "Best flight booking app in Mauritania. Competitive prices and fast support.", avatar: "AM" },
  { name: "Mariem Mento", city: "Rosso", rating: 5, text: "Saved over 15,000 MRU on my Cairo trip compared to other sites. Thank you Royal Voyage!", avatar: "MM" },
];

// ── Popular Destinations ──────────────────────────────────────────────────
const POPULAR_DESTINATIONS = [
  { city_ar: "دبي", city_en: "Dubai", country_ar: "الإمارات", country_en: "UAE", code: "DXB", price_mru: 48000, img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80" },
  { city_ar: "باريس", city_en: "Paris", country_ar: "فرنسا", country_en: "France", code: "CDG", price_mru: 62000, img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80" },
  { city_ar: "إسطنبول", city_en: "Istanbul", country_ar: "تركيا", country_en: "Turkey", code: "IST", price_mru: 41000, img: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80" },
  { city_ar: "الدار البيضاء", city_en: "Casablanca", country_ar: "المغرب", country_en: "Morocco", code: "CMN", price_mru: 28000, img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600&q=80" },
  { city_ar: "القاهرة", city_en: "Cairo", country_ar: "مصر", country_en: "Egypt", code: "CAI", price_mru: 35000, img: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=600&q=80" },
  { city_ar: "مدريد", city_en: "Madrid", country_ar: "إسبانيا", country_en: "Spain", code: "MAD", price_mru: 58000, img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80" },
];

// ── Today's Deals ──────────────────────────────────────────────────────────
const TODAYS_DEALS_AR = [
  { from: "نواكشوط", to: "الدار البيضاء", fromCode: "NKC", toCode: "CMN", airline: "Royal Air Maroc", price: 28500, oldPrice: 42000, date: "2026-05-15", duration: "3ساعة 20د", direct: true },
  { from: "نواكشوط", to: "دبي", fromCode: "NKC", toCode: "DXB", airline: "Emirates", price: 48000, oldPrice: 68000, date: "2026-05-20", duration: "7ساعة 45د", direct: false },
  { from: "نواكشوط", to: "إسطنبول", fromCode: "NKC", toCode: "IST", airline: "Turkish Airlines", price: 41000, oldPrice: 55000, date: "2026-06-01", duration: "5ساعة 30د", direct: false },
  { from: "نواكشوط", to: "باريس", fromCode: "NKC", toCode: "CDG", airline: "Air France", price: 62000, oldPrice: 85000, date: "2026-05-25", duration: "5ساعة 10د", direct: true },
];

const TODAYS_DEALS_EN = [
  { from: "Nouakchott", to: "Casablanca", fromCode: "NKC", toCode: "CMN", airline: "Royal Air Maroc", price: 28500, oldPrice: 42000, date: "2026-05-15", duration: "3h 20m", direct: true },
  { from: "Nouakchott", to: "Dubai", fromCode: "NKC", toCode: "DXB", airline: "Emirates", price: 48000, oldPrice: 68000, date: "2026-05-20", duration: "7h 45m", direct: false },
  { from: "Nouakchott", to: "Istanbul", fromCode: "NKC", toCode: "IST", airline: "Turkish Airlines", price: 41000, oldPrice: 55000, date: "2026-06-01", duration: "5h 30m", direct: false },
  { from: "Nouakchott", to: "Paris", fromCode: "NKC", toCode: "CDG", airline: "Air France", price: 62000, oldPrice: 85000, date: "2026-05-25", duration: "5h 10m", direct: true },
];

const AIRLINE_LOGOS = [
  { name: "Emirates", url: "https://cdn.simpleicons.org/emirates" },
  { name: "Air France", url: "https://cdn.simpleicons.org/airfrance/002157" },
  { name: "Turkish Airlines", url: "https://cdn.simpleicons.org/turkishairlines/C70A0A" },
  { name: "Qatar Airways", url: "https://cdn.simpleicons.org/qatarairways/5C0632" },
  { name: "Lufthansa", url: "https://cdn.simpleicons.org/lufthansa/05164D" },
  { name: "British Airways", url: "https://cdn.simpleicons.org/britishairways/075AAA" },
  { name: "Royal Air Maroc", url: "https://cdn.simpleicons.org/royalairmaroc/CC0000" },
  { name: "Air Arabia", url: "https://cdn.simpleicons.org/airarabia/E31E24" },
  { name: "Royal Air Mauritanie", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Royal_Air_Mauritanie_Logo.svg/320px-Royal_Air_Mauritanie_Logo.svg.png" },
  { name: "Tunisair", url: "https://cdn.simpleicons.org/tunisair/E31E24" },
  { name: "EgyptAir", url: "https://cdn.simpleicons.org/egyptair/002B7F" },
  { name: "Mauritania Airlines", url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Mauritania_Airlines_logo.svg/320px-Mauritania_Airlines_logo.svg.png" },
];

// ── Duffel-powered Airport Autocomplete ─────────────────────────────────────
function AutoInput({ value, onChange, placeholder, rtl }: { value: string; onChange: (v: string, code: string) => void; placeholder: string; rtl: boolean }) {
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: locations, isLoading } = trpc.duffel.searchLocations.useQuery(
    { keyword: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const handleChange = (t: string) => {
    setQuery(t);
    onChange(t, "");
    setShow(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(t), 350);
  };

  const results = Array.isArray(locations) ? locations : [];

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <TextInput
        value={query}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        style={[styles.searchInput, { textAlign: rtl ? "right" : "left" }]}
        onBlur={() => setTimeout(() => setShow(false), 250)}
        onFocus={() => setShow(true)}
      />
      {show && (isLoading || results.length > 0) && (
        <View style={styles.dropdown}>
          {isLoading ? (
            <View style={{ padding: 10, alignItems: "center" }}>
              <ActivityIndicator size="small" color="#1B6CA8" />
            </View>
          ) : (
            results.slice(0, 6).map((loc: any) => (
              <Pressable
                key={loc.iataCode}
                onPress={() => {
                  const label = loc.name || loc.iataCode;
                  setQuery(label);
                  onChange(label, loc.iataCode);
                  setShow(false);
                }}
                style={[styles.dropdownItem, { flexDirection: "row", alignItems: "center", gap: 8 }]}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1B6CA8", minWidth: 36 }}>{loc.iataCode}</Text>
                <Text style={{ fontSize: 13, color: "#333", flex: 1 }}>{loc.name}</Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = isWeb && width >= 768;
  const isLargeDesktop = isWeb && width >= 1100;

  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [searchTab, setSearchTab] = useState<"flights" | "hotels">("flights");
  const [tripType, setTripType] = useState<"roundtrip" | "oneway" | "multicity">("roundtrip");
  const [from, setFrom] = useState("");
  const [fromCode, setFromCode] = useState("");
  const [to, setTo] = useState("");
  const [toCode, setToCode] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children2, setChildren2] = useState(0);
  const [bags, setBags] = useState(1);
  const [hotelDest, setHotelDest] = useState("");
  const [hotelDestCode, setHotelDestCode] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [hotelGuests, setHotelGuests] = useState(2);
  const [searchError, setSearchError] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const [promoEmail, setPromoEmail] = useState("");
  const [promoSubmitted, setPromoSubmitted] = useState(false);
  const [promoError, setPromoError] = useState("");

  const isAr = lang === "ar";

  // Show promo popup after 3s for first-time visitors
  useEffect(() => {
    if (!isWeb) return;
    const dismissed = sessionStorage.getItem("rv_promo_dismissed");
    if (dismissed) return;
    const timer = setTimeout(() => setShowPromoPopup(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handlePromoSubmit = () => {
    if (!promoEmail || !promoEmail.includes("@")) {
      setPromoError(isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email");
      return;
    }
    setPromoError("");
    setPromoSubmitted(true);
    if (isWeb) sessionStorage.setItem("rv_promo_dismissed", "1");
    setTimeout(() => setShowPromoPopup(false), 2500);
  };

  const handlePromoClose = () => {
    setShowPromoPopup(false);
    if (isWeb) sessionStorage.setItem("rv_promo_dismissed", "1");
  };

  useEffect(() => {
    const today = new Date();
    const dep = new Date(today); dep.setDate(dep.getDate() + 30);
    const ret = new Date(today); ret.setDate(ret.getDate() + 37);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setDepartDate(fmt(dep));
    setReturnDate(fmt(ret));
    setCheckIn(fmt(dep));
    setCheckOut(fmt(ret));
  }, []);

  const handleFlightSearch = () => {
    if (!from || !to) {
      setSearchError(isAr ? "يرجى اختيار مطار المغادرة والوجهة" : "Please select origin and destination");
      return;
    }
    setSearchError("");
    router.push({
      pathname: "/flights/results" as any,
      params: {
        origin: from, originCode: fromCode || from,
        destination: to, destinationCode: toCode || to,
        date: departDate, returnDate: tripType === "roundtrip" ? returnDate : "",
        tripType, passengers: adults.toString(), children: children2.toString(),
        infants: "0", childAges: "[]", childDobs: "[]", cabinClass: "ECONOMY",
        bags: bags.toString(),
      },
    });
  };

  const handleHotelSearch = () => {
    if (!hotelDest) {
      setSearchError(isAr ? "يرجى اختيار الوجهة" : "Please select a destination");
      return;
    }
    setSearchError("");
    router.push({
      pathname: "/hotels/results" as any,
      params: {
        destination: hotelDest, destinationCode: hotelDestCode || hotelDest,
        checkIn, checkOut, guests: hotelGuests.toString(), rooms: "1",
      },
    });
  };

  const swapLocations = () => {
    const tmpFrom = from; const tmpFromCode = fromCode;
    setFrom(to); setFromCode(toCode);
    setTo(tmpFrom); setToCode(tmpFromCode);
  };

  const navLinks = isAr ? NAV_LINKS_AR : NAV_LINKS_EN;
  const features = isAr ? FEATURES_AR : FEATURES_EN;
  const tips = isAr ? TIPS_AR : TIPS_EN;
  const footer = isAr ? FOOTER_LINKS.ar : FOOTER_LINKS.en;

  // Dynamic styles based on screen width
  const heroMinHeight = isDesktop ? 520 : 320;
  const heroTitleSize = isLargeDesktop ? 38 : isDesktop ? 30 : 22;
  const heroTitleLineHeight = isLargeDesktop ? 52 : isDesktop ? 42 : 32;
  const searchCardMaxWidth = isDesktop ? 900 : "100%";
  const contentMaxWidth = isLargeDesktop ? 1280 : isDesktop ? 1024 : "100%";
  const sectionPadding = isDesktop ? 48 : 24;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} stickyHeaderIndices={[0]}>

        {/* ── TOP BANNER ── */}
        {showBanner && (
          <View style={styles.topBanner}>
            <View style={{ flex: 1, maxWidth: contentMaxWidth as any, alignSelf: "center", flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>{isAr ? "ضمان أفضل سعر" : "Best Price Guarantee"}</Text>
                <Text style={styles.bannerSub}>{isAr ? "أدنى أسعار الرحلات مضمونة على تطبيق Royal Voyage" : "Lowest fares guaranteed on the Royal Voyage app"}</Text>
                <Pressable onPress={() => router.push("/auth/login" as any)}>
                  <Text style={styles.bannerLink}>{isAr ? "تحميل ومعرفة المزيد" : "Download and learn more"}</Text>
                </Pressable>
              </View>
              <Pressable onPress={() => setShowBanner(false)} style={styles.bannerClose}>
                <MaterialIcons name="close" size={16} color="#555" />
              </Pressable>
            </View>
          </View>
        )}

        {/* ── NAVBAR ── */}
        <View style={styles.navbarWrapper}>
          <View style={[styles.navbar, { flexDirection: isAr ? "row-reverse" : "row", maxWidth: contentMaxWidth as any, alignSelf: "center", width: "100%" }]}>
            {/* Logo */}
            <Pressable onPress={() => {}} style={{ flexDirection: isAr ? "row-reverse" : "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="star" size={22} color="#D4AF37" />
              <Text style={styles.logoText}>Royal <Text style={{ color: "#1B6CA8" }}>Voyage</Text></Text>
            </Pressable>

            {/* Nav links - desktop only */}
            {isDesktop && (
              <View style={{ flexDirection: "row", gap: 4, flex: 1, marginHorizontal: 24 }}>
                {navLinks.map((link, i) => (
                  <Pressable key={i} onPress={() => { if (i === 0) setSearchTab("flights"); else if (i === 1) setSearchTab("hotels"); }}
                    style={[styles.navLink, searchTab === (i === 0 ? "flights" : "hotels") && i < 2 && styles.navLinkActive]}>
                    <Text style={[styles.navLinkText, searchTab === (i === 0 ? "flights" : "hotels") && i < 2 && { color: "#1B6CA8", fontWeight: "700" }]}>{link}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Right actions */}
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Pressable onPress={() => setLang(isAr ? "en" : "ar")} style={styles.langBtn}>
                <MaterialIcons name="language" size={14} color="#1B6CA8" />
                <Text style={styles.langBtnText}>{isAr ? "English" : "عربي"}</Text>
              </Pressable>
              {isDesktop && (
                <Pressable onPress={() => Linking.openURL("https://wa.me/22233700000")} style={styles.supportBtn}>
                  <MaterialIcons name="chat" size={14} color="#1B6CA8" />
                  <Text style={styles.supportBtnText}>{isAr ? "الدعم" : "Support"}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => router.push("/auth/login" as any)} style={styles.bookingsBtn}>
                <MaterialIcons name="person" size={14} color="#1B6CA8" />
                <Text style={styles.bookingsBtnText}>{isAr ? "حجوزاتي" : "My Bookings"}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── HERO with Search ── */}
        <View style={[styles.heroContainer, { minHeight: heroMinHeight }]}>
          <Image source={{ uri: HERO_BG }} style={styles.heroBgImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={[styles.heroContent, { maxWidth: contentMaxWidth as any }]}>
            <Text style={[styles.heroTitle, { fontSize: heroTitleSize, lineHeight: heroTitleLineHeight }]}>
              {isAr ? "وفّر حتى 60% على رحلاتك الجوية لأي وجهة" : "Save up to 60% on your cheap flight to any destination"}
            </Text>

            {/* Search Card */}
            <View style={[styles.searchCard, { maxWidth: searchCardMaxWidth as any, width: "100%" }]}>
              {/* Tabs */}
              <View style={[styles.searchTabs, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                {(["flights", "hotels"] as const).map((tab) => (
                  <Pressable key={tab} onPress={() => { setSearchTab(tab); setSearchError(""); }}
                    style={[styles.searchTab, searchTab === tab && styles.searchTabActive]}>
                    <Text style={[styles.searchTabText, searchTab === tab && styles.searchTabTextActive]}>
                      <MaterialIcons name={tab === "flights" ? "flight" : "hotel"} size={14} color={searchTab === tab ? "#1B6CA8" : "#666"} style={{ marginRight: 4 }} />{tab === "flights" ? (isAr ? "رحلات" : "Flights") : (isAr ? "فنادق" : "Stays")}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {searchTab === "flights" ? (
                <View style={{ gap: 12 }}>
                  {/* Trip type radios */}
                  <View style={[styles.radioRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                    {(["roundtrip", "oneway", "multicity"] as const).map((t) => (
                      <Pressable key={t} onPress={() => setTripType(t)} style={styles.radioItem}>
                        <View style={[styles.radioCircle, tripType === t && styles.radioCircleActive]}>
                          {tripType === t && <View style={styles.radioDot} />}
                        </View>
                        <Text style={styles.radioLabel}>
                          {t === "roundtrip" ? (isAr ? "ذهاب وعودة" : "Return") : t === "oneway" ? (isAr ? "ذهاب فقط" : "One-Way") : (isAr ? "متعدد المدن" : "Multi-City")}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* From / To */}
                  <View style={[styles.fromToRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { textAlign: isAr ? "right" : "left" }]}>{isAr ? "من" : "From"}</Text>
                      <AutoInput value={from} onChange={(v, c) => { setFrom(v); setFromCode(c); }} placeholder={isAr ? "من" : "From"} rtl={isAr} />
                    </View>
                    <Pressable onPress={swapLocations} style={styles.swapBtn}>
                      <Text style={{ fontSize: 18, color: "#1B6CA8" }}>⇄</Text>
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { textAlign: isAr ? "right" : "left" }]}>{isAr ? "إلى" : "To"}</Text>
                      <AutoInput value={to} onChange={(v, c) => { setTo(v); setToCode(c); }} placeholder={isAr ? "إلى" : "To"} rtl={isAr} />
                    </View>
                  </View>

                  {/* Dates + Passengers + Bags + Search */}
                  <View style={[styles.datesRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                    <View style={{ flex: 1, minWidth: isDesktop ? 140 : 100 }}>
                      <Text style={[styles.fieldLabel, { textAlign: isAr ? "right" : "left" }]}>{isAr ? "تاريخ الذهاب" : "Departure"}</Text>
                      <TextInput value={departDate} onChangeText={setDepartDate} style={[styles.searchInput, { textAlign: isAr ? "right" : "left" }]} placeholder="YYYY-MM-DD" placeholderTextColor="#aaa" />
                    </View>
                    {tripType === "roundtrip" && (
                      <View style={{ flex: 1, minWidth: isDesktop ? 140 : 100 }}>
                        <Text style={[styles.fieldLabel, { textAlign: isAr ? "right" : "left" }]}>{isAr ? "تاريخ العودة" : "Return"}</Text>
                        <TextInput value={returnDate} onChangeText={setReturnDate} style={[styles.searchInput, { textAlign: isAr ? "right" : "left" }]} placeholder="YYYY-MM-DD" placeholderTextColor="#aaa" />
                      </View>
                    )}
                    <View style={{ minWidth: 100 }}>
                      <Text style={[styles.fieldLabel, { textAlign: isAr ? "right" : "left" }]}>{isAr ? "المسافرون" : "Passengers"}</Text>
                      <View style={[styles.passengerBox, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                        <Pressable onPress={() => setAdults(Math.max(1, adults - 1))} style={styles.counterBtn}><Text style={styles.counterBtnText}>−</Text></Pressable>
                        <Text style={styles.counterVal}>{adults + children2}</Text>
                        <Pressable onPress={() => setAdults(adults + 1)} style={styles.counterBtn}><Text style={styles.counterBtnText}>+</Text></Pressable>
                      </View>
                    </View>
                    <View style={{ minWidth: 100 }}>
                      <Text style={[styles.fieldLabel, { textAlign: isAr ? "right" : "left" }]}>{isAr ? "الحقائب" : "Bags"}</Text>
                      <View style={[styles.passengerBox, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                        <Pressable onPress={() => setBags(Math.max(0, bags - 1))} style={styles.counterBtn}><Text style={styles.counterBtnText}>−</Text></Pressable>
                        <Text style={styles.counterVal}>{bags}</Text>
                        <Pressable onPress={() => setBags(Math.min(3, bags + 1))} style={styles.counterBtn}><Text style={styles.counterBtnText}>+</Text></Pressable>
                      </View>
                    </View>
                    <Pressable onPress={handleFlightSearch} style={styles.searchBtn}>
                      <Text style={styles.searchBtnText}>{isAr ? "بحث" : "Search flights"}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { textAlign: isAr ? "right" : "left" }]}>{isAr ? "الوجهة" : "Destination"}</Text>
                    <AutoInput value={hotelDest} onChange={(v, c) => { setHotelDest(v); setHotelDestCode(c); }} placeholder={isAr ? "المدينة أو الفندق" : "City or hotel"} rtl={isAr} />
                  </View>
                  <View style={[styles.datesRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { textAlign: isAr ? "right" : "left" }]}>{isAr ? "تسجيل الوصول" : "Check-in"}</Text>
                      <TextInput value={checkIn} onChangeText={setCheckIn} style={[styles.searchInput, { textAlign: isAr ? "right" : "left" }]} placeholder="YYYY-MM-DD" placeholderTextColor="#aaa" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { textAlign: isAr ? "right" : "left" }]}>{isAr ? "تسجيل المغادرة" : "Check-out"}</Text>
                      <TextInput value={checkOut} onChangeText={setCheckOut} style={[styles.searchInput, { textAlign: isAr ? "right" : "left" }]} placeholder="YYYY-MM-DD" placeholderTextColor="#aaa" />
                    </View>
                    <View style={{ minWidth: 100 }}>
                      <Text style={[styles.fieldLabel, { textAlign: isAr ? "right" : "left" }]}>{isAr ? "النزلاء" : "Guests"}</Text>
                      <View style={[styles.passengerBox, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                        <Pressable onPress={() => setHotelGuests(Math.max(1, hotelGuests - 1))} style={styles.counterBtn}><Text style={styles.counterBtnText}>−</Text></Pressable>
                        <Text style={styles.counterVal}>{hotelGuests}</Text>
                        <Pressable onPress={() => setHotelGuests(hotelGuests + 1)} style={styles.counterBtn}><Text style={styles.counterBtnText}>+</Text></Pressable>
                      </View>
                    </View>
                    <Pressable onPress={handleHotelSearch} style={styles.searchBtn}>
                      <Text style={styles.searchBtnText}>{isAr ? "بحث" : "Search stays"}</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {searchError ? <Text style={{ color: "#e53e3e", fontSize: 13, textAlign: isAr ? "right" : "left", marginTop: 4 }}>{searchError}</Text> : null}
            </View>
          </View>
        </View>

        {/* ── 3 FEATURE COLUMNS ── */}
        <View style={[styles.featuresSection, { flexDirection: isDesktop ? (isAr ? "row-reverse" : "row") : "column", paddingHorizontal: sectionPadding }]}>
          <View style={{ maxWidth: contentMaxWidth as any, alignSelf: "center", width: "100%", flexDirection: isDesktop ? (isAr ? "row-reverse" : "row") : "column", gap: 24 }}>
            {features.map((f, i) => (
              <View key={i} style={[styles.featureCol, { flex: isDesktop ? 1 : undefined }]}>
                <View style={{ flexDirection: isAr ? "row-reverse" : "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <MaterialIcons name={f.icon as any} size={32} color="#1B6CA8" />
                  <Text style={[styles.featureTitle, { textAlign: isAr ? "right" : "left" }]}>{f.title}</Text>
                </View>
                <Text style={[styles.featureDesc, { textAlign: isAr ? "right" : "left" }]}>{f.desc}</Text>
                <Pressable onPress={() => router.push("/auth/login" as any)} style={{ marginTop: 12 }}>
                  <Text style={styles.featureLink}>
                    {i === 0 ? (isAr ? "اكتشف المزيد ←" : "Discover more →") : i === 1 ? (isAr ? "تسجيل الدخول لحجوزاتي ←" : "Log in to My Bookings →") : (isAr ? "تحميل التطبيق مجاناً ←" : "Download the app for free →")}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        {/* ── STATS STRIP ── */}
        <View style={[styles.statsStrip, { paddingHorizontal: sectionPadding }]}>
          <View style={{ maxWidth: contentMaxWidth as any, alignSelf: "center", width: "100%", flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
            {[
              { icon: "flight", num: isAr ? "+500" : "500+", label: isAr ? "شركة طيران" : "Airlines" },
              { icon: "confirmation-number", num: isAr ? "+50,000" : "50,000+", label: isAr ? "رحلة محجوزة" : "Flights Booked" },
              { icon: "star", num: "4.8", label: isAr ? "تقييم العملاء" : "Customer Rating" },
              { icon: "support-agent", num: "24/7", label: isAr ? "دعم متواصل" : "Support" },
            ].map((stat, i) => (
              <View key={i} style={styles.statItem}>
                <MaterialIcons name={stat.icon as any} size={28} color="#1B6CA8" />
                <Text style={styles.statNum}>{stat.num}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── POPULAR DESTINATIONS ── */}
        <View style={[styles.destSection, { paddingHorizontal: sectionPadding }]}>
          <View style={{ maxWidth: contentMaxWidth as any, alignSelf: "center", width: "100%" }}>
            <View style={{ flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
                {isAr ? "وجهات شعبية" : "Popular Destinations"}
              </Text>
              <Pressable onPress={() => router.push("/flights/results" as any)}>
                <Text style={styles.seeAllLink}>{isAr ? "عرض الكل ←" : "View all →"}</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
              {POPULAR_DESTINATIONS.map((dest) => (
                <Pressable
                  key={dest.code}
                  style={({ pressed }) => [styles.destCard, { opacity: pressed ? 0.9 : 1, width: 240, height: 280 }]}
                  onPress={() => {
                    setTo(isAr ? dest.city_ar : dest.city_en);
                    setToCode(dest.code);
                    setSearchTab("flights");
                  }}
                >
                  <Image source={{ uri: dest.img }} style={styles.destImg} resizeMode="cover" />
                  <View style={styles.destOverlay} />
                  <View style={styles.destInfo}>
                    <Text style={styles.destCity}>{isAr ? dest.city_ar : dest.city_en}</Text>
                    <Text style={styles.destCountry}>{isAr ? dest.country_ar : dest.country_en}</Text>
                    <View style={styles.destPriceBadge}>
                      <Text style={styles.destPriceText}>
                        {isAr ? `من ${dest.price_mru.toLocaleString()} أوق` : `From ${dest.price_mru.toLocaleString()} MRU`}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ── TODAY'S DEALS ── */}
        <View style={[styles.dealsSection, { paddingHorizontal: sectionPadding }]}>
          <View style={{ maxWidth: contentMaxWidth as any, alignSelf: "center", width: "100%" }}>
            <View style={{ flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <View style={{ flexDirection: isAr ? "row-reverse" : "row", alignItems: "center", gap: 10 }}>
                <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
                  {isAr ? "عروض اليوم" : "Today's Deals"}
                </Text>
                <View style={styles.dealsBadge}>
                  <Text style={styles.dealsBadgeText}>{isAr ? "خصم حتى 60%" : "Up to 60% off"}</Text>
                </View>
              </View>
              <Pressable onPress={() => router.push("/flights/results" as any)}>
                <Text style={styles.seeAllLink}>{isAr ? "عرض الكل ←" : "View all →"}</Text>
              </Pressable>
            </View>
            <View style={[{ gap: 12 }, isDesktop && { flexDirection: isAr ? "row-reverse" : "row", flexWrap: "wrap" }]}>
              {(isAr ? TODAYS_DEALS_AR : TODAYS_DEALS_EN).map((deal, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [styles.dealCard, isDesktop && { flex: 1, minWidth: 220 }, { opacity: pressed ? 0.92 : 1 }]}
                  onPress={() => {
                    setFrom(deal.from); setFromCode(deal.fromCode);
                    setTo(deal.to); setToCode(deal.toCode);
                    setSearchTab("flights");
                    handleFlightSearch();
                  }}
                >
                  <View style={{ flexDirection: isAr ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: isAr ? "row-reverse" : "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <Text style={styles.dealFrom}>{deal.from}</Text>
                        <MaterialIcons name="flight" size={14} color="#1B6CA8" style={{ transform: [{ rotate: isAr ? "180deg" : "0deg" }] }} />
                        <Text style={styles.dealTo}>{deal.to}</Text>
                      </View>
                      <Text style={[styles.dealAirline, { textAlign: isAr ? "right" : "left" }]}>{deal.airline}</Text>
                      <View style={{ flexDirection: isAr ? "row-reverse" : "row", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                        <View style={styles.dealTag}>
                          <MaterialIcons name="schedule" size={11} color="#666" />
                          <Text style={styles.dealTagText}>{deal.duration}</Text>
                        </View>
                        <View style={styles.dealTag}>
                          <MaterialIcons name="calendar-today" size={11} color="#666" />
                          <Text style={styles.dealTagText}>{deal.date}</Text>
                        </View>
                        {deal.direct && (
                          <View style={[styles.dealTag, { backgroundColor: "#e8f5e9" }]}>
                            <Text style={[styles.dealTagText, { color: "#22C55E" }]}>{isAr ? "مباشر" : "Direct"}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={{ alignItems: isAr ? "flex-start" : "flex-end" }}>
                      <Text style={styles.dealOldPrice}>{deal.oldPrice.toLocaleString()} {isAr ? "أوق" : "MRU"}</Text>
                      <Text style={styles.dealPrice}>{deal.price.toLocaleString()} {isAr ? "أوق" : "MRU"}</Text>
                      <View style={styles.dealDiscount}>
                        <Text style={styles.dealDiscountText}>-{Math.round((1 - deal.price / deal.oldPrice) * 100)}%</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      setFrom(deal.from); setFromCode(deal.fromCode);
                      setTo(deal.to); setToCode(deal.toCode);
                      setSearchTab("flights");
                      // Scroll to search form
                      if (isWeb) {
                        const el = document.getElementById("search-form");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }}
                    style={styles.dealBookBtn}
                  >
                    <Text style={styles.dealBookBtnText}>{isAr ? "احجز الآن" : "Book now"}</Text>
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* ── CUSTOMER REVIEWS ── */}
        <View style={[styles.reviewsSection, { paddingHorizontal: sectionPadding }]}>
          <View style={{ maxWidth: contentMaxWidth as any, alignSelf: "center", width: "100%" }}>
            <View style={{ flexDirection: isAr ? "row-reverse" : "row", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <Text style={[styles.sectionTitle, { textAlign: isAr ? "right" : "left" }]}>
                {isAr ? "ماذا يقول عملاؤنا" : "What Our Customers Say"}
              </Text>
              <View style={styles.reviewsRatingBadge}>
                <MaterialIcons name="star" size={14} color="#F59E0B" />
                <Text style={styles.reviewsRatingText}>4.8 / 5</Text>
              </View>
            </View>
            <View style={[{ gap: 16 }, isDesktop && { flexDirection: isAr ? "row-reverse" : "row" }]}>
              {(isAr ? REVIEWS_AR : REVIEWS_EN).map((review, i) => (
                <View key={i} style={[styles.reviewCard, isDesktop && { flex: 1 }]}>
                  {/* Stars */}
                  <View style={{ flexDirection: isAr ? "row-reverse" : "row", gap: 2, marginBottom: 10 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <MaterialIcons key={s} name="star" size={16} color={s <= review.rating ? "#F59E0B" : "#E5E7EB"} />
                    ))}
                  </View>
                  {/* Review text */}
                  <Text style={[styles.reviewText, { textAlign: isAr ? "right" : "left" }]}>“{review.text}”</Text>
                  {/* Author */}
                  <View style={{ flexDirection: isAr ? "row-reverse" : "row", alignItems: "center", gap: 10, marginTop: 14 }}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>{review.avatar}</Text>
                    </View>
                    <View>
                      <Text style={[styles.reviewName, { textAlign: isAr ? "right" : "left" }]}>{review.name}</Text>
                      <Text style={[styles.reviewCity, { textAlign: isAr ? "right" : "left" }]}>{review.city}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── DIVIDER ── */}
        <View style={{ height: 1, backgroundColor: "#e8ecf0", marginHorizontal: sectionPadding }} />

        {/* ── FIND BEST DEALS ARTICLE ── */}
        <View style={[styles.articleSection, { paddingHorizontal: sectionPadding }]}>
          <View style={{ maxWidth: contentMaxWidth as any, alignSelf: "center", width: "100%" }}>
            <Text style={[styles.articleH1, { textAlign: isAr ? "right" : "left", fontSize: isDesktop ? 22 : 18 }]}>
              {isAr ? "ابحث عن أفضل عروض الرحلات مع Royal Voyage" : "Find the Best Deals on Flights with Royal Voyage"}
            </Text>
            <Text style={[styles.articleP, { textAlign: isAr ? "right" : "left" }]}>
              {isAr
                ? "ابحث واحجز رحلاتك الجوية بأسعار رخيصة في ثوانٍ مع Royal Voyage، مقارنةً بأسعار أكثر من 500 شركة طيران لضمان أفضل الأسعار. استمتع بخصومات حصرية وتذاكر مرنة ودعم عملاء على مدار الساعة. وفّر أكثر بالحجز المبكر والمرونة في تواريخ السفر ومراعاة المطارات القريبة."
                : "Find and book cheap flights in seconds with Royal Voyage, comparing prices from 500+ airlines to secure the best fares. Enjoy exclusive discounts, flexible ticket options, and 24/7 customer support. Save more by booking early, staying flexible with travel dates, and considering nearby airports."}
            </Text>
            <Text style={[styles.articleP, { textAlign: isAr ? "right" : "left" }]}>
              {isAr
                ? "مع منصتنا، يمكنك بسهولة مقارنة آلاف الرحلات للعثور على أفضل تذاكر الطيران لوجهتك المفضلة. لا تفوّت العروض المحدودة التي تجعل السفر في متناول الجميع أكثر من أي وقت مضى."
                : "With our platform, you can effortlessly compare thousands of flights to find the best airline tickets and airfares for your dream destination. Don't miss out on limited-time deals that make travel more affordable than ever."}
            </Text>
            <Text style={[styles.articleP, { textAlign: isAr ? "right" : "left" }]}>
              {isAr ? "ابدأ رحلتك اليوم وسافر أكثر بتكلفة أقل مع Royal Voyage!" : "Start your journey today and travel more for less with Royal Voyage!"}
            </Text>

            <Text style={[styles.articleH2, { textAlign: isAr ? "right" : "left", fontSize: isDesktop ? 18 : 16 }]}>
              {isAr ? "كيف تجد أرخص الرحلات الجوية" : "How to Find the Cheapest Flights"}
            </Text>
            <Text style={[styles.articleP, { textAlign: isAr ? "right" : "left" }]}>
              {isAr
                ? "إيجاد أفضل سعر للرحلة ليس أمراً معقداً. القليل من المرونة والتخطيط الذكي يمكن أن يوفر عليك الكثير في أسعار التذاكر. سواء كنت تحجز رحلة عفوية أو تخطط مسبقاً، هذه النصائح ستساعدك في إيجاد أدنى الأسعار مع Royal Voyage."
                : "Finding the best flight price doesn't have to be complicated. A little flexibility and smart planning can help you save big on airfare. Whether you're booking a spontaneous getaway or planning months in advance, these tips will help you find the lowest prices on flights with Royal Voyage."}
            </Text>
            {tips.map((tip, i) => (
              <View key={i} style={[styles.tipRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
                <MaterialIcons name="check-circle" size={18} color="#22C55E" style={{ marginTop: 2 }} />
                <Text style={[styles.tipText, { textAlign: isAr ? "right" : "left" }]}>
                  <Text style={{ fontWeight: "700" }}>{tip.bold}</Text>{tip.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footerContainer}>
          <View style={[styles.footerTop, { flexDirection: isDesktop ? (isAr ? "row-reverse" : "row") : "column", paddingHorizontal: sectionPadding }]}>
            <View style={{ maxWidth: contentMaxWidth as any, alignSelf: "center", width: "100%", flexDirection: isDesktop ? (isAr ? "row-reverse" : "row") : "column", gap: 24 }}>
              {/* Products */}
              <View style={styles.footerCol}>
                <Text style={[styles.footerColTitle, { textAlign: isAr ? "right" : "left" }]}>{footer.products.title}</Text>
                {footer.products.links.map((l, i) => (
                  <Pressable key={i} onPress={() => router.push(l.route as any)}>
                    <Text style={[styles.footerLink, { textAlign: isAr ? "right" : "left" }]}>{l.label}</Text>
                  </Pressable>
                ))}
              </View>
              {/* About */}
              <View style={styles.footerCol}>
                <Text style={[styles.footerColTitle, { textAlign: isAr ? "right" : "left" }]}>{footer.about.title}</Text>
                {footer.about.links.map((l, i) => (
                  <Pressable key={i} onPress={() => router.push(l.route as any)}>
                    <Text style={[styles.footerLink, { textAlign: isAr ? "right" : "left" }]}>{l.label}</Text>
                  </Pressable>
                ))}
              </View>
              {/* Support */}
              <View style={styles.footerCol}>
                <Text style={[styles.footerColTitle, { textAlign: isAr ? "right" : "left" }]}>{footer.support.title}</Text>
                {footer.support.links.map((l, i) => (
                  <Pressable key={i} onPress={() => router.push(l.route as any)}>
                    <Text style={[styles.footerLink, { textAlign: isAr ? "right" : "left" }]}>{l.label}</Text>
                  </Pressable>
                ))}
              </View>
              {/* Log in */}
              <View style={styles.footerCol}>
                <Text style={[styles.footerColTitle, { textAlign: isAr ? "right" : "left" }]}>{isAr ? "تسجيل الدخول" : "Log in"}</Text>
                <Pressable onPress={() => router.push("/auth/login" as any)} style={styles.footerLoginBtn}>
                  <MaterialIcons name="person" size={14} color="#1B6CA8" />
                  <Text style={styles.footerLoginBtnText}>{isAr ? "حجوزاتي" : "My Bookings"}</Text>
                </Pressable>
                <Pressable onPress={() => setLang(isAr ? "en" : "ar")} style={[styles.footerLoginBtn, { marginTop: 8 }]}>
                  <MaterialIcons name="language" size={14} color="#1B6CA8" />
                  <Text style={styles.footerLoginBtnText}>{isAr ? "English" : "عربي"}</Text>
                </Pressable>
                {/* App store badges */}
                <View style={{ gap: 8, marginTop: 16 }}>
                  <Pressable onPress={() => Linking.openURL("https://apps.apple.com")} style={styles.storeBadge}>
                    <MaterialIcons name="apple" size={20} color="#fff" />
                    <View>
                      <Text style={{ color: "#fff", fontSize: 9 }}>{isAr ? "متوفر على" : "Download on the"}</Text>
                      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>App Store</Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => Linking.openURL("https://play.google.com")} style={[styles.storeBadge, { backgroundColor: "#1a1a2e" }]}>
                    <MaterialIcons name="play-arrow" size={20} color="#fff" />
                    <View>
                      <Text style={{ color: "#fff", fontSize: 9 }}>{isAr ? "احصل عليه من" : "Get it on"}</Text>
                      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>Google Play</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Airline logos */}
          <View style={[styles.logosSection, { borderTopWidth: 1, borderTopColor: "#d0d8e4", paddingTop: 20 }]}>
            <Text style={styles.logosSectionTitle}>{isAr ? "شركاؤنا من شركات الطيران" : "Our Airline Partners"}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.logosRow}>
              {AIRLINE_LOGOS.map((a) => (
                <View key={a.name} style={styles.logoCard}>
                  <Image source={{ uri: a.url }} style={styles.logoImg} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Duffel Technology Partner */}
          <View style={[styles.logosSection, { borderTopWidth: 1, borderTopColor: "#d0d8e4", paddingTop: 20 }]}>
            <Text style={styles.logosSectionTitle}>{isAr ? "شريكنا التقني" : "Technology Partner"}</Text>
            <View style={{ alignItems: "center" }}>
              <Pressable
                style={({ pressed }) => [styles.duffelCard, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => Linking.openURL("https://duffel.com")}
              >
                <Image
                  source={{ uri: "https://assets.duffel.com/img/duffel-logo.svg" }}
                  style={{ width: 100, height: 32 }}
                  resizeMode="contain"
                  onError={() => {}}
                />
                <View style={{ marginTop: 6, alignItems: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#1a1a2e" }}>Duffel</Text>
                  <Text style={{ fontSize: 10, color: "#666", textAlign: "center", marginTop: 2 }}>
                    {isAr ? "شريك تقني معتمد" : "Certified API Partner"}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Payment logos */}
          <View style={[styles.logosSection, { borderTopWidth: 1, borderTopColor: "#d0d8e4", paddingTop: 20 }]}>
            <Text style={styles.logosSectionTitle}>{isAr ? "طرق الدفع المقبولة" : "Accepted Payment Methods"}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.logosRow}>
              {PAYMENT_LOGOS.map((p) => (
                <View key={p.name} style={styles.logoCard}>
                  <Image source={{ uri: p.url }} style={styles.logoImg} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Copyright */}
          <View style={styles.footerBottom}>
            <Text style={styles.footerCopyright}>
              Royal Voyage / Nouakchott, Mauritania{"\n"}
              © 2026 Royal Voyage. {isAr ? "جميع الحقوق محفوظة." : "All Rights Reserved."}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* WhatsApp FAB */}
      <Pressable
        style={({ pressed }) => [styles.whatsappFab, { opacity: pressed ? 0.85 : 1 }]}
        onPress={() => Linking.openURL("https://wa.me/22233700000")}
      >
        <MaterialIcons name="chat" size={26} color="#fff" />
      </Pressable>

      {/* ── PROMO POPUP ── */}
      {showPromoPopup && (
        <View style={styles.popupOverlay}>
          <View style={[styles.popupCard, { direction: isAr ? "rtl" : "ltr" } as any]}>
            {/* Close button */}
            <Pressable onPress={handlePromoClose} style={styles.popupClose}>
              <MaterialIcons name="close" size={20} color="#888" />
            </Pressable>

            {/* Badge */}
            <View style={styles.popupBadge}>
              <Text style={styles.popupBadgeText}>{isAr ? "عرض حصري" : "Exclusive Offer"}</Text>
            </View>

            {/* Discount circle */}
            <View style={styles.popupDiscountCircle}>
              <Text style={styles.popupDiscountNum}>10%</Text>
              <Text style={styles.popupDiscountLabel}>{isAr ? "خصم" : "OFF"}</Text>
            </View>

            {/* Title */}
            <Text style={[styles.popupTitle, { textAlign: isAr ? "right" : "left" }]}>
              {isAr ? "وفّر 10% على أول حجز!" : "Save 10% on Your First Booking!"}
            </Text>
            <Text style={[styles.popupSubtitle, { textAlign: isAr ? "right" : "left" }]}>
              {isAr
                ? "أدخل بريدك الإلكتروني واحصل على كود خصم حصري لأول رحلة مع Royal Voyage."
                : "Enter your email and get an exclusive discount code for your first trip with Royal Voyage."}
            </Text>

            {promoSubmitted ? (
              <View style={styles.popupSuccess}>
                <MaterialIcons name="check-circle" size={32} color="#22C55E" />
                <Text style={[styles.popupSuccessText, { textAlign: isAr ? "right" : "left" }]}>
                  {isAr ? "شكراً! تم إرسال كود الخصم إلى بريدك." : "Thank you! Your discount code has been sent to your email."}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.popupInputRow}>
                  <TextInput
                    value={promoEmail}
                    onChangeText={setPromoEmail}
                    placeholder={isAr ? "بريدك الإلكتروني" : "Your email address"}
                    placeholderTextColor="#aaa"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.popupInput, { textAlign: isAr ? "right" : "left" }]}
                    returnKeyType="done"
                    onSubmitEditing={handlePromoSubmit}
                  />
                </View>
                {promoError ? <Text style={styles.popupError}>{promoError}</Text> : null}
                <Pressable
                  onPress={handlePromoSubmit}
                  style={({ pressed }) => [styles.popupBtn, { opacity: pressed ? 0.88 : 1 }]}
                >
                  <Text style={styles.popupBtnText}>
                    {isAr ? "احصل على الخصم" : "Get My Discount"}
                  </Text>
                </Pressable>
                <Pressable onPress={handlePromoClose} style={{ marginTop: 10, alignItems: "center" }}>
                  <Text style={styles.popupSkip}>{isAr ? "لا شكراً، سأدفع السعر الكامل" : "No thanks, I'll pay full price"}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Banner
  topBanner: { backgroundColor: "#f0f7ff", borderBottomWidth: 1, borderBottomColor: "#d0e4f7", padding: 12, paddingHorizontal: 20 },
  bannerTitle: { fontSize: 13, fontWeight: "700", color: "#1B6CA8", marginBottom: 2 },
  bannerSub: { fontSize: 12, color: "#444", lineHeight: 18 },
  bannerLink: { fontSize: 12, color: "#1B6CA8", textDecorationLine: "underline", marginTop: 4 },
  bannerClose: { padding: 4 },
  // Navbar
  navbarWrapper: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e8ecf0", zIndex: 100 },
  navbar: { paddingHorizontal: 20, paddingVertical: 12, justifyContent: "space-between", alignItems: "center" },
  logoText: { fontSize: 20, fontWeight: "800", color: "#1a1a2e" },
  navLink: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  navLinkActive: { borderBottomWidth: 2, borderBottomColor: "#1B6CA8" },
  navLinkText: { fontSize: 14, color: "#333", fontWeight: "500" },
  langBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: "#d0d8e4" },
  langBtnText: { fontSize: 13, color: "#333" },
  supportBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: "#d0d8e4" },
  supportBtnText: { fontSize: 13, color: "#333" },
  bookingsBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1.5, borderColor: "#1B6CA8" },
  bookingsBtnText: { fontSize: 13, color: "#1B6CA8", fontWeight: "600" },
  // Hero
  heroContainer: { position: "relative", justifyContent: "center", alignItems: "center" },
  heroBgImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" },
  heroOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,30,80,0.55)" },
  heroContent: { zIndex: 1, padding: 24, alignItems: "center", width: "100%", alignSelf: "center" },
  heroTitle: { fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 20 },
  // Search Card
  searchCard: { backgroundColor: "#fff", borderRadius: 12, padding: 20, alignSelf: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  searchTabs: { marginBottom: 16, gap: 4 },
  searchTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  searchTabActive: { backgroundColor: "#e8f0fe" },
  searchTabText: { fontSize: 14, color: "#555", fontWeight: "500" },
  searchTabTextActive: { color: "#1B6CA8", fontWeight: "700" },
  radioRow: { gap: 16, alignItems: "center" },
  radioItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#aaa", justifyContent: "center", alignItems: "center" },
  radioCircleActive: { borderColor: "#1B6CA8" },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#1B6CA8" },
  radioLabel: { fontSize: 13, color: "#333" },
  fromToRow: { gap: 8, alignItems: "flex-end" },
  fieldLabel: { fontSize: 12, color: "#555", marginBottom: 4, fontWeight: "600" },
  searchInput: { borderWidth: 1, borderColor: "#d0d8e4", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1a1a2e", backgroundColor: "#fafbff", minHeight: 44 },
  swapBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "#d0d8e4", justifyContent: "center", alignItems: "center", backgroundColor: "#fff", marginBottom: 2 },
  datesRow: { gap: 8, alignItems: "flex-end", flexWrap: "wrap" },
  passengerBox: { borderWidth: 1, borderColor: "#d0d8e4", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, alignItems: "center", gap: 8, minHeight: 44, backgroundColor: "#fafbff" },
  counterBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#e8f0fe", justifyContent: "center", alignItems: "center" },
  counterBtnText: { fontSize: 16, color: "#1B6CA8", fontWeight: "700", lineHeight: 20 },
  counterVal: { fontSize: 15, fontWeight: "700", color: "#1a1a2e", minWidth: 20, textAlign: "center" },
  searchBtn: { backgroundColor: "#1B6CA8", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12, justifyContent: "center", alignItems: "center", minHeight: 44 },
  searchBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  // Dropdown
  dropdown: { position: "absolute", top: 44, left: 0, right: 0, backgroundColor: "#fff", borderWidth: 1, borderColor: "#d0d8e4", borderRadius: 8, zIndex: 999, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 8 },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f4f8" },
  // Features
  featuresSection: { paddingVertical: 32, backgroundColor: "#fff" },
  featureCol: { gap: 4 },
  featureTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a2e" },
  featureDesc: { fontSize: 14, color: "#555", lineHeight: 22 },
  featureLink: { fontSize: 13, color: "#1B6CA8", textDecorationLine: "underline", fontWeight: "600" },
  // Article
  articleSection: { paddingVertical: 32, backgroundColor: "#fff" },
  articleH1: { fontWeight: "700", color: "#1a1a2e", marginBottom: 12, lineHeight: 30 },
  articleH2: { fontWeight: "700", color: "#1a1a2e", marginTop: 24, marginBottom: 10, lineHeight: 26 },
  articleP: { fontSize: 14, color: "#444", lineHeight: 24, marginBottom: 10 },
  tipRow: { gap: 10, marginBottom: 8, alignItems: "flex-start" },
  tipCheck: { color: "#1B6CA8", fontSize: 14, fontWeight: "700", marginTop: 2 },
  tipText: { flex: 1, fontSize: 14, color: "#444", lineHeight: 22 },
  // Footer
  footerContainer: { backgroundColor: "#f0f4f8", borderTopWidth: 1, borderTopColor: "#d0d8e4" },
  footerTop: { paddingVertical: 32, gap: 24 },
  footerCol: { minWidth: 140, flex: 1 },
  footerColTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", marginBottom: 12 },
  footerLink: { fontSize: 13, color: "#1B6CA8", textDecorationLine: "underline", marginBottom: 8, lineHeight: 20 },
  footerLoginBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: "#1B6CA8", backgroundColor: "#fff", alignSelf: "flex-start" },
  footerLoginBtnText: { fontSize: 13, color: "#1B6CA8", fontWeight: "600" },
  storeBadge: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1a1a2e", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, alignSelf: "flex-start" },
  logosSection: { paddingHorizontal: 24, paddingBottom: 16 },
  logosSectionTitle: { fontSize: 12, color: "#888", fontWeight: "600", textAlign: "center", marginBottom: 12, letterSpacing: 0.5, textTransform: "uppercase" },
  logosRow: { flexDirection: "row", gap: 12, paddingHorizontal: 4, alignItems: "center" },
  logoCard: { width: 90, height: 44, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#e0e8f0", justifyContent: "center", alignItems: "center", padding: 8 },
  logoImg: { width: 74, height: 28 },
  footerBottom: { borderTopWidth: 1, borderTopColor: "#d0d8e4", padding: 20, alignItems: "center" },
  footerCopyright: { fontSize: 12, color: "#888", textAlign: "center", lineHeight: 20 },
  // Popular Destinations
  destSection: { paddingVertical: 32, backgroundColor: "#f8faff" },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#1a1a2e" },
  seeAllLink: { fontSize: 13, color: "#1B6CA8", textDecorationLine: "underline", fontWeight: "600" },
  destCard: { width: 200, height: 260, borderRadius: 16, overflow: "hidden", position: "relative" },
  destImg: { width: "100%", height: "100%", position: "absolute" },
  destOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 140, backgroundColor: "transparent" },
  destInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: "rgba(0,0,0,0.45)" },
  destCity: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 2 },
  destCountry: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 8 },
  destPriceBadge: { backgroundColor: "rgba(27,108,168,0.9)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  destPriceText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  // Today's Deals
  dealsSection: { paddingVertical: 32, backgroundColor: "#fff" },
  dealsBadge: { backgroundColor: "#e53e3e", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dealsBadgeText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  dealCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e0e8f0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  dealFrom: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  dealTo: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  dealAirline: { fontSize: 12, color: "#666", marginTop: 2 },
  dealTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#f0f4f8", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  dealTagText: { fontSize: 11, color: "#555" },
  dealOldPrice: { fontSize: 12, color: "#aaa", textDecorationLine: "line-through", textAlign: "right" },
  dealPrice: { fontSize: 18, fontWeight: "800", color: "#1B6CA8", textAlign: "right" },
  dealDiscount: { backgroundColor: "#e53e3e", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginTop: 4 },
  dealDiscountText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  dealBookBtn: { backgroundColor: "#1B6CA8", borderRadius: 8, paddingVertical: 10, alignItems: "center", marginTop: 14 },
  dealBookBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  // Customer Reviews
  reviewsSection: { paddingVertical: 36, backgroundColor: "#f8faff" },
  reviewsRatingBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  reviewsRatingText: { fontSize: 13, fontWeight: "700", color: "#D97706" },
  reviewCard: { backgroundColor: "#fff", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#e0e8f0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  reviewText: { fontSize: 14, color: "#444", lineHeight: 22, fontStyle: "italic" },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1B6CA8", justifyContent: "center", alignItems: "center" },
  reviewAvatarText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  reviewName: { fontSize: 14, fontWeight: "700", color: "#1a1a2e" },
  reviewCity: { fontSize: 12, color: "#888", marginTop: 2 },
  // WhatsApp FAB
  whatsappFab: { position: "absolute", bottom: 24, right: 20, width: 54, height: 54, borderRadius: 27, backgroundColor: "#25D366", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  duffelCard: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1.5, borderColor: "#1a1a2e", paddingHorizontal: 24, paddingVertical: 16, alignItems: "center", minWidth: 160, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  // Stats Strip
  statsStrip: { paddingVertical: 32, backgroundColor: "#f0f7ff", borderTopWidth: 1, borderTopColor: "#d8eaf7", borderBottomWidth: 1, borderBottomColor: "#d8eaf7" },
  statItem: { alignItems: "center", gap: 6, minWidth: 100 },
  statNum: { fontSize: 26, fontWeight: "900", color: "#1B6CA8" },
  statLabel: { fontSize: 13, color: "#555", fontWeight: "500" },
  // Promo Popup
  popupOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", zIndex: 9999 },
  popupCard: { backgroundColor: "#fff", borderRadius: 20, padding: 28, width: "90%", maxWidth: 420, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  popupClose: { position: "absolute", top: 14, right: 14, padding: 6, zIndex: 1 },
  popupBadge: { backgroundColor: "#e53e3e", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, alignSelf: "flex-start", marginBottom: 16 },
  popupBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff", letterSpacing: 0.5, textTransform: "uppercase" },
  popupDiscountCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#1B6CA8", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 18, shadowColor: "#1B6CA8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  popupDiscountNum: { fontSize: 28, fontWeight: "900", color: "#fff", lineHeight: 32 },
  popupDiscountLabel: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginTop: 2 },
  popupTitle: { fontSize: 20, fontWeight: "800", color: "#1a1a2e", marginBottom: 8, lineHeight: 28 },
  popupSubtitle: { fontSize: 14, color: "#555", lineHeight: 22, marginBottom: 20 },
  popupInputRow: { marginBottom: 8 },
  popupInput: { borderWidth: 1.5, borderColor: "#d0d8e4", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1a1a2e", backgroundColor: "#f8faff" },
  popupError: { fontSize: 12, color: "#e53e3e", marginBottom: 8 },
  popupBtn: { backgroundColor: "#1B6CA8", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  popupBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  popupSkip: { fontSize: 12, color: "#aaa", textDecorationLine: "underline" },
  popupSuccess: { alignItems: "center", gap: 12, paddingVertical: 16 },
  popupSuccessText: { fontSize: 15, color: "#22C55E", fontWeight: "700", lineHeight: 22 },
});
