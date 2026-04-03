import { Stack } from "expo-router";
import { AdminProvider } from "@/lib/admin-context";

export default function AdminLayout() {
  return (
    <AdminProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking-detail/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="employee-form/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="partner-form/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="documents/[bookingId]" options={{ presentation: "card" }} />
      </Stack>
    </AdminProvider>
  );
}
