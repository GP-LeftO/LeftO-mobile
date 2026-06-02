import React from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { isRTL } from "../../../i18n";
import { useListingForm } from "../../../hooks/seller/useListingForm";
import type { SellerListing } from "../../../services/seller/seller.service";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ListingFormScreenProps {
  existing?: SellerListing;
  onBack: () => void;
  onComplete: () => void;
}

// ─── Option sets ─────────────────────────────────────────────────────────────

const TYPES = [
  { value: "MEAL_BAG",        icon: "gift"    as const, labelEn: "Surprise Bag",    labelAr: "كيس مفاجأة"   },
  { value: "SPECIFIC_PARCEL", icon: "package" as const, labelEn: "Specific Parcel", labelAr: "طرد محدد"     },
] as const;

const CATEGORIES = [
  { value: "MEALS",              labelEn: "Meals",            labelAr: "وجبات",         color: "#ef4444" },
  { value: "BREAD_AND_PASTRIES", labelEn: "Bread & Pastries", labelAr: "خبز ومعجنات",   color: "#f59e0b" },
  { value: "GROCERIES",          labelEn: "Groceries",        labelAr: "بقالة",         color: Colors.greenMain },
  { value: "MIXED",              labelEn: "Mixed",            labelAr: "متنوع",         color: "#8b5cf6" },
] as const;

const FRESHNESS = [
  { value: "eat_today",     labelEn: "Eat Today",     labelAr: "أكله اليوم",   color: "#ef4444", icon: "alert-circle" as const },
  { value: "fresh_tonight", labelEn: "Fresh Tonight", labelAr: "طازج الليلة", color: Colors.primaryOrange, icon: "sun" as const },
  { value: "good_1_2_days", labelEn: "1–2 Days",      labelAr: "يوم أو يومان", color: Colors.greenMain, icon: "check-circle" as const },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ListingFormScreen({ existing, onBack, onComplete }: ListingFormScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const botPadding = Platform.OS === "web" ? 24 : insets.bottom;
  const rtl        = isRTL();

  const { form, errors, loading, submitError, isEdit, setField, submit } = useListingForm(existing);

  const handleSubmit = async () => {
    const success = await submit();
    if (success) onComplete();
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPadding + 4 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {rtl ? (isEdit ? "تعديل القائمة" : "إضافة قائمة") : (isEdit ? "Edit Listing" : "New Listing")}
          </Text>
          <Text style={styles.headerSub}>
            {rtl ? "أضف تفاصيل الطعام الفائض" : "Add details for your surplus food"}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Submit error banner (always visible, above scroll) ── */}
      {submitError !== "" && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={16} color="#fff" />
          <Text style={styles.errorBannerText} numberOfLines={3}>{submitError}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: botPadding + 110 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. Listing Title ── */}
        <FormCard icon="type" label={rtl ? "اسم القائمة" : "Listing Title"} required rtl={rtl}>
          <TextInput
            style={[styles.input, errors.title && styles.inputError, rtl && styles.textRight]}
            placeholder={rtl ? "مثال: كيس مفاجأة المساء" : "e.g. Evening Surprise Bag"}
            placeholderTextColor={Colors.grayMedium}
            value={form.title}
            onChangeText={v => setField("title", v)}
            textAlign={rtl ? "right" : "left"}
          />
          {errors.title && <FieldError msg={errors.title} />}
        </FormCard>

        {/* ── 2. Type ── */}
        <FormCard icon="tag" label={rtl ? "نوع القائمة" : "Type"} required rtl={rtl}>
          <View style={[styles.typeRow, rtl && styles.rowRTL]}>
            {TYPES.map(opt => {
              const active = form.type === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                  onPress={() => setField("type", opt.value)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.typeIconWrap, active && styles.typeIconWrapActive]}>
                    <Feather name={opt.icon} size={18} color={active ? Colors.white : Colors.grayMedium} />
                  </View>
                  <Text style={[styles.typeBtnText, active && styles.typeBtnTextActive]}>
                    {rtl ? opt.labelAr : opt.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FormCard>

        {/* ── 3. Category ── */}
        <FormCard icon="grid" label={rtl ? "الفئة" : "Category"} required rtl={rtl}>
          <View style={[styles.categoryRow, rtl && styles.rowRTL]}>
            {CATEGORIES.map(opt => {
              const active = form.category === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.categoryChip,
                    active && { backgroundColor: opt.color + "18", borderColor: opt.color },
                  ]}
                  onPress={() => setField("category", opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryChipText, active && { color: opt.color, fontWeight: "700" }]}>
                    {rtl ? opt.labelAr : opt.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FormCard>

        {/* ── 4. Pricing ── */}
        <FormCard icon="dollar-sign" label={rtl ? "السعر (₪)" : "Pricing (₪)"} required rtl={rtl}>
          <View style={[styles.priceRow, rtl && styles.rowRTL]}>
            <View style={styles.priceField}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>
                {rtl ? "السعر الأصلي" : "Original"}
              </Text>
              <View style={[styles.priceInputWrap, errors.originalPrice && styles.inputError]}>
                <Text style={styles.currencySign}>₪</Text>
                <TextInput
                  style={[styles.priceInput, rtl && styles.textRight]}
                  placeholder="0.00"
                  placeholderTextColor={Colors.grayMedium}
                  keyboardType="decimal-pad"
                  value={form.originalPrice}
                  onChangeText={v => setField("originalPrice", v)}
                  textAlign={rtl ? "right" : "left"}
                />
              </View>
              {errors.originalPrice && <FieldError msg={errors.originalPrice} />}
            </View>

            <View style={styles.priceDivider}>
              <Feather name="arrow-right" size={14} color={Colors.grayMedium} />
            </View>

            <View style={styles.priceField}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>
                {rtl ? "السعر المخفض" : "Discounted"}
              </Text>
              <View style={[styles.priceInputWrap, styles.priceInputWrapGreen, errors.discountedPrice && styles.inputError]}>
                <Text style={[styles.currencySign, styles.currencySignGreen]}>₪</Text>
                <TextInput
                  style={[styles.priceInput, rtl && styles.textRight]}
                  placeholder="0.00"
                  placeholderTextColor={Colors.grayMedium}
                  keyboardType="decimal-pad"
                  value={form.discountedPrice}
                  onChangeText={v => setField("discountedPrice", v)}
                  textAlign={rtl ? "right" : "left"}
                />
              </View>
              {errors.discountedPrice && <FieldError msg={errors.discountedPrice} />}
            </View>
          </View>

          {/* Discount badge preview */}
          {Number(form.originalPrice) > 0 && Number(form.discountedPrice) > 0 &&
           Number(form.discountedPrice) < Number(form.originalPrice) && (
            <View style={styles.discountBadge}>
              <Feather name="trending-down" size={13} color={Colors.greenMain} />
              <Text style={styles.discountBadgeText}>
                {Math.round((1 - Number(form.discountedPrice) / Number(form.originalPrice)) * 100)}
                {rtl ? "٪ خصم" : "% off"}
              </Text>
            </View>
          )}
        </FormCard>

        {/* ── 5. Quantity ── */}
        <FormCard icon="layers" label={rtl ? "الكمية المتاحة" : "Available Quantity"} required rtl={rtl}>
          <View style={[styles.stepperRow, rtl && styles.rowRTL]}>
            <TouchableOpacity
              style={[styles.stepperBtn, form.quantity <= 1 && styles.stepperBtnDisabled]}
              onPress={() => setField("quantity", Math.max(1, form.quantity - 1))}
              disabled={form.quantity <= 1}
              activeOpacity={0.8}
            >
              <Feather name="minus" size={18} color={form.quantity <= 1 ? Colors.grayMedium : Colors.grayDark} />
            </TouchableOpacity>
            <View style={styles.stepperValue}>
              <Text style={styles.stepperValueText}>{form.quantity}</Text>
              <Text style={styles.stepperValueSub}>{rtl ? "وحدة" : "units"}</Text>
            </View>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setField("quantity", form.quantity + 1)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={18} color={Colors.grayDark} />
            </TouchableOpacity>
          </View>
          {errors.quantity && <FieldError msg={errors.quantity} />}
        </FormCard>

        {/* ── 6. Pickup Window ── */}
        <FormCard icon="clock" label={rtl ? "نافذة الاستلام" : "Pickup Window"} required rtl={rtl}>
          <Text style={[styles.fieldHint, rtl && styles.textRight]}>
            {rtl ? "استخدم صيغة HH:MM (مثال: 17:00)" : "Use HH:MM format (e.g. 17:00)"}
          </Text>
          <View style={[styles.timeRow, rtl && styles.rowRTL]}>
            <View style={styles.timeField}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>{rtl ? "من" : "From"}</Text>
              <View style={[styles.timeInputWrap, errors.pickupStart && styles.inputError]}>
                <Feather name="clock" size={15} color={Colors.grayMedium} style={styles.timeIcon} />
                <TextInput
                  style={[styles.timeInput, rtl && styles.textRight]}
                  placeholder="17:00"
                  placeholderTextColor={Colors.grayMedium}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  value={form.pickupStart}
                  onChangeText={v => setField("pickupStart", v)}
                  textAlign={rtl ? "right" : "left"}
                />
              </View>
              {errors.pickupStart && <FieldError msg={errors.pickupStart} />}
            </View>
            <View style={styles.timeSeparator}>
              <Text style={styles.timeSeparatorText}>—</Text>
            </View>
            <View style={styles.timeField}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>{rtl ? "إلى" : "To"}</Text>
              <View style={[styles.timeInputWrap, errors.pickupEnd && styles.inputError]}>
                <Feather name="clock" size={15} color={Colors.grayMedium} style={styles.timeIcon} />
                <TextInput
                  style={[styles.timeInput, rtl && styles.textRight]}
                  placeholder="20:00"
                  placeholderTextColor={Colors.grayMedium}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  value={form.pickupEnd}
                  onChangeText={v => setField("pickupEnd", v)}
                  textAlign={rtl ? "right" : "left"}
                />
              </View>
              {errors.pickupEnd && <FieldError msg={errors.pickupEnd} />}
            </View>
          </View>
        </FormCard>

        {/* ── 7. Freshness ── */}
        <FormCard icon="zap" label={rtl ? "طازجية المنتج" : "Freshness"} required rtl={rtl}>
          <View style={styles.freshnessGrid}>
            {FRESHNESS.map(opt => {
              const active = form.freshnessBadge === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.freshnessBtn,
                    { borderColor: active ? opt.color : Colors.grayLight },
                    active && { backgroundColor: opt.color + "12" },
                  ]}
                  onPress={() => setField("freshnessBadge", opt.value)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.freshnessIconWrap, { backgroundColor: opt.color + "20" }]}>
                    <Feather name={opt.icon} size={16} color={opt.color} />
                  </View>
                  <Text style={[styles.freshnessBtnText, active && { color: opt.color, fontWeight: "700" }]}>
                    {rtl ? opt.labelAr : opt.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FormCard>

        {/* ── 8. Additional (optional) ── */}
        <FormCard icon="info" label={rtl ? "معلومات إضافية" : "Additional Info"} rtl={rtl}>
          <Text style={[styles.fieldLabel, rtl && styles.textRight]}>
            {rtl ? "ملاحظة مسببات الحساسية" : "Allergen Note"}
            <Text style={styles.optionalTag}> {rtl ? "(اختياري)" : "(optional)"}</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.inputMulti, rtl && styles.textRight]}
            placeholder={rtl ? "مثال: يحتوي على غلوتين والمكسرات…" : "e.g. Contains gluten, nuts…"}
            placeholderTextColor={Colors.grayMedium}
            multiline
            numberOfLines={3}
            value={form.allergenNote}
            onChangeText={v => setField("allergenNote", v)}
            textAlign={rtl ? "right" : "left"}
            textAlignVertical="top"
          />

          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }, rtl && styles.textRight]}>
            {rtl ? "رابط الصورة" : "Photo URL"}
            <Text style={styles.optionalTag}> {rtl ? "(اختياري)" : "(optional)"}</Text>
          </Text>
          <View style={[styles.urlInputWrap, rtl && styles.rowRTL]}>
            <Feather name="image" size={16} color={Colors.grayMedium} />
            <TextInput
              style={[styles.urlInput, rtl && styles.textRight]}
              placeholder="https://..."
              placeholderTextColor={Colors.grayMedium}
              autoCapitalize="none"
              keyboardType="url"
              value={form.photoUrl}
              onChangeText={v => setField("photoUrl", v)}
              textAlign={rtl ? "right" : "left"}
            />
          </View>
        </FormCard>

      </ScrollView>

      {/* ── Footer ── */}
      <View style={[styles.footer, { paddingBottom: botPadding + 8 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Feather name={isEdit ? "save" : "upload-cloud"} size={18} color={Colors.white} />
              <Text style={styles.submitBtnText}>
                {rtl ? (isEdit ? "حفظ التغييرات" : "نشر القائمة") : (isEdit ? "Save Changes" : "Publish Listing")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── FormCard ─────────────────────────────────────────────────────────────────

function FormCard({
  icon, label, required, children, rtl,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  required?: boolean;
  children: React.ReactNode;
  rtl: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardHeader, rtl && styles.rowRTL]}>
        <View style={styles.cardIconWrap}>
          <Feather name={icon} size={14} color={Colors.primaryOrange} />
        </View>
        <Text style={[styles.cardLabel, rtl && styles.textRight]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

// ─── FieldError ───────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg: string }) {
  return (
    <View style={styles.fieldErrorRow}>
      <Feather name="alert-circle" size={12} color="#ef4444" />
      <Text style={styles.fieldErrorText}>{msg}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F5F0" },
  textRight: { textAlign: "right" },
  rowRTL: { flexDirection: "row-reverse" },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.grayLight, alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle:  { fontSize: 17, fontWeight: "800", color: Colors.grayDark },
  headerSub:    { fontSize: 12, color: Colors.grayMedium, marginTop: 1 },

  scroll: { padding: Spacing.lg, gap: Spacing.md },

  // Form card
  card: {
    backgroundColor: Colors.white, borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
  },
  cardIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center",
  },
  cardLabel:  { fontSize: 13, fontWeight: "700", color: Colors.grayDark, textTransform: "uppercase", letterSpacing: 0.5 },
  required:   { color: "#ef4444", fontWeight: "700" },
  cardBody:   { padding: Spacing.md },

  // Inputs
  input: {
    backgroundColor: Colors.grayLight, borderWidth: 1.5, borderColor: "transparent",
    borderRadius: 12, paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: 15, color: Colors.grayDark,
  },
  inputError:  { borderColor: "#ef4444", backgroundColor: "#fef2f2" },
  inputMulti:  { minHeight: 80, paddingTop: 10 },

  fieldLabel:   { fontSize: 12, fontWeight: "600", color: Colors.grayMedium, marginBottom: 6 },
  fieldHint:    { fontSize: 12, color: Colors.grayMedium, marginBottom: 8 },
  optionalTag:  { fontSize: 11, fontWeight: "400", color: Colors.grayMedium },

  fieldErrorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  fieldErrorText: { fontSize: 12, color: "#ef4444" },

  // Type buttons
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: {
    flex: 1, flexDirection: "column", alignItems: "center", gap: 8,
    paddingVertical: Spacing.md, borderRadius: 14,
    backgroundColor: Colors.grayLight, borderWidth: 1.5, borderColor: "transparent",
  },
  typeBtnActive: { backgroundColor: Colors.orangeLight, borderColor: Colors.primaryOrange },
  typeIconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
  },
  typeIconWrapActive: { backgroundColor: Colors.primaryOrange },
  typeBtnText:       { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },
  typeBtnTextActive: { color: Colors.primaryOrange, fontWeight: "700" },

  // Category chips
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.grayLight,
    backgroundColor: Colors.grayLight,
  },
  categoryChipText: { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },

  // Pricing
  priceRow:  { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  priceField: { flex: 1 },
  priceDivider: { paddingTop: 32, alignItems: "center" },
  priceInputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.grayLight, borderRadius: 12, borderWidth: 1.5, borderColor: "transparent",
    paddingHorizontal: 10,
  },
  priceInputWrapGreen: { backgroundColor: "#f0fdf4" },
  currencySign:      { fontSize: 16, fontWeight: "700", color: Colors.grayMedium, marginRight: 4 },
  currencySignGreen: { color: Colors.greenMain },
  priceInput:        { flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: "700", color: Colors.grayDark },
  discountBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#f0fdf4", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    alignSelf: "flex-start", marginTop: 8,
  },
  discountBadgeText: { fontSize: 13, fontWeight: "700", color: Colors.greenMain },

  // Quantity stepper
  stepperRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16,
  },
  stepperBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.grayLight, alignItems: "center", justifyContent: "center",
  },
  stepperBtnDisabled: { opacity: 0.4 },
  stepperValue: { alignItems: "center", minWidth: 60 },
  stepperValueText: { fontSize: 28, fontWeight: "800", color: Colors.grayDark },
  stepperValueSub:  { fontSize: 11, color: Colors.grayMedium, marginTop: -2 },

  // Pickup time
  timeRow:  { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 4 },
  timeField: { flex: 1 },
  timeSeparator: { paddingTop: 30, alignItems: "center" },
  timeSeparatorText: { fontSize: 16, color: Colors.grayMedium },
  timeInputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.grayLight, borderRadius: 12, borderWidth: 1.5, borderColor: "transparent",
    paddingHorizontal: 10,
  },
  timeIcon:  { marginRight: 6 },
  timeInput: { flex: 1, paddingVertical: 12, fontSize: 16, fontWeight: "600", color: Colors.grayDark },

  // Freshness
  freshnessGrid: { flexDirection: "row", gap: 8 },
  freshnessBtn: {
    flex: 1, alignItems: "center", gap: 8,
    paddingVertical: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight, backgroundColor: Colors.grayLight,
  },
  freshnessIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  freshnessBtnText: { fontSize: 11, fontWeight: "600", color: Colors.grayMedium, textAlign: "center" },

  // URL input
  urlInputWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.grayLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 2,
  },
  urlInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: Colors.grayDark },

  // Error banner (pinned below header)
  errorBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#ef4444", padding: Spacing.md,
  },
  errorBannerText: { fontSize: 13, fontWeight: "600", color: "#fff", flex: 1, lineHeight: 18 },

  // Footer
  footer: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.grayLight,
  },
  submitBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 16,
    paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: Colors.primaryOrange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { fontSize: 16, fontWeight: "800", color: Colors.white },
});
