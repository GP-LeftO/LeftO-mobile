import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getKaramBalance,
  toggleParticipation as apiToggleParticipation,
  sponsorMeal as apiSponsorMeal,
  claimMeal as apiClaimMeal,
} from '../../services/seller/karam.service';
import type { KaramTodayBalance } from '../../services/seller/karam.service';

export interface UseKaramProps {
  sellerId: string;
  initialParticipates?: boolean;
  onToast?: (msg: string) => void;
}

const ZERO_BALANCE: KaramTodayBalance = { sponsored: 0, claimed: 0, available: 0 };

export function useKaram({ sellerId, initialParticipates = false, onToast }: UseKaramProps) {
  const [balance,            setBalance]            = useState<KaramTodayBalance>(ZERO_BALANCE);
  const [participatesInKaram, setParticipatesInKaram] = useState(false);
  const [loading,            setLoading]            = useState(false);
  const [actionLoading,      setActionLoading]      = useState(false);
  const [sponsorLoading,     setSponsorLoading]     = useState(false);
  const [claimLoading,       setClaimLoading]       = useState(false);

  // One-time initialization guard: prevents a re-render of the parent (e.g.
  // after a profile re-fetch) from clobbering the toggle's confirmed state.
  const hasInitialized = useRef(false);

  const loadBalance = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const data = await getKaramBalance(sid);
      // API may return { today: {...} } or flat { sponsored, claimed, available }
      const raw = data.today ?? (data as unknown as KaramTodayBalance);
      setBalance({
        sponsored: raw.sponsored ?? 0,
        claimed:   raw.claimed   ?? 0,
        available: raw.available ?? 0,
      });
      // participatesInKaram intentionally NOT set here — toggle response owns it.
    } catch (e: unknown) {
      console.warn('[Karam] loadBalance failed:', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Runs once when sellerId becomes available (profile loads async).
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
    console.log('[Karam] sponsorMeal pressed, balance:', JSON.stringify(balance));
    const prev = balance;
    setBalance({ ...balance, sponsored: balance.sponsored + 1, available: balance.available + 1 });
    setSponsorLoading(true);
    try {
      const updated = await apiSponsorMeal();
      console.log('[Karam] sponsorMeal success:', JSON.stringify(updated));
      setBalance(updated);
      onToast?.('تم! وجبة مُموّلة جديدة 💚');
    } catch (e: unknown) {
      setBalance(prev);
      console.error('[Karam] sponsorMeal failed:', JSON.stringify({
        status:  (e as { response?: { status?: number } }).response?.status,
        data:    (e as { response?: { data?: unknown } }).response?.data,
        message: (e as Error).message,
      }, null, 2));
      onToast?.('تعذّر تمويل الوجبة');
    } finally {
      setSponsorLoading(false);
    }
  }, [balance, onToast]);

  const claim = useCallback(async () => {
    console.log('[Karam] claimMeal pressed, balance:', JSON.stringify(balance));
    if (balance.available <= 0) {
      onToast?.('لا توجد وجبات متاحة اليوم');
      return;
    }
    const prev = balance;
    setBalance({ ...balance, claimed: balance.claimed + 1, available: balance.available - 1 });
    setClaimLoading(true);
    try {
      const updated = await apiClaimMeal();
      console.log('[Karam] claimMeal success:', JSON.stringify(updated));
      setBalance(updated);
    } catch (e: unknown) {
      setBalance(prev);
      const status = (e as { response?: { status?: number } }).response?.status;
      console.error('[Karam] claimMeal failed:', JSON.stringify({
        status,
        data:    (e as { response?: { data?: unknown } }).response?.data,
        message: (e as Error).message,
      }, null, 2));
      onToast?.(status === 400 ? 'لا توجد وجبات متاحة اليوم' : 'حدث خطأ غير متوقع');
    } finally {
      setClaimLoading(false);
    }
  }, [balance, onToast]);

  const toggleParticipation = useCallback(async (enable: boolean) => {
    setParticipatesInKaram(enable);
    setActionLoading(true);
    try {
      const data = await apiToggleParticipation(enable);
      const confirmed = data?.participatesInKaram ?? enable;
      setParticipatesInKaram(confirmed);
      if (confirmed && sellerId) await loadBalance(sellerId);
      onToast?.(confirmed ? 'تم تفعيل برنامج كرم ✓' : 'تم إيقاف برنامج كرم');
    } catch (e: unknown) {
      setParticipatesInKaram(!enable);
      console.error('[Karam] toggleParticipation failed:', JSON.stringify({
        status:  (e as { response?: { status?: number } }).response?.status,
        data:    (e as { response?: { data?: unknown } }).response?.data,
        message: (e as Error).message,
      }, null, 2));
      throw e;
    } finally {
      setActionLoading(false);
    }
  }, [sellerId, loadBalance, onToast]);

  return {
    balance, participatesInKaram,
    loading, actionLoading, sponsorLoading, claimLoading,
    sponsor, claim, toggleParticipation,
  };
}
