/**
 * BrowseScreen
 *
 * Buyer browse / search screen with a List ↔ Map toggle.
 * All business logic lives in useBrowseMap (MVVM). This file is rendering only.
 *
 * Layout:
 *   ┌──────────────────────────────────────┐
 *   │  [←]  [ search bar ]       [filters]│  ← sticky header
 *   │         [ List | Map ]              │  ← toggle row
 *   ├──────────────────────────────────────┤
 *   │  LIST VIEW  (cross-fades)            │
 *   │  MAP VIEW   (cross-fades)            │
 *   └──────────────────────────────────────┘
 *
 * Both views are always mounted — pointerEvents/opacity toggled to avoid
 * re-mounting the heavy MapView on every switch.
 */

import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  I18nManager,
  ActivityIndicator,
} from "react-native";
import LeafletBrowseMap from "./components/LeafletBrowseMap";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { t, isRTL } from "../../i18n";
import ListingCard, { SkeletonCard } from "../../components/buyer/ListingCard";
import { FilterPanel } from "../../components/buyer/filters/FilterPanel";
import type { Listing, StoreDetailsParams } from "../../types";
import { useBrowseMap } from "./hooks/useBrowseMap";
import { useHeatmap } from "../../hooks/buyer/useHeatmap";
import { MapViewToggle } from "./components/MapViewToggle";
import { ListingCardPreview } from "./components/ListingCardPreview";
import type { MapSeller } from "./types/browse.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_W = (Dimensions.get("window").width - 48) / 2;

const HIT = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── Types ────────────────────────────────────────────────────────────────────

type GridItem = Listing | { id: string; _placeholder: true };

interface BrowseScreenProps {
  onBack?: () => void;
  onListingPress?: (params: StoreDetailsParams) => void;
  onReserve?: (seller: MapSeller) => void;
  onDonate?: (seller: MapSeller) => void;
}

// ─── Skeleton list ────────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <View style={skStyles.wrap}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={skStyles.row}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}
const skStyles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm },
  row: { flexDirection: "row", justifyContent: "space-between" },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BrowseScreen({
  onBack,
  onListingPress,
  onReserve,
  onDonate,
}: BrowseScreenProps) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;
  const rtl = isRTL();
  const tr = t().search;
  const trB = t().browse;

  const inputRef = useRef<TextInput>(null);

  // Controls the cross-fade between list and map content areas
  const switchAnim = useRef(new Animated.Value(0)).current; // 0 = list, 1 = map

  // ── ViewModel ──────────────────────────────────────────────────────────────
  const {
    viewMode,
    setViewMode,
    query,
    setQuery,
    listings,
    listLoading,
    listError,
    isInitialList,
    retryList,
    panelOpen,
    setPanelOpen,
    handleApplyFilters,
    handleClearFilters,
    userLocation,
    locationPermissionDenied,
    sellers,
    selectedSeller,
    selectSeller,
    mapLoading,
    mapError,
    retryMap,
    recenterMap,
    mapRef,
    getSellerDistance,
    filters,
    activeFilterCount,
  } = useBrowseMap();

  const { spots: heatspots } = useHeatmap();

  // ── Toggle handler ─────────────────────────────────────────────────────────
  const handleToggle = useCallback(
    (mode: typeof viewMode) => {
      setViewMode(mode);
      Animated.timing(switchAnim, {
        toValue: mode === "list" ? 0 : 1,
        duration: 240,
        useNativeDriver: true,
      }).start();
      if (mode === "list") {
        setTimeout(() => inputRef.current?.focus(), 280);
      }
    },
    [setViewMode, switchAnim],
  );

  // ── Animated opacities ────────────────────────────────────────────────────
  const listOpacity = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const mapOpacity = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const hasFilters = activeFilterCount > 0;
  const isEmptyList = !listLoading && !listError && listings.length === 0 && !isInitialList;

  const gridData: GridItem[] =
    listings.length % 2 !== 0
      ? [...listings, { id: "__placeholder__", _placeholder: true as const }]
      : listings;

  const distanceKm = selectedSeller ? getSellerDistance(selectedSeller) : null;

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderCard = ({ item }: { item: GridItem }) => {
    if ("_placeholder" in item) return <View style={{ width: CARD_W }} />;
    return (
      <ListingCard
        listing={item}
        rtl={rtl}
        onPress={(params) => onListingPress?.(params)}
        userAllergyPreferences={[]}
      />
    );
  };

  // ── Root ──────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: topPad }]}>

      {/* ════ STICKY HEADER ════ */}
      <View style={styles.headerWrap}>

        {/* Row 1 — search bar */}
        <View style={[styles.searchRow, rtl && styles.rowRev]}>

          {/* Back button (optional) */}
          {onBack && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Feather
                name={rtl ? "arrow-right" : "arrow-left"}
                size={20}
                color={Colors.grayDark}
              />
            </TouchableOpacity>
          )}

          {/* Search bar */}
          <View
            style={[
              styles.searchBar,
              rtl && styles.rowRev,
              { borderColor: query.length > 0 ? Colors.primaryOrange : Colors.grayLight },
            ]}
          >
            {rtl ? (
              /* RTL: clear on left, search icon on right */
              <>
                {query.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => setQuery("")}
                    hitSlop={HIT}
                  >
                    <Feather name="x" size={18} color={Colors.grayMedium} />
                  </TouchableOpacity>
                ) : (
                  <Feather name="search" size={18} color={Colors.grayMedium} />
                )}
                <TextInput
                  ref={inputRef}
                  style={[styles.input, styles.textRight]}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={tr.placeholder}
                  placeholderTextColor={Colors.grayMedium}
                  returnKeyType="search"
                  autoCorrect={false}
                  autoCapitalize="none"
                  textAlign="right"
                />
                <Feather
                  name="search"
                  size={18}
                  color={query.length > 0 ? Colors.primaryOrange : Colors.grayMedium}
                />
              </>
            ) : (
              /* LTR: search icon on left, clear on right */
              <>
                <Feather
                  name="search"
                  size={18}
                  color={query.length > 0 ? Colors.primaryOrange : Colors.grayMedium}
                />
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={tr.placeholder}
                  placeholderTextColor={Colors.grayMedium}
                  returnKeyType="search"
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {query.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setQuery("")}
                    hitSlop={HIT}
                  >
                    <Feather name="x" size={18} color={Colors.grayMedium} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* Filters button */}
          <TouchableOpacity
            style={[styles.iconBtn, hasFilters && styles.iconBtnActive]}
            onPress={() => setPanelOpen(true)}
            activeOpacity={0.7}
          >
            <Feather
              name="sliders"
              size={18}
              color={hasFilters ? Colors.white : Colors.grayDark}
            />
            {activeFilterCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Row 2 — List / Map toggle */}
        <View style={styles.toggleRow}>
          <MapViewToggle value={viewMode} onChange={handleToggle} />
        </View>
      </View>

      {/* ════ CONTENT (both views always mounted) ════ */}
      <View style={styles.content}>

        {/* ── LIST VIEW ── */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: listOpacity }]}
          pointerEvents={viewMode === "list" ? "auto" : "none"}
        >
          {/* Initial prompt */}
          {isInitialList && (
            <View style={styles.centerWrap}>
              <Text style={styles.centerEmoji}>🍽️</Text>
              <Text style={[styles.centerText, rtl && styles.textRight]}>
                {tr.initial}
              </Text>
            </View>
          )}

          {/* Loading skeletons */}
          {listLoading && !isInitialList && <SkeletonList />}

          {/* Network error */}
          {listError && !listLoading && (
            <View style={styles.centerWrap}>
              <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
              <Text style={[styles.centerText, rtl && styles.textRight]}>
                {tr.error}
              </Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={retryList}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>{tr.retry}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Empty state */}
          {isEmptyList && !listError && (
            <View style={styles.centerWrap}>
              <Text style={styles.centerEmoji}>📦</Text>
              <Text style={[styles.centerText, rtl && styles.textRight]}>
                {hasFilters
                  ? tr.noFilterResults
                  : tr.noResults.replace("{query}", query)}
              </Text>
              {hasFilters ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleClearFilters}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>
                    {t().filters.clearFilters}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => setQuery("")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.clearBtnText}>{tr.clearSearch}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Results grid */}
          {!listLoading && !listError && listings.length > 0 && (
            <FlatList<GridItem>
              data={gridData}
              renderItem={renderCard}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: botPad + 24 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </Animated.View>

        {/* ── MAP VIEW ── */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: mapOpacity }]}
          pointerEvents={viewMode === "map" ? "auto" : "none"}
        >
          {/* Leaflet map — OSM tiles, seller pins, radius circle */}
          <LeafletBrowseMap
            ref={mapRef}
            sellers={sellers}
            selectedSellerId={selectedSeller?.id ?? null}
            userLocation={userLocation}
            radiusMeters={filters.radius}
            locationPermissionDenied={locationPermissionDenied}
            onSellerSelect={selectSeller}
            onMapTap={() => selectSeller(null)}
            heatspots={heatspots}
          />

          {/* Map loading overlay */}
          {mapLoading && (
            <View style={styles.mapOverlay} pointerEvents="none">
              <View style={styles.mapSpinner}>
                <ActivityIndicator size="large" color={Colors.primaryOrange} />
              </View>
            </View>
          )}

          {/* Empty state (no sellers in radius) */}
          {!mapLoading && !mapError && sellers.length === 0 && (
            <View style={styles.mapTopBanner} pointerEvents="none">
              <Text style={styles.mapBannerText}>{trB.noSellersNearby}</Text>
            </View>
          )}

          {/* Error state */}
          {mapError && !mapLoading && (
            <View style={styles.mapTopBanner}>
              <Feather name="wifi-off" size={15} color={Colors.orangeDark} />
              <Text style={styles.mapBannerText}>{trB.mapError}</Text>
              <TouchableOpacity onPress={retryMap} hitSlop={HIT}>
                <Text style={styles.mapBannerRetry}>{trB.retry}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Location-denied banner */}
          {locationPermissionDenied && (
            <View style={[styles.locationBanner, rtl && styles.rowRev]}>
              <Feather name="map-pin" size={13} color={Colors.orangeDark} />
              <Text style={styles.locationBannerText}>
                {trB.locationDenied}
              </Text>
            </View>
          )}

          {/* Recenter button — shifts up when bottom card is visible */}
          <TouchableOpacity
            style={[
              styles.recenterBtn,
              {
                bottom: selectedSeller
                  ? 230 + botPad
                  : 28 + botPad,
              },
            ]}
            onPress={recenterMap}
            activeOpacity={0.85}
          >
            <Feather name="crosshair" size={20} color={Colors.primaryOrange} />
          </TouchableOpacity>

          {/* Sliding bottom card preview */}
          <ListingCardPreview
            seller={selectedSeller}
            distanceKm={distanceKm}
            onReserve={(s) => onReserve?.(s)}
            onDonate={(s) => onDonate?.(s)}
          />
        </Animated.View>
      </View>

      {/* ════ FILTER PANEL ════ */}
      <FilterPanel
        visible={panelOpen}
        initialFilters={filters}
        onClose={() => setPanelOpen(false)}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ──
  headerWrap: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
    paddingBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rowRev: { flexDirection: "row-reverse" },
  textRight: { textAlign: "right" },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    flexShrink: 0,
  },
  iconBtnActive: {
    backgroundColor: Colors.primaryOrange,
    borderColor: Colors.primaryOrange,
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

  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
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

  toggleRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: 4,
    alignItems: "center",
  },

  // ── Content ──
  content: {
    flex: 1,
    position: "relative",
  },

  // ── List view ──
  listContent: { paddingTop: Spacing.sm },
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

  // ── Map view overlays ──
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  mapSpinner: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 16,
    padding: 18,
  },

  mapTopBanner: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  mapBannerText: {
    fontSize: 13,
    color: Colors.grayDark,
    fontWeight: "500",
  },
  mapBannerRetry: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryOrange,
  },

  locationBanner: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.orangeLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  locationBannerText: {
    fontSize: 12,
    color: Colors.orangeDark,
    fontWeight: "500",
  },

  recenterBtn: {
    position: "absolute",
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.grayLight,
  },
});
