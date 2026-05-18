import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Colors, Spacing } from "../../theme";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

export default function Chip({ label, selected, onPress, testID }: ChipProps) {
  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 100,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
  },
  chipSelected: {
    backgroundColor: Colors.primaryOrange,
    borderColor: Colors.primaryOrange,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.grayMedium,
  },
  labelSelected: {
    color: Colors.white,
  },
});
