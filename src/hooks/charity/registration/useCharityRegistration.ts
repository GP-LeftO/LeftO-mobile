import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../auth/useAuth";
import { useAuthContext } from "../../../context/AuthContext";
import {
  uploadCharityDocument,
  registerCharity,
} from "../../../services/charity/registration/charityRegistration.service";
import { isRTL } from "../../../i18n";
import type { CharityInfoFormData } from "../../../types";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function useCharityRegistration() {
  const rtl = isRTL();
  const { register, login } = useAuth();
  const ctx = useAuthContext();

  // ── Info form state (Screen 1) ───────────────────────────────────────────────
  const [orgName, setOrgName]                       = useState("");
  const [description, setDescription]               = useState("");
  const [region, setRegion]                         = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [contactPhone, setContactPhone]             = useState("");
  const [infoErrors, setInfoErrors]                 = useState<Record<string, string>>({});

  // ── Document state (Screen 2) ────────────────────────────────────────────────
  const [docUri,  setDocUri]  = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [docError, setDocError] = useState("");

  // ── Upload state ─────────────────────────────────────────────────────────────
  const [isUploading,    setIsUploading]    = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Submit state ─────────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState("");

  // ── Validate Screen 1 fields ─────────────────────────────────────────────────
  const validateInfoFields = (location: CharityInfoFormData["location"]): boolean => {
    const e: Record<string, string> = {};
    if (!orgName.trim())
      e.orgName = rtl ? "يرجى إدخال اسم المنظمة" : "Please enter your organization name";
    if (!description.trim())
      e.description = rtl ? "يرجى وصف منظمتك" : "Please describe your organization";
    if (!region.trim())
      e.region = rtl ? "يرجى إدخال المحافظة أو المنطقة" : "Please enter your region or city";
    if (!registrationNumber.trim())
      e.registrationNumber = rtl
        ? "يرجى إدخال رقم التسجيل الصادر عن وزارة الداخلية"
        : "Please enter your Ministry of Interior registration number";
    if (!location)
      e.location = rtl
        ? "يرجى تحديد موقع منظمتك على الخريطة"
        : "Please select your organization location on the map";
    if (!contactPhone.trim())
      e.contactPhone = rtl ? "يرجى إدخال رقم التواصل" : "Please enter a contact phone number";
    setInfoErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearInfoError = (field: string) =>
    setInfoErrors(prev => ({ ...prev, [field]: "" }));

  // ── Pick document from library ───────────────────────────────────────────────
  const pickDocument = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        rtl ? "الإذن مطلوب" : "Permission required",
        rtl
          ? "يرجى السماح بالوصول إلى الملفات لرفع الوثائق"
          : "Please allow file access to upload documents"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name  = asset.uri.split("/").pop() ?? "document.jpg";

      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_BYTES) {
        setDocError(
          rtl
            ? "فشل رفع الوثيقة. تحقق من نوع الملف والحجم (الحد الأقصى 5 ميغابايت)."
            : "Document upload failed. Please check the file type and size (max 5MB)."
        );
        return;
      }

      setDocUri(asset.uri);
      setDocName(name);
      setDocError("");
    }
  };

  const clearDoc = () => {
    setDocUri(null);
    setDocName("");
    setDocError("");
  };

  // ── 3-step flow: register user → upload doc → register charity profile ────────
  const uploadAndRegister = async (
    basicInfo: { name: string; phone: string; password: string; email: string },
    charityInfo: CharityInfoFormData
  ): Promise<"success" | "upload_error" | "register_error"> => {
    if (!docUri) {
      setDocError(
        rtl ? "يرجى رفع وثيقة التسجيل" : "Please upload a registration document"
      );
      return "upload_error";
    }

    setIsSubmitting(true);
    setDocError("");
    setSubmitError("");

    // Step 1: Create user account (basic info only)
    try {
      await register({
        name:     basicInfo.name,
        phone:    basicInfo.phone,
        password: basicInfo.password,
        role:     "CHARITY",
        email:    basicInfo.email || undefined,
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      const status = axiosErr.response?.status;

      if (status === 409) {
        // Phone already registered — restore session via login and continue
        try {
          await login(basicInfo.phone, basicInfo.password);
        } catch {
          setSubmitError(
            rtl
              ? "رقم الهاتف مسجّل بكلمة مرور مختلفة، يرجى تسجيل الدخول"
              : "Phone registered with a different password — please sign in"
          );
          setIsSubmitting(false);
          return "register_error";
        }
      } else {
        const msg = axiosErr.response?.data?.message;
        setSubmitError(
          msg ?? (rtl
            ? "فشل إرسال الطلب، يرجى المحاولة مجدداً"
            : "Registration failed, please try again")
        );
        setIsSubmitting(false);
        return "register_error";
      }
    }

    setIsSubmitting(false);

    // Step 2: Upload document (now authenticated)
    setIsUploading(true);
    setUploadProgress(0);

    let documentUrl = "";
    try {
      documentUrl = await uploadCharityDocument(docUri, (pct) => setUploadProgress(pct));
    } catch {
      setDocError(
        rtl
          ? "فشل رفع الوثيقة. تحقق من نوع الملف والحجم (الحد الأقصى 5 ميغابايت)."
          : "Document upload failed. Please check the file type and size (max 5MB)."
      );
      setIsUploading(false);
      return "upload_error";
    }

    setIsUploading(false);

    // Step 3: Register charity profile
    setIsSubmitting(true);
    try {
      const { data: res } = await registerCharity({
        orgName:            charityInfo.orgName,
        description:        charityInfo.description || undefined,
        region:             charityInfo.region,
        registrationNumber: charityInfo.registrationNumber,
        location:           charityInfo.location ?? undefined,
        contactInfo:        { phone: charityInfo.contactPhone },
        documentUrls:       documentUrl ? [documentUrl] : [],
      });

      // Persist the approved charityStatus to the session
      if (ctx.user && ctx.accessToken) {
        await ctx.saveSession({
          user:          ctx.user,
          accessToken:   ctx.accessToken,
          refreshToken:  ctx.refreshToken ?? undefined,
          sellerStatus:  ctx.sellerStatus,
          charityStatus: res.data.status === "APPROVED" ? "APPROVED" : "PENDING",
        });
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      const msg = axiosErr.response?.data?.message;
      setSubmitError(
        msg ?? (rtl
          ? "فشل تسجيل المنظمة، يرجى المحاولة مجدداً"
          : "Charity registration failed, please try again")
      );
      setIsSubmitting(false);
      return "register_error";
    }

    setIsSubmitting(false);
    return "success";
  };

  const isBusy = isUploading || isSubmitting;

  return {
    // Info form
    orgName, setOrgName,
    description, setDescription,
    region, setRegion,
    registrationNumber, setRegistrationNumber,
    contactPhone, setContactPhone,
    infoErrors, validateInfoFields, clearInfoError,

    // Document
    docUri, docName, docError, setDocError,
    pickDocument, clearDoc,

    // Upload progress
    isUploading, uploadProgress,

    // Submit
    isSubmitting, submitError,

    // Combined busy flag
    isBusy,

    // Combined action
    uploadAndRegister,
  };
}
