import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../theme";
import { Spacing } from "../theme";
import { isRTL } from "../i18n";

type IconName = keyof typeof Feather.glyphMap;

interface RoleCardProps {
  label: string;
  description: string;
  icon: IconName;
  selected: boolean;
  onSelect: () => void;
  testID?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function RoleCard({
  label,
  description,
  icon,
  selected,
  onSelect,
  testID,
}: RoleCardProps) {
  const scale = useSharedValue(1);
  const rtl = isRTL();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      testID={testID}
      onPress={onSelect}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      activeOpacity={0.9}
      style={[animatedStyle, styles.card, selected && styles.selectedCard]}
    >
      <View style={[styles.iconContainer, selected ? styles.selectedIcon : styles.defaultIcon]}>
        <Feather name={icon} size={28} color={selected ? Colors.white : Colors.primaryOrange} />
      </View>
      <View style={[styles.textContainer, rtl && styles.rtlContainer]}>
        <Text style={[styles.label, selected && styles.selectedLabel, rtl && styles.rtlText]}>
          {label}
        </Text>
        <Text style={[styles.description, rtl && styles.rtlText]}>{description}</Text>
      </View>
      {selected && (
        <View style={styles.checkContainer}>
          <Feather name="check-circle" size={20} color={Colors.primaryOrange} />
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  selectedCard: {
    borderColor: Colors.primaryOrange,
    backgroundColor: Colors.orangeLight,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  defaultIcon: { backgroundColor: Colors.orangeLight },
  selectedIcon: { backgroundColor: Colors.primaryOrange },
  textContainer: { flex: 1, gap: 4 },
  rtlContainer: { alignItems: "flex-end" },
  label: { fontSize: 17, fontWeight: "700", color: Colors.grayDark },
  selectedLabel: { color: Colors.orangeDark },
  description: { fontSize: 14, color: Colors.grayMedium, lineHeight: 20 },
  rtlText: { textAlign: "right", writingDirection: Platform.OS === "ios" ? "rtl" : "ltr" },
  checkContainer: { flexShrink: 0 },
});
