import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Colors } from "../theme";
import { Spacing } from "../theme";
import { isRTL } from "../i18n";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Button({
  label,
  onPress,
  variant = "primary",
  style,
  textStyle,
  loading = false,
  disabled = false,
  testID,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const rtl = isRTL();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const buttonStyle: StyleProp<ViewStyle> = [
    styles.base,
    variant === "primary" ? styles.primary : undefined,
    variant === "secondary" ? styles.secondary : undefined,
    variant === "outline" ? styles.outline : undefined,
    disabled ? styles.disabled : undefined,
    style ?? {},
  ];

  const labelStyle: StyleProp<TextStyle> = [
    styles.label,
    variant === "primary" ? styles.labelPrimary : undefined,
    variant === "secondary" ? styles.labelSecondary : undefined,
    variant === "outline" ? styles.labelOutline : undefined,
    disabled ? styles.labelDisabled : undefined,
    rtl ? styles.rtlText : undefined,
    textStyle ?? {},
  ];

  return (
    <AnimatedTouchable
      testID={testID}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, buttonStyle]}
      activeOpacity={0.9}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? Colors.white : Colors.primaryOrange}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{label}</Text>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  primary: {
    backgroundColor: Colors.primaryOrange,
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: Colors.grayLight,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.primaryOrange,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  labelPrimary: {
    color: Colors.white,
  },
  labelSecondary: {
    color: Colors.grayDark,
  },
  labelOutline: {
    color: Colors.primaryOrange,
  },
  labelDisabled: {
    opacity: 0.7,
  },
  rtlText: {
    writingDirection: Platform.OS === "ios" ? "rtl" : "ltr",
  },
});
