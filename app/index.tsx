import { Redirect } from "expo-router";
import { useApp } from "@/lib/app-context";
import { View, ActivityIndicator, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function Index() {
  const { isAuthenticated, isLoading, user } = useApp();
  const colors = useColors();

  // On web: show landing page for unauthenticated visitors
  if (Platform.OS === "web" && !isLoading && !isAuthenticated) {
    return <Redirect href={"/landing" as any} />;
  }

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
