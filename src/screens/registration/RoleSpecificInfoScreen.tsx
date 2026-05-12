import React, { useState } from "react";
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Platform, KeyboardAvoidingView,
  ScrollView, Modal, Alert,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Button from "../../components/shared/Button";
import MapLocationPicker from "../../components/buyer/MapLocationPicker";
import type { PickedLocation } from "../../components/buyer/MapLocationPicker";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import StepIndicator from "../../components/auth/StepIndicator";
import type { UserRole } from "../../services/shared/storage";
import { useSeller } from "../../hooks/seller/useSeller";

interface RoleSpecificInfoScreenProps {
  role?: UserRole;
  phone?: string;
  name?: string;
  email?: string;
  password?: string;
  onComplete?: () => void;
  onPending?: () => void;
  onBack?: () => void;
  navigation?: any;
}

// Only the 3 business types the backend supports
const BUSINESS_TYPES: { label: string; value: "RESTAURANT" | "MARKET" | "BAKERY" }[] = [
  { label: "Restaurant", value: "RESTAURANT" },
  { label: "Market",     value: "MARKET"     },
  { label: "Bakery",     value: "BAKERY"     },
];

const FOOD_PREFS    = ["Meals", "Bakery", "Groceries", "Sweets", "Mixed", "Vegetarian"];
const PICKUP_WINDOWS = ["Morning (7–10 AM)", "Noon (12–2 PM)", "Afternoon (4–6 PM)", "Evening (6–9 PM)"];

export default function RoleSpecificInfoScreen({
  role = "buyer", phone = "", name = "", email = "", password = "",
  onComplete, onPending, onBack, navigation,
}: RoleSpecificInfoScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const { uploadDocument, registerSeller } = useSeller();

  // ── buyer state
  const [pickedLocation,   setPickedLocation]  = useState<PickedLocation | null>(null);
  const [showMap,          setShowMap]          = useState(false);
  const [selectedPrefs,    setSelectedPrefs]    = useState<string[]>([]);
  const [selectedWindows,  setSelectedWindows]  = useState<string[]>([]);

  // ── seller / charity state
  const [businessType,     setBusinessType]     = useState<"RESTAURANT" | "MARKET" | "BAKERY" | "">("");
  const [description,      setDescription]      = useState("");
  const [docUri,           setDocUri]           = useState<string | null>(null);
  const [docName,          setDocName]          = useState("");

  // ── submission state
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [uploadStep,     setUploadStep]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError,    setSubmitError]    = useState("");
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [uploadFailed,   setUploadFailed]   = useState(false);

  const togglePref   = (p: string) => setSelectedPrefs(prev  => prev.includes(p)  ? prev.filter(x => x !== p)  : [...prev,  p]);
  const toggleWindow = (w: string) => setSelectedWindows(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);

  const pickDocument = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        rtl ? "الإذن مطلوب" : "Permission required",
        rtl ? "يرجى السماح بالوصول إلى الصور لرفع الوثائق" : "Please allow photo access to upload documents"
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const uri  = result.assets[0].uri;
      const name = uri.split("/").pop() ?? "document.jpg";
      setDocUri(uri);
      setDocName(name);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (role === "buyer") {
      if (!pickedLocation)             e.location = rtl ? "يرجى تحديد موقعك على الخريطة"        : "Please select your location on the map";
      if (!selectedPrefs.length)       e.prefs    = rtl ? "اختر تفضيلاً غذائياً واحداً على الأقل" : "Pick at least one food preference";
      if (!selectedWindows.length)     e.windows  = rtl ? "اختر وقت استلام واحداً على الأقل"      : "Pick at least one pickup time";
    }
    if (role === "seller") {
      if (!businessType)               e.btype = rtl ? "اختر نوع عملك"  : "Select your business type";
      if (!pickedLocation)             e.location = rtl ? "يرجى تحديد موقع عملك" : "Please select your business location";
      if (!description.trim())         e.desc  = rtl ? "يرجى وصف عملك"  : "Please describe your business";
    }
    if (role === "charity") {
      if (!description.trim())         e.desc  = rtl ? "يرجى وصف منظمتك" : "Please describe your organization";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError("");
    setUploadStep(false);
    setUploadProgress(0);
    setUploadFailed(false);

    // Account is already registered (done in BasicInfoScreen) — go straight to role-specific step
    if (role === "buyer") {
      setIsSubmitting(false);
      if (onComplete) onComplete();
      else if (navigation) navigation.navigate("Main");
      return;
    }

    await uploadAndFinalize();
  };

  const uploadAndFinalize = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    setUploadStep(false);
    setUploadProgress(0);
    setUploadFailed(false);

    // ── Step 2: upload document (optional — seller/charity) ─────────────────
    let documentUrls: string[] = [];
    if (docUri) {
      setUploadStep(true);
      setUploadProgress(0);
      try {
        const docType = role === "seller" ? "trade_license" : "charity_registration";
        const fileUrl = await uploadDocument(docUri, docType, (pct) => {
          setUploadProgress(pct);
        });
        documentUrls = [fileUrl];
      } catch {
        setSubmitError(
          rtl
            ? "فشل رفع الوثيقة، حاول مجدداً"
            : "Document upload failed, please try again"
        );
        setUploadStep(false);
        setUploadFailed(true);
        setIsSubmitting(false);
        return;
      }
      setUploadStep(false);
    }

    // ── Step 3: seller-specific registration ────────────────────────────────
    try {
      if (role === "seller") {
        await registerSeller({
          businessName: name,
          businessType: businessType as "RESTAURANT" | "MARKET" | "BAKERY",
          location: {
            latitude:  pickedLocation?.latitude  ?? 0,
            longitude: pickedLocation?.longitude ?? 0,
            address:   pickedLocation?.address,
          },
          description: description || undefined,
          documentUrls,
        });
      }

      if (onPending) onPending();
      else if (navigation) navigation.navigate("Pending");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      const msg      = axiosErr.response?.data?.message;
      setSubmitError(
        msg ?? (rtl
          ? "فشل إرسال طلب التسجيل، يرجى المحاولة مجدداً"
          : "Registration submission failed, please try again")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPadding + 12, paddingBottom: bottomPadding + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8} disabled={isSubmitting}>
              <Feather name="arrow-left" size={20} color={Colors.grayDark} />
            </TouchableOpacity>
            <View style={styles.stepWrap}>
              <StepIndicator current={5} total={5} />
            </View>
          </View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.titleBlock}>
            <View style={[styles.iconWrap, {
              backgroundColor: role === "buyer" ? Colors.orangeLight : role === "seller" ? "#fef3c7" : "#f0fdf4",
            }]}>
              <Feather
                name={role === "buyer" ? "shopping-bag" : role === "seller" ? "tag" : "heart"}
                size={28}
                color={role === "buyer" ? Colors.primaryOrange : role === "seller" ? "#d97706" : Colors.greenMain}
              />
            </View>
            <Text style={[styles.title, rtl && styles.rtl]}>
              {rtl
                ? (role === "buyer" ? "تفضيلاتك" : role === "seller" ? "تفاصيل العمل" : "تفاصيل المنظمة")
                : (role === "buyer" ? "Your preferences" : role === "seller" ? "Business details" : "Organization details")}
            </Text>
            <Text style={[styles.subtitle, rtl && styles.rtl]}>
              {rtl
                ? (role === "buyer" ? "ساعدنا لنعرض لك الأكياس المناسبة بالقرب منك" : role === "seller" ? "أخبرنا عن عملك" : "ساعدنا لنفهم منظمتك")
                : (role === "buyer" ? "Help us show you the right bags near you" : role === "seller" ? "Tell us about your business" : "Help us understand your organization")}
            </Text>
          </Animated.View>

          {/* ── BUYER: location ── */}
          {role === "buyer" && (
            <Animated.View entering={FadeInDown.delay(180).duration(500).springify()} style={styles.section}>
              <Text style={styles.sectionLabel}>
                <Feather name="map-pin" size={14} color={Colors.primaryOrange} />{" "}
                {rtl ? "موقعك" : "Your location"}
              </Text>
              {pickedLocation ? (
                <TouchableOpacity style={styles.locationSelected} onPress={() => setShowMap(true)} activeOpacity={0.85}>
                  <View style={styles.locationSelectedIcon}><Feather name="map-pin" size={18} color={Colors.primaryOrange} /></View>
                  <View style={styles.locationSelectedText}>
                    <Text style={styles.locationSelectedAddress} numberOfLines={2}>{pickedLocation.address}</Text>
                    <Text style={styles.locationSelectedChange}>{rtl ? "اضغط للتغيير" : "Tap to change"}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={Colors.grayMedium} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.mapPickerBtn, !!errors.location && styles.mapPickerBtnError]}
                  onPress={() => { setShowMap(true); setErrors(e => ({ ...e, location: "" })); }}
                  activeOpacity={0.85}
                >
                  <View style={styles.mapPickerBtnInner}><View style={styles.mapPreviewDot} /><Feather name="map" size={26} color={Colors.primaryOrange} /></View>
                  <Text style={styles.mapPickerBtnLabel}>{rtl ? "اختر على الخريطة" : "Choose on map"}</Text>
                  <Text style={styles.mapPickerBtnSub}>{rtl ? "اضغط لفتح الخريطة وتثبيت موقعك" : "Tap to open the map and pin your location"}</Text>
                </TouchableOpacity>
              )}
              {!!errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </Animated.View>
          )}

          {/* ── BUYER: food prefs ── */}
          {role === "buyer" && (
            <Animated.View entering={FadeInDown.delay(240).duration(500).springify()} style={styles.section}>
              <Text style={styles.sectionLabel}><Feather name="heart" size={14} color={Colors.primaryOrange} /> {rtl ? "تفضيلات الطعام" : "Food preferences"}</Text>
              <View style={styles.pillsWrap}>
                {FOOD_PREFS.map(p => (
                  <TouchableOpacity key={p} style={[styles.pill, selectedPrefs.includes(p) && styles.pillActive]} onPress={() => { togglePref(p); setErrors(e => ({ ...e, prefs: "" })); }}>
                    <Text style={[styles.pillText, selectedPrefs.includes(p) && styles.pillTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!errors.prefs && <Text style={styles.errorText}>{errors.prefs}</Text>}
            </Animated.View>
          )}

          {/* ── BUYER: pickup windows ── */}
          {role === "buyer" && (
            <Animated.View entering={FadeInDown.delay(300).duration(500).springify()} style={styles.section}>
              <Text style={styles.sectionLabel}><Feather name="clock" size={14} color={Colors.primaryOrange} /> {rtl ? "أوقات الاستلام المفضلة" : "Preferred pickup times"}</Text>
              <View style={styles.pillsWrap}>
                {PICKUP_WINDOWS.map(w => (
                  <TouchableOpacity key={w} style={[styles.pill, styles.pillWide, selectedWindows.includes(w) && styles.pillActive]} onPress={() => { toggleWindow(w); setErrors(e => ({ ...e, windows: "" })); }}>
                    <Text style={[styles.pillText, selectedWindows.includes(w) && styles.pillTextActive]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!errors.windows && <Text style={styles.errorText}>{errors.windows}</Text>}
            </Animated.View>
          )}

          {/* ── SELLER: business type ── */}
          {role === "seller" && (
            <Animated.View entering={FadeInDown.delay(180).duration(500).springify()} style={styles.section}>
              <Text style={styles.sectionLabel}>{rtl ? "نوع العمل" : "Business type"}</Text>
              <View style={styles.pillsWrap}>
                {BUSINESS_TYPES.map(bt => (
                  <TouchableOpacity
                    key={bt.value}
                    style={[styles.pill, businessType === bt.value && styles.pillActive]}
                    onPress={() => { setBusinessType(bt.value); setErrors(e => ({ ...e, btype: "" })); }}
                  >
                    <Text style={[styles.pillText, businessType === bt.value && styles.pillTextActive]}>{bt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!!errors.btype && <Text style={styles.errorText}>{errors.btype}</Text>}
            </Animated.View>
          )}

          {/* ── SELLER: location ── */}
          {role === "seller" && (
            <Animated.View entering={FadeInDown.delay(240).duration(500).springify()} style={styles.section}>
              <Text style={styles.sectionLabel}><Feather name="map-pin" size={14} color={Colors.primaryOrange} /> {rtl ? "موقع العمل" : "Business location"}</Text>
              {pickedLocation ? (
                <TouchableOpacity style={styles.locationSelected} onPress={() => setShowMap(true)} activeOpacity={0.85}>
                  <View style={styles.locationSelectedIcon}><Feather name="map-pin" size={18} color={Colors.primaryOrange} /></View>
                  <View style={styles.locationSelectedText}>
                    <Text style={styles.locationSelectedAddress} numberOfLines={2}>{pickedLocation.address}</Text>
                    <Text style={styles.locationSelectedChange}>{rtl ? "اضغط للتغيير" : "Tap to change"}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={Colors.grayMedium} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.mapPickerBtn, !!errors.location && styles.mapPickerBtnError]}
                  onPress={() => { setShowMap(true); setErrors(e => ({ ...e, location: "" })); }}
                  activeOpacity={0.85}
                >
                  <View style={styles.mapPickerBtnInner}><View style={styles.mapPreviewDot} /><Feather name="map" size={26} color={Colors.primaryOrange} /></View>
                  <Text style={styles.mapPickerBtnLabel}>{rtl ? "اختر على الخريطة" : "Choose on map"}</Text>
                  <Text style={styles.mapPickerBtnSub}>{rtl ? "اضغط لفتح الخريطة وتثبيت موقع عملك" : "Tap to open the map and pin your business location"}</Text>
                </TouchableOpacity>
              )}
              {!!errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </Animated.View>
          )}

          {/* ── SELLER / CHARITY: description ── */}
          {(role === "seller" || role === "charity") && (
            <Animated.View entering={FadeInDown.delay(role === "seller" ? 300 : 180).duration(500).springify()} style={styles.section}>
              <Text style={styles.sectionLabel}>
                {rtl ? (role === "seller" ? "وصف العمل" : "وصف المنظمة") : (role === "seller" ? "Business description" : "Organization description")}
              </Text>
              <View style={[styles.textAreaWrap, !!errors.desc && styles.inputError]}>
                <TextInput
                  style={styles.textArea}
                  value={description}
                  onChangeText={v => { setDescription(v); setErrors(e => ({ ...e, desc: "" })); }}
                  placeholder={role === "seller"
                    ? (rtl ? "صف عملك ونوع الطعام الذي تقدمه…" : "Describe your business and the type of food you offer…")
                    : (rtl ? "صف منظمتك وكيف تساعد المجتمع…" : "Describe your organization and how you help the community…")}
                  placeholderTextColor={Colors.grayMedium}
                  multiline numberOfLines={4} textAlignVertical="top"
                  textAlign={rtl ? "right" : "left"}
                />
              </View>
              {!!errors.desc && <Text style={styles.errorText}>{errors.desc}</Text>}
            </Animated.View>
          )}

          {/* ── SELLER / CHARITY: document upload ── */}
          {(role === "seller" || role === "charity") && (
            <Animated.View entering={FadeInDown.delay(role === "seller" ? 360 : 240).duration(500).springify()} style={styles.section}>
              <Text style={styles.sectionLabel}>
                {rtl ? (role === "seller" ? "وثائق التحقق" : "وثائق التسجيل") : (role === "seller" ? "Verification documents" : "Registration documents")}
              </Text>
              <Text style={styles.sectionHint}>
                {rtl
                  ? (role === "seller" ? "رخصة التجارة أو تصريح سلامة الغذاء (JPEG/PNG)" : "شهادة تسجيل الجمعية الرسمية (JPEG/PNG)")
                  : (role === "seller" ? "Trade license or food safety permit (JPEG/PNG)" : "Official charity registration certificate (JPEG/PNG)")}
              </Text>
              <TouchableOpacity
                style={[styles.uploadBtn, !!docUri && styles.uploadBtnDone]}
                onPress={pickDocument}
                activeOpacity={0.8}
              >
                <Feather name={docUri ? "check-circle" : "upload"} size={20} color={docUri ? Colors.greenMain : Colors.primaryOrange} />
                <Text style={[styles.uploadText, docUri && styles.uploadTextDone]} numberOfLines={1}>
                  {docUri ? docName : (rtl ? "اختر صورة الوثيقة" : "Select document image")}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Approval note */}
          {(role === "seller" || role === "charity") && (
            <Animated.View entering={FadeInDown.delay(role === "seller" ? 420 : 300).duration(500).springify()} style={styles.approvalNote}>
              <Feather name="info" size={14} color={Colors.primaryOrange} />
              <Text style={[styles.approvalNoteText, rtl && styles.rtl]}>
                {rtl
                  ? "سيتم مراجعة حسابك من قبل فريقنا خلال ٢٤–٤٨ ساعة قبل التفعيل."
                  : "Your account will be reviewed by our team within 24–48 hours before activation."}
              </Text>
            </Animated.View>
          )}

          {/* API error */}
          {!!submitError && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.apiErrorBox}>
              <Feather name="alert-circle" size={16} color="#ef4444" />
              <Text style={[styles.apiErrorText, rtl && styles.rtl]}>{submitError}</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(480).duration(500).springify()} style={{ gap: 12 }}>
            {uploadFailed ? (
              <Button
                label={rtl ? "إعادة رفع الوثيقة" : "Retry upload"}
                onPress={uploadAndFinalize}
                variant="primary"
                loading={isSubmitting && !uploadStep}
                testID="role-specific-retry-upload"
              />
            ) : (
              <Button
                label={rtl
                  ? (role === "buyer" ? "الذهاب للرئيسية" : "إرسال الطلب")
                  : (role === "buyer" ? "Go to Home" : "Submit Application")}
                onPress={handleSubmit}
                variant="primary"
                loading={isSubmitting && !uploadStep}
                testID="role-specific-submit"
              />
            )}
            {uploadStep && (
              <View style={styles.progressWrap}>
                <Text style={[styles.progressLabel, rtl && styles.rtl]}>
                  {rtl ? "جاري رفع الوثيقة…" : "Uploading document…"}
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                </View>
                <Text style={[styles.progressPct, { textAlign: rtl ? "left" : "right" }]}>{uploadProgress}%</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showMap} animationType="slide" statusBarTranslucent>
        <MapLocationPicker
          initialLocation={pickedLocation ?? undefined}
          onConfirm={loc => { setPickedLocation(loc); setErrors(e => ({ ...e, location: "" })); setShowMap(false); }}
          onCancel={() => setShowMap(false)}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  rtl: { textAlign: "right" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.grayLight, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  stepWrap: { flex: 1 },
  titleBlock: { gap: Spacing.sm },
  iconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  title: { fontSize: 26, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.grayMedium, lineHeight: 22 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 15, fontWeight: "700", color: Colors.grayDark },
  sectionHint: { fontSize: 13, color: Colors.grayMedium, marginTop: -4 },

  mapPickerBtn: {
    backgroundColor: Colors.white, borderRadius: 18, borderWidth: 2,
    borderColor: Colors.primaryOrange, borderStyle: "dashed", padding: Spacing.lg, alignItems: "center", gap: 8,
  },
  mapPickerBtnError: { borderColor: "#ef4444" },
  mapPickerBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center", position: "relative" },
  mapPreviewDot: { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryOrange, top: 10, right: 10 },
  mapPickerBtnLabel: { fontSize: 16, fontWeight: "700", color: Colors.primaryOrange },
  mapPickerBtnSub: { fontSize: 13, color: Colors.grayMedium, textAlign: "center" },
  locationSelected: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.white, borderRadius: 16, borderWidth: 2, borderColor: Colors.primaryOrange, padding: Spacing.md },
  locationSelectedIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center" },
  locationSelectedText: { flex: 1, gap: 2 },
  locationSelectedAddress: { fontSize: 14, fontWeight: "600", color: Colors.grayDark, lineHeight: 20 },
  locationSelectedChange: { fontSize: 12, color: Colors.primaryOrange, fontWeight: "600" },

  pillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight },
  pillWide: { paddingHorizontal: 16 },
  pillActive: { backgroundColor: Colors.primaryOrange, borderColor: Colors.primaryOrange },
  pillText: { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },
  pillTextActive: { color: Colors.white },
  errorText: { fontSize: 13, color: "#ef4444" },

  textAreaWrap: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.grayLight, padding: Spacing.md, minHeight: 100 },
  inputError: { borderColor: "#ef4444" },
  textArea: { fontSize: 15, color: Colors.grayDark, lineHeight: 22 },

  uploadBtn: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.white,
    borderRadius: 14, borderWidth: 2, borderStyle: "dashed", borderColor: Colors.primaryOrange, padding: Spacing.md,
  },
  uploadBtnDone: { borderColor: Colors.greenMain, borderStyle: "solid", backgroundColor: "#f0fdf4" },
  uploadText: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.primaryOrange },
  uploadTextDone: { color: Colors.greenMain },

  approvalNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: Colors.orangeLight, borderRadius: 12, padding: Spacing.md },
  approvalNoteText: { flex: 1, fontSize: 13, color: Colors.orangeDark, lineHeight: 18 },

  apiErrorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#fef2f2", borderRadius: 12, padding: Spacing.md, borderWidth: 1, borderColor: "#fecaca" },
  apiErrorText: { flex: 1, fontSize: 13, color: "#dc2626", lineHeight: 18 },

  progressWrap: { gap: 6 },
  progressLabel: { fontSize: 13, fontWeight: "600", color: Colors.grayDark },
  progressTrack: { height: 8, backgroundColor: Colors.grayLight, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, backgroundColor: Colors.primaryOrange, borderRadius: 4 },
  progressPct: { fontSize: 12, color: Colors.grayMedium },
});
