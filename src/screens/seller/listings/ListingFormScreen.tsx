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
  { value: "MEAL_BAG",        labelEn: "Surprise Bag",     labelAr: "كيس مفاجأة"    },
  { value: "SPECIFIC_PARCEL", labelEn: "Specific Parcel",  labelAr: "طرد محدد"      },
] as const;

const CATEGORIES = [
  { value: "MEALS",              labelEn: "Meals",             labelAr: "وجبات"          },
  { value: "BREAD_AND_PASTRIES", labelEn: "Bread & Pastries",  labelAr: "خبز ومعجنات"    },
  { value: "GROCERIES",          labelEn: "Groceries",         labelAr: "بقالة"          },
  { value: "MIXED",              labelEn: "Mixed",             labelAr: "متنوع"          },
] as const;

const FRESHNESS = [
  { value: "eat_today",    labelEn: "Eat Today",     labelAr: "أكله اليوم",    color: "#ef4444" },
  { value: "fresh_tonight",labelEn: "Fresh Tonight", labelAr: "طازج الليلة",   color: Colors.primaryOrange },
  { value: "good_1_2_days",labelEn: "1–2 Days",      labelAr: "يوم أو يومان",  color: Colors.greenMain },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ListingFormScreen({ existing, onBack, onComplete }: ListingFormScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const botPadding = Platform.OS === "web" ? 24 : insets.bottom;
  const rtl        = isRTL();

  const { form, errors, loading, submitError, isEdit, setField, submit } = useListingForm(existing);

  const handleSubmit = async () => {
    try {
      await submit();
      onComplete();
    } catch {
      // submitError is set inside the hook
    }
  };

  const titleEn = isEdit ? "Edit Listing" : "New Listing";
  const titleAr = isEdit ? "تعديل القائمة" : "إضافة قائمة";

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{rtl ? titleAr : titleEn}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: botPadding + 100 }]}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Title ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "عنوان القائمة" : "Listing Title"} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError, rtl && styles.textRight]}
            placeholder={rtl ? "مثال: كيس مفاجأة المساء" : "e.g. Evening Surprise Bag"}
            placeholderTextColor={Colors.grayMedium}
            value={form.title}
            onChangeText={v => setField("title", v)}
            textAlign={rtl ? "right" : "left"}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* ── Type ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "نوع القائمة" : "Type"} <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.chipRow, rtl && styles.chipRowRTL]}>
            {TYPES.map(opt => {
              const active = form.type === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setField("type", opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {rtl ? opt.labelAr : opt.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Category ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "الفئة" : "Category"} <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.chipRow, styles.chipRowWrap, rtl && styles.chipRowRTL]}>
            {CATEGORIES.map(opt => {
              const active = form.category === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setField("category", opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {rtl ? opt.labelAr : opt.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Pricing ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "السعر (₪)" : "Pricing (₪)"} <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.row, rtl && styles.rowRTL]}>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>
                {rtl ? "السعر الأصلي" : "Original"}
              </Text>
              <TextInput
                style={[styles.input, errors.originalPrice && styles.inputError, rtl && styles.textRight]}
                placeholder="0.00"
                placeholderTextColor={Colors.grayMedium}
                keyboardType="decimal-pad"
                value={form.originalPrice}
                onChangeText={v => setField("originalPrice", v)}
                textAlign={rtl ? "right" : "left"}
              />
              {errors.originalPrice && <Text style={styles.errorText}>{errors.originalPrice}</Text>}
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>
                {rtl ? "السعر المخفض" : "Discounted"}
              </Text>
              <TextInput
                style={[styles.input, errors.discountedPrice && styles.inputError, rtl && styles.textRight]}
                placeholder="0.00"
                placeholderTextColor={Colors.grayMedium}
                keyboardType="decimal-pad"
                value={form.discountedPrice}
                onChangeText={v => setField("discountedPrice", v)}
                textAlign={rtl ? "right" : "left"}
              />
              {errors.discountedPrice && <Text style={styles.errorText}>{errors.discountedPrice}</Text>}
            </View>
          </View>
        </View>

        {/* ── Quantity ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "الكمية المتاحة" : "Available Quantity"} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.inputShort, errors.quantity && styles.inputError, rtl && styles.textRight]}
            placeholder="1"
            placeholderTextColor={Colors.grayMedium}
            keyboardType="number-pad"
            value={form.quantity}
            onChangeText={v => setField("quantity", v)}
            textAlign={rtl ? "right" : "left"}
          />
          {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
        </View>

        {/* ── Pickup Window ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "نافذة الاستلام (HH:MM)" : "Pickup Window (HH:MM)"} <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.row, rtl && styles.rowRTL]}>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>{rtl ? "من" : "From"}</Text>
              <TextInput
                style={[styles.input, errors.pickupStart && styles.inputError, rtl && styles.textRight]}
                placeholder="17:00"
                placeholderTextColor={Colors.grayMedium}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                value={form.pickupStart}
                onChangeText={v => setField("pickupStart", v)}
                textAlign={rtl ? "right" : "left"}
              />
              {errors.pickupStart && <Text style={styles.errorText}>{errors.pickupStart}</Text>}
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>{rtl ? "إلى" : "To"}</Text>
              <TextInput
                style={[styles.input, errors.pickupEnd && styles.inputError, rtl && styles.textRight]}
                placeholder="20:00"
                placeholderTextColor={Colors.grayMedium}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                value={form.pickupEnd}
                onChangeText={v => setField("pickupEnd", v)}
                textAlign={rtl ? "right" : "left"}
              />
              {errors.pickupEnd && <Text style={styles.errorText}>{errors.pickupEnd}</Text>}
            </View>
          </View>
        </View>

        {/* ── Freshness Badge ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "طازجية المنتج" : "Freshness"} <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.chipRow, rtl && styles.chipRowRTL]}>
            {FRESHNESS.map(opt => {
              const active = form.freshnessBadge === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.chip,
                    active && { backgroundColor: opt.color + "18", borderColor: opt.color },
                  ]}
                  onPress={() => setField("freshnessBadge", opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active && { color: opt.color, fontWeight: "700" }]}>
                    {rtl ? opt.labelAr : opt.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Allergen Note ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "ملاحظة المواد المسببة للحساسية" : "Allergen Note"}
            <Text style={styles.optional}> {rtl ? "(اختياري)" : "(optional)"}</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.inputMultiline, rtl && styles.textRight]}
            placeholder={rtl ? "مثال: يحتوي على غلوتين والحبوب..." : "e.g. Contains gluten, nuts..."}
            placeholderTextColor={Colors.grayMedium}
            multiline
            numberOfLines={3}
            value={form.allergenNote}
            onChangeText={v => setField("allergenNote", v)}
            textAlign={rtl ? "right" : "left"}
            textAlignVertical="top"
          />
        </View>

        {/* ── Photo URL ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "رابط الصورة" : "Photo URL"}
            <Text style={styles.optional}> {rtl ? "(اختياري)" : "(optional)"}</Text>
          </Text>
          <TextInput
            style={[styles.input, rtl && styles.textRight]}
            placeholder="https://..."
            placeholderTextColor={Colors.grayMedium}
            autoCapitalize="none"
            keyboardType="url"
            value={form.photoUrl}
            onChangeText={v => setField("photoUrl", v)}
            textAlign={rtl ? "right" : "left"}
          />
        </View>

        {/* ── Submit error ── */}
        {submitError !== "" && (
          <View style={styles.submitErrorBox}>
            <Feather name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        )}

      </ScrollView>

      {/* ── Submit button ── */}
      <View style={[styles.footer, { paddingBottom: botPadding + 12 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={styles.submitBtnText}>
              {rtl
                ? (isEdit ? "حفظ التغييرات" : "نشر القائمة")
                : (isEdit ? "Save Changes"  : "Publish Listing")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  textRight: { textAlign: "right" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.grayDark },

  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: 4 },

  section: { marginBottom: Spacing.lg },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: Colors.grayDark, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldLabel:   { fontSize: 12, fontWeight: "600", color: Colors.grayMedium, marginBottom: 6 },
  required:     { color: "#ef4444" },
  optional:     { fontSize: 12, fontWeight: "400", color: Colors.grayMedium, textTransform: "none" },

  input: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.grayDark,
  },
  inputError:     { borderColor: "#ef4444" },
  inputShort:     { width: 120 },
  inputMultiline: { minHeight: 90, paddingTop: 12 },

  errorText: { fontSize: 12, color: "#ef4444", marginTop: 4 },

  row:    { flexDirection: "row",         gap: 12 },
  rowRTL: { flexDirection: "row-reverse", gap: 12 },
  halfField: { flex: 1 },

  chipRow:     { flexDirection: "row",         flexWrap: "nowrap", gap: 8 },
  chipRowRTL:  { flexDirection: "row-reverse", flexWrap: "nowrap", gap: 8 },
  chipRowWrap: { flexWrap: "wrap" },

  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22, borderWidth: 1.5, borderColor: Colors.grayLight,
    backgroundColor: Colors.white,
  },
  chipActive:     { backgroundColor: Colors.orangeLight, borderColor: Colors.primaryOrange },
  chipText:       { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },
  chipTextActive: { color: Colors.primaryOrange },

  submitErrorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fef2f2", borderRadius: 12,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  submitErrorText: { fontSize: 13, color: "#ef4444", flex: 1 },

  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
  },
  submitBtn: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { fontSize: 16, fontWeight: "800", color: Colors.white },
});
