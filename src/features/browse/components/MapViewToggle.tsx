import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  I18nManager,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../../../theme";
import { t } from "../../../i18n";
import type { ViewMode } from "../types/browse.types";

// Width of each pill option (List | Map)
const OPTION_W = 88;

interface MapViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function MapViewToggle({ value, onChange }: MapViewToggleProps) {
  const tr = t().browse;
  const rtl = I18nManager.isRTL;

  const slideAnim = useRef(
    new Animated.Value(value === "list" ? 0 : 1),
  ).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: value === "list" ? 0 : 1,
      useNativeDriver: true,
      tension: 130,
      friction: 11,
    }).start();
  }, [value, slideAnim]);

  // RTL: "Map" option is on the left, "List" on the right — flip the slider direction
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: rtl ? [OPTION_W, 0] : [0, OPTION_W],
  });

  const listActive = value === "list";
  const mapActive = value === "map";

  return (
    <View style={styles.track}>
      {/* Sliding active indicator */}
      <Animated.View
        style={[styles.slider, { transform: [{ translateX }] }]}
      />

      {/* List option — rendered first (left in LTR, right in RTL) */}
      <TouchableOpacity
        style={styles.option}
        onPress={() => onChange("list")}
        activeOpacity={0.85}
      >
        <Feather
          name="list"
          size={14}
          color={listActive ? Colors.white : Colors.grayMedium}
        />
        <Text style={[styles.label, listActive && styles.labelActive]}>
          {tr.listView}
        </Text>
      </TouchableOpacity>

      {/* Map option */}
      <TouchableOpacity
        style={styles.option}
        onPress={() => onChange("map")}
        activeOpacity={0.85}
      >
        <Feather
          name="map-pin"
          size={14}
          color={mapActive ? Colors.white : Colors.grayMedium}
        />
        <Text style={[styles.label, mapActive && styles.labelActive]}>
          {tr.mapView}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: Colors.grayLight,
    borderRadius: 22,
    padding: 3,
    alignSelf: "center",
    position: "relative",
  },
  slider: {
    position: "absolute",
    top: 3,
    left: 3,
    width: OPTION_W,
    height: 32,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 19,
    // Subtle shadow so it lifts above the track
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: OPTION_W,
    height: 32,
    gap: 5,
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.grayMedium,
  },
  labelActive: {
    color: Colors.white,
  },
});
