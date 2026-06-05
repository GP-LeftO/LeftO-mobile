import React, { useState, useRef } from "react";
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Button from "../../components/shared/Button";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { resetPassword } from "../../services/auth/auth.service";

interface ResetPasswordScreenProps {
  phone: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function ResetPasswordScreen({ phone, onBack, onSuccess }: ResetPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const newPasswordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (otp.trim().length < 4)
      e.otp = rtl ? "يرجى إدخال رمز التحقق" : "Please enter the verification code";
    if (newPassword.length < 6)
      e.newPassword = rtl
        ? "يجب أن تتكوّن كلمة المرور من 6 أحرف على الأقل"
        : "Password must be at least 6 characters";
    if (newPassword !== confirmPassword)
      e.confirmPassword = rtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword(phone, otp.trim(), newPassword);
      setSuccessMsg(rtl
        ? "تم تغيير كلمة المرور. يرجى تسجيل الدخول."
        : "Password reset successfully. Please sign in.");
      setTimeout(onSuccess, 1800);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrors({
        general: msg ?? (rtl
          ? "تعذّر إعادة تعيين كلمة المرور. يرجى المحاولة مجدداً."
          : "Could not reset password. Please try again."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPadding + 16, paddingBottom: bottomPadding + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={[styles.backBtn, rtl && styles.backBtnRTL]} onPress={onBack} activeOpacity={0.8}>
          <Feather name={rtl ? "arrow-right" : "arrow-left"} size={22} color={Colors.grayDark} />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.delay(80).duration(500).springify()} style={styles.iconWrap}>
          <Feather name="key" size={34} color={Colors.primaryOrange} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(130).duration(500).springify()} style={[styles.title, rtl && styles.rtl]}>
          {rtl ? "إعادة تعيين كلمة المرور" : "Reset Password"}
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(180).duration(500).springify()} style={[styles.subtitle, rtl && styles.rtl]}>
          {rtl
            ? `أدخل الرمز المرسل إلى ${phone} واختر كلمة مرور جديدة`
            : `Enter the code sent to ${phone} and set a new password`}
        </Animated.Text>

        {successMsg ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.successBanner}>
            <Feather name="check-circle" size={18} color={Colors.greenMain} />
            <Text style={[styles.successText, rtl && styles.rtl]}>{successMsg}</Text>
          </Animated.View>
        ) : null}

        {errors.general ? (
          <View style={styles.errorBanner}>
            <Text style={[styles.errorBannerText, rtl && styles.rtl]}>{errors.general}</Text>
          </View>
        ) : null}

        {/* OTP field */}
        <Animated.View entering={FadeInDown.delay(230).duration(500).springify()} style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, rtl && styles.rtl]}>
            {rtl ? "رمز التحقق" : "Verification Code"}
          </Text>
          <View style={[styles.inputRow, !!errors.otp && styles.inputRowError, rtl && styles.inputRowRTL]}>
            <Feather name="hash" size={18} color={Colors.grayMedium} style={rtl ? styles.iconRight : styles.iconLeft} />
            <TextInput
              style={[styles.input, rtl && styles.inputRTL]}
              placeholder={rtl ? "رمز مكوّن من 6 أرقام" : "6-digit code"}
              placeholderTextColor={Colors.grayMedium}
              value={otp}
              onChangeText={(v) => { setOtp(v); setErrors((e) => ({ ...e, otp: "" })); }}
              keyboardType="number-pad"
              maxLength={6}
              returnKeyType="next"
              onSubmitEditing={() => newPasswordRef.current?.focus()}
              textAlign={rtl ? "right" : "left"}
            />
          </View>
          {errors.otp ? <Text style={[styles.errorText, rtl && styles.rtl]}>{errors.otp}</Text> : null}
        </Animated.View>

        {/* New password */}
        <Animated.View entering={FadeInDown.delay(280).duration(500).springify()} style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, rtl && styles.rtl]}>
            {rtl ? "كلمة المرور الجديدة" : "New Password"}
          </Text>
          <View style={[styles.inputRow, !!errors.newPassword && styles.inputRowError, rtl && styles.inputRowRTL]}>
            <Feather name="lock" size={18} color={Colors.grayMedium} style={rtl ? styles.iconRight : styles.iconLeft} />
            <TextInput
              ref={newPasswordRef}
              style={[styles.input, rtl && styles.inputRTL]}
              placeholder={rtl ? "كلمة المرور الجديدة" : "New password"}
              placeholderTextColor={Colors.grayMedium}
              value={newPassword}
              onChangeText={(v) => { setNewPassword(v); setErrors((e) => ({ ...e, newPassword: "" })); }}
              secureTextEntry={!showNew}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              textAlign={rtl ? "right" : "left"}
            />
            <TouchableOpacity onPress={() => setShowNew((p) => !p)} hitSlop={8}>
              <Feather name={showNew ? "eye-off" : "eye"} size={18} color={Colors.grayMedium} />
            </TouchableOpacity>
          </View>
          {errors.newPassword ? <Text style={[styles.errorText, rtl && styles.rtl]}>{errors.newPassword}</Text> : null}
        </Animated.View>

        {/* Confirm password */}
        <Animated.View entering={FadeInDown.delay(330).duration(500).springify()} style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, rtl && styles.rtl]}>
            {rtl ? "تأكيد كلمة المرور" : "Confirm Password"}
          </Text>
          <View style={[styles.inputRow, !!errors.confirmPassword && styles.inputRowError, rtl && styles.inputRowRTL]}>
            <Feather name="lock" size={18} color={Colors.grayMedium} style={rtl ? styles.iconRight : styles.iconLeft} />
            <TextInput
              ref={confirmRef}
              style={[styles.input, rtl && styles.inputRTL]}
              placeholder={rtl ? "تأكيد كلمة المرور" : "Confirm new password"}
              placeholderTextColor={Colors.grayMedium}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: "" })); }}
              secureTextEntry={!showConfirm}
              returnKeyType="done"
              onSubmitEditing={handleReset}
              textAlign={rtl ? "right" : "left"}
            />
            <TouchableOpacity onPress={() => setShowConfirm((p) => !p)} hitSlop={8}>
              <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={Colors.grayMedium} />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? <Text style={[styles.errorText, rtl && styles.rtl]}>{errors.confirmPassword}</Text> : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(390).duration(500).springify()} style={styles.btnWrap}>
          <Button
            label={rtl ? "إعادة تعيين كلمة المرور" : "Reset Password"}
            onPress={handleReset}
            disabled={loading || !!successMsg}
            loading={loading}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: Spacing.xl, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },

  backBtn: { alignSelf: "flex-start", padding: 4, marginBottom: Spacing.lg },
  backBtnRTL: { alignSelf: "flex-end" },

  iconWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.md,
  },

  title: {
    fontSize: 26, fontWeight: "800", color: Colors.grayDark,
    textAlign: "center", marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15, color: Colors.grayMedium, lineHeight: 22,
    textAlign: "center", marginBottom: Spacing.lg,
  },

  successBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.greenLight, borderRadius: 12,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  successText: { flex: 1, fontSize: 14, color: Colors.greenDark, fontWeight: "600" },

  errorBanner: {
    backgroundColor: "#fef2f2", borderRadius: 12,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorBannerText: { fontSize: 14, color: "#ef4444" },

  fieldWrap: { gap: 6, marginBottom: Spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: Colors.grayDark },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md, height: 52,
  },
  inputRowRTL: { flexDirection: "row-reverse" },
  inputRowError: { borderColor: "#ef4444" },
  iconLeft: { marginRight: 10 },
  iconRight: { marginLeft: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.grayDark },
  inputRTL: { textAlign: "right" },
  errorText: { fontSize: 12, color: "#ef4444", marginTop: 2 },

  btnWrap: { marginTop: Spacing.sm },
});
