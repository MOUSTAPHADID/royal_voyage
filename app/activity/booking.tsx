import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";

export default function ActivityBookingScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isRTL } = useTranslation();
  const { id, name, price } = useLocalSearchParams();
  const [guests, setGuests] = useState(1);
  const [date, setDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const totalPrice = (parseInt(price?.toString().replace("$", "") || "0") * guests).toFixed(2);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, flex: 1 }}>
            {isRTL ? "حجز النشاط" : "Book Activity"}
          </Text>
        </View>

        {/* Activity Summary */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12, backgroundColor: colors.surface, marginHorizontal: 16, marginVertical: 12, borderRadius: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{name}</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>{isRTL ? "السعر لكل شخص" : "Price per person"}</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>{price}</Text>
          </View>
        </View>

        {/* Booking Form */}
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          {/* Date Selection */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
              {isRTL ? "تاريخ النشاط" : "Activity Date"}
            </Text>
            <Pressable
              style={({ pressed }) => [{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 12,
                opacity: pressed ? 0.7 : 1,
              }]}
              onPress={() => {
                // Date picker would go here
              }}
            >
              <Text style={{ color: date ? colors.foreground : colors.muted, fontSize: 14 }}>
                {date || (isRTL ? "اختر التاريخ" : "Select date")}
              </Text>
            </Pressable>
          </View>

          {/* Guest Count */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
              {isRTL ? "عدد الضيوف" : "Number of Guests"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 }}>
              <Pressable
                onPress={() => guests > 1 && setGuests(guests - 1)}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <IconSymbol name="minus.circle.fill" size={24} color={colors.primary} />
              </Pressable>
              <Text style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                {guests}
              </Text>
              <Pressable
                onPress={() => setGuests(guests + 1)}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          {/* Email */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
              {isRTL ? "البريد الإلكتروني" : "Email"}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 12,
                color: colors.foreground,
                fontSize: 14,
              }}
              placeholder={isRTL ? "أدخل بريدك الإلكتروني" : "Enter your email"}
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          {/* Phone */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
              {isRTL ? "رقم الهاتف" : "Phone Number"}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 12,
                color: colors.foreground,
                fontSize: 14,
              }}
              placeholder={isRTL ? "أدخل رقم هاتفك" : "Enter your phone"}
              placeholderTextColor={colors.muted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Price Breakdown */}
          <View style={{ backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, gap: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 14, color: colors.muted }}>
                {price} × {guests} {isRTL ? "ضيف" : "guest"}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                ${totalPrice}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                {isRTL ? "الإجمالي" : "Total"}
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
                ${totalPrice}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Booking Button */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1 }}>
        <Pressable
          style={({ pressed }) => [{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          }]}
          onPress={() => {
            if (!date || !email || !phone) {
              alert(isRTL ? "يرجى ملء جميع الحقول" : "Please fill all fields");
              return;
            }
            router.push({
              pathname: "/booking/payment" as any,
              params: { type: "activity", id, name, totalPrice },
            });
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            {isRTL ? "متابعة الدفع" : "Continue to Payment"}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
