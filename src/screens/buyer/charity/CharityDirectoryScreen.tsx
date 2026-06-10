import React, { useState, useMemo } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Modal, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { isRTL } from "../../../i18n";
import { useCharities } from "../../../hooks/buyer/useCharities";
import CharityPublicProfileScreen from "./CharityPublicProfileScreen";
import type { CharitySummary } from "../../../services/buyer/charity.service";

interface Props {
  onClose: () => void;
}

function TrustBadge({ score }: { score: number }) {
  const { color, label } =
    score >= 80 ? { color: Colors.greenMain,     label: "⭐ موثوق جداً" }
  : score >= 60 ? { color: Colors.primaryOrange, label: "✓ موثوق" }
  :               { color: Colors.grayMedium,    label: "جديد" };
  return (
    <View style={[badgeStyles.pill, { backgroundColor: color + "18", borderColor: color }]}>
      <Text style={[badgeStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  pill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1.5 },
  text: { fontSize: 12, fontWeight: "700" },
});

function CharityCard({ item, onPress, rtl }: { item: CharitySummary; onPress: () => void; rtl: boolean }) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[cardStyles.row, rtl && { flexDirection: "row-reverse" }]}>
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.initial}>{item.orgName[0]}</Text>
        </View>
        <View style={[cardStyles.body, rtl && { alignItems: "flex-end" }]}>
          <View style={[cardStyles.nameRow, rtl && { flexDirection: "row-reverse" }]}>
            <Text style={[cardStyles.name, rtl && { textAlign: "right" }]} numberOfLines={1}>{item.orgName}</Text>
            {item.verifiedBadge && <Feather name="check-circle" size={14} color={Colors.greenMain} />}
          </View>
          {item.region ? (
            <Text style={[cardStyles.region, rtl && { textAlign: "right" }]}>{item.region}</Text>
          ) : null}
          <View style={[cardStyles.footer, rtl && { flexDirection: "row-reverse" }]}>
            <TrustBadge score={item.trustScore} />
            <Text style={cardStyles.donations}>{item.totalDonations} تبرع</Text>
          </View>
        </View>
        <Feather name={rtl ? "chevron-left" : "chevron-right"} size={16} color={Colors.grayLight} />
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.greenLight, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  initial: { fontSize: 20, fontWeight: "800", color: Colors.greenMain },
  body: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "700", color: Colors.grayDark, flex: 1 },
  region: { fontSize: 12, color: Colors.grayMedium },
  footer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  donations: { fontSize: 12, color: Colors.grayMedium, fontWeight: "600" },
});

export default function CharityDirectoryScreen({ onClose }: Props) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const { charities, loading, error, refresh } = useCharities();

  const [search,       setSearch]       = useState("");
  const [selectedId,   setSelectedId]   = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return charities;
    const q = search.toLowerCase();
    return charities.filter(c =>
      c.orgName.toLowerCase().includes(q) ||
      (c.region ?? "").toLowerCase().includes(q)
    );
  }, [charities, search]);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "ios" ? insets.top : 0 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={22} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, rtl && styles.rtl]}>الجمعيات المعتمدة ✅</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={Colors.grayMedium} />
        <TextInput
          style={[styles.searchInput, rtl && styles.rtl]}
          placeholder={rtl ? "ابحث بالاسم أو المنطقة..." : "Search by name or region..."}
          placeholderTextColor={Colors.grayMedium}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
            <Feather name="x-circle" size={16} color={Colors.grayMedium} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
          <Text style={styles.errorText}>تعذّر تحميل الجمعيات</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CharityCard
              item={item}
              onPress={() => setSelectedId(item.id)}
              rtl={rtl}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{rtl ? "لا توجد نتائج" : "No results"}</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Charity profile modal */}
      <Modal visible={!!selectedId} animationType="slide" onRequestClose={() => setSelectedId(null)}>
        {selectedId && (
          <CharityPublicProfileScreen
            charityId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
    backgroundColor: Colors.white,
  },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.grayDark },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    margin: Spacing.md, paddingHorizontal: Spacing.md, paddingVertical: 10,
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.grayDark },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: Spacing.xl },
  errorText: { fontSize: 14, color: Colors.grayMedium },
  emptyText: { fontSize: 14, color: Colors.grayMedium },
  retryBtn: { backgroundColor: Colors.primaryOrange, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },
});
