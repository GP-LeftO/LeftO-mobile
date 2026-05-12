import React, { useState } from "react";
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Platform, KeyboardAvoidingView, ScrollView,
  ActivityIndicator,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Button from "../../components/shared/Button";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import StepIndicator from "../../components/auth/StepIndicator";
import { useAuth } from "../../hooks/auth/useAuth";

interface PhoneEntryScreenProps {
  onComplete?: (phone: string) => void;
  onBack?: () => void;
  onSignIn?: () => void;
  navigation?: any;
}

const COUNTRY_CODES = [
  { code: "970", flag: "🇵🇸", name: "Palestine" },
  { code: "972", flag: "🇵🇸", name: "Palestine (972)" },
];

export default function PhoneEntryScreen({ onComplete, onBack, onSignIn, navigation }: PhoneEntryScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const { sendOtp, sendOtpState } = useAuth();

  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);

  const validate = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError(rtl ? "يرجى إدخال رقم هاتف صحيح (10 أرقام)" : "Please enter a valid 10-digit phone number");
      return false;
    }
    setError("");
    return true;
  };

  const handleContinue = async () => {
    if (!validate()) return;
    const full = phone.replace(/\D/g, "");
    try {
      await sendOtp(full);
      if (onComplete) onComplete(full);
      else if (navigation) navigation.navigate("OTPVerification", { phone: full });
    } catch {
    }
  };

  const displayError = error || sendOtpState.error || "";

  return (
    <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 12, paddingBottom: bottomPadding + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
            <Feather name="arrow-left" size={20} color={Colors.grayDark} />
          </TouchableOpacity>
          <View style={styles.stepWrap}>
            <StepIndicator current={1} total={5} />
          </View>
        </View>

        <Animated.View
          entering={FadeInDown.delay(100).duration(500).springify()}
          style={[styles.titleBlock, rtl && styles.titleBlockRTL]}
        >
          <View style={[styles.iconWrap, rtl && styles.iconWrapRTL]}>
            <Feather name="phone" size={28} color={Colors.primaryOrange} />
          </View>
          <Text style={[styles.title, rtl && styles.rtl]}>
            {rtl ? "أدخل رقم هاتفك" : "Enter your phone number"}
          </Text>
          <Text style={[styles.subtitle, rtl && styles.rtl]}>
            {rtl
              ? "سنرسل لك رمز تحقق لتأكيد هويتك"
              : "We'll send you a verification code to confirm your identity"}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500).springify()} style={styles.inputGroup}>
          <TouchableOpacity
            style={[styles.countryBtn, rtl && styles.rtlRow]}
            onPress={() => setShowPicker(!showPicker)}
            activeOpacity={0.8}
          >
            <Text style={styles.flag}>{selectedCountry.flag}</Text>
            <Text style={styles.countryCode}>{selectedCountry.code}</Text>
            <Feather name={showPicker ? "chevron-up" : "chevron-down"} size={16} color={Colors.grayMedium} />
          </TouchableOpacity>

          {showPicker && (
            <View style={styles.picker}>
              {COUNTRY_CODES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.pickerItem, selectedCountry.code === c.code && styles.pickerItemActive]}
                  onPress={() => { setSelectedCountry(c); setShowPicker(false); }}
                >
                  <Text style={styles.flag}>{c.flag}</Text>
                  <Text style={styles.pickerName}>{c.name}</Text>
                  <Text style={styles.pickerCode}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={[styles.phoneRow, focused && styles.phoneFocused, !!displayError && styles.phoneError]}>
            <TextInput
              style={[styles.phoneInput, rtl && styles.rtl]}
              value={phone}
              onChangeText={(v) => { setPhone(v); setError(""); }}
              placeholder="0590000000"
              placeholderTextColor={Colors.grayMedium}
              keyboardType="phone-pad"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={15}
              textAlign={rtl ? "right" : "left"}
              editable={!sendOtpState.loading}
            />
          </View>
          {!!displayError && <Text style={[styles.errorText, rtl && styles.rtl]}>{displayError}</Text>}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500).springify()} style={[styles.note, rtl && styles.noteRTL]}>
          <Feather name="lock" size={13} color={Colors.grayMedium} />
          <Text style={[styles.noteText, rtl && styles.rtl]}>
            {rtl
              ? "رقمك يُستخدم للتحقق فقط ولن يُشارك مع أي جهة"
              : "Your number is only used for verification and is never shared"}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(380).duration(500).springify()}>
          <Button
            label={rtl ? "إرسال الرمز" : "Send Code"}
            onPress={handleContinue}
            variant="primary"
            loading={sendOtpState.loading}
            testID="send-code"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(460).duration(500).springify()} style={styles.signInRow}>
          <Text style={styles.signInLabel}>{rtl ? "لديك حساب بالفعل؟" : "Already have an account?"}</Text>
          <TouchableOpacity onPress={onSignIn} disabled={sendOtpState.loading} hitSlop={{ top: 8, bottom: 8 }}>
            <Text style={styles.signInLink}>{rtl ? "سجّل دخولك" : "Sign in"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  rtl: { textAlign: "right" },
  rtlRow: { flexDirection: "row-reverse" },

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

  titleBlock: { gap: Spacing.sm, alignItems: "flex-start" },
  titleBlockRTL: { alignItems: "flex-end" },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  iconWrapRTL: { alignSelf: "flex-end" },

  title: { fontSize: 26, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.5, width: "100%" },
  subtitle: { fontSize: 15, color: Colors.grayMedium, lineHeight: 22, width: "100%" },

  inputGroup: { gap: Spacing.sm },
  countryBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  flag: { fontSize: 22 },
  countryCode: { flex: 1, fontSize: 16, fontWeight: "600", color: Colors.grayDark },
  picker: {
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  pickerItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  pickerItemActive: { backgroundColor: Colors.orangeLight },
  pickerName: { flex: 1, fontSize: 15, color: Colors.grayDark },
  pickerCode: { fontSize: 14, color: Colors.grayMedium, fontWeight: "600" },

  phoneRow: {
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md, height: 54, justifyContent: "center",
  },
  phoneFocused: { borderColor: Colors.primaryOrange },
  phoneError: { borderColor: "#ef4444" },
  phoneInput: { fontSize: 18, color: Colors.grayDark, letterSpacing: 1 },
  errorText: { fontSize: 13, color: "#ef4444" },

  note: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  noteRTL: { flexDirection: "row-reverse" },
  noteText: { flex: 1, fontSize: 13, color: Colors.grayMedium, lineHeight: 18 },

  signInRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  signInLabel: { fontSize: 14, color: Colors.grayMedium },
  signInLink: { fontSize: 14, fontWeight: "700", color: Colors.primaryOrange },
});
