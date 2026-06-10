import React, { useState, useRef } from "react";
import {
  StyleSheet, Text, View, TextInput, Linking,
  TouchableOpacity, Platform, KeyboardAvoidingView,
  ScrollView, Modal, Alert, ActivityIndicator,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
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
  isUpgrade?: boolean;
  onComplete?: () => void;
  onPending?: () => void;
  onBack?: () => void;
  navigation?: any;
}

const BUSINESS_TYPES: { label: string; value: "RESTAURANT" | "MARKET" | "BAKERY" }[] = [
  { label: "Restaurant", value: "RESTAURANT" },
  { label: "Market",     value: "MARKET"     },
  { label: "Bakery",     value: "BAKERY"     },
];

const FOOD_PREFS    = ["Meals", "Bakery", "Groceries", "Sweets", "Mixed", "Vegetarian"];
const PICKUP_WINDOWS = ["Morning (7–10 AM)", "Noon (12–2 PM)", "Afternoon (4–6 PM)", "Evening (6–9 PM)"];

const SELLER_STEPS = [
  { key: 1, labelAr: "المعلومات", labelEn: "Info"      },
  { key: 2, labelAr: "الموقع",   labelEn: "Location"  },
  { key: 3, labelAr: "التسجيل",  labelEn: "Register"  },
  { key: 4, labelAr: "الوثائق",  labelEn: "Documents" },
  { key: 5, labelAr: "الإرسال",  labelEn: "Submit"    },
];

export default function RoleSpecificInfoScreen({
  role = "buyer", phone = "", name = "", email = "", password = "",
  isUpgrade = false,
  onComplete, onPending, onBack, navigation,
}: RoleSpecificInfoScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const { uploadDocument, registerSeller } = useSeller();

  // ── location state
  const [pickedLocation,     setPickedLocation]     = useState<PickedLocation | null>(null);
  const [showMap,            setShowMap]            = useState(false);
  const [locationMode,       setLocationMode]       = useState<"map" | "manual">("map");
  const [manualAddress,      setManualAddress]      = useState("");
  const [mapInitLocation,    setMapInitLocation]    = useState<PickedLocation | undefined>(undefined);
  const [locationPermDenied, setLocationPermDenied] = useState(false);

  const openSellerMap = async () => {
    setLocationPermDenied(false);
    setErrors(e => ({ ...e, location: "" }));
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationPermDenied(true);
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setMapInitLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        address: pickedLocation?.address ?? "",
      });
    } catch {
      setMapInitLocation(undefined);
    }
    setShowMap(true);
  };

  // ── buyer state
  const [selectedPrefs,   setSelectedPrefs]   = useState<string[]>([]);
  const [selectedWindows, setSelectedWindows] = useState<string[]>([]);

  // ── seller / charity state
  const [businessType,       setBusinessType]       = useState<"RESTAURANT" | "MARKET" | "BAKERY" | "">("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [description,        setDescription]        = useState("");
  const [docUri,             setDocUri]             = useState<string | null>(null);
  const [docName,            setDocName]            = useState("");

  // ── submission state
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [uploadStep,     setUploadStep]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError,    setSubmitError]    = useState("");
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [uploadFailed,   setUploadFailed]   = useState(false);
  const [stepTransitioning, setStepTransitioning] = useState(false);
  const stepLock = useRef(false);

  const togglePref   = (p: string) => setSelectedPrefs(prev  => prev.includes(p)  ? prev.filter(x => x !== p)  : [...prev,  p]);
  const toggleWindow = (w: string) => setSelectedWindows(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);

  // ── Charity: pick document from library
  const pickDocument = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        rtl ? "الإذن مطلوب" : "Permission required",
        rtl ? "يرجى السماح بالوصول إلى الصور لرفع الوثائق" : "Please allow photo access to upload documents"
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: false, quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      const uri  = result.assets[0].uri;
      const fname = uri.split("/").pop() ?? "document.jpg";
      setDocUri(uri);
      setDocName(fname);
    }
  };

  // ── Seller: pick file and immediately upload to /api/documents/upload
  const pickAndUploadDoc = async (docType: "trade" | "health") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        rtl ? "الإذن مطلوب" : "Permission required",
        rtl ? "يرجى السماح بالوصول إلى الصور لرفع الوثائق" : "Please allow photo access to upload documents"
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: false, quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;

    const uri   = result.assets[0].uri;
    const fname = uri.split("/").pop() ?? "document.jpg";

    if (docType === "trade") {
      setTradeName(fname);
      setTradeUploading(true);
      setTradeUploadError("");
      setTradeDocUrl(null);
      try {
        const url = await uploadDocument(uri, "trade_license", () => {});
        setTradeDocUrl(url);
      } catch {
        setTradeUploadError(rtl ? "فشل رفع الملف، حاول مجدداً" : "Upload failed, try again");
      } finally {
        setTradeUploading(false);
      }
    } else {
      setHealthName(fname);
      setHealthUploading(true);
      setHealthUploadError("");
      setHealthDocUrl(null);
      try {
        const url = await uploadDocument(uri, "health_certificate", () => {});
        setHealthDocUrl(url);
      } catch {
        setHealthUploadError(rtl ? "فشل رفع الملف، حاول مجدداً" : "Upload failed, try again");
      } finally {
        setHealthUploading(false);
      }
    }
  };

  // ── Seller: per-step validation
  const validateSellerStep = (): boolean => {
    const e: Record<string, string> = {};
    if (role === "buyer") {
      if (!pickedLocation)             e.location = rtl ? "يرجى تحديد موقعك على الخريطة"        : "Please select your location on the map";
      if (!selectedPrefs.length)       e.prefs    = rtl ? "اختر تفضيلاً غذائياً واحداً على الأقل" : "Pick at least one food preference";
      if (!selectedWindows.length)     e.windows  = rtl ? "اختر وقت استلام واحداً على الأقل"      : "Pick at least one pickup time";
    }
    if (role === "seller") {
      if (!businessType)               e.btype = rtl ? "اختر نوع عملك"  : "Select your business type";
      if (!registrationNumber.trim())  e.regNum = rtl ? "أدخل رقم السجل التجاري" : "Enter your registration number";
      if (locationMode === "map" && !pickedLocation)
        e.location = rtl ? "يرجى تحديد موقع عملك على الخريطة" : "Please select your business location on the map";
      if (locationMode === "manual" && !manualAddress.trim())
        e.location = rtl ? "يرجى كتابة عنوان عملك" : "Please enter your business address";
    } else if (sellerStep === 3) {
      if (!registrationNumber.trim())
        e.regNum = rtl ? "يرجى إدخال الرقم التجاري" : "Please enter your registration number";
      else if (!/^NE-\d{6}$/.test(registrationNumber.trim()))
        e.regNum = rtl ? "صيغة الرقم غير صحيحة، مثال: NE-200001" : "Invalid format, e.g. NE-200001";
    } else if (sellerStep === 4) {
      if (!tradeDocUrl)
        e.tradeLicense = rtl ? "رخصة التجارة مطلوبة" : "Trade license is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Seller: advance step or submit on step 5
  const handleSellerContinue = () => {
    if (stepLock.current) return;
    if (sellerStep < 5) {
      if (!validateSellerStep()) return;
      setSubmitError("");
      setErrors({});
      stepLock.current = true;
      setStepTransitioning(true);
      setSellerStep(prev => prev + 1);
      // unlock after animation completes (180ms delay + 500ms duration + buffer)
      setTimeout(() => {
        stepLock.current = false;
        setStepTransitioning(false);
      }, 750);
    } else {
      void handleSellerSubmit();
    }
  };

  // ── Seller: final POST /api/sellers/register
  const handleSellerSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const docUrls: string[] = [];
      if (tradeDocUrl)  docUrls.push(tradeDocUrl);
      if (healthDocUrl) docUrls.push(healthDocUrl);

      await registerSeller({
        businessName: name,
        businessType: businessType as "RESTAURANT" | "MARKET" | "BAKERY",
        location: locationMode === "manual"
          ? { latitude: 0, longitude: 0, address: manualAddress.trim() }
          : {
              latitude:  pickedLocation?.latitude  ?? 0,
              longitude: pickedLocation?.longitude ?? 0,
              address:   pickedLocation?.address,
            },
        description:        description || undefined,
        registrationNumber: registrationNumber.trim(),
        documentUrls:       docUrls.length > 0 ? docUrls : undefined,
        contactInfo: {
          phone:   contactPhone.trim()   || undefined,
          website: contactWebsite.trim() || undefined,
        },
      });
      if (onPending) onPending();
      else if (onComplete) onComplete();
      else if (navigation) navigation.navigate("Main");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      const status   = axiosErr.response?.status;
      const msg      = axiosErr.response?.data?.message;
      if (status === 400) {
        setSellerStep(3);
        setSubmitError(rtl
          ? "رقم التسجيل غير معتمد في قائمتنا. تحقق من الرقم وأعد المحاولة."
          : "Registration number not found in our verified list. Check and try again."
        );
      } else if (status === 409) {
        setSubmitError(rtl ? "لديك حساب بائع مسجل بالفعل" : "A seller account already exists for this phone");
      } else {
        setSubmitError(msg ?? (rtl
          ? "فشل إرسال الطلب، يرجى المحاولة مجدداً"
          : "Submission failed, please try again")
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Buyer / charity validation
  const validate = () => {
    const e: Record<string, string> = {};
    if (role === "buyer") {
      if (!pickedLocation)         e.location = rtl ? "يرجى تحديد موقعك على الخريطة"        : "Please select your location on the map";
      if (!selectedPrefs.length)   e.prefs    = rtl ? "اختر تفضيلاً غذائياً واحداً على الأقل" : "Pick at least one food preference";
      if (!selectedWindows.length) e.windows  = rtl ? "اختر وقت استلام واحداً على الأقل"      : "Pick at least one pickup time";
    }
    if (role === "charity") {
      if (!description.trim())     e.desc     = rtl ? "يرجى وصف منظمتك" : "Please describe your organization";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    // Seller flow is handled step-by-step
    if (role === "seller") { handleSellerContinue(); return; }

    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError("");
    setUploadStep(false);
    setUploadProgress(0);
    setUploadFailed(false);

    if (role === "buyer") {
      setIsSubmitting(false);
      if (onComplete) onComplete();
      else if (navigation) navigation.navigate("Main");
      return;
    }

    await uploadAndFinalize();
  };

  // ── Charity: upload doc then go to pending
  const uploadAndFinalize = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    setUploadStep(false);
    setUploadProgress(0);
    setUploadFailed(false);

    let documentUrls: string[] = [];
    if (docUri) {
      setUploadStep(true);
      try {
        const fileUrl = await uploadDocument(docUri, "charity_registration", (pct) => setUploadProgress(pct));
        documentUrls = [fileUrl];
      } catch {
        setSubmitError(rtl ? "فشل رفع الوثيقة، حاول مجدداً" : "Document upload failed, please try again");
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
        try {
          await registerSeller({
            businessName: name,
            businessType: businessType as "RESTAURANT" | "MARKET" | "BAKERY",
            registrationNumber: registrationNumber.trim() || undefined,
            location: locationMode === "manual"
              ? { latitude: 0, longitude: 0, address: manualAddress.trim() }
              : {
                  latitude:  pickedLocation?.latitude  ?? 0,
                  longitude: pickedLocation?.longitude ?? 0,
                  address:   pickedLocation?.address,
                },
            description: description || undefined,
            documentUrls,
          });
        } catch (regErr: unknown) {
          const axiosErr = regErr as { response?: { status?: number; data?: { message?: string } } };
          // 409 = profile already exists — treat as success for upgrade flow
          if (axiosErr.response?.status !== 409) throw regErr;
        }
        // Registration number in whitelist → immediately APPROVED → call onComplete
        if (isUpgrade && onComplete) {
          onComplete();
          return;
        }
      }

      if (onPending) onPending();
      else if (navigation) navigation.navigate("Pending");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setSubmitError(axiosErr.response?.data?.message ?? (rtl
        ? "فشل إرسال طلب التسجيل، يرجى المحاولة مجدداً"
        : "Registration submission failed, please try again")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Seller step title / subtitle helpers
  const sellerTitle = () => {
    if (rtl) {
      switch (sellerStep) {
        case 1: return "تفاصيل المحل";
        case 2: return "موقع المحل";
        case 3: return "رقم التسجيل التجاري";
        case 4: return "وثائق المنشأة";
        default: return "مراجعة وإرسال";
      }
    }
    switch (sellerStep) {
      case 1: return "Business details";
      case 2: return "Business location";
      case 3: return "Registration number";
      case 4: return "Business documents";
      default: return "Review & submit";
    }
  };

  const sellerSubtitle = () => {
    if (rtl) {
      switch (sellerStep) {
        case 1: return "أخبرنا عن عملك التجاري";
        case 2: return "أين يقع محلك؟";
        case 3: return "أدخل رقم تسجيل منشأتك بالصيغة NE-XXXXXX";
        case 4: return "يرجى رفع وثائق ترخيص منشأتك للمتابعة";
        default: return "تحقق من معلوماتك قبل الإرسال";
      }
    }
    switch (sellerStep) {
      case 1: return "Tell us about your business";
      case 2: return "Where is your store located?";
      case 3: return "Enter your NE-XXXXXX registration number";
      case 4: return "Please upload your business documents to continue";
      default: return "Review your info before submitting";
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
          {/* ── Header ── */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={role === "seller" && sellerStep > 1
                ? () => { stepLock.current = false; setStepTransitioning(false); setSellerStep(prev => prev - 1); setSubmitError(""); setErrors({}); }
                : onBack}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <Feather name="arrow-left" size={20} color={Colors.grayDark} />
            </TouchableOpacity>
            <View style={styles.stepWrap}>
              {role === "seller" ? (
                <View style={styles.sellerStepBar}>
                  {SELLER_STEPS.map((s, idx) => (
                    <React.Fragment key={s.key}>
                      <View style={styles.sellerStepItem}>
                        <View style={[
                          styles.sellerStepDot,
                          sellerStep > s.key  && styles.sellerStepDotDone,
                          sellerStep === s.key && styles.sellerStepDotActive,
                        ]}>
                          {sellerStep > s.key
                            ? <Feather name="check" size={10} color={Colors.white} />
                            : <Text style={[styles.sellerStepNum, sellerStep === s.key && styles.sellerStepNumActive]}>{s.key}</Text>
                          }
                        </View>
                        <Text style={[styles.sellerStepLabel, sellerStep === s.key && styles.sellerStepLabelActive]}>
                          {rtl ? s.labelAr : s.labelEn}
                        </Text>
                      </View>
                      {idx < SELLER_STEPS.length - 1 && (
                        <View style={[styles.sellerStepLine, sellerStep > s.key && styles.sellerStepLineDone]} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              ) : (
                <StepIndicator current={role === "buyer" ? 6 : 5} total={role === "buyer" ? 6 : 5} />
              )}
            </View>
          </View>

          {/* ── Title block ── */}
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
              {role === "seller"
                ? sellerTitle()
                : role === "buyer"
                  ? (rtl ? "تفضيلاتك" : "Your preferences")
                  : (rtl ? "تفاصيل المنظمة" : "Organization details")}
            </Text>
            <Text style={[styles.subtitle, rtl && styles.rtl]}>
              {role === "seller"
                ? sellerSubtitle()
                : role === "buyer"
                  ? (rtl ? "ساعدنا لنعرض لك الأكياس المناسبة بالقرب منك" : "Help us show you the right bags near you")
                  : (rtl ? "ساعدنا لنفهم منظمتك" : "Help us understand your organization")}
            </Text>
          </Animated.View>

          {/* ════════════ BUYER ════════════ */}

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

          {/* ── SELLER: registration number ── */}
          {role === "seller" && (
            <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} style={styles.section}>
              <Text style={styles.sectionLabel}>{rtl ? "رقم السجل التجاري *" : "Registration Number *"}</Text>
              <View style={[styles.textAreaWrap, !!errors.regNum && styles.inputError]}>
                <TextInput
                  style={styles.addressInput}
                  placeholder={rtl ? "مثال: NE-200001" : "e.g. NE-200001"}
                  placeholderTextColor="#9CA3AF"
                  value={registrationNumber}
                  onChangeText={v => { setRegistrationNumber(v); setErrors(e => ({ ...e, regNum: "" })); }}
                  autoCapitalize="characters"
                  textAlign={rtl ? "right" : "left"}
                />
              </View>
              {!!errors.regNum && <Text style={styles.errorText}>{errors.regNum}</Text>}
              <Text style={styles.sectionHint}>
                {rtl
                  ? "رقم غرفة التجارة. للتجربة: NE-200001 إلى NE-200020"
                  : "Chamber of Commerce number. Demo values: NE-200001 to NE-200020"}
              </Text>
            </Animated.View>
          )}

          {/* ── SELLER: location ── */}
          {role === "seller" && (
            <Animated.View entering={FadeInDown.delay(240).duration(500).springify()} style={styles.section}>
              <Text style={styles.sectionLabel}><Feather name="map-pin" size={14} color={Colors.primaryOrange} /> {rtl ? "موقع العمل" : "Business location"}</Text>
              <View style={styles.locationToggle}>
                <TouchableOpacity
                  style={[styles.locationToggleBtn, locationMode === "map" && styles.locationToggleActive]}
                  onPress={() => { setLocationMode("map"); setErrors(e => ({ ...e, location: "" })); }}
                  activeOpacity={0.8}
                >
                  <Feather name="map" size={14} color={locationMode === "map" ? Colors.white : Colors.grayMedium} />
                  <Text style={[styles.locationToggleText, locationMode === "map" && styles.locationToggleTextActive]}>
                    {rtl ? "اختر على الخريطة" : "Pick on map"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.locationToggleBtn, locationMode === "manual" && styles.locationToggleActive]}
                  onPress={() => { setLocationMode("manual"); setErrors(e => ({ ...e, location: "" })); }}
                  activeOpacity={0.8}
                >
                  <Feather name="edit-2" size={14} color={locationMode === "manual" ? Colors.white : Colors.grayMedium} />
                  <Text style={[styles.locationToggleText, locationMode === "manual" && styles.locationToggleTextActive]}>
                    {rtl ? "اكتب العنوان" : "Type address"}
                  </Text>
                </TouchableOpacity>
              </View>

              {locationMode === "map" && (
                pickedLocation ? (
                  <TouchableOpacity style={styles.locationSelected} onPress={openSellerMap} activeOpacity={0.85}>
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
                    onPress={openSellerMap}
                    activeOpacity={0.85}
                  >
                    <View style={styles.mapPickerBtnInner}><View style={styles.mapPreviewDot} /><Feather name="map" size={26} color={Colors.primaryOrange} /></View>
                    <Text style={styles.mapPickerBtnLabel}>{rtl ? "اختر على الخريطة" : "Choose on map"}</Text>
                    <Text style={styles.mapPickerBtnSub}>{rtl ? "اضغط لفتح الخريطة وتثبيت موقع عملك" : "Tap to open the map and pin your business location"}</Text>
                  </TouchableOpacity>
                )
              )}
              {locationPermDenied && (
                <View style={styles.permDeniedRow}>
                  <Feather name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.permDeniedText}>
                    {rtl ? "يرجى السماح بالوصول للموقع لاستخدام الخريطة" : "Location permission required to use the map"}
                  </Text>
                  <TouchableOpacity onPress={() => Linking.openSettings()} activeOpacity={0.8}>
                    <Text style={styles.permDeniedLink}>{rtl ? "الإعدادات" : "Settings"}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {locationMode === "manual" && (
                <View style={[styles.textAreaWrap, !!errors.location && styles.inputError, styles.addressInputWrap]}>
                  <Feather name="map-pin" size={16} color={Colors.primaryOrange} style={styles.addressInputIcon} />
                  <TextInput
                    style={styles.addressInput}
                    value={manualAddress}
                    onChangeText={v => { setManualAddress(v); setErrors(e => ({ ...e, location: "" })); }}
                    placeholder={rtl ? "مثال: شارع النزهة، نابلس" : "e.g. Al-Nuzha St, Nablus"}
                    placeholderTextColor={Colors.grayMedium}
                    textAlign={rtl ? "right" : "left"}
                    returnKeyType="done"
                    autoCapitalize="words"
                  />
                </View>
              )}
              {!!errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </Animated.View>
          )}

          {/* ════════════ SELLER — STEP 3: Registration number ════════════ */}

          {role === "seller" && sellerStep === 3 && (
            <>
              <Animated.View entering={FadeInDown.delay(180).duration(500).springify()} style={styles.section}>
                <Text style={styles.sectionLabel}>{rtl ? "الرقم التجاري" : "Registration Number"}</Text>
                <View style={[styles.inlineInputWrap, !!errors.regNum && styles.inputError]}>
                  <Feather name="hash" size={16} color={Colors.primaryOrange} style={styles.inlineInputIcon} />
                  <TextInput
                    style={styles.inlineInput}
                    value={registrationNumber}
                    onChangeText={v => { setRegistrationNumber(v); setErrors(e => ({ ...e, regNum: "" })); }}
                    placeholder="NE-200001"
                    placeholderTextColor={Colors.grayMedium}
                    autoCapitalize="characters"
                    returnKeyType="done"
                    textAlign={rtl ? "right" : "left"}
                  />
                </View>
                {!!errors.regNum && <Text style={styles.errorText}>{errors.regNum}</Text>}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(260).duration(500).springify()} style={styles.regNumInfoCard}>
                <View style={styles.regNumInfoRow}>
                  <Feather name="info" size={15} color={Colors.greenMain} />
                  <Text style={[styles.regNumInfoTitle, rtl && styles.rtl]}>
                    {rtl ? "رقم السجل التجاري" : "About your registration number"}
                  </Text>
                </View>
                <Text style={[styles.regNumInfoText, rtl && styles.rtl]}>
                  {rtl
                    ? "يُستخدم رقم التسجيل للتحقق من هوية منشأتك. إذا كان رقمك في قائمتنا المعتمدة، سيتم الموافقة على حسابك فوراً مع شارة التحقق ✅"
                    : "Your registration number verifies your business identity. If it's in our verified list, your account will be approved immediately with a verified badge ✅"}
                </Text>

              </Animated.View>
            </>
          )}

          {/* ════════════ SELLER — STEP 4: Document upload (optional) ════════════ */}

          {role === "seller" && sellerStep === 4 && (
            <>
              <Animated.View entering={FadeInDown.delay(180).duration(500).springify()} style={styles.section}>
                <Text style={styles.sectionLabel}>{rtl ? "رخصة التجارة" : "Trade License"}</Text>
                <Text style={styles.sectionHint}>{rtl ? "رخصة التجارة أو السجل التجاري (JPEG/PNG)" : "Trade license or commercial registry (JPEG/PNG)"}</Text>
                <TouchableOpacity
                  style={[styles.uploadBtn, !!tradeDocUrl && styles.uploadBtnDone]}
                  onPress={() => pickAndUploadDoc("trade")}
                  activeOpacity={0.8}
                  disabled={tradeUploading}
                >
                  {tradeUploading
                    ? <ActivityIndicator size="small" color={Colors.primaryOrange} />
                    : <Feather name={tradeDocUrl ? "check-circle" : "upload"} size={20} color={tradeDocUrl ? Colors.greenMain : Colors.primaryOrange} />
                  }
                  <Text style={[styles.uploadText, !!tradeDocUrl && styles.uploadTextDone]} numberOfLines={1}>
                    {tradeUploading
                      ? (rtl ? "جاري الرفع…" : "Uploading…")
                      : tradeDocUrl ? tradeName : (rtl ? "اختر ملف الرخصة" : "Select trade license file")}
                  </Text>
                </TouchableOpacity>
                {!!tradeUploadError && <Text style={styles.errorText}>{tradeUploadError}</Text>}
                {!!errors.tradeLicense && <Text style={styles.errorText}>{errors.tradeLicense}</Text>}
              </Animated.View>

              {(businessType === "RESTAURANT" || businessType === "BAKERY") && (
                <Animated.View entering={FadeInDown.delay(260).duration(500).springify()} style={styles.section}>
                  <Text style={styles.sectionLabel}>{rtl ? "شهادة السلامة الغذائية" : "Health / Food Safety Certificate"}</Text>
                  <Text style={styles.sectionHint}>{rtl ? "شهادة سلامة الغذاء أو صحة المنشأة (JPEG/PNG)" : "Food safety or health permit (JPEG/PNG)"}</Text>
                  <TouchableOpacity
                    style={[styles.uploadBtn, !!healthDocUrl && styles.uploadBtnDone]}
                    onPress={() => pickAndUploadDoc("health")}
                    activeOpacity={0.8}
                    disabled={healthUploading}
                  >
                    {healthUploading
                      ? <ActivityIndicator size="small" color={Colors.primaryOrange} />
                      : <Feather name={healthDocUrl ? "check-circle" : "upload"} size={20} color={healthDocUrl ? Colors.greenMain : Colors.primaryOrange} />
                    }
                    <Text style={[styles.uploadText, !!healthDocUrl && styles.uploadTextDone]} numberOfLines={1}>
                      {healthUploading
                        ? (rtl ? "جاري الرفع…" : "Uploading…")
                        : healthDocUrl ? healthName : (rtl ? "اختر شهادة السلامة" : "Select health certificate file")}
                    </Text>
                  </TouchableOpacity>
                  {!!healthUploadError && <Text style={styles.errorText}>{healthUploadError}</Text>}
                </Animated.View>
              )}

              {businessType === "MARKET" && (
                <View style={styles.docInfoCard}>
                  <Feather name="info" size={14} color="#9CA3AF" />
                  <Text style={styles.docInfoText}>
                    {rtl
                      ? "السوبرماركت لا يحتاج شهادة سلامة غذائية — تكفي رخصة التجارة فقط"
                      : "Markets selling packaged goods do not require a health certificate — trade license is sufficient"}
                  </Text>
                </View>
              )}

            </>
          )}

          {/* ════════════ SELLER — STEP 5: Review & submit ════════════ */}

          {role === "seller" && sellerStep === 5 && (
            <>
              <Animated.View entering={FadeInDown.delay(180).duration(500).springify()} style={styles.section}>
                <Text style={styles.sectionLabel}>{rtl ? "ملخص طلبك" : "Your application summary"}</Text>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, rtl && styles.rtl]}>{rtl ? "اسم المحل" : "Business name"}</Text>
                    <Text style={[styles.summaryValue, rtl && { textAlign: "left" as const }]}>{name || "—"}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, rtl && styles.rtl]}>{rtl ? "نوع المحل" : "Business type"}</Text>
                    <Text style={[styles.summaryValue, rtl && { textAlign: "left" as const }]}>
                      {businessType === "RESTAURANT" ? (rtl ? "مطعم" : "Restaurant")
                       : businessType === "MARKET"   ? (rtl ? "سوبرماركت" : "Market")
                       : businessType === "BAKERY"   ? (rtl ? "مخبزة" : "Bakery")
                       : "—"}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, rtl && styles.rtl]}>{rtl ? "الموقع" : "Location"}</Text>
                    <Text style={[styles.summaryValue, rtl && { textAlign: "left" as const }]} numberOfLines={2}>
                      {(pickedLocation?.address ?? manualAddress) || "—"}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, rtl && styles.rtl]}>{rtl ? "رقم التسجيل" : "Registration number"}</Text>
                    <Text style={[styles.summaryValue, rtl && { textAlign: "left" as const }]}>{registrationNumber || "—"}</Text>
                  </View>
                  <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.summaryLabel, rtl && styles.rtl]}>{rtl ? "الوثائق المرفوعة" : "Documents uploaded"}</Text>
                    <Text style={[styles.summaryValue, rtl && { textAlign: "left" as const }]}>
                      {[tradeDocUrl, healthDocUrl].filter(Boolean).length} {rtl ? "ملف" : "file(s)"}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(260).duration(500).springify()} style={styles.approvalNote}>
                <Feather name="zap" size={14} color={Colors.primaryOrange} />
                <Text style={[styles.approvalNoteText, rtl && styles.rtl]}>
                  {rtl
                    ? "سيتم تفعيل حسابك فوراً عند التحقق من صحة رقمك التجاري."
                    : "Your account will be activated immediately once your registration number is verified."}
                </Text>
              </Animated.View>
            </>
          )}

          {/* ════════════ CHARITY ════════════ */}

          {role === "charity" && (
            <Animated.View entering={FadeInDown.delay(180).duration(500).springify()} style={styles.section}>
              <Text style={styles.sectionLabel}>{rtl ? "وصف المنظمة" : "Organization description"}</Text>
              <View style={[styles.textAreaWrap, !!errors.desc && styles.inputError]}>
                <TextInput
                  style={styles.textArea}
                  value={description}
                  onChangeText={v => { setDescription(v); setErrors(e => ({ ...e, desc: "" })); }}
                  placeholder={rtl ? "صف منظمتك وكيف تساعد المجتمع…" : "Describe your organization and how you help the community…"}
                  placeholderTextColor={Colors.grayMedium}
                  multiline numberOfLines={4} textAlignVertical="top"
                  textAlign={rtl ? "right" : "left"}
                />
              </View>
              {!!errors.desc && <Text style={styles.errorText}>{errors.desc}</Text>}
            </Animated.View>
          )}

          {role === "charity" && (
            <Animated.View entering={FadeInDown.delay(240).duration(500).springify()} style={styles.section}>
              <Text style={styles.sectionLabel}>{rtl ? "وثائق التسجيل" : "Registration documents"}</Text>
              <Text style={styles.sectionHint}>
                {rtl ? "شهادة تسجيل الجمعية الرسمية (JPEG/PNG)" : "Official charity registration certificate (JPEG/PNG)"}
              </Text>
              <TouchableOpacity style={[styles.uploadBtn, !!docUri && styles.uploadBtnDone]} onPress={pickDocument} activeOpacity={0.8}>
                <Feather name={docUri ? "check-circle" : "upload"} size={20} color={docUri ? Colors.greenMain : Colors.primaryOrange} />
                <Text style={[styles.uploadText, docUri && styles.uploadTextDone]} numberOfLines={1}>
                  {docUri ? docName : (rtl ? "اختر صورة الوثيقة" : "Select document image")}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {role === "charity" && (
            <Animated.View entering={FadeInDown.delay(300).duration(500).springify()} style={styles.approvalNote}>
              <Feather name="info" size={14} color={Colors.primaryOrange} />
              <Text style={[styles.approvalNoteText, rtl && styles.rtl]}>
                {rtl
                  ? "سيتم مراجعة حسابك من قبل فريقنا خلال ٢٤–٤٨ ساعة قبل التفعيل."
                  : "Your account will be reviewed by our team within 24–48 hours before activation."}
              </Text>
            </Animated.View>
          )}

          {/* ── API error ── */}
          {!!submitError && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.apiErrorBox}>
              <Feather name="alert-circle" size={16} color="#ef4444" />
              <Text style={[styles.apiErrorText, rtl && styles.rtl]}>{submitError}</Text>
            </Animated.View>
          )}

          {/* ── Submit / Continue button ── */}
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
                label={
                  role === "seller"
                    ? sellerStep < 5
                      ? (rtl ? "متابعة" : "Continue")
                      : (rtl ? "إرسال الطلب" : "Submit Application")
                    : role === "buyer"
                      ? (rtl ? "الذهاب للرئيسية" : "Go to Home")
                      : (rtl ? "إرسال الطلب" : "Submit Application")
                }
                onPress={handleSubmit}
                variant="primary"
                loading={isSubmitting && (role !== "seller" ? !uploadStep : false)}
                disabled={
                  (role === "seller" && sellerStep < 5 && stepTransitioning) ||
                  (role === "seller" && sellerStep === 4 && !tradeDocUrl && !tradeUploading)
                }
                testID="role-specific-submit"
              />
            )}

            {/* Charity: doc upload progress bar */}
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
          initialLocation={mapInitLocation ?? pickedLocation ?? undefined}
          onConfirm={loc => {
            setPickedLocation(loc);
            setMapInitLocation(undefined);
            setErrors(e => ({ ...e, location: "" }));
            setShowMap(false);
          }}
          onCancel={() => { setMapInitLocation(undefined); setShowMap(false); }}
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

  // ── Seller step progress bar
  sellerStepBar: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  sellerStepItem: { alignItems: "center", gap: 4 },
  sellerStepDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.grayLight, alignItems: "center", justifyContent: "center",
  },
  sellerStepDotActive: { backgroundColor: Colors.primaryOrange },
  sellerStepDotDone:   { backgroundColor: Colors.greenMain },
  sellerStepNum:       { fontSize: 11, fontWeight: "700", color: Colors.grayMedium },
  sellerStepNumActive: { color: Colors.white },
  sellerStepLabel:     { fontSize: 9, color: Colors.grayMedium, fontWeight: "600" },
  sellerStepLabelActive: { color: Colors.primaryOrange },
  sellerStepLine:     { flex: 1, height: 2, backgroundColor: Colors.grayLight, marginTop: 11 },
  sellerStepLineDone: { backgroundColor: Colors.greenMain },

  mapPickerBtn: {
    backgroundColor: Colors.white, borderRadius: 18, borderWidth: 2,
    borderColor: Colors.primaryOrange, borderStyle: "dashed", padding: Spacing.lg, alignItems: "center", gap: 8,
  },
  mapPickerBtnError:  { borderColor: "#ef4444" },
  mapPickerBtnInner:  { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center", position: "relative" },
  mapPreviewDot:      { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryOrange, top: 10, right: 10 },
  mapPickerBtnLabel:  { fontSize: 16, fontWeight: "700", color: Colors.primaryOrange },
  mapPickerBtnSub:    { fontSize: 13, color: Colors.grayMedium, textAlign: "center" },
  permDeniedRow:  { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, flexWrap: "wrap" },
  permDeniedText: { flex: 1, fontSize: 12, color: "#EF4444", lineHeight: 17 },
  permDeniedLink: { fontSize: 12, fontWeight: "700", color: Colors.primaryOrange, textDecorationLine: "underline" },
  locationSelected:   { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.white, borderRadius: 16, borderWidth: 2, borderColor: Colors.primaryOrange, padding: Spacing.md },
  locationSelectedIcon:   { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center" },
  locationSelectedText:   { flex: 1, gap: 2 },
  locationSelectedAddress:{ fontSize: 14, fontWeight: "600", color: Colors.grayDark, lineHeight: 20 },
  locationSelectedChange: { fontSize: 12, color: Colors.primaryOrange, fontWeight: "600" },

  pillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight },
  pillWide:  { paddingHorizontal: 16 },
  pillActive:     { backgroundColor: Colors.primaryOrange, borderColor: Colors.primaryOrange },
  pillText:       { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },
  pillTextActive: { color: Colors.white },
  errorText:      { fontSize: 13, color: "#ef4444" },

  textAreaWrap: { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.grayLight, padding: Spacing.md, minHeight: 100 },
  inputError:   { borderColor: "#ef4444" },
  textArea:     { fontSize: 15, color: Colors.grayDark, lineHeight: 22 },

  // ── Shared inline input (reg number, phone, website)
  inlineInputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1.5,
    borderColor: Colors.grayLight, paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  inlineInputIcon: { marginLeft: 2 },
  inlineInput:     { flex: 1, fontSize: 15, color: Colors.grayDark, paddingVertical: 4 },

  uploadBtn: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.white,
    borderRadius: 14, borderWidth: 2, borderStyle: "dashed", borderColor: Colors.primaryOrange, padding: Spacing.md,
  },
  uploadBtnDone:   { borderColor: Colors.greenMain, borderStyle: "solid", backgroundColor: "#f0fdf4" },
  uploadText:      { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.primaryOrange },
  uploadTextDone:  { color: Colors.greenMain },

  approvalNote:     { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: Colors.orangeLight, borderRadius: 12, padding: Spacing.md },
  approvalNoteText: { flex: 1, fontSize: 13, color: Colors.orangeDark, lineHeight: 18 },

  apiErrorBox:  { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#fef2f2", borderRadius: 12, padding: Spacing.md, borderWidth: 1, borderColor: "#fecaca" },
  apiErrorText: { flex: 1, fontSize: 13, color: "#dc2626", lineHeight: 18 },

  progressWrap:  { gap: 6 },
  progressLabel: { fontSize: 13, fontWeight: "600", color: Colors.grayDark },
  progressTrack: { height: 8, backgroundColor: Colors.grayLight, borderRadius: 4, overflow: "hidden" },
  progressFill:  { height: 8, backgroundColor: Colors.primaryOrange, borderRadius: 4 },
  progressPct:   { fontSize: 12, color: Colors.grayMedium },

  locationToggle: { flexDirection: "row", gap: 8 },
  locationToggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  locationToggleActive:     { backgroundColor: Colors.primaryOrange, borderColor: Colors.primaryOrange },
  locationToggleText:       { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },
  locationToggleTextActive: { color: Colors.white },

  addressInputWrap: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 0 },
  addressInputIcon: { marginLeft: 2 },
  addressInput:     { flex: 1, fontSize: 15, color: Colors.grayDark, paddingVertical: 4 },

  // ── Registration number info card (step 3)
  regNumInfoCard:  { backgroundColor: "#f0fdf4", borderRadius: 14, borderWidth: 1.5, borderColor: "#bbf7d0", padding: Spacing.md, gap: 8 },
  regNumInfoRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  regNumInfoTitle: { fontSize: 14, fontWeight: "700", color: Colors.greenMain },
  regNumInfoText:  { fontSize: 13, color: "#166534", lineHeight: 20 },

  // ── Summary card (step 5)
  summaryCard: { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.grayLight, overflow: "hidden" },
  summaryRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
  },
  summaryLabel: { fontSize: 13, color: Colors.grayMedium, fontWeight: "600", flex: 1 },
  summaryValue: { fontSize: 13, color: Colors.grayDark, fontWeight: "700", flex: 1.5, textAlign: "right" },

  // ── Document info card (step 4, MARKET type)
  docInfoCard: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 8, backgroundColor: "#F9FAFB", borderRadius: 8, padding: 12, marginTop: 4 },
  docInfoText: { flex: 1, fontSize: 13, color: "#6B7280", textAlign: "right", lineHeight: 19 },

});
