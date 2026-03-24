import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useColors } from "@/hooks/use-colors";

interface DatePickerFieldProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  /** إذا كان true يُظهر الحقل كزر بدون label خارجي */
  compact?: boolean;
  /** لون الخلفية للزر */
  backgroundColor?: string;
  /** لون النص */
  textColor?: string;
  /** أيقونة اختيارية تُعرض على اليسار */
  icon?: React.ReactNode;
}

/**
 * حقل اختيار تاريخ يستخدم DateTimePicker الأصلي.
 * على iOS يُظهر modal بتقويم spinner.
 * على Android يُظهر dialog أصلي.
 * على الويب يُظهر input[type=date].
 */
export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "اختر تاريخاً",
  minimumDate,
  maximumDate,
  compact = false,
  backgroundColor,
  textColor,
  icon,
}: DatePickerFieldProps) {
  const colors = useColors();
  const [show, setShow] = useState(false);

  // تحويل النص إلى Date
  const dateValue = value ? new Date(value) : new Date();

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      onChange(`${y}-${m}-${d}`);
    }
  };

  const handleConfirmIOS = () => {
    setShow(false);
  };

  const displayText = value
    ? new Date(value).toLocaleDateString("ar-MA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : placeholder;

  const bg = backgroundColor ?? colors.surface;
  const fg = value ? (textColor ?? colors.foreground) : colors.muted;

  // ===== Web fallback =====
  if (Platform.OS === "web") {
    return (
      <View style={compact ? undefined : styles.fieldWrapper}>
        {label && !compact && (
          <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
        )}
        <View
          style={[
            styles.webWrapper,
            { backgroundColor: bg, borderColor: colors.border },
          ]}
        >
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <input
            type="date"
            value={value}
            min={minimumDate?.toISOString().split("T")[0]}
            max={maximumDate?.toISOString().split("T")[0]}
            onChange={(e) => onChange(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              color: fg,
              fontSize: 14,
              outline: "none",
              fontFamily: "inherit",
              direction: "rtl",
            }}
          />
        </View>
      </View>
    );
  }

  // ===== Native =====
  return (
    <View style={compact ? undefined : styles.fieldWrapper}>
      {label && !compact && (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      )}

      {/* زر فتح التقويم */}
      <Pressable
        onPress={() => setShow(true)}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: bg,
            borderColor: colors.border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <Text style={[styles.buttonText, { color: fg }]} numberOfLines={1}>
          {displayText}
        </Text>
        <Text style={[styles.chevron, { color: colors.muted }]}>▼</Text>
      </Pressable>

      {/* Android: dialog مباشر */}
      {Platform.OS === "android" && show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="calendar"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {/* iOS: modal مع spinner */}
      {Platform.OS === "ios" && (
        <Modal
          visible={show}
          transparent
          animationType="slide"
          onRequestClose={() => setShow(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalSheet,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {/* Header */}
              <View
                style={[styles.modalHeader, { borderBottomColor: colors.border }]}
              >
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={[styles.modalCancel, { color: colors.muted }]}>
                    إلغاء
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {label ?? "اختر تاريخاً"}
                </Text>
                <TouchableOpacity onPress={handleConfirmIOS}>
                  <Text style={[styles.modalDone, { color: colors.primary }]}>
                    تأكيد
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Picker */}
              <DateTimePicker
                value={dateValue}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                locale="ar"
                style={{ width: "100%", height: 200 }}
                textColor={colors.foreground}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  buttonText: {
    flex: 1,
    fontSize: 14,
  },
  chevron: {
    fontSize: 10,
  },
  iconWrap: {
    width: 20,
    alignItems: "center",
  },
  // Modal iOS
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalCancel: {
    fontSize: 15,
  },
  modalDone: {
    fontSize: 15,
    fontWeight: "700",
  },
  // Web
  webWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
});
