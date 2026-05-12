import React, { useEffect, useRef, useState } from "react";
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  Animated, StyleSheet, TouchableWithoutFeedback, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing } from "../../../theme";
import {
  FilterState, DEFAULT_FILTERS,
  FilterCategory, FilterFreshness, FilterRadius, FilterSortBy,
} from "../../../hooks/buyer/useSearchFilters";
import { t, isRTL } from "../../../i18n";
import { CategoryPicker }    from "./CategoryPicker";
import { FreshnessPicker }   from "./FreshnessPicker";
import { PriceRangeSlider }  from "./PriceRangeSlider";
import { RadiusSelector }    from "./RadiusSelector";
import { SortOptions }       from "./SortOptions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterPanelProps {
  visible:      boolean;
  initialFilters: FilterState;
  onClose:      () => void;
  onApply:      (filters: FilterState) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PANEL_HEIGHT = Dimensions.get("window").height * 0.78;

// ─── Component ────────────────────────────────────────────────────────────────

export function FilterPanel({ visible, initialFilters, onClose, onApply }: FilterPanelProps) {
  const insets = useSafeAreaInsets();
  const rtl    = isRTL();
  const tr     = t().filters;

  const [draft, setDraft]           = useState<FilterState>({ ...initialFilters });
  const [internalVisible, setInternalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(PANEL_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setDraft({ ...initialFilters });
      setInternalVisible(true);
      Animated.spring(slideAnim, {
        toValue:       0,
        useNativeDriver: true,
        bounciness:    0,
        speed:         18,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue:       PANEL_HEIGHT,
        duration:      240,
        useNativeDriver: true,
      }).start(() => setInternalVisible(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ── Draft helpers ──────────────────────────────────────────────────────────

  const updateDraft = <K extends keyof FilterState>(key: K, val: FilterState[K]) => {
    setDraft((prev) => ({ ...prev, [key]: val }));
  };

  const toggleFreshness = (f: FilterFreshness) => {
    setDraft((prev) => ({
      ...prev,
      freshness: prev.freshness.includes(f)
        ? prev.freshness.filter((x) => x !== f)
        : [...prev.freshness, f],
    }));
  };

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleClear = () => {
    onApply({ ...DEFAULT_FILTERS });
    onClose();
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  // ── Label maps ─────────────────────────────────────────────────────────────

  const categoryLabels: Record<FilterCategory, string> = {
    all:           tr.all,
    meals:         tr.meals,
    bread_pastries: tr.breadPastries,
    groceries:     tr.groceries,
    mixed:         tr.mixed,
  };

  const freshnessLabels: Record<FilterFreshness, string> = {
    eat_today:    tr.eatToday,
    fresh_tonight: tr.freshTonight,
    good_1_2_days: tr.good1_2Days,
  };

  const radiusLabels: Record<FilterRadius, string> = {
    1000:  tr.km1,
    5000:  tr.km5,
    10000: tr.km10,
  };

  const sortLabels: Record<FilterSortBy, string> = {
    distance: tr.distanceSort,
    price:    tr.price,
    rating:   tr.rating,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={internalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dim backdrop — tap to close */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Slide-up panel */}
      <Animated.View
        style={[
          styles.panel,
          { paddingBottom: insets.bottom + Spacing.md },
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Title */}
        <Text style={[styles.title, rtl && styles.textRight]}>{tr.title}</Text>

        {/* Scrollable filter sections */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SectionLabel label={tr.category} rtl={rtl} />
          <CategoryPicker
            selected={draft.category}
            onSelect={(cat) => updateDraft("category", cat)}
            rtl={rtl}
            labels={categoryLabels}
          />

          <SectionLabel label={tr.freshness} rtl={rtl} />
          <FreshnessPicker
            selected={draft.freshness}
            onToggle={toggleFreshness}
            rtl={rtl}
            labels={freshnessLabels}
          />

          <SectionLabel label={tr.priceRange} rtl={rtl} />
          <PriceRangeSlider
            min={0}
            max={100}
            value={[draft.price_min, draft.price_max]}
            onChange={([lo, hi]) =>
              setDraft((prev) => ({ ...prev, price_min: lo, price_max: hi }))
            }
            label={tr.priceLabel}
            step={5}
          />

          <SectionLabel label={tr.distance} rtl={rtl} />
          <RadiusSelector
            selected={draft.radius}
            onSelect={(r) => updateDraft("radius", r)}
            rtl={rtl}
            labels={radiusLabels}
          />

          <SectionLabel label={tr.sortBy} rtl={rtl} />
          <SortOptions
            selected={draft.sort_by}
            onSelect={(s) => updateDraft("sort_by", s)}
            rtl={rtl}
            labels={sortLabels}
          />
        </ScrollView>

        {/* Footer: Clear + Apply */}
        <View style={[styles.footer, rtl && styles.rowReverse]}>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClear}
            activeOpacity={0.8}
          >
            <Text style={styles.clearBtnText}>{tr.clearFilters}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            activeOpacity={0.8}
          >
            <Text style={styles.applyBtnText}>{tr.seeResults}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, rtl }: { label: string; rtl: boolean }) {
  return (
    <Text style={[styles.sectionLabel, rtl && styles.textRight]}>{label}</Text>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.sm,
    overflow: "hidden",
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.grayLight,
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.grayDark,
    textAlign: "center",
    marginBottom: Spacing.md,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.grayMedium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },

  footer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
  },
  rowReverse: { flexDirection: "row-reverse" },

  clearBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.primaryOrange,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primaryOrange,
  },

  applyBtn: {
    flex: 2,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },

  textRight: { textAlign: "right" },
});
