import { useState } from "react";
import { createListing, updateListing } from "../../services/seller/seller.service";
import type { SellerListing, ListingFormData } from "../../services/seller/seller.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoToHHMM(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function hhmmToIso(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// ─── Form state shape ─────────────────────────────────────────────────────────

export interface ListingFormState {
  title: string;
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
    const e: FormErrors = {};
    if (!form.title.trim())                                    e.title = "Required";
    if (!form.originalPrice || isNaN(Number(form.originalPrice)))  e.originalPrice = "Enter a valid price";
    if (!form.discountedPrice || isNaN(Number(form.discountedPrice))) e.discountedPrice = "Enter a valid price";
    if (Number(form.discountedPrice) >= Number(form.originalPrice))   e.discountedPrice = "Must be less than original price";
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 1) e.quantity = "Min 1";
    if (!/^\d{2}:\d{2}$/.test(form.pickupStart)) e.pickupStart = "Use HH:MM (e.g. 17:00)";
    if (!/^\d{2}:\d{2}$/.test(form.pickupEnd))   e.pickupEnd   = "Use HH:MM (e.g. 20:00)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (): Promise<void> => {
    if (!validate()) return;
    setLoading(true);
    setSubmitError("");
    try {
      const payload: ListingFormData = {
        title:          form.title.trim(),
        type:           form.type,
        category:       form.category,
        originalPrice:  Number(form.originalPrice),
        discountedPrice: Number(form.discountedPrice),
        quantity:       Number(form.quantity),
        pickupStart:    hhmmToIso(form.pickupStart),
        pickupEnd:      hhmmToIso(form.pickupEnd),
        freshnessBadge: form.freshnessBadge,
        allergenNote:   form.allergenNote.trim() || undefined,
        photoUrl:       form.photoUrl.trim() || undefined,
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
