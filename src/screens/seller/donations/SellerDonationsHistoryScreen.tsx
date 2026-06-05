import React, { useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { isRTL } from "../../../i18n";
import { useSellerDonations } from "../../../hooks/seller/useSellerDonations";
import type { SellerDonation } from "../../../services/seller/donation.service";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SellerDonationsHistoryScreenProps {
  onBack: () => void;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; color: string; icon: string }> = {
  PENDING:   { labelEn: "Incoming",  labelAr: "قادم",           color: Colors.primaryOrange, icon: "clock"       },
  PICKED_UP: { labelEn: "Picked Up", labelAr: "تم الاستلام",    color: "#8b5cf6",            icon: "truck"       },
  CONFIRMED: { labelEn: "Confirmed", labelAr: "مكتمل",          color: Colors.greenMain,     icon: "check-circle"},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

function formatPickup(start?: string, end?: string): string {
  if (!start || !end) return "";
  try {
    const fmt = (s: string) => new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${fmt(start)} – ${fmt(end)}`;
  } catch { return ""; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SellerDonationsHistoryScreen({ onBack }: SellerDonationsHistoryScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const rtl        = isRTL();

  const { donations, loading, refreshing, error, hasMore, fetchDonations } = useSellerDonations();

  useEffect(() => { fetchDonations(true); }, []);

  return (
    <View style={[styles.root, { paddingTop: topPadding }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{rtl ? "سجل التبرعات" : "Donations History"}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && donations.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primaryOrange} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={40} color={Colors.grayMedium} />
          <Text style={[styles.errorText, rtl && styles.textRight]}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDonations(true)} activeOpacity={0.8}>
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
              onRefresh={() => fetchDonations(true)}
              tintColor={Colors.primaryOrange}
            />
          }
        >
          {donations.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyPane}>
              <Text style={styles.emptyEmoji}>🤝</Text>
              <Text style={[styles.emptyTitle, rtl && styles.textRight]}>
                {rtl ? "لا توجد تبرعات بعد" : "No donations yet"}
              </Text>
              <Text style={[styles.emptySub, rtl && styles.textRight]}>
                {rtl
                  ? "تبرع بالطعام الفائض من قائمة منتجاتك"
                  : "Donate surplus food from your listings to local charities"}
              </Text>
            </Animated.View>
          ) : (
            <>
              {donations.map((donation, i) => (
                <Animated.View
                  key={donation.id}
                  entering={FadeInDown.delay(i * 40).duration(350)}
                >
                  <DonationCard donation={donation} rtl={rtl} />
                </Animated.View>
              ))}

              {hasMore && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() => fetchDonations(false)}
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

// ─── DonationCard ─────────────────────────────────────────────────────────────

function DonationCard({ donation, rtl }: { donation: SellerDonation; rtl: boolean }) {
  const cfg  = STATUS_CONFIG[donation.status] ?? STATUS_CONFIG.PENDING;
  const pickup = formatPickup(donation.pickupStart, donation.pickupEnd);

  return (
    <View style={styles.card}>
      <View style={[styles.cardInner, rtl && styles.rowRTL]}>

        {/* Status icon */}
        <View style={[styles.statusIcon, { backgroundColor: cfg.color + "18" }]}>
          <Feather name={cfg.icon as "clock"} size={18} color={cfg.color} />
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, rtl && styles.textRight]} numberOfLines={1}>
            {donation.listing?.title ?? (rtl ? "تبرع" : "Donation")}
          </Text>
          <Text style={[styles.cardSub, rtl && styles.textRight]}>
            {donation.charity?.orgName ?? "—"}
            {"  ·  "}
            {rtl ? `الكمية: ${donation.quantity}` : `Qty: ${donation.quantity}`}
          </Text>
          {pickup !== "" && (
            <Text style={[styles.cardMeta, rtl && styles.textRight]}>{pickup}</Text>
          )}
          <Text style={[styles.cardDate, rtl && styles.textRight]}>{formatDate(donation.createdAt)}</Text>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: cfg.color + "18" }]}>
          <Text style={[styles.statusBadgeText, { color: cfg.color }]}>
            {rtl ? cfg.labelAr : cfg.labelEn}
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

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.background, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.grayDark },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: Spacing.xl },
  errorText: { fontSize: 15, color: Colors.grayMedium, textAlign: "center" },
  retryBtn: { backgroundColor: Colors.primaryOrange, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: 40, gap: Spacing.md },

  emptyPane: { alignItems: "center", paddingTop: 60, gap: Spacing.md },
  emptyEmoji: { fontSize: 60, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: Colors.grayDark, textAlign: "center" },
  emptySub: { fontSize: 14, color: Colors.grayMedium, lineHeight: 20, textAlign: "center" },

  card: {
    backgroundColor: Colors.white, borderRadius: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  cardInner: { flexDirection: "row", alignItems: "center", padding: Spacing.md, gap: 12 },
  statusIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  cardSub:   { fontSize: 12, color: Colors.grayMedium },
  cardMeta:  { fontSize: 12, color: Colors.grayMedium },
  cardDate:  { fontSize: 11, color: Colors.grayMedium, marginTop: 2 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, flexShrink: 0 },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },

  loadMoreBtn: {
    alignItems: "center", paddingVertical: 14,
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  loadMoreText: { fontSize: 14, fontWeight: "600", color: Colors.primaryOrange },
});
