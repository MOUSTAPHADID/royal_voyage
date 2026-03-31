import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { useApp } from "@/lib/app-context";
import * as Haptics from "expo-haptics";

type OrderStatus = "CONFIRMED" | "TICKETED" | "CANCELLED" | "PENDING" | "UNKNOWN";

function getStatusColor(status: string, colors: any) {
  switch (status.toUpperCase()) {
    case "CONFIRMED":
      return colors.primary;
    case "TICKETED":
      return colors.success;
    case "CANCELLED":
      return colors.error;
    case "PENDING":
      return colors.warning;
    default:
      return colors.muted;
  }
}

function getStatusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case "CONFIRMED":
      return "Confirmed";
    case "TICKETED":
      return "Ticketed";
    case "CANCELLED":
      return "Cancelled";
    case "PENDING":
      return "Pending";
    default:
      return status;
  }
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function PnrStatusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string; bookingId?: string }>();
  const colors = useColors();
  const { t } = useTranslation();
  const { bookings, updateBookingStatus } = useApp();

  const [orderId, setOrderId] = useState(params.orderId || "");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const cancelMutation = trpc.amadeus.cancelFlightOrder.useMutation();

  const lookupPnr = useCallback(async () => {
    if (!orderId.trim()) {
      Alert.alert("Error", "Please enter an Order ID or PNR");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const result = await utils.amadeus.getFlightOrder.fetch({ orderId: orderId.trim() });
      if (result.success && result.data) {
        setOrderData(result.data);
      } else {
        setError(result.error || "Could not retrieve order. Please check the Order ID.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to connect to Duffel API");
    } finally {
      setLoading(false);
    }
  }, [orderId, utils]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      "Cancel Booking",
      `Are you sure you want to cancel this booking?\n\nOrder ID: ${orderData?.orderId}\nPNR: ${orderData?.pnr}`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            setCancelling(true);
            try {
              const result = await cancelMutation.mutateAsync({
                orderId: orderData.orderId,
              });
              if (result.success) {
                // Update local booking status if we have a bookingId
                if (params.bookingId) {
                  updateBookingStatus(params.bookingId, "cancelled");
                }
                setOrderData((prev: any) => prev ? { ...prev, status: "CANCELLED" } : prev);
                if (Platform.OS !== "web") {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                Alert.alert("Success", "Booking has been cancelled successfully.");
              } else {
                Alert.alert("Error", result.error || "Failed to cancel booking");
              }
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to cancel booking");
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  }, [orderData, params.bookingId, updateBookingStatus, utils]);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          >
            <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Booking Status</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Section */}
        <View style={[styles.searchCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.searchLabel, { color: colors.foreground }]}>
            Duffel Order ID
          </Text>
          <Text style={[styles.searchHint, { color: colors.muted }]}>
            Enter the Duffel Order ID to retrieve booking status from the airline system
          </Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              value={orderId}
              onChangeText={setOrderId}
              placeholder="e.g. ord_0000..."
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={lookupPnr}
            />
            <Pressable
              onPress={lookupPnr}
              disabled={loading}
              style={({ pressed }) => [
                styles.searchBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.8 },
                loading && { opacity: 0.6 },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <IconSymbol name="magnifyingglass" size={22} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.error + "15", borderColor: colors.error + "40" }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Retrieving order from Duffel...
            </Text>
          </View>
        )}

        {/* Order Data */}
        {orderData && !loading && (
          <View style={styles.resultContainer}>
            {/* Status Badge */}
            <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.statusRow}>
                <View>
                  <Text style={[styles.statusLabel, { color: colors.muted }]}>Booking Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(orderData.status, colors) + "20" }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(orderData.status, colors) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(orderData.status, colors) }]}>
                      {getStatusLabel(orderData.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.pnrBox}>
                  <Text style={[styles.pnrLabel, { color: colors.muted }]}>PNR</Text>
                  <Text style={[styles.pnrValue, { color: colors.primary }]}>
                    {orderData.pnr || "N/A"}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Order ID</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={1}>
                    {orderData.orderId}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Total Price</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {orderData.price?.currency} {orderData.price?.total}
                  </Text>
                </View>
              </View>

              {orderData.ticketingDeadline && (
                <View style={[styles.deadlineRow, { backgroundColor: colors.warning + "15" }]}>
                  <IconSymbol name="clock.fill" size={16} color={colors.warning} />
                  <Text style={[styles.deadlineText, { color: colors.warning }]}>
                    Ticketing Deadline: {formatDateTime(orderData.ticketingDeadline)}
                  </Text>
                </View>
              )}
            </View>

            {/* Travelers */}
            {orderData.travelers?.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Travelers ({orderData.travelers.length})
                </Text>
                {orderData.travelers.map((t: any, i: number) => (
                  <View key={i} style={[styles.travelerRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                    <IconSymbol name="person.fill" size={18} color={colors.primary} />
                    <View style={styles.travelerInfo}>
                      <Text style={[styles.travelerName, { color: colors.foreground }]}>
                        {t.firstName} {t.lastName}
                      </Text>
                      {t.dateOfBirth && (
                        <Text style={[styles.travelerDob, { color: colors.muted }]}>
                          DOB: {t.dateOfBirth}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Flight Segments */}
            {orderData.segments?.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Flight Segments ({orderData.segments.length})
                </Text>
                {orderData.segments.map((seg: any, i: number) => (
                  <View key={i} style={[styles.segmentCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.segmentHeader}>
                      <View style={styles.segmentAirline}>
                        <IconSymbol name="airplane" size={16} color={colors.primary} />
                        <Text style={[styles.segmentFlight, { color: colors.primary }]}>
                          {seg.carrierCode} {seg.number}
                        </Text>
                      </View>
                      {seg.aircraft && (
                        <Text style={[styles.segmentAircraft, { color: colors.muted }]}>
                          {seg.aircraft}
                        </Text>
                      )}
                    </View>

                    <View style={styles.segmentRoute}>
                      <View style={styles.segmentPoint}>
                        <Text style={[styles.segmentCode, { color: colors.foreground }]}>
                          {seg.departure.iataCode}
                        </Text>
                        <Text style={[styles.segmentTime, { color: colors.foreground }]}>
                          {formatTime(seg.departure.at)}
                        </Text>
                        <Text style={[styles.segmentDate, { color: colors.muted }]}>
                          {formatDate(seg.departure.at)}
                        </Text>
                        {seg.departure.terminal && (
                          <Text style={[styles.segmentTerminal, { color: colors.muted }]}>
                            T{seg.departure.terminal}
                          </Text>
                        )}
                      </View>

                      <View style={styles.segmentArrow}>
                        <View style={[styles.segmentLine, { backgroundColor: colors.border }]} />
                        <IconSymbol name="airplane" size={16} color={colors.primary} />
                        <View style={[styles.segmentLine, { backgroundColor: colors.border }]} />
                        {seg.duration && (
                          <Text style={[styles.segmentDuration, { color: colors.muted }]}>
                            {seg.duration.replace("PT", "").replace("H", "h ").replace("M", "m")}
                          </Text>
                        )}
                      </View>

                      <View style={styles.segmentPoint}>
                        <Text style={[styles.segmentCode, { color: colors.foreground }]}>
                          {seg.arrival.iataCode}
                        </Text>
                        <Text style={[styles.segmentTime, { color: colors.foreground }]}>
                          {formatTime(seg.arrival.at)}
                        </Text>
                        <Text style={[styles.segmentDate, { color: colors.muted }]}>
                          {formatDate(seg.arrival.at)}
                        </Text>
                        {seg.arrival.terminal && (
                          <Text style={[styles.segmentTerminal, { color: colors.muted }]}>
                            T{seg.arrival.terminal}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Associated Records */}
            {orderData.associatedRecords?.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Associated Records
                </Text>
                {orderData.associatedRecords.map((rec: any, i: number) => (
                  <View key={i} style={styles.recordRow}>
                    <Text style={[styles.recordRef, { color: colors.primary }]}>
                      {rec.reference}
                    </Text>
                    <Text style={[styles.recordSystem, { color: colors.muted }]}>
                      {rec.originSystemCode}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Ticketing Info */}
            {orderData.ticketing?.length > 0 && orderData.ticketing[0]?.number && (
              <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Ticket Information
                </Text>
                {orderData.ticketing.map((tk: any, i: number) => (
                  <View key={i} style={styles.ticketRow}>
                    <IconSymbol name="ticket.fill" size={18} color={colors.success} />
                    <View style={styles.ticketInfo}>
                      <Text style={[styles.ticketNumber, { color: colors.foreground }]}>
                        {tk.number || "Pending"}
                      </Text>
                      <Text style={[styles.ticketStatus, { color: colors.muted }]}>
                        {tk.status || "N/A"} {tk.dateOfIssuance ? `- ${tk.dateOfIssuance}` : ""}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Cancel Button */}
            {orderData.status !== "CANCELLED" && (
              <Pressable
                onPress={handleCancel}
                disabled={cancelling}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { backgroundColor: colors.error },
                  pressed && { opacity: 0.8 },
                  cancelling && { opacity: 0.6 },
                ]}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <IconSymbol name="xmark" size={20} color="#fff" />
                    <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                  </>
                )}
              </Pressable>
            )}

            {orderData.status === "CANCELLED" && (
              <View style={[styles.cancelledBanner, { backgroundColor: colors.error + "15", borderColor: colors.error + "40" }]}>
                <IconSymbol name="xmark" size={20} color={colors.error} />
                <Text style={[styles.cancelledText, { color: colors.error }]}>
                  This booking has been cancelled
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Empty State */}
        {!orderData && !loading && !error && (
          <View style={styles.emptyState}>
            <IconSymbol name="doc.text.magnifyingglass" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Check Booking Status
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>
              Enter a Duffel Order ID to retrieve the real-time booking status, flight details, and traveler information directly from the airline system.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700" },
  searchCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchLabel: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  searchHint: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  searchRow: { flexDirection: "row", gap: 10 },
  searchInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  searchBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: { fontSize: 14, flex: 1, lineHeight: 20 },
  loadingContainer: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14 },
  resultContainer: { gap: 14 },
  statusCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusLabel: { fontSize: 12, marginBottom: 6 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: "700" },
  pnrBox: { alignItems: "flex-end" },
  pnrLabel: { fontSize: 12, marginBottom: 4 },
  pnrValue: { fontSize: 20, fontWeight: "800", letterSpacing: 1 },
  divider: { height: 1, marginVertical: 14 },
  infoRow: { flexDirection: "row", gap: 16 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "600" },
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  deadlineText: { fontSize: 13, fontWeight: "500", flex: 1 },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  travelerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  travelerInfo: { flex: 1 },
  travelerName: { fontSize: 15, fontWeight: "600" },
  travelerDob: { fontSize: 13, marginTop: 2 },
  segmentCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  segmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  segmentAirline: { flexDirection: "row", alignItems: "center", gap: 6 },
  segmentFlight: { fontSize: 15, fontWeight: "700" },
  segmentAircraft: { fontSize: 12 },
  segmentRoute: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  segmentPoint: { alignItems: "center", width: 80 },
  segmentCode: { fontSize: 20, fontWeight: "800" },
  segmentTime: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  segmentDate: { fontSize: 11, marginTop: 2 },
  segmentTerminal: { fontSize: 11, marginTop: 2 },
  segmentArrow: { flex: 1, alignItems: "center", justifyContent: "center" },
  segmentLine: { width: 30, height: 1 },
  segmentDuration: { fontSize: 11, marginTop: 4 },
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  recordRef: { fontSize: 16, fontWeight: "700", letterSpacing: 1 },
  recordSystem: { fontSize: 13 },
  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  ticketInfo: { flex: 1 },
  ticketNumber: { fontSize: 15, fontWeight: "600" },
  ticketStatus: { fontSize: 13, marginTop: 2 },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  cancelBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelledText: { fontSize: 15, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});
