import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  FlatList,
  Modal,
  Animated,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { DESTINATIONS, FLIGHTS } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { useTranslation } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Linking } from "react-native";

type SearchTab = "flights" | "hotels";
type TripType = "oneway" | "roundtrip";
type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

// Helper: get next date N days from now in YYYY-MM-DD
function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Voice Search Modal ────────────────────────────────────────────────────────
function VoiceSearchModal({
  visible,
  onClose,
  onResult,
  isRTL,
}: {
  visible: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
  isRTL: boolean;
}) {
  const colors = useColors();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "done" | "error">("idle");
  const [resultText, setResultText] = useState("");

  // Animated wave bars
  const bars = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  const transcribeMutation = trpc.voice.transcribe.useMutation({
    onSuccess: (data) => {
      if (data.success && data.text) {
        setResultText(data.text);
        setStatus("done");
        setTimeout(() => {
          onResult(data.text);
          onClose();
        }, 1200);
      } else {
        setStatus("error");
      }
    },
    onError: () => setStatus("error"),
  });

  // Animate wave bars when recording
  useEffect(() => {
    if (status === "recording") {
      const animations = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, { toValue: 0.9, duration: 300 + i * 80, useNativeDriver: true }),
            Animated.timing(bar, { toValue: 0.3, duration: 300 + i * 80, useNativeDriver: true }),
          ])
        )
      );
      animations.forEach((a) => a.start());
      return () => animations.forEach((a) => a.stop());
    } else {
      bars.forEach((bar) => bar.setValue(0.3));
    }
  }, [status]);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setStatus("idle");
      setResultText("");
    }
  }, [visible]);

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          isRTL ? "إذن الميكروفون" : "Microphone Permission",
          isRTL ? "يرجى السماح بالوصول إلى الميكروفون" : "Please allow microphone access"
        );
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setStatus("recording");
    } catch (e) {
      setStatus("error");
    }
  };

  const stopRecording = async () => {
    try {
      setStatus("processing");
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) { setStatus("error"); return; }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const mimeType = Platform.OS === "ios" ? "audio/m4a" : "audio/m4a";

      transcribeMutation.mutate({ audioBase64: base64, mimeType, language: isRTL ? "ar" : undefined });
    } catch (e) {
      setStatus("error");
    }
  };

  const handleMicPress = () => {
    if (status === "idle") startRecording();
    else if (status === "recording") stopRecording();
  };

  const micColor = status === "recording" ? "#EF4444" : status === "processing" ? colors.muted : colors.primary;
  const micBg = status === "recording" ? "#FEE2E2" : status === "processing" ? colors.border : colors.primary + "18";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={voiceStyles.overlay}>
        <Pressable style={voiceStyles.backdrop} onPress={onClose} />
        <View style={[voiceStyles.sheet, { backgroundColor: colors.surface }]}>
          {/* Handle */}
          <View style={[voiceStyles.handle, { backgroundColor: colors.border }]} />

          {/* Title */}
          <Text style={[voiceStyles.title, { color: colors.foreground }]}>
            {isRTL ? "البحث الصوتي" : "Voice Search"}
          </Text>
          <Text style={[voiceStyles.subtitle, { color: colors.muted }]}>
            {status === "idle"
              ? isRTL ? "اضغط للتحدث عن وجهتك" : "Tap to speak your destination"
              : status === "recording"
              ? isRTL ? "جاري التسجيل... اضغط للإيقاف" : "Recording... tap to stop"
              : status === "processing"
              ? isRTL ? "جاري التعرف على الصوت..." : "Processing your voice..."
              : status === "done"
              ? isRTL ? "تم التعرف!" : "Recognized!"
              : isRTL ? "حدث خطأ، حاول مجدداً" : "Error, please try again"}
          </Text>

          {/* Wave animation */}
          <View style={voiceStyles.waveContainer}>
            {bars.map((bar, i) => (
              <Animated.View
                key={i}
                style={[
                  voiceStyles.wavebar,
                  {
                    backgroundColor: status === "recording" ? "#EF4444" : colors.primary,
                    transform: [{ scaleY: bar }],
                  },
                ]}
              />
            ))}
          </View>

          {/* Mic button */}
          <Pressable
            style={({ pressed }) => [
              voiceStyles.micButton,
              { backgroundColor: micBg, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleMicPress}
            disabled={status === "processing" || status === "done"}
          >
            <IconSymbol
              name={status === "recording" ? "stop.fill" : "mic.fill"}
              size={36}
              color={micColor}
            />
          </Pressable>

          {/* Result text */}
          {resultText ? (
            <View style={[voiceStyles.resultBox, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
              <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
              <Text style={[voiceStyles.resultText, { color: colors.foreground }]}>{resultText}</Text>
            </View>
          ) : null}

          {/* Cancel */}
          <Pressable style={voiceStyles.cancelBtn} onPress={onClose}>
            <Text style={[voiceStyles.cancelText, { color: colors.muted }]}>
              {isRTL ? "إلغاء" : "Cancel"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Home Screen ──────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useApp();
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState<SearchTab>("flights");

  // Voice search modal
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  // Which field is voice targeting: "flightTo" | "flightFrom" | "hotelDest"
  const [voiceTarget, setVoiceTarget] = useState<"flightTo" | "flightFrom" | "hotelDest">("flightTo");

  // Trip type
  const [tripType, setTripType] = useState<TripType>("oneway");

  // Cabin class
  const [cabinClass, setCabinClass] = useState<CabinClass>("ECONOMY");

  // Flight search state
  const [flightFrom, setFlightFrom] = useState("Casablanca");
  const [flightFromCode, setFlightFromCode] = useState("CMN");
  const [flightTo, setFlightTo] = useState("");
  const [flightToCode, setFlightToCode] = useState("");
  const [departureDate, setDepartureDate] = useState(futureDate(30));
  const [returnDate, setReturnDate] = useState(futureDate(37));
  const [passengers, setPassengers] = useState(1);

  // Children count
  const [children, setChildren] = useState(0);
  const [hotelChildren, setHotelChildren] = useState(0);

  // Hotel search state
  const [hotelDest, setHotelDest] = useState("");
  const [hotelDestCode, setHotelDestCode] = useState("");
  const [checkIn, setCheckIn] = useState(futureDate(30));
  const [checkOut, setCheckOut] = useState(futureDate(33));
  const [guests, setGuests] = useState(2);

  // Swap origin ↔ destination
  const handleSwap = () => {
    const tmpName = flightFrom;
    const tmpCode = flightFromCode;
    setFlightFrom(flightTo || "");
    setFlightFromCode(flightToCode || "");
    setFlightTo(tmpName);
    setFlightToCode(tmpCode);
  };

  const handleFlightSearch = () => {
    if (!flightToCode || !flightTo) {
      Alert.alert(
        isRTL ? "خطأ" : "Missing Destination",
        isRTL ? "يرجى اختيار وجهة السفر" : "Please select a destination airport."
      );
      return;
    }
    if (!flightFromCode || !flightFrom) {
      Alert.alert(
        isRTL ? "خطأ" : "Missing Origin",
        isRTL ? "يرجى اختيار مطار المغادرة" : "Please select a departure airport."
      );
      return;
    }
    router.push({
      pathname: "/flights/results" as any,
      params: {
        origin: flightFrom,
        originCode: flightFromCode,
        destination: flightTo,
        destinationCode: flightToCode,
        date: departureDate,
        returnDate: tripType === "roundtrip" ? returnDate : "",
        tripType,
        passengers: passengers.toString(),
        children: children.toString(),
        cabinClass,
        useMock: "false",
      },
    });
  };

  const handleHotelSearch = () => {
    if (!hotelDestCode || !hotelDest) {
      Alert.alert(
        isRTL ? "خطأ" : "Missing Destination",
        isRTL ? "يرجى اختيار مدينة الوجهة" : "Please select a destination city."
      );
      return;
    }
    router.push({
      pathname: "/hotels/results" as any,
      params: {
        destination: hotelDest,
        destinationCode: hotelDestCode,
        checkIn,
        checkOut,
        guests: guests.toString(),
        children: hotelChildren.toString(),
        useMock: "false",
      },
    });
  };

  // Handle voice search result
  const handleVoiceResult = (text: string) => {
    // The text is a raw transcription — use it as destination name
    // We set the text as the destination value; user can refine via autocomplete
    if (voiceTarget === "flightTo") {
      setFlightTo(text);
      setFlightToCode(""); // will be resolved when user picks from autocomplete
    } else if (voiceTarget === "flightFrom") {
      setFlightFrom(text);
      setFlightFromCode("");
    } else if (voiceTarget === "hotelDest") {
      setHotelDest(text);
      setHotelDestCode("");
    }
  };

  const openVoiceSearch = (target: "flightTo" | "flightFrom" | "hotelDest") => {
    setVoiceTarget(target);
    setVoiceModalVisible(true);
  };

  const greeting = () => {
    return t.home.greeting;
  };

  return (
    <ScreenContainer containerClassName="bg-primary" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={[styles.userName, { textAlign: isRTL ? "right" : "left" }]}>
                {user?.name?.split(" ")[0] ?? (isRTL ? "مسافر" : "Traveller")} 👋
              </Text>
            </View>
            <Pressable
              style={[styles.notifButton, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              onPress={() => {}}
            >
              <IconSymbol name="bell.fill" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={[styles.headerSubtitle, { textAlign: isRTL ? "right" : "left" }]}>{t.home.tagline}</Text>
        </View>

        {/* Search Widget */}
        <View style={[styles.searchWidget, { backgroundColor: colors.surface }]}>
          {/* Tabs: Flights / Hotels */}
          <View style={[styles.tabRow, { backgroundColor: colors.background }]}>
            {(["flights", "hotels"] as SearchTab[]).map((tab) => (
              <Pressable
                key={tab}
                style={[
                  styles.tabButton,
                  activeTab === tab && { backgroundColor: colors.primary },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <IconSymbol
                  name={tab === "flights" ? "airplane" : "building.2.fill"}
                  size={16}
                  color={activeTab === tab ? "#FFFFFF" : colors.muted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: activeTab === tab ? "#FFFFFF" : colors.muted },
                  ]}
                >
                  {tab === "flights" ? t.home.flights : t.home.hotels}
                </Text>
              </Pressable>
            ))}
          </View>

          {activeTab === "flights" ? (
            <View style={styles.searchForm}>

              {/* ── Trip Type Toggle ── */}
              <View style={[styles.tripTypeRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {(["oneway", "roundtrip"] as TripType[]).map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.tripTypeBtn,
                      tripType === type && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setTripType(type)}
                  >
                    <IconSymbol
                      name={type === "oneway" ? "arrow.right" : "arrow.2.squarepath"}
                      size={14}
                      color={tripType === type ? "#FFFFFF" : colors.muted}
                    />
                    <Text
                      style={[
                        styles.tripTypeText,
                        { color: tripType === type ? "#FFFFFF" : colors.muted },
                      ]}
                    >
                      {type === "oneway" ? t.home.oneWay : t.home.roundTrip}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* From — with autocomplete + voice */}
              <LocationAutocomplete
                label={t.home.from}
                placeholder={isRTL ? "مدينة أو مطار الإقلاع" : "Origin city or airport"}
                value={flightFrom}
                iataCode={flightFromCode}
                onSelect={(name, code) => {
                  setFlightFrom(name);
                  setFlightFromCode(code);
                }}
                iconName="airplane"
                onVoicePress={() => openVoiceSearch("flightFrom")}
              />

              {/* Swap button */}
              <View style={styles.swapRow}>
                <View style={[styles.swapDivider, { backgroundColor: colors.border }]} />
                <Pressable
                  style={[styles.swapBtn, { backgroundColor: colors.primary, borderColor: colors.surface }]}
                  onPress={handleSwap}
                >
                  <IconSymbol name="arrow.up.arrow.down" size={16} color="#FFFFFF" />
                </Pressable>
                <View style={[styles.swapDivider, { backgroundColor: colors.border }]} />
              </View>

              {/* To — with autocomplete + voice */}
              <LocationAutocomplete
                label={t.home.to}
                placeholder={isRTL ? "مدينة أو مطار الوجهة" : "Destination city or airport"}
                value={flightTo}
                iataCode={flightToCode}
                onSelect={(name, code) => {
                  setFlightTo(name);
                  setFlightToCode(code);
                }}
                iconName="location.fill"
                onVoicePress={() => openVoiceSearch("flightTo")}
              />

              {/* Date fields */}
              {tripType === "oneway" ? (
                /* One Way — single date */
                <DatePickerField
                  label={t.home.departure}
                  value={departureDate}
                  onChange={(d) => setDepartureDate(d)}
                  minimumDate={new Date()}
                  backgroundColor={colors.background}
                  icon={<IconSymbol name="calendar" size={18} color={colors.primary} />}
                />
              ) : (
                /* Round Trip — two dates side by side */
                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <DatePickerField
                      label={t.home.departure}
                      value={departureDate}
                      onChange={(d) => {
                        setDepartureDate(d);
                        const dep = new Date(d);
                        const ret = new Date(returnDate);
                        if (ret <= dep) {
                          dep.setDate(dep.getDate() + 3);
                          setReturnDate(dep.toISOString().slice(0, 10));
                        }
                      }}
                      minimumDate={new Date()}
                      backgroundColor={colors.background}
                      icon={<IconSymbol name="airplane" size={16} color={colors.primary} />}
                    />
                  </View>
                  <View style={[styles.dateArrow, { marginTop: 20 }]}>
                    <IconSymbol name="arrow.right" size={14} color={colors.muted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <DatePickerField
                      label={t.home.returnDate}
                      value={returnDate}
                      onChange={(d) => setReturnDate(d)}
                      minimumDate={new Date(departureDate)}
                      backgroundColor={colors.background}
                      icon={<IconSymbol name="airplane.arrival" size={16} color={colors.secondary} />}
                    />
                  </View>
                </View>
              )}

              {/* Passengers + Children */}
              <View style={styles.rowFields}>
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="person.2.fill" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.home.passengers}</Text>
                    <View style={styles.counterRow}>
                      <Pressable onPress={() => setPassengers(Math.max(1, passengers - 1))}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>−</Text>
                      </Pressable>
                      <Text style={[styles.fieldValue, { color: colors.foreground }]}>{passengers}</Text>
                      <Pressable onPress={() => setPassengers(passengers + 1)}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="figure.and.child.holdinghands" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{isRTL ? "أطفال" : "Children"}</Text>
                    <View style={styles.counterRow}>
                      <Pressable onPress={() => setChildren(Math.max(0, children - 1))}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>−</Text>
                      </Pressable>
                      <Text style={[styles.fieldValue, { color: colors.foreground }]}>{children}</Text>
                      <Pressable onPress={() => setChildren(children + 1)}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>

              {/* Cabin Class Selector */}
              <View style={[styles.searchField, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <IconSymbol name="airplane" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>
                    {isRTL ? "درجة السفر" : "Cabin Class"}
                  </Text>
                  <View style={styles.cabinRow}>
                    {([
                      { key: "ECONOMY", ar: "اقتصادية", en: "Economy" },
                      { key: "PREMIUM_ECONOMY", ar: "ممتازة", en: "Premium" },
                      { key: "BUSINESS", ar: "أعمال", en: "Business" },
                      { key: "FIRST", ar: "أولى", en: "First" },
                    ] as { key: CabinClass; ar: string; en: string }[]).map((cls) => (
                      <Pressable
                        key={cls.key}
                        onPress={() => setCabinClass(cls.key)}
                        style={[
                          styles.cabinBtn,
                          {
                            backgroundColor: cabinClass === cls.key ? colors.primary : colors.surface,
                            borderColor: cabinClass === cls.key ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cabinBtnText,
                            { color: cabinClass === cls.key ? "#fff" : colors.foreground },
                          ]}
                        >
                          {isRTL ? cls.ar : cls.en}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.searchButton,
                  { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleFlightSearch}
              >
                <IconSymbol name="magnifyingglass" size={18} color={colors.primary} />
                <Text style={[styles.searchButtonText, { color: colors.primary }]}>
                  {tripType === "roundtrip" ? t.home.roundTrip : t.home.searchFlights}
                </Text>
              </Pressable>
            </View>
          ) : (
            /* ── Hotels Form ── */
            <View style={styles.searchForm}>
              {/* Hotel destination + voice */}
              <LocationAutocomplete
                label={t.home.destination}
                placeholder={isRTL ? "مدينة أو وجهة الفندق" : "City or hotel destination"}
                value={hotelDest}
                iataCode={hotelDestCode}
                onSelect={(name, code) => {
                  setHotelDest(name);
                  setHotelDestCode(code);
                }}
                iconName="location.fill"
                onVoicePress={() => openVoiceSearch("hotelDest")}
              />

              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <DatePickerField
                    label={t.home.checkIn}
                    value={checkIn}
                    onChange={(d) => {
                      setCheckIn(d);
                      const ci = new Date(d);
                      const co = new Date(checkOut);
                      if (co <= ci) {
                        ci.setDate(ci.getDate() + 1);
                        setCheckOut(ci.toISOString().slice(0, 10));
                      }
                    }}
                    minimumDate={new Date()}
                    backgroundColor={colors.background}
                    icon={<IconSymbol name="clock.fill" size={18} color={colors.primary} />}
                  />
                </View>
                <View style={[styles.dateArrow, { marginTop: 20 }]}>
                  <IconSymbol name="arrow.right" size={14} color={colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <DatePickerField
                    label={t.home.checkOut}
                    value={checkOut}
                    onChange={(d) => setCheckOut(d)}
                    minimumDate={new Date(checkIn)}
                    backgroundColor={colors.background}
                    icon={<IconSymbol name="clock.fill" size={18} color={colors.primary} />}
                  />
                </View>
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="person.2.fill" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.home.guests}</Text>
                    <View style={styles.counterRow}>
                      <Pressable onPress={() => setGuests(Math.max(1, guests - 1))}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>−</Text>
                      </Pressable>
                      <Text style={[styles.fieldValue, { color: colors.foreground }]}>{guests}</Text>
                      <Pressable onPress={() => setGuests(guests + 1)}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="figure.and.child.holdinghands" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{isRTL ? "أطفال" : "Children"}</Text>
                    <View style={styles.counterRow}>
                      <Pressable onPress={() => setHotelChildren(Math.max(0, hotelChildren - 1))}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>−</Text>
                      </Pressable>
                      <Text style={[styles.fieldValue, { color: colors.foreground }]}>{hotelChildren}</Text>
                      <Pressable onPress={() => setHotelChildren(hotelChildren + 1)}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.searchButton,
                  { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleHotelSearch}
              >
                <IconSymbol name="magnifyingglass" size={18} color={colors.primary} />
                <Text style={[styles.searchButtonText, { color: colors.primary }]}>{t.home.searchHotels}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Popular Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.home.popularDestinations}</Text>
            <Pressable>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t.seeAll}</Text>
            </Pressable>
          </View>
          <FlatList
            horizontal
            data={DESTINATIONS}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.destCard, { opacity: pressed ? 0.9 : 1 }]}
                onPress={() => {
                  setActiveTab("flights");
                  setFlightTo(item.city);
                }}
              >
                <Image source={{ uri: item.image }} style={styles.destImage} />
                <View style={[styles.destTag, { backgroundColor: colors.primary }]}>
                  <Text style={styles.destTagText}>{item.tag}</Text>
                </View>
                <View style={styles.destInfo}>
                  <Text style={styles.destCity}>{item.city}</Text>
                  <Text style={styles.destCountry}>{item.country}</Text>
                  <Text style={styles.destPrice}>{t.home.fromPrice} ${item.flightPrice}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* Today's Deals Banner */}
        <Pressable
          style={({ pressed }) => [{
            flexDirection: "row",
            alignItems: "center",
            marginHorizontal: 20,
            marginBottom: 16,
            padding: 14,
            borderRadius: 14,
            backgroundColor: "#EF4444" + "12",
            borderWidth: 1,
            borderColor: "#EF4444" + "25",
            gap: 12,
            opacity: pressed ? 0.85 : 1,
          }]}
          onPress={() => router.push("/deals" as any)}
        >
          <Text style={{ fontSize: 28 }}>{"\uD83D\uDD25"}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{"\u0639\u0631\u0648\u0636 \u0627\u0644\u064A\u0648\u0645 \u2014 Today's Deals"}</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{"\u062E\u0635\u0648\u0645\u0627\u062A \u062A\u0635\u0644 \u0625\u0644\u0649 30% \u0639\u0644\u0649 \u0631\u062D\u0644\u0627\u062A \u0648\u0641\u0646\u0627\u062F\u0642 \u0645\u062E\u062A\u0627\u0631\u0629"}</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={"#EF4444"} />
        </Pressable>

        {/* Hot Deals */}
        <View style={[styles.section, { paddingBottom: 32 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.home.trendingNow}</Text>
            <Pressable onPress={() => router.push("/deals" as any)}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t.seeAll}</Text>
            </Pressable>
          </View>
          {FLIGHTS.slice(0, 3).map((flight) => (
            <Pressable
              key={flight.id}
              style={({ pressed }) => [
                styles.dealCard,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/flights/detail" as any,
                  params: { id: flight.id },
                })
              }
            >
              <View style={styles.dealLeft}>
                <View style={[styles.airlineIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={{ fontSize: 22 }}>✈</Text>
                </View>
                <View>
                  <Text style={[styles.dealAirline, { color: colors.foreground }]}>{flight.airline}</Text>
                  <Text style={[styles.dealRoute, { color: colors.muted }]}>
                    {flight.originCode} → {flight.destinationCode}
                  </Text>
                  <Text style={[styles.dealDuration, { color: colors.muted }]}>{flight.duration}</Text>
                </View>
              </View>
              <View style={styles.dealRight}>
                <Text style={[styles.dealPrice, { color: colors.primary }]}>${flight.price}</Text>
                <Text style={[styles.dealClass, { color: colors.muted }]}>{flight.class}</Text>
                <View style={[styles.dealSeats, { backgroundColor: colors.error + "15" }]}>
                  <Text style={[styles.dealSeatsText, { color: colors.error }]}>
                    {flight.seatsLeft} {t.flights.seatsLeft}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Social Media Buttons */}
        <View style={styles.socialSection}>
          <View style={styles.socialRow}>
            <Pressable
              style={({ pressed }) => [
                styles.socialBtn,
                { backgroundColor: "#25D366", opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => Linking.openURL("https://wa.me/22233700000")}
            >
              <FontAwesome5 name="whatsapp" size={22} color="#fff" />
              <Text style={styles.socialBtnText}>WhatsApp</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.socialBtn,
                { backgroundColor: "#1877F2", opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => Linking.openURL("https://www.facebook.com/royalvoyage.mr")}
            >
              <FontAwesome5 name="facebook" size={22} color="#fff" />
              <Text style={styles.socialBtnText}>Facebook</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>

      {/* Voice Search Modal */}
      {voiceModalVisible && (
        <VoiceSearchModal
          visible={voiceModalVisible}
          onClose={() => setVoiceModalVisible(false)}
          onResult={handleVoiceResult}
          isRTL={isRTL}
        />
      )}
    </ScreenContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  greeting: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
  },
  searchWidget: {
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  tabRow: {
    flexDirection: "row",
    padding: 6,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchForm: {
    padding: 16,
    gap: 10,
  },
  // ── Trip Type Toggle ──
  tripTypeRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    padding: 3,
    gap: 3,
  },
  tripTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  tripTypeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // ── Field with voice button ──
  fieldWithVoice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  // ── Swap button ──
  swapRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: -4,
  },
  swapDivider: {
    flex: 1,
    height: 1,
  },
  swapBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    marginHorizontal: 8,
  },
  // ── Date arrow ──
  dateArrow: {
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  // ── Trip badge ──
  tripBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tripBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  rowFields: {
    flexDirection: "row",
    gap: 10,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  destCard: {
    width: 160,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
  },
  destImage: {
    width: "100%",
    height: "100%",
  },
  destTag: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  destTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  destInfo: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  destCity: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  destCountry: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 4,
  },
  destPrice: {
    color: "#C9A84C",
    fontSize: 13,
    fontWeight: "600",
  },
  dealCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  dealLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  airlineIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dealAirline: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  dealRoute: {
    fontSize: 13,
    marginBottom: 2,
  },
  dealDuration: {
    fontSize: 12,
  },
  dealRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  dealPrice: {
    fontSize: 20,
    fontWeight: "700",
  },
  dealClass: {
    fontSize: 12,
  },
  dealSeats: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dealSeatsText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cabinRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  cabinBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  cabinBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  socialSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  socialRow: {
    flexDirection: "row",
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  socialBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});

// ── Voice Modal Styles ────────────────────────────────────────────────────────

const voiceStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 28,
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 60,
    marginBottom: 28,
  },
  wavebar: {
    width: 5,
    height: 48,
    borderRadius: 3,
  },
  micButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  resultBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    maxWidth: "100%",
  },
  resultText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  cancelText: {
    fontSize: 15,
  },
});
