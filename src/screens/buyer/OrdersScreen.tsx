import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  Image,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import api from "../../services/shared/api";
import { submitReview } from "../../services/buyer/profile/profileService";

type ApiOrderStatus = "RESERVED" | "COMPLETED" | "CANCELLED" | "DONATED";
type TabKey = "active" | "completed" | "cancelled";

const TABS: { key: TabKey; label: string; labelAr: string; apiStatus: ApiOrderStatus[] }[] = [
  { key: "active",    label: "Active",    labelAr: "نشط",     apiStatus: ["RESERVED"] },
  { key: "completed", label: "Completed", labelAr: "مكتمل",   apiStatus: ["COMPLETED"] },
  { key: "cancelled", label: "Cancelled", labelAr: "ملغى",    apiStatus: ["CANCELLED"] },
];

interface Order {
  id: string;
  status: ApiOrderStatus;
  totalPrice?: number;
  createdAt?: string;
  listing?: {
    id?: string;
    title?: string;
    price?: number;
    pickupStart?: string;
    pickupEnd?: string;
    qrCodeUrl?: string;
    seller?: { id?: string; businessName?: string; businessType?: string };
    charity?: { name?: string };
  };
}

const STATUS_LABELS: Record<ApiOrderStatus, { en: string; ar: string; color: string }> = {
  RESERVED:  { en: "Reserved",       ar: "محجوز",        color: Colors.primaryOrange },
  COMPLETED: { en: "Picked up",      ar: "تم الاستلام",   color: Colors.greenMain },
  CANCELLED: { en: "Cancelled",      ar: "ملغى",          color: "#ef4444" },
  DONATED:   { en: "Donated",        ar: "تم التبرع",     color: "#8b5cf6" },
};

interface OrdersScreenProps {
  onOpenQRScan?: (params: { orderId: string; orderTitle?: string }) => void;
}

export default function OrdersScreen({ onOpenQRScan }: OrdersScreenProps = {}) {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const rtl = isRTL();
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [qrModal,       setQrModal]       = useState<{ orderId: string; title: string; qrUrl: string } | null>(null);
  const [qrFetching,    setQrFetching]    = useState<string | null>(null);

  // Review state
  const [reviewOrder,   setReviewOrder]   = useState<Order | null>(null);
  const [reviewedIds,   setReviewedIds]   = useState<Set<string>>(new Set());
  const [reviewRatings, setReviewRatings] = useState({ overall: 0, pickup: 0, quality: 0, variety: 0 });
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setFetchError("");
    const tab = TABS.find((t) => t.key === activeTab)!;
    const parsePayload = (data: unknown): Order[] => {
      const payload = (data as { data?: unknown })?.data ?? data;
      return Array.isArray(payload)
        ? (payload as Order[])
        : ((payload as { orders?: Order[]; items?: Order[]; data?: Order[] })?.orders
            ?? (payload as { orders?: Order[]; items?: Order[]; data?: Order[] })?.items
            ?? (payload as { orders?: Order[]; items?: Order[]; data?: Order[] })?.data
            ?? []);
    };
    try {
      if (tab.apiStatus.length === 1) {
        const { data } = await api.get("/api/orders/me", {
          params: { status: tab.apiStatus[0] },
        });
        setOrders(parsePayload(data));
      } else {
        const results = await Promise.all(
          tab.apiStatus.map((s) => api.get("/api/orders/me", { params: { status: s } }))
        );
        const merged = results.flatMap(({ data }) => parsePayload(data));
        setOrders(merged);
      }
    } catch {
      setFetchError(
        rtl
          ? "تعذّر تحميل الطلبات. يرجى المحاولة مجدداً"
          : "Could not load orders. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, rtl]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleCancel = async (orderId: string) => {
    const confirmMsg = rtl
      ? "هل أنت متأكد أنك تريد إلغاء هذا الطلب؟"
      : "Are you sure you want to cancel this order?";
    const confirmLabel = rtl ? "تأكيد الإلغاء" : "Yes, Cancel";
    const cancelLabel = rtl ? "لا" : "No";

    Alert.alert(
      rtl ? "إلغاء الطلب" : "Cancel Order",
      confirmMsg,
      [
        { text: cancelLabel, style: "cancel" },
        {
          text: confirmLabel,
          style: "destructive",
          onPress: async () => {
            setActionLoading(orderId);
            try {
              await api.patch(`/api/orders/${orderId}/cancel`);
              await fetchOrders();
              // Fetch updated profile to read current cancellation count
              try {
                const profileRes = await api.get("/api/users/me");
                const profile = profileRes.data?.data ?? profileRes.data;
                const count: number = profile?.cancellationCount ?? 0;
                const remaining = Math.max(0, 5 - count);
                if (count >= 3) {
                  Alert.alert(
                    rtl ? "تنبيه" : "Warning",
                    rtl
                      ? `تم الإلغاء. لديك ${count} إلغاءات — ${remaining} إلغاء متبقي قبل تعليق الحساب.`
                      : `Cancelled. You have ${count} cancellations — ${remaining} left before your account is suspended.`
                  );
                }
              } catch {
                // Non-critical — profile fetch failure doesn't affect the cancel
              }
            } catch {
              Alert.alert(
                rtl ? "خطأ" : "Error",
                rtl ? "تعذّر إلغاء الطلب" : "Could not cancel order"
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleConfirmPickup = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      await api.patch(`/api/orders/${orderId}/received`);
      await fetchOrders();
    } catch {
      Alert.alert(
        rtl ? "خطأ" : "Error",
        rtl ? "تعذّر تأكيد الاستلام" : "Could not confirm pickup"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReview = (order: Order) => {
    setReviewRatings({ overall: 0, pickup: 0, quality: 0, variety: 0 });
    setReviewComment("");
    setReviewOrder(order);
  };

  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    const sellerId = reviewOrder.listing?.seller?.id ?? "";
    if (!sellerId) return;
    setReviewSubmitting(true);
    try {
      await submitReview({
        orderId: reviewOrder.id,
        sellerId,
        ratingOverall:  reviewRatings.overall,
        ratingPickup:   reviewRatings.pickup,
        ratingQuality:  reviewRatings.quality,
        ratingVariety:  reviewRatings.variety,
        comment: reviewComment.trim() || undefined,
      });
      setReviewedIds((prev) => new Set([...prev, reviewOrder.id]));
      setReviewOrder(null);
    } catch {
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر إرسال التقييم" : "Could not submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleShowQR = async (order: Order) => {
    // Use cached qrCodeUrl if available on listing, otherwise fetch it
    if (order.listing?.qrCodeUrl) {
      setQrModal({ orderId: order.id, title: order.listing.title ?? "Order", qrUrl: order.listing.qrCodeUrl });
      return;
    }
    if (!order.listing?.id) return;
    setQrFetching(order.id);
    try {
      const { data } = await api.get(`/api/listings/${order.listing.id}`);
      const listing = data.data ?? data;
      const qrUrl = listing?.qrCodeUrl;
      if (qrUrl) {
        setQrModal({ orderId: order.id, title: listing?.title ?? "Order", qrUrl });
      } else {
        Alert.alert(rtl ? "تنبيه" : "Note", rtl ? "رمز QR غير متاح لهذا الطلب" : "QR code not available for this order");
      }
    } catch {
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر تحميل رمز QR" : "Could not load QR code");
    } finally {
      setQrFetching(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Text style={[styles.headerTitle, rtl && styles.rtl]}>
          {rtl ? "طلباتي" : "My Orders"}
        </Text>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {rtl ? t.labelAr : t.label}
            </Text>
            {activeTab === t.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primaryOrange} size="large" />
          <Text style={[styles.loadingText, rtl && styles.rtl]}>
            {rtl ? "جاري تحميل الطلبات…" : "Loading orders…"}
          </Text>
        </View>
      ) : fetchError ? (
        <View style={styles.errorWrap}>
          <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
          <Text style={[styles.errorText, rtl && styles.rtl]}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOrders(true)}
              tintColor={Colors.primaryOrange}
            />
          }
        >
          {orders.length === 0 ? (
            <EmptyState tab={activeTab} rtl={rtl} />
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                rtl={rtl}
                actionLoading={actionLoading === order.id}
                qrFetching={qrFetching === order.id}
                onCancel={() => handleCancel(order.id)}
                onConfirmPickup={() => handleConfirmPickup(order.id)}
                onShowQR={() => handleShowQR(order)}
                onScanQR={onOpenQRScan ? () => onOpenQRScan({ orderId: order.id, orderTitle: order.listing?.title }) : undefined}
                onLeaveReview={order.status === "COMPLETED" && !reviewedIds.has(order.id) ? () => handleOpenReview(order) : undefined}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Review modal */}
      <Modal visible={!!reviewOrder} transparent animationType="slide" onRequestClose={() => setReviewOrder(null)}>
        <KeyboardAvoidingView style={reviewStyles.overlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={reviewStyles.backdrop} activeOpacity={1} onPress={() => setReviewOrder(null)} />
          <View style={reviewStyles.sheet}>
            <View style={reviewStyles.handle} />
            <View style={[reviewStyles.header, rtl && { flexDirection: "row-reverse" as const }]}>
              <Text style={[reviewStyles.title, rtl && { textAlign: "right" as const }]}>
                {rtl ? "قيّم تجربتك" : "Rate Your Experience"}
              </Text>
              <TouchableOpacity onPress={() => setReviewOrder(null)}>
                <Feather name="x" size={20} color={Colors.grayDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {([
                { key: "overall" as const, en: "Overall",  ar: "عام" },
                { key: "pickup"  as const, en: "Pickup",   ar: "الاستلام" },
                { key: "quality" as const, en: "Quality",  ar: "الجودة" },
                { key: "variety" as const, en: "Variety",  ar: "التنوع" },
              ]).map(({ key, en, ar }) => (
                <View key={key} style={[reviewStyles.ratingRow, rtl && { flexDirection: "row-reverse" as const }]}>
                  <Text style={[reviewStyles.ratingLabel, rtl && { textAlign: "right" as const }]}>
                    {rtl ? ar : en}
                  </Text>
                  <View style={reviewStyles.starsRow}>
                    {[1,2,3,4,5].map((s) => (
                      <TouchableOpacity key={s} onPress={() => setReviewRatings((p) => ({ ...p, [key]: s }))} activeOpacity={0.7}>
                        <Feather name="star" size={26} color={s <= reviewRatings[key] ? Colors.primaryOrange : Colors.grayLight} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              <TextInput
                style={[reviewStyles.commentInput, rtl && { textAlign: "right" as const }]}
                placeholder={rtl ? "أضف تعليقاً (اختياري)" : "Add a comment (optional)"}
                placeholderTextColor={Colors.grayMedium}
                value={reviewComment}
                onChangeText={setReviewComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[reviewStyles.submitBtn, (reviewRatings.overall === 0 || reviewSubmitting) && reviewStyles.submitBtnDisabled]}
                onPress={handleSubmitReview}
                disabled={reviewRatings.overall === 0 || reviewSubmitting}
                activeOpacity={0.85}
              >
                {reviewSubmitting
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={reviewStyles.submitBtnText}>{rtl ? "إرسال التقييم" : "Submit Review"}</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* QR Code modal */}
      <Modal
        visible={qrModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModal(null)}
      >
        <View style={styles.qrOverlay}>
          <View style={styles.qrSheet}>
            <Text style={styles.qrTitle}>{rtl ? "رمز QR للاستلام" : "Pickup QR Code"}</Text>
            <Text style={styles.qrSubtitle} numberOfLines={1}>{qrModal?.title}</Text>
            {qrModal?.qrUrl && (
              <Image source={{ uri: qrModal.qrUrl }} style={styles.qrImage} resizeMode="contain" />
            )}
            <Text style={[styles.qrHint, rtl && { textAlign: "right" as const }]}>
              {rtl ? "أرِ هذا الرمز للبائع عند استلام طلبك" : "Show this code to the seller when picking up your order"}
            </Text>
            <TouchableOpacity style={styles.qrCloseBtn} onPress={() => setQrModal(null)} activeOpacity={0.85}>
              <Text style={styles.qrCloseBtnText}>{rtl ? "إغلاق" : "Close"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function OrderCard({
  order, rtl, actionLoading, qrFetching, onCancel, onConfirmPickup, onShowQR, onScanQR, onLeaveReview,
}: {
  order: Order;
  rtl: boolean;
  actionLoading: boolean;
  qrFetching: boolean;
  onCancel: () => void;
  onConfirmPickup: () => void;
  onShowQR: () => void;
  onScanQR?: () => void;
  onLeaveReview?: () => void;
}) {
  const statusInfo = STATUS_LABELS[order.status] ?? { en: order.status, ar: order.status, color: Colors.grayMedium };
  const statusLabel = rtl ? statusInfo.ar : statusInfo.en;

  const pickupWindow =
    order.listing?.pickupStart && order.listing?.pickupEnd
      ? `${order.listing.pickupStart} – ${order.listing.pickupEnd}`
      : null;

  const dateLabel = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString(rtl ? "ar-PS" : "en-GB", {
        day: "numeric", month: "short",
      })
    : null;

  const priceDisplay =
    order.totalPrice != null
      ? `₪${order.totalPrice}`
      : order.listing?.price != null
      ? `₪${order.listing.price}`
      : "—";

  const isDonated = order.status === "DONATED";
  const isReserved = order.status === "RESERVED";

  return (
    <View style={styles.card}>
      <View style={[styles.cardInner, rtl && styles.cardInnerRTL]}>
        <View style={styles.cardLeft}>
          <View style={styles.storeIcon}>
            <Feather
              name={isDonated ? "gift" : "shopping-bag"}
              size={20}
              color={Colors.primaryOrange}
            />
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.storeName, rtl && styles.rtl]} numberOfLines={1}>
            {order.listing?.seller?.businessName ??
              order.listing?.title ??
              (rtl ? "متجر" : "Store")}
          </Text>
          {order.listing?.title && (
            <Text style={[styles.orderType, rtl && styles.rtl]} numberOfLines={1}>
              {order.listing.title}
            </Text>
          )}
          {isDonated && order.listing?.charity?.name && (
            <View style={[styles.charityRow, rtl && styles.charityRowRTL]}>
              <Feather name="heart" size={11} color="#8b5cf6" />
              <Text style={styles.charityText}>{order.listing.charity.name}</Text>
            </View>
          )}
          <View style={[styles.metaRow, rtl && styles.metaRowRTL]}>
            {pickupWindow && (
              <>
                <Feather name="clock" size={12} color={Colors.grayMedium} />
                <Text style={styles.metaText}>{pickupWindow}</Text>
                {dateLabel && <Text style={styles.dot}>·</Text>}
              </>
            )}
            {dateLabel && <Text style={styles.metaText}>{dateLabel}</Text>}
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.price}>{priceDisplay}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "18" }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      {isReserved && (
        <>
          {/* QR buttons row */}
          <View style={[styles.qrButtonsRow, rtl && styles.qrButtonsRowRTL]}>
            <TouchableOpacity
              style={[styles.qrBtn, { flex: 1 }]}
              onPress={onShowQR}
              disabled={qrFetching}
              activeOpacity={0.8}
            >
              {qrFetching ? (
                <ActivityIndicator size="small" color={Colors.primaryOrange} />
              ) : (
                <>
                  <Feather name="grid" size={14} color={Colors.primaryOrange} />
                  <Text style={styles.qrBtnText}>{rtl ? "عرض رمز QR" : "Show QR"}</Text>
                </>
              )}
            </TouchableOpacity>
            {onScanQR && (
              <TouchableOpacity
                style={[styles.qrBtn, styles.qrScanBtn, { flex: 1 }]}
                onPress={onScanQR}
                activeOpacity={0.8}
              >
                <Feather name="camera" size={14} color="#7c3aed" />
                <Text style={[styles.qrBtnText, { color: "#7c3aed" }]}>{rtl ? "مسح QR" : "Scan QR"}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.actionsRow, rtl && styles.actionsRowRTL]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={onCancel}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <>
                <Feather name="x-circle" size={14} color="#ef4444" />
                <Text style={styles.cancelBtnText}>{rtl ? "إلغاء" : "Cancel"}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.confirmBtn]}
            onPress={onConfirmPickup}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color={Colors.greenMain} />
            ) : (
              <>
                <Feather name="check-circle" size={14} color={Colors.greenMain} />
                <Text style={styles.confirmBtnText}>
                  {rtl ? "تأكيد الاستلام" : "Confirm Pickup"}
                </Text>
              </>
            )}
          </TouchableOpacity>
          </View>
        </>
      )}

      {onLeaveReview && (
        <TouchableOpacity style={[styles.reviewBtn, rtl && { flexDirection: "row-reverse" as const }]} onPress={onLeaveReview} activeOpacity={0.8}>
          <Feather name="star" size={14} color={Colors.white} />
          <Text style={styles.reviewBtnText}>{rtl ? "اترك تقييماً" : "Leave Review"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function EmptyState({ tab, rtl }: { tab: TabKey; rtl: boolean }) {
  const msgs: Record<TabKey, { icon: string; titleEn: string; titleAr: string; subEn: string; subAr: string }> = {
    active:    {
      icon: "shopping-bag",
      titleEn: "No active orders",           titleAr: "لا توجد طلبات نشطة",
      subEn:   "Browse stores and reserve a bag to get started",
      subAr:   "تصفح المتاجر واحجز حقيبة للبدء",
    },
    completed: {
      icon: "check-circle",
      titleEn: "No completed orders yet",    titleAr: "لا توجد طلبات مكتملة",
      subEn:   "Your past pickups will appear here",
      subAr:   "ستظهر هنا طلباتك السابقة",
    },
    cancelled: {
      icon: "x-circle",
      titleEn: "No cancelled orders",        titleAr: "لا توجد طلبات ملغاة",
      subEn:   "Cancelled orders will appear here",
      subAr:   "ستظهر هنا الطلبات الملغاة",
    },
  };
  const m = msgs[tab];
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Feather name={m.icon as any} size={32} color={Colors.primaryOrange} />
      </View>
      <Text style={[styles.emptyTitle, rtl && styles.rtl]}>{rtl ? m.titleAr : m.titleEn}</Text>
      <Text style={[styles.emptySub, rtl && styles.rtl]}>{rtl ? m.subAr : m.subEn}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },

  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, backgroundColor: Colors.background },
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
    position: "absolute", bottom: 0, left: 12, right: 12,
    height: 2.5, borderRadius: 2, backgroundColor: Colors.primaryOrange,
  },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { fontSize: 14, color: Colors.grayMedium },
  errorWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: Spacing.xl },
  errorText: { fontSize: 14, color: Colors.grayMedium, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  scroll: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: 100 },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardInner: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: "center",
  },
  cardInnerRTL: { flexDirection: "row-reverse" },
  cardLeft: {},
  storeIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 3 },
  storeName: { fontSize: 15, fontWeight: "700", color: Colors.grayDark },
  orderType: { fontSize: 12, color: Colors.grayMedium },
  charityRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  charityRowRTL: { flexDirection: "row-reverse" },
  charityText: { fontSize: 12, color: "#8b5cf6", fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaRowRTL: { flexDirection: "row-reverse" },
  metaText: { fontSize: 12, color: Colors.grayMedium },
  dot: { color: Colors.grayMedium },
  cardRight: { alignItems: "flex-end", gap: 6 },
  price: { fontSize: 16, fontWeight: "800", color: Colors.grayDark },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },

  actionsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  actionsRowRTL: { flexDirection: "row-reverse" },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderRadius: 12, paddingVertical: 10,
    borderWidth: 1.5,
  },
  cancelBtn: { borderColor: "#fecaca", backgroundColor: "#fef2f2" },
  cancelBtnText: { fontSize: 13, fontWeight: "700", color: "#ef4444" },
  confirmBtn: { borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" },
  confirmBtnText: { fontSize: 13, fontWeight: "700", color: Colors.greenMain },

  qrButtonsRow: {
    flexDirection: "row", gap: 8,
    marginHorizontal: 16, marginBottom: 8,
  },
  qrButtonsRowRTL: { flexDirection: "row-reverse" },
  qrBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.orangeLight, borderRadius: 10,
    paddingVertical: 9,
  },
  qrScanBtn: { backgroundColor: "#ede9fe" },
  qrBtnText: { fontSize: 13, fontWeight: "700", color: Colors.primaryOrange },

  qrOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center" },
  qrSheet: {
    backgroundColor: Colors.white, borderRadius: 24, padding: Spacing.xl,
    width: "86%", alignItems: "center", gap: Spacing.md,
  },
  qrTitle:    { fontSize: 18, fontWeight: "800", color: Colors.grayDark },
  qrSubtitle: { fontSize: 13, color: Colors.grayMedium, maxWidth: 220 },
  qrImage:    { width: 220, height: 220, borderRadius: 12 },
  qrHint:     { fontSize: 13, color: Colors.grayMedium, textAlign: "center", lineHeight: 19 },
  qrCloseBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 14,
    paddingHorizontal: 40, paddingVertical: 13, marginTop: 4,
  },
  qrCloseBtnText: { fontSize: 15, fontWeight: "800", color: Colors.white },

  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.grayDark },
  emptySub: { fontSize: 14, color: Colors.grayMedium, textAlign: "center", maxWidth: 240, lineHeight: 20 },

  reviewBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.primaryOrange, borderRadius: 10,
    paddingVertical: 9, marginHorizontal: 16, marginBottom: 8,
  },
  reviewBtnText: { fontSize: 13, fontWeight: "700", color: Colors.white },
});

const reviewStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl, paddingBottom: 40, paddingTop: Spacing.sm,
    maxHeight: "88%",
  },
  handle: {
    alignSelf: "center", width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.grayLight, marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  title: { fontSize: 18, fontWeight: "800", color: Colors.grayDark },
  ratingRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  ratingLabel: { fontSize: 15, fontWeight: "500", color: Colors.grayDark },
  starsRow: { flexDirection: "row", gap: 6 },
  commentInput: {
    backgroundColor: Colors.grayLight, borderRadius: 12,
    padding: Spacing.md, fontSize: 14, color: Colors.grayDark,
    minHeight: 80, marginBottom: Spacing.lg,
  },
  submitBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 14,
    paddingVertical: 14, alignItems: "center", marginBottom: Spacing.sm,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },
});
