import React from "react";
import { StyleSheet, Text, View, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../theme";
import { isRTL } from "../i18n";
import { useAuth } from "../hooks/useAuth";

interface CharityDashboardScreenProps {
  onLogout?: () => void;
}

export default function CharityDashboardScreen({ onLogout }: CharityDashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  const QUICK_ACTIONS = [
    { icon: "gift" as const, label: rtl ? "طلب تبرع" : "Request Donation", color: Colors.primaryOrange },
    { icon: "users" as const, label: rtl ? "المستفيدون" : "Beneficiaries", color: Colors.greenMain },
    { icon: "truck" as const, label: rtl ? "التوصيلات" : "Deliveries", color: "#8b5cf6" },
    { icon: "settings" as const, label: rtl ? "الإعدادات" : "Settings", color: Colors.grayMedium },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.header}>
        <View>
          <Text style={[styles.greeting, rtl && styles.rtl]}>
            {rtl ? "مرحباً،" : "Hello,"} <Text style={styles.name}>{user?.name ?? "Charity"}</Text>
          </Text>
          <Text style={[styles.subGreeting, rtl && styles.rtl]}>
            {rtl ? "إليك ملخص منظمتك اليوم" : "Here's your organization summary today"}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color={Colors.grayMedium} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500).springify()} style={styles.comingSoonCard}>
        <Text style={styles.comingSoonEmoji}>🤝</Text>
        <Text style={[styles.comingSoonTitle, rtl && styles.rtl]}>
          {rtl ? "لوحة تحكم الجمعية" : "Charity Dashboard"}
        </Text>
        <Text style={[styles.comingSoonText, rtl && styles.rtl]}>
          {rtl
            ? "قريباً — استقبل التبرعات ووزّعها على المستفيدين"
            : "Coming soon — receive food donations and distribute them to beneficiaries"}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(500).springify()} style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action, i) => (
          <TouchableOpacity key={i} style={styles.actionCard} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: action.color + "20" }]}>
              <Feather name={action.icon} size={22} color={action.color} />
            </View>
            <Text style={[styles.actionLabel, rtl && styles.rtl]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  rtl: { textAlign: "right" },

  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingTop: Spacing.md },
  greeting: { fontSize: 24, fontWeight: "800", color: Colors.grayDark },
  name: { color: Colors.primaryOrange },
  subGreeting: { fontSize: 14, color: Colors.grayMedium, marginTop: 2 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
  },

  comingSoonCard: {
    backgroundColor: Colors.white, borderRadius: 24,
    padding: Spacing.xl, alignItems: "center", gap: Spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },
  comingSoonEmoji: { fontSize: 52, marginBottom: 4 },
  comingSoonTitle: { fontSize: 20, fontWeight: "800", color: Colors.grayDark },
  comingSoonText: { fontSize: 14, color: Colors.grayMedium, lineHeight: 20, textAlign: "center" },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: {
    width: "47%", backgroundColor: Colors.white, borderRadius: 18,
    padding: Spacing.md, alignItems: "center", gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontWeight: "600", color: Colors.grayDark, textAlign: "center" },
});
