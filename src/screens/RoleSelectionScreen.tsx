import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import RoleCard from "../components/RoleCard";
import Button from "../components/Button";
import { Colors, Spacing } from "../theme";
import { isRTL } from "../i18n";
import { saveSelectedRole } from "../services/storage";
import type { UserRole } from "../services/storage";
import StepIndicator from "../components/StepIndicator";

interface RoleSelectionScreenProps {
  onComplete?: (role: UserRole) => void;
  onBack?: () => void;
  navigation?: any;
}

const ROLES: { key: NonNullable<UserRole>; icon: "shopping-bag" | "tag" | "heart" }[] = [
  { key: "buyer", icon: "shopping-bag" },
  { key: "seller", icon: "tag" },
  { key: "charity", icon: "heart" },
];

export default function RoleSelectionScreen({ onComplete, onBack, navigation }: RoleSelectionScreenProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const rtl = isRTL();

  const ROLE_DATA = {
    buyer:   { label: rtl ? "مشترٍ"         : "Buyer",   description: rtl ? "اعثر على طعام بأسعار معقولة بالقرب منك" : "Find affordable food near you" },
    seller:  { label: rtl ? "بائع"          : "Seller",  description: rtl ? "بع الفائض وقلل الهدر"                   : "Sell surplus and reduce waste" },
    charity: { label: rtl ? "جمعية خيرية"  : "Charity", description: rtl ? "استقبل التبرعات ووزّعها"               : "Receive and distribute donations" },
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handleContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    await saveSelectedRole(selectedRole);
    if (onComplete) onComplete(selectedRole);
    else if (navigation) navigation.navigate("BasicInfo", { role: selectedRole });
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding + 12 }]}>
      <View style={[styles.headerRow, { paddingHorizontal: Spacing.xl }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={Colors.grayDark} />
        </TouchableOpacity>
        <View style={styles.stepWrap}>
          <StepIndicator current={3} total={5} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.titleBlock}>
          <Text style={[styles.title, rtl && styles.rtlText]}>
            {rtl ? "كيف ستستخدم LeftO؟" : "How will you use LeftO?"}
          </Text>
          <Text style={[styles.subtitle, rtl && styles.rtlText]}>
            {rtl ? "اختر دورك للبدء" : "Choose your role to get started"}
          </Text>
        </Animated.View>

        <View style={styles.cardsContainer}>
          {ROLES.map((role, index) => (
            <Animated.View key={role.key} entering={FadeInDown.delay(200 + index * 80).duration(500).springify()}>
              <RoleCard
                label={ROLE_DATA[role.key].label}
                description={ROLE_DATA[role.key].description}
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
          label={rtl ? "التالي" : "Next"}
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
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: Spacing.md },
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
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.xl },
  titleBlock: { gap: Spacing.sm },
  title: { fontSize: 28, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.5, lineHeight: 36 },
  subtitle: { fontSize: 16, color: Colors.grayMedium, lineHeight: 24 },
  rtlText: { textAlign: "right" },
  cardsContainer: { gap: Spacing.md },
  footer: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.grayLight,
  },
});
