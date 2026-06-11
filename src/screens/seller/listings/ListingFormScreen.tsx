import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, KeyboardAvoidingView, Alert, Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { isRTL } from "../../../i18n";
import { useListingForm } from "../../../hooks/seller/useListingForm";
import {
  scoreListingTitle, getPriceSuggestion, suggestAllergens,
} from "../../../services/seller/listingAI.service";
import type { TitleScoreResult, PriceSuggestionResult } from "../../../services/seller/listingAI.service";
import type { SellerListing } from "../../../services/seller/seller.service";
import ListingPhotoPicker from "../../../components/seller/ListingPhotoPicker";

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

  const {
    form, errors, loading, submitError, isEdit, setField, submit,
    photoUri, photoUploading, handlePhotoSelected, handlePhotoRemoved,
  } = useListingForm(existing);

  // ── AI state ─────────────────────────────────────────────────────────────────
  const [titleScore,       setTitleScore]       = useState<TitleScoreResult | null>(null);
  const [titleScoring,     setTitleScoring]     = useState(false);
  const [priceSugg,        setPriceSugg]        = useState<PriceSuggestionResult | null>(null);
  const [allergenDetecting, setAllergenDetecting] = useState(false);
  // ── AI handlers ───────────────────────────────────────────────────────────────

  const handleScoreTitle = useCallback(async () => {
    if (form.title.trim().length < 3) return;
    setTitleScoring(true);
    setTitleScore(null);
    try {
      const res = await scoreListingTitle(form.title.trim(), form.category);
      setTitleScore(res);
    } catch {
      // Non-critical — silently fail
    } finally {
      setTitleScoring(false);
    }
  }, [form.title, form.category]);

  const handlePriceSuggestion = useCallback(async () => {
    const orig = Number(form.originalPrice);
    if (!form.category || !orig || orig <= 0) return;
    try {
      const res = await getPriceSuggestion(form.category, orig);
      setPriceSugg(res);
    } catch {
      // Non-critical
    }
  }, [form.category, form.originalPrice]);

  const handleAllergenDetect = useCallback(async () => {
    if (!form.title.trim()) return;
    setAllergenDetecting(true);
    try {
      const res = await suggestAllergens(form.title.trim());
      if (res.allergens?.length) {
        setField("allergenNote", res.allergens.join("، "));
      }
    } catch {
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر اكتشاف مسببات الحساسية" : "Could not detect allergens");
    } finally {
      setAllergenDetecting(false);
    }
  }, [form.title, rtl, setField]);

  // Trigger price suggestion whenever category or original price changes
  React.useEffect(() => {
    const orig = Number(form.originalPrice);
    if (form.category && orig > 0) {
      const t = setTimeout(() => handlePriceSuggestion(), 600);
      return () => clearTimeout(t);
    }
  }, [form.category, form.originalPrice]);

  // ── Score bar color (0–49 red, 50–74 orange, 75–100 green) ──────────────────
  const scoreColor = !titleScore ? Colors.grayMedium
    : titleScore.score >= 75 ? Colors.greenMain
    : titleScore.score >= 50 ? Colors.primaryOrange
    : "#EF4444";

  const scoreLabel = !titleScore ? ""
    : titleScore.score >= 75 ? (rtl ? "ممتاز" : "Excellent")
    : titleScore.score >= 50 ? (rtl ? "مقبول" : "Acceptable")
    : (rtl ? "ضعيف" : "Weak");

  const handleSubmit = async () => {
    try {
      await submit();
      onComplete();
    } catch {
      // submitError is already set inside the hook
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
          <View style={[styles.titleRow, rtl && { flexDirection: "row-reverse" }]}>
            <TextInput
              style={[styles.input, styles.titleInput, errors.title && styles.inputError, rtl && styles.textRight]}
              placeholder={rtl ? "مثال: كيس مفاجأة المساء" : "e.g. Evening Surprise Bag"}
              placeholderTextColor={Colors.grayMedium}
              value={form.title}
              onChangeText={v => { setField("title", v); setTitleScore(null); }}
              textAlign={rtl ? "right" : "left"}
            />
            <TouchableOpacity
              style={[styles.scoreTitleBtn, (titleScoring || form.title.trim().length < 3) && styles.scoreTitleBtnDisabled]}
              onPress={handleScoreTitle}
              disabled={titleScoring || form.title.trim().length < 3}
              activeOpacity={0.8}
            >
              {titleScoring
                ? <ActivityIndicator size="small" color={Colors.primaryOrange} />
                : <Text style={styles.scoreTitleBtnText}>✨ {rtl ? "قيّم" : "Score"}</Text>
              }
            </TouchableOpacity>
          </View>
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          {/* Title score result */}
          {titleScore && !titleScoring && (
            <View style={styles.scoreCard}>
              <View style={[styles.scoreBarRow, rtl && { flexDirection: "row-reverse" }]}>
                <View style={styles.scoreBarBg}>
                  <View style={[styles.scoreBarFill, { width: `${titleScore.score}%` as any, backgroundColor: scoreColor }]} />
                </View>
                <Text style={[styles.scoreNumber, { color: scoreColor }]}>
                  {titleScore.score}/100 · {scoreLabel}
                </Text>
              </View>
              <Text style={[styles.scoreFeedback, rtl && { textAlign: "right" }]}>{titleScore.feedback}</Text>
              {titleScore.suggestedTitle && titleScore.score < 60 && (
                <TouchableOpacity
                  style={styles.scoreSuggBtn}
                  onPress={() => { setField("title", titleScore.suggestedTitle!); setTitleScore(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scoreSuggBtnText}>
                    💡 {rtl ? "استخدام العنوان المقترح" : "Use this title"}: "{titleScore.suggestedTitle}"
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── Description ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "الوصف" : "Description"}
            <Text style={styles.optional}> {rtl ? "(اختياري)" : "(optional)"}</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, rtl && styles.textRight]}
            placeholder={rtl ? "وصف مختصر للمحتويات..." : "Brief description of the contents..."}
            placeholderTextColor={Colors.grayMedium}
            multiline
            numberOfLines={3}
            value={form.description}
            onChangeText={v => setField("description", v)}
            textAlign={rtl ? "right" : "left"}
            textAlignVertical="top"
          />
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

          {/* AI price suggestion chip */}
          {priceSugg && (
            <TouchableOpacity
              style={styles.priceSuggChip}
              onPress={() => setField("discountedPrice", String(priceSugg.suggestedPrice))}
              activeOpacity={0.8}
            >
              <Text style={styles.priceSuggText}>
                💡 {rtl ? `الأنسب: ${priceSugg.suggestedPrice} ₪ (خصم ${priceSugg.discountPct}%) — اضغط للتطبيق` : `Suggested: ₪${priceSugg.suggestedPrice} (${priceSugg.discountPct}% off) — tap to apply`}
              </Text>
            </TouchableOpacity>
          )}
          {priceSugg?.reasoning && (
            <Text style={[styles.priceSuggReason, rtl && { textAlign: "right" }]}>{priceSugg.reasoning}</Text>
          )}

          {/* Dynamic price decay toggle */}
          <View style={[styles.decayRow, rtl && { flexDirection: "row-reverse" }]}>
            <View style={[styles.decayLabelWrap, rtl && { alignItems: "flex-end" }]}>
              <Text style={styles.decayTitle}>
                🔥 {rtl ? "تفعيل انخفاض السعر تلقائياً" : "Enable auto price decay"}
              </Text>
              <Text style={styles.decaySub}>
                {rtl
                  ? "ينخفض السعر تدريجياً حتى وقت الاستلام"
                  : "Price drops gradually toward pickup time"}
              </Text>
            </View>
            <Switch
              value={form.isPriceDecaying}
              onValueChange={v => setField("isPriceDecaying", v)}
              trackColor={{ false: Colors.grayLight, true: Colors.primaryOrange }}
              thumbColor={Colors.white}
            />
          </View>

          {form.isPriceDecaying && (
            <View style={styles.floorPriceWrap}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>
                {rtl ? "الحد الأدنى للسعر (₪)" : "Floor price (₪)"}
              </Text>
              <TextInput
                style={[styles.input, styles.inputShort, rtl && styles.textRight]}
                placeholder="0.00"
                placeholderTextColor={Colors.grayMedium}
                keyboardType="decimal-pad"
                value={form.floorPrice}
                onChangeText={v => setField("floorPrice", v)}
                textAlign={rtl ? "right" : "left"}
              />
              <Text style={[styles.decaySub, { marginTop: 4 }]}>
                {rtl ? "السعر لن ينخفض أقل من هذا الرقم" : "Price will not drop below this amount"}
              </Text>
            </View>
          )}
        </View>

        {/* ── Quantity ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "الكمية المتاحة" : "Available Quantity"} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepperBtn, { borderRadius: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12, borderRightWidth: 0 }]}
              onPress={() => {
                const v = Math.max(1, Number(form.quantity) - 1);
                setField("quantity", String(v));
              }}
              activeOpacity={0.7}
            >
              <Feather name="minus" size={18} color={Colors.primaryOrange} />
            </TouchableOpacity>
            <TextInput
              style={[styles.stepperInput, errors.quantity && { borderColor: "#ef4444" }]}
              keyboardType="number-pad"
              value={form.quantity}
              onChangeText={v => setField("quantity", v.replace(/\D/g, ""))}
              textAlign="center"
            />
            <TouchableOpacity
              style={[styles.stepperBtn, { borderRadius: 0, borderTopRightRadius: 12, borderBottomRightRadius: 12, borderLeftWidth: 0 }]}
              onPress={() => setField("quantity", String(Number(form.quantity) + 1))}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={18} color={Colors.primaryOrange} />
            </TouchableOpacity>
          </View>
          {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
        </View>

        {/* ── Pickup Window ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "نافذة الاستلام" : "Pickup Window"} <Text style={styles.required}>*</Text>
          </Text>
          <View style={[styles.row, rtl && styles.rowRTL]}>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>{rtl ? "من" : "From"}</Text>
              <TimeStepperInput
                value={form.pickupStart}
                onChange={v => setField("pickupStart", v)}
                hasError={!!errors.pickupStart}
              />
              {errors.pickupStart && <Text style={styles.errorText}>{errors.pickupStart}</Text>}
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, rtl && styles.textRight]}>{rtl ? "إلى" : "To"}</Text>
              <TimeStepperInput
                value={form.pickupEnd}
                onChange={v => setField("pickupEnd", v)}
                hasError={!!errors.pickupEnd}
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

        {/* ── Expiry Date (SPECIFIC_PARCEL only) ── */}
        {form.type === "SPECIFIC_PARCEL" && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
              {rtl ? "تاريخ الصلاحية" : "Expiry Date"} <Text style={styles.required}>*</Text>
            </Text>
            <DatePickerInput
              value={form.expiryDate}
              onChange={v => setField("expiryDate", v)}
              hasError={!!errors.expiryDate}
            />
            {errors.expiryDate && <Text style={styles.errorText}>{errors.expiryDate}</Text>}
          </View>
        )}

        {/* ── Price Decay Toggle ── */}
        <View style={styles.section}>
          <View style={[styles.switchRow, rtl && styles.rowRTL]}>
            <View style={styles.switchLabelWrap}>
              <Text style={[styles.sectionLabel, rtl && styles.textRight, { marginBottom: 2 }]}>
                {rtl ? "السعر المتناقص تلقائياً" : "Auto-Decaying Price"}
              </Text>
              <Text style={[styles.switchSubtext, rtl && styles.textRight]}>
                {rtl
                  ? "ينخفض السعر تلقائياً كلما اقترب وقت الاستلام"
                  : "Price drops automatically as pickup time approaches"}
              </Text>
            </View>
            <Switch
              value={form.isPriceDecaying}
              onValueChange={v => setField("isPriceDecaying", v)}
              trackColor={{ false: Colors.grayLight, true: Colors.primaryOrange + "80" }}
              thumbColor={form.isPriceDecaying ? Colors.primaryOrange : "#f4f3f4"}
            />
          </View>
        </View>

        {/* ── Floor Price (only when isPriceDecaying) ── */}
        {form.isPriceDecaying && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
              {rtl ? "الحد الأدنى للسعر (₪)" : "Floor Price (₪)"} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.floorPrice && styles.inputError, rtl && styles.textRight]}
              placeholder="0.00"
              placeholderTextColor={Colors.grayMedium}
              keyboardType="decimal-pad"
              value={form.floorPrice}
              onChangeText={v => setField("floorPrice", v)}
              textAlign={rtl ? "right" : "left"}
            />
            {errors.floorPrice && <Text style={styles.errorText}>{errors.floorPrice}</Text>}
          </View>
        )}

        {/* ── Allergen Note ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "ملاحظة المواد المسببة للحساسية" : "Allergen Note"}
            <Text style={styles.optional}> {rtl ? "(اختياري)" : "(optional)"}</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.inputMultiline, rtl && styles.textRight]}
            placeholder={rtl ? "مثال: يحتوي على غلوتين والمكسرات..." : "e.g. Contains gluten, nuts..."}
            placeholderTextColor={Colors.grayMedium}
            multiline
            numberOfLines={3}
            value={form.allergenNote}
            onChangeText={v => setField("allergenNote", v)}
            textAlign={rtl ? "right" : "left"}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.allergenBtn, (!form.title.trim() || allergenDetecting) && { opacity: 0.5 }]}
            onPress={handleAllergenDetect}
            disabled={!form.title.trim() || allergenDetecting}
            activeOpacity={0.8}
          >
            {allergenDetecting
              ? <ActivityIndicator size="small" color={Colors.primaryOrange} />
              : <Text style={styles.allergenBtnText}>
                  🧪 {rtl ? "اكتشاف مسببات الحساسية تلقائياً" : "Auto-detect allergens"}
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── Description ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "وصف" : "Description"}
            <Text style={styles.optional}> {rtl ? "(اختياري)" : "(optional)"}</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.inputMultiline, rtl && styles.textRight]}
            placeholder={rtl ? "صِف محتوى الطرد أو أي تفاصيل إضافية..." : "Describe the bag contents or any extra details..."}
            placeholderTextColor={Colors.grayMedium}
            multiline
            numberOfLines={4}
            value={form.description}
            onChangeText={v => setField("description", v)}
            textAlign={rtl ? "right" : "left"}
            textAlignVertical="top"
          />
        </View>

        {/* ── Photo ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.textRight]}>
            {rtl ? "صورة الإدراج" : "Listing Photo"}
            <Text style={styles.optional}> {rtl ? "(اختياري)" : "(optional)"}</Text>
          </Text>
          <ListingPhotoPicker
            photoUri={photoUri}
            onPhotoSelected={handlePhotoSelected}
            onPhotoRemoved={handlePhotoRemoved}
            uploading={photoUploading}
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
          style={[styles.submitBtn, (loading || photoUploading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading || photoUploading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : photoUploading ? (
            <Text style={styles.submitBtnText}>
              {rtl ? "جارٍ رفع الصورة..." : "Uploading photo..."}
            </Text>
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

// ─── Time stepper ─────────────────────────────────────────────────────────────

function parseHHMM(raw: string): { h: number; m: number } {
  const [hStr = "0", mStr = "0"] = raw.split(":");
  return { h: Math.min(23, Math.max(0, parseInt(hStr, 10) || 0)), m: Math.min(59, Math.max(0, parseInt(mStr, 10) || 0)) };
}

function formatHHMM(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function TimeStepperInput({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError: boolean }) {
  const { h, m } = parseHHMM(value);

  const adjustH = (delta: number) => onChange(formatHHMM((h + delta + 24) % 24, m));
  const adjustM = (delta: number) => {
    let newM = m + delta;
    let newH = h;
    if (newM < 0)  { newM += 60; newH = (newH - 1 + 24) % 24; }
    if (newM >= 60){ newM -= 60; newH = (newH + 1) % 24; }
    onChange(formatHHMM(newH, newM));
  };

  return (
    <View style={[timeStyles.wrap, hasError && timeStyles.wrapError]}>
      {/* Hours */}
      <View style={timeStyles.unit}>
        <TouchableOpacity onPress={() => adjustH(1)} style={timeStyles.arrow} activeOpacity={0.7}>
          <Feather name="chevron-up" size={16} color={Colors.primaryOrange} />
        </TouchableOpacity>
        <TextInput
          style={timeStyles.digit}
          value={String(h).padStart(2, "0")}
          keyboardType="number-pad"
          maxLength={2}
          textAlign="center"
          onChangeText={(v) => {
            const n = parseInt(v, 10);
            onChange(formatHHMM(isNaN(n) ? h : Math.min(23, n), m));
          }}
        />
        <TouchableOpacity onPress={() => adjustH(-1)} style={timeStyles.arrow} activeOpacity={0.7}>
          <Feather name="chevron-down" size={16} color={Colors.primaryOrange} />
        </TouchableOpacity>
      </View>
      <Text style={timeStyles.colon}>:</Text>
      {/* Minutes */}
      <View style={timeStyles.unit}>
        <TouchableOpacity onPress={() => adjustM(5)} style={timeStyles.arrow} activeOpacity={0.7}>
          <Feather name="chevron-up" size={16} color={Colors.primaryOrange} />
        </TouchableOpacity>
        <TextInput
          style={timeStyles.digit}
          value={String(m).padStart(2, "0")}
          keyboardType="number-pad"
          maxLength={2}
          textAlign="center"
          onChangeText={(v) => {
            const n = parseInt(v, 10);
            onChange(formatHHMM(h, isNaN(n) ? m : Math.min(59, n)));
          }}
        />
        <TouchableOpacity onPress={() => adjustM(-5)} style={timeStyles.arrow} activeOpacity={0.7}>
          <Feather name="chevron-down" size={16} color={Colors.primaryOrange} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Date picker ─────────────────────────────────────────────────────────────

function parseDateStr(raw: string): { d: number; mo: number; y: number } {
  if (!raw) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { d: tomorrow.getDate(), mo: tomorrow.getMonth() + 1, y: tomorrow.getFullYear() };
  }
  const parts = raw.split("-").map(Number);
  return { d: parts[2] || 1, mo: parts[1] || 1, y: parts[0] || new Date().getFullYear() };
}

function formatDateStr(d: number, mo: number, y: number): string {
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(mo: number, y: number): number {
  return new Date(y, mo, 0).getDate();
}

function DatePickerInput({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError: boolean }) {
  const { d, mo, y } = parseDateStr(value || "");

  const update = (newD: number, newMo: number, newY: number) => {
    const maxD = daysInMonth(newMo, newY);
    onChange(formatDateStr(Math.min(newD, maxD), newMo, newY));
  };

  const adjustD  = (delta: number) => { const maxD = daysInMonth(mo, y); update(((d - 1 + delta + maxD) % maxD) + 1, mo, y); };
  const adjustMo = (delta: number) => { const newMo = ((mo - 1 + delta + 12) % 12) + 1; update(d, newMo, y); };
  const adjustY  = (delta: number) => update(d, mo, y + delta);

  const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

  return (
    <View style={[dateStyles.wrap, hasError && dateStyles.wrapError]}>
      {/* Day */}
      <View style={dateStyles.unit}>
        <TouchableOpacity onPress={() => adjustD(1)} style={dateStyles.arrow} activeOpacity={0.7}>
          <Text style={dateStyles.arrowIcon}>▲</Text>
        </TouchableOpacity>
        <Text style={dateStyles.digit}>{String(d).padStart(2, "0")}</Text>
        <TouchableOpacity onPress={() => adjustD(-1)} style={dateStyles.arrow} activeOpacity={0.7}>
          <Text style={dateStyles.arrowIcon}>▼</Text>
        </TouchableOpacity>
      </View>
      <Text style={dateStyles.sep}>/</Text>
      {/* Month */}
      <View style={dateStyles.unit}>
        <TouchableOpacity onPress={() => adjustMo(1)} style={dateStyles.arrow} activeOpacity={0.7}>
          <Text style={dateStyles.arrowIcon}>▲</Text>
        </TouchableOpacity>
        <Text style={dateStyles.monthText}>{MONTHS_AR[mo - 1]}</Text>
        <TouchableOpacity onPress={() => adjustMo(-1)} style={dateStyles.arrow} activeOpacity={0.7}>
          <Text style={dateStyles.arrowIcon}>▼</Text>
        </TouchableOpacity>
      </View>
      <Text style={dateStyles.sep}>/</Text>
      {/* Year */}
      <View style={dateStyles.unit}>
        <TouchableOpacity onPress={() => adjustY(1)} style={dateStyles.arrow} activeOpacity={0.7}>
          <Text style={dateStyles.arrowIcon}>▲</Text>
        </TouchableOpacity>
        <Text style={dateStyles.digit}>{y}</Text>
        <TouchableOpacity onPress={() => adjustY(-1)} style={dateStyles.arrow} activeOpacity={0.7}>
          <Text style={dateStyles.arrowIcon}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const dateStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
    borderRadius: 14, paddingVertical: 4, paddingHorizontal: 12, gap: 4, alignSelf: "flex-start",
  },
  wrapError: { borderColor: "#ef4444" },
  unit: { alignItems: "center", gap: 2 },
  arrow: { padding: 4 },
  arrowIcon: { fontSize: 10, color: Colors.primaryOrange, fontWeight: "700" },
  digit: { fontSize: 20, fontWeight: "700", color: Colors.grayDark, minWidth: 36, textAlign: "center" },
  monthText: { fontSize: 14, fontWeight: "700", color: Colors.grayDark, minWidth: 70, textAlign: "center" },
  sep: { fontSize: 20, fontWeight: "700", color: Colors.grayDark, marginBottom: 2 },
});

const timeStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
    borderRadius: 14, paddingVertical: 4, paddingHorizontal: 12, gap: 4,
  },
  wrapError: { borderColor: "#ef4444" },
  unit: { alignItems: "center", gap: 0 },
  arrow: { padding: 4 },
  digit: {
    fontSize: 22, fontWeight: "700", color: Colors.grayDark,
    width: 40, textAlign: "center",
  },
  colon: { fontSize: 22, fontWeight: "700", color: Colors.grayDark, marginBottom: 2 },
});

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

  stepperRow: { flexDirection: "row", alignItems: "center", gap: 0, alignSelf: "flex-start" },
  stepperBtn: {
    width: 44, height: 48, borderWidth: 1.5, borderColor: Colors.grayLight,
    backgroundColor: Colors.white, alignItems: "center", justifyContent: "center",
    borderRadius: 0,
  },
  stepperInput: {
    width: 72, height: 48,
    backgroundColor: Colors.white, borderTopWidth: 1.5, borderBottomWidth: 1.5,
    borderColor: Colors.grayLight, fontSize: 16, fontWeight: "700", color: Colors.grayDark,
  },

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

  // ── Title scorer ───────────────────────────────────────────────────────────
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  titleInput: { flex: 1 },
  scoreTitleBtn: {
    paddingHorizontal: 12, paddingVertical: 11,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.primaryOrange,
    backgroundColor: Colors.orangeLight, minWidth: 64, alignItems: "center",
  },
  scoreTitleBtnDisabled: { opacity: 0.4 },
  scoreTitleBtnText: { fontSize: 12, fontWeight: "700", color: Colors.primaryOrange },

  scoreCard: {
    marginTop: 8, backgroundColor: "#F9FAFB", borderRadius: 10,
    padding: 10, gap: 6,
  },
  scoreBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  scoreBarBg: {
    flex: 1, height: 7, backgroundColor: Colors.grayLight, borderRadius: 4, overflow: "hidden",
  },
  scoreBarFill: { height: "100%", borderRadius: 4 },
  scoreNumber: { fontSize: 12, fontWeight: "700", minWidth: 96 },
  scoreFeedback: { fontSize: 12, color: Colors.grayDark, lineHeight: 17 },
  scoreSuggBtn: {
    marginTop: 2, backgroundColor: Colors.orangeLight, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.primaryOrange, paddingHorizontal: 10, paddingVertical: 8,
  },
  scoreSuggBtnText: { fontSize: 12, color: Colors.primaryOrange, fontWeight: "600", lineHeight: 17 },

  priceSuggChip: {
    marginTop: 8, backgroundColor: Colors.orangeLight,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.primaryOrange,
  },
  priceSuggText: { fontSize: 12, color: Colors.primaryOrange, fontWeight: "600" },
  priceSuggReason: { fontSize: 11, color: Colors.grayMedium, marginTop: 4 },

  allergenBtn: {
    marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderWidth: 1, borderColor: Colors.primaryOrange,
    borderRadius: 10, paddingVertical: 10,
  },
  allergenBtnText: { fontSize: 13, color: Colors.primaryOrange, fontWeight: "600" },

  textArea: { minHeight: 80, paddingTop: 12, textAlignVertical: "top" },

  decayRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginTop: 12, gap: 12,
  },
  decayLabelWrap: { flex: 1 },
  decayTitle: { fontSize: 13, fontWeight: "700", color: Colors.grayDark },
  decaySub:   { fontSize: 11, color: Colors.grayMedium, marginTop: 2 },
  floorPriceWrap: { marginTop: 10, gap: 4 },


  switchRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.white, borderRadius: 14, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  switchLabelWrap: { flex: 1, marginRight: Spacing.md },
  switchSubtext: { fontSize: 12, color: Colors.grayMedium, marginTop: 2 },
});
