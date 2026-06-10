import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAuth } from "../../hooks/auth/useAuth";
import { useCharityDonations } from "../../hooks/charity/useCharityDonations";
import DonationIncomingCard from "../../components/charity/DonationIncomingCard";
import ProofUploadModal from "../../components/charity/ProofUploadModal";
import type { RatingInput } from "../../services/charity/charity.service";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "incoming" | "pickedUp" | "completed";

interface Props {
  onLogout?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { key: ActiveTab; label: string; icon: "inbox" | "package" | "check-circle" }[] = [
  { key: "incoming",  label: "قادم",   icon: "inbox" },
  { key: "pickedUp",  label: "مستلمة", icon: "package" },
  { key: "completed", label: "مكتملة", icon: "check-circle" },
];

const CHARITY_STATUS = {
  APPROVED: { icon: "check-circle" as const, color: Colors.greenMain,    label: "موثّقة" },
  PENDING:  { icon: "clock"        as const, color: Colors.primaryOrange, label: "قيد المراجعة" },
  REJECTED: { icon: "x-circle"    as const, color: "#EF4444",            label: "مرفوضة" },
};

const EMPTY_TEXT: Record<ActiveTab, string> = {
  incoming:  "لا توجد تبرعات قادمة 📭",
  pickedUp:  "لا توجد تبرعات مستلمة",
  completed: "لا توجد تبرعات مكتملة",
};

const EMPTY_ICON: Record<ActiveTab, string> = {
  incoming:  "📭",
  pickedUp:  "📦",
  completed: "✅",
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CharityDashboardScreen({ onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const { user, charityStatus, logout } = useAuth();
  const {
    donations,
    loading,
    refreshing,
    error,
    ratedIds,
    refresh,
    loadMore,
    markPickedUp,
    confirmWithProof,
    rateSeller,
  } = useCharityDonations();

  const [activeTab, setActiveTab] = useState<ActiveTab>("incoming");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDonationId, setSelectedDonationId] = useState("");

  // ── Derived ──────────────────────────────────────────────────────────────────

  const confirmedCount = useMemo(
    () => donations.filter((d) => d.status === "CONFIRMED").length,
    [donations]
  );

  const activeData = useMemo(() => {
    if (activeTab === "incoming")  return donations.filter((d) => d.status === "PENDING");
    if (activeTab === "pickedUp")  return donations.filter((d) => d.status === "PICKED_UP");
    return donations.filter((d) => d.status === "CONFIRMED");
  }, [donations, activeTab]);

  const statusInfo =
    charityStatus && charityStatus in CHARITY_STATUS
      ? CHARITY_STATUS[charityStatus as keyof typeof CHARITY_STATUS]
      : null;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const handleMarkPickedUp = useCallback(
    async (id: string) => {
      try {
        await markPickedUp(id);
      } catch {
        Alert.alert(
          rtl ? "خطأ" : "Error",
          rtl ? "تعذّر تحديث الحالة. يرجى المحاولة مجدداً." : "Could not update status."
        );
      }
    },
    [markPickedUp, rtl]
  );

  const handleOpenProofModal = useCallback((id: string) => {
    setSelectedDonationId(id);
    setModalVisible(true);
  }, []);

  const handleRateSeller = useCallback(
    async (donationId: string, ratings: RatingInput) => {
      const donation = donations.find((d) => d.id === donationId);
      const sellerId = donation?.sellerId ?? donation?.seller?.id ?? "";
      if (!sellerId) return;
      await rateSeller(donationId, sellerId, ratings);
    },
    [donations, rateSeller]
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>

      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(60).duration(450).springify()}
        style={styles.header}
      >
        <View style={[styles.headerLeft, rtl && styles.rowReverse]}>
          <View style={styles.orgIconWrap}>
            <Feather name="heart" size={22} color={Colors.primaryOrange} />
          </View>
          <View style={styles.headerInfo}>
            <Text
              style={[styles.orgName, { textAlign: rtl ? "right" : "left" }]}
              numberOfLines={1}
            >
              {user?.name ?? (rtl ? "جمعيتي" : "My Charity")}
            </Text>
            {statusInfo && (
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "18" }]}>
                <Feather name={statusInfo.icon} size={11} color={statusInfo.color} />
                <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={Colors.grayMedium} />
        </TouchableOpacity>
      </Animated.View>

      {/* Impact Banner */}
      <Animated.View
        entering={FadeInDown.delay(130).duration(450).springify()}
        style={styles.impactBanner}
      >
        <Text style={styles.impactCount}>{confirmedCount}</Text>
        <Text style={[styles.impactLabel, { textAlign: rtl ? "right" : "left" }]}>
          {rtl ? "وجبة استلمتموها حتى الآن 🤝" : "meals received so far 🤝"}
        </Text>
      </Animated.View>

      {/* Tab Bar */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(450).springify()}
        style={styles.tabBar}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Feather
                name={tab.icon}
                size={14}
                color={active ? Colors.primaryOrange : Colors.grayMedium}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
          <Text style={[styles.stateText, { textAlign: rtl ? "right" : "left" }]}>
            {rtl ? "جاري تحميل التبرعات…" : "Loading donations…"}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centeredState}>
          <Feather name="wifi-off" size={42} color={Colors.grayMedium} />
          <Text style={[styles.stateText, { textAlign: rtl ? "right" : "left" }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={refresh}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>{rtl ? "حاول مجدداً" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={activeData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DonationIncomingCard
              donation={item}
              tab={activeTab}
              isRated={ratedIds.has(item.id)}
              onMarkPickedUp={handleMarkPickedUp}
              onOpenProofModal={handleOpenProofModal}
              onRateSeller={handleRateSeller}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.primaryOrange}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>{EMPTY_ICON[activeTab]}</Text>
              <Text style={[styles.emptyTitle, { textAlign: rtl ? "right" : "left" }]}>
                {EMPTY_TEXT[activeTab]}
              </Text>
            </View>
          }
        />
      )}

      {/* Proof Upload Modal */}
      <ProofUploadModal
        visible={modalVisible}
        donationId={selectedDonationId}
        onClose={() => setModalVisible(false)}
        onConfirm={confirmWithProof}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rowReverse: { flexDirection: "row-reverse" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  orgIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.orangeLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1, gap: 4 },
  orgName: { fontSize: 17, fontWeight: "800", color: Colors.grayDark, maxWidth: 200 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // Impact Banner
  impactBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.greenLight,
    borderRadius: 14,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  impactCount: {
    fontSize: 36,
    fontWeight: "900",
    color: Colors.greenMain,
  },
  impactLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.greenMain,
    flex: 1,
    flexWrap: "wrap",
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
  },
  tabItemActive: { backgroundColor: Colors.orangeLight },
  tabLabel: { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },
  tabLabelActive: { color: Colors.primaryOrange },

  // States
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: Spacing.xl,
  },
  stateText: { fontSize: 14, color: Colors.grayMedium, textAlign: "center" },
  retryBtn: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  // List
  listContent: { paddingBottom: 40 },
  emptyState: { paddingTop: 80, alignItems: "center", gap: Spacing.sm },
  emptyEmoji: { fontSize: 52, marginBottom: 4 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.grayDark,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
});
