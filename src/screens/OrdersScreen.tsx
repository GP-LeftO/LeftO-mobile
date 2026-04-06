import React, { useState } from "react";
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

type OrderStatus = "active" | "completed" | "donated";

const TABS: { key: OrderStatus; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "donated", label: "Donated" },
];

const MOCK_ORDERS: Record<OrderStatus, Array<{
  id: string; store: string; type: string; price: string;
  time: string; date: string; status: string; charity?: string;
}>> = {
  active: [
    { id: "1", store: "Al-Andalus Bakery", type: "Surprise Bag", price: "₪12", time: "5–7 PM", date: "Today", status: "Ready for pickup" },
    { id: "2", store: "Green Market", type: "Specific Parcel", price: "₪15", time: "6–8 PM", date: "Today", status: "Preparing" },
  ],
  completed: [
    { id: "3", store: "Nablus Sweets", type: "Surprise Bag", price: "₪8", time: "4–6 PM", date: "Yesterday", status: "Picked up" },
    { id: "4", store: "City Restaurant", type: "Surprise Bag", price: "₪18", time: "8–10 PM", date: "3 Apr", status: "Picked up" },
    { id: "5", store: "Al-Andalus Bakery", type: "Surprise Bag", price: "₪12", time: "5–7 PM", date: "1 Apr", status: "Picked up" },
  ],
  donated: [
    { id: "6", store: "Green Market", type: "Specific Parcel", price: "Free", time: "3–5 PM", date: "2 Apr", status: "Received", charity: "Nablus Food Bank" },
    { id: "7", store: "City Restaurant", type: "Surprise Bag", price: "Free", time: "7–9 PM", date: "28 Mar", status: "Received", charity: "Al-Amal Charity" },
  ],
};

const STATUS_COLOR: Record<string, string> = {
  "Ready for pickup": Colors.greenMain,
  "Preparing": Colors.primaryOrange,
  "Picked up": Colors.grayMedium,
  "Received": Colors.greenMain,
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const [activeTab, setActiveTab] = useState<OrderStatus>("active");

  const orders = MOCK_ORDERS[activeTab];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
            {activeTab === t.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {orders.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id} order={order} tab={activeTab} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function OrderCard({ order, tab }: { order: typeof MOCK_ORDERS["active"][0]; tab: OrderStatus }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <View style={styles.cardLeft}>
        <View style={styles.storeIcon}>
          <Feather
            name={tab === "donated" ? "gift" : "shopping-bag"}
            size={20}
            color={Colors.primaryOrange}
          />
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.storeName}>{order.store}</Text>
        <Text style={styles.orderType}>{order.type}</Text>
        {order.charity && (
          <View style={styles.charityRow}>
            <Feather name="heart" size={11} color={Colors.greenMain} />
            <Text style={styles.charityText}>{order.charity}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Feather name="clock" size={12} color={Colors.grayMedium} />
          <Text style={styles.metaText}>{order.time}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.metaText}>{order.date}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.price}>{order.price}</Text>
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[order.status] ?? Colors.grayMedium) + "18" }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[order.status] ?? Colors.grayMedium }]}>
            {order.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ tab }: { tab: OrderStatus }) {
  const msgs: Record<OrderStatus, { icon: string; title: string; sub: string }> = {
    active: { icon: "shopping-bag", title: "No active orders", sub: "Browse stores and reserve a bag to get started" },
    completed: { icon: "check-circle", title: "No completed orders yet", sub: "Your past pickups will appear here" },
    donated: { icon: "gift", title: "No donations yet", sub: "Donate a bag to a charity and track it here" },
  };
  const m = msgs[tab];
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Feather name={m.icon as any} size={32} color={Colors.primaryOrange} />
      </View>
      <Text style={styles.emptyTitle}>{m.title}</Text>
      <Text style={styles.emptySub}>{m.sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.4 },

  tabRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
    backgroundColor: Colors.background,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, position: "relative" },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: "600", color: Colors.grayMedium },
  tabTextActive: { color: Colors.primaryOrange },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: Colors.primaryOrange,
  },

  scroll: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: 100 },

  card: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "center",
  },
  cardLeft: {},
  storeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.orangeLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 3 },
  storeName: { fontSize: 15, fontWeight: "700", color: Colors.grayDark },
  orderType: { fontSize: 12, color: Colors.grayMedium },
  charityRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  charityText: { fontSize: 12, color: Colors.greenMain, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaText: { fontSize: 12, color: Colors.grayMedium },
  dot: { color: Colors.grayMedium },
  cardRight: { alignItems: "flex-end", gap: 6 },
  price: { fontSize: 16, fontWeight: "800", color: Colors.grayDark },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },

  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.orangeLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.grayDark },
  emptySub: { fontSize: 14, color: Colors.grayMedium, textAlign: "center", maxWidth: 240, lineHeight: 20 },
});
