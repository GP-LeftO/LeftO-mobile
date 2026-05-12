import { useState, useCallback, useMemo } from "react";

export type FilterCategory = "all" | "meals" | "bread_pastries" | "groceries" | "mixed";
export type FilterFreshness = "eat_today" | "fresh_tonight" | "good_1_2_days";
export type FilterSortBy = "distance" | "price" | "rating";
export type FilterRadius = 1000 | 5000 | 10000;

export interface FilterState {
  category:  FilterCategory;
  freshness: FilterFreshness[];
  price_min: number;
  price_max: number;
  radius:    FilterRadius;
  sort_by:   FilterSortBy;
}

export const DEFAULT_FILTERS: FilterState = {
  category:  "all",
  freshness: [],
  price_min: 0,
  price_max: 100,
  radius:    5000,
  sort_by:   "distance",
};

// Mapping from internal lowercase values to backend uppercase enums.
// Only used at the API boundary — internal FilterState stays lowercase.
export const CATEGORY_API_MAP: Record<Exclude<FilterCategory, "all">, string> = {
  meals:          "MEALS",
  bread_pastries: "BREAD_AND_PASTRIES",
  groceries:      "GROCERIES",
  mixed:          "MIXED",
};

export interface UseSearchFiltersResult {
  filters:           FilterState;
  setFilter:         <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  applyFilters:      (newFilters: FilterState) => void;
  clearFilters:      () => void;
  activeFilterCount: number;
  buildQueryParams:  () => string;
}

export function useSearchFilters(): UseSearchFiltersResult {
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const applyFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category  !== DEFAULT_FILTERS.category)  count++;
    if (filters.freshness.length > 0)                    count++;
    if (filters.price_min !== DEFAULT_FILTERS.price_min) count++;
    if (filters.price_max !== DEFAULT_FILTERS.price_max) count++;
    if (filters.radius    !== DEFAULT_FILTERS.radius)    count++;
    if (filters.sort_by   !== DEFAULT_FILTERS.sort_by)   count++;
    return count;
  }, [filters]);

  const buildQueryParams = useCallback((): string => {
    const params = new URLSearchParams();

    // Category: omit when "all"; map to backend UPPERCASE enum otherwise
    if (filters.category !== "all") {
      params.append("category", CATEGORY_API_MAP[filters.category]);
    }

    // Freshness: only append when at least one is selected
    if (filters.freshness.length > 0) {
      filters.freshness.forEach((f) => params.append("freshness[]", f));
    }

    // Price: only send when not at default (0 / 100) — avoids unnecessary validation
    if (filters.price_min > 0)   params.append("minPrice", String(filters.price_min));
    if (filters.price_max < 100) params.append("maxPrice", String(filters.price_max));

    // Radius: always send (default 5000m is still a useful constraint)
    params.append("radius", String(filters.radius));

    // Sort: use sortBy; omit when default (distance)
    if (filters.sort_by !== "distance") params.append("sortBy", filters.sort_by);

    return params.toString();
  }, [filters]);

  return { filters, setFilter, applyFilters, clearFilters, activeFilterCount, buildQueryParams };
}
