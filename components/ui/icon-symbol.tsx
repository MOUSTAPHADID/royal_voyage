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
