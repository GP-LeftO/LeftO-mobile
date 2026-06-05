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
import { useAuth } from "../../hooks/auth/useAuth";

export type PostLoginRoute =
  | "buyer-home"
  | "seller-setup"
  | "seller-dashboard"
  | "charity-dashboard"
  | "under-review"
  | "rejected";

interface SignInScreenProps {
  onSuccess?: (route: PostLoginRoute) => void;
  onBack?: () => void;
  onRegister?: () => void;
  onForgotPassword?: () => void;
  navigation?: any;
  role?: "buyer" | "seller" | "charity";
}

export default function SignInScreen({ onSuccess, onBack, onRegister, onForgotPassword, navigation, role }: SignInScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const { login, loginState } = useAuth();

  const phoneRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10)
      e.phone = rtl ? "يرجى إدخال رقم هاتف صحيح (10 أرقام)" : "Please enter a valid 10-digit phone number";
    if (!password)
      e.password = rtl ? "يرجى إدخال كلمة المرور" : "Please enter your password";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resolveRoute = (
    role: string,
    sellerStatus: string | null,
    charityStatus: string | null
  ): PostLoginRoute => {
    if (role === "BUYER") return "buyer-home";
    const status = role === "SELLER" ? sellerStatus : charityStatus;
    if (status === "APPROVED") return role === "SELLER" ? "seller-dashboard" : "charity-dashboard";
    if (status === "REJECTED") return "rejected";
    if (status === "PENDING") return "under-review";
    return role === "SELLER" ? "seller-setup" : "under-review";
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    const fullPhone = phone.replace(/\D/g, "");
    try {
      const result = await login(fullPhone, password);
      const route = resolveRoute(result.user.role, result.sellerStatus, result.charityStatus);
      if (onSuccess) onSuccess(route);
    } catch {}
  };

  return (
    <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 12, paddingBottom: bottomPadding + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8} disabled={loginState.loading}>
            <Feather name="arrow-left" size={20} color={Colors.grayDark} />
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={[styles.titleBlock, rtl && styles.titleBlockRTL]}>
          <View style={styles.iconWrap}>
            <Feather name="log-in" size={28} color={Colors.primaryOrange} />
          </View>
          {role && (
            <View style={styles.roleBadge}>
              <Feather
                name={role === "buyer" ? "shopping-bag" : role === "seller" ? "tag" : "heart"}
                size={13}
                color={Colors.primaryOrange}
              />
              <Text style={styles.roleBadgeText}>
                {role === "buyer"
                  ? (rtl ? "مشترٍ" : "Buyer")
                  : role === "seller"
                  ? (rtl ? "بائع" : "Seller")
                  : (rtl ? "جمعية خيرية" : "Charity")}
              </Text>
            </View>
          )}
          <Text style={[styles.title, rtl && styles.rtl]}>
            {rtl ? "أهلاً بعودتك" : "Welcome back"}
          </Text>
          <Text style={[styles.subtitle, rtl && styles.rtl]}>
            {rtl ? "أدخل رقم هاتفك وكلمة المرور للمتابعة" : "Enter your phone number and password to continue"}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(500).springify()} style={styles.form}>

          {/* Phone */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, rtl && styles.rtl]}>{rtl ? "رقم الهاتف" : "Phone Number"}</Text>
            <View style={[styles.inputRow, phoneFocused && styles.inputFocused, !!errors.phone && styles.inputError]}>
              <Feather name="phone" size={18} color={phoneFocused ? Colors.primaryOrange : Colors.grayMedium} />
              <TextInput
                ref={phoneRef}
                style={[styles.input, rtl && styles.rtl]}
                value={phone}
                onChangeText={(v) => { setPhone(v); setErrors((e) => ({ ...e, phone: "" })); }}
                placeholder="0590000000"
                placeholderTextColor={Colors.grayMedium}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                submitBehavior="submit"
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                maxLength={15}
                textAlign={rtl ? "right" : "left"}
                editable={!loginState.loading}
              />
            </View>
            {!!errors.phone && <Text style={[styles.errorText, rtl && styles.rtl]}>{errors.phone}</Text>}
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, rtl && styles.rtl]}>{rtl ? "كلمة المرور" : "Password"}</Text>
            <View style={[styles.inputRow, passwordFocused && styles.inputFocused, !!errors.password && styles.inputError]}>
              <Feather name="lock" size={18} color={passwordFocused ? Colors.primaryOrange : Colors.grayMedium} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, rtl && styles.rtl]}
                value={password}
                onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: "" })); }}
                placeholder={rtl ? "أدخل كلمة المرور" : "Enter your password"}
                placeholderTextColor={Colors.grayMedium}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                textAlign={rtl ? "right" : "left"}
                editable={!loginState.loading}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={Colors.grayMedium} />
              </TouchableOpacity>
            </View>
            {!!errors.password && <Text style={[styles.errorText, rtl && styles.rtl]}>{errors.password}</Text>}
            {onForgotPassword && (
              <TouchableOpacity onPress={onForgotPassword} style={[styles.forgotRow, rtl && styles.forgotRowRTL]} disabled={loginState.loading}>
                <Text style={styles.forgotLink}>{rtl ? "نسيت كلمة المرور؟" : "Forgot password?"}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* API error */}
          {!!loginState.error && (
            <View style={styles.apiErrorBox}>
              <Feather name="alert-circle" size={16} color="#ef4444" />
              <Text style={[styles.apiErrorText, rtl && styles.rtl]}>{loginState.error}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).duration(500).springify()}>
          <Button
            label={rtl ? "تسجيل الدخول" : "Sign In"}
            onPress={handleSignIn}
            variant="primary"
            loading={loginState.loading}
            testID="sign-in-btn"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(500).springify()} style={styles.registerRow}>
          <Text style={styles.registerLabel}>{rtl ? "ليس لديك حساب؟" : "Don't have an account?"}</Text>
          <TouchableOpacity onPress={onRegister} disabled={loginState.loading}>
            <Text style={styles.registerLink}>{rtl ? "سجّل الآن" : "Register"}</Text>
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

  headerRow: { flexDirection: "row", alignItems: "center" },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },

  titleBlock: { gap: Spacing.sm, alignItems: "flex-start" },
  titleBlockRTL: { alignItems: "flex-end" },
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.orangeLight,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    alignSelf: "flex-start",
  },
  roleBadgeText: { fontSize: 13, fontWeight: "700", color: Colors.primaryOrange },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  title: { fontSize: 26, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.5, width: "100%" },
  subtitle: { fontSize: 15, color: Colors.grayMedium, lineHeight: 22, width: "100%" },

  form: { gap: Spacing.md },
  fieldWrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.grayDark },


  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md, height: 54,
  },
  inputFocused: { borderColor: Colors.primaryOrange },
  inputError: { borderColor: "#ef4444" },
  input: { flex: 1, fontSize: 15, color: Colors.grayDark },
  errorText: { fontSize: 13, color: "#ef4444" },

  apiErrorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#fef2f2", borderRadius: 12, padding: Spacing.md,
    borderWidth: 1, borderColor: "#fecaca",
  },
  apiErrorText: { flex: 1, fontSize: 13, color: "#dc2626", lineHeight: 18 },

  registerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  registerLabel: { fontSize: 14, color: Colors.grayMedium },
  registerLink: { fontSize: 14, fontWeight: "700", color: Colors.primaryOrange },
  forgotRow: { alignSelf: "flex-end", marginTop: 4 },
  forgotRowRTL: { alignSelf: "flex-start" },
  forgotLink: { fontSize: 13, fontWeight: "600", color: Colors.primaryOrange },
});
