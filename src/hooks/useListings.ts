/**
 * useListings
 *
 * Fetches listings from GET /api/listings using the device's GPS location
 * (falling back to Nablus centre: 32.2211, 35.2544 if unavailable).
 * Derives and returns three filtered/sorted arrays ready for the Home screen:
 *  - surpriseBags   — type === 'SURPRISE_BAG'
 *  - parcels        — type === 'SPECIFIC_ITEM'
 *  - popularToday   — all listings sorted by quantity ascending (low stock first)
 */

import { useState, useCallback, useEffect } from "react";
import api from "../services/api";
import type { Listing } from "../types";

const NABLUS_LAT = 32.2211;
const NABLUS_LNG = 35.2544;
const RADIUS_KM  = 5;

interface UseListingsResult {
  surpriseBags:  Listing[];
  parcels:       Listing[];
  popularToday:  Listing[];
  loading:       boolean;
  refreshing:    boolean;
  error:         string | null;
  onRefresh:     () => void;
}

async function getDeviceLocation(): Promise<{ lat: number; lng: number }> {
  try {
    const Location = await import("expo-location");
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return { lat: NABLUS_LAT, lng: NABLUS_LNG };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return { lat: NABLUS_LAT, lng: NABLUS_LNG };
  }
}

function deriveArrays(listings: Listing[]): {
  surpriseBags: Listing[];
  parcels:      Listing[];
  popularToday: Listing[];
} {
  const surpriseBags  = listings.filter((l) => l.type === "SURPRISE_BAG");
  const parcels       = listings.filter((l) => l.type === "SPECIFIC_ITEM");
  const popularToday  = [...listings].sort((a, b) => a.quantity - b.quantity);
  return { surpriseBags, parcels, popularToday };
}

export function useListings(): UseListingsResult {
  const [listings,   setListings]   = useState<Listing[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const fetchListings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else           setLoading(true);
    setError(null);

    try {
      const { lat, lng } = await getDeviceLocation();
      const { data } = await api.get("/api/listings", {
        params: { lat, lng, radius: RADIUS_KM },
      });

      const payload = data?.data ?? data;
      const items: Listing[] = Array.isArray(payload)
        ? payload
        : (payload?.listings ?? payload?.items ?? payload?.data ?? []);

      setListings(items);
    } catch {
      setError("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => { fetchListings(true); }, [fetchListings]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const { surpriseBags, parcels, popularToday } = deriveArrays(listings);

  return { surpriseBags, parcels, popularToday, loading, refreshing, error, onRefresh };
}
