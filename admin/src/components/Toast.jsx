import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLang } from '../context/LangContext';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { lang } = useLang();
  const isRtl = lang === 'ar';

  const show = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div style={{
        position: 'fixed', top: 18,
        right: isRtl ? 'auto' : 18,
        left:  isRtl ? 18 : 'auto',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: t.type === 'success' ? '#0F172A' : '#1C0A0A',
            color: '#F8FAFC',
            padding: '11px 14px',
            borderRadius: 10,
            fontWeight: 600, fontSize: 13.5,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            borderLeft:  isRtl ? 'none' : `3px solid ${t.type === 'success' ? '#10B981' : '#EF4444'}`,
            borderRight: isRtl ? `3px solid ${t.type === 'success' ? '#10B981' : '#EF4444'}` : 'none',
            animation: 'fadeUp .2s ease',
            pointerEvents: 'all',
            minWidth: 260, maxWidth: 360,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>
              {t.type === 'success' ? '✅' : '❌'}
            </span>
            <span style={{ flex: 1 }}>{t.msg}</span>
            <button onClick={() => dismiss(t.id)} style={{
              background: 'transparent', color: '#64748B',
              padding: '2px 4px', fontSize: 17, lineHeight: 1,
              border: 'none', cursor: 'pointer', borderRadius: 4,
              flexShrink: 0,
            }}>×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
