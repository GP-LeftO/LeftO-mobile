import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getKaramBalance,
  toggleParticipation as apiToggleParticipation,
  sponsorMeal,
  claimMeal,
} from '../../services/seller/karam.service';
import type { KaramTodayBalance } from '../../services/seller/karam.service';

export interface UseKaramProps {
  sellerId: string;
  initialParticipates?: boolean;
  onToast?: (msg: string) => void;
}

export function useKaram({ sellerId, initialParticipates = false, onToast }: UseKaramProps) {
  const [balance, setBalance] = useState<KaramTodayBalance | null>(null);
  const [participatesInKaram, setParticipatesInKaram] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Prevents the initialization effect from running more than once.
  // Without this, switching back to the component after a toggle would re-sync
  // the stale initialParticipates prop and clobber the user's toggle.
  const hasInitialized = useRef(false);

  const loadBalance = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const data = await getKaramBalance(sid);
      setBalance(data.today ?? null);
      setParticipatesInKaram(data.participatesInKaram ?? false);
    } catch {
      // non-critical — balance display is best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  // Runs once when sellerId becomes available (profile loads async).
  // initialParticipates captured here is from the same render that first
  // sets sellerId, so it reflects the actual profile value.
  useEffect(() => {
    if (!sellerId || hasInitialized.current) return;
    hasInitialized.current = true;
    setParticipatesInKaram(initialParticipates);
    if (initialParticipates) {
      void loadBalance(sellerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  const sponsor = useCallback(async () => {
    if (!balance) return;
    const prev = balance;
    setBalance({ ...balance, sponsored: balance.sponsored + 1, available: balance.available + 1 });
    setActionLoading(true);
    try {
      await sponsorMeal();
      onToast?.('تم! وجبة مُموّلة جديدة 💚');
    } catch {
      setBalance(prev);
      onToast?.('تعذّر تمويل الوجبة');
    } finally {
      setActionLoading(false);
    }
  }, [balance, onToast]);

  const claim = useCallback(async () => {
    if (!balance) return;
    const prev = balance;
    setBalance({ ...balance, claimed: balance.claimed + 1, available: balance.available - 1 });
    setActionLoading(true);
    try {
      await claimMeal();
    } catch (err: unknown) {
      setBalance(prev);
      const status = (err as { response?: { status?: number } }).response?.status;
      onToast?.(status === 400 ? 'لا توجد وجبات متاحة اليوم' : 'حدث خطأ غير متوقع');
    } finally {
      setActionLoading(false);
    }
  }, [balance, onToast]);

  const toggleParticipation = useCallback(async () => {
    const newValue = !participatesInKaram;
    setParticipatesInKaram(newValue);  // optimistic flip
    setActionLoading(true);
    try {
      const data = await apiToggleParticipation(newValue);
      const confirmed = data?.participatesInKaram ?? newValue;
      setParticipatesInKaram(confirmed);
      if (confirmed && sellerId) {
        await loadBalance(sellerId);
      }
      onToast?.('تم تحديث مشاركتك في برنامج كرم ✓');
    } catch {
      setParticipatesInKaram(!newValue);  // rollback
      onToast?.('حدث خطأ، حاول مرة أخرى');
    } finally {
      setActionLoading(false);
    }
  }, [participatesInKaram, sellerId, loadBalance, onToast]);

  return { balance, participatesInKaram, loading, actionLoading, sponsor, claim, toggleParticipation };
}
