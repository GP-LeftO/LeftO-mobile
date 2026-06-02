import { useState, useEffect } from "react";
import {
  fetchProfile,
  fetchMyOrders,
} from "../../services/buyer/profile/profileService";

export interface HomeStats {
  co2SavedKg: number | null;
  moneySaved: number | null;
  donationCount: number | null;
  loading: boolean;
}

export function useHomeStats(): HomeStats {
  const [co2SavedKg, setCo2SavedKg] = useState<number | null>(null);
  const [moneySaved, setMoneySaved] = useState<number | null>(null);
  const [donationCount, setDonationCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchMyOrders()])
      .then(([profile, orders]) => {
        setCo2SavedKg(profile.totalCo2SavedKg ?? 0);

        const completedDonations = orders.filter(
          (o) => o.type === "DONATION" && o.status === "COMPLETED"
        );
        setDonationCount(completedDonations.length);

        const saved = orders
          .filter((o) => o.type === "PURCHASE" && o.status === "COMPLETED")
          .reduce((acc, order) => {
            const orig = order.listing?.originalPrice;
            const disc = order.listing?.discountedPrice;
            if (orig != null && disc != null) {
              return acc + (orig - disc) * order.quantity;
            }
            return acc;
          }, 0);
        setMoneySaved(saved);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { co2SavedKg, moneySaved, donationCount, loading };
}
