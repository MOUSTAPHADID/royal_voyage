import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";

type LocationSuggestion = {
  name: string;
  iataCode: string;
  cityName: string;
  countryName: string;
  type: "AIRPORT" | "CITY";
};

type Props = {
  label: string;
  placeholder: string;
  value: string;
  iataCode: string;
  onSelect: (name: string, iataCode: string) => void;
  iconName?: "airplane" | "location.fill";
};

export function LocationAutocomplete({
  label,
  placeholder,
  value,
  iataCode,
  onSelect,
  iconName = "location.fill",
}: Props) {
  const colors = useColors();
  const [query, setQuery] = useState(value);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  const { data: suggestions = [], isFetching } = trpc.amadeus.searchLocations.useQuery(
    { keyword: debouncedKeyword },
    { enabled: debouncedKeyword.length >= 2 }
  );

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(text);
    }, 350);
  }, []);

  const handleSelect = (item: LocationSuggestion) => {
    const displayName = `${item.cityName || item.name} (${item.iataCode})`;
    setQuery(displayName);
    onSelect(item.cityName || item.name, item.iataCode);
    setModalVisible(false);
    setSearchText("");
    setDebouncedKeyword("");
  };

  const openModal = () => {
    setSearchText(iataCode ? "" : query.replace(/\s*\(.*\)/, ""));
    setDebouncedKeyword(iataCode ? "" : query.replace(/\s*\(.*\)/, ""));
    setModalVisible(true);
  };

  return (
    <>
      <Pressable
        style={[styles.field, { borderColor: colors.border, backgroundColor: colors.background }]}
        onPress={openModal}
      >
        <IconSymbol name={iconName} size={18} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text>
          <Text
            style={[
              styles.fieldValue,
              { color: value ? colors.foreground : colors.muted },
            ]}
            numberOfLines={1}
          >
            {value ? `${value} (${iataCode})` : placeholder}
          </Text>
        </View>
        {iataCode ? (
          <View style={[styles.iataTag, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.iataText, { color: colors.primary }]}>{iataCode}</Text>
          </View>
        ) : null}
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Select {label}
            </Text>
            <Pressable onPress={() => setModalVisible(false)}>
              <IconSymbol name="xmark" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {/* Search Input */}
          <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search city or airport..."
              placeholderTextColor={colors.muted}
              value={searchText}
              onChangeText={handleSearchChange}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isFetching && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          {/* Results */}
          <FlatList
            data={suggestions as LocationSuggestion[]}
            keyExtractor={(item) => `${item.iataCode}-${item.type}`}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              debouncedKeyword.length >= 2 && !isFetching ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    No results for "{debouncedKeyword}"
                  </Text>
                </View>
              ) : debouncedKeyword.length < 2 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    Type at least 2 characters to search
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.resultItem,
                  { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => handleSelect(item)}
              >
                <View style={[styles.typeIcon, { backgroundColor: colors.primary + "15" }]}>
                  <IconSymbol
                    name={item.type === "AIRPORT" ? "airplane" : "location.fill"}
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultName, { color: colors.foreground }]}>
                    {item.cityName || item.name}
                  </Text>
                  <Text style={[styles.resultDetail, { color: colors.muted }]}>
                    {item.type === "AIRPORT" ? item.name + " · " : ""}
                    {item.countryName}
                  </Text>
                </View>
                <View style={[styles.iataTag, { backgroundColor: colors.secondary + "20" }]}>
                  <Text style={[styles.iataText, { color: colors.secondary }]}>
                    {item.iataCode}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  iataTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  iataText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  resultName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  resultDetail: {
    fontSize: 13,
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
});
