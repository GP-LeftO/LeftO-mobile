/**
 * SearchScreen
 *
 * Buyer search / browse screen. Reached by tapping the search bar on HomeScreen.
 *
 * Layout (top → bottom):
 *   • Sticky header: back + search bar + Filters button (with badge)
 *   • Scrollable results:
 *       - Initial state   → prompt
 *       - Loading         → skeleton cards
 *       - Results         → 2-column listing grid
 *       - Empty (search)  → no results message
 *       - Empty (filters) → no filter match + Clear Filters CTA
 *       - Error           → error + retry
 *   • FilterPanel (Modal bottom sheet)
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Platform, Dimensions,
} from "react-native";

const CARD_WIDTH = (Dimensions.get("window").width - 48) / 2; // 16 left + 16 right + 16 gap
type GridItem = Listing | { id: string; _placeholder: true };
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { t, isRTL } from "../../i18n";
import { searchListings } from "../../services/buyer/search.service";
import { useSearchFilters, DEFAULT_FILTERS, FilterState, CATEGORY_API_MAP } from "../../hooks/buyer/useSearchFilters";
import ListingCard, { SkeletonCard } from "../../components/buyer/ListingCard";
import { FilterPanel } from "../../components/buyer/filters/FilterPanel";
import type { Listing, StoreDetailsParams } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchScreenProps {
  onBack:          () => void;
  onListingPress?: (params: StoreDetailsParams) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isDefaultFilters(f: FilterState): boolean {
  return (
    f.category  === DEFAULT_FILTERS.category  &&
    f.freshness.length === 0                  &&
    f.price_min === DEFAULT_FILTERS.price_min &&
    f.price_max === DEFAULT_FILTERS.price_max &&
    f.radius    === DEFAULT_FILTERS.radius    &&
    f.sort_by   === DEFAULT_FILTERS.sort_by
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

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
  wrap: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm },
  row:  { flexDirection: "row", justifyContent: "space-between" },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function SearchScreen({ onBack, onListingPress }: SearchScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const botPadding = Platform.OS === "web" ? 24 : insets.bottom;
  const rtl        = isRTL();
  const tr         = t().search;

  const inputRef = useRef<TextInput>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [query,     setQuery]     = useState("");
  const [listings,  setListings]  = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // ── Filters ────────────────────────────────────────────────────────────────
  const { filters, applyFilters, clearFilters, activeFilterCount } =
    useSearchFilters();

  // Always-current refs so effects don't capture stale values
  const queryRef   = useRef(query);
  const filtersRef = useRef(filters);
  queryRef.current   = query;
  filtersRef.current = filters;

  // ── Core fetch ─────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q: string, f: FilterState) => {
    const hasQuery   = q.trim().length > 0;
    const hasFilters = !isDefaultFilters(f);

    if (!hasQuery && !hasFilters) {
      setListings([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await searchListings({
        q:         q.trim() || undefined,
        radius:    f.radius,
        category:  f.category !== "all" ? CATEGORY_API_MAP[f.category] : undefined,
        freshness: f.freshness.length > 0 ? f.freshness : undefined,
        minPrice:  f.price_min > 0   ? f.price_min : undefined,
        maxPrice:  f.price_max < 100 ? f.price_max : undefined,
        sortBy:    f.sort_by !== "distance" ? f.sort_by : undefined,
        limit:     30,
      });
      setListings(result.listings);
    } catch {
      setError("error");
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Debounced re-fetch when query changes ──────────────────────────────────
  useEffect(() => {
    if (!query.trim() && isDefaultFilters(filtersRef.current)) {
      setListings([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      doSearch(queryRef.current, filtersRef.current);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  // ── Auto-focus on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  // ── Filter apply ───────────────────────────────────────────────────────────
  const handleFiltersApply = useCallback((newFilters: FilterState) => {
    applyFilters(newFilters);
    // Immediate search (not debounced) with the new filters
    doSearch(queryRef.current, newFilters);
  }, [applyFilters, doSearch]);

  const handleClearAll = useCallback(() => {
    clearFilters();
    doSearch(queryRef.current, DEFAULT_FILTERS);
  }, [clearFilters, doSearch]);

  // ── Search bar clear ───────────────────────────────────────────────────────
  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
    if (!isDefaultFilters(filtersRef.current)) {
      doSearch("", filtersRef.current);
    } else {
      setListings([]);
    }
  };

  // ── Retry ──────────────────────────────────────────────────────────────────
  const refetch = useCallback(() => {
    doSearch(queryRef.current, filtersRef.current);
  }, [doSearch]);

  // ── Derived states ─────────────────────────────────────────────────────────
  const hasFilters    = activeFilterCount > 0;
  const isInitial     = query.trim().length === 0 && !hasFilters;
  const isEmpty       = !isLoading && !error && listings.length === 0 && !isInitial;

  // ── Card renderer ──────────────────────────────────────────────────────────
  const renderCard = ({ item }: { item: GridItem }) => {
    if ("_placeholder" in item) return <View style={{ width: CARD_WIDTH }} />;
    return (
      <ListingCard
        listing={item}
        rtl={rtl}
        onPress={(params) => onListingPress?.(params)}
        userAllergyPreferences={[]}
      />
    );
  };

  const gridData: GridItem[] = listings.length % 2 !== 0
    ? [...listings, { id: "__placeholder__", _placeholder: true as const }]
    : listings;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>

      {/* ── Sticky Header ── */}
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

        {/* Filters button */}
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setPanelOpen(true)}
          activeOpacity={0.7}
        >
          <Feather name="sliders" size={18} color={hasFilters ? Colors.white : Colors.grayDark} />
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
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
      {isEmpty && !error && (
        <View style={styles.centerWrap}>
          <Text style={styles.centerEmoji}>📦</Text>
          <Text style={[styles.centerText, rtl && styles.textRight]}>
            {hasFilters
              ? tr.noFilterResults
              : tr.noResults.replace("{query}", query)}
          </Text>
          {hasFilters ? (
            <TouchableOpacity style={styles.actionBtn} onPress={handleClearAll} activeOpacity={0.8}>
              <Text style={styles.actionBtnText}>{t().filters.clearFilters}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.8}>
              <Text style={styles.clearBtnText}>{tr.clearSearch}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results grid */}
      {!isLoading && !error && listings.length > 0 && (
        <FlatList<GridItem>
          data={gridData}
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

      {/* ── Filter panel ── */}
      <FilterPanel
        visible={panelOpen}
        initialFilters={filters}
        onClose={() => setPanelOpen(false)}
        onApply={handleFiltersApply}
      />

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  rowReverse: { flexDirection: "row-reverse" },
  textRight:  { textAlign: "right" },

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

  // Filters button
  filterBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },

  badge: {
    position: "absolute",
    top: -2, right: -2,
    minWidth: 16, height: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.primaryOrange,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.primaryOrange,
    lineHeight: 11,
  },

  // Results
  listContent: {
    paddingTop: Spacing.sm,
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    marginBottom: 12,
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
