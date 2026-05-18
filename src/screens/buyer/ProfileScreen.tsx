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
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAuth } from "../../hooks/auth/useAuth";

const MENU_SECTIONS = [
  {
    titleEn: "Account",
    titleAr: "الحساب",
    items: [
      { icon: "user",     labelEn: "Personal Information",    labelAr: "المعلومات الشخصية" },
      { icon: "map-pin",  labelEn: "My Location & Radius",    labelAr: "موقعي والنطاق" },
      { icon: "bell",     labelEn: "Notification Settings",   labelAr: "إعدادات الإشعارات" },
      { icon: "clock",    labelEn: "Preferred Pickup Times",  labelAr: "أوقات الاستلام المفضلة" },
    ],
  },
  {
    titleEn: "Activity",
    titleAr: "النشاط",
    items: [
      { icon: "heart",       labelEn: "Favorite Stores",     labelAr: "المتاجر المفضلة" },
      { icon: "bar-chart-2", labelEn: "My Impact",           labelAr: "أثري" },
      { icon: "book-open",   labelEn: "Donation History",    labelAr: "سجل التبرعات" },
    ],
  },
  {
    titleEn: "App",
    titleAr: "التطبيق",
    items: [
      { icon: "message-circle", labelEn: "Customer Support",    labelAr: "دعم العملاء" },
      { icon: "star",           labelEn: "Rate LeftO",          labelAr: "قيّم LeftO" },
      { icon: "share-2",        labelEn: "Recommend a Store",   labelAr: "اقترح متجراً" },
      { icon: "file-text",      labelEn: "Terms & Privacy",     labelAr: "الشروط والخصوصية" },
    ],
  },
];

interface ProfileScreenProps {
  onLogout?: () => void;
  onOpenChatbot?: () => void;
}

export default function ProfileScreen({ onLogout, onOpenChatbot }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const rtl = isRTL();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(rtl ? "ar-PS" : "en-GB", {
        month: "long",
        year: "numeric",
      })
    : null;

  const roleLabel = (() => {
    if (!user?.role) return null;
    const labels: Record<string, { en: string; ar: string; color: string }> = {
      BUYER:   { en: "Buyer",   ar: "مشترٍ",       color: Colors.primaryOrange },
      SELLER:  { en: "Seller",  ar: "بائع",         color: "#8b5cf6" },
      CHARITY: { en: "Charity", ar: "جمعية خيرية", color: Colors.greenMain },
      ADMIN:   { en: "Admin",   ar: "مسؤول",        color: Colors.grayMedium },
    };
    return labels[user.role] ?? null;
  })();

  const impactStats = [
    {
      icon: "wind",
      labelEn: "CO₂ Saved",
      labelAr: "CO₂ موفّر",
      value: user?.co2Saved != null ? `${user.co2Saved} kg` : "—",
      color: Colors.greenMain,
    },
    {
      icon: "dollar-sign",
      labelEn: "Money Saved",
      labelAr: "المال الموفّر",
      value: user?.moneySaved != null ? `₪${user.moneySaved}` : "—",
      color: Colors.primaryOrange,
    },
    {
      icon: "gift",
      labelEn: "Donations",
      labelAr: "التبرعات",
      value: user?.donationCount != null ? String(user.donationCount) : "—",
      color: "#8b5cf6",
    },
    {
      icon: "shopping-bag",
      labelEn: "Bags Bought",
      labelAr: "الأكياس المشتراة",
      value: user?.bagCount != null ? String(user.bagCount) : "—",
      color: "#f59e0b",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
          <Text style={[styles.headerTitle, rtl && styles.rtl]}>
            {rtl ? "الملف الشخصي" : "Profile"}
          </Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Feather name="settings" size={20} color={Colors.grayDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <TouchableOpacity style={styles.avatarEdit}>
              <Feather name="camera" size={13} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, rtl && styles.rtl]}>
            {user?.name ?? (rtl ? "المستخدم" : "User")}
          </Text>
          {user?.phone ? (
            <Text style={[styles.userContact, rtl && styles.rtl]}>{user.phone}</Text>
          ) : null}
          {user?.email ? (
            <Text style={[styles.userContact, rtl && styles.rtl]}>{user.email}</Text>
          ) : null}
          {roleLabel && (
            <View style={[styles.roleBadge, { backgroundColor: roleLabel.color + "18" }]}>
              <Text style={[styles.roleText, { color: roleLabel.color }]}>
                {rtl ? roleLabel.ar : roleLabel.en}
              </Text>
            </View>
          )}
          {memberSince && (
            <View style={styles.memberBadge}>
              <Feather name="star" size={11} color={Colors.primaryOrange} />
              <Text style={styles.memberText}>
                {rtl ? `عضو منذ ${memberSince}` : `Member since ${memberSince}`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.impactGrid}>
          {impactStats.map((s) => (
            <View key={s.labelEn} style={styles.impactCard}>
              <View style={[styles.impactIconWrap, { backgroundColor: s.color + "18" }]}>
                <Feather name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={styles.impactValue}>{s.value}</Text>
              <Text style={[styles.impactLabel, rtl && styles.rtl]}>
                {rtl ? s.labelAr : s.labelEn}
              </Text>
            </View>
          ))}
        </View>

        {MENU_SECTIONS.map((section) => (
          <View key={section.titleEn} style={styles.menuSection}>
            <Text style={[styles.menuSectionTitle, rtl && styles.rtl]}>
              {rtl ? section.titleAr : section.titleEn}
            </Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <React.Fragment key={item.labelEn}>
                  <TouchableOpacity
                    style={styles.menuItem}
                    activeOpacity={0.7}
                    onPress={item.labelEn === "Customer Support" ? onOpenChatbot : undefined}
                  >
                    <View style={styles.menuIconWrap}>
                      <Feather name={item.icon as any} size={17} color={Colors.primaryOrange} />
                    </View>
                    <Text style={[styles.menuLabel, rtl && styles.rtl]}>
                      {rtl ? item.labelAr : item.labelEn}
                    </Text>
                    <Feather
                      name={rtl ? "chevron-left" : "chevron-right"}
                      size={16}
                      color={Colors.grayLight}
                    />
                  </TouchableOpacity>
                  {idx < section.items.length - 1 && <View style={styles.menuDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.signOutBtn}
          activeOpacity={0.8}
          onPress={() => { logout(); onLogout?.(); }}
        >
          <Feather name="log-out" size={17} color="#ef4444" />
          <Text style={styles.signOutText}>{rtl ? "تسجيل الخروج" : "Sign Out"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.4 },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },

  avatarSection: { alignItems: "center", paddingVertical: Spacing.lg, gap: 6 },
  avatarWrapper: { position: "relative", marginBottom: 4 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.primaryOrange, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  avatarInitials: { fontSize: 30, fontWeight: "800", color: Colors.white },
  avatarEdit: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.grayDark,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: Colors.background,
  },
  userName: { fontSize: 22, fontWeight: "800", color: Colors.grayDark },
  userContact: { fontSize: 14, color: Colors.grayMedium },
  roleBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, marginTop: 2,
  },
  roleText: { fontSize: 12, fontWeight: "700" },
  memberBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.orangeLight,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, marginTop: 2,
  },
  memberText: { fontSize: 12, fontWeight: "600", color: Colors.primaryOrange },

  impactGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: Spacing.xl, gap: 12,
    marginBottom: Spacing.lg,
  },
  impactCard: {
    flex: 1, minWidth: "45%",
    backgroundColor: Colors.white, borderRadius: 16,
    padding: Spacing.md, alignItems: "center", gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  impactIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  impactValue: { fontSize: 20, fontWeight: "800", color: Colors.grayDark },
  impactLabel: { fontSize: 11, color: Colors.grayMedium, textAlign: "center" },

  menuSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  menuSectionTitle: {
    fontSize: 13, fontWeight: "700", color: Colors.grayMedium,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8,
  },
  menuCard: {
    backgroundColor: Colors.white, borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.md, paddingVertical: 14, gap: 12,
  },
  menuIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.grayDark },
  menuDivider: { height: 1, backgroundColor: Colors.grayLight, marginLeft: 58 },

  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.xl,
    paddingVertical: 14, borderRadius: 16, backgroundColor: "#fef2f2",
  },
  signOutText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
});
