import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator, KeyboardAvoidingView, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors, Spacing } from "../../../theme";
import { isRTL } from "../../../i18n";
import { useListingForm } from "../../../hooks/seller/useListingForm";
import {
  scoreListingTitle, getPriceSuggestion, suggestAllergens, analyzeListingImage,
} from "../../../services/seller/listingAI.service";
import type { TitleScoreResult, PriceSuggestionResult, ImageAnalysisResult } from "../../../services/seller/listingAI.service";
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

  // ── AI state ─────────────────────────────────────────────────────────────────
  const [titleScore,       setTitleScore]       = useState<TitleScoreResult | null>(null);
  const [titleScoring,     setTitleScoring]     = useState(false);
  const [priceSugg,        setPriceSugg]        = useState<PriceSuggestionResult | null>(null);
  const [allergenDetecting, setAllergenDetecting] = useState(false);
  const [imageAnalysis,    setImageAnalysis]    = useState<ImageAnalysisResult | null>(null);
  const [imageAnalyzing,   setImageAnalyzing]   = useState(false);

  // ── AI handlers ───────────────────────────────────────────────────────────────

  const handleTitleBlur = useCallback(async () => {
    if (form.title.trim().length < 3) return;
    setTitleScoring(true);
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

  const handleAnalyzeImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(rtl ? "إذن مطلوب" : "Permission Required", rtl ? "يرجى السماح بالوصول إلى الصور" : "Please allow access to your photo library");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setImageAnalyzing(true);
    setImageAnalysis(null);
    try {
      const analysis = await analyzeListingImage(result.assets[0].uri);
      setImageAnalysis(analysis);
    } catch {
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر تحليل الصورة" : "Could not analyze image");
    } finally {
      setImageAnalyzing(false);
    }
  }, [rtl]);

  // Trigger price suggestion whenever category or original price changes
  React.useEffect(() => {
    const orig = Number(form.originalPrice);
    if (form.category && orig > 0) {
      const t = setTimeout(() => handlePriceSuggestion(), 600);
      return () => clearTimeout(t);
    }
  }, [form.category, form.originalPrice]);

  // ── Score bar color ──────────────────────────────────────────────────────────
  const scoreColor = !titleScore ? Colors.grayMedium
    : titleScore.score >= 70 ? Colors.greenMain
    : titleScore.score >= 41 ? Colors.primaryOrange
    : "#EF4444";

  const scoreLabel = !titleScore ? ""
    : titleScore.score >= 70 ? (rtl ? "ممتاز" : "Excellent")
    : titleScore.score >= 41 ? (rtl ? "مقبول" : "Acceptable")
    : (rtl ? "ضعيف" : "Weak");

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
            onChangeText={v => { setField("title", v); setTitleScore(null); }}
            onBlur={handleTitleBlur}
            textAlign={rtl ? "right" : "left"}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

          {/* Title scorer */}
          {titleScoring && (
            <View style={styles.scoreRow}>
              <ActivityIndicator size="small" color={Colors.primaryOrange} />
              <Text style={styles.scoringText}>{rtl ? "جارٍ تقييم العنوان..." : "Scoring title..."}</Text>
            </View>
          )}
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
              {titleScore.suggestedTitle && (
                <TouchableOpacity
                  onPress={() => { setField("title", titleScore.suggestedTitle!); setTitleScore(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.scoreSuggestion}>
                    💡 {rtl ? "تطبيق العنوان المقترح" : "Apply suggested title"}: "{titleScore.suggestedTitle}"
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

        {/* ── Photo URL + AI Analyze ── */}
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

          {/* AI analyze image button */}
          <TouchableOpacity
            style={[styles.aiAnalyzeBtn, imageAnalyzing && styles.aiAnalyzeBtnDisabled]}
            onPress={handleAnalyzeImage}
            disabled={imageAnalyzing}
            activeOpacity={0.8}
          >
            {imageAnalyzing ? (
              <ActivityIndicator size="small" color={Colors.primaryOrange} />
            ) : (
              <Feather name="camera" size={14} color={Colors.primaryOrange} />
            )}
            <Text style={styles.aiAnalyzeBtnText}>
              {imageAnalyzing
                ? (rtl ? "جارٍ تحليل الصورة..." : "Analyzing image...")
                : (rtl ? "✨ تحليل صورة بالذكاء الاصطناعي" : "✨ AI: Analyze Food Photo")}
            </Text>
          </TouchableOpacity>

          {/* AI analysis result card */}
          {imageAnalysis && !imageAnalyzing && (
            <View style={styles.aiAnalysisCard}>
              <Text style={[styles.aiAnalysisTitle, rtl && styles.textRight]}>
                {rtl ? "نتائج التحليل" : "Analysis Results"}
                {imageAnalysis.confidence ? ` · ${imageAnalysis.confidence}` : ""}
              </Text>

              {imageAnalysis.suggestedTitle && (
                <TouchableOpacity
                  style={styles.aiAnalysisRow}
                  onPress={() => { setField("title", imageAnalysis.suggestedTitle!); setTitleScore(null); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.aiAnalysisLabel, rtl && styles.textRight]}>{rtl ? "العنوان المقترح" : "Suggested Title"}</Text>
                  <Text style={[styles.aiAnalysisValue, rtl && styles.textRight]} numberOfLines={2}>{imageAnalysis.suggestedTitle}</Text>
                  <Text style={styles.aiApplyText}>{rtl ? "تطبيق ←" : "Apply →"}</Text>
                </TouchableOpacity>
              )}

              {imageAnalysis.description && (
                <TouchableOpacity
                  style={styles.aiAnalysisRow}
                  onPress={() => setField("description", imageAnalysis.description!)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.aiAnalysisLabel, rtl && styles.textRight]}>{rtl ? "الوصف المقترح" : "Suggested Description"}</Text>
                  <Text style={[styles.aiAnalysisValue, rtl && styles.textRight]} numberOfLines={3}>{imageAnalysis.description}</Text>
                  <Text style={styles.aiApplyText}>{rtl ? "تطبيق ←" : "Apply →"}</Text>
                </TouchableOpacity>
              )}

              {imageAnalysis.suggestedAllergens && imageAnalysis.suggestedAllergens.length > 0 && (
                <TouchableOpacity
                  style={styles.aiAnalysisRow}
                  onPress={() => setField("allergenNote", imageAnalysis.suggestedAllergens!.join("، "))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.aiAnalysisLabel, rtl && styles.textRight]}>{rtl ? "مسببات الحساسية" : "Allergens"}</Text>
                  <Text style={[styles.aiAnalysisValue, rtl && styles.textRight]}>{imageAnalysis.suggestedAllergens.join(" · ")}</Text>
                  <Text style={styles.aiApplyText}>{rtl ? "تطبيق ←" : "Apply →"}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => setImageAnalysis(null)} style={{ alignSelf: "flex-end", marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: Colors.grayMedium }}>{rtl ? "إغلاق" : "Dismiss"}</Text>
              </TouchableOpacity>
            </View>
          )}
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

  // ── AI styles ──────────────────────────────────────────────────────────────
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  scoringText: { fontSize: 12, color: Colors.grayMedium },

  scoreCard: {
    marginTop: 8, backgroundColor: "#F9FAFB", borderRadius: 10,
    padding: 10, gap: 4,
  },
  scoreBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  scoreBarBg: {
    flex: 1, height: 6, backgroundColor: Colors.grayLight, borderRadius: 3, overflow: "hidden",
  },
  scoreBarFill: { height: "100%", borderRadius: 3 },
  scoreNumber: { fontSize: 12, fontWeight: "700", minWidth: 90 },
  scoreFeedback: { fontSize: 11, color: Colors.grayMedium },
  scoreSuggestion: { fontSize: 11, color: Colors.primaryOrange, marginTop: 2 },

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

  aiAnalyzeBtn: {
    marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderWidth: 1.5, borderColor: Colors.primaryOrange, borderStyle: "dashed",
    borderRadius: 10, paddingVertical: 10, backgroundColor: Colors.orangeLight,
  },
  aiAnalyzeBtnDisabled: { opacity: 0.5 },
  aiAnalyzeBtnText: { fontSize: 13, color: Colors.primaryOrange, fontWeight: "600" },

  aiAnalysisCard: {
    marginTop: 10, backgroundColor: "#F0FDF4", borderRadius: 12,
    borderWidth: 1, borderColor: "#BBF7D0", padding: 12, gap: 6,
  },
  aiAnalysisTitle: { fontSize: 12, fontWeight: "700", color: Colors.greenMain, marginBottom: 4 },
  aiAnalysisRow: {
    backgroundColor: Colors.white, borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: "#D1FAE5",
  },
  aiAnalysisLabel: { fontSize: 10, fontWeight: "700", color: Colors.grayMedium, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  aiAnalysisValue: { fontSize: 13, color: Colors.grayDark, fontWeight: "500" },
  aiApplyText: { fontSize: 11, color: Colors.primaryOrange, fontWeight: "700", marginTop: 4 },
});
