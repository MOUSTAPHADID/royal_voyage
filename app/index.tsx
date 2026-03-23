import { Redirect } from "expo-router";
import { useApp } from "@/lib/app-context";
import { View, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function Index() {
  const { isAuthenticated, isLoading } = useApp();
  const colors = useColors();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
