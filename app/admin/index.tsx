import { Redirect } from "expo-router";
import { useAdmin } from "@/lib/admin-context";
import { View, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function IndexScreen() {
  const { employee, isLoading } = useAdmin();
  const colors = useColors();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!employee) {
    // @ts-ignore
    return <Redirect href="/login" />;
  }

  // @ts-ignore
  return <Redirect href="/(tabs)" />;
}
