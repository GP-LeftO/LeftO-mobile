import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import type { Translations } from "../../../i18n";
import type { ProfileOrder, ReviewPayload } from "../../../types/profile";

interface OrderCardProps {
  order: ProfileOrder;
  reviewed: boolean;
  onSubmitReview: (payload: ReviewPayload) => Promise<void>;
  rtl: boolean;
  tr: Translations["profile"];
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: Colors.greenLight, text: Colors.greenDark },
  RESERVED:  { bg: Colors.orangeLight, text: Colors.orangeDark },
  CANCELLED: { bg: "#FEE2E2", text: "#B91C1C" },
};

interface Ratings {
  overall: number;
  pickup: number;
  quality: number;
  variety: number;
}

const EMPTY_RATINGS: Ratings = { overall: 0, pickup: 0, quality: 0, variety: 0 };

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
          <Feather
            name="star"
            size={26}
            color={star <= value ? Colors.primaryOrange : Colors.grayLight}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
});

export default function OrderCard({
  order,
  reviewed,
  onSubmitReview,
  rtl,
  tr,
}: OrderCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [ratings, setRatings] = useState<Ratings>(EMPTY_RATINGS);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const sellerId = order.listing?.seller?.id ?? "";
  const sellerName = order.listing?.seller?.businessName ?? "—";
  const listingTitle = order.listing?.title ?? "—";
  const dateStr = new Date(order.createdAt).toLocaleDateString(
    rtl ? "ar-PS" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" }
  );

  const statusStyle = STATUS_STYLE[order.status] ?? STATUS_STYLE.RESERVED;
  const statusLabel = (tr.status as Record<string, string>)[order.status] ?? order.status;

  const canSubmit =
    ratings.overall > 0 &&
    ratings.pickup > 0 &&
    ratings.quality > 0 &&
    ratings.variety > 0;

  const openModal = () => {
    setRatings(EMPTY_RATINGS);
    setComment("");
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const handleSubmit = async () => {
    if (!canSubmit || !sellerId) return;
    setSubmitting(true);
    try {
      await onSubmitReview({
        orderId: order.id,
        sellerId,
        ratingOverall: ratings.overall,
        ratingPickup: ratings.pickup,
        ratingQuality: ratings.quality,
        ratingVariety: ratings.variety,
        comment: comment.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
      setModalVisible(false);
    }
  };

  return (
    <>
      <View style={[styles.card, rtl && styles.cardRTL]}>
        {/* Top row: seller + status chip */}
        <View style={[styles.row, rtl && styles.rowRTL]}>
          <Text style={[styles.sellerName, rtl && styles.rtl]} numberOfLines={1}>
            {sellerName}
          </Text>
          <View style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Listing title */}
        <Text style={[styles.listingTitle, rtl && styles.rtl]} numberOfLines={2}>
          {listingTitle}
        </Text>

        {/* Bottom row: date + price + review button */}
        <View style={[styles.footer, rtl && styles.footerRTL]}>
          <View style={[styles.metaRow, rtl && styles.rowRTL]}>
            <Feather name="calendar" size={12} color={Colors.grayMedium} />
            <Text style={styles.metaText}>{dateStr}</Text>
            <Text style={styles.metaSep}>·</Text>
            <Text style={styles.price}>₪{order.totalPrice.toFixed(2)}</Text>
          </View>

          {!reviewed && order.status === "COMPLETED" && !!sellerId && (
            <TouchableOpacity style={styles.reviewBtn} onPress={openModal} activeOpacity={0.8}>
              <Feather name="star" size={13} color={Colors.white} />
              <Text style={styles.reviewBtnText}>{tr.leaveReview}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Review Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeModal} activeOpacity={1} />
          <View style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.sheetHandle} />

            <View style={[styles.sheetHeader, rtl && styles.rowRTL]}>
              <Text style={[styles.sheetTitle, rtl && styles.rtl]}>{tr.review.title}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Feather name="x" size={20} color={Colors.grayDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(
                [
                  { key: "overall", label: tr.review.ratingOverall },
                  { key: "pickup",  label: tr.review.ratingPickup },
                  { key: "quality", label: tr.review.ratingQuality },
                  { key: "variety", label: tr.review.ratingVariety },
                ] as const
              ).map(({ key, label }) => (
                <View key={key} style={[styles.ratingRow, rtl && styles.rowRTL]}>
                  <Text style={[styles.ratingLabel, rtl && styles.rtl]}>{label}</Text>
                  <StarRating
                    value={ratings[key]}
                    onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
                  />
                </View>
              ))}

              <TextInput
                style={[styles.commentInput, rtl && styles.rtl]}
                placeholder={tr.review.commentPlaceholder}
                placeholderTextColor={Colors.grayMedium}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit || submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {submitting ? tr.review.submitting : tr.review.submit}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    borderRadius: 16,
    padding: Spacing.md,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRTL: {},
  rtl: { textAlign: "right" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowRTL: { flexDirection: "row-reverse" },
  sellerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.grayDark,
    marginRight: Spacing.sm,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  listingTitle: {
    fontSize: 13,
    color: Colors.grayMedium,
    lineHeight: 18,
  },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footerRTL: { flexDirection: "row-reverse" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: Colors.grayMedium },
  metaSep: { fontSize: 12, color: Colors.grayMedium },
  price: { fontSize: 13, fontWeight: "700", color: Colors.grayDark },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.primaryOrange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reviewBtnText: { fontSize: 12, fontWeight: "700", color: Colors.white },

  // Modal styles
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.sm,
    maxHeight: "85%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.grayLight,
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  ratingLabel: { fontSize: 15, fontWeight: "500", color: Colors.grayDark },
  commentInput: {
    backgroundColor: Colors.grayLight,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.grayDark,
    minHeight: 80,
    marginBottom: Spacing.lg,
  },
  submitBtn: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },
});
