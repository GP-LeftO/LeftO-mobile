import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import type { SellerReview } from "../../../types/profile";

interface ReviewCardProps {
  review: SellerReview;
  anonymousLabel: string;
  rtl: boolean;
}

function buyerInitials(buyer: SellerReview["buyer"]): string {
  if (!buyer) return "?";
  if (buyer.firstName && buyer.lastName) {
    return `${buyer.firstName[0]}${buyer.lastName[0]}`.toUpperCase();
  }
  if (buyer.name) {
    const parts = buyer.name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  }
  return "?";
}

function buyerDisplayName(buyer: SellerReview["buyer"], fallback: string): string {
  if (!buyer) return fallback;
  if (buyer.firstName) return buyer.firstName;
  if (buyer.name) return buyer.name.split(" ")[0];
  return fallback;
}

export default function ReviewCard({ review, anonymousLabel, rtl }: ReviewCardProps) {
  const initials = buyerInitials(review.buyer);
  const name = buyerDisplayName(review.buyer, anonymousLabel);
  const dateStr = new Date(review.createdAt).toLocaleDateString(
    rtl ? "ar-PS" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" }
  );

  return (
    <View style={[styles.card, rtl && styles.cardRTL]}>
      <View style={[styles.header, rtl && styles.rowReverse]}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Name + date */}
        <View style={[styles.meta, rtl && styles.alignEnd]}>
          <Text style={[styles.name, rtl && styles.textRight]}>{name}</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        {/* Stars */}
        <View style={[styles.stars, rtl && styles.rowReverse]}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Feather
              key={star}
              name="star"
              size={13}
              color={star <= Math.round(review.ratingOverall) ? "#f59e0b" : Colors.grayLight}
            />
          ))}
        </View>
      </View>

      {!!review.comment && (
        <Text style={[styles.comment, rtl && styles.textRight]}>{review.comment}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardRTL: {},
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowReverse: { flexDirection: "row-reverse" },
  textRight: { textAlign: "right" },
  alignEnd: { alignItems: "flex-end" },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "700", color: Colors.white },

  meta: { flex: 1, gap: 2 },
  name: { fontSize: 13, fontWeight: "700", color: Colors.grayDark },
  date: { fontSize: 11, color: Colors.grayMedium },

  stars: { flexDirection: "row", gap: 2 },

  comment: { fontSize: 13, color: Colors.grayMedium, lineHeight: 19 },
});
