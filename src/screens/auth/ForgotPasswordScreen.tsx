import React, { useState, useRef } from "react";
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView, Alert,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Button from "../../components/shared/Button";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { forgotPassword } from "../../services/auth/auth.service";

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onOtpSent: (phone: string) => void;
}

export default function ForgotPasswordScreen({ onBack, onOtpSent }: ForgotPasswordScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const phoneRef = useRef<TextInput>(null);
  const [phone, setPhone] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError(rtl
        ? "يرجى إدخال رقم هاتف صحيح (10 أرقام)"
        : "Please enter a valid 10-digit phone number");
      return false;
    }
    setError("");
    return true;
  };

  const handleSend = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await forgotPassword(phone.replace(/\D/g, ""));
      onOtpSent(phone.replace(/\D/g, ""));
    } catch {
      setError(rtl
        ? "تعذّر إرسال الرمز. يرجى المحاولة مجدداً."
        : "Could not send code. Please try again.");
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
        {/* Back button */}
        <TouchableOpacity style={[styles.backBtn, rtl && styles.backBtnRTL]} onPress={onBack} activeOpacity={0.8}>
          <Feather name={rtl ? "arrow-right" : "arrow-left"} size={22} color={Colors.grayDark} />
        </TouchableOpacity>

        <Animated.View entering={FadeInDown.delay(80).duration(500).springify()} style={styles.iconWrap}>
          <Feather name="lock" size={34} color={Colors.primaryOrange} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(130).duration(500).springify()} style={[styles.title, rtl && styles.rtl]}>
          {rtl ? "نسيت كلمة المرور؟" : "Forgot Password?"}
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(180).duration(500).springify()} style={[styles.subtitle, rtl && styles.rtl]}>
          {rtl
            ? "أدخل رقم هاتفك وسنرسل لك رمز إعادة التعيين"
            : "Enter your phone number and we'll send you a reset code"}
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(230).duration(500).springify()} style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, rtl && styles.rtl]}>
            {rtl ? "رقم الهاتف" : "Phone Number"}
          </Text>
          <View style={[styles.inputRow, focused && styles.inputRowFocused, rtl && styles.inputRowRTL]}>
            <Feather name="phone" size={18} color={focused ? Colors.primaryOrange : Colors.grayMedium} style={rtl ? styles.iconRight : styles.iconLeft} />
            <TextInput
              ref={phoneRef}
              style={[styles.input, rtl && styles.inputRTL]}
              placeholder={rtl ? "أدخل رقم هاتفك" : "Enter your phone number"}
              placeholderTextColor={Colors.grayMedium}
              value={phone}
              onChangeText={(v) => { setPhone(v); setError(""); }}
              keyboardType="phone-pad"
              returnKeyType="done"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={handleSend}
              textAlign={rtl ? "right" : "left"}
            />
          </View>
          {error ? <Text style={[styles.errorText, rtl && styles.rtl]}>{error}</Text> : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(290).duration(500).springify()} style={styles.btnWrap}>
          <Button
            label={rtl ? "إرسال رمز التحقق" : "Send Reset Code"}
            onPress={handleSend}
            disabled={loading}
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
    textAlign: "center", marginBottom: Spacing.xl,
  },

  fieldWrap: { gap: 6, marginBottom: Spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: Colors.grayDark },

  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md, height: 52,
  },
  inputRowRTL: { flexDirection: "row-reverse" },
  inputRowFocused: { borderColor: Colors.primaryOrange },
  iconLeft: { marginRight: 10 },
  iconRight: { marginLeft: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.grayDark },
  inputRTL: { textAlign: "right" },

  errorText: { fontSize: 12, color: "#ef4444", marginTop: 2 },
  btnWrap: { marginTop: Spacing.md },
});
