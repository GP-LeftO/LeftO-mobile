import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLang, useT } from '../context/LangContext';

export default function Topbar() {
  const { lang, theme, toggleTheme } = useLang();
  const t        = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const isRtl    = lang === 'ar';
  const [open, setOpen] = useState(false);
  const dropRef = useRef(null);

  const CRUMBS = {
    '/':          t('dashboard'),
    '/sellers':   t('sellers'),
    '/charities': t('charities'),
    '/users':     t('users'),
    '/reports':   t('reports'),
    '/settings':  t('settings'),
  };
  const crumb = CRUMBS[location.pathname] ?? t('dashboard');

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  return (
    <div className="topbar">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <span style={{ color: 'var(--text-faint)' }}>LeftO</span>
        <span style={{ color: 'var(--text-faint)' }}>/</span>
        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{crumb}</span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* Dark mode toggle */}
        <button className="btn-ghost" title={theme === 'dark' ? (isRtl ? 'وضع النهار' : 'Light mode') : (isRtl ? 'الوضع الداكن' : 'Dark mode')}
          onClick={toggleTheme}
          style={{ padding: '6px 9px', borderRadius: 8, fontSize: 15, lineHeight: 1 }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Avatar dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button onClick={() => setOpen(p => !p)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 10px 5px 6px',
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 9, cursor: 'pointer',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, #DE985A, #C97E43)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>A</div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>
              {isRtl ? 'المدير' : 'Admin'}
            </span>
            <span style={{ color: 'var(--text-faint)', fontSize: 9 }}>▼</span>
          </button>

          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)',
              [isRtl ? 'left' : 'right']: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, boxShadow: 'var(--shadow-md)',
              minWidth: 180, zIndex: 200, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                  {isRtl ? 'مدير المنصة' : 'Platform Admin'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 2 }}>0598262751</div>
              </div>
              <button onClick={logout} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', width: '100%',
                background: 'transparent', color: 'var(--red)',
                fontSize: 13, fontWeight: 600, borderRadius: 0,
                textAlign: 'start',
              }}>
                🚪 {isRtl ? 'تسجيل الخروج' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
