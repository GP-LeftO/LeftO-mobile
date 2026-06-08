import React, { useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAdminUserDetail } from "../../hooks/admin/useAdminUsers";
import type { AdminDocument } from "../../types/admin.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  onBack: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const ROLE_COLORS: Record<string, string> = {
  BUYER:   "#3B82F6",
  SELLER:  Colors.primaryOrange,
  CHARITY: Colors.greenMain,
  ADMIN:   "#8B5CF6",
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  APPROVED: { color: Colors.greenMain,   bg: "#D1FAE5", label: "Approved"    },
  PENDING:  { color: Colors.primaryOrange, bg: "#FFF3E8", label: "Under Review" },
  REJECTED: { color: "#EF4444",          bg: "#FEE2E2", label: "Rejected"    },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  TRADE_LICENSE:        "Trade License",
  HEALTH_CERTIFICATE:   "Health Certificate",
  CHARITY_REGISTRATION: "Charity Registration",
};

const DOC_STATUS_COLORS: Record<string, string> = {
  PENDING:  Colors.primaryOrange,
  APPROVED: Colors.greenMain,
  REJECTED: "#EF4444",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.infoCard}>{children}</View>;
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const rtl = isRTL();
  return (
    <View style={[styles.infoRow, rtl && styles.rowRtl]}>
      <View style={styles.infoIconWrap}>
        <Feather name={icon as any} size={14} color="#9CA3AF" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, rtl && styles.textRtl]}>{value}</Text>
      </View>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function DocumentCard({ doc }: { doc: AdminDocument }) {
  const rtl = isRTL();
  const statusColor = DOC_STATUS_COLORS[doc.status] ?? "#9CA3AF";
  return (
    <View style={styles.docCard}>
      <View style={[styles.docCardHeader, rtl && styles.rowRtl]}>
        <View style={styles.docIconWrap}>
          <Feather name="file-text" size={16} color={Colors.primaryOrange} />
        </View>
        <View style={styles.docCardInfo}>
          <Text style={[styles.docTypeText, rtl && styles.textRtl]}>
            {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
          </Text>
          <View style={[styles.docStatusBadge, { backgroundColor: statusColor + "22" }]}>
            <Text style={[styles.docStatusText, { color: statusColor }]}>{doc.status}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewDocBtn}
          onPress={() => Linking.openURL(doc.fileUrl)}
          activeOpacity={0.7}
        >
          <Feather name="external-link" size={14} color={Colors.primaryOrange} />
          <Text style={styles.viewDocText}>View</Text>
        </TouchableOpacity>
      </View>
      {doc.rejectionReason ? (
        <Text style={styles.rejectionReason}>Reason: {doc.rejectionReason}</Text>
      ) : null}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminUserDetailScreen({ userId, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const rtl    = isRTL();
  const { user, loading, error, load } = useAdminUserDetail(userId);

  useEffect(() => { load(); }, [load]);

  const roleColor = user ? (ROLE_COLORS[user.role] ?? "#9CA3AF") : "#9CA3AF";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, rtl && styles.rowRtl]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather name={rtl ? "chevron-right" : "chevron-left"} size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Detail</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      )}

      {error && !loading && (
        <View style={styles.centered}>
          <Feather name="alert-circle" size={36} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {user && !loading && (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + name block */}
          <View style={styles.profileBlock}>
            <View style={[styles.avatar, { backgroundColor: roleColor + "22" }]}>
              <Text style={[styles.avatarText, { color: roleColor }]}>{initials(user.name)}</Text>
            </View>
            <Text style={[styles.profileName, rtl && styles.textRtl]}>{user.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + "22" }]}>
              <Text style={[styles.roleBadgeText, { color: roleColor }]}>{user.role}</Text>
            </View>
            <Text style={styles.joinedDate}>Joined {formatDate(user.createdAt)}</Text>
          </View>

          {/* Contact info */}
          <SectionLabel label="Contact Information" />
          <InfoCard>
            <InfoRow icon="phone" label="Phone" value={user.phone} />
            {user.email && <InfoRow icon="mail" label="Email" value={user.email} />}
            <InfoRow icon="globe" label="Language" value={user.language === "AR" ? "Arabic" : "English"} />
          </InfoCard>

          {/* Seller profile */}
          {user.seller && (() => {
            const cfg = STATUS_CONFIG[user.seller!.status];
            return (
              <>
                <SectionLabel label="Seller Profile" />
                <InfoCard>
                  <View style={[styles.statusRow, rtl && styles.rowRtl]}>
                    <Text style={styles.statusRowLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  {user.seller!.verifiedBadge && (
                    <View style={[styles.verifiedRow, rtl && styles.rowRtl]}>
                      <Feather name="shield" size={14} color={Colors.greenMain} />
                      <Text style={styles.verifiedText}>Verified Seller</Text>
                    </View>
                  )}
                  <InfoRow icon="briefcase" label="Business Name" value={user.seller!.businessName} />
                  <InfoRow icon="tag"       label="Business Type" value={user.seller!.businessType} />
                </InfoCard>
              </>
            );
          })()}

          {/* Charity profile */}
          {user.charity && (() => {
            const cfg = STATUS_CONFIG[user.charity!.status];
            return (
              <>
                <SectionLabel label="Charity Profile" />
                <InfoCard>
                  <View style={[styles.statusRow, rtl && styles.rowRtl]}>
                    <Text style={styles.statusRowLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  {user.charity!.verifiedBadge && (
                    <View style={[styles.verifiedRow, rtl && styles.rowRtl]}>
                      <Feather name="shield" size={14} color={Colors.greenMain} />
                      <Text style={styles.verifiedText}>Verified Charity</Text>
                    </View>
                  )}
                  <InfoRow icon="heart" label="Org Name" value={user.charity!.orgName} />
                </InfoCard>
              </>
            );
          })()}

          {/* Documents */}
          {user.documents.length > 0 && (
            <>
              <SectionLabel label={`Documents (${user.documents.length})`} />
              <View style={styles.docsContainer}>
                {user.documents.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: "#FAFAF8" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1F2937" },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },

  scrollContent: { padding: Spacing.md, gap: Spacing.sm },

  // Profile block
  profileBlock: { alignItems: "center", paddingVertical: Spacing.md, gap: 8 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center",
  },
  avatarText:   { fontSize: 26, fontWeight: "700" },
  profileName:  { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  roleBadge:    { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
  roleBadgeText: { fontSize: 12, fontWeight: "700" },
  joinedDate:   { fontSize: 12, color: "#9CA3AF" },

  // Section label
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: "#9CA3AF",
    letterSpacing: 0.5, textTransform: "uppercase",
    marginTop: Spacing.xs, marginBottom: 2,
  },

  // Info card
  infoCard: {
    backgroundColor: "#fff", borderRadius: 12,
    padding: Spacing.md, gap: Spacing.sm,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 1 },
    }),
  },
  infoRow:     { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  infoIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" },
  infoContent: { flex: 1 },
  infoLabel:   { fontSize: 11, color: "#9CA3AF", fontWeight: "500", marginBottom: 2 },
  infoValue:   { fontSize: 14, color: "#1F2937", fontWeight: "500" },

  // Status row
  statusRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusRowLabel: { fontSize: 14, color: "#4B5563", fontWeight: "500" },
  statusBadge:    { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  verifiedRow:    { flexDirection: "row", alignItems: "center", gap: 6 },
  verifiedText:   { fontSize: 13, color: Colors.greenMain, fontWeight: "600" },

  // Documents
  docsContainer: { gap: Spacing.xs },
  docCard: {
    backgroundColor: "#fff", borderRadius: 12,
    padding: Spacing.md, gap: 8,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 1 },
    }),
  },
  docCardHeader:  { flexDirection: "row", alignItems: "center", gap: 10 },
  docIconWrap: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: "#FFF3E8",
    alignItems: "center", justifyContent: "center",
  },
  docCardInfo:    { flex: 1, gap: 4 },
  docTypeText:    { fontSize: 13, fontWeight: "600", color: "#1F2937" },
  docStatusBadge: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  docStatusText:  { fontSize: 11, fontWeight: "700" },
  viewDocBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.primaryOrange + "44",
  },
  viewDocText:    { fontSize: 12, fontWeight: "600", color: Colors.primaryOrange },
  rejectionReason: { fontSize: 12, color: "#EF4444", fontStyle: "italic", paddingLeft: 44 },

  // Error
  errorText: { fontSize: 14, color: "#EF4444", textAlign: "center" },
  retryBtn:  { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primaryOrange },
  retryBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },

  // RTL
  rowRtl:  { flexDirection: "row-reverse" },
  textRtl: { textAlign: "right" },
});
