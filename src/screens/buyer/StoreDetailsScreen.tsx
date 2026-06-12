/**
 * StoreDetailsScreen
 *
 * Full listing + store details page. Receives listingId and sellerId as props,
 * fetches both in parallel via useStoreDetails, and renders:
 *   hero area, freshness badge, pricing, pickup window, items left,
 *   description, allergen note, rating, map placeholder, Reserve + Donate CTAs.
 *
 * Handles: loading skeleton, error + retry, null-safe field rendering, RTL layout.
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, ActivityIndicator, Share, Linking,
  Modal, TextInput, Alert, Image,
} from "react-native";
import LeafletMap from "../../components/shared/LeafletMap";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { t, isRTL } from "../../i18n";
import { useStoreDetails } from "../../hooks/buyer/useStoreDetails";
import { useSellerReviews } from "../../hooks/buyer/useSellerReviews";
import { useKaram } from "../../hooks/buyer/useKaram";
import ReviewCard from "../../components/buyer/profile/ReviewCard";
import { getPublicPerformance } from "../../services/seller/listingAI.service";
import { reportListing, type ReportReason } from "../../services/buyer/report.service";
import type { PerformanceResult } from "../../services/seller/listingAI.service";
import type { FreshnessBadge, ListingType } from "../../types";
import type { CheckoutParams } from "../../types/order.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KaramPressParams {
  sellerId:   string;
  listingId:  string;
  sellerName: string;
}

interface StoreDetailsScreenProps {
  listingId:    string;
  sellerId:     string;
  onBack:       () => void;
  onCheckout:   (params: CheckoutParams) => void;
  onKaramPress?: (params: KaramPressParams) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function freshnessColors(badge: FreshnessBadge | undefined): { bg: string; text: string; hero: string } {
  switch (badge) {
    case "eat_today":    return { bg: Colors.greenLight,  text: Colors.greenMain,       hero: "#d1fae5" };
    case "fresh_tonight": return { bg: Colors.orangeLight, text: Colors.primaryOrange,  hero: "#ffe8d6" };
    case "good_1_2_days": return { bg: "#fee2e2",          text: "#ef4444",              hero: "#fecaca" };
    default:              return { bg: Colors.orangeLight, text: Colors.primaryOrange,  hero: "#ffe8d6" };
  }
}

function freshnessLabel(badge: FreshnessBadge | undefined, tr: ReturnType<typeof t>["storeDetails"]): string {
  switch (badge) {
    case "eat_today":    return tr.freshToday;
    case "fresh_tonight": return tr.eatSoon;
    case "good_1_2_days": return tr.lastChance;
    default:              return "";
  }
}

function typeLabel(type: ListingType, tr: ReturnType<typeof t>["storeDetails"]): string {
  return type === "MEAL_BAG" ? tr.surpriseBag : tr.specificParcel;
}

function discountPercent(original: number, discounted: number): number {
  return Math.round(((original - discounted) / original) * 100);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <View style={skeletonStyles.container}>
      <View style={skeletonStyles.hero} />
      <View style={skeletonStyles.body}>
        {[160, 100, 80, 240, 200, 140].map((w, i) => (
          <View key={i} style={[skeletonStyles.line, { width: `${Math.min(w, 280)}%` as unknown as number }]} />
        ))}
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hero: { height: 220, backgroundColor: Colors.grayLight },
  body: { padding: Spacing.xl, gap: 14 },
  line: { height: 14, backgroundColor: Colors.grayLight, borderRadius: 8, maxWidth: "90%" },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function StoreDetailsScreen({
  listingId,
  sellerId,
  onBack,
  onCheckout,
  onKaramPress,
}: StoreDetailsScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const botPadding = Platform.OS === "web" ? 24 : insets.bottom;
  const rtl        = isRTL();
  const tr         = t().storeDetails;

  const { listing, seller, loading, error, refetch } = useStoreDetails(listingId, sellerId);
  const { reviews, loading: reviewsLoading, loadingMore, hasMore, loadMore } = useSellerReviews(sellerId);

  const { balance: karamBalance, loading: karamLoading, loadBalance } = useKaram();

  const [heroImageError, setHeroImageError] = useState(false);
  const [performance,    setPerformance]    = useState<Omit<PerformanceResult, 'stats'> | null>(null);
  const [reportOpen,     setReportOpen]     = useState(false);
  const [reportReason,   setReportReason]   = useState<ReportReason | null>(null);
  const [reportDetails,  setReportDetails]  = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone,     setReportDone]     = useState(false);

  useEffect(() => {
    if (sellerId) {
      getPublicPerformance(sellerId).then(setPerformance).catch(() => {});
    }
  }, [sellerId]);

  useEffect(() => {
    if ((seller as any)?.participatesInKaram) {
      loadBalance(sellerId);
    }
  }, [sellerId, seller, loadBalance]);

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.container}>
        <BackHeader onBack={onBack} rtl={rtl} topPadding={topPadding} title={tr.title} />
        <View style={styles.errorWrap}>
          <Feather name="wifi-off" size={40} color={Colors.grayMedium} />
          <Text style={[styles.errorText, rtl && styles.textRight]}>{tr.error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{tr.retry}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Loading — show skeleton until both seller and listing are defined ────────
  if (loading || !listing || !seller) {
    return (
      <View style={styles.container}>
        <BackHeader onBack={onBack} rtl={rtl} topPadding={topPadding} title={tr.title} />
        <Skeleton />
      </View>
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────────
  const freshColors   = freshnessColors(listing.freshnessBadge);
  const isSoldOut     = listing.status === "SOLD_OUT";
  const pct           = discountPercent(listing.originalPrice, listing.discountedPrice);
  const pickupWindow  = listing.pickupStart && listing.pickupEnd
    ? `${formatTime(listing.pickupStart)} – ${formatTime(listing.pickupEnd)}`
    : null;
  const displayRating      = listing.rating ?? seller?.rating;
  const displayReviewCount = listing.reviewCount ?? seller?.reviewCount;
  const address            = listing.seller?.location?.address ?? seller?.location?.address;
  const sellerLat          = seller?.location?.latitude  ?? listing.seller?.location?.latitude;
  const sellerLng          = seller?.location?.longitude ?? listing.seller?.location?.longitude;
  // 0,0 is the dummy value sent when a seller typed their address manually — not a real coordinate
  const hasCoords          = sellerLat != null && sellerLng != null && (sellerLat !== 0 || sellerLng !== 0);
  // Always show a real map — fall back to a central Palestine coordinate when the
  // backend hasn't populated seller coordinates yet.
  const PALESTINE_CENTER = { latitude: 31.9524, longitude: 35.2332 };
  const mapCenter = hasCoords
    ? { latitude: sellerLat!, longitude: sellerLng! }
    : PALESTINE_CENTER;

  const REPORT_REASONS: { value: ReportReason; labelAr: string; labelEn: string }[] = [
    { value: "SPOILED_FOOD",          labelAr: "طعام فاسد",         labelEn: "Spoiled food" },
    { value: "WRONG_DESCRIPTION",     labelAr: "وصف خاطئ",          labelEn: "Wrong description" },
    { value: "WRONG_PRICE",           labelAr: "سعر خاطئ",          labelEn: "Wrong price" },
    { value: "INAPPROPRIATE_CONTENT", labelAr: "محتوى غير لائق",    labelEn: "Inappropriate content" },
    { value: "OTHER",                 labelAr: "سبب آخر",           labelEn: "Other" },
  ];

  const handleSubmitReport = async () => {
    if (!reportReason) return;
    setReportSubmitting(true);
    try {
      await reportListing(listingId, reportReason, reportDetails.trim() || undefined);
      setReportDone(true);
      setReportOpen(false);
      Alert.alert(
        rtl ? "شكراً" : "Thank you",
        rtl ? "سيراجع فريقنا البلاغ" : "Our team will review the report"
      );
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      Alert.alert(
        rtl ? "خطأ" : "Error",
        status === 409
          ? (rtl ? "لقد أبلغت عن هذا العرض مسبقاً" : "You already reported this listing")
          : (rtl ? "تعذّر إرسال البلاغ" : "Could not submit report")
      );
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleShare = () => {
    const name = seller?.businessName ?? listing.seller?.businessName ?? "";
    const msg = rtl
      ? `🥡 ${name} — ${listing.title}\n💰 ₪${listing.discountedPrice} بدلاً من ₪${listing.originalPrice}\n\nحجز عبر LeftO 🇵🇸`
      : `🥡 ${name} — ${listing.title}\n💰 ₪${listing.discountedPrice} instead of ₪${listing.originalPrice}\n\nBook via LeftO 🇵🇸`;
    Share.share({ message: msg }).catch(() => {});
  };

  const handleDirections = () => {
    if (!hasCoords) return;
    const url = Platform.OS === "ios"
      ? `maps:0,0?q=${sellerLat},${sellerLng}`
      : Platform.OS === "android"
        ? `geo:${sellerLat},${sellerLng}?q=${sellerLat},${sellerLng}`
        : `https://maps.google.com/?q=${sellerLat},${sellerLng}`;
    Linking.openURL(url).catch(() => {});
  };

  const buildCheckoutParams = (): CheckoutParams => ({
    listingId,
    listingTitle:        listing.title,
    storeName:           seller?.businessName ?? listing.seller?.businessName ?? "",
    pickupStart:         listing.pickupStart,
    pickupEnd:           listing.pickupEnd,
    pickupWindow,
    originalPrice:       listing.originalPrice,
    discountedPrice:     listing.discountedPrice,
    availableQuantity:   listing.quantity,
    estimatedCo2SavedKg: listing.estimatedCo2SavedG != null
      ? listing.estimatedCo2SavedG / 1000
      : undefined,
  });

  return (
    <View style={styles.container}>
      {/* ── Floating back + share + flag buttons (over hero) ── */}
      <View style={[styles.floatingBar, { top: topPadding + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={styles.backBtn} onPress={handleShare} activeOpacity={0.7}>
            <Feather name="share-2" size={18} color={Colors.grayDark} />
          </TouchableOpacity>
          {!reportDone && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setReportOpen(true)} activeOpacity={0.7}>
              <Feather name="flag" size={18} color={Colors.grayMedium} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: botPadding + 152 }]}
      >
        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: freshColors.hero }]}>
          {(!listing.photoUrl || heroImageError) ? (
            <View style={styles.heroIcon}>
              <Feather name="shopping-bag" size={52} color={freshColors.text} />
            </View>
          ) : (
            <Image
              source={{ uri: listing.photoUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              onError={() => setHeroImageError(true)}
            />
          )}

          {/* Type pill */}
          <View style={[styles.typePill, { top: topPadding + 14 }]}>
            <Text style={styles.typePillText}>{typeLabel(listing.type, tr)}</Text>
          </View>

          {/* Freshness badge — most prominent element */}
          <View style={[styles.freshnessBadge, { backgroundColor: freshColors.bg }]}>
            <Text style={[styles.freshnessBadgeText, { color: freshColors.text }]}>
              {freshnessLabel(listing.freshnessBadge, tr)}
            </Text>
          </View>

          {/* Sold out overlay */}
          {isSoldOut && (
            <View style={styles.soldOutOverlay}>
              <View style={styles.soldOutBadge}>
                <Text style={styles.soldOutText}>{tr.soldOut}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Content cards ── */}
        <View style={styles.content}>

          {/* Store name + title */}
          <View style={styles.card}>
            <Text style={[styles.storeName, rtl && styles.textRight]}>
              {seller?.businessName ?? listing.seller?.businessName}
            </Text>
            <Text style={[styles.listingTitle, rtl && styles.textRight]}>
              {listing.title}
            </Text>
          </View>

          {/* Price */}
          <View style={[styles.card, styles.priceCard, rtl && styles.rowReverse]}>
            <View style={[styles.priceLeft, rtl && styles.alignEnd]}>
              <Text style={styles.discountedPrice}>₪{listing.discountedPrice}</Text>
              <Text style={styles.originalPrice}>₪{listing.originalPrice}</Text>
            </View>
            {pct > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{pct}% off</Text>
              </View>
            )}
          </View>

          {/* Pickup + Items left */}
          <View style={styles.card}>
            {pickupWindow && (
              <InfoRow icon="clock" rtl={rtl}>
                <Text style={styles.infoLabel}>{tr.pickupWindow}</Text>
                <Text style={[styles.infoValue, rtl && styles.textRight]}>{pickupWindow}</Text>
              </InfoRow>
            )}
            <InfoRow icon="package" rtl={rtl}>
              <Text style={styles.infoLabel}>{tr.itemsLeft}</Text>
              <Text style={[
                styles.infoValue,
                { color: listing.quantity <= 1 ? "#ef4444" : listing.quantity <= 3 ? Colors.primaryOrange : Colors.grayDark },
              ]}>
                {listing.quantity}
              </Text>
            </InfoRow>
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, rtl && styles.textRight]}>{tr.about}</Text>
            <Text style={[styles.description, rtl && styles.textRight]}>
              {listing.description ?? tr.noDescription}
            </Text>
          </View>

          {/* Allergens */}
          {listing.allergenNote && (
            <View style={[styles.card, styles.allergenCard]}>
              <View style={[styles.row, rtl && styles.rowReverse, { gap: 8 }]}>
                <Feather name="alert-triangle" size={18} color="#f59e0b" />
                <Text style={[styles.sectionTitle, { color: "#92400e" }, rtl && styles.textRight]}>
                  {tr.allergens}
                </Text>
              </View>
              <Text style={[styles.allergenNote, rtl && styles.textRight]}>
                {listing.allergenNote}
              </Text>
            </View>
          )}

          {/* AI Seller Performance Score */}
          {performance && (
            <PublicPerformanceCard perf={performance} rtl={rtl} />
          )}

          {/* Karam — pay-it-forward */}
          {(seller as any)?.participatesInKaram && (
            <KaramCard
              balance={karamBalance}
              loading={karamLoading}
              onSponsor={() => onKaramPress?.({
                sellerId,
                listingId,
                sellerName: seller?.businessName ?? listing.seller?.businessName ?? '',
              })}
              rtl={rtl}
            />
          )}

          {/* Rating */}
          {displayRating != null && (
            <View style={[styles.card, styles.row, rtl && styles.rowReverse, { gap: 12 }]}>
              <View style={[styles.row, { gap: 4 }]}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Feather
                    key={star}
                    name="star"
                    size={18}
                    color={star <= Math.round(displayRating) ? "#f59e0b" : Colors.grayLight}
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>
                {displayRating.toFixed(1)}
                {displayReviewCount != null && (
                  <Text style={styles.reviewCount}>  ({displayReviewCount} {tr.reviews})</Text>
                )}
              </Text>
            </View>
          )}

          {/* Reviews */}
          <View style={styles.card}>
            <View style={[styles.row, rtl && styles.rowReverse, { gap: 8, marginBottom: 4 }]}>
              <Feather name="message-square" size={16} color={Colors.primaryOrange} />
              <Text style={[styles.sectionTitle, rtl && styles.textRight]}>{tr.reviewsTitle}</Text>
            </View>
            {reviewsLoading ? (
              <ActivityIndicator size="small" color={Colors.primaryOrange} style={{ marginVertical: 12 }} />
            ) : reviews.length === 0 ? (
              <Text style={[styles.description, rtl && styles.textRight, { marginTop: 4 }]}>{tr.noReviews}</Text>
            ) : (
              <View style={{ gap: 8, marginTop: 4 }}>
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    anonymousLabel={tr.anonymous}
                    rtl={rtl}
                  />
                ))}
                {hasMore && (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={loadMore}
                    disabled={loadingMore}
                    activeOpacity={0.8}
                  >
                    {loadingMore
                      ? <ActivityIndicator size="small" color={Colors.primaryOrange} />
                      : <Text style={styles.loadMoreText}>{rtl ? "تحميل المزيد" : "Load more"}</Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Location / Map */}
          <View style={styles.card}>
            <View style={[styles.row, rtl && styles.rowReverse, { gap: 8, marginBottom: 10 }]}>
              <Feather name="map-pin" size={16} color={Colors.primaryOrange} />
              <Text style={[styles.sectionTitle, rtl && styles.textRight]}>{tr.location}</Text>
            </View>

            <View style={styles.mapWrapper}>
              <LeafletMap
                latitude={mapCenter.latitude}
                longitude={mapCenter.longitude}
              />
            </View>

            <Text style={[styles.address, rtl && styles.textRight]}>
              {address ?? tr.noAddress}
            </Text>

            {hasCoords && (
              <TouchableOpacity
                style={[styles.directionsBtn, rtl && styles.rowReverse]}
                onPress={handleDirections}
                activeOpacity={0.8}
              >
                <Feather name="map-pin" size={15} color={Colors.primaryOrange} />
                <Text style={styles.directionsBtnText}>
                  {rtl ? "احصل على الاتجاهات" : "Get Directions"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </ScrollView>

      {/* ── Report modal ── */}
      <Modal visible={reportOpen} transparent animationType="slide" onRequestClose={() => setReportOpen(false)}>
        <TouchableOpacity style={reportStyles.overlay} activeOpacity={1} onPress={() => setReportOpen(false)} />
        <View style={reportStyles.sheet}>
          <View style={[reportStyles.header, rtl && styles.rowReverse]}>
            <Text style={[reportStyles.title, rtl && styles.textRight]}>
              {rtl ? "⚠️ الإبلاغ عن هذا العرض" : "⚠️ Report this listing"}
            </Text>
            <TouchableOpacity onPress={() => setReportOpen(false)}>
              <Feather name="x" size={22} color={Colors.grayDark} />
            </TouchableOpacity>
          </View>

          {REPORT_REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[reportStyles.reasonRow, rtl && styles.rowReverse, reportReason === r.value && reportStyles.reasonSelected]}
              onPress={() => setReportReason(r.value)}
              activeOpacity={0.7}
            >
              <Feather
                name={reportReason === r.value ? "check-circle" : "circle"}
                size={18}
                color={reportReason === r.value ? Colors.primaryOrange : Colors.grayMedium}
              />
              <Text style={[reportStyles.reasonLabel, rtl && styles.textRight, reportReason === r.value && { color: Colors.primaryOrange }]}>
                {rtl ? r.labelAr : r.labelEn}
              </Text>
            </TouchableOpacity>
          ))}

          <TextInput
            style={[reportStyles.input, rtl && styles.textRight]}
            placeholder={rtl ? "تفاصيل إضافية (اختياري)..." : "Additional details (optional)..."}
            placeholderTextColor={Colors.grayMedium}
            value={reportDetails}
            onChangeText={setReportDetails}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={[reportStyles.footerRow, rtl && styles.rowReverse]}>
            <TouchableOpacity style={reportStyles.cancelBtn} onPress={() => setReportOpen(false)} activeOpacity={0.8}>
              <Text style={reportStyles.cancelBtnText}>{rtl ? "إلغاء" : "Cancel"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[reportStyles.submitBtn, (!reportReason || reportSubmitting) && { opacity: 0.5 }]}
              onPress={handleSubmitReport}
              disabled={!reportReason || reportSubmitting}
              activeOpacity={0.85}
            >
              {reportSubmitting
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={reportStyles.submitBtnText}>{rtl ? "إرسال البلاغ" : "Submit report"}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Sticky CTA buttons ── */}
      <View style={[styles.ctaBar, { paddingBottom: botPadding + 12 }]}>
        {isSoldOut ? (
          <View style={styles.soldOutCta}>
            <Text style={styles.soldOutCtaText}>{tr.soldOut}</Text>
          </View>
        ) : (
          <View style={styles.ctaStack}>
            <TouchableOpacity
              style={styles.reserveBtn}
              activeOpacity={0.85}
              onPress={() => onCheckout(buildCheckoutParams())}
            >
              <Feather name="check-circle" size={19} color={Colors.white} />
              <Text style={styles.reserveBtnText}>{tr.reserve}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.donateBtn}
              activeOpacity={0.85}
              onPress={() => onCheckout(buildCheckoutParams())}
            >
              <Feather name="gift" size={17} color={Colors.greenMain} />
              <Text style={styles.donateBtnText}>{tr.donate}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BackHeader({
  onBack, rtl, topPadding, title,
}: { onBack: () => void; rtl: boolean; topPadding: number; title: string }) {
  return (
    <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
        <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function InfoRow({
  icon, rtl, children,
}: { icon: string; rtl: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.infoRow, rtl && styles.rowReverse]}>
      <View style={styles.infoIconWrap}>
        <Feather name={icon as "clock"} size={16} color={Colors.primaryOrange} />
      </View>
      <View style={[styles.infoBody, rtl && styles.alignEnd]}>{children}</View>
    </View>
  );
}

// ─── Public Performance Card ──────────────────────────────────────────────────

function PublicPerformanceCard({ perf, rtl }: { perf: Omit<PerformanceResult, 'stats'>; rtl: boolean }) {
  const score = perf.performanceScore;
  const barColor = score >= 70 ? Colors.greenMain : score >= 40 ? Colors.primaryOrange : "#EF4444";
  const label = score >= 70
    ? (rtl ? "ممتاز" : "Excellent")
    : score >= 40 ? (rtl ? "جيد" : "Good") : (rtl ? "ضعيف" : "Weak");

  const insightParts = perf.weeklyInsight
    ? perf.weeklyInsight.split("|").map(s => s.trim())
    : [];

  return (
    <View style={pubPerfStyles.card}>
      <View style={[pubPerfStyles.row, rtl && { flexDirection: "row-reverse" }]}>
        <Text style={[pubPerfStyles.title, rtl && { textAlign: "right" }]}>
          {rtl ? "أداء البائع" : "Seller Performance"}
        </Text>
        <Text style={[pubPerfStyles.score, { color: barColor }]}>{score}/100 · {label}</Text>
      </View>
      <View style={pubPerfStyles.barBg}>
        <View style={[pubPerfStyles.barFill, { width: `${score}%` as any, backgroundColor: barColor }]} />
      </View>
      {insightParts.map((part, i) => (
        <View key={i} style={[pubPerfStyles.insightRow, { backgroundColor: part.startsWith("💪") ? "#D1FAE5" : "#FFE8D6" }]}>
          <Text style={[pubPerfStyles.insightText, rtl && { textAlign: "right" }]}>{part}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Karam Card ───────────────────────────────────────────────────────────────

interface KaramCardProps {
  balance:   { sponsored: number; claimed: number; available: number } | null;
  loading:   boolean;
  onSponsor: () => void;
  rtl:       boolean;
}

function KaramCard({ balance, loading, onSponsor, rtl }: KaramCardProps) {
  return (
    <View style={karamStyles.card}>
      <View style={[karamStyles.headerRow, rtl && { flexDirection: "row-reverse" }]}>
        <Text style={karamStyles.icon}>🤝</Text>
        <View style={[karamStyles.headerText, rtl && { alignItems: "flex-end" }]}>
          <Text style={[karamStyles.title, rtl && { textAlign: "right" }]}>
            {rtl ? "كرم — تبرع لمن يحتاج" : "Karam — Pay it forward"}
          </Text>
          <Text style={[karamStyles.subtitle, rtl && { textAlign: "right" }]}>
            {rtl ? "ادعم وجبة مجانية لشخص محتاج" : "Sponsor a free meal for someone in need"}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={Colors.greenMain} style={{ marginVertical: 8 }} />
      ) : balance ? (
        <View style={[karamStyles.statsRow, rtl && { flexDirection: "row-reverse" }]}>
          <View style={karamStyles.statItem}>
            <Text style={karamStyles.statValue}>{balance.available}</Text>
            <Text style={[karamStyles.statLabel, rtl && { textAlign: "right" }]}>
              {rtl ? "متاحة" : "Available"}
            </Text>
          </View>
          <View style={karamStyles.statDivider} />
          <View style={karamStyles.statItem}>
            <Text style={[karamStyles.statValue, { color: Colors.grayMedium }]}>{balance.sponsored}</Text>
            <Text style={[karamStyles.statLabel, rtl && { textAlign: "right" }]}>
              {rtl ? "ممولة" : "Funded"}
            </Text>
          </View>
          <View style={karamStyles.statDivider} />
          <View style={karamStyles.statItem}>
            <Text style={[karamStyles.statValue, { color: Colors.grayMedium }]}>{balance.claimed}</Text>
            <Text style={[karamStyles.statLabel, rtl && { textAlign: "right" }]}>
              {rtl ? "مُستلمة" : "Claimed"}
            </Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={karamStyles.btn}
        onPress={onSponsor}
        activeOpacity={0.85}
      >
        <Text style={karamStyles.btnText}>
          {rtl ? "تبرع بوجبة 💚" : "Sponsor a meal 💚"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const karamStyles = StyleSheet.create({
  card: {
    backgroundColor: "#D1FAE5",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.greenMain,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  icon: { fontSize: 28, lineHeight: 34 },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "800", color: Colors.greenMain },
  subtitle: { fontSize: 12, color: "#166534", lineHeight: 16 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    paddingVertical: 10,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontWeight: "800", color: Colors.greenMain },
  statLabel: { fontSize: 11, color: "#166534", fontWeight: "600" },
  statDivider: { width: 1, backgroundColor: "#86EFAC" },
  btn: {
    backgroundColor: Colors.greenMain,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnText: { fontSize: 15, fontWeight: "800", color: Colors.white },
});

const reportStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, gap: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 17, fontWeight: "800", color: Colors.grayDark, flex: 1 },
  reasonRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 11, borderRadius: 12, paddingHorizontal: 4,
  },
  reasonSelected: { backgroundColor: Colors.orangeLight, paddingHorizontal: 10 },
  reasonLabel: { fontSize: 14, color: Colors.grayDark },
  input: {
    backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: 14, color: Colors.grayDark, minHeight: 72,
  },
  footerRow: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "700", color: Colors.grayMedium },
  submitBtn: {
    flex: 2, borderRadius: 14, paddingVertical: 13,
    backgroundColor: Colors.primaryOrange, alignItems: "center",
  },
  submitBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },
});

const pubPerfStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: 16,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  score: { fontSize: 13, fontWeight: "800" },
  barBg: { height: 7, backgroundColor: Colors.grayLight, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  insightRow: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  insightText: { fontSize: 12, color: Colors.grayDark },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  textRight:   { textAlign: "right" },
  row:         { flexDirection: "row", alignItems: "center" },
  rowReverse:  { flexDirection: "row-reverse" },
  alignEnd:    { alignItems: "flex-end" },

  // Header (used for loading/error states only)
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.grayDark },

  // Floating back+share bar over hero
  floatingBar: {
    position: "absolute",
    left: Spacing.xl,
    right: Spacing.xl,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: Colors.grayLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  scroll: { gap: 0 },

  // Hero
  hero: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  heroIcon: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center", justifyContent: "center",
  },
  typePill: {
    position: "absolute",
    right: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  typePillText: { fontSize: 12, fontWeight: "700", color: Colors.white },

  freshnessBadge: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  freshnessBadgeText: { fontSize: 18, fontWeight: "800", letterSpacing: 0.3 },

  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  soldOutBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  soldOutText: { fontSize: 16, fontWeight: "800", color: Colors.white },

  // Content
  content: { padding: Spacing.md, gap: Spacing.sm },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 6,
  },

  storeName: { fontSize: 14, fontWeight: "700", color: Colors.primaryOrange },
  listingTitle: { fontSize: 22, fontWeight: "800", color: Colors.grayDark, lineHeight: 28 },

  // Price card
  priceCard:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  priceLeft:  { gap: 2 },
  discountedPrice: { fontSize: 32, fontWeight: "800", color: Colors.primaryOrange },
  originalPrice: {
    fontSize: 16, color: Colors.grayMedium,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: Colors.greenLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discountBadgeText: { fontSize: 14, fontWeight: "700", color: Colors.greenMain },

  // Info rows
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  infoBody: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 12, color: Colors.grayMedium, fontWeight: "500" },
  infoValue: { fontSize: 15, fontWeight: "700", color: Colors.grayDark },

  // Description
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.grayDark },
  description: { fontSize: 14, color: Colors.grayMedium, lineHeight: 22 },

  // Allergens
  allergenCard: { backgroundColor: "#fffbeb", gap: 8 },
  allergenNote: { fontSize: 14, color: "#92400e", lineHeight: 20 },

  // Rating
  ratingText: { fontSize: 16, fontWeight: "700", color: Colors.grayDark },
  reviewCount: { fontSize: 13, fontWeight: "400", color: Colors.grayMedium },

  // Map — wrapper clips borderRadius on Android (MapView ignores overflow)
  mapWrapper: {
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 6,
  },
  map: {
    flex: 1,
  },
  address: { fontSize: 13, color: Colors.grayMedium, lineHeight: 18 },

  directionsBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1.5, borderColor: Colors.primaryOrange,
    borderRadius: 12, paddingHorizontal: Spacing.md, paddingVertical: 10,
    marginTop: 8, alignSelf: "flex-start",
  },
  directionsBtnText: { fontSize: 14, fontWeight: "700", color: Colors.primaryOrange },

  // Error
  errorWrap: {
    flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: Spacing.xl,
  },
  errorText: { fontSize: 14, color: Colors.grayMedium, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  retryBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },

  // CTA bar
  ctaBar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaStack: { gap: Spacing.sm },
  reserveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 16,
    paddingVertical: 15,
  },
  reserveBtnText: { fontSize: 16, fontWeight: "800", color: Colors.white },
  donateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 13,
    borderWidth: 2,
    borderColor: Colors.greenMain,
  },
  donateBtnText: { fontSize: 15, fontWeight: "700", color: Colors.greenMain },
  soldOutCta: {
    backgroundColor: Colors.grayLight,
    borderRadius: 16, paddingVertical: 14,
    alignItems: "center",
  },
  soldOutCtaText: { fontSize: 16, fontWeight: "700", color: Colors.grayMedium },

  loadMoreBtn: {
    alignItems: "center", paddingVertical: 10,
    borderWidth: 1.5, borderColor: Colors.primaryOrange,
    borderRadius: 12, marginTop: 4,
  },
  loadMoreText: { fontSize: 14, fontWeight: "700", color: Colors.primaryOrange },
});
