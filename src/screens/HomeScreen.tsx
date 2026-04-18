import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../theme";
import LeftOLogo from "../components/LeftOLogo";
import { useAuth } from "../hooks/useAuth";

const CATEGORIES = [
  { label: "All", icon: "grid" },
  { label: "Meals", icon: "coffee" },
  { label: "Bread", icon: "box" },
  { label: "Groceries", icon: "shopping-bag" },
  { label: "Mixed", icon: "layers" },
] as const;

const MOCK_STORES = [
  { id: "1", name: "Al-Andalus Bakery", type: "Surprise Bag", price: "₪12", original: "₪28", time: "5–7 PM", left: 3, distance: "0.4 km", rating: 4.8 },
  { id: "2", name: "Nablus Sweets", type: "Specific Parcel", price: "₪8", original: "₪20", time: "4–6 PM", left: 5, distance: "0.9 km", rating: 4.6 },
  { id: "3", name: "Green Market", type: "Surprise Bag", price: "₪15", original: "₪35", time: "6–8 PM", left: 2, distance: "1.2 km", rating: 4.7 },
  { id: "4", name: "City Restaurant", type: "Surprise Bag", price: "₪18", original: "₪42", time: "8–10 PM", left: 4, distance: "0.7 km", rating: 4.9 },
];

interface HomeScreenProps {
  onLogout?: () => void;
}

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const [activeCategory, setActiveCategory] = React.useState("All");
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <View>
          <Text style={styles.greeting}>Good afternoon 👋</Text>
          <Text style={styles.location}>
            <Feather name="map-pin" size={13} color={Colors.primaryOrange} /> Nablus, Palestine
          </Text>
        </View>
        <View style={styles.headerRight}>
          <LeftOLogo size="sm" showText={false} />
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Feather name="log-out" size={18} color={Colors.grayMedium} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Search bar */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.7}>
          <Feather name="search" size={18} color={Colors.grayMedium} />
          <Text style={styles.searchPlaceholder}>Search stores or bags…</Text>
          <View style={styles.filterBtn}>
            <Feather name="sliders" size={14} color={Colors.primaryOrange} />
          </View>
        </TouchableOpacity>

        {/* Impact strip */}
        <View style={styles.impactStrip}>
          <ImpactStat icon="wind" label="CO₂ Saved" value="2.4 kg" />
          <View style={styles.impactDivider} />
          <ImpactStat icon="dollar-sign" label="Money Saved" value="₪84" />
          <View style={styles.impactDivider} />
          <ImpactStat icon="heart" label="Donations" value="3" />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.label}
              style={[styles.categoryChip, activeCategory === c.label && styles.categoryChipActive]}
              onPress={() => setActiveCategory(c.label)}
            >
              <Feather
                name={c.icon as any}
                size={14}
                color={activeCategory === c.label ? Colors.white : Colors.grayMedium}
              />
              <Text style={[styles.categoryLabel, activeCategory === c.label && styles.categoryLabelActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section: Surprise Bags Near You */}
        <SectionHeader title="Surprise Bags Near You" />
        {MOCK_STORES.slice(0, 2).map((s) => (
          <StoreCard key={s.id} store={s} />
        ))}

        {/* Section: Local Heroes */}
        <SectionHeader title="Local Heroes ⭐" />
        {MOCK_STORES.slice(2).map((s) => (
          <StoreCard key={s.id} store={s} />
        ))}
      </ScrollView>
    </View>
  );
}

function ImpactStat({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.impactStat}>
      <Feather name={icon} size={16} color={Colors.primaryOrange} />
      <Text style={styles.impactValue}>{value}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity>
        <Text style={styles.seeAll}>See all</Text>
      </TouchableOpacity>
    </View>
  );
}

function StoreCard({ store }: { store: typeof MOCK_STORES[0] }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      {/* Color placeholder for store image */}
      <View style={styles.cardImage}>
        <Feather name="shopping-bag" size={28} color={Colors.primaryOrange} />
        <View style={styles.leftBadge}>
          <Text style={styles.leftBadgeText}>{store.left} left</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardName}>{store.name}</Text>
          <TouchableOpacity>
            <Feather name="heart" size={18} color={Colors.grayLight} />
          </TouchableOpacity>
        </View>
        <Text style={styles.cardType}>{store.type}</Text>
        <View style={styles.cardMeta}>
          <Feather name="clock" size={12} color={Colors.grayMedium} />
          <Text style={styles.cardMetaText}>{store.time}</Text>
          <Feather name="map-pin" size={12} color={Colors.grayMedium} style={{ marginLeft: 8 }} />
          <Text style={styles.cardMetaText}>{store.distance}</Text>
          <Feather name="star" size={12} color="#f59e0b" style={{ marginLeft: 8 }} />
          <Text style={styles.cardMetaText}>{store.rating}</Text>
        </View>
        <View style={styles.cardPriceRow}>
          <Text style={styles.cardPrice}>{store.price}</Text>
          <Text style={styles.cardOriginal}>{store.original}</Text>
          <TouchableOpacity style={styles.donateBtn}>
            <Feather name="gift" size={12} color={Colors.greenMain} />
            <Text style={styles.donateBtnText}>Donate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  greeting: { fontSize: 20, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.3 },
  location: { fontSize: 13, color: Colors.grayMedium, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: Colors.grayLight,
  },

  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 100, gap: Spacing.md },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: Colors.grayMedium },
  filterBtn: {
    backgroundColor: Colors.orangeLight,
    borderRadius: 10,
    padding: 6,
  },

  impactStrip: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  impactStat: { flex: 1, alignItems: "center", gap: 3 },
  impactValue: { fontSize: 16, fontWeight: "800", color: Colors.grayDark },
  impactLabel: { fontSize: 11, color: Colors.grayMedium },
  impactDivider: { width: 1, backgroundColor: Colors.grayLight },

  categoriesRow: { gap: 8, paddingVertical: 4 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
  },
  categoryChipActive: { backgroundColor: Colors.primaryOrange, borderColor: Colors.primaryOrange },
  categoryLabel: { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },
  categoryLabelActive: { color: Colors.white },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark },
  seeAll: { fontSize: 13, fontWeight: "600", color: Colors.primaryOrange },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImage: {
    height: 120,
    backgroundColor: Colors.orangeLight,
    alignItems: "center",
    justifyContent: "center",
  },
  leftBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  leftBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.white },
  cardBody: { padding: Spacing.md, gap: 4 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName: { fontSize: 16, fontWeight: "700", color: Colors.grayDark },
  cardType: { fontSize: 12, color: Colors.grayMedium },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  cardMetaText: { fontSize: 12, color: Colors.grayMedium },
  cardPriceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  cardPrice: { fontSize: 18, fontWeight: "800", color: Colors.primaryOrange },
  cardOriginal: { fontSize: 13, color: Colors.grayMedium, textDecorationLine: "line-through" },
  donateBtn: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  donateBtnText: { fontSize: 12, fontWeight: "600", color: Colors.greenMain },
});
