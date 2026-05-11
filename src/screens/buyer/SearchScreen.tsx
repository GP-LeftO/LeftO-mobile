/**
 * SearchScreen
 *
 * Buyer search / browse screen. Reached by tapping the search bar on HomeScreen.
 *
 * Layout (top → bottom):
 *   • Sticky header: back button + live TextInput search bar + X clear button
 *   • Scrollable results area:
 *       - Initial state  → "Start searching" prompt
 *       - Loading state  → 4 skeleton placeholder cards
 *       - Results        → vertical list of ListingCards (tap → StoreDetails)
 *       - Empty state    → no results message + clear button
 *       - Error state    → error message + retry button
 *
 * RTL: search icon/X flip, text alignment follows isRTL().
 */

import React, { useRef, useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { t, isRTL } from "../../i18n";
import { useSearch } from "../../hooks/useSearch";
import ListingCard, { SkeletonCard } from "../../components/buyer/ListingCard";
import type { Listing, StoreDetailsParams } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchScreenProps {
  onBack:          () => void;
  onListingPress?: (params: StoreDetailsParams) => void;
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <View style={skeletonStyles.wrap}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={skeletonStyles.row}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.sm },
  row:  { flexDirection: "row", gap: Spacing.sm },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchScreen({ onBack, onListingPress }: SearchScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const botPadding = Platform.OS === "web" ? 24 : insets.bottom;
  const rtl        = isRTL();
  const tr         = t().search;

  const inputRef             = useRef<TextInput>(null);
  const [query, setQuery]    = useState("");
  const { listings, isLoading, error, refetch } = useSearch(query);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const isEmpty = query.trim().length > 0 && !isLoading && listings.length === 0 && !error;
  const isInitial = query.trim().length === 0;

  const renderCard = ({ item }: { item: Listing }) => (
    <View style={styles.cardWrapper}>
      <ListingCard
        listing={item}
        rtl={rtl}
        onPress={(params) => onListingPress?.(params)}
        userAllergyPreferences={[]}
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>

      {/* ── Sticky Header: back + search input ── */}
      <View style={[styles.header, rtl && styles.rowReverse]}>

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather
            name={rtl ? "arrow-right" : "arrow-left"}
            size={20}
            color={Colors.grayDark}
          />
        </TouchableOpacity>

        {/* Search bar */}
        <View style={[
          styles.searchBar,
          rtl && styles.rowReverse,
          { borderColor: query.length > 0 ? Colors.primaryOrange : Colors.grayLight },
        ]}>
          {/* Leading icon */}
          {rtl ? (
            query.length > 0 ? (
              <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={18} color={Colors.grayMedium} />
              </TouchableOpacity>
            ) : (
              <Feather name="search" size={18} color={Colors.grayMedium} />
            )
          ) : (
            <Feather name="search" size={18} color={query.length > 0 ? Colors.primaryOrange : Colors.grayMedium} />
          )}

          <TextInput
            ref={inputRef}
            style={[styles.input, rtl && styles.textRight]}
            value={query}
            onChangeText={setQuery}
            placeholder={tr.placeholder}
            placeholderTextColor={Colors.grayMedium}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            textAlign={rtl ? "right" : "left"}
          />

          {/* Trailing icon */}
          {rtl ? (
            <Feather name="search" size={18} color={query.length > 0 ? Colors.primaryOrange : Colors.grayMedium} />
          ) : (
            query.length > 0 && (
              <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={18} color={Colors.grayMedium} />
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* ── Results area ── */}

      {/* Initial state */}
      {isInitial && (
        <View style={styles.centerWrap}>
          <Text style={styles.centerEmoji}>🍽️</Text>
          <Text style={[styles.centerText, rtl && styles.textRight]}>{tr.initial}</Text>
        </View>
      )}

      {/* Loading skeleton */}
      {isLoading && !isInitial && <SkeletonList />}

      {/* Error state */}
      {error && !isLoading && (
        <View style={styles.centerWrap}>
          <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
          <Text style={[styles.centerText, rtl && styles.textRight]}>{tr.error}</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={refetch} activeOpacity={0.8}>
            <Text style={styles.actionBtnText}>{tr.retry}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {isEmpty && (
        <View style={styles.centerWrap}>
          <Text style={styles.centerEmoji}>📦</Text>
          <Text style={[styles.centerText, rtl && styles.textRight]}>
            {tr.noResults.replace("{query}", query)}
          </Text>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.8}>
            <Text style={styles.clearBtnText}>{tr.clearSearch}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results list */}
      {!isLoading && !error && listings.length > 0 && (
        <FlatList
          data={listings}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: botPadding + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  rowReverse:   { flexDirection: "row-reverse" },
  textRight:    { textAlign: "right" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },

  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: Colors.grayLight,
    flexShrink: 0,
  },

  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 25,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 8,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.grayDark,
    paddingVertical: 0,
  },

  // Results
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  columnWrapper: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: 200,
  },

  // Center states
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: 12,
  },
  centerEmoji: { fontSize: 40 },
  centerText: {
    fontSize: 15,
    color: Colors.grayMedium,
    textAlign: "center",
    lineHeight: 22,
  },

  actionBtn: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 4,
  },
  actionBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  clearBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primaryOrange,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 9,
    marginTop: 4,
  },
  clearBtnText: { fontSize: 14, fontWeight: "700", color: Colors.primaryOrange },
});
