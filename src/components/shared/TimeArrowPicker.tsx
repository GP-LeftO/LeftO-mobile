import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeArrowPickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  label: string;
  minTime?: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MINUTE_STEPS = [0, 15, 30, 45];

function snapToStep(m: number): number {
  return MINUTE_STEPS.reduce((prev, curr) =>
    Math.abs(curr - m) < Math.abs(prev - m) ? curr : prev
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimeArrowPicker({ value, onChange, label }: TimeArrowPickerProps) {
  const rtl = isRTL();

  const [hours,   setHours]   = useState<number>(() =>
    value ? value.getHours() : (new Date().getHours() + 1) % 24
  );
  const [minutes, setMinutes] = useState<number>(() =>
    value ? snapToStep(value.getMinutes()) : 0
  );

  // Sync when value prop changes from parent
  useEffect(() => {
    if (value) {
      setHours(value.getHours());
      setMinutes(snapToStep(value.getMinutes()));
    }
  }, [value]);

  const notify = (h: number, m: number) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    onChange(d);
  };

  const incrementHour = () => {
    const h = (hours + 1) % 24;
    setHours(h);
    notify(h, minutes);
  };

  const decrementHour = () => {
    const h = (hours - 1 + 24) % 24;
    setHours(h);
    notify(h, minutes);
  };

  const incrementMinute = () => {
    const idx = MINUTE_STEPS.indexOf(minutes);
    const m = MINUTE_STEPS[(idx + 1) % MINUTE_STEPS.length];
    setMinutes(m);
    notify(hours, m);
  };

  const decrementMinute = () => {
    const idx = MINUTE_STEPS.indexOf(minutes);
    const m = MINUTE_STEPS[(idx - 1 + MINUTE_STEPS.length) % MINUTE_STEPS.length];
    setMinutes(m);
    notify(hours, m);
  };

  const toggleAmPm = () => {
    const h = hours < 12 ? hours + 12 : hours - 12;
    setHours(h);
    notify(h, minutes);
  };

  const formatHour = (h: number): string => {
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return String(h12).padStart(2, "0");
  };

  const formatMinute = (m: number): string => String(m).padStart(2, "0");

  const HIT = { top: 12, bottom: 12, left: 12, right: 12 };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, rtl && styles.rtl]}>{label}</Text>
      <View style={styles.pickerRow}>

        {/* Hours column */}
        <View style={styles.column}>
          <TouchableOpacity style={styles.chevronBtn} onPress={incrementHour} hitSlop={HIT}>
            <Feather name="chevron-up" size={24} color={Colors.primaryOrange} />
          </TouchableOpacity>
          <Text style={styles.timeText}>{formatHour(hours)}</Text>
          <TouchableOpacity style={styles.chevronBtn} onPress={decrementHour} hitSlop={HIT}>
            <Feather name="chevron-down" size={24} color={Colors.primaryOrange} />
          </TouchableOpacity>
          <Text style={styles.unitLabel}>ساعة</Text>
        </View>

        <Text style={styles.colon}>:</Text>

        {/* Minutes column */}
        <View style={styles.column}>
          <TouchableOpacity style={styles.chevronBtn} onPress={incrementMinute} hitSlop={HIT}>
            <Feather name="chevron-up" size={24} color={Colors.primaryOrange} />
          </TouchableOpacity>
          <Text style={styles.timeText}>{formatMinute(minutes)}</Text>
          <TouchableOpacity style={styles.chevronBtn} onPress={decrementMinute} hitSlop={HIT}>
            <Feather name="chevron-down" size={24} color={Colors.primaryOrange} />
          </TouchableOpacity>
          <Text style={styles.unitLabel}>دقيقة</Text>
        </View>

        {/* AM / PM toggle */}
        <TouchableOpacity style={styles.ampmButton} onPress={toggleAmPm} activeOpacity={0.8}>
          <Text style={styles.ampmText}>{hours < 12 ? "ص" : "م"}</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.grayDark,
    marginBottom: 12,
  },
  rtl: { textAlign: "right" },

  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  column: {
    width: 64,
    alignItems: "center",
    gap: 4,
  },

  chevronBtn: { padding: 8 },

  timeText: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.grayDark,
    textAlign: "center",
    width: 64,
  },

  unitLabel: {
    fontSize: 11,
    color: Colors.grayMedium,
    marginTop: 2,
  },

  colon: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.grayMedium,
    marginBottom: 20,
  },

  ampmButton: {
    backgroundColor: "#FFE8D6",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    minWidth: 44,
  },

  ampmText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primaryOrange,
  },
});
