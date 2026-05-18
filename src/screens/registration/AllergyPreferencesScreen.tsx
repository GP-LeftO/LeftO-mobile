import React from "react";
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Platform,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Button from "../../components/shared/Button";
import Chip from "../../components/shared/Chip";
import StepIndicator from "../../components/auth/StepIndicator";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAllergyPreferences } from "../../hooks/buyer/useAllergyPreferences";
import type { AllergyOption } from "../../types";

// Ordered as specified in the task brief
const ALLERGY_OPTIONS: { value: AllergyOption; emoji: string }[] = [
  { value: "gluten",      emoji: "🌾" },
  { value: "dairy",       emoji: "🥛" },
  { value: "nuts",        emoji: "🥜" },
  { value: "eggs",        emoji: "🥚" },
  { value: "seafood",     emoji: "🦐" },
  { value: "soy",         emoji: "🫘" },
  { value: "sesame",      emoji: "🌰" },
  { value: "vegetarian",  emoji: "🥦" },
  { value: "vegan",       emoji: "🌿" },
  { value: "halal_only",  emoji: "☪️" },
];

const CHIP_LABELS: Record<AllergyOption, { en: string; ar: string }> = {
  gluten:     { en: "Gluten",      ar: "غلوتين" },
  dairy:      { en: "Dairy",       ar: "ألبان" },
  nuts:       { en: "Nuts",        ar: "مكسرات" },
  eggs:       { en: "Eggs",        ar: "بيض" },
  seafood:    { en: "Seafood",     ar: "مأكولات بحرية" },
  soy:        { en: "Soy",         ar: "صويا" },
  sesame:     { en: "Sesame",      ar: "سمسم" },
  vegetarian: { en: "Vegetarian",  ar: "نباتي" },
  vegan:      { en: "Vegan",       ar: "نباتي صارم" },
  halal_only: { en: "Halal only",  ar: "حلال فقط" },
};

interface AllergyPreferencesScreenProps {
  onContinue: (allergies: AllergyOption[]) => void;
  onSkip: () => void;
  onBack?: () => void;
  isRegistering?: boolean;
  registerError?: string;
}

export default function AllergyPreferencesScreen({
  onContinue,
  onSkip,
  onBack,
  isRegistering = false,
  registerError = "",
}: AllergyPreferencesScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const { selected, toggle } = useAllergyPreferences();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: topPadding + 12, paddingBottom: bottomPadding + 24 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={[styles.headerRow, rtl && styles.headerRowRTL]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}
          disabled={isRegistering}
        >
          <Feather
            name={rtl ? "arrow-right" : "arrow-left"}
            size={20}
            color={Colors.grayDark}
          />
        </TouchableOpacity>
        <View style={styles.stepWrap}>
          <StepIndicator current={5} total={6} />
        </View>
      </View>

      {/* Title block */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(500).springify()}
        style={styles.titleBlock}
      >
        <View style={styles.iconWrap}>
          <Feather name="shield" size={28} color={Colors.primaryOrange} />
        </View>
        <Text style={[styles.title, rtl && styles.rtl]}>
          {rtl ? "تفضيلات الحساسية" : "Allergy preferences"}
        </Text>
        <Text style={[styles.subtitle, rtl && styles.rtl]}>
          {rtl
            ? "اختر المواد التي تريد تجنبها. سنستخدم هذا لإبراز الخيارات الآمنة لك."
            : "Select any allergens to avoid. We'll use this to highlight safe options for you."}
        </Text>
      </Animated.View>

      {/* Chip grid */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500).springify()}
        style={styles.chipsSection}
      >
        <View style={[styles.chipsWrap, rtl && styles.chipsWrapRTL]}>
          {ALLERGY_OPTIONS.map(({ value, emoji }) => (
            <Chip
              key={value}
              label={`${emoji} ${CHIP_LABELS[value][rtl ? "ar" : "en"]}`}
              selected={selected.includes(value)}
              onPress={() => toggle(value)}
              testID={`allergy-chip-${value}`}
            />
          ))}
        </View>
      </Animated.View>

      {/* Selection count hint */}
      {selected.length > 0 && (
        <Animated.View
          entering={FadeInDown.duration(250)}
          style={[styles.countHint, rtl && styles.countHintRTL]}
        >
          <Feather name="check-circle" size={14} color={Colors.primaryOrange} />
          <Text style={styles.countHintText}>
            {rtl
              ? `${selected.length} مختار`
              : `${selected.length} selected`}
          </Text>
        </Animated.View>
      )}

      {/* Error */}
      {!!registerError && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBox}>
          <Feather name="alert-circle" size={16} color="#ef4444" />
          <Text style={[styles.errorText, rtl && styles.rtl]}>{registerError}</Text>
        </Animated.View>
      )}

      {/* Actions */}
      <Animated.View
        entering={FadeInDown.delay(320).duration(500).springify()}
        style={styles.actions}
      >
        <Button
          label={
            isRegistering
              ? (rtl ? "جاري التسجيل..." : "Registering...")
              : (rtl ? "متابعة" : "Continue")
          }
          onPress={() => onContinue(selected)}
          variant="primary"
          disabled={isRegistering}
          testID="allergy-continue"
        />
        <Button
          label={rtl ? "تخطّ الآن" : "Skip for now"}
          onPress={onSkip}
          variant="outline"
          disabled={isRegistering}
          testID="allergy-skip"
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  scroll:     { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  rtl:        { textAlign: "right" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
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
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 26, fontWeight: "800",
    color: Colors.grayDark, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15, color: Colors.grayMedium, lineHeight: 22,
  },

  chipsSection: { gap: Spacing.sm },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chipsWrapRTL: { flexDirection: "row-reverse" },

  countHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -Spacing.sm,
  },
  countHintRTL: { flexDirection: "row-reverse" },
  countHintText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryOrange,
  },

  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 12, padding: Spacing.md,
    borderWidth: 1, borderColor: "#fecaca",
  },
  errorText: { flex: 1, fontSize: 13, color: "#dc2626", lineHeight: 18 },

  actions: { gap: 12 },
});
