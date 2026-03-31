// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "map.fill": "explore",
  "calendar.badge.checkmark": "event-available",
  "person.fill": "person",
  "magnifyingglass": "search",
  "airplane": "flight",
  "building.2.fill": "hotel",
  "star.fill": "star",
  "location.fill": "location-on",
  "clock.fill": "access-time",
  "arrow.right": "arrow-forward",
  "xmark": "close",
  "checkmark.circle.fill": "check-circle",
  "creditcard.fill": "credit-card",
  "doc.text.fill": "description",
  "bell.fill": "notifications",
  "gear": "settings",
  "arrow.left": "arrow-back",
  "slider.horizontal.3": "tune",
  "arrow.up.arrow.down": "swap-vert",
  "wifi": "wifi",
  "fork.knife": "restaurant",
  "figure.pool.swim": "pool",
  "dumbbell.fill": "fitness-center",
  "car.fill": "directions-car",
  "person.2.fill": "group",
  "minus.circle.fill": "remove-circle",
  "plus.circle.fill": "add-circle",
  "xmark.circle.fill": "cancel",
  "qrcode": "qr-code",
  "square.and.arrow.up": "share",
  "trash.fill": "delete",
  "pencil": "edit",
  "phone.fill": "phone",
  "envelope.fill": "email",
  "globe": "language",
  "moon.fill": "dark-mode",
  "sun.max.fill": "light-mode",
  "info.circle.fill": "info",
  "shield.fill": "security",
  "heart.fill": "favorite",
  "tag.fill": "local-offer",
  "figure.and.child.holdinghands": "family-restroom",
  "airplane.arrival": "flight-land",
  "airplane.departure": "flight-takeoff",
  "arrow.2.squarepath": "sync",
  "calendar": "calendar-today",
  "chart.bar.fill": "bar-chart",
  "person.3.fill": "groups",
  "checkmark.seal.fill": "verified",
  "arrow.down.circle.fill": "download",
  "ticket.fill": "confirmation-number",
  "building.columns.fill": "account-balance",
  "crown.fill": "workspace-premium",
  "mic.fill": "mic",
  "stop.fill": "stop",
  "waveform": "graphic-eq",
  "camera.fill": "camera-alt",
  "photo.fill": "photo",
  "eye.fill": "visibility",
  "flame.fill": "local-fire-department",
  "percent": "percent",
  "timer": "timer",
  "bolt.fill": "bolt",
  "mappin.and.ellipse": "pin-drop",
  "airplane.circle.fill": "connecting-airports",
  "exclamationmark.triangle.fill": "warning",
  "door.left.hand.open": "meeting-room",
  "chair.fill": "event-seat",
  "paperclip": "attach-file",
  "person.badge.clock": "how-to-reg",
  "rectangle.portrait.and.arrow.right": "login",
  "hand.raised.fill": "pan-tool",
  "number": "tag",
  "bell.badge.fill": "notifications-active",
  "arrow.up.circle.fill": "upgrade",
  "sparkles": "auto-awesome",
  "list.bullet.clipboard": "checklist",
  "takeoutbag.and.cup.and.straw.fill": "lunch-dining",
  "leaf.fill": "eco",
  "checkmark.shield.fill": "verified-user",
  "suitcase.fill": "luggage",
  "doc.text.magnifyingglass": "find-in-page",
  "repeat": "replay",
  "doc.badge.plus": "note-add",
  "heart.text.square.fill": "health-and-safety",
  "person.text.rectangle.fill": "badge",
  "drop.fill": "water-drop",
  "tshirt.fill": "checkroom",
  "pills.fill": "medication",
  "cross.case.fill": "medical-services",
  "lightbulb.fill": "lightbulb",
  "banknote.fill": "payments",
  "bag.fill": "shopping-bag",
  "checkmark": "check",
  "building.fill": "business",
  "link": "link",
  "chart.line.uptrend.xyaxis": "trending-up",
  "calendar.badge.clock": "pending-actions",
  "doc.richtext": "article",
  "tv": "tv",
  "dollarsign.circle.fill": "attach-money",
  "briefcase.fill": "work",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
