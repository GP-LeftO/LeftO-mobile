import { useState, useCallback } from "react";
import type { AllergyOption } from "../../types";

export function useAllergyPreferences() {
  const [selected, setSelected] = useState<AllergyOption[]>([]);

  const toggle = useCallback((option: AllergyOption) => {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  }, []);

  const reset = useCallback(() => setSelected([]), []);

  return { selected, toggle, reset };
}
