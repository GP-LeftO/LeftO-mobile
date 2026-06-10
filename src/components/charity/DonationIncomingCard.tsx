import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import type { Donation, RatingInput } from "../../services/charity/charity.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardTab = "incoming" | "pickedUp" | "completed";

interface Props {
  donation: Donation;
  tab: CardTab;
  isRated?: boolean;
  onMarkPickedUp?: (id: string) => void;
  onOpenProofModal?: (id: string) => void;
  onRateSeller?: (donationId: string, ratings: RatingInput) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPickupWindow(start?: string, end?: string): string | null {
  if (!start) return null;
  try {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    const locale = isRTL() ? "ar-SA" : "en-GB";
    const timeOpts: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    const today = new Date();
    const isToday = startDate.toDateString() === today.toDateString();
    const prefix = isToday
      ? isRTL()
        ? "اليوم، "
        : "Today, "
      : startDate.toLocaleDateString(locale, { weekday: "short", day: "numeric" }) + "، ";
    const startStr = startDate.toLocaleTimeString(locale, timeOpts);
    const endStr = endDate
      ? ` – ${endDate.toLocaleTimeString(locale, timeOpts)}`
      : "";
    return `${prefix}${startStr}${endStr}`;
  } catch {
    return null;
  }
}

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(isRTL() ? "ar-PS" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

// ─── Star Row ─────────────────────────────────────────────────────────────────

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const rtl = isRTL();
  return (
    <View style={[starStyles.row, { flexDirection: rtl ? "row-reverse" : "row" }]}>
      <Text style={[starStyles.label, { textAlign: rtl ? "right" : "left" }]}>
        {label}
      </Text>
      <View style={[starStyles.stars, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
            <Feather
              name={star <= value ? "star" : "star"}
              size={20}
              color={star <= value ? "#F59E0B" : Colors.grayLight}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  label: { fontSize: 13, color: Colors.grayDark, flex: 1 },
  stars: { gap: 4 },
});

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:   { label: "قادم",        bg: "#FFF7ED", color: Colors.primaryOrange },
  PICKED_UP: { label: "مستلم",       bg: "#EFF6FF", color: "#3B82F6" },
  CONFIRMED: { label: "مكتمل ✓",    bg: Colors.greenLight, color: Colors.greenMain },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DonationIncomingCard({
  donation,
  tab,
  isRated = false,
  onMarkPickedUp,
  onOpenProofModal,
  onRateSeller,
}: Props) {
  const rtl = isRTL();

  const [ratings, setRatings] = useState({ overall: 0, pickup: 0, quality: 0 });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const sellerName =
    donation.seller?.businessName ??
    donation.listing?.seller?.businessName ??
    (rtl ? "بائع" : "Seller");
  const listingTitle = donation.listing?.title ?? (rtl ? "تبرع بطعام" : "Food Donation");
  const pickupWindow = formatPickupWindow(
    donation.pickupStart ?? donation.listing?.pickupStart,
    donation.pickupEnd ?? donation.listing?.pickupEnd
  );
  const createdDate = formatDate(donation.createdAt);
  const badge = STATUS_BADGE[donation.status] ?? STATUS_BADGE.PENDING;

  const handleSubmitRating = async () => {
    if (ratings.overall === 0 || ratings.pickup === 0 || ratings.quality === 0) {
      setRatingError(rtl ? "يرجى تقييم جميع الخانات" : "Please rate all fields");
      return;
    }
    setSubmitting(true);
    setRatingError(null);
    try {
      await onRateSeller?.(donation.id, {
        ratingOverall: ratings.overall,
        ratingPickup: ratings.pickup,
        ratingQuality: ratings.quality,
        ratingVariety: ratings.overall,
        comment: comment.trim() || undefined,
      });
    } catch {
      setRatingError(rtl ? "تعذّر إرسال التقييم. يرجى المحاولة مجدداً." : "Could not submit rating.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Badge */}
      <View style={[styles.badgeRow, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Seller name + title */}
      <Text style={[styles.sellerName, { textAlign: rtl ? "right" : "left" }]}>
        {sellerName}
      </Text>
      <Text style={[styles.listingTitle, { textAlign: rtl ? "right" : "left" }]}>
        {listingTitle}
      </Text>

      {/* Meta row */}
      <View style={styles.meta}>
        <View style={[styles.metaItem, { flexDirection: rtl ? "row-reverse" : "row" }]}>
          <Text style={styles.metaEmoji}>📦</Text>
          <Text style={[styles.metaText, { textAlign: rtl ? "right" : "left" }]}>
            {rtl ? `الكمية: ${donation.quantity}` : `Qty: ${donation.quantity}`}
          </Text>
        </View>

        {pickupWindow && (
          <View style={[styles.metaItem, { flexDirection: rtl ? "row-reverse" : "row" }]}>
            <Text style={styles.metaEmoji}>⏰</Text>
            <Text style={[styles.metaText, { textAlign: rtl ? "right" : "left" }]}>
              {rtl ? `وقت الاستلام: ${pickupWindow}` : `Pickup: ${pickupWindow}`}
            </Text>
          </View>
        )}

        {createdDate && (
          <View style={[styles.metaItem, { flexDirection: rtl ? "row-reverse" : "row" }]}>
            <Text style={styles.metaEmoji}>📅</Text>
            <Text style={[styles.metaText, { textAlign: rtl ? "right" : "left" }]}>
              {rtl ? `تاريخ التبرع: ${createdDate}` : `Date: ${createdDate}`}
            </Text>
          </View>
        )}
      </View>

      {/* Proof photo thumbnail */}
      {donation.proofPhoto && (
        <Image
          source={{ uri: donation.proofPhoto }}
          style={styles.proofThumb}
          resizeMode="cover"
        />
      )}

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── CTA ── */}
      {tab === "incoming" && (
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: Colors.primaryOrange }]}
          onPress={() => onMarkPickedUp?.(donation.id)}
          activeOpacity={0.85}
        >
          <Feather name="check" size={15} color={Colors.white} />
          <Text style={styles.ctaBtnText}>{rtl ? "تم الاستلام" : "Mark Picked Up"}</Text>
        </TouchableOpacity>
      )}

      {tab === "pickedUp" && (
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: Colors.greenMain }]}
          onPress={() => onOpenProofModal?.(donation.id)}
          activeOpacity={0.85}
        >
          <Feather name="upload" size={15} color={Colors.white} />
          <Text style={styles.ctaBtnText}>
            {rtl ? "رفع إثبات التوزيع" : "Upload Proof"}
          </Text>
        </TouchableOpacity>
      )}

      {tab === "completed" && (
        isRated ? (
          <View style={[styles.ratedRow, { flexDirection: rtl ? "row-reverse" : "row" }]}>
            <Feather name="check-circle" size={15} color={Colors.greenMain} />
            <Text style={[styles.ratedText, { textAlign: rtl ? "right" : "left" }]}>
              {rtl ? "تم التقييم ✓" : "Reviewed ✓"}
            </Text>
          </View>
        ) : (
          <View style={styles.ratingSection}>
            <Text style={[styles.ratingTitle, { textAlign: rtl ? "right" : "left" }]}>
              {rtl ? "قيّم البائع" : "Rate Seller"}
            </Text>

            <StarRow
              label={rtl ? "التقييم العام" : "Overall"}
              value={ratings.overall}
              onChange={(v) => setRatings((r) => ({ ...r, overall: v }))}
            />
            <StarRow
              label={rtl ? "جودة الطعام" : "Food Quality"}
              value={ratings.quality}
              onChange={(v) => setRatings((r) => ({ ...r, quality: v }))}
            />
            <StarRow
              label={rtl ? "الاستلام" : "Pickup"}
              value={ratings.pickup}
              onChange={(v) => setRatings((r) => ({ ...r, pickup: v }))}
            />

            <TextInput
              style={[styles.commentInput, { textAlign: rtl ? "right" : "left" }]}
              placeholder={rtl ? "أضف تعليقاً..." : "Add a comment..."}
              placeholderTextColor={Colors.grayMedium}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={2}
            />

            {ratingError && (
              <Text style={styles.ratingError}>{ratingError}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.ctaBtn,
                { backgroundColor: Colors.greenMain },
                submitting && { opacity: 0.7 },
              ]}
              onPress={handleSubmitRating}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Feather name="send" size={14} color={Colors.white} />
                  <Text style={styles.ctaBtnText}>
                    {rtl ? "إرسال التقييم" : "Submit Rating"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: Spacing.md,
    marginBottom: 12,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeRow: { marginBottom: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  badgeText: { fontSize: 12, fontWeight: "700" },

  sellerName: { fontSize: 16, fontWeight: "800", color: Colors.grayDark, marginBottom: 2 },
  listingTitle: { fontSize: 14, color: Colors.grayMedium, marginBottom: Spacing.sm },

  meta: { gap: 6, marginBottom: Spacing.sm },
  metaItem: { alignItems: "center", gap: 6 },
  metaEmoji: { fontSize: 13 },
  metaText: { fontSize: 13, color: Colors.grayDark, flex: 1 },

  proofThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.grayLight,
  },

  divider: { height: 1, backgroundColor: Colors.grayLight, marginBottom: Spacing.sm },

  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 11,
  },
  ctaBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  ratedRow: { alignItems: "center", gap: 6 },
  ratedText: { fontSize: 14, color: Colors.greenMain, fontWeight: "600" },

  ratingSection: { gap: 4 },
  ratingTitle: { fontSize: 15, fontWeight: "800", color: Colors.grayDark, marginBottom: 8 },
  commentInput: {
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.grayDark,
    marginBottom: 8,
    minHeight: 48,
  },
  ratingError: { fontSize: 12, color: "#EF4444", marginBottom: 6 },
});
