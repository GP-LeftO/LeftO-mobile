import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NearMeListing } from '../../../types/nearMe';
import type { StoreDetailsParams } from '../../../types';

const ORANGE = '#FF6B35';
const DARK_CARD = '#1E2A3A';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_WIDTH = SCREEN_WIDTH * 0.72;

interface StoreCardResultProps {
  listing: NearMeListing;
  onPress: (params: StoreDetailsParams) => void;
}

function formatPickupTime(iso: string): string {
  try {
    const d = new Date(iso);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '—';
  }
}

function formatDistance(km?: number): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} م`;
  return `${km.toFixed(1)} كم`;
}

function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    MEALS: 'وجبات',
    BREAD_AND_PASTRIES: 'مخبوزات',
    GROCERIES: 'بقالة',
    MIXED: 'متنوع',
  };
  return map[category] ?? category;
}

export default function StoreCardResult({ listing, onPress }: StoreCardResultProps) {
  const isSoldOut = listing.status === 'SOLD_OUT';
  const discount = Math.round(((listing.originalPrice - listing.discountedPrice) / listing.originalPrice) * 100);

  const handlePress = () => {
    onPress({ listingId: listing.id, sellerId: listing.sellerId });
  };

  return (
    <TouchableOpacity
      style={[styles.card, isSoldOut && styles.cardSoldOut]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {/* Orange accent left border */}
      <View style={styles.accentBorder} />

      {/* Content */}
      <View style={styles.content}>
        {/* Top row: store name + distance */}
        <View style={styles.topRow}>
          <View style={styles.nameBadgeRow}>
            <Text style={styles.storeName} numberOfLines={1}>
              {listing.seller.businessName}
            </Text>
            {listing.seller.verifiedBadge && (
              <Feather name="check-circle" size={13} color={ORANGE} style={styles.verifiedIcon} />
            )}
          </View>
          {listing.distanceKm != null && (
            <View style={styles.distanceBadge}>
              <Feather name="map-pin" size={10} color={ORANGE} />
              <Text style={styles.distanceText}>{formatDistance(listing.distanceKm)}</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{listing.title}</Text>

        {/* Badges row */}
        <View style={styles.badgesRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{getCategoryLabel(listing.category)}</Text>
          </View>
          <View style={[styles.discountBadge, isSoldOut && styles.discountBadgeSoldOut]}>
            <Text style={styles.discountText}>
              {isSoldOut ? 'نفدت الكمية' : `خصم ${discount}%`}
            </Text>
          </View>
        </View>

        {/* Price + pickup + quantity */}
        <View style={styles.bottomRow}>
          <View style={styles.priceWrap}>
            <Text style={styles.discountedPrice}>
              ₪{listing.discountedPrice.toFixed(0)}
            </Text>
            <Text style={styles.originalPrice}>
              ₪{listing.originalPrice.toFixed(0)}
            </Text>
          </View>

          <View style={styles.metaRight}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={11} color="rgba(255,255,255,0.5)" />
              <Text style={styles.metaText}>
                {formatPickupTime(listing.pickupStart)}–{formatPickupTime(listing.pickupEnd)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="package" size={11} color="rgba(255,255,255,0.5)" />
              <Text style={styles.metaText}>{listing.quantity} متبق</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sold-out overlay */}
      {isSoldOut && (
        <View style={styles.soldOutOverlay}>
          <Text style={styles.soldOutText}>نفدت الكمية</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: DARK_CARD,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardSoldOut: {
    opacity: 0.7,
  },
  accentBorder: {
    width: 4,
    backgroundColor: ORANGE,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
    textAlign: 'right',
  },
  verifiedIcon: {
    marginTop: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: ORANGE,
  },
  title: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
    textAlign: 'right',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  discountBadge: {
    backgroundColor: 'rgba(255,107,53,0.2)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountBadgeSoldOut: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  discountText: {
    fontSize: 11,
    color: ORANGE,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: ORANGE,
  },
  originalPrice: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textDecorationLine: 'line-through',
  },
  metaRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },

  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  soldOutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
