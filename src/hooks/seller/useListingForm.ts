import { useState } from "react";
import { createListing, updateListing } from "../../services/seller/seller.service";
import type { SellerListing, ListingFormData } from "../../services/seller/seller.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToHHMM(iso: string): string {
  try {
    // Already HH:MM
    if (/^\d{2}:\d{2}$/.test(iso)) return iso;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

// Normalize partial time input to HH:MM — e.g. "9" → "09:00", "17" → "17:00", "17:3" → "17:03"
function normalizeTime(raw: string): string {
  const clean = raw.replace(/[^\d:]/g, "");
  if (!clean) return "";
  if (/^\d{1,2}$/.test(clean)) {
    return `${clean.padStart(2, "0")}:00`;
  }
  const [h, m = "0"] = clean.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

// Convert HH:MM to ISO datetime. If the resulting time is already in the past today,
// advance to tomorrow so the backend never rejects it as expired.
function hhmmToSmartIso(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  // If this time has already passed today, advance to tomorrow
  if (d.getTime() <= Date.now()) {
    d.setDate(d.getDate() + 1);
    d.setHours(h, m, 0, 0);
  }
  return d.toISOString();
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
  freshnessBadge: "eat_today" | "fresh_tonight" | "good_1_2_days";
  allergenNote: string;
  photoUrl: string;
  isPriceDecaying: boolean;
  floorPrice: string;
}

export type FormErrors = Partial<Record<keyof ListingFormState, string>>;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useListingForm(existing?: SellerListing) {
  const isEdit = Boolean(existing?.id);

  const [form, setForm] = useState<ListingFormState>({
    title:           existing?.title ?? "",
    description:     existing?.description ?? "",
    type:            existing?.type ?? "MEAL_BAG",
    category:        existing?.category ?? "MEALS",
    originalPrice:   (existing?.originalPrice ?? existing?.price)?.toString() ?? "",
    discountedPrice: (existing?.discountedPrice)?.toString() ?? "",
    quantity:        existing?.quantity?.toString() ?? "",
    pickupStart:     existing?.pickupStart ? isoToHHMM(existing.pickupStart) : "",
    pickupEnd:       existing?.pickupEnd   ? isoToHHMM(existing.pickupEnd)   : "",
    freshnessBadge:  existing?.freshnessBadge ?? "eat_today",
    allergenNote:    existing?.allergenNote ?? "",
    photoUrl:        existing?.photoUrl ?? "",
    isPriceDecaying: existing?.isPriceDecaying ?? false,
    floorPrice:      existing?.floorPrice?.toString() ?? "",
  });

  const [errors,      setErrors]      = useState<FormErrors>({});
  const [loading,     setLoading]     = useState(false);
  const [submitError, setSubmitError] = useState("");

  const setField = <K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    // Auto-normalize time fields before validating so partial input ("17") doesn't block
    const normalizedStart = normalizeTime(form.pickupStart);
    const normalizedEnd   = normalizeTime(form.pickupEnd);
    if (normalizedStart) setForm((p) => ({ ...p, pickupStart: normalizedStart }));
    if (normalizedEnd)   setForm((p) => ({ ...p, pickupEnd:   normalizedEnd }));

    const e: FormErrors = {};
    if (!form.title.trim())
      e.title = "Required";
    if (!form.originalPrice || isNaN(Number(form.originalPrice)))
      e.originalPrice = "Enter a valid price";
    if (!form.discountedPrice || isNaN(Number(form.discountedPrice)))
      e.discountedPrice = "Enter a valid price";
    if (Number(form.discountedPrice) >= Number(form.originalPrice))
      e.discountedPrice = "Must be less than original price";
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 1)
      e.quantity = "Min 1";
    if (!normalizedStart)
      e.pickupStart = "Enter pickup start (e.g. 17:00)";
    if (!normalizedEnd)
      e.pickupEnd = "Enter pickup end (e.g. 20:00)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (): Promise<void> => {
    if (!validate()) return;
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
        // API requires ISO datetime — smart converter advances to tomorrow if time has passed
        pickupStart:     hhmmToSmartIso(normalizeTime(form.pickupStart)),
        pickupEnd:       hhmmToSmartIso(normalizeTime(form.pickupEnd)),
        freshnessBadge:  form.freshnessBadge,
        allergenNote:    form.allergenNote.trim() || undefined,
        photoUrl:        form.photoUrl.trim() || undefined,
        isPriceDecaying: form.isPriceDecaying || undefined,
        floorPrice:      form.isPriceDecaying && form.floorPrice ? Number(form.floorPrice) : undefined,
      };
      if (isEdit && existing?.id) {
        await updateListing(existing.id, payload);
      } else {
        await createListing(payload);
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
      throw new Error("submit_failed");
    } finally {
      setLoading(false);
    }
  };

  return { form, errors, loading, submitError, isEdit, setField, submit };
}
