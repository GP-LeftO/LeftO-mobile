import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { Colors } from "../../theme";
import { isRTL } from "../../i18n";

interface StepIndicatorProps {
  current: number;
  total: number;
}

export default function StepIndicator({ current, total }: StepIndicatorProps) {
  const rtl = isRTL();

  const segments = Array.from({ length: total }).map((_, i) => {
    const filled = rtl ? i >= total - current : i < current;
    const isEdge = rtl ? i === total - current : i === current - 1;
    return { filled, isEdge };
  });

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {segments.map(({ filled, isEdge }, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              filled && styles.segmentFilled,
              isEdge && styles.segmentActive,
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, rtl && styles.rtlLabel]}>
        {rtl ? `${current} من ${total}` : `${current} of ${total}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  track: { flexDirection: "row", gap: 4 },
  segment: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: "#E5E7EB",
  },
  segmentFilled: { backgroundColor: Colors.primaryOrange },
  segmentActive: { backgroundColor: Colors.primaryOrange },
  label: { fontSize: 12, fontWeight: "600", color: Colors.grayMedium },
  rtlLabel: { textAlign: "right" },
});
