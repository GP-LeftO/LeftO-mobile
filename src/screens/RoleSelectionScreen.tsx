import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import RoleCard from "../components/RoleCard";
import Button from "../components/Button";
import LeftOLogo from "../components/LeftOLogo";
import { Colors, Spacing } from "../theme";
import { t, isRTL } from "../i18n";
import { saveSelectedRole } from "../services/storage";
import type { UserRole } from "../services/storage";

interface RoleSelectionScreenProps {
  onComplete?: (role: UserRole) => void;
  navigation?: any;
}

const ROLES: { key: NonNullable<UserRole>; icon: "shopping-bag" | "tag" | "heart" }[] = [
  { key: "buyer", icon: "shopping-bag" },
  { key: "seller", icon: "tag" },
  { key: "charity", icon: "heart" },
];

export default function RoleSelectionScreen({ onComplete, navigation }: RoleSelectionScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const translations = t();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    await saveSelectedRole(selectedRole);
    if (onComplete) onComplete(selectedRole);
    else if (navigation) navigation.navigate("GetStarted", { role: selectedRole });
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <LeftOLogo size="sm" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.titleBlock}>
          <Text style={[styles.title, rtl && styles.rtlText]}>{translations.roleSelection.title}</Text>
          <Text style={[styles.subtitle, rtl && styles.rtlText]}>{translations.roleSelection.subtitle}</Text>
        </Animated.View>

        <View style={styles.cardsContainer}>
          {ROLES.map((role, index) => (
            <Animated.View key={role.key} entering={FadeInDown.delay(200 + index * 80).duration(500).springify()}>
              <RoleCard
                label={translations.roles[role.key].label}
                description={translations.roles[role.key].description}
                icon={role.icon}
                selected={selectedRole === role.key}
                onSelect={() => setSelectedRole(role.key)}
                testID={`role-card-${role.key}`}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(600).duration(500).springify()}
        style={[styles.footer, { paddingBottom: bottomPadding + Spacing.md }]}
      >
        <Button
          label={translations.next}
          onPress={handleContinue}
          variant="primary"
          disabled={!selectedRole}
          loading={loading}
          testID="role-continue"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.xl },
  titleBlock: { gap: Spacing.sm },
  title: { fontSize: 28, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.5, lineHeight: 36 },
  subtitle: { fontSize: 16, color: Colors.grayMedium, lineHeight: 24 },
  rtlText: { textAlign: "right" },
  cardsContainer: { gap: Spacing.md },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.grayLight,
  },
});
