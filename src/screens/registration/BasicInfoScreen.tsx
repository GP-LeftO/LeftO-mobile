import React, { useState } from "react";
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
import StepIndicator from "../../components/auth/StepIndicator";

interface BasicInfoScreenProps {
  role?: string;
  onComplete?: (info: { name: string; email: string; password: string }) => void;
  onBack?: () => void;
  navigation?: any;
  isRegistering?: boolean;
  registerError?: string;
}

export default function BasicInfoScreen({ role, onComplete, onBack, navigation, isRegistering = false, registerError = "" }: BasicInfoScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const nameLabel = rtl
    ? (role === "seller" ? "اسم العمل" : role === "charity" ? "اسم المنظمة" : "الاسم الكامل")
    : (role === "seller" ? "Business Name" : role === "charity" ? "Organization Name" : "Full Name");

  const namePlaceholder = role === "seller" ? "Al-Andalus Bakery" : role === "charity" ? "Nablus Food Bank" : "Tala Alhendi";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = rtl ? `${nameLabel} مطلوب` : `${nameLabel} is required`;
    if (!email.trim()) e.email = rtl ? "البريد الإلكتروني مطلوب" : "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = rtl ? "أدخل بريداً إلكترونياً صحيحاً" : "Enter a valid email";
    if (!password) e.password = rtl ? "كلمة المرور مطلوبة" : "Password is required";
    else if (password.length < 8) e.password = rtl ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters";
    if (!confirmPassword) e.confirm = rtl ? "يرجى تأكيد كلمة المرور" : "Please confirm your password";
    else if (password !== confirmPassword) e.confirm = rtl ? "كلمتا المرور غير متطابقتين" : "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    if (onComplete) onComplete({ name, email, password });
    else if (navigation) navigation.navigate("RoleSpecificInfo", { role, name, email });
  };

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
            <StepIndicator current={4} total={role === "buyer" ? 6 : 5} />
          </View>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.titleBlock}>
          <View style={styles.iconWrap}>
            <Feather name="user" size={28} color={Colors.primaryOrange} />
          </View>
          <Text style={[styles.title, rtl && styles.rtl]}>
            {rtl ? "المعلومات الأساسية" : "Basic information"}
          </Text>
          <Text style={[styles.subtitle, rtl && styles.rtl]}>
            {rtl ? "أخبرنا قليلاً عن نفسك" : "Tell us a bit about yourself"}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500).springify()} style={styles.form}>

          {/* Name */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, rtl && styles.rtl]}>{nameLabel}</Text>
            <View style={[styles.inputRow, rtl && styles.inputRowRTL, nameFocused && styles.inputFocused, !!errors.name && styles.inputError]}>
              <Feather name={role === "seller" ? "briefcase" : role === "charity" ? "heart" : "user"} size={18} color={nameFocused ? Colors.primaryOrange : Colors.grayMedium} />
              <TextInput
                style={[styles.input, rtl && styles.rtl]}
                value={name}
                onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: "" })); }}
                placeholder={namePlaceholder}
                placeholderTextColor={Colors.grayMedium}
                autoCapitalize="words"
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                textAlign={rtl ? "right" : "left"}
              />
            </View>
            {!!errors.name && <Text style={[styles.errorText, rtl && styles.rtl]}>{errors.name}</Text>}
          </View>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, rtl && styles.rtl]}>
              {rtl ? "البريد الإلكتروني" : "Email Address"}
            </Text>
            <View style={[styles.inputRow, rtl && styles.inputRowRTL, emailFocused && styles.inputFocused, !!errors.email && styles.inputError]}>
              <Feather name="mail" size={18} color={emailFocused ? Colors.primaryOrange : Colors.grayMedium} />
              <TextInput
                style={[styles.input, rtl && styles.rtl]}
                value={email}
                onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: "" })); }}
                placeholder="hello@lefto.com"
                placeholderTextColor={Colors.grayMedium}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                textAlign={rtl ? "right" : "left"}
              />
            </View>
            {!!errors.email && <Text style={[styles.errorText, rtl && styles.rtl]}>{errors.email}</Text>}
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, rtl && styles.rtl]}>
              {rtl ? "كلمة المرور" : "Password"}
            </Text>
            <View style={[styles.inputRow, rtl && styles.inputRowRTL, passwordFocused && styles.inputFocused, !!errors.password && styles.inputError]}>
              <Feather name="lock" size={18} color={passwordFocused ? Colors.primaryOrange : Colors.grayMedium} />
              <TextInput
                style={[styles.input, rtl && styles.rtl]}
                value={password}
                onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: "" })); }}
                placeholder={rtl ? "٨ أحرف على الأقل" : "At least 8 characters"}
                placeholderTextColor={Colors.grayMedium}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                textAlign={rtl ? "right" : "left"}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={Colors.grayMedium} />
              </TouchableOpacity>
            </View>
            {!!errors.password && <Text style={[styles.errorText, rtl && styles.rtl]}>{errors.password}</Text>}
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, rtl && styles.rtl]}>
              {rtl ? "تأكيد كلمة المرور" : "Confirm Password"}
            </Text>
            <View style={[styles.inputRow, rtl && styles.inputRowRTL, confirmFocused && styles.inputFocused, !!errors.confirm && styles.inputError]}>
              <Feather name="lock" size={18} color={confirmFocused ? Colors.primaryOrange : Colors.grayMedium} />
              <TextInput
                style={[styles.input, rtl && styles.rtl]}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirm: "" })); }}
                placeholder={rtl ? "أعد إدخال كلمة المرور" : "Re-enter your password"}
                placeholderTextColor={Colors.grayMedium}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                textAlign={rtl ? "right" : "left"}
              />
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name={showConfirm ? "eye-off" : "eye"} size={18} color={Colors.grayMedium} />
              </TouchableOpacity>
            </View>
            {!!errors.confirm && <Text style={[styles.errorText, rtl && styles.rtl]}>{errors.confirm}</Text>}
          </View>

        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).duration(500).springify()}>
          {!!registerError && (
            <Text style={[styles.errorText, rtl && styles.rtl, { marginBottom: 10 }]}>{registerError}</Text>
          )}
          <Button
            label={isRegistering ? (rtl ? "جاري التسجيل..." : "Registering...") : (rtl ? "متابعة" : "Continue")}
            onPress={handleContinue}
            variant="primary"
            disabled={isRegistering}
            testID="basic-info-continue"
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  rtl: { textAlign: "right" },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerRowRTL: { flexDirection: "row-reverse" },
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

  form: { gap: Spacing.md },
  fieldWrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.grayDark },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md, height: 54,
  },
  inputRowRTL: { flexDirection: "row-reverse" },
  inputFocused: { borderColor: Colors.primaryOrange },
  inputError: { borderColor: "#ef4444" },
  input: { flex: 1, fontSize: 15, color: Colors.grayDark },
  errorText: { fontSize: 13, color: "#ef4444" },
});
