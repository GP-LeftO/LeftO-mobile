import React from "react";
import { StyleSheet, Text, View, Platform, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAuth } from "../../hooks/auth/useAuth";

interface CharityDashboardScreenProps {
  onLogout?: () => void;
}

export default function CharityDashboardScreen({ onLogout }: CharityDashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const { user, charityStatus, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  const statusInfo = (() => {
    switch (charityStatus) {
      case "APPROVED":
        return { icon: "check-circle" as const, color: Colors.greenMain, en: "Approved", ar: "موثّقة" };
      case "PENDING":
        return { icon: "clock" as const, color: Colors.primaryOrange, en: "Under Review", ar: "قيد المراجعة" };
      case "REJECTED":
        return { icon: "x-circle" as const, color: "#ef4444", en: "Rejected", ar: "مرفوضة" };
      default:
        return null;
    }
  })();

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(rtl ? "ar-PS" : "en-GB", {
        month: "long",
        year: "numeric",
      })
    : null;

  const QUICK_ACTIONS = [
    { icon: "gift" as const,     labelEn: "Request Donation", labelAr: "طلب تبرع",      color: Colors.primaryOrange },
    { icon: "users" as const,    labelEn: "Beneficiaries",    labelAr: "المستفيدون",     color: Colors.greenMain },
    { icon: "truck" as const,    labelEn: "Deliveries",       labelAr: "التوصيلات",      color: "#8b5cf6" },
    { icon: "settings" as const, labelEn: "Settings",         labelAr: "الإعدادات",      color: Colors.grayMedium },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.orgIconWrap}>
              <Feather name="heart" size={22} color={Colors.primaryOrange} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.orgName, rtl && styles.rtl]} numberOfLines={1}>
                {user?.name ?? (rtl ? "جمعيتي" : "My Charity")}
              </Text>
              {statusInfo && (
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "18" }]}>
                  <Feather name={statusInfo.icon} size={11} color={statusInfo.color} />
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {rtl ? statusInfo.ar : statusInfo.en}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Feather name="log-out" size={18} color={Colors.grayMedium} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(500).springify()} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Feather name="phone" size={14} color={Colors.grayMedium} />
              <Text style={[styles.summaryLabel, rtl && styles.rtl]}>
                {rtl ? "الهاتف" : "Phone"}
              </Text>
              <Text style={[styles.summaryValue, rtl && styles.rtl]}>
                {user?.phone ?? "—"}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Feather name="calendar" size={14} color={Colors.grayMedium} />
              <Text style={[styles.summaryLabel, rtl && styles.rtl]}>
                {rtl ? "العضوية منذ" : "Member since"}
              </Text>
              <Text style={[styles.summaryValue, rtl && styles.rtl]}>
                {memberSince ?? "—"}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500).springify()} style={styles.comingSoonCard}>
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

        <Text style={[styles.sectionLabel, rtl && styles.rtl]}>
          {rtl ? "الإجراءات السريعة" : "Quick Actions"}
        </Text>

        <Animated.View entering={FadeInDown.delay(320).duration(500).springify()} style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action, i) => (
            <TouchableOpacity key={i} style={styles.actionCard} activeOpacity={0.85}>
              <View style={[styles.actionIcon, { backgroundColor: action.color + "20" }]}>
                <Feather name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={[styles.actionLabel, rtl && styles.rtl]}>
                {rtl ? action.labelAr : action.labelEn}
              </Text>
              <View style={styles.comingSoonPill}>
                <Text style={styles.comingSoonPillText}>
                  {rtl ? "قريباً" : "Soon"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 40, gap: Spacing.lg },

  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingTop: Spacing.md,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  orgIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  headerInfo: { flex: 1, gap: 4 },
  orgName: { fontSize: 18, fontWeight: "800", color: Colors.grayDark, maxWidth: 200 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
  },

  summaryCard: {
    backgroundColor: Colors.white, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  summaryRow: { flexDirection: "row" },
  summaryItem: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
  summaryDivider: { width: 1, backgroundColor: Colors.grayLight, marginVertical: 12 },
  summaryLabel: { fontSize: 11, color: Colors.grayMedium },
  summaryValue: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },

  comingSoonCard: {
    backgroundColor: Colors.white, borderRadius: 24,
    padding: Spacing.xl, alignItems: "center", gap: Spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },
  comingSoonEmoji: { fontSize: 52, marginBottom: 4 },
  comingSoonTitle: { fontSize: 20, fontWeight: "800", color: Colors.grayDark },
  comingSoonText: { fontSize: 14, color: Colors.grayMedium, lineHeight: 20, textAlign: "center" },

  sectionLabel: {
    fontSize: 13, fontWeight: "700", color: Colors.grayMedium,
    textTransform: "uppercase", letterSpacing: 0.8,
  },

  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: {
    width: "47%", backgroundColor: Colors.white, borderRadius: 18,
    padding: Spacing.md, alignItems: "center", gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontWeight: "600", color: Colors.grayDark, textAlign: "center" },
  comingSoonPill: {
    backgroundColor: Colors.grayLight, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  comingSoonPillText: { fontSize: 10, fontWeight: "600", color: Colors.grayMedium },
});
