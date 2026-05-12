import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors, Spacing } from "../../../theme";
import type { FilterFreshness } from "../../../hooks/useSearchFilters";

interface FreshnessPickerProps {
  selected: FilterFreshness[];
  onToggle: (freshness: FilterFreshness) => void;
  rtl:      boolean;
  labels:   Record<FilterFreshness, string>;
}

const ITEMS: { key: FilterFreshness; emoji: string }[] = [
  { key: "eat_today",    emoji: "🟢" },
  { key: "fresh_tonight", emoji: "🟡" },
  { key: "good_1_2_days", emoji: "🔵" },
];

export function FreshnessPicker({ selected, onToggle, rtl, labels }: FreshnessPickerProps) {
  return (
    <View style={[styles.row, rtl && styles.rowReverse]}>
      {ITEMS.map(({ key, emoji }) => {
        const active = selected.includes(key);
        return (
          <TouchableOpacity
            key={key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(key)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {labels[key]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  rowReverse: { flexDirection: "row-reverse" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.primaryOrange,
    borderColor: Colors.primaryOrange,
  },
  emoji: { fontSize: 13 },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.grayDark,
  },
  chipTextActive: { color: Colors.white },
});
