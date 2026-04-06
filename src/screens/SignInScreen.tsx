import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import LeftOLogo from "../components/LeftOLogo";
import Button from "../components/Button";
import { Colors, Spacing } from "../theme";

interface SignInScreenProps {
  onSignIn?: () => void;
  onGoToSignUp?: () => void;
  navigation?: any;
}

export default function SignInScreen({ onSignIn, onGoToSignUp, navigation }: SignInScreenProps) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = () => {
    if (validate()) {
      if (onSignIn) onSignIn();
      else if (navigation) navigation.replace("Main");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Floating background shapes */}
      <View style={styles.bgContainer} pointerEvents="none">
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />
        <View style={[styles.blob, styles.blob4]} />
        <View style={[styles.blob, styles.blob5]} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding + 12, paddingBottom: bottomPadding + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(50).duration(500).springify()} style={styles.logoRow}>
          <LeftOLogo size="sm" />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500).springify()} style={styles.titleBlock}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue fighting food waste</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500).springify()} style={styles.form}>
          <View style={styles.fieldWrapper}>
            <Text style={styles.label}>Email</Text>
            <InputField
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: "" })); }}
              placeholder="hello@lefto.com"
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              error={errors.email}
              icon="mail"
            />
          </View>

          <View style={styles.fieldWrapper}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity testID="forgot-password">
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <InputField
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: "" })); }}
              placeholder="Your password"
              secureTextEntry={!showPassword}
              autoComplete="current-password"
              error={errors.password}
              icon="lock"
              rightIcon={showPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPassword((p) => !p)}
            />
          </View>

          <Button
            label="Sign In"
            onPress={handleSignIn}
            variant="primary"
            style={styles.submitButton}
            testID="signin-submit"
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity onPress={() => { if (onGoToSignUp) onGoToSignUp(); else if (navigation) navigation.navigate("SignUp"); }} style={styles.switchRow} testID="go-to-signup">
            <Text style={styles.switchText}>Don't have an account? </Text>
            <Text style={styles.switchLink}>Create one</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).duration(500).springify()}
          style={styles.termsBlock}
        >
          <Text style={styles.termsText}>
            By continuing, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {" "}and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface InputFieldProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoComplete?: any;
  autoCapitalize?: "none" | "sentences";
  error?: string;
  icon: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
}

function InputField({
  value, onChangeText, placeholder, secureTextEntry,
  keyboardType = "default", autoComplete, autoCapitalize = "sentences",
  error, icon, rightIcon, onRightIconPress,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <>
      <View style={[styles.inputRow, focused && styles.inputFocused, !!error && styles.inputError]}>
        <Feather
          name={icon}
          size={18}
          color={focused ? Colors.primaryOrange : Colors.grayMedium}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.grayMedium}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Feather name={rightIcon} size={18} color={Colors.grayMedium} />
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: Colors.background },
  bgContainer: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },

  blob: { position: "absolute", borderRadius: 999 },
  blob1: {
    width: 260, height: 260,
    top: -80, left: -80,
    backgroundColor: Colors.primaryOrange,
    opacity: 0.09,
  },
  blob2: {
    width: 160, height: 160,
    top: 100, right: -50,
    backgroundColor: Colors.greenMain,
    opacity: 0.07,
  },
  blob3: {
    width: 110, height: 110,
    top: 340, left: 30,
    backgroundColor: Colors.orangeLight,
    opacity: 0.55,
  },
  blob4: {
    width: 200, height: 200,
    bottom: 100, right: -70,
    backgroundColor: Colors.primaryOrange,
    opacity: 0.08,
  },
  blob5: {
    width: 80, height: 80,
    bottom: 200, left: -10,
    backgroundColor: Colors.greenLight,
    opacity: 0.65,
  },

  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  logoRow: { alignItems: "flex-start" },
  titleBlock: { gap: Spacing.xs },
  title: { fontSize: 30, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.grayMedium, lineHeight: 22 },
  form: { gap: Spacing.md },
  fieldWrapper: { gap: 6 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 14, fontWeight: "600", color: Colors.grayDark },
  forgotText: { fontSize: 13, fontWeight: "600", color: Colors.primaryOrange },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md,
    height: 54,
  },
  inputFocused: { borderColor: Colors.primaryOrange },
  inputError: { borderColor: "#ef4444" },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: 15, color: Colors.grayDark },
  rightIcon: { padding: 4 },
  errorText: { fontSize: 12, color: "#ef4444", marginTop: 2 },
  submitButton: { marginTop: Spacing.sm },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  divider: { flex: 1, height: 1, backgroundColor: Colors.grayLight },
  dividerText: { fontSize: 13, color: Colors.grayMedium, fontWeight: "500" },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchText: { fontSize: 14, color: Colors.grayMedium },
  switchLink: { fontSize: 14, fontWeight: "700", color: Colors.primaryOrange },
  termsBlock: { alignItems: "center" },
  termsText: { fontSize: 12, color: Colors.grayMedium, textAlign: "center", lineHeight: 18 },
  termsLink: { color: Colors.primaryOrange, fontWeight: "600" },
});
