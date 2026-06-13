import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { isRTL } from "../../../i18n";
import { useLeaderboard } from "../../../hooks/buyer/useLeaderboard";
import { useMonthlyWinner } from "../../../hooks/buyer/useMonthlyWinner";
import { useAuth } from "../../../hooks/auth/useAuth";
import type { LeaderboardBuyer, LeaderboardSeller } from "../../../services/buyer/stats.service";

interface Props {
  onClose: () => void;
}

const BADGE_EMOJI: Record<string, string> = {
  first_save:     "🌱",
  eco_hero_10kg:  "🌿",
  eco_hero_50kg:  "🌳",
  eco_hero_100kg: "🏆",
  super_saver:    "⭐",
  streak_7:       "🔥",
  streak_30:      "💎",
  donor:          "💚",
};

const MEDALS = ["🥇", "🥈", "🥉"];

type Tab = "buyers" | "sellers";

function RankCell({ rank }: { rank: number }) {
  if (rank <= 3) return <Text style={styles.medal}>{MEDALS[rank - 1]}</Text>;
  return <Text style={styles.rankNum}>{rank}</Text>;
}

function BuyerRow({ item, isMe, rtl }: { item: LeaderboardBuyer; isMe: boolean; rtl: boolean }) {
  const co2 = item.co2SavedKg >= 1
    ? `${item.co2SavedKg.toFixed(1)} كغ`
    : `${Math.round(item.co2SavedKg * 1000)} غ`;
  const badgeEmojis = item.badges.slice(0, 3).map(b => BADGE_EMOJI[b] ?? "🎖️").join(" ");
  return (
    <View style={[styles.row, isMe && styles.rowMe, rtl && styles.rowRtl]}>
      <RankCell rank={item.rank} />
      <View style={[styles.rowBody, rtl && { alignItems: "flex-end" as const }]}>
        <Text style={[styles.rowName, rtl && styles.rtl]} numberOfLines={1}>
          {item.name}{isMe ? "  (أنت)" : ""}
        </Text>
        {!!badgeEmojis && <Text style={styles.rowBadges}>{badgeEmojis}</Text>}
      </View>
      <Text style={[styles.co2, isMe && { color: Colors.primaryOrange }]}>{co2}</Text>
    </View>
  );
}

function SellerRow({ item, rtl }: { item: LeaderboardSeller; rtl: boolean }) {
  return (
    <View style={[styles.row, rtl && styles.rowRtl]}>
      <RankCell rank={item.rank} />
      <View style={[styles.rowBody, rtl && { alignItems: "flex-end" as const }]}>
        <Text style={[styles.rowName, rtl && styles.rtl]} numberOfLines={1}>
          {item.businessName}
        </Text>
        <Text style={styles.rowSub}>
          {item.totalDonations} تبرع • ⭐ {item.rating?.toFixed(1) ?? "—"}
        </Text>
      </View>
      <View style={styles.mealsWrap}>
        <Text style={styles.mealsValue}>{item.mealsRescued}</Text>
        <Text style={styles.mealsLabel}>وجبة</Text>
      </View>
    </View>
  );
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <View style={styles.winnerStars}>
      {[1,2,3,4,5].map(s => (
        <Feather key={s} name="star" size={14}
          color={s <= full ? "#f59e0b" : Colors.grayLight} />
      ))}
    </View>
  );
}

export default function LeaderboardScreen({ onClose }: Props) {
  const insets = useSafeAreaInsets();
  const rtl    = isRTL();
  const { user } = useAuth();
  const { data, loading, error, refresh } = useLeaderboard();
  const { winner, loading: winnerLoading } = useMonthlyWinner();
  const [tab, setTab] = useState<Tab>("buyers");

  const buyers  = data?.buyers  ?? [];
  const sellers = data?.sellers ?? [];

  const handleRefresh = () => { refresh(); };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "ios" ? insets.top : 0 }]}>
      {/* Header */}
      <View style={[styles.header, rtl && styles.rowRtl]}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={22} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, rtl && styles.rtl]}>أبطال إنقاذ الطعام 🏆</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
          <Text style={styles.errorText}>تعذّر تحميل البيانات</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={Colors.primaryOrange} />}
        >
          {/* ── Monthly winner banner ── */}
          {!winnerLoading && winner && (
            <View style={[styles.winnerCard, rtl && { alignItems: "flex-end" as const }]}>
              <View style={[styles.winnerBadgeRow, rtl && styles.rowRtl]}>
                <View style={styles.winnerBadge}>
                  <Text style={styles.winnerBadgeText}>بائع الشهر (أعلى تقييم هذا الشهر)</Text>
                </View>
              </View>
              <Text style={styles.winnerEmoji}>🏅</Text>
              <Text style={[styles.winnerName, rtl && styles.rtl]}>{winner.name}</Text>
              <StarRow rating={winner.rating} />
              <Text style={styles.winnerMonth}>{winner.month}</Text>
            </View>
          )}

          {/* ── Section label: weekly leaderboard ── */}
          <Text style={[styles.sectionLabel, rtl && styles.rtl]}>
            {rtl ? "أبطال الأسبوع في إنقاذ الطعام 🌱" : "Weekly Food Rescue Heroes 🌱"}
          </Text>

          {/* ── Tabs ── */}
          <View style={[styles.tabBar, rtl && styles.rowRtl]}>
            <TouchableOpacity
              style={[styles.tab, tab === "buyers" && styles.tabActive]}
              onPress={() => setTab("buyers")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === "buyers" && styles.tabTextActive]}>
                المشترون 🌱
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === "sellers" && styles.tabActive]}
              onPress={() => setTab("sellers")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === "sellers" && styles.tabTextActive]}>
                البائعون 🏪
              </Text>
            </TouchableOpacity>
          </View>

          {tab === "buyers" ? (
            buyers.length === 0
              ? <Text style={[styles.emptyText, rtl && styles.rtl]}>لا توجد بيانات بعد</Text>
              : buyers.map(b => (
                  <BuyerRow key={b.id} item={b} isMe={b.id === user?.id} rtl={rtl} />
                ))
          ) : (
            sellers.length === 0
              ? <Text style={[styles.emptyText, rtl && styles.rtl]}>لا توجد بيانات بعد</Text>
              : sellers.map(s => <SellerRow key={s.id} item={s} rtl={rtl} />)
          )}

          {/* Badge legend */}
          <View style={styles.legend}>
            <Text style={[styles.legendTitle, rtl && styles.rtl]}>دلالة الشارات</Text>
            <View style={[styles.legendGrid, rtl && { flexDirection: "row-reverse" as const }]}>
              {Object.entries(BADGE_EMOJI).map(([key, emoji]) => (
                <View key={key} style={[styles.legendItem, rtl && { flexDirection: "row-reverse" as const }]}>
                  <Text style={styles.legendEmoji}>{emoji}</Text>
                  <Text style={styles.legendKey}>{key.replace(/_/g, " ")}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },
  rowRtl: { flexDirection: "row-reverse" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
    backgroundColor: Colors.white,
  },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.grayDark },

  // ── Monthly winner card ──
  winnerCard: {
    backgroundColor: "#fffbeb",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#f59e0b",
    padding: Spacing.lg,
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  winnerBadgeRow: { flexDirection: "row" },
  winnerBadge: {
    backgroundColor: "#f59e0b",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  winnerBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },
  winnerEmoji: { fontSize: 36, marginTop: 4 },
  winnerName: { fontSize: 18, fontWeight: "800", color: Colors.grayDark, textAlign: "center" },
  winnerStars: { flexDirection: "row", gap: 3 },
  winnerMonth: { fontSize: 12, color: Colors.grayMedium, marginTop: 2 },

  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: Colors.grayMedium,
    textAlign: "center", marginBottom: 4, marginTop: 8,
    letterSpacing: 0.2,
  },

  tabBar: {
    flexDirection: "row",
    marginVertical: Spacing.sm,
    backgroundColor: Colors.grayLight + "55",
    borderRadius: 14,
    padding: 3,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 12 },
  tabActive: { backgroundColor: Colors.white, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: "600", color: Colors.grayMedium },
  tabTextActive: { color: Colors.primaryOrange, fontWeight: "800" },

  list: { paddingHorizontal: Spacing.md, paddingBottom: 40, gap: 8 },

  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  rowMe: { backgroundColor: Colors.primaryOrange + "15", borderWidth: 1.5, borderColor: Colors.primaryOrange },

  medal:   { fontSize: 22, width: 32, textAlign: "center" },
  rankNum: { fontSize: 16, fontWeight: "800", color: Colors.grayMedium, width: 32, textAlign: "center" },

  rowBody: { flex: 1, gap: 2 },
  rowName: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  rowBadges: { fontSize: 13 },
  rowSub: { fontSize: 12, color: Colors.grayMedium },

  co2: { fontSize: 14, fontWeight: "800", color: Colors.greenMain, minWidth: 52, textAlign: "right" },

  mealsWrap: { alignItems: "center", minWidth: 44 },
  mealsValue: { fontSize: 18, fontWeight: "800", color: Colors.primaryOrange },
  mealsLabel: { fontSize: 11, color: Colors.grayMedium, fontWeight: "600" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: Spacing.xl },
  errorText: { fontSize: 14, color: Colors.grayMedium },
  emptyText: { fontSize: 14, color: Colors.grayMedium, textAlign: "center", marginTop: 40 },
  retryBtn: { backgroundColor: Colors.primaryOrange, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },

  legend: {
    marginTop: 24, padding: Spacing.md,
    backgroundColor: Colors.white, borderRadius: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  legendTitle: { fontSize: 13, fontWeight: "800", color: Colors.grayDark, marginBottom: 10 },
  legendGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4, minWidth: "45%" },
  legendEmoji: { fontSize: 15 },
  legendKey: { fontSize: 11, color: Colors.grayMedium },
});
