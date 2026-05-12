import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors, Spacing } from "../../../theme";
import type { FilterCategory } from "../../../hooks/useSearchFilters";

interface CategoryPickerProps {
  selected: FilterCategory;
  onSelect: (cat: FilterCategory) => void;
  rtl:      boolean;
  labels:   Record<FilterCategory, string>;
}

const CATEGORIES: FilterCategory[] = [
  "all", "meals", "bread_pastries", "groceries", "mixed",
];

export function CategoryPicker({ selected, onSelect, rtl, labels }: CategoryPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, rtl && styles.rowReverse]}
    >
      {CATEGORIES.map((cat) => {
        const active = selected === cat;
        return (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(cat)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {labels[cat]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  rowReverse: { flexDirection: "row-reverse" },
  chip: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
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
