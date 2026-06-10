import { useState } from "react";
import { createListing, updateListing } from "../../services/seller/seller.service";
import type { SellerListing, ListingFormData } from "../../services/seller/seller.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToHHMM(iso: string): string {
  try {
    if (/^\d{2}:\d{2}$/.test(iso)) return iso;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function normalizeTime(raw: string): string {
  const clean = raw.replace(/[^\d:]/g, "");
  if (!clean) return "";
  if (/^\d{1,2}$/.test(clean)) {
    return `${clean.padStart(2, "0")}:00`;
  }
  const [h, m = "0"] = clean.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

// Converts HH:MM to ISO datetime, advancing to tomorrow if the time has already passed today.
function hhmmToSmartIso(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
    d.setHours(h, m, 0, 0);
  }
  return d.toISOString();
}

function isoToDateStr(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${day}`;
  } catch {
    return "";
  }
}

// ─── Form state shape ─────────────────────────────────────────────────────────

export interface ListingFormState {
  title: string;
  description: string;
  type: "MEAL_BAG" | "SPECIFIC_PARCEL";
  category: "MEALS" | "BREAD_AND_PASTRIES" | "GROCERIES" | "MIXED";
  originalPrice: string;
  discountedPrice: string;
  quantity: string;
  pickupStart: string;
  pickupEnd: string;
  expiryDate: string;       // "YYYY-MM-DD" or "" — only required for SPECIFIC_PARCEL
  freshnessBadge: "eat_today" | "fresh_tonight" | "good_1_2_days";
  allergenNote: string;
  description: string;
  photoUrl: string;
  isPriceDecaying: boolean;
  floorPrice: string;
}

export type FormErrors = Partial<Record<keyof ListingFormState, string>>;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useListingForm(existing?: SellerListing) {
  const isEdit = Boolean(existing?.id);

  const [form, setForm] = useState<ListingFormState>({
    title:          existing?.title ?? "",
    type:           existing?.type ?? "MEAL_BAG",
    category:       existing?.category ?? "MEALS",
    originalPrice:  (existing?.originalPrice ?? existing?.price)?.toString() ?? "",
    discountedPrice: (existing?.discountedPrice)?.toString() ?? "",
    quantity:       existing?.quantity?.toString() ?? "",
    pickupStart:    existing?.pickupStart ? isoToHHMM(existing.pickupStart) : "",
    pickupEnd:      existing?.pickupEnd   ? isoToHHMM(existing.pickupEnd)   : "",
    freshnessBadge: existing?.freshnessBadge ?? "eat_today",
    allergenNote:   existing?.allergenNote ?? "",
    photoUrl:       existing?.photoUrl ?? "",
  });

  const [errors,      setErrors]      = useState<FormErrors>({});
  const [loading,     setLoading]     = useState(false);
  const [submitError, setSubmitError] = useState("");

  const setField = <K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const normalizedStart = normalizeTime(form.pickupStart);
    const normalizedEnd   = normalizeTime(form.pickupEnd);
    if (normalizedStart) setForm(p => ({ ...p, pickupStart: normalizedStart }));
    if (normalizedEnd)   setForm(p => ({ ...p, pickupEnd:   normalizedEnd }));

    const e: FormErrors = {};

    if (!form.title.trim() || form.title.trim().length < 2 || form.title.trim().length > 100)
      e.title = "العنوان مطلوب (2–100 حرف)";
    if (!form.originalPrice || isNaN(Number(form.originalPrice)) || Number(form.originalPrice) <= 0)
      e.originalPrice = "أدخل سعراً صحيحاً";
    if (!form.discountedPrice || isNaN(Number(form.discountedPrice)))
      e.discountedPrice = "أدخل سعراً صحيحاً";
    else if (Number(form.discountedPrice) >= Number(form.originalPrice))
      e.discountedPrice = "يجب أن يكون أقل من السعر الأصلي";
    else if (Number(form.discountedPrice) < 0.5)
      e.discountedPrice = "الحد الأدنى للسعر هو ₪0.50";
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 1)
      e.quantity = "الحد الأدنى للكمية هو 1";
    if (!normalizedStart)
      e.pickupStart = "أدخل وقت بدء الاستلام (مثال: 17:00)";
    if (!normalizedEnd)
      e.pickupEnd = "أدخل وقت انتهاء الاستلام (مثال: 20:00)";
    else if (normalizedEnd <= normalizedStart)
      e.pickupEnd = "يجب أن يكون بعد وقت البدء";

    if (form.type === "SPECIFIC_PARCEL") {
      if (!form.expiryDate)
        e.expiryDate = "تاريخ الصلاحية مطلوب للطرد المحدد";
      else if (new Date(form.expiryDate).getTime() <= Date.now())
        e.expiryDate = "يجب أن يكون تاريخاً مستقبلياً";
    }

    if (form.isPriceDecaying) {
      if (!form.floorPrice || isNaN(Number(form.floorPrice)) || Number(form.floorPrice) <= 0)
        e.floorPrice = "أدخل الحد الأدنى للسعر";
      else if (Number(form.floorPrice) >= Number(form.discountedPrice))
        e.floorPrice = "يجب أن يكون أقل من السعر المخفض";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (): Promise<SellerListing> => {
    if (!validate()) throw new Error("validation_failed");
    setLoading(true);
    setSubmitError("");
    try {
      const payload: ListingFormData = {
        title:           form.title.trim(),
        description:     form.description.trim() || undefined,
        type:            form.type,
        category:        form.category,
        originalPrice:   Number(form.originalPrice),
        discountedPrice: Number(form.discountedPrice),
        quantity:        Number(form.quantity),
        pickupStart:     hhmmToSmartIso(normalizeTime(form.pickupStart)),
        pickupEnd:       hhmmToSmartIso(normalizeTime(form.pickupEnd)),
        freshnessBadge:  form.freshnessBadge,
        allergenNote:    form.allergenNote.trim() || undefined,
        photoUrl:        form.photoUrl.trim() || undefined,
      };
      if (isEdit && existing?.id) {
        result = await updateListing(existing.id, payload);
      } else {
        result = await createListing(payload);
      }
      return result;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setSubmitError(msg ?? "حدث خطأ. يرجى المحاولة مجدداً.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { form, errors, loading, submitError, isEdit, setField, submit };
}
