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
import type { UserRole } from "../services/storage";

interface SignUpScreenProps {
  role?: UserRole;
  onSignUp?: () => void;
  onGoToSignIn?: () => void;
  navigation?: any;
}

const BUSINESS_TYPES = ["Restaurant", "Market", "Bakery"] as const;
type BusinessType = (typeof BUSINESS_TYPES)[number];

const ROLE_CONTENT: Record<
  string,
  { title: string; subtitle: string; namePlaceholder: string; nameLabel: string; nameIcon: string }
> = {
  buyer: {
    title: "Create your account",
    subtitle: "Join LeftO and save food while saving money",
    nameLabel: "Full Name",
    namePlaceholder: "Tala Alhendi",
    nameIcon: "user",
  },
  seller: {
    title: "Register your business",
    subtitle: "List your surplus food and reduce waste",
    nameLabel: "Business Name",
    namePlaceholder: "Al-Andalus Bakery",
    nameIcon: "briefcase",
  },
  charity: {
    title: "Register your organization",
    subtitle: "Help us fight hunger in your community",
    nameLabel: "Organization Name",
    namePlaceholder: "Nablus Food Bank",
    nameIcon: "heart",
  },
};

export default function SignUpScreen({ role = "buyer", onSignUp, onGoToSignIn, navigation }: SignUpScreenProps) {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const content = ROLE_CONTENT[role ?? "buyer"];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType>("Restaurant");
  const [description, setDescription] = useState("");
  const [docUploaded, setDocUploaded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = `${content.nameLabel} is required`;
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!phone.trim()) e.phone = "Phone number is required";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "At least 8 characters";
    if (!confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords don't match";
    if (role === "charity" && !description.trim()) e.description = "Please describe your organization";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignUp = () => {
    if (validate()) {
      if (onSignUp) onSignUp();
      else if (navigation) navigation.replace("Main");
    }
  };

  const clear = (field: string) => setErrors((prev) => ({ ...prev, [field]: "" }));

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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

        {/* Role badge */}
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()}>
          <View style={styles.roleBadge}>
            <Feather
              name={role === "buyer" ? "shopping-bag" : role === "seller" ? "tag" : "heart"}
              size={13}
              color={Colors.primaryOrange}
            />
            <Text style={styles.roleBadgeText}>
              {role === "buyer" ? "Buyer" : role === "seller" ? "Seller" : "Charity"}
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500).springify()} style={styles.titleBlock}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500).springify()} style={styles.form}>

          {/* Name field — adapts label/placeholder/icon per role */}
          <Field
            label={content.nameLabel}
            value={name}
            onChangeText={(v) => { setName(v); clear("name"); }}
            placeholder={content.namePlaceholder}
            autoComplete="name"
            error={errors.name}
            icon={content.nameIcon as any}
          />

          {/* Business type picker — Seller only */}
          {role === "seller" && (
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Business Type</Text>
              <View style={styles.pillRow}>
                {BUSINESS_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pill, businessType === t && styles.pillActive]}
                    onPress={() => setBusinessType(t)}
                  >
                    <Text style={[styles.pillText, businessType === t && styles.pillTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Description — Charity only */}
          {role === "charity" && (
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Organization Description</Text>
              <View style={[styles.textAreaRow, !!errors.description && styles.inputError]}>
                <TextInput
                  style={styles.textArea}
                  value={description}
                  onChangeText={(v) => { setDescription(v); clear("description"); }}
                  placeholder="Tell us about your organization and how you help the community…"
                  placeholderTextColor={Colors.grayMedium}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
              {!!errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>
          )}

          <Field
            label="Email"
            value={email}
            onChangeText={(v) => { setEmail(v); clear("email"); }}
            placeholder="hello@lefto.com"
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            error={errors.email}
            icon="mail"
          />

          <Field
            label="Phone Number"
            value={phone}
            onChangeText={(v) => { setPhone(v); clear("phone"); }}
            placeholder="+970 59 000 0000"
            keyboardType="phone-pad"
            autoComplete="tel"
            error={errors.phone}
            icon="phone"
          />

          <Field
            label="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); clear("password"); }}
            placeholder="Min. 8 characters"
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            error={errors.password}
            icon="lock"
            rightIcon={showPassword ? "eye-off" : "eye"}
            onRightIconPress={() => setShowPassword((p) => !p)}
          />

          <Field
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); clear("confirmPassword"); }}
            placeholder="Repeat your password"
            secureTextEntry={!showConfirm}
            autoComplete="new-password"
            error={errors.confirmPassword}
            icon="lock"
            rightIcon={showConfirm ? "eye-off" : "eye"}
            onRightIconPress={() => setShowConfirm((p) => !p)}
          />

          {/* Document upload — Seller and Charity */}
          {(role === "seller" || role === "charity") && (
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>
                {role === "seller" ? "Verification Documents" : "Registration Documents"}
              </Text>
              <Text style={styles.fieldHint}>
                {role === "seller"
                  ? "Trade license and food safety permit"
                  : "Official charity registration certificate"}
              </Text>
              <TouchableOpacity
                style={[styles.uploadBtn, docUploaded && styles.uploadBtnDone]}
                onPress={() => setDocUploaded(true)}
              >
                <Feather
                  name={docUploaded ? "check-circle" : "upload"}
                  size={18}
                  color={docUploaded ? Colors.greenMain : Colors.primaryOrange}
                />
                <Text style={[styles.uploadText, docUploaded && styles.uploadTextDone]}>
                  {docUploaded ? "Documents uploaded" : "Upload documents"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit notice for sellers / charities */}
          {(role === "seller" || role === "charity") && (
            <View style={styles.approvalNotice}>
              <Feather name="info" size={14} color={Colors.primaryOrange} />
              <Text style={styles.approvalText}>
                Your account will be reviewed and approved by the LeftO team before activation.
              </Text>
            </View>
          )}

          <Button
            label={role === "buyer" ? "Create Account" : "Submit Application"}
            onPress={handleSignUp}
            variant="primary"
            style={styles.submitButton}
            testID="signup-submit"
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity onPress={() => { if (onGoToSignIn) onGoToSignIn(); else if (navigation) navigation.navigate("Login"); }} style={styles.switchRow} testID="go-to-signin">
            <Text style={styles.switchText}>Already have an account? </Text>
            <Text style={styles.switchLink}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoComplete?: any;
  autoCapitalize?: "none" | "sentences" | "words";
  error?: string;
  icon: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
}

function Field({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType = "default", autoComplete, autoCapitalize = "sentences",
  error, icon, rightIcon, onRightIconPress,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.inputFocused, !!error && styles.inputError]}>
        <Feather name={icon} size={18} color={focused ? Colors.primaryOrange : Colors.grayMedium} style={styles.inputIcon} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: Colors.background },
  bgContainer: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blob: { position: "absolute", borderRadius: 999 },
  blob1: { width: 220, height: 220, top: -60, right: -70, backgroundColor: Colors.primaryOrange, opacity: 0.1 },
  blob2: { width: 140, height: 140, top: 120, left: -50, backgroundColor: Colors.greenMain, opacity: 0.08 },
  blob3: { width: 100, height: 100, top: 280, right: 20, backgroundColor: Colors.orangeLight, opacity: 0.6 },
  blob4: { width: 180, height: 180, bottom: 160, left: -60, backgroundColor: Colors.primaryOrange, opacity: 0.07 },
  blob5: { width: 90, height: 90, bottom: 80, right: -20, backgroundColor: Colors.greenLight, opacity: 0.7 },

  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  logoRow: { alignItems: "flex-start" },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: Colors.orangeLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700", color: Colors.primaryOrange },

  titleBlock: { gap: Spacing.xs },
  title: { fontSize: 28, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.grayMedium, lineHeight: 22 },

  form: { gap: Spacing.md },
  fieldWrapper: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.grayDark },
  fieldHint: { fontSize: 12, color: Colors.grayMedium, marginTop: -2 },

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

  textAreaRow: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    minHeight: 90,
  },
  textArea: { fontSize: 15, color: Colors.grayDark },

  pillRow: { flexDirection: "row", gap: 8 },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  pillActive: { borderColor: Colors.primaryOrange, backgroundColor: Colors.orangeLight },
  pillText: { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },
  pillTextActive: { color: Colors.primaryOrange },

  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.primaryOrange,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
  },
  uploadBtnDone: { borderColor: Colors.greenMain, borderStyle: "solid", backgroundColor: "#f0fdf4" },
  uploadText: { fontSize: 14, fontWeight: "600", color: Colors.primaryOrange },
  uploadTextDone: { color: Colors.greenMain },

  approvalNotice: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.orangeLight,
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
  },
  approvalText: { flex: 1, fontSize: 13, color: Colors.grayDark, lineHeight: 18 },

  submitButton: { marginTop: Spacing.sm },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  divider: { flex: 1, height: 1, backgroundColor: Colors.grayLight },
  dividerText: { fontSize: 13, color: Colors.grayMedium, fontWeight: "500" },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchText: { fontSize: 14, color: Colors.grayMedium },
  switchLink: { fontSize: 14, fontWeight: "700", color: Colors.primaryOrange },
});
