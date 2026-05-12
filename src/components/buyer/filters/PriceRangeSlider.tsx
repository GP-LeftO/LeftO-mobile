import React, { useRef, useState, useMemo } from "react";
import {
  View, Text, PanResponder, StyleSheet, LayoutChangeEvent,
} from "react-native";
import { Colors, Spacing } from "../../../theme";

interface PriceRangeSliderProps {
  min:      number;
  max:      number;
  value:    [number, number];
  onChange: (range: [number, number]) => void;
  label:    string; // template: "{min} ILS – {max} ILS"
  step?:    number;
}

const THUMB = 24;
const TRACK = 4;

function snap(v: number, step: number, min: number): number {
  return Math.round((v - min) / step) * step + min;
}
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function PriceRangeSlider({
  min, max, value, onChange, label, step = 5,
}: PriceRangeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);

  // Always-current refs so PanResponder closures never go stale
  const trackWidthRef = useRef(0);
  const valueRef      = useRef<[number, number]>(value);
  valueRef.current    = value;
  const onChangeRef   = useRef(onChange);
  onChangeRef.current = onChange;

  // Each thumb records its value at the moment the gesture begins
  const minStart = useRef(0);
  const maxStart = useRef(0);

  const minPR = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder:            () => true,
        onMoveShouldSetPanResponder:             () => true,
        onPanResponderGrant: () => {
          minStart.current = valueRef.current[0];
        },
        onPanResponderMove: (_, gs) => {
          const w = trackWidthRef.current;
          if (!w) return;
          const delta  = (gs.dx / w) * (max - min);
          const newMin = clamp(
            snap(minStart.current + delta, step, min),
            min,
            valueRef.current[1] - step,
          );
          onChangeRef.current([newMin, valueRef.current[1]]);
        },
        onPanResponderRelease: () => {},
      }),
    [min, max, step],
  );

  const maxPR = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder:            () => true,
        onMoveShouldSetPanResponder:             () => true,
        onPanResponderGrant: () => {
          maxStart.current = valueRef.current[1];
        },
        onPanResponderMove: (_, gs) => {
          const w = trackWidthRef.current;
          if (!w) return;
          const delta  = (gs.dx / w) * (max - min);
          const newMax = clamp(
            snap(maxStart.current + delta, step, min),
            valueRef.current[0] + step,
            max,
          );
          onChangeRef.current([valueRef.current[0], newMax]);
        },
        onPanResponderRelease: () => {},
      }),
    [min, max, step],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  };

  const pctMin = (value[0] - min) / (max - min);
  const pctMax = (value[1] - min) / (max - min);

  const displayLabel = label
    .replace("{min}", String(value[0]))
    .replace("{max}", String(value[1]));

  const minLeft = pctMin * trackWidth - THUMB / 2;
  const maxLeft = pctMax * trackWidth - THUMB / 2;

  return (
    <View style={styles.container}>
      {/* Live price label */}
      <Text style={styles.label}>{displayLabel}</Text>

      {/* Slider */}
      <View style={styles.sliderOuter} onLayout={onLayout}>
        {/* Full gray track */}
        <View style={styles.track} />

        {trackWidth > 0 && (
          <>
            {/* Orange active range */}
            <View
              style={[
                styles.activeTrack,
                {
                  left:  pctMin * trackWidth,
                  width: (pctMax - pctMin) * trackWidth,
                },
              ]}
            />

            {/* Min thumb */}
            <View
              style={[styles.thumb, { left: minLeft }]}
              {...minPR.panHandlers}
            />

            {/* Max thumb */}
            <View
              style={[styles.thumb, { left: maxLeft }]}
              {...maxPR.panHandlers}
            />
          </>
        )}
      </View>

      {/* Static min / max labels */}
      <View style={styles.rangeRow}>
        <Text style={styles.rangeLabel}>{min}</Text>
        <Text style={styles.rangeLabel}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primaryOrange,
    textAlign: "center",
  },

  // Outer container gives the thumbs room to overflow left/right at extremes
  sliderOuter: {
    height: THUMB + 8,
    marginHorizontal: THUMB / 2,
    justifyContent: "center",
  },

  track: {
    position: "absolute",
    left: 0,
    right: 0,
    height: TRACK,
    backgroundColor: Colors.grayLight,
    borderRadius: TRACK / 2,
  },

  activeTrack: {
    position: "absolute",
    height: TRACK,
    backgroundColor: Colors.primaryOrange,
    borderRadius: TRACK / 2,
  },

  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: Colors.white,
    borderWidth: 2.5,
    borderColor: Colors.primaryOrange,
    // Vertically center inside sliderOuter
    top: (THUMB + 8 - THUMB) / 2,
    zIndex: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },

  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: THUMB / 2,
  },
  rangeLabel: {
    fontSize: 11,
    color: Colors.grayMedium,
  },
});
