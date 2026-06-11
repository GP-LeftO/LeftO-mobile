import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Linking, Platform,
  TextInput, Modal, ScrollView, KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAdminSellers, useAdminCharities } from "../../hooks/admin/useAdminPending";
import { useAdminUsers } from "../../hooks/admin/useAdminUsers";
import { useAdminStats } from "../../hooks/admin/useAdminStats";
import { sendOtp, verifyOtp, register } from "../../services/auth/auth.service";
import type {
  PendingSeller, PendingCharity, AdminUserListItem, AdminChartPoint,
} from "../../types/admin.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "sellers" | "charities" | "users";
type NewUserRole = "BUYER" | "SELLER" | "CHARITY";

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

function formatMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  RESTAURANT: "Restaurant", MARKET: "Market", BAKERY: "Bakery",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  TRADE_LICENSE: "Trade License",
  HEALTH_CERTIFICATE: "Health Certificate",
  CHARITY_REGISTRATION: "Charity Registration",
};

const ROLE_COLORS: Record<string, string> = {
  BUYER: "#3B82F6", SELLER: Colors.primaryOrange,
  CHARITY: Colors.greenMain, ADMIN: "#8B5CF6",
};

// ─── Shared Sub-components ────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && count > 0 && (
        <View style={styles.countBadge}><Text style={styles.countBadgeText}>{count}</Text></View>
      )}
    </View>
  );
}

function DocumentRow({ label, url }: { label: string; url: string }) {
  return (
    <TouchableOpacity style={styles.docRow} onPress={() => Linking.openURL(url)} activeOpacity={0.7}>
      <Feather name="file-text" size={14} color={Colors.primaryOrange} />
      <Text style={styles.docLabel}>{label}</Text>
      <Feather name="external-link" size={13} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

function InfoRow({ icon, value, rtl }: { icon: string; value: string; rtl: boolean }) {
  return (
    <View style={[styles.infoRow, rtl && styles.rowRtl]}>
      <Feather name={icon as any} size={13} color="#9CA3AF" />
      <Text style={[styles.infoText, rtl && styles.textRtl]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

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

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={styles.emptyState}>
      <Feather name={icon as any} size={40} color="#E5E7EB" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ─── Overview Components ──────────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon: string; label: string; value: string | number; color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "22" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function MiniBarChart({ data, field, color, label }: {
  data: AdminChartPoint[];
  field: keyof Omit<AdminChartPoint, "month">;
  color: string;
  label: string;
}) {
  const max = Math.max(...data.map(d => d[field] as number), 1);
  return (
    <View style={styles.chartWrap}>
      <Text style={styles.chartLabel}>{label}</Text>
      <View style={styles.chartBars}>
        {data.map(d => {
          const val = d[field] as number;
          const pct = Math.round((val / max) * 100);
          return (
            <View key={d.month} style={styles.chartBarCol}>
              <Text style={styles.chartBarVal}>{val}</Text>
              <View style={styles.chartBarTrack}>
                <View style={[styles.chartBarFill, { height: `${pct}%` as any, backgroundColor: color }]} />
              </View>
              <Text style={styles.chartBarMonth}>{formatMonth(d.month)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function BestCard({ title, name, sub, icon, color }: {
  title: string; name: string; sub: string; icon: string; color: string;
}) {
  return (
    <View style={[styles.bestCard, { borderTopColor: color }]}>
      <Text style={styles.bestTitle}>{title}</Text>
      <View style={styles.bestInner}>
        <View style={[styles.bestAvatar, { backgroundColor: color + "22" }]}>
          <Feather name={icon as any} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bestName} numberOfLines={1}>{name}</Text>
          <Text style={styles.bestSub} numberOfLines={1}>{sub}</Text>
        </View>
      </View>
    </View>
  );
}

function OverviewTab() {
  const { stats, charts, bestRated, loading, error, load } = useAdminStats();
  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primaryOrange} />;
  if (error)   return <ErrorRetry message={error} onRetry={load} />;
  if (!stats)  return null;

  return (
    <ScrollView contentContainerStyle={styles.overviewContent} showsVerticalScrollIndicator={false}>
      <SectionHeader title="Platform Stats" />
      <View style={styles.statsGrid}>
        <StatCard icon="users"        label="Total Users"     value={stats.users.total}             color="#3B82F6" />
        <StatCard icon="package"      label="Active Listings" value={stats.listings.active}         color={Colors.primaryOrange} />
        <StatCard icon="check-circle" label="Completed Orders" value={stats.orders.completed}       color={Colors.greenMain} />
        <StatCard icon="wind"         label="CO₂ Saved (kg)"  value={stats.impact.totalCo2SavedKg}  color="#8B5CF6" />
        <StatCard icon="heart"        label="Donations"       value={stats.donations.confirmed}     color="#EF4444" />
        <StatCard icon="shopping-bag" label="Items Saved"     value={stats.impact.totalItemsSaved}  color="#F59E0B" />
      </View>

      <View style={styles.userBreakdown}>
        {[
          { label: "Buyers",    count: stats.users.buyers,    color: "#3B82F6" },
          { label: "Sellers",   count: stats.users.sellers,   color: Colors.primaryOrange },
          { label: "Charities", count: stats.users.charities, color: Colors.greenMain },
        ].map(item => (
          <View key={item.label} style={styles.breakdownItem}>
            <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
            <Text style={styles.breakdownLabel}>{item.label}</Text>
            <Text style={[styles.breakdownCount, { color: item.color }]}>{item.count}</Text>
          </View>
        ))}
      </View>

      {charts.length > 0 && (
        <View style={styles.chartsSection}>
          <SectionHeader title="6-Month Trends" />
          <MiniBarChart data={charts} field="completedOrders" color={Colors.greenMain}     label="Completed Orders" />
          <MiniBarChart data={charts} field="listingsCreated" color={Colors.primaryOrange} label="Listings Created" />
          <MiniBarChart data={charts} field="newUsers"        color="#3B82F6"              label="New Users" />
        </View>
      )}

      {bestRated && (
        <View style={styles.bestSection}>
          <SectionHeader title="Top Performers" />
          <View style={styles.bestRow}>
            {bestRated.bestSeller && (
              <BestCard
                title="Top Seller"
                name={bestRated.bestSeller.businessName}
                sub={`⭐ ${bestRated.bestSeller.rating.toFixed(1)} · ${bestRated.bestSeller.address}`}
                icon="star" color={Colors.primaryOrange}
              />
            )}
            {bestRated.bestCharity && (
              <BestCard
                title="Top Charity"
                name={bestRated.bestCharity.orgName}
                sub={`${bestRated.bestCharity._count.donations} donations · ${bestRated.bestCharity.region}`}
                icon="heart" color={Colors.greenMain}
              />
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Seller Card ──────────────────────────────────────────────────────────────

function SellerCard({ item, actionId, onApprove, onReject }: {
  item: PendingSeller;
  actionId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const rtl = isRTL();
  const busy = actionId === item.id;
  return (
    <Animated.View entering={FadeInDown} style={styles.card}>
      <View style={[styles.cardHeader, rtl && styles.rowRtl]}>
        <View style={styles.avatarCircle}><Text style={styles.avatarText}>{initials(item.businessName)}</Text></View>
        <View style={styles.cardHeaderInfo}>
          <Text style={[styles.cardName, rtl && styles.textRtl]}>{item.businessName}</Text>
          <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{BUSINESS_TYPE_LABELS[item.businessType] ?? item.businessType}</Text></View>
        </View>
      </View>
      <View style={styles.infoSection}>
        <InfoRow icon="user"    value={item.user.name}  rtl={rtl} />
        <InfoRow icon="phone"   value={item.user.phone} rtl={rtl} />
        {item.user.email ? <InfoRow icon="mail"    value={item.user.email} rtl={rtl} /> : null}
        {item.address   ? <InfoRow icon="map-pin"  value={item.address}    rtl={rtl} /> : null}
      </View>
      {item.user.documents.length > 0 && (
        <View style={styles.docsSection}>
          {item.user.documents.map(doc => (
            <DocumentRow key={doc.id} label={DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType} url={doc.fileUrl} />
          ))}
        </View>
      )}
      <Text style={styles.dateText}>Applied {formatDate(item.createdAt)}</Text>
      <View style={[styles.actionRow, rtl && styles.rowRtl]}>
        <TouchableOpacity style={[styles.rejectBtn, busy && styles.btnDisabled]} disabled={busy} activeOpacity={0.8}
          onPress={() => Alert.alert("Reject Seller", `Reject "${item.businessName}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Reject", style: "destructive", onPress: () => onReject(item.id) },
          ])}>
          {busy ? <ActivityIndicator size="small" color="#EF4444" /> : <><Feather name="x-circle" size={15} color="#EF4444" /><Text style={styles.rejectBtnText}>Reject</Text></>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.approveBtn, busy && styles.btnDisabled]} disabled={busy} activeOpacity={0.8}
          onPress={() => Alert.alert("Approve Seller", `Approve "${item.businessName}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Approve", style: "default", onPress: () => onApprove(item.id) },
          ])}>
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <><Feather name="check-circle" size={15} color="#fff" /><Text style={styles.approveBtnText}>Approve</Text></>}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Charity Card ─────────────────────────────────────────────────────────────

function CharityCard({ item, actionId, onApprove, onReject }: {
  item: PendingCharity;
  actionId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const rtl = isRTL();
  const busy = actionId === item.id;
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
        <InfoRow icon="user"  value={item.user.name}  rtl={rtl} />
        <InfoRow icon="phone" value={item.user.phone} rtl={rtl} />
        {item.user.email  ? <InfoRow icon="mail" value={item.user.email}   rtl={rtl} /> : null}
        {item.description ? <InfoRow icon="info" value={item.description}  rtl={rtl} /> : null}
      </View>
      {item.user.documents.length > 0 && (
        <View style={styles.docsSection}>
          {item.user.documents.map(doc => (
            <DocumentRow key={doc.id} label={DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType} url={doc.fileUrl} />
          ))}
        </View>
      )}
      <Text style={styles.dateText}>Applied {formatDate(item.createdAt)}</Text>
      <View style={[styles.actionRow, rtl && styles.rowRtl]}>
        <TouchableOpacity style={[styles.rejectBtn, busy && styles.btnDisabled]} disabled={busy} activeOpacity={0.8}
          onPress={() => Alert.alert("Reject Charity", `Reject "${item.orgName}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Reject", style: "destructive", onPress: () => onReject(item.id) },
          ])}>
          {busy ? <ActivityIndicator size="small" color="#EF4444" /> : <><Feather name="x-circle" size={15} color="#EF4444" /><Text style={styles.rejectBtnText}>Reject</Text></>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.approveBtn, busy && styles.btnDisabled]} disabled={busy} activeOpacity={0.8}
          onPress={() => Alert.alert("Approve Charity", `Approve "${item.orgName}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Approve", style: "default", onPress: () => onApprove(item.id) },
          ])}>
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <><Feather name="check-circle" size={15} color="#fff" /><Text style={styles.approveBtnText}>Approve</Text></>}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({ item, onPress, onUnblock, onDelete, actionId }: {
  item: AdminUserListItem;
  onPress: () => void;
  onUnblock: (id: string) => void;
  onDelete: (id: string) => void;
  actionId: string | null;
}) {
  const rtl  = isRTL();
  const busy = actionId === item.id;
  return (
    <View style={styles.userCard}>
      <TouchableOpacity style={[styles.userRowInner, rtl && styles.rowRtl]} onPress={onPress} activeOpacity={0.75}>
        <View style={[styles.userAvatar, { backgroundColor: ROLE_COLORS[item.role] + "22" }]}>
          <Text style={[styles.userAvatarText, { color: ROLE_COLORS[item.role] }]}>{initials(item.name)}</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={[styles.userNameRow, rtl && styles.rowRtl]}>
            <Text style={[styles.userName, rtl && styles.textRtl]}>{item.name}</Text>
            {item.isBlocked && (
              <View style={styles.blockedBadge}><Text style={styles.blockedBadgeText}>Blocked</Text></View>
            )}
          </View>
          <Text style={styles.userPhone}>{item.phone}</Text>
          {item.email ? <Text style={styles.userEmail}>{item.email}</Text> : null}
        </View>
        <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] + "22" }]}>
          <Text style={[styles.roleBadgeText, { color: ROLE_COLORS[item.role] }]}>{item.role}</Text>
        </View>
      </TouchableOpacity>
      <View style={[styles.userActions, rtl && styles.rowRtl]}>
        {item.isBlocked && (
          <TouchableOpacity
            style={[styles.unblockBtn, busy && styles.btnDisabled]}
            disabled={busy} activeOpacity={0.8}
            onPress={() => Alert.alert("Unblock User", `Unblock ${item.name}?`, [
              { text: "Cancel", style: "cancel" },
              { text: "Unblock", onPress: () => onUnblock(item.id) },
            ])}
          >
            {busy
              ? <ActivityIndicator size="small" color={Colors.greenMain} />
              : <><Feather name="unlock" size={13} color={Colors.greenMain} /><Text style={styles.unblockBtnText}>Unblock</Text></>
            }
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.deleteBtn, busy && styles.btnDisabled]}
          disabled={busy} activeOpacity={0.8}
          onPress={() => Alert.alert("Delete User", `Permanently delete ${item.name}?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => onDelete(item.id) },
          ])}
        >
          {busy
            ? <ActivityIndicator size="small" color="#EF4444" />
            : <><Feather name="trash-2" size={13} color="#EF4444" /><Text style={styles.deleteBtnText}>Delete</Text></>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Add User Modal ───────────────────────────────────────────────────────────

function AddUserModal({ visible, onClose, onSuccess }: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const rtl = isRTL();
  const [step, setStep]         = useState<"form" | "otp">("form");
  const [phone, setPhone]       = useState("");
  const [name, setName]         = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState<NewUserRole>("BUYER");
  const [otp, setOtp]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const reset = () => {
    setStep("form"); setPhone(""); setName(""); setPassword("");
    setRole("BUYER"); setOtp(""); setError("");
  };

  const handleSendOtp = async () => {
    if (!phone.trim() || !name.trim() || !password.trim()) {
      setError("All fields are required."); return;
    }
    setLoading(true); setError("");
    try {
      await sendOtp(phone.trim());
      setStep("otp");
    } catch {
      setError("Could not send OTP. Check the phone number.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!otp.trim()) { setError("Enter the OTP code."); return; }
    setLoading(true); setError("");
    try {
      await verifyOtp(phone.trim(), otp.trim());
      await register({ phone: phone.trim(), name: name.trim(), password: password.trim(), role });
      Alert.alert("Success", `${role} account created for ${name}.`);
      reset();
      onSuccess();
    } catch (e: unknown) {
      const status = (e as any)?.response?.status;
      if (status === 409)      setError("Phone number already registered.");
      else if (status === 400) setError("Invalid OTP code.");
      else                     setError("Could not create account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.modalSheet}>
          <View style={[styles.modalHeader, rtl && styles.rowRtl]}>
            <Text style={styles.modalTitle}>Add New User</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }} activeOpacity={0.7}>
              <Feather name="x" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {step === "form" ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput style={[styles.fieldInput, rtl && styles.textRtl]} placeholder="05XXXXXXXX"
                value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput style={[styles.fieldInput, rtl && styles.textRtl]} placeholder="Ahmad Ali"
                value={name} onChangeText={setName} />

              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput style={[styles.fieldInput, rtl && styles.textRtl]} placeholder="Min 8 characters"
                value={password} onChangeText={setPassword} secureTextEntry />

              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.roleChips}>
                {(["BUYER", "SELLER", "CHARITY"] as NewUserRole[]).map(r => (
                  <TouchableOpacity key={r}
                    style={[styles.roleChip, role === r && { backgroundColor: ROLE_COLORS[r], borderColor: ROLE_COLORS[r] }]}
                    onPress={() => setRole(r)} activeOpacity={0.8}
                  >
                    <Text style={[styles.roleChipText, role === r && { color: "#fff" }]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!!error && <Text style={styles.modalError}>{error}</Text>}

              <TouchableOpacity style={[styles.modalPrimary, loading && styles.btnDisabled]}
                onPress={handleSendOtp} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalPrimaryText}>Send OTP →</Text>}
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.otpHint}>
                OTP sent to <Text style={{ fontWeight: "700" }}>{phone}</Text>.{"\n"}
                Check Railway logs in dev, or SMS in production.
              </Text>

              <Text style={styles.fieldLabel}>OTP Code</Text>
              <TextInput style={[styles.fieldInput, { letterSpacing: 6, textAlign: "center" }]}
                placeholder="000000" value={otp} onChangeText={setOtp}
                keyboardType="number-pad" maxLength={6} />

              {!!error && <Text style={styles.modalError}>{error}</Text>}

              <TouchableOpacity style={[styles.modalPrimary, loading && styles.btnDisabled]}
                onPress={handleCreate} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalPrimaryText}>Create Account</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backLink} onPress={() => { setStep("form"); setError(""); }}>
                <Text style={styles.backLinkText}>← Back</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ onViewUser }: { onViewUser: (id: string) => void }) {
  const users = useAdminUsers();
  const rtl   = isRTL();
  const [showAdd, setShowAdd]       = useState(false);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [blockedOnly, setBlockedOnly] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { users.load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applySearch = (text: string, role: string, blocked: boolean) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      users.applyFilters({
        search:    text || undefined,
        role:      (role as any) || undefined,
        isBlocked: blocked || undefined,
      });
    }, 400);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.searchWrap, rtl && styles.rowRtl]}>
        <Feather name="search" size={16} color="#9CA3AF" />
        <TextInput
          style={[styles.searchInput, rtl && styles.textRtl]}
          placeholder="Search name, phone, email…"
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={t => { setSearchText(t); applySearch(t, roleFilter, blockedOnly); }}
        />
        {!!searchText && (
          <TouchableOpacity onPress={() => { setSearchText(""); applySearch("", roleFilter, blockedOnly); }}>
            <Feather name="x" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {["BUYER", "SELLER", "CHARITY", "ADMIN"].map(r => (
          <TouchableOpacity key={r}
            style={[styles.filterChip, roleFilter === r && { backgroundColor: ROLE_COLORS[r], borderColor: ROLE_COLORS[r] }]}
            onPress={() => {
              const next = roleFilter === r ? "" : r;
              setRoleFilter(next);
              applySearch(searchText, next, blockedOnly);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, roleFilter === r && { color: "#fff" }]}>{r}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterChip, blockedOnly && { backgroundColor: "#EF4444", borderColor: "#EF4444" }]}
          onPress={() => { const n = !blockedOnly; setBlockedOnly(n); applySearch(searchText, roleFilter, n); }}
          activeOpacity={0.8}
        >
          <Feather name="slash" size={12} color={blockedOnly ? "#fff" : "#6B7280"} />
          <Text style={[styles.filterChipText, blockedOnly && { color: "#fff" }]}>Blocked</Text>
        </TouchableOpacity>
      </ScrollView>

      {users.loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primaryOrange} />
      ) : users.error ? (
        <ErrorRetry message={users.error} onRetry={() => users.load()} />
      ) : (
        <FlatList
          data={users.users}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<SectionHeader title="All Users" count={users.users.length} />}
          ListEmptyComponent={<EmptyState icon="users" message="No users found" />}
          renderItem={({ item }) => (
            <UserRow
              item={item}
              onPress={() => onViewUser(item.id)}
              onUnblock={users.unblock}
              onDelete={users.remove}
              actionId={users.actionId}
            />
          )}
          onEndReached={users.loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            users.loadingMore
              ? <ActivityIndicator style={{ paddingVertical: 16 }} color={Colors.primaryOrange} />
              : null
          }
          refreshControl={
            <RefreshControl refreshing={users.refreshing} onRefresh={users.refresh} tintColor={Colors.primaryOrange} />
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Feather name="user-plus" size={22} color="#fff" />
      </TouchableOpacity>

      <AddUserModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => { setShowAdd(false); users.refresh(); }}
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminDashboardScreen({ onLogout, onViewUser }: Props) {
  const insets = useSafeAreaInsets();
  const rtl    = isRTL();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const sellers   = useAdminSellers();
  const charities = useAdminCharities();

  useEffect(() => {
    if (activeTab === "sellers"   && !sellers.sellers.length   && !sellers.loading)     sellers.load();
    if (activeTab === "charities" && !charities.charities.length && !charities.loading) charities.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "overview",  label: "Overview" },
    { key: "sellers",   label: "Sellers",   badge: sellers.sellers.length },
    { key: "charities", label: "Charities", badge: charities.charities.length },
    { key: "users",     label: "Users" },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={[styles.header, rtl && styles.rowRtl]}>
        <View>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>LeftO Management</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7}
          onPress={() => Alert.alert("Sign Out", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: onLogout },
          ])}>
          <Feather name="log-out" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll}
        contentContainerStyle={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
            {tab.badge !== undefined && tab.badge > 0 && (
              <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{tab.badge}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === "overview" && <OverviewTab />}

      {activeTab === "sellers" && (
        sellers.loading ? <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primaryOrange} />
        : sellers.error ? <ErrorRetry message={sellers.error} onRetry={() => sellers.load()} />
        : <FlatList
            data={sellers.sellers} keyExtractor={i => i.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={<SectionHeader title="Pending Seller Applications" count={sellers.sellers.length} />}
            ListEmptyComponent={<EmptyState icon="check-circle" message="No pending seller applications" />}
            renderItem={({ item }) => (
              <SellerCard item={item} actionId={sellers.actionId} onApprove={sellers.approve} onReject={sellers.reject} />
            )}
            refreshControl={<RefreshControl refreshing={sellers.refreshing} onRefresh={sellers.refresh} tintColor={Colors.primaryOrange} />}
          />
      )}

      {activeTab === "charities" && (
        charities.loading ? <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primaryOrange} />
        : charities.error ? <ErrorRetry message={charities.error} onRetry={() => charities.load()} />
        : <FlatList
            data={charities.charities} keyExtractor={i => i.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={<SectionHeader title="Pending Charity Applications" count={charities.charities.length} />}
            ListEmptyComponent={<EmptyState icon="check-circle" message="No pending charity applications" />}
            renderItem={({ item }) => (
              <CharityCard item={item} actionId={charities.actionId} onApprove={charities.approve} onReject={charities.reject} />
            )}
            refreshControl={<RefreshControl refreshing={charities.refreshing} onRefresh={charities.refresh} tintColor={Colors.primaryOrange} />}
          />
      )}

      {activeTab === "users" && <UsersTab onViewUser={onViewUser} />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  headerTitle:    { fontSize: 20, fontWeight: "700", color: "#1F2937" },
  headerSubtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: "#FEE2E2",
    alignItems: "center", justifyContent: "center",
  },

  tabBarScroll: { maxHeight: 48, backgroundColor: "#fff" },
  tabBar: {
    backgroundColor: "#fff", borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6", paddingHorizontal: 4,
  },
  tabItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 6,
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabItemActive:  { borderBottomColor: Colors.primaryOrange },
  tabLabel:       { fontSize: 13, fontWeight: "500", color: "#9CA3AF" },
  tabLabelActive: { color: Colors.primaryOrange, fontWeight: "700" },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: Colors.primaryOrange, alignItems: "center", justifyContent: "center",
  },
  tabBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  listContent: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },

  sectionHeader:  { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: Spacing.xs },
  sectionTitle:   { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  countBadge:     { backgroundColor: Colors.primaryOrange + "22", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontSize: 12, fontWeight: "700", color: Colors.primaryOrange },

  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: Spacing.md, gap: Spacing.sm,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  cardHeader:     { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  cardHeaderInfo: { flex: 1, gap: 4 },
  cardName:       { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  avatarCircle:   { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFE8D6", alignItems: "center", justifyContent: "center" },
  avatarText:     { fontSize: 16, fontWeight: "700", color: Colors.primaryOrange },
  typeBadge:      { alignSelf: "flex-start", backgroundColor: "#FFF3E8", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText:  { fontSize: 11, fontWeight: "600", color: Colors.primaryOrange },
  infoSection:    { gap: 6 },
  infoRow:        { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText:       { fontSize: 13, color: "#4B5563", flex: 1 },
  docsSection:    { backgroundColor: "#F9FAFB", borderRadius: 8, padding: Spacing.sm, gap: 6 },
  docRow:         { flexDirection: "row", alignItems: "center", gap: 6 },
  docLabel:       { fontSize: 13, color: "#374151", flex: 1 },
  dateText:       { fontSize: 12, color: "#9CA3AF" },
  actionRow: {
    flexDirection: "row", gap: Spacing.sm,
    paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: "#F3F4F6",
  },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "#EF4444", backgroundColor: "#FEF2F2",
  },
  rejectBtnText:  { fontSize: 14, fontWeight: "600", color: "#EF4444" },
  approveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.greenMain,
  },
  approveBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  btnDisabled:    { opacity: 0.5 },

  userCard: {
    backgroundColor: "#fff", borderRadius: 12, marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
      android: { elevation: 1 },
    }),
  },
  userRowInner:   { flexDirection: "row", alignItems: "center", gap: Spacing.sm, padding: Spacing.md },
  userAvatar:     { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  userAvatarText: { fontSize: 15, fontWeight: "700" },
  userInfo:       { flex: 1, gap: 2 },
  userNameRow:    { flexDirection: "row", alignItems: "center", gap: 6 },
  userName:       { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  userPhone:      { fontSize: 12, color: "#6B7280" },
  userEmail:      { fontSize: 12, color: "#9CA3AF" },
  roleBadge:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleBadgeText:  { fontSize: 10, fontWeight: "700" },
  blockedBadge:   { backgroundColor: "#FEE2E2", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  blockedBadgeText: { fontSize: 10, fontWeight: "700", color: "#EF4444" },
  userActions:    { flexDirection: "row", gap: 8, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  unblockBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.greenMain, backgroundColor: "#DCFCE7",
  },
  unblockBtnText: { fontSize: 12, fontWeight: "600", color: Colors.greenMain },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: "#EF4444", backgroundColor: "#FEF2F2",
  },
  deleteBtnText: { fontSize: 12, fontWeight: "600", color: "#EF4444" },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fff", marginHorizontal: Spacing.md, marginTop: Spacing.sm,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#1F2937", padding: 0 },
  filterRow:   { paddingHorizontal: Spacing.md, paddingVertical: 8, gap: 8 },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1.5, borderColor: "#D1D5DB", backgroundColor: "#fff",
  },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },

  fab: {
    position: "absolute", bottom: 24, right: 24,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center", justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: Colors.primaryOrange, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },

  overviewContent:  { padding: Spacing.md, paddingBottom: 40, gap: Spacing.md },
  statsGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 14, borderLeftWidth: 4,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  statIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statInfo:  { flex: 1 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#1F2937" },
  statLabel: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  userBreakdown: {
    flexDirection: "row", backgroundColor: "#fff",
    borderRadius: 12, padding: Spacing.md, justifyContent: "space-around",
  },
  breakdownItem:  { alignItems: "center", gap: 4 },
  breakdownDot:   { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { fontSize: 12, color: "#6B7280" },
  breakdownCount: { fontSize: 18, fontWeight: "800" },

  chartsSection: { gap: Spacing.sm },
  chartWrap:     { backgroundColor: "#fff", borderRadius: 12, padding: Spacing.md },
  chartLabel:    { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 12 },
  chartBars:     { flexDirection: "row", alignItems: "flex-end", height: 80, gap: 6 },
  chartBarCol:   { flex: 1, alignItems: "center", gap: 3 },
  chartBarVal:   { fontSize: 9, color: "#6B7280", fontWeight: "600" },
  chartBarTrack: { flex: 1, width: "100%", backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden", justifyContent: "flex-end" },
  chartBarFill:  { width: "100%", borderRadius: 4 },
  chartBarMonth: { fontSize: 9, color: "#9CA3AF", textAlign: "center" },

  bestSection: { gap: Spacing.sm },
  bestRow:     { flexDirection: "row", gap: 10 },
  bestCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14,
    borderTopWidth: 3, gap: 10,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  bestTitle:  { fontSize: 11, fontWeight: "600", color: "#9CA3AF", textTransform: "uppercase" },
  bestInner:  { flexDirection: "row", alignItems: "center", gap: 10 },
  bestAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  bestName:   { fontSize: 13, fontWeight: "700", color: "#1F2937" },
  bestSub:    { fontSize: 11, color: "#9CA3AF", marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet:   { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40, maxHeight: "90%" },
  modalHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md },
  modalTitle:   { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  fieldLabel:   { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  fieldInput:   { borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#1F2937", backgroundColor: "#FAFAF8" },
  roleChips:    { flexDirection: "row", gap: 10, marginTop: 2 },
  roleChip:     { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center" },
  roleChipText: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  modalError:   { color: "#EF4444", fontSize: 13, marginTop: 10 },
  modalPrimary: { backgroundColor: Colors.primaryOrange, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  modalPrimaryText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  otpHint:      { fontSize: 14, color: "#6B7280", lineHeight: 22, marginBottom: 8 },
  backLink:     { alignItems: "center", marginTop: 16 },
  backLinkText: { fontSize: 14, color: Colors.primaryOrange, fontWeight: "600" },

  emptyState:   { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText:    { fontSize: 14, color: "#9CA3AF", textAlign: "center" },
  retryBtn:     { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primaryOrange },
  retryBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },

  rowRtl:  { flexDirection: "row-reverse" },
  textRtl: { textAlign: "right" },
});
