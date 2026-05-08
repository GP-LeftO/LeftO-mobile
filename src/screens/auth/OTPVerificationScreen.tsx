import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Platform, KeyboardAvoidingView, ActivityIndicator,
} from "react-native";
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withSequence, withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import StepIndicator from "../../components/StepIndicator";
import { useAuth } from "../../hooks/useAuth";

interface OTPVerificationScreenProps {
  phone?: string;
  onComplete?: () => void;
  onBack?: () => void;
  navigation?: any;
}

const OTP_LENGTH = 6;

export default function OTPVerificationScreen({
  phone = "+970 59 000 0000",
  onComplete,
  onBack,
  navigation,
}: OTPVerificationScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const { sendOtp, sendOtpState, verifyOtp, verifyOtpState } = useAuth();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendTimer, setResendTimer] = useState(30);
  const [error, setError] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const loading = verifyOtpState.loading;

  useEffect(() => {
    if (resendTimer === 0) return;
    const interval = setInterval(() => setResendTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (verifyOtpState.error) {
      setError(verifyOtpState.error);
      shake();
    }
  }, [verifyOtpState.error]);

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 60 }), withTiming(8, { duration: 60 }),
      withTiming(-6, { duration: 60 }), withTiming(6, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
  };

  const handleChange = (text: string, index: number) => {
    setError("");
    const digit = text.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== "") && digit) handleVerify(newOtp.join(""));
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async (code?: string) => {
    const finalCode = code ?? otp.join("");
    if (finalCode.length < OTP_LENGTH) {
      setError(rtl ? "يرجى إدخال الرمز المكوّن من 6 أرقام" : "Please enter the full 6-digit code");
      shake();
      return;
    }
    setError("");
    try {
      await verifyOtp(phone, finalCode);
      if (onComplete) onComplete();
      else if (navigation) navigation.navigate("RoleSelection");
    } catch {
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || sendOtpState.loading) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setError("");
    inputRefs.current[0]?.focus();
    try {
      await sendOtp(phone);
      setResendTimer(30);
    } catch {
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ paddingTop: topPadding + 12, flex: 1, paddingHorizontal: Spacing.xl, gap: Spacing.lg }}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8} disabled={loading}>
            <Feather name="arrow-left" size={20} color={Colors.grayDark} />
          </TouchableOpacity>
          <View style={styles.stepWrap}>
            <StepIndicator current={2} total={5} />
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.titleBlock}>
          <View style={styles.iconWrap}>
            <Feather name="shield" size={28} color={Colors.primaryOrange} />
          </View>
          <Text style={[styles.title, rtl && styles.rtl]}>
            {rtl ? "تحقق من رقمك" : "Verify your number"}
          </Text>
          <Text style={[styles.subtitle, rtl && styles.rtl]}>
            {rtl ? "أرسلنا رمزاً مكوناً من 6 أرقام إلى\n" : "We sent a 6-digit code to\n"}
            <Text style={styles.phone}>{phone}</Text>
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500).springify()} style={styles.otpSection}>
          <Animated.View style={[styles.otpRow, shakeStyle]}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputRefs.current[i] = ref; }}
                style={[styles.otpBox, digit && styles.otpBoxFilled, !!error && styles.otpBoxError]}
                value={digit}
                onChangeText={(text) => handleChange(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                caretHidden
                editable={!loading}
              />
            ))}
          </Animated.View>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500).springify()} style={styles.resendRow}>
          <Text style={styles.resendLabel}>
            {rtl ? "لم تستلم الرمز؟" : "Didn't receive the code?"}
          </Text>
          <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0 || sendOtpState.loading}>
            {sendOtpState.loading ? (
              <ActivityIndicator size="small" color={Colors.primaryOrange} />
            ) : (
              <Text style={[styles.resendBtn, resendTimer > 0 && styles.resendDisabled]}>
                {resendTimer > 0
                  ? (rtl ? `إعادة الإرسال خلال ${resendTimer}ث` : `Resend in ${resendTimer}s`)
                  : (rtl ? "إعادة الإرسال" : "Resend")}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(380).duration(500).springify()}>
          <TouchableOpacity
            style={[styles.verifyBtn, loading && styles.verifyBtnLoading]}
            onPress={() => handleVerify()}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <>
                  <Feather name="check" size={20} color={Colors.white} />
                  <Text style={styles.verifyBtnText}>{rtl ? "تحقق" : "Verify"}</Text>
                </>
            }
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(440).duration(500).springify()} style={[styles.wrongNumber, rtl && styles.wrongNumberRTL]}>
          <Feather name="edit-2" size={13} color={Colors.primaryOrange} />
          <TouchableOpacity onPress={onBack} disabled={loading}>
            <Text style={styles.wrongNumberText}>
              {rtl ? "رقم خاطئ؟ غيّره" : "Wrong number? Change it"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  stepWrap: { flex: 1 },

  titleBlock: { gap: Spacing.sm },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  title: { fontSize: 26, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.grayMedium, lineHeight: 22 },
  phone: { fontWeight: "700", color: Colors.grayDark },

  otpSection: { gap: Spacing.sm, alignItems: "center" },
  otpRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  otpBox: {
    width: 48, height: 58, borderRadius: 14,
    borderWidth: 2, borderColor: Colors.grayLight,
    backgroundColor: Colors.white,
    textAlign: "center", fontSize: 24, fontWeight: "700", color: Colors.grayDark,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  otpBoxFilled: { borderColor: Colors.primaryOrange, backgroundColor: Colors.orangeLight },
  otpBoxError: { borderColor: "#ef4444" },
  errorText: { fontSize: 13, color: "#ef4444", textAlign: "center" },

  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  resendLabel: { fontSize: 14, color: Colors.grayMedium },
  resendBtn: { fontSize: 14, fontWeight: "700", color: Colors.primaryOrange },
  resendDisabled: { color: Colors.grayMedium },

  verifyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.primaryOrange,
    borderRadius: 16, paddingVertical: 16, gap: 8,
    shadowColor: Colors.primaryOrange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  verifyBtnLoading: { opacity: 0.75 },
  verifyBtnText: { fontSize: 17, fontWeight: "700", color: Colors.white },

  wrongNumber: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  wrongNumberRTL: { flexDirection: "row-reverse" },
  wrongNumberText: { fontSize: 14, fontWeight: "600", color: Colors.primaryOrange },
});
