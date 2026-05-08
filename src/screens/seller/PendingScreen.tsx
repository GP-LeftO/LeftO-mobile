import React, { useEffect } from "react";
import { StyleSheet, Text, View, Platform, TouchableOpacity, Linking } from "react-native";
import Animated, {
  FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAuth } from "../../hooks/useAuth";

interface PendingScreenProps {
  role?: string;
  onLogout?: () => void;
  onGoToSignIn?: () => void;
  navigation?: any;
}

export default function PendingScreen({ role = "seller", onLogout, onGoToSignIn, navigation }: PendingScreenProps) {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ), -1, true
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 1200 }),
        withTiming(0.6, { duration: 1200 })
      ), -1, true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const STEPS = [
    { label: "Application submitted", done: true },
    { label: "Document review", done: false },
    { label: "Account activation", done: false },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.iconSection}>
          <View style={styles.iconOuter}>
            <Animated.View style={[styles.iconPulse, pulseStyle]} />
            <View style={styles.iconInner}>
              <Text style={styles.iconEmoji}>⏳</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500).springify()} style={styles.textBlock}>
          <Text style={[styles.title, rtl && styles.rtl]}>Application submitted!</Text>
          <Text style={[styles.subtitle, rtl && styles.rtl]}>
            Thank you for joining LeftO as a{" "}
            <Text style={styles.roleText}>{role === "seller" ? "Seller" : "Charity"}</Text>.
            Our team will review your application and activate your account within{" "}
            <Text style={styles.bold}>24–48 hours</Text>.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(380).duration(500).springify()} style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>What happens next?</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepDot, step.done && styles.stepDotDone]}>
                {step.done
                  ? <Feather name="check" size={12} color={Colors.white} />
                  : <Text style={styles.stepDotNum}>{i + 1}</Text>
                }
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, step.done && styles.stepLineDone]} />}
              <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>{step.label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(480).duration(500).springify()} style={styles.noticeCard}>
          <Feather name="bell" size={16} color={Colors.primaryOrange} />
          <Text style={styles.noticeText}>
            You'll receive a notification and email once your account is approved.
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInUp.delay(560).duration(500).springify()}
        style={[styles.footer, { paddingBottom: bottomPadding + Spacing.md }]}
      >
        <TouchableOpacity
          style={styles.supportBtn}
          activeOpacity={0.8}
          onPress={() => Linking.openURL("mailto:support@lefto.com")}
        >
          <Feather name="message-circle" size={16} color={Colors.primaryOrange} />
          <Text style={styles.supportBtnText}>{rtl ? "تواصل مع الدعم" : "Contact Support"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signInBtn}
          activeOpacity={0.8}
          onPress={() => { if (onGoToSignIn) onGoToSignIn(); }}
        >
          <Feather name="log-in" size={16} color={Colors.white} />
          <Text style={styles.signInBtnText}>{rtl ? "الذهاب إلى تسجيل الدخول" : "Go to Sign In"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={async () => { await logout(); if (onLogout) onLogout(); }}
        >
          <Feather name="log-out" size={14} color={Colors.grayMedium} />
          <Text style={styles.logoutBtnText}>{rtl ? "تسجيل الخروج" : "Sign Out"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.xl, gap: Spacing.xl, justifyContent: "center" },
  rtl: { textAlign: "right" },

  iconSection: { alignItems: "center" },
  iconOuter: { width: 120, height: 120, alignItems: "center", justifyContent: "center" },
  iconPulse: {
    position: "absolute",
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.primaryOrange,
  },
  iconInner: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  iconEmoji: { fontSize: 40 },

  textBlock: { gap: Spacing.sm, alignItems: "center" },
  title: { fontSize: 26, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: 15, color: Colors.grayMedium, lineHeight: 22, textAlign: "center" },
  roleText: { color: Colors.primaryOrange, fontWeight: "700" },
  bold: { fontWeight: "700", color: Colors.grayDark },

  stepsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20, padding: Spacing.lg,
    gap: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  stepsTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayMedium, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingBottom: 8 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
    marginTop: 0,
    flexShrink: 0,
  },
  stepDotDone: { backgroundColor: Colors.greenMain },
  stepDotNum: { fontSize: 12, fontWeight: "700", color: Colors.grayMedium },
  stepLine: {
    position: "absolute",
    left: 12, top: 26,
    width: 2, height: 24,
    backgroundColor: Colors.grayLight,
  },
  stepLineDone: { backgroundColor: Colors.greenMain },
  stepLabel: { fontSize: 15, fontWeight: "500", color: Colors.grayMedium, paddingTop: 4 },
  stepLabelDone: { color: Colors.grayDark, fontWeight: "700" },

  noticeCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: Colors.orangeLight,
    borderRadius: 14, padding: Spacing.md,
  },
  noticeText: { flex: 1, fontSize: 13, color: Colors.orangeDark, lineHeight: 18 },

  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.sm },
  supportBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.primaryOrange,
  },
  supportBtnText: { fontSize: 15, fontWeight: "700", color: Colors.primaryOrange },
  signInBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 14, paddingVertical: 14,
  },
  signInBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12,
  },
  logoutBtnText: { fontSize: 14, fontWeight: "600", color: Colors.grayMedium },
});
