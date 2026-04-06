import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../theme";

const IMPACT_STATS = [
  { icon: "wind", label: "CO₂ Saved", value: "2.4 kg", color: Colors.greenMain },
  { icon: "dollar-sign", label: "Money Saved", value: "₪84", color: Colors.primaryOrange },
  { icon: "gift", label: "Donations", value: "3", color: "#8b5cf6" },
  { icon: "shopping-bag", label: "Bags Bought", value: "7", color: "#f59e0b" },
];

const MENU_SECTIONS = [
  {
    title: "Account",
    items: [
      { icon: "user", label: "Personal Information" },
      { icon: "map-pin", label: "My Location & Radius" },
      { icon: "bell", label: "Notification Settings" },
      { icon: "clock", label: "Preferred Pickup Times" },
    ],
  },
  {
    title: "Activity",
    items: [
      { icon: "heart", label: "Favorite Stores" },
      { icon: "bar-chart-2", label: "My Impact" },
      { icon: "book-open", label: "Donation History" },
    ],
  },
  {
    title: "App",
    items: [
      { icon: "message-circle", label: "Customer Support" },
      { icon: "star", label: "Rate LeftO" },
      { icon: "share-2", label: "Recommend a Store" },
      { icon: "file-text", label: "Terms & Privacy" },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Feather name="settings" size={20} color={Colors.grayDark} />
          </TouchableOpacity>
        </View>

        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>TA</Text>
            </View>
            <TouchableOpacity style={styles.avatarEdit}>
              <Feather name="camera" size={13} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>Tala Alhendi</Text>
          <Text style={styles.userEmail}>tala@lefto.com</Text>
          <View style={styles.memberBadge}>
            <Feather name="star" size={11} color={Colors.primaryOrange} />
            <Text style={styles.memberText}>Member since Apr 2026</Text>
          </View>
        </View>

        {/* Impact Stats */}
        <View style={styles.impactGrid}>
          {IMPACT_STATS.map((s) => (
            <View key={s.label} style={styles.impactCard}>
              <View style={[styles.impactIconWrap, { backgroundColor: s.color + "18" }]}>
                <Feather name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={styles.impactValue}>{s.value}</Text>
              <Text style={styles.impactLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <React.Fragment key={item.label}>
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                    <View style={styles.menuIconWrap}>
                      <Feather name={item.icon as any} size={17} color={Colors.primaryOrange} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Feather name="chevron-right" size={16} color={Colors.grayLight} />
                  </TouchableOpacity>
                  {idx < section.items.length - 1 && <View style={styles.menuDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} activeOpacity={0.8}>
          <Feather name="log-out" size={17} color="#ef4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.4 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },

  avatarSection: { alignItems: "center", paddingVertical: Spacing.lg, gap: 6 },
  avatarWrapper: { position: "relative", marginBottom: 4 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarInitials: { fontSize: 30, fontWeight: "800", color: Colors.white },
  avatarEdit: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.grayDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },
  userName: { fontSize: 22, fontWeight: "800", color: Colors.grayDark },
  userEmail: { fontSize: 14, color: Colors.grayMedium },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.orangeLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 2,
  },
  memberText: { fontSize: 12, fontWeight: "600", color: Colors.primaryOrange },

  impactGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.xl,
    gap: 12,
    marginBottom: Spacing.lg,
  },
  impactCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  impactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  impactValue: { fontSize: 20, fontWeight: "800", color: Colors.grayDark },
  impactLabel: { fontSize: 11, color: Colors.grayMedium, textAlign: "center" },

  menuSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.grayMedium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.orangeLight,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.grayDark },
  menuDivider: { height: 1, backgroundColor: Colors.grayLight, marginLeft: 58 },

  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#fef2f2",
  },
  signOutText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
});
