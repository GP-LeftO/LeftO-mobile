import React, { useEffect } from "react";
import { StyleSheet, View, Dimensions, Text, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import {
  useFonts,
  Nunito_900Black,
  Nunito_500Medium,
} from "@expo-google-fonts/nunito";

interface SplashScreenProps {
  onComplete?: () => void;
  navigation?: any;
}

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.52;
const FONT_SIZE = 56;

function ArrowO() {
  const size = FONT_SIZE * 1.05;
  return (
    <Svg width={size * 0.72} height={size} viewBox="0 0 38 52">
      <Path
        d="M 19 7 A 14 14 0 1 1 6 26"
        stroke="#222220"
        strokeWidth="5.5"
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M 3 18 L 6 29 L 14 22 Z" fill="#222220" />
    </Svg>
  );
}

function AnimatedLetter({ char, index }: { char: string; index: number }) {
  const translateY = useSharedValue(36);
  const opacity = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    const delay = 400 + index * 75;
    translateY.value = withDelay(delay, withSpring(0, { damping: 12, stiffness: 130 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 380 }));
  }, []);

  return (
    <Animated.Text style={[styles.letterText, style]}>
      {char}
    </Animated.Text>
  );
}

function AnimatedArrowO() {
  const translateY = useSharedValue(36);
  const opacity = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    const delay = 400 + 4 * 75;
    translateY.value = withDelay(delay, withSpring(0, { damping: 12, stiffness: 130 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 380 }));
  }, []);

  return (
    <Animated.View style={style}>
      <ArrowO />
    </Animated.View>
  );
}

function LoadingBar() {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    opacity.value = withDelay(600, withTiming(1, { duration: 300 }));
    progress.value = withDelay(
      650,
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  return (
    <Animated.View style={[styles.loadingTrack, wrapStyle]}>
      <Animated.View style={[styles.loadingFill, barStyle]} />
    </Animated.View>
  );
}

function TaglineRow() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withDelay(860, withTiming(1, { duration: 650 }));
    translateY.value = withDelay(860, withSpring(0, { damping: 18 }));
  }, []);

  return (
    <Animated.View style={[styles.taglineRow, style]}>
      <View style={styles.taglineDot} />
      <View style={styles.taglineDot} />
      <Text style={styles.taglineText}>Good food, better price</Text>
      <View style={styles.taglineDot} />
      <View style={styles.taglineDot} />
    </Animated.View>
  );
}

export default function SplashScreen({ onComplete, navigation }: SplashScreenProps) {
  const [fontsLoaded] = useFonts({ Nunito_900Black, Nunito_500Medium });

  const logoScale = useSharedValue(0.75);
  const logoOpacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 13, stiffness: 100 });
    logoOpacity.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
      else if (navigation) navigation.replace("Onboarding");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) return <View style={styles.container} />;

  return (
    <LinearGradient colors={["#f5f5f2", "#eaeae6"]} style={styles.container}>
      <Animated.View style={[styles.circleWrapper, logoStyle]}>
        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </Animated.View>

      <View style={styles.brandBlock}>
        <View style={styles.lettersRow}>
          {["L", "e", "f", "t"].map((char, i) => (
            <AnimatedLetter key={i} char={char} index={i} />
          ))}
          <AnimatedArrowO />
        </View>

        <LoadingBar />

        <TaglineRow />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    backgroundColor: "#f5f5f2",
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  brandBlock: {
    alignItems: "center",
    gap: 8,
  },
  lettersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  letterText: {
    fontSize: FONT_SIZE,
    fontFamily: "Nunito_900Black",
    color: "#222220",
    letterSpacing: -0.5,
  },
  loadingTrack: {
    width: width * 0.52,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#E8E8E4",
    marginTop: 4,
    overflow: "hidden",
  },
  loadingFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#DE985A",
    shadowColor: "#DE985A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    shadowColor: "#DE985A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  taglineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DE985A",
    opacity: 0.6,
  },
  taglineText: {
    fontSize: 15,
    fontFamily: "Nunito_500Medium",
    color: "#666664",
    letterSpacing: 0.5,
  },
});
