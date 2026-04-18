import { Redirect } from "expo-router";
import { Platform } from "react-native";
import { useApp } from "@/lib/app-context";

export default function Index() {
  const { isAuthenticated } = useApp();

  if (Platform.OS === "web") {
    return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/landing" />;
  }

  return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/onboarding" />;
}
