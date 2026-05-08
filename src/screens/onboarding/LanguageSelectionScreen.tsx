import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Platform } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import LeftOLogo from "../../components/LeftOLogo";
import { Colors, Spacing } from "../../theme";
import { setLanguage } from "../../i18n";
import type { Language } from "../../i18n";

interface LanguageSelectionScreenProps {
  onComplete?: (lang: Language) => void;
  navigation?: any;
}

const LANGUAGES: { code: Language; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇵🇸" },
];

export default function LanguageSelectionScreen({ onComplete, navigation }: LanguageSelectionScreenProps) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Language>("en");
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const isAr = selected === "ar";

  const handleContinue = () => {
    setLanguage(selected);
    if (onComplete) onComplete(selected);
    else if (navigation) navigation.navigate("PhoneEntry");
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <Animated.View
        entering={FadeInDown.delay(80).duration(500).springify()}
        style={[styles.header, isAr && styles.headerRTL]}
      >
        <LeftOLogo size="sm" showText={false} />
        <Text style={[styles.welcome, isAr && styles.rtlText]}>
          {isAr ? "مرحباً بك في LeftO" : "Welcome to LeftO"}
        </Text>
        <Text style={[styles.subtitle, isAr && styles.rtlText]}>
          {isAr ? "اختر لغتك للبدء" : "Choose your language to get started"}
        </Text>
      </Animated.View>

      <View style={styles.cardsWrapper}>
        {LANGUAGES.map((lang, i) => (
          <Animated.View key={lang.code} entering={FadeInDown.delay(200 + i * 100).duration(500).springify()}>
            <TouchableOpacity
              style={[styles.card, selected === lang.code && styles.cardSelected]}
              onPress={() => setSelected(lang.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <View style={styles.cardText}>
                <Text style={[styles.langLabel, selected === lang.code && styles.langLabelSelected]}>
                  {lang.native}
                </Text>
                <Text style={styles.langSub}>{lang.label}</Text>
              </View>
              <View style={[styles.radio, selected === lang.code && styles.radioSelected]}>
                {selected === lang.code && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <Animated.View
        entering={FadeInUp.delay(420).duration(500).springify()}
        style={[styles.footer, { paddingBottom: bottomPadding + Spacing.md }]}
      >
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>{isAr ? "متابعة" : "Continue"}</Text>
          <Feather name="arrow-right" size={20} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    alignItems: "center",
    paddingTop: Spacing.xl, paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  headerRTL: { alignItems: "flex-end" },
  welcome: {
    fontSize: 28, fontWeight: "800", color: Colors.grayDark,
    letterSpacing: -0.5, marginTop: Spacing.md,
  },
  subtitle: { fontSize: 15, color: Colors.grayMedium },
  rtlText: { textAlign: "right", width: "100%" },

  cardsWrapper: {
    flex: 1, paddingHorizontal: Spacing.xl,
    gap: Spacing.md, justifyContent: "center", marginTop: -40,
  },
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: 20,
    padding: Spacing.lg, gap: Spacing.md,
    borderWidth: 2, borderColor: "transparent",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardSelected: { borderColor: Colors.primaryOrange, backgroundColor: Colors.orangeLight },
  flag: { fontSize: 40 },
  cardText: { flex: 1, gap: 2 },
  langLabel: { fontSize: 22, fontWeight: "700", color: Colors.grayDark },
  langLabelSelected: { color: Colors.orangeDark },
  langSub: { fontSize: 14, color: Colors.grayMedium },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.grayMedium,
    alignItems: "center", justifyContent: "center",
  },
  radioSelected: { borderColor: Colors.primaryOrange },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primaryOrange },

  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  continueBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.primaryOrange, borderRadius: 16,
    paddingVertical: 16, gap: 8,
    shadowColor: Colors.primaryOrange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  continueBtnText: { fontSize: 17, fontWeight: "700", color: Colors.white },
});
