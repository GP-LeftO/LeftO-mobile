import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLang, useT } from '../context/LangContext';

const W_FULL = 240;
const W_ICON = 64;

export default function Sidebar({ collapsed, onToggle }) {
  const navigate       = useNavigate();
  const { lang, setLang } = useLang();
  const t              = useT();
  const isRtl          = lang === 'ar';
  const w              = collapsed ? W_ICON : W_FULL;

  const SECTIONS = [
    {
      key: 'main',
      label: isRtl ? 'الرئيسية' : 'MAIN',
      items: [
        { to: '/', label: t('dashboard'), icon: '📊', end: true },
      ],
    },
    {
      key: 'management',
      label: isRtl ? 'الإدارة' : 'MANAGEMENT',
      items: [
        { to: '/sellers',   label: t('sellers'),   icon: '🏪' },
        { to: '/charities', label: t('charities'), icon: '🤝' },
        { to: '/users',     label: t('users'),     icon: '👥' },
        { to: '/reports',   label: t('reports'),   icon: '🚩' },
      ],
    },
    {
      key: 'settings',
      label: isRtl ? 'الإعدادات' : 'SETTINGS',
      items: [
        { to: '/settings', label: t('settings'), icon: '⚙️' },
      ],
    },
  ];

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  return (
    <aside style={{
      width: w,
      background: 'var(--sidebar-bg)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, bottom: 0,
      right: isRtl ? 0 : 'auto',
      left:  isRtl ? 'auto' : 0,
      zIndex: 100,
      borderRight: isRtl ? 'none' : '1px solid rgba(255,255,255,0.06)',
      borderLeft:  isRtl ? '1px solid rgba(255,255,255,0.06)' : 'none',
      transition: 'width .2s ease',
      overflow: 'hidden',
    }}>

      {/* Logo row + collapse toggle */}
      <div style={{
        padding: collapsed ? '18px 0' : '18px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, #DE985A 0%, #C97E43 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🥡</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                LeftO
              </div>
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 1, whiteSpace: 'nowrap' }}>
                {t('adminPanel')}
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={onToggle} title={isRtl ? 'طي القائمة' : 'Collapse'} style={{
            background: 'rgba(255,255,255,0.06)', border: 'none', color: '#64748B',
            padding: '4px 8px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
            flexShrink: 0,
          }}>
            {isRtl ? '›' : '‹'}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: collapsed ? '8px 4px' : '8px 8px', overflowY: 'auto' }}>
        {SECTIONS.map(section => (
          <div key={section.key}>
            {!collapsed && (
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#475569',
                padding: '10px 10px 4px', letterSpacing: '0.08em',
                textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>
                {section.label}
              </div>
            )}
            {collapsed && <div style={{ height: 8 }} />}

            {section.items.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end ?? false}
                title={collapsed ? n.label : undefined}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center',
                  gap: collapsed ? 0 : 10,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '10px 0' : '8px 10px',
                  color: isActive ? '#F8FAFC' : '#94A3B8',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13,
                  borderRadius: 7,
                  marginBottom: 2,
                  background: isActive ? 'rgba(222,152,90,0.15)' : 'transparent',
                  transition: 'background .12s, color .12s',
                })}>
                {({ isActive }) => (
                  <>
                    <span style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: isActive ? 'rgba(222,152,90,0.25)' : 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14,
                    }}>
                      {n.icon}
                    </span>
                    {!collapsed && (
                      <>
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {n.label}
                        </span>
                        {isActive && (
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#DE985A', flexShrink: 0 }} />
                        )}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: collapsed ? '8px 4px' : '8px 8px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>

        {/* Expand button (collapsed mode only) */}
        {collapsed && (
          <button onClick={onToggle} title={isRtl ? 'توسيع القائمة' : 'Expand'} style={{
            width: '100%', padding: '8px 0', marginBottom: 6,
            background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94A3B8',
            borderRadius: 7, cursor: 'pointer', fontSize: 14,
          }}>
            {isRtl ? '‹' : '›'}
          </button>
        )}

        {/* Language toggle (expanded mode only) */}
        {!collapsed && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', padding: '0 2px 5px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isRtl ? 'اللغة' : 'Language'}
            </div>
            <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3 }}>
              {(['ar', 'en']).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{
                  flex: 1, padding: '5px 0', borderRadius: 6,
                  fontSize: 12, fontWeight: 700,
                  background: lang === l ? 'linear-gradient(135deg, #DE985A, #C97E43)' : 'transparent',
                  color: lang === l ? '#fff' : '#64748B',
                  transition: 'all .18s',
                }}>
                  {l === 'ar' ? 'العربية' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={logout}
          title={collapsed ? (isRtl ? 'تسجيل الخروج' : 'Logout') : undefined}
          style={{
            width: '100%',
            padding: collapsed ? '9px 0' : '8px 10px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
            color: '#F87171', borderRadius: 7, fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start', gap: 8,
          }}>
          🚪 {!collapsed && t('logout')}
        </button>
      </div>
    </aside>
  );
}
