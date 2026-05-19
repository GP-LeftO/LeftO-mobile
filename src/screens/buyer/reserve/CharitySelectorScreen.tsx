import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Platform, ActivityIndicator, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { t, isRTL } from "../../../i18n";
import { useCharities } from "../../../hooks/buyer/reserve/useCharities";
import { createDonation } from "../../../services/buyer/reserve/donationService";
import type { Charity } from "../../../types/charity.types";
import type { CheckoutParams, Order } from "../../../types/order.types";

interface CharitySelectorScreenProps {
  checkoutParams: CheckoutParams;
  quantity: number;
  onBack: () => void;
  onDonated: (charityName: string, order: Order) => void;
}

function SkeletonCard() {
  return (
    <View style={[skelStyles.card]}>
      <View style={skelStyles.avatar} />
      <View style={skelStyles.body}>
        <View style={skelStyles.line1} />
        <View style={skelStyles.line2} />
        <View style={skelStyles.line3} />
      </View>
    </View>
  );
}

const skelStyles = StyleSheet.create({
  card:   { flexDirection: "row", gap: 12, backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.md, marginBottom: Spacing.sm },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.grayLight },
  body:   { flex: 1, gap: 8, justifyContent: "center" },
  line1:  { height: 14, width: "70%", backgroundColor: Colors.grayLight, borderRadius: 6 },
  line2:  { height: 12, width: "45%", backgroundColor: Colors.grayLight, borderRadius: 6 },
  line3:  { height: 12, width: "90%", backgroundColor: Colors.grayLight, borderRadius: 6 },
});

interface CharityCardProps {
  charity: Charity;
  selected: boolean;
  rtl: boolean;
  onPress: () => void;
}

function CharityCard({ charity, selected, rtl, onPress }: CharityCardProps) {
  const tr = t().charitySelector;
  return (
    <TouchableOpacity
      style={[styles.charityCard, selected && styles.charityCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.cardRow, rtl && styles.rowReverse]}>
        {/* Avatar / Logo */}
        <View style={styles.avatarWrap}>
          {charity.logoUrl ? (
            <Image source={{ uri: charity.logoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Feather name="heart" size={22} color={Colors.primaryOrange} />
            </View>
          )}
        </View>

        <View style={[styles.cardBody, rtl && styles.alignEnd]}>
          <View style={[styles.row, rtl && styles.rowReverse, { gap: 6 }]}>
            <Text style={[styles.charityName, rtl && styles.textRight]} numberOfLines={1}>
              {charity.orgName}
            </Text>
            {charity.verifiedBadge && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>{tr.verified} ✓</Text>
              </View>
            )}
          </View>
          {charity.region && (
            <View style={[styles.row, rtl && styles.rowReverse, { gap: 4 }]}>
              <Feather name="map-pin" size={11} color={Colors.grayMedium} />
              <Text style={styles.region} numberOfLines={1}>{charity.region}</Text>
            </View>
          )}
          {charity.description && (
            <Text style={[styles.description, rtl && styles.textRight]} numberOfLines={1}>
              {charity.description}
            </Text>
          )}
        </View>

        {selected && (
          <View style={styles.selectedMark}>
            <Feather name="check" size={14} color={Colors.white} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function CharitySelectorScreen({
  checkoutParams,
  quantity,
  onBack,
  onDonated,
}: CharitySelectorScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const botPadding = Platform.OS === "web" ? 24 : insets.bottom;
  const rtl        = isRTL();
  const tr         = t().charitySelector;

  const { charities, loading, error, refetch } = useCharities();
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [submitting, setSubmitting]            = useState(false);
  const [submitError, setSubmitError]          = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedCharity) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await createDonation({
        listingId: checkoutParams.listingId,
        charityId: selectedCharity.id,
        quantity,
        type: "DONATION",
      });
      onDonated(selectedCharity.orgName, order);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } } };
      const raw = axErr.response?.data?.message ?? "";
      const isListingGone = raw.toLowerCase().includes("active")
        || raw.toLowerCase().includes("reserved")
        || raw.toLowerCase().includes("sold");
      setSubmitError(
        isListingGone
          ? (isRTL()
              ? "هذا العرض لم يعد متاحاً — قد يكون قد نفد المخزون. يرجى العودة واختيار عرض آخر."
              : "This listing is no longer available — it may have been reserved or sold out. Please go back and choose another listing.")
          : (raw || tr.error)
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={[styles.subtitle, rtl && styles.textRight]}>{tr.subtitle}</Text>

      {/* Body */}
      {loading ? (
        <View style={styles.listPad}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
          <Text style={[styles.errorText, rtl && styles.textRight]}>{tr.error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{tr.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : charities.length === 0 ? (
        <View style={styles.center}>
          <Feather name="inbox" size={36} color={Colors.grayMedium} />
          <Text style={[styles.errorText, rtl && styles.textRight]}>{tr.empty}</Text>
        </View>
      ) : (
        <FlatList
          data={charities}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listPad, { paddingBottom: botPadding + 140 }]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={styles.verifiedNote}>
              <Feather name="shield" size={12} color={Colors.grayMedium} />
              <Text style={[styles.verifiedNoteText, rtl && styles.textRight]}>
                {isRTL()
                  ? "يتم عرض الجمعيات الموثّقة فقط. إذا كانت جمعيتك لا تظهر، تواصل مع فريق الدعم لتفعيل الحساب."
                  : "Only verified charities are shown. If your charity doesn't appear, contact support to activate your account."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <CharityCard
              charity={item}
              selected={selectedCharity?.id === item.id}
              rtl={rtl}
              onPress={() => setSelectedCharity(item)}
            />
          )}
        />
      )}

      {/* Sticky confirm */}
      <View style={[styles.ctaBar, { paddingBottom: botPadding + 12 }]}>
        {submitError ? (
          <View style={styles.submitErrorCard}>
            <Feather name="alert-circle" size={14} color="#ef4444" />
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        ) : !selectedCharity ? (
          <Text style={[styles.hintText, rtl && styles.textRight]}>{tr.selectToConfirm}</Text>
        ) : null}
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (!selectedCharity || submitting) && styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirm}
          activeOpacity={0.85}
          disabled={!selectedCharity || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Feather name="heart" size={18} color={Colors.white} />
              <Text style={styles.confirmBtnText}>{tr.confirm}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  textRight:  { textAlign: "right" },
  row:        { flexDirection: "row", alignItems: "center" },
  rowReverse: { flexDirection: "row-reverse" },
  alignEnd:   { alignItems: "flex-end" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.grayDark },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  subtitle: {
    fontSize: 14, color: Colors.grayMedium,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },

  listPad: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  charityCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 2, borderColor: "transparent",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  charityCardSelected: { borderColor: Colors.primaryOrange },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardBody: { flex: 1, gap: 4 },
  avatarWrap: { width: 56, height: 56 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  charityName: { fontSize: 15, fontWeight: "700", color: Colors.grayDark, flex: 1 },
  verifiedBadge: {
    backgroundColor: Colors.greenLight, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  verifiedText: { fontSize: 10, fontWeight: "700", color: Colors.greenMain },
  region: { fontSize: 12, color: Colors.grayMedium },
  description: { fontSize: 12, color: Colors.grayMedium, lineHeight: 16 },
  selectedMark: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center", justifyContent: "center",
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: Spacing.xl },
  errorText: { fontSize: 14, color: Colors.grayMedium, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  ctaBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    paddingTop: Spacing.md, paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.grayLight,
    shadowColor: "#000", shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  hintText: { fontSize: 13, color: Colors.grayMedium, textAlign: "center" },
  submitErrorCard: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fef2f2", borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: "#fecaca",
  },
  submitErrorText: { flex: 1, fontSize: 13, color: "#ef4444" },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.primaryOrange, borderRadius: 16, paddingVertical: 14,
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: 16, fontWeight: "800", color: Colors.white },

  verifiedNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    marginTop: Spacing.sm, marginHorizontal: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.grayLight,
    borderRadius: 10,
  },
  verifiedNoteText: { flex: 1, fontSize: 11, color: Colors.grayMedium, lineHeight: 16 },
});
