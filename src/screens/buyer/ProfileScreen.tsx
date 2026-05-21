import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { t, isRTL } from "../../i18n";
import { useAuth } from "../../hooks/auth/useAuth";
import { useProfile, ProfileTab } from "../../hooks/buyer/profile/useProfile";
import BadgeGrid from "../../components/buyer/profile/BadgeGrid";
import OrderCard from "../../components/buyer/profile/OrderCard";
import DonationCard from "../../components/buyer/profile/DonationCard";
import type { ProfileOrder } from "../../types/profile";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProfileScreenProps {
  onLogout?: () => void;
  onOpenChatbot?: () => void;
}

// ─── Settings items (collapsed under the Settings button) ─────────────────────

const SETTINGS_ITEMS = [
  { id: "personal",      icon: "user",       labelEn: "Personal Information",   labelAr: "المعلومات الشخصية",      color: "#8b5cf6" },
  { id: "notifications", icon: "bell",       labelEn: "Notification Settings",  labelAr: "إعدادات الإشعارات",      color: "#f59e0b" },
  { id: "pickup",        icon: "clock",      labelEn: "Preferred Pickup Times", labelAr: "أوقات الاستلام المفضلة",  color: "#10b981" },
  { id: "rate",          icon: "star",       labelEn: "Rate LeftO",             labelAr: "قيّم LeftO",              color: "#f59e0b" },
  { id: "terms",         icon: "file-text",  labelEn: "Terms & Privacy",        labelAr: "الشروط والخصوصية",        color: "#6b7280" },
];

// ─── Segmented tabs ───────────────────────────────────────────────────────────

function SegmentedTabs({
  active, onSelect, rtl, labels,
}: {
  active: ProfileTab;
  onSelect: (tab: ProfileTab) => void;
  rtl: boolean;
  labels: { orders: string; donations: string };
}) {
  const tabs: ProfileTab[] = rtl ? ["donations", "orders"] : ["orders", "donations"];
  return (
    <View style={tabStyles.container}>
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <TouchableOpacity
            key={tab}
            style={[tabStyles.tab, isActive && tabStyles.tabActive]}
            onPress={() => onSelect(tab)}
            activeOpacity={0.8}
          >
            <Text style={[tabStyles.label, isActive && tabStyles.labelActive]}>
              {labels[tab]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.grayLight,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tab:        { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center" },
  tabActive:  {
    backgroundColor: Colors.white,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  label:       { fontSize: 14, fontWeight: "600", color: Colors.grayMedium },
  labelActive: { color: Colors.grayDark, fontWeight: "700" },
});

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastBanner({ message }: { message: string }) {
  return (
    <View style={toastStyles.container} pointerEvents="none">
      <View style={toastStyles.pill}>
        <Text style={toastStyles.text}>{message}</Text>
      </View>
    </View>
  );
}

const toastStyles = StyleSheet.create({
  container: { position: "absolute", bottom: 110, left: 0, right: 0, alignItems: "center", zIndex: 100 },
  pill:      { backgroundColor: Colors.grayDark, paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: 24 },
  text:      { color: Colors.white, fontSize: 14, fontWeight: "600" },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen({ onLogout, onOpenChatbot }: ProfileScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const rtl        = isRTL();
  const tr         = t();

  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const { user, logout } = useAuth();
  const {
    profile,
    completedOrders,
    donations,
    activeTab,
    setActiveTab,
    reviewedIds,
    loading,
    refreshing,
    error,
    toast,
    onRefresh,
    submitReview,
  } = useProfile();

  const currentData: ProfileOrder[] = activeTab === "orders" ? completedOrders : donations;

  const toastMessage = toast
    ? toast === "reviewSuccess"   ? tr.profile.review.success
    : toast === "alreadyReviewed" ? tr.profile.review.alreadyReviewed
    : tr.profile.review.error
    : null;

  const displayName = profile?.name ?? user?.name;
  const initials = displayName
    ? displayName.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
    : "?";

  const memberSince = (profile?.createdAt ?? user?.createdAt)
    ? new Date(profile?.createdAt ?? user!.createdAt).toLocaleDateString(
        rtl ? "ar-PS" : "en-GB",
        { month: "long", year: "numeric" }
      )
    : null;

  // Impact stats — use actual order counts from fetched data, not profile counters
  const impactStats = [
    {
      icon: "award"        as const,
      color: Colors.primaryOrange,
      bg: Colors.orangeLight,
      value: profile != null ? String(profile.points) : "—",
      labelEn: "Points",
      labelAr: "النقاط",
    },
    {
      icon: "wind"         as const,
      color: "#10b981",
      bg: "#ecfdf5",
      value: profile != null ? `${profile.totalCo2SavedKg} kg` : "—",
      labelEn: "CO₂ Saved",
      labelAr: "CO₂ موفّر",
    },
    {
      icon: "heart"        as const,
      color: "#ec4899",
      bg: "#fdf2f8",
      value: !loading ? String(donations.filter((d) => d.status === "COMPLETED").length) : "—",
      labelEn: "Donations",
      labelAr: "التبرعات",
    },
    {
      icon: "shopping-bag" as const,
      color: "#8b5cf6",
      bg: "#f5f3ff",
      // completedOrders is already filtered to status === "COMPLETED" in useProfile
      value: !loading ? String(completedOrders.length) : "—",
      labelEn: "Orders",
      labelAr: "الطلبات",
    },
  ];

  // ── List header: avatar + stats + badges + activity tabs ──────────────────────
  const ListHeader = (
    <>
      <View style={[styles.headerBar, { paddingTop: topPadding + 8 }]}>
        <Text style={[styles.headerTitle, rtl && styles.rtl]}>{tr.profile.title}</Text>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primaryOrange} size="large" />
          <Text style={[styles.hint, rtl && styles.rtl]}>{tr.profile.loading}</Text>
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Feather name="alert-circle" size={32} color={Colors.grayMedium} />
          <Text style={[styles.hint, rtl && styles.rtl]}>{tr.profile.error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryBtnText}>{tr.profile.retry}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatar, profile?.avatarColor ? { backgroundColor: profile.avatarColor } : null]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
              <TouchableOpacity style={styles.avatarEditBtn} disabled activeOpacity={0.6}>
                <Feather name="camera" size={13} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.userName, rtl && styles.rtl]}>{displayName ?? "—"}</Text>

            {(profile?.email ?? user?.email)
              ? <Text style={[styles.contactLine, rtl && styles.rtl]}>{profile?.email ?? user?.email}</Text>
              : (profile?.phone ?? user?.phone)
              ? <Text style={[styles.contactLine, rtl && styles.rtl]}>{profile?.phone ?? user?.phone}</Text>
              : null}

            <View style={styles.roleBadge}>
              <Feather name="check-circle" size={11} color={Colors.primaryOrange} />
              <Text style={styles.roleText}>{rtl ? "مشترٍ" : "Buyer"}</Text>
            </View>

            {memberSince && (
              <Text style={[styles.memberSince, rtl && styles.rtl]}>
                {rtl ? `عضو منذ ${memberSince}` : `Member since ${memberSince}`}
              </Text>
            )}
          </View>

          {/* Impact grid — 2 per row, horizontal card layout */}
          <View style={styles.impactGrid}>
            {impactStats.map((s) => (
              <View key={s.labelEn} style={styles.impactCard}>
                <View style={[styles.impactIconBg, { backgroundColor: s.bg }]}>
                  <Feather name={s.icon} size={20} color={s.color} />
                </View>
                <View style={styles.impactTextCol}>
                  <Text style={[styles.impactValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.impactLabel, rtl && styles.rtl]}>
                    {rtl ? s.labelAr : s.labelEn}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Badges */}
          <Text style={[styles.sectionLabel, rtl && styles.rtl]}>{tr.profile.badges}</Text>
          <BadgeGrid earnedBadges={profile?.badges ?? []} />

          {/* My Activity + tabs */}
          <Text style={[styles.sectionLabel, { marginTop: Spacing.md }, rtl && styles.rtl]}>
            {rtl ? "نشاطي" : "My Activity"}
          </Text>
          <SegmentedTabs
            active={activeTab}
            onSelect={setActiveTab}
            rtl={rtl}
            labels={{ orders: tr.profile.tabs.orders, donations: tr.profile.tabs.donations }}
          />
        </>
      )}
    </>
  );

  // ── Footer: action buttons + collapsible settings + sign out ──────────────────
  const ListFooter = !loading && !error ? (
    <View style={styles.footerWrap}>
      {/* AI Assistant button */}
      <TouchableOpacity
        style={[styles.actionBtn, styles.aiBtn, rtl && styles.rowReverse]}
        activeOpacity={0.85}
        onPress={onOpenChatbot}
      >
        <View style={styles.aiBtnIcon}>
          <Feather name="message-circle" size={18} color="#6366f1" />
        </View>
        <Text style={styles.aiBtnText}>{rtl ? "المساعد الذكي" : "AI Assistant"}</Text>
        <Feather name="arrow-right" size={16} color="#6366f1" style={rtl && { transform: [{ scaleX: -1 }] }} />
      </TouchableOpacity>

      {/* Settings toggle button */}
      <TouchableOpacity
        style={[styles.actionBtn, styles.settingsBtn, rtl && styles.rowReverse]}
        activeOpacity={0.85}
        onPress={() => setSettingsExpanded((v) => !v)}
      >
        <View style={styles.settingsBtnIcon}>
          <Feather name="settings" size={18} color={Colors.grayDark} />
        </View>
        <Text style={styles.settingsBtnText}>{rtl ? "الإعدادات" : "Settings"}</Text>
        <Feather
          name={settingsExpanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.grayMedium}
        />
      </TouchableOpacity>

      {/* Expanded settings panel */}
      {settingsExpanded && (
        <View style={styles.settingsPanel}>
          {SETTINGS_ITEMS.map((item, idx) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={[styles.settingsRow, rtl && styles.rowReverse]}
                activeOpacity={0.7}
              >
                <View style={[styles.settingsIconWrap, { backgroundColor: item.color + "18" }]}>
                  <Feather name={item.icon as "user"} size={16} color={item.color} />
                </View>
                <Text style={[styles.settingsRowLabel, rtl && styles.rtl]}>
                  {rtl ? item.labelAr : item.labelEn}
                </Text>
                <Feather
                  name={rtl ? "chevron-left" : "chevron-right"}
                  size={15}
                  color={Colors.grayLight}
                />
              </TouchableOpacity>
              {idx < SETTINGS_ITEMS.length - 1 && (
                <View style={[styles.settingsDivider, rtl && { marginRight: 52, marginLeft: 0 }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Sign out */}
      <TouchableOpacity
        style={[styles.signOutBtn, rtl && styles.rowReverse]}
        activeOpacity={0.8}
        onPress={() => { logout(); onLogout?.(); }}
      >
        <Feather name="log-out" size={17} color="#ef4444" />
        <Text style={styles.signOutText}>{tr.profile.signOut}</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  // ── Empty state ────────────────────────────────────────────────────────────────
  const EmptyComponent = !loading && !error ? (
    <View style={styles.emptyWrap}>
      <Feather
        name={activeTab === "orders" ? "shopping-bag" : "heart"}
        size={36}
        color={Colors.grayLight}
      />
      <Text style={[styles.hint, rtl && styles.rtl]}>
        {activeTab === "orders" ? tr.profile.ordersEmpty : tr.profile.donationsEmpty}
      </Text>
    </View>
  ) : null;

  return (
    <View style={styles.screen}>
      <FlatList<ProfileOrder>
        data={!loading && !error ? currentData : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          activeTab === "orders" ? (
            <OrderCard
              order={item}
              reviewed={reviewedIds.has(item.id)}
              onSubmitReview={submitReview}
              rtl={rtl}
              tr={tr.profile}
            />
          ) : (
            <DonationCard order={item} rtl={rtl} tr={tr.profile} />
          )
        }
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={EmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryOrange}
            colors={[Colors.primaryOrange]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {toastMessage && <ToastBanner message={toastMessage} />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: 40 },
  rtl:         { textAlign: "right" },
  rowReverse:  { flexDirection: "row-reverse" },

  // Header
  headerBar:   { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm },
  headerTitle: { fontSize: 26, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.4 },

  // Loading / error
  center:       { paddingVertical: 48, alignItems: "center", gap: 12 },
  hint:         { fontSize: 14, color: Colors.grayMedium, textAlign: "center", paddingHorizontal: Spacing.xl },
  retryBtn:     { backgroundColor: Colors.primaryOrange, paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: Colors.white, fontWeight: "700", fontSize: 14 },

  // Avatar
  avatarSection: {
    alignItems: "center", paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm, paddingBottom: Spacing.lg, gap: 5,
  },
  avatarWrap: { position: "relative", marginBottom: 6 },
  avatar: {
    width: 92, height: 92, borderRadius: 46,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  avatarInitials: { fontSize: 32, fontWeight: "800", color: Colors.white },
  avatarEditBtn: {
    position: "absolute", bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.grayMedium,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: Colors.background, opacity: 0.6,
  },
  userName:    { fontSize: 22, fontWeight: "800", color: Colors.grayDark },
  contactLine: { fontSize: 13, color: Colors.grayMedium },
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.orangeLight,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 2,
  },
  roleText:    { fontSize: 12, fontWeight: "700", color: Colors.primaryOrange },
  memberSince: { fontSize: 11, color: Colors.grayMedium, marginTop: 2 },

  // Impact grid — 2 per row, horizontal icon+text layout
  impactGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: Spacing.xl, gap: 10,
    marginBottom: Spacing.sm,
  },
  impactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "47%",
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  impactIconBg: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  impactTextCol: { flex: 1 },
  impactValue:   { fontSize: 20, fontWeight: "800", lineHeight: 24 },
  impactLabel:   { fontSize: 11, color: Colors.grayMedium, marginTop: 1 },

  // Section label
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: Colors.grayMedium,
    textTransform: "uppercase", letterSpacing: 0.8,
    paddingHorizontal: Spacing.xl, marginBottom: 4, marginTop: Spacing.sm,
  },

  // Empty state
  emptyWrap: { paddingVertical: 36, alignItems: "center", gap: 12 },

  // Footer
  footerWrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xl, gap: 10 },

  // AI Assistant button
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  aiBtn: {
    backgroundColor: "#eef2ff",
    borderWidth: 1.5, borderColor: "#c7d2fe",
  },
  aiBtnIcon: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: "#e0e7ff",
    alignItems: "center", justifyContent: "center",
  },
  aiBtnText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#4f46e5" },

  // Settings toggle button
  settingsBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  settingsBtnIcon: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
  },
  settingsBtnText: { flex: 1, fontSize: 15, fontWeight: "700", color: Colors.grayDark },

  // Settings expanded panel
  settingsPanel: {
    backgroundColor: Colors.white,
    borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: Colors.grayLight,
  },
  settingsRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: Spacing.md, paddingVertical: 13,
  },
  settingsIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  settingsRowLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: Colors.grayDark },
  settingsDivider:  { height: 1, backgroundColor: Colors.grayLight, marginLeft: 52 },

  // Sign out
  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 16, backgroundColor: "#fef2f2",
    marginTop: Spacing.sm,
  },
  signOutText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
});
