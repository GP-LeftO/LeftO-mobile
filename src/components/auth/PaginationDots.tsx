import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Colors } from "../../theme";

export default function PaginationDots({ total, currentIndex }: { total: number; currentIndex: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} index={i} currentIndex={currentIndex} />
      ))}
    </View>
  );
}

function Dot({ index, currentIndex }: { index: number; currentIndex: number }) {
  const isActive = index === currentIndex;
  const width = useSharedValue(isActive ? 24 : 8);
  const opacity = useSharedValue(isActive ? 1 : 0.4);

  useEffect(() => {
    width.value = withSpring(isActive ? 24 : 8, { damping: 15, stiffness: 200 });
    opacity.value = withSpring(isActive ? 1 : 0.4, { damping: 15, stiffness: 200 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.dot, animatedStyle, isActive ? styles.activeDot : styles.inactiveDot]} />
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  dot: { height: 8, borderRadius: 100 },
  activeDot: { backgroundColor: Colors.primaryOrange },
  inactiveDot: { backgroundColor: Colors.grayMedium },
});