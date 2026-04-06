import React, { useRef, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Text,
  Platform,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import OnboardingSlide from "../components/OnboardingSlide";
import PaginationDots from "../components/PaginationDots";
import Button from "../components/Button";
import LeftOLogo from "../components/LeftOLogo";
import { Colors, Spacing } from "../theme";
import { t, isRTL } from "../i18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  { image: require("../../assets/images/onboarding1.png") },
  { image: require("../../assets/images/onboarding2.png") },
  { image: require("../../assets/images/onboarding3.png") },
  { image: require("../../assets/images/onboarding4.png") },
];

interface OnboardingScreenProps {
  onComplete?: () => void;
  navigation?: any;
}

export default function OnboardingScreen({ onComplete, navigation }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const translations = t();

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    scrollX.value = x;
    const index = Math.round(x / SCREEN_WIDTH);
    setCurrentIndex(Math.max(0, Math.min(index, SLIDES.length - 1)));
  };

  const navigate = () => {
    if (onComplete) onComplete();
    else if (navigation) navigation.replace("RoleSelection");
  };

  const goToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      navigate();
    }
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.white]} style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <LeftOLogo size="sm" />
        <TouchableOpacity onPress={navigate} style={styles.skipButton} testID="onboarding-skip">
          <Text style={[styles.skipText, rtl && styles.rtlText]}>{translations.skip}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <OnboardingSlide
            title={translations.onboarding[index].title}
            subtitle={translations.onboarding[index].subtitle}
            image={item.image}
            scrollX={scrollX}
            index={index}
          />
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      <View style={[styles.bottomContainer, { paddingBottom: bottomPadding + Spacing.lg }]}>
        <PaginationDots total={SLIDES.length} currentIndex={currentIndex} />
        <Button
          label={isLastSlide ? translations.getStarted : translations.next}
          onPress={goToNext}
          variant="primary"
          testID="onboarding-next"
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 100,
    backgroundColor: Colors.grayLight,
  },
  skipText: { color: Colors.grayMedium, fontSize: 14, fontWeight: "600" },
  rtlText: { textAlign: "right" },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
});
