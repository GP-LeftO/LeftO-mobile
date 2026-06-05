import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { isRTL } from "../../../i18n";
import { useCharities } from "../../../hooks/buyer/reserve/useCharities";
import { createSellerDonation } from "../../../services/seller/donation.service";
import type { SellerListing } from "../../../services/seller/seller.service";
import type { Charity } from "../../../types/charity.types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SellerDonateSurplusScreenProps {
  listing: SellerListing;
  onBack: () => void;
  onComplete: (charityName: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hhmmToIso(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SellerDonateSurplusScreen({
  listing,
  onBack,
  onComplete,
}: SellerDonateSurplusScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const botPadding = Platform.OS === "web" ? 24 : insets.bottom;
  const rtl        = isRTL();

  const { charities, loading: charitiesLoading, error: charitiesError, refetch } = useCharities();

  const [quantity,      setQuantity]      = useState(listing.quantity?.toString() ?? "1");
  const [pickupStart,   setPickupStart]   = useState("");
  const [pickupEnd,     setPickupEnd]     = useState("");
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitError,   setSubmitError]   = useState("");
  const [errors,        setErrors]        = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty < 1)                e.quantity    = rtl ? "أدخل كمية صحيحة" : "Enter a valid quantity";
    if (qty > (listing.quantity ?? 99))                    e.quantity    = rtl ? `الحد الأقصى ${listing.quantity}` : `Max is ${listing.quantity}`;
    if (!/^\d{2}:\d{2}$/.test(pickupStart))               e.pickupStart = rtl ? "استخدم صيغة HH:MM" : "Use HH:MM format";
    if (!/^\d{2}:\d{2}$/.test(pickupEnd))                 e.pickupEnd   = rtl ? "استخدم صيغة HH:MM" : "Use HH:MM format";
    if (!selectedCharity)                                  e.charity     = rtl ? "اختر جمعية خيرية" : "Select a charity";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedCharity) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await createSellerDonation({
        listingId:   listing.id,
        charityId:   selectedCharity.id,
        quantity:    Number(quantity),
        pickupStart: hhmmToIso(pickupStart),
        pickupEnd:   hhmmToIso(pickupEnd),
      });
      onComplete(selectedCharity.orgName);
    } catch {
      setSubmitError(rtl ? "تعذّر إرسال التبرع. يرجى المحاولة مجدداً." : "Could not submit donation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = (key: string) =>
    setErrors(prev => ({ ...prev, [key]: "" }));

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{rtl ? "تبرع بالفائض" : "Donate Surplus"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: botPadding + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Listing preview */}
        <View style={[styles.listingPreview, rtl && styles.rowRTL]}>
          <View style={styles.listingIconWrap}>
            <Feather name="package" size={20} color={Colors.primaryOrange} />
          </View>
          <View style={styles.listingPreviewBody}>
            <Text style={[styles.listingPreviewTitle, rtl && styles.textRight]} numberOfLines={1}>
              {listing.title}
            </Text>
            <Text style={[styles.listingPreviewSub, rtl && styles.textRight]}>
              {rtl ? `متبقي: ${listing.quantity}` : `${listing.quantity} available`}
            </Text>
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={[styles.label, rtl && styles.textRight]}>
            {rtl ? "الكمية للتبرع" : "Quantity to Donate"} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.inputShort, errors.quantity && styles.inputError, rtl && styles.textRight]}
            value={quantity}
            onChangeText={v => { setQuantity(v); clearError("quantity"); }}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={Colors.grayMedium}
            textAlign={rtl ? "right" : "left"}
          />
          {errors.quantity ? (
            <Text style={styles.errorText}>{errors.quantity}</Text>
          ) : (
            <Text style={[styles.hint, rtl && styles.textRight]}>
              {rtl ? `الحد الأقصى: ${listing.quantity}` : `Max: ${listing.quantity}`}
            </Text>
          )}
        </View>

        {/* Pickup window */}
        <View style={styles.section}>
          <Text style={[styles.label, rtl && styles.textRight]}>
            {rtl ? "وقت الاستلام (HH:MM)" : "Pickup Window (HH:MM)"} <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.row, rtl && styles.rowRTL]}>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>{rtl ? "من" : "From"}</Text>
              <TextInput
                style={[styles.input, errors.pickupStart && styles.inputError, rtl && styles.textRight]}
                value={pickupStart}
                onChangeText={v => { setPickupStart(v); clearError("pickupStart"); }}
                placeholder="17:00"
                placeholderTextColor={Colors.grayMedium}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                textAlign={rtl ? "right" : "left"}
              />
              {errors.pickupStart && <Text style={styles.errorText}>{errors.pickupStart}</Text>}
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>{rtl ? "إلى" : "To"}</Text>
              <TextInput
                style={[styles.input, errors.pickupEnd && styles.inputError, rtl && styles.textRight]}
                value={pickupEnd}
                onChangeText={v => { setPickupEnd(v); clearError("pickupEnd"); }}
                placeholder="20:00"
                placeholderTextColor={Colors.grayMedium}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                textAlign={rtl ? "right" : "left"}
              />
              {errors.pickupEnd && <Text style={styles.errorText}>{errors.pickupEnd}</Text>}
            </View>
          </View>
        </View>

        {/* Charity picker */}
        <View style={styles.section}>
          <Text style={[styles.label, rtl && styles.textRight]}>
            {rtl ? "اختر جمعية خيرية" : "Select a Charity"} <Text style={styles.required}>*</Text>
          </Text>
          {errors.charity && <Text style={styles.errorText}>{errors.charity}</Text>}

          {charitiesLoading ? (
            <View style={styles.charitiesLoading}>
              <ActivityIndicator color={Colors.primaryOrange} />
              <Text style={styles.charitiesLoadingText}>{rtl ? "جاري التحميل…" : "Loading charities…"}</Text>
            </View>
          ) : charitiesError ? (
            <View style={styles.charitiesError}>
              <Text style={[styles.errorText, rtl && styles.textRight]}>{charitiesError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={refetch} activeOpacity={0.8}>
                <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
              </TouchableOpacity>
            </View>
          ) : charities.length === 0 ? (
            <Text style={[styles.hint, rtl && styles.textRight]}>
              {rtl ? "لا توجد جمعيات خيرية متاحة" : "No charities available"}
            </Text>
          ) : (
            <View style={styles.charitiesList}>
              {charities.map((charity) => (
                <CharityCard
                  key={charity.id}
                  charity={charity}
                  selected={selectedCharity?.id === charity.id}
                  onSelect={() => { setSelectedCharity(charity); clearError("charity"); }}
                  rtl={rtl}
                />
              ))}
            </View>
          )}
        </View>

        {/* Submit error */}
        {submitError !== "" && (
          <View style={styles.submitErrorBox}>
            <Feather name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: botPadding + 12 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Feather name="heart" size={18} color={Colors.white} />
              <Text style={styles.submitBtnText}>{rtl ? "تأكيد التبرع" : "Confirm Donation"}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── CharityCard ──────────────────────────────────────────────────────────────

function CharityCard({
  charity, selected, onSelect, rtl,
}: { charity: Charity; selected: boolean; onSelect: () => void; rtl: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.charityCard, selected && styles.charityCardSelected]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={[styles.charityCardInner, rtl && styles.rowRTL]}>
        <View style={[styles.charityIconWrap, selected && styles.charityIconWrapSelected]}>
          <Feather name="heart" size={18} color={selected ? Colors.white : Colors.primaryOrange} />
        </View>
        <View style={styles.charityInfo}>
          <View style={[styles.charityNameRow, rtl && styles.rowRTL]}>
            <Text style={[styles.charityName, rtl && styles.textRight]} numberOfLines={1}>
              {charity.orgName}
            </Text>
            {charity.verifiedBadge && (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={11} color={Colors.greenMain} />
                <Text style={styles.verifiedText}>{rtl ? "موثّقة" : "Verified"}</Text>
              </View>
            )}
          </View>
          {charity.region && (
            <Text style={[styles.charityRegion, rtl && styles.textRight]} numberOfLines={1}>
              {charity.region}
            </Text>
          )}
        </View>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  textRight: { textAlign: "right" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.background, alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.grayDark },

  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: 4 },

  listingPreview: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  listingIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center",
  },
  listingPreviewBody: { flex: 1 },
  listingPreviewTitle: { fontSize: 15, fontWeight: "700", color: Colors.grayDark },
  listingPreviewSub: { fontSize: 12, color: Colors.grayMedium, marginTop: 2 },

  section: { marginBottom: Spacing.lg },
  label:      { fontSize: 13, fontWeight: "700", color: Colors.grayDark, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: Colors.grayMedium, marginBottom: 6 },
  required:   { color: "#ef4444" },
  hint:       { fontSize: 12, color: Colors.grayMedium, marginTop: 4 },
  errorText:  { fontSize: 12, color: "#ef4444", marginTop: 4 },

  input: {
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
    borderRadius: 14, paddingHorizontal: Spacing.md, paddingVertical: 13,
    fontSize: 15, color: Colors.grayDark,
  },
  inputShort: { width: 120 },
  inputError: { borderColor: "#ef4444" },

  row:    { flexDirection: "row",         gap: 12 },
  rowRTL: { flexDirection: "row-reverse", gap: 12 },
  halfField: { flex: 1 },

  charitiesLoading: { flexDirection: "row", alignItems: "center", gap: 10, padding: Spacing.md },
  charitiesLoadingText: { fontSize: 14, color: Colors.grayMedium },
  charitiesError: { gap: 10 },
  retryBtn: { backgroundColor: Colors.primaryOrange, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, alignSelf: "flex-start" },
  retryBtnText: { fontSize: 13, fontWeight: "700", color: Colors.white },
  charitiesList: { gap: 10 },

  charityCard: {
    backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.grayLight,
    overflow: "hidden",
  },
  charityCardSelected: { borderColor: Colors.primaryOrange, backgroundColor: Colors.orangeLight + "30" },
  charityCardInner: { flexDirection: "row", alignItems: "center", padding: Spacing.md, gap: 12 },
  charityIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center",
  },
  charityIconWrapSelected: { backgroundColor: Colors.primaryOrange },
  charityInfo: { flex: 1, gap: 3 },
  charityNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  charityName: { fontSize: 14, fontWeight: "700", color: Colors.grayDark, flexShrink: 1 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#f0fdf4", borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 },
  verifiedText: { fontSize: 10, fontWeight: "700", color: Colors.greenMain },
  charityRegion: { fontSize: 12, color: Colors.grayMedium },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  radioOuterSelected: { borderColor: Colors.primaryOrange },
  radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: Colors.primaryOrange },

  submitErrorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fef2f2", borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.md,
  },
  submitErrorText: { fontSize: 13, color: "#ef4444", flex: 1 },

  footer: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.grayLight,
  },
  submitBtn: {
    backgroundColor: Colors.greenMain, borderRadius: 16,
    paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: "800", color: Colors.white },
});
