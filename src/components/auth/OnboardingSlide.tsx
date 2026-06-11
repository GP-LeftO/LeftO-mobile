import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  Platform,
  ImageSourcePropType,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { Colors, Spacing } from "../../theme/index";
import { isRTL } from "../../i18n/index";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_SIZE = SCREEN_WIDTH * 0.72;

interface OnboardingSlideProps {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  scrollX: SharedValue<number>;
  index: number;
}

export default function OnboardingSlide({ title, subtitle, image, scrollX, index }: OnboardingSlideProps) {
  const rtl = isRTL();

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
      [40, 0, 40],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.imageWrapper, animatedStyle]}>
        <View style={styles.card}>
          <Image source={image} style={styles.image} resizeMode="cover" />
        </View>
      </Animated.View>
      <Animated.View style={[styles.textContainer, animatedStyle]}>
        <Text style={[styles.title, rtl && styles.rtlText]}>{title}</Text>
        <Text style={[styles.subtitle, rtl && styles.rtlText]}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  imageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  card: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE * 0.85,
    borderRadius: 32,
    backgroundColor: Colors.orangeLight,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    padding: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.grayDark,
    textAlign: "center",
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.grayMedium,
    textAlign: "center",
    lineHeight: 24,
  },
  rtlText: {
    textAlign: "center",
    writingDirection: Platform.OS === "ios" ? "rtl" : "ltr",
  },
});