import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Linking, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL, t } from "../../i18n";
import { useAdminSellers, useAdminCharities } from "../../hooks/admin/useAdminPending";
import { useAdminUsers } from "../../hooks/admin/useAdminUsers";
import type { PendingSeller, PendingCharity, AdminUserListItem } from "../../types/admin.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "sellers" | "charities" | "users";

interface Props {
  onLogout: () => void;
  onViewUser: (userId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  RESTAURANT: "Restaurant",
  MARKET: "Market",
  BAKERY: "Bakery",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  TRADE_LICENSE: "Trade License",
  HEALTH_CERTIFICATE: "Health Certificate",
  CHARITY_REGISTRATION: "Charity Registration",
};

const ROLE_COLORS: Record<string, string> = {
  BUYER:   "#3B82F6",
  SELLER:  Colors.primaryOrange,
  CHARITY: Colors.greenMain,
  ADMIN:   "#8B5CF6",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

function DocumentRow({ label, url }: { label: string; url: string }) {
  return (
    <TouchableOpacity
      style={styles.docRow}
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.7}
    >
      <Feather name="file-text" size={14} color={Colors.primaryOrange} />
      <Text style={styles.docLabel}>{label}</Text>
      <Feather name="external-link" size={13} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

// ─── Pending Seller Card ──────────────────────────────────────────────────────

interface SellerCardProps {
  item: PendingSeller;
  actionId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function SellerCard({ item, actionId, onApprove, onReject }: SellerCardProps) {
  const rtl = isRTL();
  const busy = actionId === item.id;

  const confirmApprove = () =>
    Alert.alert("Approve Seller", `Approve "${item.businessName}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", style: "default", onPress: () => onApprove(item.id) },
    ]);

  const confirmReject = () =>
    Alert.alert("Reject Seller", `Reject "${item.businessName}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: () => onReject(item.id) },
    ]);

  return (
    <Animated.View entering={FadeInDown} style={styles.card}>
      {/* Card header */}
      <View style={[styles.cardHeader, rtl && styles.rowRtl]}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials(item.businessName)}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={[styles.cardName, rtl && styles.textRtl]}>{item.businessName}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{BUSINESS_TYPE_LABELS[item.businessType] ?? item.businessType}</Text>
          </View>
        </View>
      </View>

      {/* Owner info */}
      <View style={styles.infoSection}>
        <InfoRow icon="user"  value={item.user.name} rtl={rtl} />
        <InfoRow icon="phone" value={item.user.phone} rtl={rtl} />
        {item.user.email ? <InfoRow icon="mail" value={item.user.email} rtl={rtl} /> : null}
        {item.address ? <InfoRow icon="map-pin" value={item.address} rtl={rtl} /> : null}
      </View>

      {/* Documents */}
      {item.user.documents.length > 0 && (
        <View style={styles.docsSection}>
          {item.user.documents.map(doc => (
            <DocumentRow
              key={doc.id}
              label={DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
              url={doc.fileUrl}
            />
          ))}
        </View>
      )}

      {/* Applied date */}
      <Text style={styles.dateText}>Applied {formatDate(item.createdAt)}</Text>

      {/* Actions */}
      <View style={[styles.actionRow, rtl && styles.rowRtl]}>
        <TouchableOpacity
          style={[styles.rejectBtn, busy && styles.btnDisabled]}
          onPress={confirmReject}
          disabled={busy}
          activeOpacity={0.8}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <Feather name="x-circle" size={15} color="#EF4444" />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.approveBtn, busy && styles.btnDisabled]}
          onPress={confirmApprove}
          disabled={busy}
          activeOpacity={0.8}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="check-circle" size={15} color="#fff" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Pending Charity Card ─────────────────────────────────────────────────────

interface CharityCardProps {
  item: PendingCharity;
  actionId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function CharityCard({ item, actionId, onApprove, onReject }: CharityCardProps) {
  const rtl = isRTL();
  const busy = actionId === item.id;

  const confirmApprove = () =>
    Alert.alert("Approve Charity", `Approve "${item.orgName}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Approve", style: "default", onPress: () => onApprove(item.id) },
    ]);

  const confirmReject = () =>
    Alert.alert("Reject Charity", `Reject "${item.orgName}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Reject", style: "destructive", onPress: () => onReject(item.id) },
    ]);

  return (
    <Animated.View entering={FadeInDown} style={styles.card}>
      <View style={[styles.cardHeader, rtl && styles.rowRtl]}>
        <View style={[styles.avatarCircle, { backgroundColor: "#D1FAE5" }]}>
          <Text style={[styles.avatarText, { color: Colors.greenMain }]}>{initials(item.orgName)}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={[styles.cardName, rtl && styles.textRtl]}>{item.orgName}</Text>
          <View style={[styles.typeBadge, { backgroundColor: "#D1FAE5" }]}>
            <Text style={[styles.typeBadgeText, { color: Colors.greenMain }]}>{item.region}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoSection}>
        <InfoRow icon="user"  value={item.user.name} rtl={rtl} />
        <InfoRow icon="phone" value={item.user.phone} rtl={rtl} />
        {item.user.email ? <InfoRow icon="mail" value={item.user.email} rtl={rtl} /> : null}
        {item.description ? <InfoRow icon="info" value={item.description} rtl={rtl} /> : null}
      </View>

      {item.user.documents.length > 0 && (
        <View style={styles.docsSection}>
          {item.user.documents.map(doc => (
            <DocumentRow
              key={doc.id}
              label={DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
              url={doc.fileUrl}
            />
          ))}
        </View>
      )}

      <Text style={styles.dateText}>Applied {formatDate(item.createdAt)}</Text>

      <View style={[styles.actionRow, rtl && styles.rowRtl]}>
        <TouchableOpacity
          style={[styles.rejectBtn, busy && styles.btnDisabled]}
          onPress={confirmReject}
          disabled={busy}
          activeOpacity={0.8}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <Feather name="x-circle" size={15} color="#EF4444" />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.approveBtn, busy && styles.btnDisabled]}
          onPress={confirmApprove}
          disabled={busy}
          activeOpacity={0.8}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="check-circle" size={15} color="#fff" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, value, rtl }: { icon: string; value: string; rtl: boolean }) {
  return (
    <View style={[styles.infoRow, rtl && styles.rowRtl]}>
      <Feather name={icon as any} size={13} color="#9CA3AF" />
      <Text style={[styles.infoText, rtl && styles.textRtl]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({ item, onPress }: { item: AdminUserListItem; onPress: () => void }) {
  const rtl = isRTL();
  return (
    <TouchableOpacity style={[styles.userRow, rtl && styles.rowRtl]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.userAvatar, { backgroundColor: ROLE_COLORS[item.role] + "22" }]}>
        <Text style={[styles.userAvatarText, { color: ROLE_COLORS[item.role] }]}>{initials(item.name)}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, rtl && styles.textRtl]}>{item.name}</Text>
        <Text style={styles.userPhone}>{item.phone}</Text>
        {item.email ? <Text style={styles.userEmail}>{item.email}</Text> : null}
      </View>
      <View style={styles.userRight}>
        <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] + "22" }]}>
          <Text style={[styles.roleBadgeText, { color: ROLE_COLORS[item.role] }]}>{item.role}</Text>
        </View>
        <Feather name={rtl ? "chevron-left" : "chevron-right"} size={16} color="#D1D5DB" style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Feather name={icon as any} size={40} color="#E5E7EB" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminDashboardScreen({ onLogout, onViewUser }: Props) {
  const insets = useSafeAreaInsets();
  const rtl    = isRTL();
  const [activeTab, setActiveTab] = useState<Tab>("sellers");

  const sellers   = useAdminSellers();
  const charities = useAdminCharities();
  const users     = useAdminUsers();

  // Lazy-load each tab on first visit
  useEffect(() => {
    if (activeTab === "sellers"   && !sellers.sellers.length   && !sellers.loading)   sellers.load();
    if (activeTab === "charities" && !charities.charities.length && !charities.loading) charities.load();
    if (activeTab === "users"     && !users.users.length       && !users.loading)     users.load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleLogout = () =>
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: onLogout },
    ]);

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "sellers",   label: "Sellers",   badge: sellers.sellers.length   },
    { key: "charities", label: "Charities", badge: charities.charities.length },
    { key: "users",     label: "Users" },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, rtl && styles.rowRtl]}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>LeftO Management</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Feather name="log-out" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.badge !== undefined && tab.badge > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Sellers tab */}
      {activeTab === "sellers" && (
        sellers.loading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primaryOrange} />
        ) : sellers.error ? (
          <ErrorRetry message={sellers.error} onRetry={() => sellers.load()} />
        ) : (
          <FlatList
            data={sellers.sellers}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <SectionHeader title="Pending Seller Applications" count={sellers.sellers.length} />
            }
            ListEmptyComponent={
              <EmptyState icon="check-circle" message="No pending seller applications" />
            }
            renderItem={({ item }) => (
              <SellerCard
                item={item}
                actionId={sellers.actionId}
                onApprove={sellers.approve}
                onReject={sellers.reject}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={sellers.refreshing}
                onRefresh={sellers.refresh}
                tintColor={Colors.primaryOrange}
              />
            }
          />
        )
      )}

      {/* Charities tab */}
      {activeTab === "charities" && (
        charities.loading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primaryOrange} />
        ) : charities.error ? (
          <ErrorRetry message={charities.error} onRetry={() => charities.load()} />
        ) : (
          <FlatList
            data={charities.charities}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <SectionHeader title="Pending Charity Applications" count={charities.charities.length} />
            }
            ListEmptyComponent={
              <EmptyState icon="check-circle" message="No pending charity applications" />
            }
            renderItem={({ item }) => (
              <CharityCard
                item={item}
                actionId={charities.actionId}
                onApprove={charities.approve}
                onReject={charities.reject}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={charities.refreshing}
                onRefresh={charities.refresh}
                tintColor={Colors.primaryOrange}
              />
            }
          />
        )
      )}

      {/* Users tab */}
      {activeTab === "users" && (
        users.loading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primaryOrange} />
        ) : users.error ? (
          <ErrorRetry message={users.error} onRetry={() => users.load()} />
        ) : (
          <FlatList
            data={users.users}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <SectionHeader title="All Users" count={users.users.length} />
            }
            ListEmptyComponent={
              <EmptyState icon="users" message="No users found" />
            }
            renderItem={({ item }) => (
              <UserRow item={item} onPress={() => onViewUser(item.id)} />
            )}
            onEndReached={users.loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              users.loadingMore ? (
                <ActivityIndicator style={{ paddingVertical: 16 }} color={Colors.primaryOrange} />
              ) : null
            }
            refreshControl={
              <RefreshControl
                refreshing={users.refreshing}
                onRefresh={users.refresh}
                tintColor={Colors.primaryOrange}
              />
            }
          />
        )
      )}
    </View>
  );
}

// ─── Error + Retry ────────────────────────────────────────────────────────────

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Feather name="alert-circle" size={36} color="#EF4444" />
      <Text style={[styles.emptyText, { color: "#EF4444" }]}>{message}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.retryBtnText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  headerTitle:    { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  headerSubtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#FEE2E2",
    alignItems: "center", justifyContent: "center",
  },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  tabItem: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, gap: 6,
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabItemActive:  { borderBottomColor: Colors.primaryOrange },
  tabLabel:       { fontSize: 13, fontWeight: "500", color: "#9CA3AF" },
  tabLabelActive: { color: Colors.primaryOrange, fontWeight: "700" },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center", justifyContent: "center",
  },
  tabBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  // List
  listContent: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: Spacing.xs },
  sectionTitle:  { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  countBadge: {
    backgroundColor: Colors.primaryOrange + "22",
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  countBadgeText: { fontSize: 12, fontWeight: "700", color: Colors.primaryOrange },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardHeader:     { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  cardHeaderInfo: { flex: 1, gap: 4 },
  cardName:       { fontSize: 16, fontWeight: "700", color: "#1F2937" },

  // Avatar
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#FFE8D6",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: Colors.primaryOrange },

  // Type badge
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF3E8",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  typeBadgeText: { fontSize: 11, fontWeight: "600", color: Colors.primaryOrange },

  // Info section
  infoSection: { gap: 6 },
  infoRow:     { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText:    { fontSize: 13, color: "#4B5563", flex: 1 },

  // Documents
  docsSection: {
    backgroundColor: "#F9FAFB", borderRadius: 8,
    padding: Spacing.sm, gap: 6,
  },
  docRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  docLabel: { fontSize: 13, color: "#374151", flex: 1 },

  // Date
  dateText: { fontSize: 12, color: "#9CA3AF" },

  // Action buttons
  actionRow: {
    flexDirection: "row", gap: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1, borderTopColor: "#F3F4F6",
  },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  rejectBtnText:  { fontSize: 14, fontWeight: "600", color: "#EF4444" },
  approveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10,
    borderRadius: 10, backgroundColor: Colors.greenMain,
  },
  approveBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  btnDisabled:    { opacity: 0.5 },

  // User row
  userRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: "#fff", borderRadius: 12, padding: Spacing.md,
    marginBottom: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 1 },
    }),
  },
  userAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  userAvatarText: { fontSize: 15, fontWeight: "700" },
  userInfo: { flex: 1, gap: 2 },
  userName:  { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  userPhone: { fontSize: 12, color: "#6B7280" },
  userEmail: { fontSize: 12, color: "#9CA3AF" },
  userRight: { alignItems: "flex-end", gap: 2 },
  roleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleBadgeText: { fontSize: 10, fontWeight: "700" },

  // Empty + error
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText:  { fontSize: 14, color: "#9CA3AF", textAlign: "center" },
  retryBtn: {
    marginTop: 4, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 10, backgroundColor: Colors.primaryOrange,
  },
  retryBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },

  // RTL
  rowRtl:  { flexDirection: "row-reverse" },
  textRtl: { textAlign: "right" },
});
