import React from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Button from "../components/Button";
import LeftOLogo from "../components/LeftOLogo";
import { Colors, Spacing } from "../theme";
import { t, isRTL } from "../i18n";
import { markOnboardingComplete } from "../services/storage";
import type { UserRole } from "../services/storage";

interface GetStartedScreenProps {
  role?: UserRole;
  onCreateAccount?: () => void;
  onSignIn?: () => void;
  navigation?: any;
}

const IMPACT_STATS = [
  { icon: "users" as const, value: "50K+", label: "Members" },
  { icon: "package" as const, value: "200K+", label: "Meals saved" },
  { icon: "map-pin" as const, value: "30+", label: "Cities" },
];

export default function GetStartedScreen({ role, onCreateAccount, onSignIn, navigation }: GetStartedScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const translations = t();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handleCreateAccount = async () => {
    await markOnboardingComplete();
    if (onCreateAccount) onCreateAccount();
    else if (navigation) navigation.navigate("SignUp");
  };

  const handleSignIn = async () => {
    await markOnboardingComplete();
    if (onSignIn) onSignIn();
    else if (navigation) navigation.navigate("Login");
  };

  return (
    <LinearGradient
      colors={[Colors.orangeLight, Colors.white, Colors.background]}
      locations={[0, 0.35, 1]}
      style={[styles.container, { paddingTop: topPadding }]}
    >
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.logoSection}>
          <LeftOLogo size="lg" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500).springify()} style={styles.textSection}>
          <Text style={[styles.title, rtl && styles.rtlText]}>{translations.getStartedScreen.title}</Text>
          <Text style={[styles.subtitle, rtl && styles.rtlText]}>{translations.getStartedScreen.subtitle}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500).springify()} style={styles.statsRow}>
          {IMPACT_STATS.map((stat, i) => (
            <View key={i} style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Feather name={stat.icon} size={18} color={Colors.primaryOrange} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInUp.delay(500).duration(500).springify()}
        style={[styles.footer, { paddingBottom: bottomPadding + Spacing.lg }]}
      >
        <Button label={translations.getStartedScreen.createAccount} onPress={handleCreateAccount} variant="primary" testID="create-account" />
        <Button label={translations.getStartedScreen.signIn} onPress={handleSignIn} variant="outline" testID="sign-in" />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  circleTop: { position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: Colors.primaryOrange, opacity: 0.08 },
  circleBottom: { position: "absolute", bottom: 120, left: -80, width: 200, height: 200, borderRadius: 100, backgroundColor: Colors.greenMain, opacity: 0.08 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  logoSection: { alignItems: "center" },
  textSection: { alignItems: "center", gap: Spacing.sm },
  title: { fontSize: 26, fontWeight: "800", color: Colors.grayDark, textAlign: "center", letterSpacing: -0.5, lineHeight: 34 },
  subtitle: { fontSize: 15, color: Colors.grayMedium, textAlign: "center", lineHeight: 22 },
  rtlText: { textAlign: "center" },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    width: "100%",
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statIconContainer: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.3 },
  statLabel: { fontSize: 12, color: Colors.grayMedium, fontWeight: "500" },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
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
