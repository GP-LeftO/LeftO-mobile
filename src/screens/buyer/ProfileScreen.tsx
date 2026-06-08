import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
  Modal,
  TextInput,
  Switch,
  Linking,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { updateUserProfile } from "../../services/buyer/profile/profileService";

const AVATAR_COLORS = [
  "#DE985A", "#16A34A", "#7C3AED", "#EC4899", "#0EA5E9",
  "#F59E0B", "#EF4444", "#14B8A6", "#6366F1", "#84CC16",
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProfileScreenProps {
  onLogout?: () => void;
  onOpenChatbot?: () => void;
}

// ─── Settings items (collapsed under the Settings button) ─────────────────────

const SETTINGS_ITEMS: {
  id: "personal" | "notifications" | "pickup" | "rate" | "terms";
  icon: string;
  labelEn: string;
  labelAr: string;
  color: string;
}[] = [
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

  const [settingsExpanded,  setSettingsExpanded]  = useState(false);
  const [colorPickerOpen,   setColorPickerOpen]   = useState(false);
  const [avatarColor,       setAvatarColor]       = useState<string | null>(null);
  const [savingColor,       setSavingColor]        = useState(false);

  // ── Active settings sheet ──────────────────────────────────────────────────
  const [activeSheet, setActiveSheet] = useState<"personal" | "notifications" | "pickup" | "terms" | null>(null);

  // ── Personal Information ───────────────────────────────────────────────────
  const [editName,       setEditName]       = useState("");
  const [editEmail,      setEditEmail]      = useState("");
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalMsg,    setPersonalMsg]    = useState("");

  // ── Notification prefs (local) ─────────────────────────────────────────────
  const [notifOrders,   setNotifOrders]   = useState(true);
  const [notifFavs,     setNotifFavs]     = useState(true);
  const [notifPromos,   setNotifPromos]   = useState(false);

  // ── Preferred pickup times (local) ─────────────────────────────────────────
  const PICKUP_SLOTS = ["08:00 – 10:00", "12:00 – 14:00", "17:00 – 19:00", "20:00 – 22:00"];
  const [preferredSlots, setPreferredSlots] = useState<Set<string>>(new Set());

  // Load notification + pickup prefs from AsyncStorage
  useEffect(() => {
    AsyncStorage.multiGet(["@notif_orders", "@notif_favs", "@notif_promos", "@pickup_slots"])
      .then(([[, o], [, f], [, p], [, s]]) => {
        if (o !== null) setNotifOrders(o === "true");
        if (f !== null) setNotifFavs(f === "true");
        if (p !== null) setNotifPromos(p === "true");
        if (s !== null) setPreferredSlots(new Set(JSON.parse(s) as string[]));
      })
      .catch(() => {});
  }, []);

  const saveNotifPrefs = async (key: string, value: boolean) => {
    await AsyncStorage.setItem(key, String(value));
  };

  const togglePickupSlot = async (slot: string) => {
    setPreferredSlots((prev) => {
      const next = new Set(prev);
      next.has(slot) ? next.delete(slot) : next.add(slot);
      AsyncStorage.setItem("@pickup_slots", JSON.stringify([...next])).catch(() => {});
      return next;
    });
  };

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

  const handleSelectColor = async (color: string) => {
    setAvatarColor(color);
    setSavingColor(true);
    try {
      await updateUserProfile({ avatarColor: color });
      await onRefresh();
    } catch {
      // silent fail — color is still set locally
    } finally {
      setSavingColor(false);
      setColorPickerOpen(false);
    }
  };

  const currentAvatarColor = avatarColor ?? profile?.avatarColor;

  const openPersonalSheet = () => {
    setEditName(profile?.name ?? user?.name ?? "");
    setEditEmail(profile?.email ?? user?.email ?? "");
    setPersonalMsg("");
    setActiveSheet("personal");
  };

  const handleSavePersonal = async () => {
    setSavingPersonal(true);
    setPersonalMsg("");
    try {
      await updateUserProfile({
        name:  editName.trim()  || undefined,
        email: editEmail.trim() || undefined,
      });
      setPersonalMsg(rtl ? "تم الحفظ!" : "Saved!");
      await onRefresh();
      setTimeout(() => { setPersonalMsg(""); setActiveSheet(null); }, 1500);
    } catch {
      setPersonalMsg(rtl ? "تعذّر الحفظ. يرجى المحاولة مجدداً." : "Could not save. Please try again.");
    } finally {
      setSavingPersonal(false);
    }
  };

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
          {/* Blocked account banner */}
          {profile?.isBlocked && (
            <View style={[styles.blockBanner, rtl && styles.rowReverse]}>
              <Feather name="slash" size={18} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.blockBannerTitle, rtl && styles.rtl]}>
                  {rtl ? "🚫 حسابك موقوف مؤقتاً" : "🚫 Account Suspended"}
                </Text>
                <Text style={[styles.blockBannerBody, rtl && styles.rtl]}>
                  {rtl
                    ? `تم إلغاء ${profile.cancellationCount ?? 5} حجوزات. تواصل مع الإدارة.`
                    : `${profile.cancellationCount ?? 5} cancellations recorded. Contact support.`}
                </Text>
              </View>
            </View>
          )}

          {/* Cancellation warning (3–4 cancellations, not yet blocked) */}
          {!profile?.isBlocked && (profile?.cancellationCount ?? 0) >= 3 && (
            <View style={[styles.warnBanner, rtl && styles.rowReverse]}>
              <Feather name="alert-triangle" size={16} color="#92400e" />
              <Text style={[styles.warnBannerText, rtl && styles.rtl]}>
                {rtl
                  ? `⚠️ تنبيه: ${profile!.cancellationCount} إلغاءات — الحد الأقصى 5 قبل التعليق`
                  : `⚠️ Warning: ${profile!.cancellationCount} cancellations — max 5 before suspension`}
              </Text>
            </View>
          )}

          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatar, currentAvatarColor ? { backgroundColor: currentAvatarColor } : null]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
              <TouchableOpacity
                style={styles.avatarEditBtn}
                onPress={() => setColorPickerOpen(true)}
                activeOpacity={0.8}
              >
                <Feather name="edit-2" size={13} color={Colors.white} />
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
          {SETTINGS_ITEMS.map((item, idx) => {
            const handlePress = () => {
              if (item.id === "personal")      { openPersonalSheet(); return; }
              if (item.id === "notifications") { setActiveSheet("notifications"); return; }
              if (item.id === "pickup")        { setActiveSheet("pickup"); return; }
              if (item.id === "terms")         { setActiveSheet("terms"); return; }
              if (item.id === "rate") {
                const url = Platform.OS === "android"
                  ? "market://details?id=com.lefto.app"
                  : "https://apps.apple.com/app/lefto/id000000000";
                Linking.canOpenURL(url)
                  .then((can) => Linking.openURL(can ? url : "https://lefto.app"))
                  .catch(() => {});
              }
            };
            return (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={[styles.settingsRow, rtl && styles.rowReverse]}
                  activeOpacity={0.7}
                  onPress={handlePress}
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
            );
          })}
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

      {/* ── Personal Information sheet ── */}
      <Modal visible={activeSheet === "personal"} transparent animationType="slide" onRequestClose={() => setActiveSheet(null)}>
        <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={() => setActiveSheet(null)} />
        <View style={sheetStyles.sheet}>
          <View style={[sheetStyles.header, rtl && { flexDirection: "row-reverse" as const }]}>
            <Text style={[sheetStyles.title, rtl && { textAlign: "right" as const }]}>
              {rtl ? "المعلومات الشخصية" : "Personal Information"}
            </Text>
            <TouchableOpacity onPress={() => setActiveSheet(null)}><Feather name="x" size={22} color={Colors.grayDark} /></TouchableOpacity>
          </View>

          <Text style={[sheetStyles.label, rtl && { textAlign: "right" as const }]}>{rtl ? "الاسم" : "Name"}</Text>
          <TextInput
            style={[sheetStyles.input, rtl && { textAlign: "right" as const }]}
            value={editName}
            onChangeText={setEditName}
            placeholder={rtl ? "اسمك الكامل" : "Your full name"}
            placeholderTextColor={Colors.grayMedium}
          />

          <Text style={[sheetStyles.label, rtl && { textAlign: "right" as const }]}>{rtl ? "البريد الإلكتروني" : "Email"}</Text>
          <TextInput
            style={[sheetStyles.input, rtl && { textAlign: "right" as const }]}
            value={editEmail}
            onChangeText={setEditEmail}
            placeholder={rtl ? "بريدك الإلكتروني" : "Your email address"}
            placeholderTextColor={Colors.grayMedium}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {personalMsg ? (
            <Text style={[sheetStyles.msg, { color: personalMsg.includes("تعذّر") || personalMsg.includes("Could not") ? "#ef4444" : Colors.greenMain }]}>
              {personalMsg}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[sheetStyles.saveBtn, savingPersonal && { opacity: 0.6 }]}
            onPress={handleSavePersonal}
            disabled={savingPersonal}
            activeOpacity={0.85}
          >
            {savingPersonal
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={sheetStyles.saveBtnText}>{rtl ? "حفظ التغييرات" : "Save Changes"}</Text>
            }
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Notification Settings sheet ── */}
      <Modal visible={activeSheet === "notifications"} transparent animationType="slide" onRequestClose={() => setActiveSheet(null)}>
        <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={() => setActiveSheet(null)} />
        <View style={sheetStyles.sheet}>
          <View style={[sheetStyles.header, rtl && { flexDirection: "row-reverse" as const }]}>
            <Text style={[sheetStyles.title, rtl && { textAlign: "right" as const }]}>
              {rtl ? "إعدادات الإشعارات" : "Notification Settings"}
            </Text>
            <TouchableOpacity onPress={() => setActiveSheet(null)}><Feather name="x" size={22} color={Colors.grayDark} /></TouchableOpacity>
          </View>
          {[
            { key: "orders",  label: rtl ? "تحديثات الطلبات" : "Order updates",            val: notifOrders, set: (v: boolean) => { setNotifOrders(v); saveNotifPrefs("@notif_orders", v); } },
            { key: "favs",    label: rtl ? "عروض المفضّلة" : "Favorites new listings",      val: notifFavs,   set: (v: boolean) => { setNotifFavs(v);   saveNotifPrefs("@notif_favs", v);   } },
            { key: "promos",  label: rtl ? "العروض والتخفيضات" : "Promotions & discounts",  val: notifPromos, set: (v: boolean) => { setNotifPromos(v); saveNotifPrefs("@notif_promos", v); } },
          ].map((row, i) => (
            <View key={row.key} style={[sheetStyles.toggleRow, rtl && { flexDirection: "row-reverse" as const }, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.grayLight }]}>
              <Text style={[sheetStyles.toggleLabel, rtl && { textAlign: "right" as const }]}>{row.label}</Text>
              <Switch
                value={row.val}
                onValueChange={row.set}
                trackColor={{ false: Colors.grayLight, true: Colors.primaryOrange }}
                thumbColor={Colors.white}
              />
            </View>
          ))}
          <Text style={[sheetStyles.note, rtl && { textAlign: "right" as const }]}>
            {rtl ? "* الإشعارات الفورية تتطلب تفعيل الإشعارات في إعدادات الجهاز." : "* Push notifications require notifications to be enabled in device settings."}
          </Text>
        </View>
      </Modal>

      {/* ── Preferred Pickup Times sheet ── */}
      <Modal visible={activeSheet === "pickup"} transparent animationType="slide" onRequestClose={() => setActiveSheet(null)}>
        <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={() => setActiveSheet(null)} />
        <View style={sheetStyles.sheet}>
          <View style={[sheetStyles.header, rtl && { flexDirection: "row-reverse" as const }]}>
            <Text style={[sheetStyles.title, rtl && { textAlign: "right" as const }]}>
              {rtl ? "أوقات الاستلام المفضلة" : "Preferred Pickup Times"}
            </Text>
            <TouchableOpacity onPress={() => setActiveSheet(null)}><Feather name="x" size={22} color={Colors.grayDark} /></TouchableOpacity>
          </View>
          <Text style={[sheetStyles.note, rtl && { textAlign: "right" as const }, { marginBottom: Spacing.md }]}>
            {rtl ? "اختر الأوقات التي تفضّل فيها الاستلام. سيتم تمييز العروض المناسبة لك." : "Select the times you prefer to pick up. Matching listings will be highlighted."}
          </Text>
          {PICKUP_SLOTS.map((slot) => {
            const selected = preferredSlots.has(slot);
            return (
              <TouchableOpacity
                key={slot}
                style={[sheetStyles.slotRow, selected && sheetStyles.slotRowSelected, rtl && { flexDirection: "row-reverse" as const }]}
                onPress={() => togglePickupSlot(slot)}
                activeOpacity={0.8}
              >
                <Feather name={selected ? "check-circle" : "circle"} size={20} color={selected ? Colors.primaryOrange : Colors.grayMedium} />
                <Text style={[sheetStyles.slotLabel, selected && { color: Colors.primaryOrange }]}>{slot}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>

      {/* ── Terms & Privacy sheet ── */}
      <Modal visible={activeSheet === "terms"} transparent animationType="slide" onRequestClose={() => setActiveSheet(null)}>
        <TouchableOpacity style={sheetStyles.overlay} activeOpacity={1} onPress={() => setActiveSheet(null)} />
        <View style={[sheetStyles.sheet, { maxHeight: "80%" }]}>
          <View style={[sheetStyles.header, rtl && { flexDirection: "row-reverse" as const }]}>
            <Text style={[sheetStyles.title, rtl && { textAlign: "right" as const }]}>
              {rtl ? "الشروط والخصوصية" : "Terms & Privacy"}
            </Text>
            <TouchableOpacity onPress={() => setActiveSheet(null)}><Feather name="x" size={22} color={Colors.grayDark} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[sheetStyles.termsText, rtl && { textAlign: "right" as const }]}>
              {rtl
                ? "LeftO منصة لإنقاذ الطعام الفائض وتوزيعه بأسعار مخفضة. باستخدام التطبيق، توافق على الشروط التالية:\n\n• تُستخدم بياناتك الشخصية فقط لتقديم الخدمة.\n• لا تُشارك بياناتك مع أطراف خارجية دون موافقتك.\n• أنت مسؤول عن دقة المعلومات التي تدخلها.\n• الاستخدام التجاري أو إعادة البيع غير مسموح بدون إذن.\n• يحق لـ LeftO تعليق الحسابات التي تنتهك الشروط.\n\nللتواصل: support@lefto.app"
                : "LeftO is a platform for rescuing surplus food and distributing it at discounted prices. By using the app, you agree to the following:\n\n• Your personal data is used only to deliver the service.\n• Your data is not shared with third parties without your consent.\n• You are responsible for the accuracy of information you provide.\n• Commercial use or resale is not permitted without permission.\n• LeftO reserves the right to suspend accounts that violate these terms.\n\nContact: support@lefto.app"
              }
            </Text>
            <TouchableOpacity
              style={sheetStyles.linkBtn}
              onPress={() => Linking.openURL("https://lefto.app/privacy").catch(() => {})}
              activeOpacity={0.7}
            >
              <Text style={sheetStyles.linkBtnText}>{rtl ? "عرض السياسة الكاملة على الويب" : "View full policy on web"}</Text>
              <Feather name="external-link" size={14} color={Colors.primaryOrange} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Avatar color picker modal */}
      <Modal visible={colorPickerOpen} transparent animationType="slide" onRequestClose={() => setColorPickerOpen(false)}>
        <TouchableOpacity style={avatarStyles.overlay} activeOpacity={1} onPress={() => setColorPickerOpen(false)} />
        <View style={avatarStyles.sheet}>
          <View style={[avatarStyles.sheetHeader, rtl && { flexDirection: "row-reverse" as const }]}>
            <Text style={[avatarStyles.sheetTitle, rtl && { textAlign: "right" as const }]}>
              {rtl ? "اختر لون الصورة الرمزية" : "Choose Avatar Color"}
            </Text>
            <TouchableOpacity onPress={() => setColorPickerOpen(false)}>
              <Feather name="x" size={22} color={Colors.grayDark} />
            </TouchableOpacity>
          </View>
          <View style={avatarStyles.colorGrid}>
            {AVATAR_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  avatarStyles.colorSwatch,
                  { backgroundColor: color },
                  currentAvatarColor === color && avatarStyles.colorSwatchSelected,
                ]}
                onPress={() => handleSelectColor(color)}
                disabled={savingColor}
                activeOpacity={0.85}
              >
                {currentAvatarColor === color && (
                  <Feather name="check" size={18} color={Colors.white} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {savingColor && (
            <View style={avatarStyles.savingRow}>
              <ActivityIndicator size="small" color={Colors.primaryOrange} />
              <Text style={avatarStyles.savingText}>{rtl ? "جاري الحفظ…" : "Saving…"}</Text>
            </View>
          )}
        </View>
      </Modal>
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

  // Block / warning banners
  blockBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#ef4444",
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    borderRadius: 14, padding: Spacing.md,
  },
  blockBannerTitle: { fontSize: 14, fontWeight: "800", color: "#fff" },
  blockBannerBody:  { fontSize: 12, color: "#fee2e2", marginTop: 2, lineHeight: 17 },
  warnBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fef3c7",
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    borderRadius: 12, padding: Spacing.sm,
    borderWidth: 1, borderColor: "#fcd34d",
  },
  warnBannerText: { flex: 1, fontSize: 13, fontWeight: "600", color: "#92400e" },

  // Sign out
  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 16, backgroundColor: "#fef2f2",
    marginTop: Spacing.sm,
  },
  signOutText: { fontSize: 15, fontWeight: "700", color: "#ef4444" },
});

const avatarStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, gap: Spacing.lg,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center" },
  colorSwatch: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  colorSwatchSelected: {
    borderWidth: 3, borderColor: Colors.grayDark,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  savingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  savingText: { fontSize: 13, color: Colors.grayMedium },
});

const sheetStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, gap: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 18, fontWeight: "800", color: Colors.grayDark },
  label: { fontSize: 13, fontWeight: "700", color: Colors.grayDark },
  input: {
    backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md, height: 48,
    fontSize: 15, color: Colors.grayDark,
  },
  msg: { fontSize: 13, fontWeight: "600" },
  saveBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },
  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14,
  },
  toggleLabel: { fontSize: 15, color: Colors.grayDark, flex: 1 },
  note: { fontSize: 12, color: Colors.grayMedium, lineHeight: 18 },
  slotRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 13, borderRadius: 12,
    paddingHorizontal: Spacing.sm,
  },
  slotRowSelected: { backgroundColor: Colors.orangeLight },
  slotLabel: { fontSize: 15, color: Colors.grayDark, fontWeight: "600" },
  termsText: { fontSize: 14, color: Colors.grayDark, lineHeight: 22, marginBottom: Spacing.lg },
  linkBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: Spacing.md,
  },
  linkBtnText: { fontSize: 14, fontWeight: "600", color: Colors.primaryOrange },
});
