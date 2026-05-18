import React, { useState, useEffect, useCallback, useRef } from "react";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import api from "../../../services/shared/api";
import { searchListings } from "../../../services/buyer/search.service";
import {
  useSearchFilters,
  FilterState,
  DEFAULT_FILTERS,
  CATEGORY_API_MAP,
} from "../../../hooks/buyer/useSearchFilters";
import type { Listing } from "../../../types";
import type { Coordinate, MapSeller, ViewMode } from "../types/browse.types";

// Nablus city center — used as fallback when location permission is denied
const NABLUS_CENTER: Coordinate = { latitude: 32.2211, longitude: 35.2566 };

// Flip to false once GET /api/sellers is live on the backend
const USE_MOCK_SELLERS = true;

const MOCK_SELLERS: MapSeller[] = [
  {
    id: "mock-1",
    name: "أبو علي للفلافل",
    type: "restaurant",
    businessType: "restaurant",
    lat: 32.2211,
    lng: 35.2561,
    category: "MEALS",
    listing: {
      type: "MEAL_BAG",
      pickupStart: "18:00",
      pickupEnd: "20:00",
      discountedPrice: 12,
      originalPrice: 35,
      itemsLeft: 3,
    },
  },
  {
    id: "mock-2",
    name: "مخبز الأمل",
    type: "bakery",
    businessType: "bakery",
    lat: 32.2228,
    lng: 35.2587,
    category: "BREAD_AND_PASTRIES",
    listing: {
      type: "SPECIFIC_PARCEL",
      pickupStart: "07:00",
      pickupEnd: "09:00",
      discountedPrice: 8,
      originalPrice: 20,
      itemsLeft: 5,
    },
  },
  {
    id: "mock-3",
    name: "بقالة الشرق",
    type: "grocery",
    businessType: "grocery",
    lat: 32.2195,
    lng: 35.2543,
    category: "GROCERIES",
    listing: {
      type: "SPECIFIC_PARCEL",
      pickupStart: "16:00",
      pickupEnd: "19:00",
      discountedPrice: 18,
      originalPrice: 45,
      itemsLeft: 2,
    },
  },
  {
    id: "mock-4",
    name: "ريستورانت الوادي",
    type: "restaurant",
    businessType: "restaurant",
    lat: 32.2238,
    lng: 35.2551,
    category: "MIXED",
    listing: {
      type: "MEAL_BAG",
      pickupStart: "20:00",
      pickupEnd: "22:00",
      discountedPrice: 15,
      originalPrice: 40,
      itemsLeft: 1,
    },
  },
  {
    id: "mock-5",
    name: "حلويات نابلس",
    type: "bakery",
    businessType: "bakery",
    lat: 32.2201,
    lng: 35.2578,
    category: "BREAD_AND_PASTRIES",
    listing: {
      type: "MEAL_BAG",
      pickupStart: "19:00",
      pickupEnd: "21:00",
      discountedPrice: 10,
      originalPrice: 28,
      itemsLeft: 4,
    },
  },
  {
    id: "mock-6",
    name: "سوبرماركت القدس",
    type: "grocery",
    businessType: "grocery",
    lat: 32.2245,
    lng: 35.2535,
    category: "GROCERIES",
    listing: {
      type: "SPECIFIC_PARCEL",
      pickupStart: "17:00",
      pickupEnd: "20:00",
      discountedPrice: 22,
      originalPrice: 55,
      itemsLeft: 6,
    },
  },
];

// ── Haversine distance (returns km) ──────────────────────────────────────────
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function checkDefaultFilters(f: FilterState): boolean {
  return (
    f.category === DEFAULT_FILTERS.category &&
    f.freshness.length === 0 &&
    f.price_min === DEFAULT_FILTERS.price_min &&
    f.price_max === DEFAULT_FILTERS.price_max &&
    f.radius === DEFAULT_FILTERS.radius &&
    f.sort_by === DEFAULT_FILTERS.sort_by
  );
}

// ── Public interface ──────────────────────────────────────────────────────────

export interface UseBrowseMapResult {
  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  // List view
  query: string;
  setQuery: (q: string) => void;
  listings: Listing[];
  listLoading: boolean;
  listError: string | null;
  isInitialList: boolean;
  retryList: () => void;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  handleApplyFilters: (f: FilterState) => void;
  handleClearFilters: () => void;
  // Map view
  userLocation: Coordinate | null;
  locationPermissionDenied: boolean;
  sellers: MapSeller[];
  selectedSeller: MapSeller | null;
  selectSeller: (seller: MapSeller | null) => void;
  mapLoading: boolean;
  mapError: string | null;
  retryMap: () => void;
  recenterMap: () => void;
  mapRef: React.RefObject<WebView | null>;
  getSellerDistance: (seller: MapSeller) => number;
  // Shared filters
  filters: FilterState;
  activeFilterCount: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBrowseMap(): UseBrowseMapResult {
  const mapRef = useRef<WebView | null>(null);

  // ── View mode ──────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // ── Shared filters ─────────────────────────────────────────────────────────
  const { filters, applyFilters, clearFilters, activeFilterCount } =
    useSearchFilters();

  // ── List view ──────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // Always-current refs so async callbacks read the latest values
  const queryRef = useRef(query);
  const filtersRef = useRef(filters);
  queryRef.current = query;
  filtersRef.current = filters;

  const doListSearch = useCallback(async (q: string, f: FilterState) => {
    const hasQuery = q.trim().length > 0;
    const hasFilters = !checkDefaultFilters(f);

    if (!hasQuery && !hasFilters) {
      setListings([]);
      setListLoading(false);
      setListError(null);
      return;
    }

    setListLoading(true);
    setListError(null);

    try {
      const result = await searchListings({
        q: q.trim() || undefined,
        radius: f.radius,
        category: f.category !== "all" ? CATEGORY_API_MAP[f.category] : undefined,
        freshness: f.freshness.length > 0 ? f.freshness : undefined,
        minPrice: f.price_min > 0 ? f.price_min : undefined,
        maxPrice: f.price_max < 100 ? f.price_max : undefined,
        sortBy: f.sort_by !== "distance" ? f.sort_by : undefined,
        limit: 30,
      });
      setListings(result.listings);
    } catch {
      setListError("error");
      setListings([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  // Debounced fetch when query changes
  useEffect(() => {
    if (!query.trim() && checkDefaultFilters(filtersRef.current)) {
      setListings([]);
      setListLoading(false);
      setListError(null);
      return;
    }
    setListLoading(true);
    const timer = setTimeout(() => {
      doListSearch(queryRef.current, filtersRef.current);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, doListSearch]);

  const handleApplyFilters = useCallback(
    (newFilters: FilterState) => {
      applyFilters(newFilters);
      doListSearch(queryRef.current, newFilters);
    },
    [applyFilters, doListSearch],
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setListings([]);
    setListError(null);
  }, [clearFilters]);

  const isInitialList = query.trim().length === 0 && activeFilterCount === 0;

  // ── Map view ───────────────────────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [sellers, setSellers] = useState<MapSeller[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<MapSeller | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Request foreground location permission on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationPermissionDenied(true);
          setUserLocation(NABLUS_CENTER);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch {
        // If expo-location fails for any reason, fall back to Nablus
        setUserLocation(NABLUS_CENTER);
      }
    })();
  }, []);

  const fetchSellers = useCallback(async () => {
    const loc = userLocation ?? NABLUS_CENTER;

    if (USE_MOCK_SELLERS) {
      setSellers(MOCK_SELLERS);
      return;
    }

    setMapLoading(true);
    setMapError(null);

    try {
      const radiusKm = filters.radius / 1000;
      const { data } = await api.get<MapSeller[]>("/api/sellers", {
        params: { lat: loc.latitude, lng: loc.longitude, radius: radiusKm },
      });
      setSellers(Array.isArray(data) ? data : []);
    } catch {
      setMapError("error");
    } finally {
      setMapLoading(false);
    }
  }, [userLocation, filters.radius]);

  // Fetch sellers when switching to map, or when radius/location changes while on map
  useEffect(() => {
    if (viewMode === "map") {
      fetchSellers();
    }
  }, [viewMode, fetchSellers]);

  const selectSeller = useCallback((seller: MapSeller | null) => {
    setSelectedSeller(seller);
  }, []);

  const recenterMap = useCallback(() => {
    const loc = userLocation ?? NABLUS_CENTER;
    mapRef.current?.injectJavaScript(
      `window.recenter(${loc.latitude}, ${loc.longitude}); true;`,
    );
  }, [userLocation]);

  const getSellerDistance = useCallback(
    (seller: MapSeller): number => {
      const loc = userLocation ?? NABLUS_CENTER;
      return haversineKm(loc.latitude, loc.longitude, seller.lat, seller.lng);
    },
    [userLocation],
  );

  return {
    viewMode,
    setViewMode,
    query,
    setQuery,
    listings,
    listLoading,
    listError,
    isInitialList,
    retryList: () => doListSearch(queryRef.current, filtersRef.current),
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
    retryMap: fetchSellers,
    recenterMap,
    mapRef,
    getSellerDistance,
    filters,
    activeFilterCount,
  };
}
