import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors } from "../../../theme";
import type { FilterRadius } from "../../../hooks/useSearchFilters";

interface RadiusSelectorProps {
  selected: FilterRadius;
  onSelect: (radius: FilterRadius) => void;
  rtl:      boolean;
  labels:   Record<FilterRadius, string>;
}

const OPTIONS: FilterRadius[] = [1000, 5000, 10000];

export function RadiusSelector({ selected, onSelect, rtl, labels }: RadiusSelectorProps) {
  return (
    <View style={[styles.container, rtl && styles.containerReverse]}>
      {OPTIONS.map((opt, idx) => {
        const active   = selected === opt;
        const isFirst  = idx === 0;
        const isLast   = idx === OPTIONS.length - 1;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              styles.segment,
              active  && styles.segmentActive,
              isFirst && styles.segmentFirst,
              isLast  && styles.segmentLast,
            ]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {labels[opt]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    overflow: "hidden",
  },
  containerReverse: { flexDirection: "row-reverse" },
  segment: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.grayLight,
  },
  segmentFirst: { borderLeftWidth: 0 },
  segmentLast:  { borderRightWidth: 0 },
  segmentActive: { backgroundColor: Colors.primaryOrange },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.grayDark,
  },
  segmentTextActive: { color: Colors.white },
});
