import React, { useState } from "react";
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { resetPassword } from "../../services/auth/auth.service";

interface ResetPasswordScreenProps {
  phone: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function ResetPasswordScreen({ phone, onBack, onSuccess }: ResetPasswordScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const rtl        = isRTL();

  const [code,        setCode]        = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const handleReset = async () => {
    if (code.length < 4) {
      setError(rtl ? "أدخل رمز التحقق" : "Enter the verification code");
      return;
    }
    if (password.length < 6) {
      setError(rtl ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError(rtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(phone, code, password);
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (rtl ? "تعذّر إعادة التعيين. تحقق من الرمز وحاول مجدداً." : "Could not reset password. Check the code and try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: topPadding }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Animated.View entering={FadeInDown.delay(60).duration(500).springify()} style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(500).springify()} style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Feather name="key" size={32} color={Colors.primaryOrange} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(500).springify()}>
          <Text style={[styles.title, rtl && styles.textRight]}>
            {rtl ? "إعادة تعيين كلمة المرور" : "Reset Password"}
          </Text>
          <Text style={[styles.subtitle, rtl && styles.textRight]}>
            {rtl
              ? `أدخل الرمز المرسل إلى ${phone} ثم اختر كلمة مرور جديدة`
              : `Enter the code sent to ${phone} and choose a new password`}
          </Text>
        </Animated.View>

        {/* Code */}
        <Animated.View entering={FadeInDown.delay(240).duration(500).springify()} style={styles.fieldWrap}>
          <Text style={[styles.label, rtl && styles.textRight]}>{rtl ? "رمز التحقق" : "Verification Code"}</Text>
          <TextInput
            style={[styles.codeInput, rtl && styles.textRight]}
            placeholder="- - - - - -"
            placeholderTextColor={Colors.grayMedium}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={v => { setCode(v); setError(""); }}
            textAlign="center"
          />
        </Animated.View>

        {/* New password */}
        <Animated.View entering={FadeInDown.delay(290).duration(500).springify()} style={styles.fieldWrap}>
          <Text style={[styles.label, rtl && styles.textRight]}>{rtl ? "كلمة المرور الجديدة" : "New Password"}</Text>
          <View style={[styles.inputWrap, rtl && styles.inputWrapRTL]}>
            <Feather name="lock" size={16} color={Colors.grayMedium} />
            <TextInput
              style={[styles.input, rtl && styles.textRight]}
              placeholder={rtl ? "6 أحرف على الأقل" : "At least 6 characters"}
              placeholderTextColor={Colors.grayMedium}
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={v => { setPassword(v); setError(""); }}
              textAlign={rtl ? "right" : "left"}
            />
            <TouchableOpacity onPress={() => setShowPwd(p => !p)} activeOpacity={0.7}>
              <Feather name={showPwd ? "eye-off" : "eye"} size={16} color={Colors.grayMedium} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Confirm password */}
        <Animated.View entering={FadeInDown.delay(330).duration(500).springify()} style={styles.fieldWrap}>
          <Text style={[styles.label, rtl && styles.textRight]}>{rtl ? "تأكيد كلمة المرور" : "Confirm Password"}</Text>
          <View style={[styles.inputWrap, rtl && styles.inputWrapRTL]}>
            <Feather name="lock" size={16} color={Colors.grayMedium} />
            <TextInput
              style={[styles.input, rtl && styles.textRight]}
              placeholder={rtl ? "أعد إدخال كلمة المرور" : "Re-enter password"}
              placeholderTextColor={Colors.grayMedium}
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={v => { setConfirm(v); setError(""); }}
              textAlign={rtl ? "right" : "left"}
            />
            <TouchableOpacity onPress={() => setShowConfirm(p => !p)} activeOpacity={0.7}>
              <Feather name={showConfirm ? "eye-off" : "eye"} size={16} color={Colors.grayMedium} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Error */}
        {error !== "" && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBox}>
            <Feather name="alert-circle" size={15} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* Submit */}
        <Animated.View entering={FadeInDown.delay(380).duration(500).springify()}>
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleReset}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={styles.btnText}>{rtl ? "تعيين كلمة المرور" : "Reset Password"}</Text>}
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.background },
  scroll:    { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.lg, paddingBottom: 40 },
  textRight: { textAlign: "right" },

  headerRow: { flexDirection: "row" },
  backBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.grayLight, alignItems: "center", justifyContent: "center" },

  iconWrap:   { alignItems: "center", marginVertical: Spacing.md },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center" },

  title:    { fontSize: 24, fontWeight: "800", color: Colors.grayDark, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.grayMedium, lineHeight: 21 },

  fieldWrap: { gap: 8 },
  label:     { fontSize: 14, fontWeight: "600", color: Colors.grayDark },

  codeInput: {
    backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingVertical: 16, fontSize: 24, fontWeight: "800", color: Colors.grayDark, letterSpacing: 8,
  },

  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md,
  },
  inputWrapRTL: { flexDirection: "row-reverse" },
  input:        { flex: 1, fontSize: 15, color: Colors.grayDark, paddingVertical: 13 },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fef2f2", borderRadius: 12, padding: Spacing.md,
  },
  errorText: { fontSize: 13, color: "#ef4444", flex: 1 },

  btn:         { backgroundColor: Colors.primaryOrange, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontSize: 16, fontWeight: "800", color: Colors.white },
});
