import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors, Spacing } from "../../../theme";
import type { FilterSortBy } from "../../../hooks/useSearchFilters";

interface SortOptionsProps {
  selected: FilterSortBy;
  onSelect: (sort: FilterSortBy) => void;
  rtl:      boolean;
  labels:   Record<FilterSortBy, string>;
}

const OPTIONS: FilterSortBy[] = ["distance", "price", "rating"];

export function SortOptions({ selected, onSelect, rtl, labels }: SortOptionsProps) {
  return (
    <View style={[styles.row, rtl && styles.rowReverse]}>
      {OPTIONS.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {labels[opt]}
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
    gap: Spacing.xs,
  },
  rowReverse: { flexDirection: "row-reverse" },
  chip: {
    flex: 1,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    paddingVertical: 9,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.primaryOrange,
    borderColor: Colors.primaryOrange,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.grayDark,
  },
  chipTextActive: { color: Colors.white },
});
