import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Platform, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import Animated, {
  FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAuth } from "../../hooks/auth/useAuth";
import api from "../../services/shared/api";

interface PendingScreenProps {
  role?: string;
  onLogout?: () => void;
  onGoToSignIn?: () => void;
  onApproved?: () => void;
  navigation?: any;
}

export default function PendingScreen({
  role = "seller", onLogout, onGoToSignIn, onApproved, navigation,
}: PendingScreenProps) {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const [sellerStatus, setSellerStatus] = useState<"APPROVED" | "PENDING" | "REJECTED" | null>(null);
  const [statusLoading, setStatusLoading] = useState(role === "seller");

  const pulseScale   = useSharedValue(1);
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
        withTiming(0.6,  { duration: 1200 })
      ), -1, true
    );
  }, []);

  // Fetch live seller status to decide which message to show
  useEffect(() => {
    if (role !== "seller") return;
    api.get("/api/sellers/me")
      .then(res => {
        const s = res.data?.data?.status ?? res.data?.status;
        setSellerStatus(s ?? "PENDING");
      })
      .catch(() => setSellerStatus("PENDING"))
      .finally(() => setStatusLoading(false));
  }, [role]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity:   pulseOpacity.value,
  }));

  const isApproved = sellerStatus === "APPROVED";
  const pulseColor = isApproved ? Colors.greenMain : Colors.primaryOrange;

  const PENDING_STEPS = [
    { labelAr: "تم استلام طلبك",             labelEn: "Application received",                done: true  },
    { labelAr: "التحقق من رقم التسجيل",      labelEn: "Registration number verification",    done: false },
    { labelAr: "تفعيل الحساب",               labelEn: "Account activation",                  done: false },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.content}>

        {/* ── Animated icon ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.iconSection}>
          <View style={styles.iconOuter}>
            <Animated.View style={[styles.iconPulse, pulseStyle, { backgroundColor: pulseColor }]} />
            <View style={styles.iconInner}>
              {statusLoading
                ? <ActivityIndicator size="large" color={Colors.primaryOrange} />
                : <Text style={styles.iconEmoji}>{isApproved ? "✅" : "⏳"}</Text>
              }
            </View>
          </View>
        </Animated.View>

        {/* ── Title + body ── */}
        {!statusLoading && (
          <Animated.View entering={FadeInDown.delay(250).duration(500).springify()} style={styles.textBlock}>
            {isApproved ? (
              <>
                <Text style={[styles.title, rtl && styles.rtl]}>
                  {rtl ? "تم تفعيل حسابك! ✅" : "Your account is active! ✅"}
                </Text>
                <Text style={[styles.subtitle, rtl && styles.rtl]}>
                  {rtl
                    ? "رقم تسجيلك معتمد. يمكنك الآن نشر إدراجاتك والبدء في بيع الفائض من طعامك."
                    : "Your registration number is verified. You can now publish listings and start selling surplus food."}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.title, rtl && styles.rtl]}>
                  {rtl ? "طلبك قيد المراجعة" : "Application under review"}
                </Text>
                <Text style={[styles.subtitle, rtl && styles.rtl]}>
                  {rtl
                    ? "رقم تسجيلك غير موجود في قائمتنا المعتمدة حالياً. سيتواصل معك فريق LeftO للتحقق من بياناتك."
                    : "Your registration number is not in our verified list yet. The LeftO team will contact you to verify your details."}
                </Text>
                <Text style={[styles.subtitleNote, rtl && styles.rtl]}>
                  {rtl
                    ? "لا علاقة لهذا بالوثائق التي رفعتها"
                    : "This has nothing to do with the documents you uploaded"}
                </Text>
              </>
            )}
          </Animated.View>
        )}

        {/* ── Steps (pending only) ── */}
        {!statusLoading && !isApproved && (
          <Animated.View entering={FadeInDown.delay(380).duration(500).springify()} style={styles.stepsCard}>
            <Text style={[styles.stepsTitle, rtl && styles.rtl]}>
              {rtl ? "ما الخطوات التالية؟" : "What happens next?"}
            </Text>
            {PENDING_STEPS.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.stepDot, step.done && styles.stepDotDone]}>
                  {step.done
                    ? <Feather name="check" size={12} color={Colors.white} />
                    : <Text style={styles.stepDotNum}>{i + 1}</Text>
                  }
                </View>
                {i < PENDING_STEPS.length - 1 && (
                  <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
                )}
                <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>
                  {rtl ? step.labelAr : step.labelEn}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* ── Notice card ── */}
        {!statusLoading && (
          <Animated.View
            entering={FadeInDown.delay(480).duration(500).springify()}
            style={[styles.noticeCard, isApproved && styles.noticeCardApproved]}
          >
            <Feather
              name={isApproved ? "check-circle" : "bell"}
              size={16}
              color={isApproved ? Colors.greenMain : Colors.primaryOrange}
            />
            <Text style={[styles.noticeText, isApproved && styles.noticeTextApproved]}>
              {isApproved
                ? (rtl ? "حسابك مفعّل. يمكنك البدء فوراً." : "Your account is active. You can start right away.")
                : (rtl ? "ستصلك إشعار فور الموافقة على حسابك" : "You'll receive a notification once your account is approved")}
            </Text>
          </Animated.View>
        )}

      </View>

      {/* ── Footer buttons ── */}
      {!statusLoading && (
        <Animated.View
          entering={FadeInUp.delay(560).duration(500).springify()}
          style={[styles.footer, { paddingBottom: bottomPadding + Spacing.md }]}
        >
          {isApproved ? (
            <TouchableOpacity
              style={styles.signInBtn}
              activeOpacity={0.8}
              onPress={() => { onApproved?.(); }}
            >
              <Feather name="arrow-right" size={16} color={Colors.white} />
              <Text style={styles.signInBtnText}>{rtl ? "ابدأ الآن ←" : "Get Started →"}</Text>
            </TouchableOpacity>
          ) : (
            <>
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
                <Text style={styles.signInBtnText}>{rtl ? "العودة للرئيسية" : "Back to Home"}</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={async () => { await logout(); if (onLogout) onLogout(); }}
          >
            <Feather name="log-out" size={14} color={Colors.grayMedium} />
            <Text style={styles.logoutBtnText}>{rtl ? "تسجيل الخروج" : "Sign Out"}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
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
  subtitleNote: { fontSize: 13, color: Colors.grayMedium, lineHeight: 18, textAlign: "center", fontStyle: "italic" },

  stepsCard: {
    backgroundColor: Colors.white,
    borderRadius: 20, padding: Spacing.lg, gap: 0,
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
  noticeCardApproved: { backgroundColor: "#f0fdf4" },
  noticeText: { flex: 1, fontSize: 13, color: Colors.orangeDark, lineHeight: 18 },
  noticeTextApproved: { color: "#166534" },

  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.sm },
  supportBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.white,
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.primaryOrange,
  },
  supportBtnText: { fontSize: 15, fontWeight: "700", color: Colors.primaryOrange },
  signInBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.primaryOrange,
    borderRadius: 14, paddingVertical: 14,
  },
  signInBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12,
  },
  logoutBtnText: { fontSize: 14, fontWeight: "600", color: Colors.grayMedium },
});
