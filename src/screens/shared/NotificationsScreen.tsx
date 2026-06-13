import React, { useState, useCallback } from "react";
import {
  StyleSheet, Text, View, Platform, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import {
  fetchNotifications, markAllRead,
} from "../../services/shared/notifications.service";
import type { AppNotification, NotificationType } from "../../services/shared/notifications.service";

interface NotificationsScreenProps {
  onBack: () => void;
  onOpenStore?: (sellerId: string) => void;
}

const TYPE_ICON: Record<NotificationType, { icon: keyof typeof Feather.glyphMap; color: string; bg: string }> = {
  ORDER_RESERVED:            { icon: "shopping-bag",   color: Colors.primaryOrange, bg: Colors.orangeLight },
  ORDER_COMPLETED:           { icon: "check-circle",   color: Colors.greenMain,     bg: Colors.greenLight  },
  ORDER_CANCELLED:           { icon: "x-circle",       color: "#ef4444",            bg: "#fef2f2"          },
  DONATION_RECEIVED:         { icon: "gift",           color: "#8b5cf6",            bg: "#ede9fe"          },
  DONATION_CONFIRMED:        { icon: "heart",          color: Colors.greenMain,     bg: Colors.greenLight  },
  SELLER_APPROVED:           { icon: "check-circle",   color: Colors.greenMain,     bg: Colors.greenLight  },
  SELLER_REJECTED:           { icon: "x-circle",       color: "#ef4444",            bg: "#fef2f2"          },
  CHARITY_APPROVED:          { icon: "check-circle",   color: Colors.greenMain,     bg: Colors.greenLight  },
  NEW_LISTING_FROM_FAVORITE: { icon: "star",           color: Colors.primaryOrange, bg: Colors.orangeLight },
  LISTING_EXPIRING_SOON:     { icon: "clock",          color: "#f59e0b",            bg: "#fffbeb"          },
  WASTE_PATTERN_ALERT:       { icon: "alert-triangle", color: "#d97706",            bg: "#fffbeb"          },
  DEAL_WINDOW_TIP:           { icon: "zap",            color: "#0284c7",            bg: "#e0f2fe"          },
  ACCOUNT_BLOCKED:           { icon: "slash",          color: "#ef4444",            bg: "#fef2f2"          },
  LISTING_REPORTED:          { icon: "flag",           color: "#f59e0b",            bg: "#fffbeb"          },
  LISTING_REMOVED:           { icon: "trash-2",        color: "#ef4444",            bg: "#fef2f2"          },
  SYSTEM:                    { icon: "bell",           color: Colors.grayMedium,    bg: Colors.grayLight   },
};

function timeAgo(iso: string, rtl: boolean): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1)  return rtl ? "الآن" : "just now";
  if (mins < 60) return rtl ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  if (hrs < 24)  return rtl ? `منذ ${hrs} ساعة` : `${hrs}h ago`;
  return rtl ? `منذ ${days} يوم` : `${days}d ago`;
}

export default function NotificationsScreen({ onBack, onOpenStore }: NotificationsScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading,       setLoading]        = useState(true);
  const [refreshing,    setRefreshing]     = useState(false);
  const [fetchError,    setFetchError]     = useState("");
  const [markingAll,    setMarkingAll]     = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setFetchError("");
    try {
      const { notifications } = await fetchNotifications();
      setNotifications(notifications);
    } catch {
      setFetchError(rtl ? "تعذّر تحميل الإشعارات" : "Could not load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rtl]);

  React.useEffect(() => { load(); }, [load]);

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  const renderItem = ({ item, index }: { item: AppNotification; index: number }) => {
    const cfg = TYPE_ICON[item.type] ?? TYPE_ICON.SYSTEM;
    const isWasteAlert  = item.type === "WASTE_PATTERN_ALERT";
    const isDealTip     = item.type === "DEAL_WINDOW_TIP";
    const dealSellerId  = isDealTip ? String(item.data?.sellerId ?? "") : "";
    return (
      <Animated.View entering={FadeInDown.delay(index * 40).duration(350).springify()}>
        <View style={[
          styles.notifCard,
          !item.isRead && styles.notifCardUnread,
          isWasteAlert && styles.notifCardWaste,
          isDealTip    && styles.notifCardDeal,
          rtl          && styles.notifCardRTL,
        ]}>
          {!item.isRead && <View style={styles.unreadDot} />}
          <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
            <Feather name={cfg.icon} size={18} color={cfg.color} />
          </View>
          <View style={styles.notifBody}>
            <Text style={[styles.notifTitle, rtl && styles.rtl]} numberOfLines={2}>{item.title}</Text>
            <Text style={[styles.notifMsg,  rtl && styles.rtl]} numberOfLines={3}>{item.body}</Text>
            <Text style={[styles.notifTime, rtl && styles.rtl]}>{timeAgo(item.createdAt, rtl)}</Text>
            {isDealTip && !!dealSellerId && !!onOpenStore && (
              <TouchableOpacity
                style={[styles.dealBtn, rtl && { alignSelf: "flex-start" as const }]}
                onPress={() => onOpenStore(dealSellerId)}
                activeOpacity={0.8}
              >
                <Feather name="shopping-bag" size={13} color="#0284c7" />
                <Text style={styles.dealBtnText}>{rtl ? "تصفح العروض" : "Browse Deals"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(60).duration(450).springify()} style={[styles.header, rtl && styles.headerRTL]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Feather name={rtl ? "arrow-right" : "arrow-left"} size={22} color={Colors.grayDark} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={[styles.headerTitle, rtl && styles.rtl]}>
            {rtl ? "الإشعارات" : "Notifications"}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll} disabled={markingAll} activeOpacity={0.8}>
            {markingAll
              ? <ActivityIndicator size="small" color={Colors.primaryOrange} />
              : <Text style={styles.markAllText}>{rtl ? "قراءة الكل" : "Mark all read"}</Text>
            }
          </TouchableOpacity>
        )}
      </Animated.View>

      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator color={Colors.primaryOrange} size="large" />
          <Text style={[styles.stateText, rtl && styles.rtl]}>{rtl ? "جاري التحميل…" : "Loading…"}</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.centeredState}>
          <Feather name="wifi-off" size={40} color={Colors.grayMedium} />
          <Text style={[styles.stateText, rtl && styles.rtl]}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, notifications.length === 0 && styles.listContentEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.primaryOrange} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={[styles.emptyTitle, rtl && styles.rtl]}>
                {rtl ? "لا توجد إشعارات" : "No notifications yet"}
              </Text>
              <Text style={[styles.emptySub, rtl && styles.rtl]}>
                {rtl
                  ? "ستظهر هنا إشعاراتك عند وصول طلب أو تبرع جديد"
                  : "You'll see notifications here when orders or donations arrive"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },

  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  headerRTL: { flexDirection: "row-reverse" },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
  },
  titleWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: Colors.grayDark },
  unreadBadge: {
    backgroundColor: Colors.primaryOrange, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: "800", color: Colors.white },
  markAllBtn: { paddingHorizontal: 4 },
  markAllText: { fontSize: 13, fontWeight: "600", color: Colors.primaryOrange },

  centeredState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: Spacing.xl },
  stateText: { fontSize: 14, color: Colors.grayMedium, textAlign: "center" },
  retryBtn: { backgroundColor: Colors.primaryOrange, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40, gap: 2 },
  listContentEmpty: { flex: 1 },

  notifCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: Colors.white, borderRadius: 16,
    padding: Spacing.md, marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    position: "relative",
  },
  notifCardRTL:   { flexDirection: "row-reverse" },
  notifCardUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primaryOrange },
  notifCardWaste:  { borderLeftWidth: 3, borderLeftColor: "#d97706", backgroundColor: "#fffdf5" },
  notifCardDeal:   { borderLeftWidth: 3, borderLeftColor: "#0284c7", backgroundColor: "#f0f9ff" },

  dealBtn: {
    flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-end",
    marginTop: 6, backgroundColor: "#e0f2fe",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  dealBtnText: { fontSize: 12, fontWeight: "700", color: "#0284c7" },
  unreadDot: {
    position: "absolute", top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primaryOrange,
  },
  notifIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  notifBody: { flex: 1, gap: 3 },
  notifTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  notifMsg: { fontSize: 13, color: Colors.grayMedium, lineHeight: 18 },
  notifTime: { fontSize: 11, color: Colors.grayMedium },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.sm },
  emptyEmoji: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark, textAlign: "center" },
  emptySub: { fontSize: 14, color: Colors.grayMedium, lineHeight: 20, textAlign: "center" },
});
