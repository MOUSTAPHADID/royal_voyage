import React, { useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Dimensions,
  StyleSheet,
  Image,
  ListRenderItemInfo,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

type Slide = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  gradient: [string, string];
};

const SLIDES: Slide[] = [
  {
    id: "1",
    title: "Fly in Royal Style",
    subtitle: "Discover the world's finest flights with exclusive deals and premium comfort.",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
    gradient: ["#1A3C5E", "#0D1F33"],
  },
  {
    id: "2",
    title: "Stay Like Royalty",
    subtitle: "Book luxury hotels and resorts at the world's most coveted destinations.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    gradient: ["#2C1A5E", "#1A0D33"],
  },
  {
    id: "3",
    title: "Your Royal Journey",
    subtitle: "Manage all your travel bookings in one elegant, seamless experience.",
    image: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80",
    gradient: ["#1A3C2C", "#0D3320"],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace("/auth/login" as any);
    }
  };

  const handleSkip = () => {
    router.replace("/auth/login" as any);
  };

  const renderSlide = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={[styles.slide, { width }]}>
      <Image source={{ uri: item.image }} style={styles.slideImage} resizeMode="cover" />
      <LinearGradient
        colors={[item.gradient[0] + "00", item.gradient[0] + "EE", item.gradient[1]]}
        style={styles.gradient}
        locations={[0.3, 0.65, 1]}
      />
      <View style={styles.slideContent}>
        <Text style={[styles.slideTitle, { color: "#FFFFFF" }]}>{item.title}</Text>
        <Text style={[styles.slideSubtitle, { color: "rgba(255,255,255,0.8)" }]}>
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#0D1117" }}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>Royal Service</Text>
      </View>

      {/* Skip button */}
      {currentIndex < SLIDES.length - 1 && (
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>Skip</Text>
        </Pressable>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      />

      {/* Bottom controls */}
      <View style={styles.bottomContainer}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex ? "#C9A84C" : "rgba(255,255,255,0.3)",
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            { backgroundColor: "#C9A84C", opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    height: height,
    position: "relative",
  },
  slideImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
  },
  slideContent: {
    position: "absolute",
    bottom: 180,
    left: 32,
    right: 32,
  },
  slideTitle: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 12,
    lineHeight: 42,
  },
  slideSubtitle: {
    fontSize: 17,
    lineHeight: 26,
  },
  logoContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  skipButton: {
    position: "absolute",
    top: 60,
    right: 24,
    zIndex: 20,
    padding: 8,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    gap: 24,
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#1A3C5E",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
