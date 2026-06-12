import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getKaramBalance,
  toggleParticipation as apiToggleParticipation,
  sponsorMeal as apiSponsorMeal,
} from '../../services/seller/karam.service';
import type { KaramTodayBalance } from '../../services/seller/karam.service';

export interface UseKaramProps {
  sellerId: string;
  initialParticipates?: boolean;
  onToast?: (msg: string) => void;
}

const ZERO_BALANCE: KaramTodayBalance = { sponsored: 0, claimed: 0, available: 0 };

export function useKaram({ sellerId, initialParticipates = false, onToast }: UseKaramProps) {
  const [balance,             setBalance]             = useState<KaramTodayBalance>(ZERO_BALANCE);
  const [participatesInKaram, setParticipatesInKaram] = useState(false);
  const [loading,             setLoading]             = useState(false);
  const [actionLoading,       setActionLoading]       = useState(false);
  const [sponsorLoading,      setSponsorLoading]      = useState(false);

  // Prevents a profile re-fetch that arrives within 2 s of a toggle from
  // clobbering the confirmed toggle state.
  const justToggledRef = useRef(false);

  const loadBalance = useCallback(async (sid: string) => {
    setLoading(true);
    try {
      const data = await getKaramBalance(sid);
      const raw = data.today ?? (data as unknown as KaramTodayBalance);
      setBalance({
        sponsored: raw.sponsored ?? 0,
        claimed:   raw.claimed   ?? 0,
        available: raw.available ?? 0,
      });
    } catch (e: unknown) {
      console.warn('[Karam] loadBalance failed:', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-sync from API whenever sellerId or initialParticipates changes,
  // but skip if a toggle just completed (guard against stale re-fetch).
  useEffect(() => {
    if (!sellerId) return;
    if (justToggledRef.current) {
      console.log('[Karam] skipping profile reload — toggle in progress');
      return;
    }
    console.log('[Karam] participatesInKaram from API:', initialParticipates);
    setParticipatesInKaram(initialParticipates);
    if (initialParticipates) void loadBalance(sellerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId, initialParticipates]);

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

  const toggleParticipation = useCallback(async (enable: boolean) => {
    justToggledRef.current = true;
    setParticipatesInKaram(enable);
    setActionLoading(true);
    try {
      const data = await apiToggleParticipation(enable);
      const confirmed = data?.participatesInKaram ?? enable;
      setParticipatesInKaram(confirmed);
      console.log('[Karam] toggle success, new value:', confirmed);
      if (confirmed && sellerId) await loadBalance(sellerId);
      onToast?.(confirmed ? 'تم تفعيل برنامج كرم ✓' : 'تم إيقاف برنامج كرم');
    } catch (e: unknown) {
      setParticipatesInKaram(!enable);
      justToggledRef.current = false;
      console.error('[Karam] toggleParticipation failed:', JSON.stringify({
        status:  (e as { response?: { status?: number } }).response?.status,
        data:    (e as { response?: { data?: unknown } }).response?.data,
        message: (e as Error).message,
      }, null, 2));
      throw e;
    } finally {
      setActionLoading(false);
      // Hold the guard for 2 s so a fast profile re-fetch doesn't overwrite the confirmed value.
      setTimeout(() => { justToggledRef.current = false; }, 2000);
    }
  }, [sellerId, loadBalance, onToast]);

  return {
    balance, participatesInKaram,
    loading, actionLoading, sponsorLoading,
    loadBalance, sponsor, toggleParticipation,
  };
}
