import React, { useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Platform, ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useNotifications } from "../../hooks/buyer/useNotifications";
import type { AppNotification } from "../../services/buyer/notifications.service";

// ─── Props ────────────────────────────────────────────────────────────────────

interface NotificationsScreenProps {
  onBack: () => void;
}

// ─── Notification type config ─────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: keyof typeof Feather.glyphMap; color: string; bgColor: string }> = {
  ORDER_RESERVED:   { icon: "shopping-bag", color: Colors.primaryOrange, bgColor: Colors.orangeLight },
  ORDER_CANCELLED:  { icon: "x-circle",     color: "#ef4444",            bgColor: "#fef2f2"          },
  ORDER_RECEIVED:   { icon: "check-circle", color: Colors.greenMain,     bgColor: Colors.greenLight  },
  DONATION_RESERVED:{ icon: "heart",        color: Colors.greenMain,     bgColor: Colors.greenLight  },
};

const DEFAULT_CONFIG = { icon: "bell" as const, color: Colors.primaryOrange, bgColor: Colors.orangeLight };

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? DEFAULT_CONFIG;
}

function timeAgo(iso: string, rtl: boolean): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return rtl ? "الآن" : "Just now";
    if (mins < 60) return rtl ? `منذ ${mins} د` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return rtl ? `منذ ${hrs} س` : `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return rtl ? `منذ ${days} ي` : `${days}d ago`;
  } catch { return ""; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const rtl        = isRTL();

  const { notifications, unreadCount, loading, refreshing, error, hasMore, fetch, markAllRead } = useNotifications();

  useEffect(() => { fetch(true); }, []);

  return (
    <View style={[styles.root, { paddingTop: topPadding }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{rtl ? "الإشعارات" : "Notifications"}</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markReadBtn} onPress={markAllRead} activeOpacity={0.8}>
            <Text style={styles.markReadText}>{rtl ? "قراءة الكل" : "Mark all read"}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primaryOrange} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={40} color={Colors.grayMedium} />
          <Text style={[styles.errorText, rtl && styles.textRight]}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetch(true)} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetch(true)}
              tintColor={Colors.primaryOrange}
            />
          }
        >
          {notifications.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyPane}>
              <View style={styles.emptyIconWrap}>
                <Feather name="bell-off" size={36} color={Colors.grayMedium} />
              </View>
              <Text style={[styles.emptyTitle, rtl && styles.textRight]}>
                {rtl ? "لا توجد إشعارات" : "No notifications yet"}
              </Text>
              <Text style={[styles.emptySub, rtl && styles.textRight]}>
                {rtl ? "ستظهر هنا تحديثات طلباتك وتبرعاتك" : "Order and donation updates will appear here"}
              </Text>
            </Animated.View>
          ) : (
            <>
              {notifications.map((notif, i) => (
                <Animated.View key={notif.id} entering={FadeInDown.delay(i * 30).duration(300)}>
                  <NotificationCard notif={notif} rtl={rtl} />
                </Animated.View>
              ))}
              {hasMore && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() => fetch(false)}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading
                    ? <ActivityIndicator size="small" color={Colors.primaryOrange} />
                    : <Text style={styles.loadMoreText}>{rtl ? "تحميل المزيد" : "Load more"}</Text>}
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── NotificationCard ─────────────────────────────────────────────────────────

function NotificationCard({ notif, rtl }: { notif: AppNotification; rtl: boolean }) {
  const cfg = getConfig(notif.type);
  return (
    <View style={[styles.card, !notif.read && styles.cardUnread]}>
      {!notif.read && <View style={styles.unreadDot} />}
      <View style={[styles.cardInner, rtl && styles.rowRTL]}>
        <View style={[styles.cardIcon, { backgroundColor: cfg.bgColor }]}>
          <Feather name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <View style={styles.cardBody}>
          <View style={[styles.cardTitleRow, rtl && styles.rowRTL]}>
            <Text style={[styles.cardTitle, rtl && styles.textRight]} numberOfLines={1}>
              {notif.title}
            </Text>
            <Text style={styles.cardTime}>{timeAgo(notif.createdAt, rtl)}</Text>
          </View>
          <Text style={[styles.cardBody2, rtl && styles.textRight]} numberOfLines={2}>
            {notif.body}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  textRight: { textAlign: "right" },
  rowRTL: { flexDirection: "row-reverse" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: Spacing.xl },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.grayLight, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.grayDark },
  markReadBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: Colors.orangeLight },
  markReadText: { fontSize: 12, fontWeight: "700", color: Colors.primaryOrange },

  scroll: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.sm },

  errorText: { fontSize: 15, color: Colors.grayMedium, textAlign: "center" },
  retryBtn: { backgroundColor: Colors.primaryOrange, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  emptyPane: { alignItems: "center", paddingTop: 60, gap: Spacing.md },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.grayLight, alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark, textAlign: "center" },
  emptySub: { fontSize: 13, color: Colors.grayMedium, lineHeight: 19, textAlign: "center" },

  card: {
    backgroundColor: Colors.white, borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    position: "relative",
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: Colors.primaryOrange },
  unreadDot: {
    position: "absolute", top: 12, right: 12,
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryOrange,
  },
  cardInner: { flexDirection: "row", alignItems: "flex-start", padding: Spacing.md, gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark, flex: 1 },
  cardTime:  { fontSize: 11, color: Colors.grayMedium, flexShrink: 0 },
  cardBody2: { fontSize: 13, color: Colors.grayMedium, lineHeight: 18 },

  loadMoreBtn: {
    alignItems: "center", paddingVertical: 14,
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    marginTop: Spacing.sm,
  },
  loadMoreText: { fontSize: 14, fontWeight: "600", color: Colors.primaryOrange },
});
