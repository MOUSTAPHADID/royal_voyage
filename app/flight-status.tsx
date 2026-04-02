import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";

// ── Flight Status Types ──
type FlightPhase = "scheduled" | "check_in" | "boarding" | "departed" | "in_flight" | "landed" | "arrived";
type FlightStatusType = "on_time" | "delayed" | "cancelled" | "diverted";

interface FlightStatusData {
  status: FlightStatusType;
  phase: FlightPhase;
  gate?: string;
  terminal?: string;
  seat?: string;
  delayMinutes?: number;
  scheduledDeparture: string;
  actualDeparture?: string;
  scheduledArrival: string;
  actualArrival?: string;
  airline: string;
  flightNumber: string;
  originCode: string;
  origin: string;
  destinationCode: string;
  destination: string;
  aircraftType?: string;
  lastUpdated: string;
}

// ── Timeline Phases ──
const TIMELINE_PHASES: { key: FlightPhase; label: string; iconName: string }[] = [
  { key: "scheduled", label: "مجدول", iconName: "calendar" },
  { key: "check_in", label: "تسجيل الوصول", iconName: "person.badge.key.fill" },
  { key: "boarding", label: "الصعود", iconName: "figure.walk" },
  { key: "departed", label: "الإقلاع", iconName: "airplane.departure" },
  { key: "in_flight", label: "في الجو", iconName: "airplane" },
  { key: "landed", label: "الهبوط", iconName: "airplane.arrival" },
  { key: "arrived", label: "الوصول", iconName: "checkmark.circle.fill" },
];

function getPhaseIndex(phase: FlightPhase): number {
  return TIMELINE_PHASES.findIndex((p) => p.key === phase);
}

// ── Simulated Flight Status ──
// In a real app, this would call an API like FlightAware or AviationStack
function simulateFlightStatus(booking: any): FlightStatusData {
  const now = new Date();
  const bookingDate = new Date(booking.date);
  const flight = booking.flight;

  if (!flight) {
    return {
      status: "on_time",
      phase: "scheduled",
      scheduledDeparture: booking.date,
      scheduledArrival: booking.date,
      airline: "Unknown",
      flightNumber: "---",
      originCode: "---",
      origin: "Unknown",
      destinationCode: "---",
      destination: "Unknown",
      lastUpdated: now.toISOString(),
    };
  }

  // Determine phase based on time difference
  const depTime = new Date(bookingDate);
  const [depH, depM] = (flight.departureTime || "00:00").split(":").map(Number);
  depTime.setHours(depH || 0, depM || 0, 0, 0);

  const arrTime = new Date(bookingDate);
  const [arrH, arrM] = (flight.arrivalTime || "23:59").split(":").map(Number);
  arrTime.setHours(arrH || 23, arrM || 59, 0, 0);
  if (arrTime <= depTime) arrTime.setDate(arrTime.getDate() + 1);

  const diffToDep = depTime.getTime() - now.getTime();
  const diffToArr = arrTime.getTime() - now.getTime();
  const flightDuration = arrTime.getTime() - depTime.getTime();

  let phase: FlightPhase = "scheduled";
  let status: FlightStatusType = "on_time";
  let delayMinutes: number | undefined;

  // Simulate random gate and terminal
  const gates = ["A1", "A2", "A3", "B1", "B2", "B4", "C1", "C3", "D2", "D5"];
  const terminals = ["1", "2", "3"];
  const gate = gates[Math.abs(flight.flightNumber?.charCodeAt(3) || 0) % gates.length];
  const terminal = terminals[Math.abs(flight.flightNumber?.charCodeAt(4) || 0) % terminals.length];

  // Simulate delay (20% chance)
  const hasDelay = (flight.flightNumber?.charCodeAt(2) || 0) % 5 === 0;
  if (hasDelay) {
    status = "delayed";
    delayMinutes = 15 + ((flight.flightNumber?.charCodeAt(3) || 0) % 45);
  }

  if (diffToDep > 24 * 3600000) {
    phase = "scheduled";
  } else if (diffToDep > 3 * 3600000) {
    phase = "scheduled";
  } else if (diffToDep > 1.5 * 3600000) {
    phase = "check_in";
  } else if (diffToDep > 30 * 60000) {
    phase = "boarding";
  } else if (diffToDep > 0) {
    phase = "departed";
  } else if (diffToArr > 0) {
    const elapsed = now.getTime() - depTime.getTime();
    const progress = elapsed / flightDuration;
    phase = progress < 0.9 ? "in_flight" : "landed";
  } else {
    phase = "arrived";
    status = "on_time";
    delayMinutes = undefined;
  }

  return {
    status,
    phase,
    gate,
    terminal,
    seat: `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`,
    delayMinutes,
    scheduledDeparture: depTime.toISOString(),
    actualDeparture: hasDelay
      ? new Date(depTime.getTime() + (delayMinutes || 0) * 60000).toISOString()
      : depTime.toISOString(),
    scheduledArrival: arrTime.toISOString(),
    actualArrival: hasDelay
      ? new Date(arrTime.getTime() + (delayMinutes || 0) * 60000).toISOString()
      : arrTime.toISOString(),
    airline: flight.airline || "Unknown",
    flightNumber: flight.flightNumber || "---",
    originCode: flight.originCode || "---",
    origin: flight.origin || "Unknown",
    destinationCode: flight.destinationCode || "---",
    destination: flight.destination || "Unknown",
    aircraftType: "Boeing 737-800",
    lastUpdated: now.toISOString(),
  };
}

// ── Status Badge ──
function StatusBadge({ status, delayMinutes }: { status: FlightStatusType; delayMinutes?: number }) {
  const colors = useColors();
  const config: Record<FlightStatusType, { bg: string; text: string; label: string; iconName: string }> = {
    on_time: { bg: colors.success + "15", text: colors.success, label: "في الموعد", iconName: "checkmark.circle.fill" },
    delayed: { bg: colors.warning + "15", text: colors.warning, label: `تأخير ${delayMinutes || 0} دقيقة`, iconName: "exclamationmark.triangle.fill" },
    cancelled: { bg: colors.error + "15", text: colors.error, label: "ملغاة", iconName: "xmark.circle.fill" },
    diverted: { bg: "#3B82F615", text: "#3B82F6", label: "محوّلة", iconName: "arrow.uturn.right.circle.fill" },
  };
  const c = config[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: c.bg, borderColor: c.text + "30" }]}>
      <IconSymbol name={c.iconName as any} size={16} color={c.text} />
      <Text style={[styles.statusBadgeText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

// ── Timeline Component ──
function FlightTimeline({ currentPhase, status }: { currentPhase: FlightPhase; status: FlightStatusType }) {
  const colors = useColors();
  const currentIdx = getPhaseIndex(currentPhase);

  return (
    <View style={styles.timeline}>
      {TIMELINE_PHASES.map((phase, idx) => {
        const isCompleted = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        const isLast = idx === TIMELINE_PHASES.length - 1;
        const dotColor = status === "cancelled"
          ? colors.error
          : isCompleted
            ? colors.success
            : colors.border;
        const lineColor = status === "cancelled"
          ? colors.error + "30"
          : idx < currentIdx
            ? colors.success
            : colors.border;

        return (
          <View key={phase.key} style={styles.timelineItem}>
            <View style={styles.timelineDotCol}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor: dotColor,
                    borderColor: isCurrent ? colors.primary : "transparent",
                    borderWidth: isCurrent ? 2 : 0,
                    width: isCurrent ? 28 : 20,
                    height: isCurrent ? 28 : 20,
                    borderRadius: isCurrent ? 14 : 10,
                  },
                ]}
              >
                <IconSymbol name={phase.iconName as any} size={isCurrent ? 14 : 10} color="#FFFFFF" />
              </View>
              {!isLast && (
                <View style={[styles.timelineLine, { backgroundColor: lineColor }]} />
              )}
            </View>
            <View style={[styles.timelineLabel, { opacity: isCompleted ? 1 : 0.5 }]}>
              <Text style={[styles.timelineLabelText, { color: colors.foreground, fontWeight: isCurrent ? "700" : "500" }]}>
                {phase.label}
              </Text>
              {isCurrent && (
                <View style={[styles.currentBadge, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.currentBadgeText, { color: colors.primary }]}>الحالي</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Main Screen ──
export default function FlightStatusScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings } = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [statusData, setStatusData] = useState<FlightStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const booking = bookings.find((b) => b.id === id);

  useEffect(() => {
    if (!booking || booking.type !== "flight") {
      setLoading(false);
      return;
    }
    // Simulate API call delay
    const timer = setTimeout(() => {
      const data = simulateFlightStatus(booking);
      setStatusData(data);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [booking]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!booking || booking.type !== "flight") return;
    const interval = setInterval(() => {
      const data = simulateFlightStatus(booking);
      setStatusData(data);
    }, 30000);
    return () => clearInterval(interval);
  }, [booking]);

  if (!booking || booking.type !== "flight") {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>تتبع الرحلة</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <IconSymbol name="airplane" size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, marginTop: 12, fontSize: 15 }}>لا توجد بيانات رحلة</Text>
        </View>
      </ScreenContainer>
    );
  }

  const formatTime = (iso?: string) => {
    if (!iso) return "--:--";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>تتبع الرحلة</Text>
          <Text style={styles.headerSub}>حالة الرحلة</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>جاري تحميل حالة الرحلة...</Text>
        </View>
      ) : statusData ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Status Badge */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <StatusBadge status={statusData.status} delayMinutes={statusData.delayMinutes} />
          </View>

          {/* Flight Route Card */}
          <View style={[styles.routeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.routeHeader}>
              <IconSymbol name="airplane" size={22} color={colors.primary} />
              <Text style={[styles.flightNum, { color: colors.primary }]}>
                {statusData.airline} · {statusData.flightNumber}
              </Text>
            </View>

            <View style={styles.routeBody}>
              <View style={styles.routePoint}>
                <Text style={[styles.routeTime, { color: colors.foreground }]}>
                  {formatTime(statusData.scheduledDeparture)}
                </Text>
                {statusData.status === "delayed" && statusData.actualDeparture && (
                  <Text style={[styles.routeTimeActual, { color: colors.warning }]}>
                    {formatTime(statusData.actualDeparture)}
                  </Text>
                )}
                <Text style={[styles.routeCode, { color: colors.primary }]}>{statusData.originCode}</Text>
                <Text style={[styles.routeCity, { color: colors.muted }]}>{statusData.origin}</Text>
              </View>

              <View style={styles.routeCenter}>
                <View style={styles.routeLineContainer}>
                  <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                  <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
                  <IconSymbol name="airplane" size={16} color={colors.primary} />
                  <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
                  <View style={[styles.routeDot, { backgroundColor: colors.secondary }]} />
                </View>
              </View>

              <View style={[styles.routePoint, { alignItems: "flex-end" }]}>
                <Text style={[styles.routeTime, { color: colors.foreground }]}>
                  {formatTime(statusData.scheduledArrival)}
                </Text>
                {statusData.status === "delayed" && statusData.actualArrival && (
                  <Text style={[styles.routeTimeActual, { color: colors.warning }]}>
                    {formatTime(statusData.actualArrival)}
                  </Text>
                )}
                <Text style={[styles.routeCode, { color: colors.secondary }]}>{statusData.destinationCode}</Text>
                <Text style={[styles.routeCity, { color: colors.muted }]}>{statusData.destination}</Text>
              </View>
            </View>
          </View>

          {/* Gate & Terminal Info */}
          <View style={styles.infoGrid}>
            <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="door.left.hand.open" size={24} color={colors.primary} />
              <Text style={[styles.infoBoxLabel, { color: colors.muted }]}>البوابة</Text>
              <Text style={[styles.infoBoxValue, { color: colors.foreground }]}>{statusData.gate || "---"}</Text>
            </View>
            <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="building.2.fill" size={24} color={colors.primary} />
              <Text style={[styles.infoBoxLabel, { color: colors.muted }]}>الصالة</Text>
              <Text style={[styles.infoBoxValue, { color: colors.foreground }]}>T{statusData.terminal || "-"}</Text>
            </View>
            <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="chair.fill" size={24} color={colors.primary} />
              <Text style={[styles.infoBoxLabel, { color: colors.muted }]}>المقعد</Text>
              <Text style={[styles.infoBoxValue, { color: colors.foreground }]}>{statusData.seat || "---"}</Text>
            </View>
          </View>

          {/* Flight Timeline */}
          <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>مراحل الرحلة</Text>
            <FlightTimeline currentPhase={statusData.phase} status={statusData.status} />
          </View>

          {/* Aircraft Info */}
          <View style={[styles.aircraftCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>معلومات الطائرة</Text>
            <View style={styles.aircraftRow}>
              <Text style={[styles.aircraftLabel, { color: colors.muted }]}>نوع الطائرة</Text>
              <Text style={[styles.aircraftValue, { color: colors.foreground }]}>{statusData.aircraftType || "---"}</Text>
            </View>
            <View style={styles.aircraftRow}>
              <Text style={[styles.aircraftLabel, { color: colors.muted }]}>رقم الرحلة</Text>
              <Text style={[styles.aircraftValue, { color: colors.foreground }]}>{statusData.flightNumber}</Text>
            </View>
            <View style={styles.aircraftRow}>
              <Text style={[styles.aircraftLabel, { color: colors.muted }]}>شركة الطيران</Text>
              <Text style={[styles.aircraftValue, { color: colors.foreground }]}>{statusData.airline}</Text>
            </View>
          </View>

          {/* Last Updated */}
          <View style={styles.lastUpdated}>
            <IconSymbol name="arrow.2.squarepath" size={14} color={colors.muted} />
            <Text style={[styles.lastUpdatedText, { color: colors.muted }]}>
              آخر تحديث: {new Date(statusData.lastUpdated).toLocaleTimeString("ar-MR", { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Text style={[styles.lastUpdatedHint, { color: colors.muted }]}>
              يتم التحديث تلقائياً كل 30 ثانية
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <IconSymbol name="airplane" size={48} color={colors.muted} />
          <Text style={{ color: colors.muted, marginTop: 12 }}>لا توجد بيانات حالة</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 16, fontWeight: "700" },
  routeCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  flightNum: { fontSize: 16, fontWeight: "700" },
  routeBody: {
    flexDirection: "row",
    alignItems: "center",
  },
  routePoint: { minWidth: 80 },
  routeTime: { fontSize: 22, fontWeight: "700" },
  routeTimeActual: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  routeCode: { fontSize: 14, fontWeight: "700", marginTop: 4 },
  routeCity: { fontSize: 12, marginTop: 2 },
  routeCenter: { flex: 1, alignItems: "center" },
  routeLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 4,
  },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeLine: { flex: 1, height: 1.5 },
  infoGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
  infoBox: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  infoBoxLabel: { fontSize: 11, fontWeight: "600" },
  infoBoxValue: { fontSize: 20, fontWeight: "800" },
  timelineCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  timeline: { gap: 0 },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineDotCol: {
    alignItems: "center",
    width: 32,
  },
  timelineDot: {
    justifyContent: "center",
    alignItems: "center",
  },
  timelineLine: {
    width: 2,
    height: 28,
  },
  timelineLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 8,
    paddingBottom: 12,
  },
  timelineLabelText: { fontSize: 14 },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: { fontSize: 10, fontWeight: "700" },
  aircraftCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  aircraftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E1E4E820",
  },
  aircraftLabel: { fontSize: 13 },
  aircraftValue: { fontSize: 13, fontWeight: "600" },
  lastUpdated: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
  },
  lastUpdatedText: { fontSize: 12 },
  lastUpdatedHint: { fontSize: 10 },
});
