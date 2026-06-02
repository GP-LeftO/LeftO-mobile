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
import { forgotPassword } from "../../services/auth/auth.service";

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onCodeSent: (phone: string) => void;
}

export default function ForgotPasswordScreen({ onBack, onCodeSent }: ForgotPasswordScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const rtl        = isRTL();

  const [phone,   setPhone]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setError(rtl ? "أدخل رقم هاتف صحيح" : "Enter a valid phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await forgotPassword(phone.trim());
      onCodeSent(phone.trim());
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (rtl ? "تعذّر إرسال الرمز. حاول مجدداً." : "Could not send code. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { paddingTop: topPadding }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(60).duration(500).springify()} style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
          </TouchableOpacity>
        </Animated.View>

        {/* Icon */}
        <Animated.View entering={FadeInDown.delay(120).duration(500).springify()} style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Feather name="lock" size={32} color={Colors.primaryOrange} />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(180).duration(500).springify()}>
          <Text style={[styles.title, rtl && styles.textRight]}>
            {rtl ? "نسيت كلمة المرور؟" : "Forgot Password?"}
          </Text>
          <Text style={[styles.subtitle, rtl && styles.textRight]}>
            {rtl
              ? "أدخل رقم هاتفك وسنرسل لك رمز إعادة التعيين"
              : "Enter your phone number and we'll send you a reset code"}
          </Text>
        </Animated.View>

        {/* Phone input */}
        <Animated.View entering={FadeInDown.delay(240).duration(500).springify()} style={styles.fieldWrap}>
          <Text style={[styles.label, rtl && styles.textRight]}>
            {rtl ? "رقم الهاتف" : "Phone Number"}
          </Text>
          <View style={[styles.inputWrap, error && styles.inputWrapError, rtl && styles.inputWrapRTL]}>
            <Feather name="phone" size={16} color={Colors.grayMedium} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, rtl && styles.textRight]}
              placeholder={rtl ? "0590000000" : "0590000000"}
              placeholderTextColor={Colors.grayMedium}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={v => { setPhone(v); setError(""); }}
              textAlign={rtl ? "right" : "left"}
              autoFocus
            />
          </View>
          {error !== "" && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={13} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </Animated.View>

        {/* Submit */}
        <Animated.View entering={FadeInDown.delay(300).duration(500).springify()}>
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSend}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.btnText}>{rtl ? "إرسال رمز التعيين" : "Send Reset Code"}</Text>
            )}
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

  headerRow: { flexDirection: "row", alignItems: "center" },
  backBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.grayLight, alignItems: "center", justifyContent: "center" },

  iconWrap:   { alignItems: "center", marginVertical: Spacing.lg },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center" },

  title:    { fontSize: 26, fontWeight: "800", color: Colors.grayDark, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.grayMedium, lineHeight: 22 },

  fieldWrap: { gap: 8 },
  label:     { fontSize: 14, fontWeight: "600", color: Colors.grayDark },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md, paddingVertical: 2,
  },
  inputWrapError: { borderColor: "#ef4444" },
  inputWrapRTL:   { flexDirection: "row-reverse" },
  inputIcon:      { flexShrink: 0 },
  input:          { flex: 1, fontSize: 16, color: Colors.grayDark, paddingVertical: 13 },
  errorRow:       { flexDirection: "row", alignItems: "center", gap: 5 },
  errorText:      { fontSize: 12, color: "#ef4444" },

  btn:         { backgroundColor: Colors.primaryOrange, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  btnText:     { fontSize: 16, fontWeight: "800", color: Colors.white },
});
