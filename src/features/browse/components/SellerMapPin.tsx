import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { Colors } from "../../../theme";
import type { MapSeller, SellerCategory } from "../types/browse.types";

const CATEGORY_EMOJI: Record<SellerCategory, string> = {
  MEALS: "🍽️",
  BREAD_AND_PASTRIES: "🥐",
  GROCERIES: "🛒",
  MIXED: "🎁",
};

interface SellerMapPinProps {
  seller: MapSeller;
  selected: boolean;
  onPress: (seller: MapSeller) => void;
}

export function SellerMapPin({ seller, selected, onPress }: SellerMapPinProps) {
  const soldOut = seller.listing.itemsLeft === 0;

  return (
    <Marker
      coordinate={{ latitude: seller.lat, longitude: seller.lng }}
      onPress={() => onPress(seller)}
      // Disabling view tracking prevents unnecessary re-renders on the native side
      tracksViewChanges={false}
      // Anchor at bottom-center so the pointer tip sits on the coordinate
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.wrapper}>
        <View
          style={[
            styles.bubble,
            selected && styles.bubbleSelected,
            soldOut && styles.bubbleSoldOut,
          ]}
        >
          <Text style={styles.emoji}>{CATEGORY_EMOJI[seller.category]}</Text>
        </View>
        {/* Downward-pointing triangle */}
        <View
          style={[
            styles.tip,
            selected && styles.tipSelected,
            soldOut && styles.tipSoldOut,
          ]}
        />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  bubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    borderWidth: 2.5,
    borderColor: Colors.primaryOrange,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
  },
  bubbleSelected: {
    backgroundColor: Colors.primaryOrange,
    borderColor: Colors.orangeDark,
    // Slightly enlarge the selected pin
    transform: [{ scale: 1.15 }],
  },
  bubbleSoldOut: {
    backgroundColor: Colors.grayLight,
    borderColor: Colors.grayMedium,
    opacity: 0.7,
  },
  emoji: {
    fontSize: 19,
  },
  tip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.primaryOrange,
    marginTop: -1,
  },
  tipSelected: {
    borderTopColor: Colors.orangeDark,
  },
  tipSoldOut: {
    borderTopColor: Colors.grayMedium,
  },
});
